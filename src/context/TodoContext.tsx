import React, { createContext, useContext, useEffect, useState } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useNotifications } from '../hooks/useNotifications';
import confetti from 'canvas-confetti';
import { getFirebaseInstance, saveFirebaseConfig, clearFirebaseConfig } from '../firebase';
import type { FirebaseConfig } from '../firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import type { User } from 'firebase/auth';
import { collection, doc, onSnapshot, setDoc, updateDoc, deleteDoc, writeBatch } from 'firebase/firestore';

export interface Task {
  id: string;
  title: string;
  notes: string;
  dueDate: string; 
  dueTime?: string; 
  priority: 'high' | 'medium' | 'low';
  category: string;
  isCompleted: boolean;
  isPinned: boolean;
  repeat: 'none' | 'daily' | 'weekly' | 'monthly';
  reminderOffset: number; 
  completedDate?: string; 
}

export interface Category {
  id: string;
  name: string;
  color: string; 
}

export interface Settings {
  theme: 'light' | 'dark';
  notificationsEnabled: boolean;
  defaultReminderOffset: number; 
}

type TabType = 'dashboard' | 'planner' | 'calendar' | 'statistics' | 'settings';
type SortType = 'dueDate' | 'priority' | 'status';

interface TodoContextType {
  tasks: Task[];
  categories: Category[];
  currentTab: TabType;
  searchQuery: string;
  sortBy: SortType;
  settings: Settings;
  streak: number;
  bestStreak: number;
  addTask: (task: Omit<Task, 'id' | 'isCompleted' | 'isPinned'>) => void;
  editTask: (id: string, updatedFields: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  toggleComplete: (id: string) => void;
  togglePin: (id: string) => void;
  addCategory: (name: string, color: string) => void;
  deleteCategory: (id: string) => void;
  clearCompleted: () => void;
  setCurrentTab: (tab: TabType) => void;
  setSearchQuery: (query: string) => void;
  setSortBy: (sort: SortType) => void;
  updateSettings: (settings: Partial<Settings>) => void;
  importTasks: (jsonStr: string) => boolean;
  exportTasks: () => string;
  isInstallable: boolean;
  installApp: () => void;
  
  // Firebase Auth & Cloud Sync
  user: User | null;
  isFirebaseConnected: boolean;
  firebaseConfig: FirebaseConfig | null;
  saveConfig: (config: FirebaseConfig) => boolean;
  clearConfig: () => void;
  logout: () => Promise<void>;
  mergeLocalTasks: () => Promise<void>;
  hasMergeableLocalTasks: boolean;
}

const TodoContext = createContext<TodoContextType | undefined>(undefined);

const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat-work', name: 'Work', color: '262, 83%, 58%' },      
  { id: 'cat-study', name: 'Study', color: '200, 95%, 48%' },     
  { id: 'cat-personal', name: 'Personal', color: '142, 70%, 45%' }, 
  { id: 'cat-shopping', name: 'Shopping', color: '35, 92%, 50%' },  
  { id: 'cat-health', name: 'Health', color: '325, 78%, 49%' },     
];

