import React, { createContext, useContext, useEffect, useState } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useNotifications } from '../hooks/useNotifications';
import confetti from 'canvas-confetti';

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
      setStreak(0);
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
      setStreak(0);
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

    setStreak(current);
    if (current > bestStreak) {
      setBestStreak(current);
    }
  };

  const addTask = (taskInput: Omit<Task, 'id' | 'isCompleted' | 'isPinned'>) => {
    const newTask: Task = {
      ...taskInput,
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      isCompleted: false,
      isPinned: false,
    };
    setTasks((prev) => [...prev, newTask]);

    if (settings.notificationsEnabled) {
      
      sendNotification(`Task Added: ${newTask.title}`, {
        body: `Scheduled for ${newTask.dueDate} ${newTask.dueTime || ''}`,
        tag: 'task-added',
      });
    }
  };

  const editTask = (id: string, updatedFields: Partial<Task>) => {
    setTasks((prev) =>
      prev.map((task) => {
        if (task.id === id) {
          
          if (updatedFields.dueDate || updatedFields.dueTime || updatedFields.reminderOffset) {
            setNotifiedTaskIds((notified) => notified.filter((nId) => nId !== id && nId !== `overdue-${id}`));
          }
          return { ...task, ...updatedFields };
        }
        return task;
      })
    );
  };

  const deleteTask = (id: string) => {
    setTasks((prev) => prev.filter((task) => task.id !== id));
    setNotifiedTaskIds((notified) => notified.filter((nId) => nId !== id && nId !== `overdue-${id}`));
  };

  const toggleComplete = (id: string) => {
    const todayStr = new Date().toISOString().split('T')[0];
    let isFullyCompleted = false;

    setTasks((prev) => {
      const updated = prev.map((task) => {
        if (task.id === id) {
          const nextCompletedState = !task.isCompleted;

          if (nextCompletedState && task.repeat !== 'none') {
            setTimeout(() => spawnRecurringTask(task), 600);
          }

          return {
            ...task,
            isCompleted: nextCompletedState,
            completedDate: nextCompletedState ? todayStr : undefined,
          };
        }
        return task;
      });

      const todayTasks = updated.filter(t => t.dueDate === todayStr);
      const completedToday = todayTasks.filter(t => t.isCompleted);
      
      if (todayTasks.length > 0 && completedToday.length === todayTasks.length) {
        isFullyCompleted = true;
      }

      return updated;
    });

    if (isFullyCompleted) {
      
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

  const togglePin = (id: string) => {
    setTasks((prev) =>
      prev.map((task) => (task.id === id ? { ...task, isPinned: !task.isPinned } : task))
    );
  };

  const addCategory = (name: string, color: string) => {
    const newCat: Category = {
      id: `cat-${Date.now()}`,
      name,
      color,
    };
    setCategories((prev) => [...prev, newCat]);
  };

  const deleteCategory = (id: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== id));
  };

  const clearCompleted = () => {
    setTasks((prev) => prev.filter((task) => !task.isCompleted));
  };

  const updateSettings = (updated: Partial<Settings>) => {
    setSettings((prev) => ({ ...prev, ...updated }));
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