export const TodoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tasks, setTasks] = useLocalStorage<Task[]>('flowtodo_tasks', []);
  const [categories, setCategories] = useLocalStorage<Category[]>('flowtodo_categories', DEFAULT_CATEGORIES);
  const [settings, setSettings] = useLocalStorage<Settings>('flowtodo_settings', {
    theme: 'light',
    notificationsEnabled: true,
    defaultReminderOffset: 15,
  });

  const [currentTab, setCurrentTab] = useState<TabType>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortType>('dueDate');
  const [notifiedTaskIds, setNotifiedTaskIds] = useLocalStorage<string[]>('flowtodo_notified_ids', []);

  const [streak, setStreak] = useLocalStorage<number>('flowtodo_streak', 0);
  const [bestStreak, setBestStreak] = useLocalStorage<number>('flowtodo_best_streak', 0);

  const { sendNotification } = useNotifications();

  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  // Firebase auth & sync states
  const [user, setUser] = useState<User | null>(null);
  const [isFirebaseConnected, setIsFirebaseConnected] = useState(false);
  const [firebaseConfig, setFirebaseConfig] = useState<FirebaseConfig | null>(null);
  const [hasMergeableLocalTasks, setHasMergeableLocalTasks] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setIsInstallable(false);
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const installApp = () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then(() => {
      setDeferredPrompt(null);
      setIsInstallable(false);
    });
  };

  // Sync initial Firebase state
  useEffect(() => {
    const { isConfigured, config } = getFirebaseInstance();
    setIsFirebaseConnected(isConfigured);
    setFirebaseConfig(config);
  }, []);

  // Set up Firebase Auth listener
  useEffect(() => {
    const { auth } = getFirebaseInstance();
    if (!auth) {
      setUser(null);
      return;
    }

    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        // Logged in: Backup local storage tasks if any exist
        const currentLocalTasksStr = localStorage.getItem('flowtodo_tasks') || '[]';
        const currentLocalTasks = JSON.parse(currentLocalTasksStr);
        if (currentLocalTasks.length > 0) {
          if (!localStorage.getItem('flowtodo_local_tasks_backup')) {
            localStorage.setItem('flowtodo_local_tasks_backup', currentLocalTasksStr);
          }
          setHasMergeableLocalTasks(true);
        }

        const currentLocalCatsStr = localStorage.getItem('flowtodo_categories') || '[]';
        if (currentLocalCatsStr !== '[]' && !localStorage.getItem('flowtodo_local_categories_backup')) {
          localStorage.setItem('flowtodo_local_categories_backup', currentLocalCatsStr);
        }
      } else {
        // Logged out: Restore local sandbox backup if it exists
        const backupTasks = localStorage.getItem('flowtodo_local_tasks_backup');
        if (backupTasks) {
          setTasks(JSON.parse(backupTasks));
          localStorage.removeItem('flowtodo_local_tasks_backup');
        }
        const backupCats = localStorage.getItem('flowtodo_local_categories_backup');
        if (backupCats) {
          setCategories(JSON.parse(backupCats));
          localStorage.removeItem('flowtodo_local_categories_backup');
        }
        setHasMergeableLocalTasks(false);
      }
    });

    return () => unsubscribeAuth();
  }, [isFirebaseConnected]);

  // Set up Real-time Firestore Sync Listeners
  useEffect(() => {
    const { db } = getFirebaseInstance();
    if (!user || !db) return;

    // Listen to Tasks
    const tasksRef = collection(db, 'users', user.uid, 'tasks');
    const unsubscribeTasks = onSnapshot(tasksRef, (snapshot) => {
      const firestoreTasks: Task[] = [];
      snapshot.forEach((doc) => {
        firestoreTasks.push(doc.data() as Task);
      });
      setTasks(firestoreTasks);
    }, (error) => {
      console.error("Firestore tasks snapshot error:", error);
    });

    // Listen to Categories
    const categoriesRef = collection(db, 'users', user.uid, 'categories');
    const unsubscribeCategories = onSnapshot(categoriesRef, (snapshot) => {
      const firestoreCategories: Category[] = [];
      snapshot.forEach((doc) => {
        firestoreCategories.push(doc.data() as Category);
      });
      if (firestoreCategories.length === 0) {
        setCategories(DEFAULT_CATEGORIES);
      } else {
        setCategories(firestoreCategories);
      }
    }, (error) => {
      console.error("Firestore categories snapshot error:", error);
    });

    // Listen to Settings
    const settingsRef = doc(db, 'users', user.uid, 'settings', 'config');
    const unsubscribeSettings = onSnapshot(settingsRef, (docSnap) => {
      if (docSnap.exists()) {
        setSettings(docSnap.data() as Settings);
      }
    }, (error) => {
      console.error("Firestore settings snapshot error:", error);
    });

    // Listen to Streak / Profile
    const profileRef = doc(db, 'users', user.uid, 'profile', 'streak');
    const unsubscribeProfile = onSnapshot(profileRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.streak !== undefined) setStreak(data.streak);
        if (data.bestStreak !== undefined) setBestStreak(data.bestStreak);
      }
    }, (error) => {
      console.error("Firestore profile snapshot error:", error);
    });

    return () => {
      unsubscribeTasks();
      unsubscribeCategories();
      unsubscribeSettings();
      unsubscribeProfile();
    };
  }, [user, isFirebaseConnected]);

  // Handle Firebase Config Save/Clear Actions
  const saveConfig = (config: FirebaseConfig): boolean => {
    const success = saveFirebaseConfig(config);
    setIsFirebaseConnected(success);
    setFirebaseConfig(success ? config : null);
    return success;
  };

  const clearConfig = () => {
    clearFirebaseConfig();
    setIsFirebaseConnected(false);
    setFirebaseConfig(null);
    setUser(null);
  };

  const logout = async () => {
    const { auth } = getFirebaseInstance();
    if (auth) {
      await signOut(auth);
    }
  };

  const mergeLocalTasks = async () => {
    const { db } = getFirebaseInstance();
    if (!user || !db) return;

    try {
      const batch = writeBatch(db);
      
      const backupTasksStr = localStorage.getItem('flowtodo_local_tasks_backup') || '[]';
      const backupTasks: Task[] = JSON.parse(backupTasksStr);
      
      const backupCatsStr = localStorage.getItem('flowtodo_local_categories_backup') || '[]';
      const backupCats: Category[] = JSON.parse(backupCatsStr);

      backupTasks.forEach((task) => {
        const taskDoc = doc(db, 'users', user.uid, 'tasks', task.id);
        batch.set(taskDoc, task);
      });

      backupCats.forEach((cat) => {
        const catDoc = doc(db, 'users', user.uid, 'categories', cat.id);
        batch.set(catDoc, cat);
      });

      const settingsDoc = doc(db, 'users', user.uid, 'settings', 'config');
      batch.set(settingsDoc, settings);

      await batch.commit();

      localStorage.removeItem('flowtodo_local_tasks_backup');
      localStorage.removeItem('flowtodo_local_categories_backup');
      setHasMergeableLocalTasks(false);
    } catch (e) {
      console.error('Failed to merge local tasks:', e);
      alert('Failed to merge tasks. Please try again.');
    }
  };

  useEffect(() => {
    const root = window.document.documentElement;
    if (settings.theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [settings.theme]);

  useEffect(() => {
    calculateStreaks();
  }, [tasks]);

  useEffect(() => {
    if (!settings.notificationsEnabled) return;

    const checkReminders = () => {
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];

      tasks.forEach((task) => {
        if (task.isCompleted || task.reminderOffset === -1 || notifiedTaskIds.includes(task.id)) return;
        if (task.dueDate !== todayStr || !task.dueTime) return;

        const [hours, minutes] = task.dueTime.split(':').map(Number);
        const taskTime = new Date();
        taskTime.setHours(hours, minutes, 0, 0);

        const reminderTime = new Date(taskTime.getTime() - task.reminderOffset * 60 * 1000);

        if (now >= reminderTime && now < taskTime) {
          sendNotification(`Reminder: ${task.title}`, {
            body: `Due in ${task.reminderOffset} minutes [${task.category}]`,
            tag: task.id,
          });
          setNotifiedTaskIds((prev) => [...prev, task.id]);
        }
      });
    };

    const interval = setInterval(checkReminders, 10000);
    return () => clearInterval(interval);
  }, [tasks, settings.notificationsEnabled, notifiedTaskIds]);

  useEffect(() => {
    if (!settings.notificationsEnabled) return;
    
    const overdueTasks = tasks.filter(t => {
      if (t.isCompleted) return false;
      const todayStr = new Date().toISOString().split('T')[0];
      return t.dueDate < todayStr && !notifiedTaskIds.includes(`overdue-${t.id}`);
    });

    if (overdueTasks.length > 0) {
      const count = overdueTasks.length;
      sendNotification(`${count} Overdue Task${count > 1 ? 's' : ''}!`, {
        body: `You have pending items from previous days that need your attention.`,
        tag: 'overdue-alert',
      });
      
      setNotifiedTaskIds(prev => [
        ...prev,
        ...overdueTasks.map(t => `overdue-${t.id}`)
      ]);
    }
  }, [tasks, settings.notificationsEnabled]);

  const calculateStreaks = () => {
    const completedDates = tasks
      .filter((t) => t.isCompleted && t.completedDate)
      .map((t) => t.completedDate as string);

    if (completedDates.length === 0) {
      updateStreaks(0, bestStreak);
      return;
    }

    const uniqueDates = Array.from(new Set(completedDates)).sort();

    const todayStr = new Date().toISOString().split('T')[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const hasCompletedToday = uniqueDates.includes(todayStr);
    const hasCompletedYesterday = uniqueDates.includes(yesterdayStr);

    if (!hasCompletedToday && !hasCompletedYesterday) {
      updateStreaks(0, bestStreak);
      return;
    }

    let current = 0;
    let trackDate = hasCompletedToday ? new Date() : yesterday;

    while (true) {
      const trackDateStr = trackDate.toISOString().split('T')[0];
      if (uniqueDates.includes(trackDateStr)) {
        current++;
        trackDate.setDate(trackDate.getDate() - 1);
      } else {
        break;
      }
    }

    const newBest = current > bestStreak ? current : bestStreak;
    updateStreaks(current, newBest);
  };

  const updateStreaks = async (newStreak: number, newBestStreak: number) => {
    const { db } = getFirebaseInstance();
    if (user && db) {
      if (newStreak !== streak || newBestStreak !== bestStreak) {
        try {
          await setDoc(doc(db, 'users', user.uid, 'profile', 'streak'), {
            streak: newStreak,
            bestStreak: newBestStreak,
          });
        } catch (e) {
          console.error("Firestore updateStreaks error:", e);
        }
      }
    } else {
      setStreak(newStreak);
      if (newStreak > bestStreak) {
        setBestStreak(newStreak);
      }
    }
  };

  const addTask = async (taskInput: Omit<Task, 'id' | 'isCompleted' | 'isPinned'>) => {
    const { db } = getFirebaseInstance();
    const newTask: Task = {
      ...taskInput,
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      isCompleted: false,
      isPinned: false,
    };

    if (user && db) {
      try {
        await setDoc(doc(db, 'users', user.uid, 'tasks', newTask.id), newTask);
      } catch (e) {
        console.error("Firestore addTask error:", e);
      }
    } else {
      setTasks((prev) => [...prev, newTask]);
    }

    if (settings.notificationsEnabled) {
      sendNotification(`Task Added: ${newTask.title}`, {
        body: `Scheduled for ${newTask.dueDate} ${newTask.dueTime || ''}`,
        tag: 'task-added',
      });
    }
  };

  const editTask = async (id: string, updatedFields: Partial<Task>) => {
    const { db } = getFirebaseInstance();
    
    if (updatedFields.dueDate || updatedFields.dueTime || updatedFields.reminderOffset) {
      setNotifiedTaskIds((notified) => notified.filter((nId) => nId !== id && nId !== `overdue-${id}`));
    }

    if (user && db) {
      try {
        const taskRef = doc(db, 'users', user.uid, 'tasks', id);
        await updateDoc(taskRef, updatedFields);
      } catch (e) {
        console.error("Firestore editTask error:", e);
      }
    } else {
      setTasks((prev) =>
        prev.map((task) => {
          if (task.id === id) {
            return { ...task, ...updatedFields };
          }
          return task;
        })
      );
    }
  };

  const deleteTask = async (id: string) => {
    const { db } = getFirebaseInstance();
    setNotifiedTaskIds((notified) => notified.filter((nId) => nId !== id && nId !== `overdue-${id}`));

    if (user && db) {
      try {
        await deleteDoc(doc(db, 'users', user.uid, 'tasks', id));
      } catch (e) {
        console.error("Firestore deleteTask error:", e);
      }
    } else {
      setTasks((prev) => prev.filter((task) => task.id !== id));
    }
  };

  const toggleComplete = async (id: string) => {
    const { db } = getFirebaseInstance();
    const todayStr = new Date().toISOString().split('T')[0];
    const task = tasks.find((t) => t.id === id);
    if (!task) return;

    const nextCompletedState = !task.isCompleted;
    const completedDate = nextCompletedState ? todayStr : undefined;

    if (nextCompletedState && task.repeat !== 'none') {
      setTimeout(() => spawnRecurringTask(task), 600);
    }

    if (user && db) {
      try {
        await updateDoc(doc(db, 'users', user.uid, 'tasks', id), {
          isCompleted: nextCompletedState,
          completedDate: completedDate || null,
        });
      } catch (e) {
        console.error("Firestore toggleComplete error:", e);
      }
    } else {
      setTasks((prev) => {
        return prev.map((t) => {
          if (t.id === id) {
            return {
              ...t,
              isCompleted: nextCompletedState,
              completedDate: nextCompletedState ? todayStr : undefined,
            };
          }
          return t;
        });
      });
    }

    const todayTasks = tasks.map(t => t.id === id ? { ...t, isCompleted: nextCompletedState } : t).filter(t => t.dueDate === todayStr);
    const completedToday = todayTasks.filter(t => t.isCompleted);
    
    if (todayTasks.length > 0 && completedToday.length === todayTasks.length && nextCompletedState) {
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#6366f1', '#a855f7', '#3b82f6', '#10b981'],
      });
    }
  };

  const spawnRecurringTask = (task: Task) => {
    const nextDate = new Date(task.dueDate);
    if (task.repeat === 'daily') {
      nextDate.setDate(nextDate.getDate() + 1);
    } else if (task.repeat === 'weekly') {
      nextDate.setDate(nextDate.getDate() + 7);
    } else if (task.repeat === 'monthly') {
      nextDate.setMonth(nextDate.getMonth() + 1);
    }

    const nextDateStr = nextDate.toISOString().split('T')[0];

    const exists = tasks.some(t => t.title === task.title && t.dueDate === nextDateStr);
    if (!exists) {
      addTask({
        title: task.title,
        notes: task.notes,
        dueDate: nextDateStr,
        dueTime: task.dueTime,
        priority: task.priority,
        category: task.category,
        repeat: task.repeat,
        reminderOffset: task.reminderOffset,
      });
    }
  };

  const togglePin = async (id: string) => {
    const { db } = getFirebaseInstance();
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    if (user && db) {
      try {
        await updateDoc(doc(db, 'users', user.uid, 'tasks', id), {
          isPinned: !task.isPinned
        });
      } catch (e) {
        console.error("Firestore togglePin error:", e);
      }
    } else {
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, isPinned: !t.isPinned } : t))
      );
    }
  };

  const addCategory = async (name: string, color: string) => {
    const { db } = getFirebaseInstance();
    const newCat: Category = {
      id: `cat-${Date.now()}`,
      name,
      color,
    };

    if (user && db) {
      try {
        await setDoc(doc(db, 'users', user.uid, 'categories', newCat.id), newCat);
      } catch (e) {
        console.error("Firestore addCategory error:", e);
      }
    } else {
      setCategories((prev) => [...prev, newCat]);
    }
  };

  const deleteCategory = async (id: string) => {
    const { db } = getFirebaseInstance();
    if (user && db) {
      try {
        await deleteDoc(doc(db, 'users', user.uid, 'categories', id));
      } catch (e) {
        console.error("Firestore deleteCategory error:", e);
      }
    } else {
      setCategories((prev) => prev.filter((c) => c.id !== id));
    }
  };

  const clearCompleted = async () => {
    const { db } = getFirebaseInstance();
    if (user && db) {
      try {
        const batch = writeBatch(db);
        const completedTasks = tasks.filter(t => t.isCompleted);
        completedTasks.forEach(t => {
          batch.delete(doc(db, 'users', user.uid, 'tasks', t.id));
        });
        await batch.commit();
      } catch (e) {
        console.error("Firestore clearCompleted error:", e);
      }
    } else {
      setTasks((prev) => prev.filter((task) => !task.isCompleted));
    }
  };

  const updateSettings = async (updated: Partial<Settings>) => {
    const { db } = getFirebaseInstance();
    const newSettings = { ...settings, ...updated };

    if (user && db) {
      try {
        await setDoc(doc(db, 'users', user.uid, 'settings', 'config'), newSettings);
      } catch (e) {
        console.error("Firestore updateSettings error:", e);
      }
    } else {
      setSettings(newSettings);
    }
  };

  const exportTasks = (): string => {
    return JSON.stringify({ tasks, categories, settings }, null, 2);
  };

  const importTasks = (jsonStr: string): boolean => {
    try {
      const data = JSON.parse(jsonStr);
      if (Array.isArray(data.tasks)) {
        setTasks(data.tasks);
      }
      if (Array.isArray(data.categories)) {
        setCategories(data.categories);
      }
      if (data.settings) {
        setSettings((prev) => ({ ...prev, ...data.settings }));
      }
      return true;
    } catch (e) {
      console.error('Failed to import backup file:', e);
      return false;
    }
  };

  return (
    <TodoContext.Provider
      value={{
        tasks,
        categories,
        currentTab,
        searchQuery,
        sortBy,
        settings,
        streak,
        bestStreak,
        addTask,
        editTask,
        deleteTask,
        toggleComplete,
        togglePin,
        addCategory,
        deleteCategory,
        clearCompleted,
        setCurrentTab,
        setSearchQuery,
        setSortBy,
        updateSettings,
        importTasks,
        exportTasks,
        isInstallable,
        installApp,
        user,
        isFirebaseConnected,
        firebaseConfig,
        saveConfig,
        clearConfig,
        logout,
        mergeLocalTasks,
        hasMergeableLocalTasks,
      }}
    >
      {children}
    </TodoContext.Provider>
  );
};

export const useTodo = () => {
  const context = useContext(TodoContext);
  if (!context) {
    throw new Error('useTodo must be used within a TodoProvider');
  }
  return context;
};
