import React, { createContext, useContext, useEffect, useState } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useNotifications } from '../hooks/useNotifications';
import confetti from 'canvas-confetti';
import { supabase, isSupabaseEnabled } from '../lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

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

// DB row → app shape
const rowToTask = (row: any): Task => ({
  id: row.id,
  title: row.title,
  notes: row.notes ?? '',
  dueDate: row.due_date,
  dueTime: row.due_time ?? undefined,
  priority: row.priority,
  category: row.category,
  isCompleted: row.is_completed,
  isPinned: row.is_pinned,
  repeat: row.repeat,
  reminderOffset: row.reminder_offset,
  completedDate: row.completed_date ?? undefined,
});

const taskToRow = (task: Task, userId: string) => ({
  id: task.id,
  user_id: userId,
  title: task.title,
  notes: task.notes,
  due_date: task.dueDate,
  due_time: task.dueTime ?? null,
  priority: task.priority,
  category: task.category,
  is_completed: task.isCompleted,
  is_pinned: task.isPinned,
  repeat: task.repeat,
  reminder_offset: task.reminderOffset,
  completed_date: task.completedDate ?? null,
});

const rowToCategory = (row: any): Category => ({
  id: row.id,
  name: row.name,
  color: row.color,
});

const rowToSettings = (row: any): Partial<Settings> => ({
  theme: row.theme,
  notificationsEnabled: row.notifications_enabled,
  defaultReminderOffset: row.default_reminder_offset,
});

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
  user: User | null;
  session: Session | null;
  logout: () => Promise<void>;
}

const TodoContext = createContext<TodoContextType | undefined>(undefined);

const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat-work', name: 'Work', color: '262, 83%, 58%' },
  { id: 'cat-study', name: 'Study', color: '200, 95%, 48%' },
  { id: 'cat-personal', name: 'Personal', color: '142, 70%, 45%' },
  { id: 'cat-shopping', name: 'Shopping', color: '35, 92%, 50%' },
  { id: 'cat-health', name: 'Health', color: '325, 78%, 49%' },
];

const DEFAULT_SETTINGS: Settings = {
  theme: 'light',
  notificationsEnabled: true,
  defaultReminderOffset: 15,
};

export const TodoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tasks, setTasks] = useLocalStorage<Task[]>('flowtodo_tasks', []);
  const [categories, setCategories] = useLocalStorage<Category[]>('flowtodo_categories', DEFAULT_CATEGORIES);
  const [settings, setSettings] = useLocalStorage<Settings>('flowtodo_settings', DEFAULT_SETTINGS);
  const [streak, setStreak] = useLocalStorage<number>('flowtodo_streak', 0);
  const [bestStreak, setBestStreak] = useLocalStorage<number>('flowtodo_best_streak', 0);
  const [notifiedTaskIds, setNotifiedTaskIds] = useLocalStorage<string[]>('flowtodo_notified_ids', []);

  const [currentTab, setCurrentTab] = useState<TabType>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortType>('dueDate');

  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);

  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  const { sendNotification } = useNotifications();

  // --- PWA install prompt ---
  useEffect(() => {
    const onPrompt = (e: Event) => { e.preventDefault(); setDeferredPrompt(e); setIsInstallable(true); };
    const onInstalled = () => { setDeferredPrompt(null); setIsInstallable(false); };
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => { window.removeEventListener('beforeinstallprompt', onPrompt); window.removeEventListener('appinstalled', onInstalled); };
  }, []);

  const installApp = () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then(() => { setDeferredPrompt(null); setIsInstallable(false); });
  };

  // --- Theme ---
  useEffect(() => {
    const root = window.document.documentElement;
    settings.theme === 'dark' ? root.classList.add('dark') : root.classList.remove('dark');
  }, [settings.theme]);

  // --- Auth session ---
  useEffect(() => {
    if (!isSupabaseEnabled || !supabase) return;

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // --- Load data from Supabase when user logs in ---
  useEffect(() => {
    if (!user || !supabase) return;
    const sb = supabase;

    const loadAll = async () => {
      // Tasks
      const { data: taskRows } = await sb.from('tasks').select('*').eq('user_id', user.id);
      if (taskRows) setTasks(taskRows.map(rowToTask));

      // Categories
      const { data: catRows } = await sb.from('categories').select('*').eq('user_id', user.id);
      if (catRows && catRows.length > 0) setCategories(catRows.map(rowToCategory));
      else {
        const defaults = DEFAULT_CATEGORIES.map(c => ({ ...c, user_id: user.id }));
        await sb.from('categories').upsert(defaults);
        setCategories(DEFAULT_CATEGORIES);
      }

      // Settings
      const { data: settingsRow } = await sb.from('user_settings').select('*').eq('user_id', user.id).single();
      if (settingsRow) {
        setSettings(prev => ({ ...prev, ...rowToSettings(settingsRow) }));
        setStreak(settingsRow.streak ?? 0);
        setBestStreak(settingsRow.best_streak ?? 0);
      } else {
        await sb.from('user_settings').insert({ user_id: user.id, theme: 'light', notifications_enabled: true, default_reminder_offset: 15, streak: 0, best_streak: 0 });
      }
    };

    loadAll();
  }, [user]);

  // --- Streaks ---
  useEffect(() => {
    const completedDates = tasks
      .filter(t => t.isCompleted && t.completedDate)
      .map(t => t.completedDate as string);

    if (completedDates.length === 0) { saveStreak(0, bestStreak); return; }

    const uniqueDates = Array.from(new Set(completedDates)).sort();
    const todayStr = new Date().toISOString().split('T')[0];
    const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (!uniqueDates.includes(todayStr) && !uniqueDates.includes(yesterdayStr)) { saveStreak(0, bestStreak); return; }

    let current = 0;
    let trackDate = uniqueDates.includes(todayStr) ? new Date() : yesterday;
    while (true) {
      const str = trackDate.toISOString().split('T')[0];
      if (uniqueDates.includes(str)) { current++; trackDate.setDate(trackDate.getDate() - 1); }
      else break;
    }

    const newBest = current > bestStreak ? current : bestStreak;
    saveStreak(current, newBest);
  }, [tasks]);

  const saveStreak = async (s: number, b: number) => {
    setStreak(s);
    if (b > bestStreak) setBestStreak(b);
    if (user && supabase) {
      try {
        await supabase.from('user_settings').update({ streak: s, best_streak: b }).eq('user_id', user.id);
      } catch (error) {
        console.error('Failed to sync streak to Supabase:', error);
      }
    }
  };

  // --- Notifications ---
  useEffect(() => {
    if (!settings.notificationsEnabled) return;
    const checkReminders = () => {
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];
      tasks.forEach(task => {
        if (task.isCompleted || task.reminderOffset === -1 || notifiedTaskIds.includes(task.id)) return;
        if (task.dueDate !== todayStr || !task.dueTime) return;
        const [h, m] = task.dueTime.split(':').map(Number);
        const taskTime = new Date(); taskTime.setHours(h, m, 0, 0);
        const reminderTime = new Date(taskTime.getTime() - task.reminderOffset * 60000);
        if (now >= reminderTime && now < taskTime) {
          sendNotification(`Reminder: ${task.title}`, { body: `Due in ${task.reminderOffset} min`, tag: task.id });
          setNotifiedTaskIds(prev => [...prev, task.id]);
        }
      });
    };
    const interval = setInterval(checkReminders, 10000);
    return () => clearInterval(interval);
  }, [tasks, settings.notificationsEnabled, notifiedTaskIds, sendNotification]);

  // --- CRUD: Tasks ---
  const addTask = async (taskInput: Omit<Task, 'id' | 'isCompleted' | 'isPinned'>) => {
    const newTask: Task = {
      ...taskInput,
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      isCompleted: false,
      isPinned: false,
    };
    setTasks(prev => [...prev, newTask]);
    if (user && supabase) {
      try {
        await supabase.from('tasks').insert(taskToRow(newTask, user.id));
      } catch (error) {
        console.error('Failed to add task to Supabase:', error);
      }
    }
    if (settings.notificationsEnabled) {
      sendNotification(`Task Added: ${newTask.title}`, { body: `Scheduled for ${newTask.dueDate}`, tag: 'task-added' });
    }
  };

  const editTask = async (id: string, updatedFields: Partial<Task>) => {
    if (updatedFields.dueDate || updatedFields.dueTime || updatedFields.reminderOffset !== undefined) {
      setNotifiedTaskIds(prev => prev.filter(nId => nId !== id && nId !== `overdue-${id}`));
    }
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updatedFields } : t));
    if (user && supabase) {
      const dbFields: Record<string, any> = {};
      if (updatedFields.title !== undefined) dbFields.title = updatedFields.title;
      if (updatedFields.notes !== undefined) dbFields.notes = updatedFields.notes;
      if (updatedFields.dueDate !== undefined) dbFields.due_date = updatedFields.dueDate;
      if (updatedFields.dueTime !== undefined) dbFields.due_time = updatedFields.dueTime ?? null;
      if (updatedFields.priority !== undefined) dbFields.priority = updatedFields.priority;
      if (updatedFields.category !== undefined) dbFields.category = updatedFields.category;
      if (updatedFields.isCompleted !== undefined) dbFields.is_completed = updatedFields.isCompleted;
      if (updatedFields.isPinned !== undefined) dbFields.is_pinned = updatedFields.isPinned;
      if (updatedFields.repeat !== undefined) dbFields.repeat = updatedFields.repeat;
      if (updatedFields.reminderOffset !== undefined) dbFields.reminder_offset = updatedFields.reminderOffset;
      if (updatedFields.completedDate !== undefined) dbFields.completed_date = updatedFields.completedDate ?? null;
      try {
        await supabase.from('tasks').update(dbFields).eq('id', id).eq('user_id', user.id);
      } catch (error) {
        console.error('Failed to edit task in Supabase:', error);
      }
    }
  };

  const deleteTask = async (id: string) => {
    setNotifiedTaskIds(prev => prev.filter(nId => nId !== id && nId !== `overdue-${id}`));
    setTasks(prev => prev.filter(t => t.id !== id));
    if (user && supabase) {
      try {
        await supabase.from('tasks').delete().eq('id', id).eq('user_id', user.id);
      } catch (error) {
        console.error('Failed to delete task from Supabase:', error);
      }
    }
  };

  const toggleComplete = async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    const todayStr = new Date().toISOString().split('T')[0];
    const nextCompleted = !task.isCompleted;
    const completedDate = nextCompleted ? todayStr : undefined;

    if (nextCompleted && task.repeat !== 'none') {
      setTimeout(() => spawnRecurringTask(task), 600);
    }

    await editTask(id, { isCompleted: nextCompleted, completedDate });

    const todayTasks = tasks.map(t => t.id === id ? { ...t, isCompleted: nextCompleted } : t).filter(t => t.dueDate === todayStr);
    if (todayTasks.length > 0 && todayTasks.every(t => t.isCompleted) && nextCompleted) {
      confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 }, colors: ['#6366f1', '#a855f7', '#3b82f6', '#10b981'] });
    }
  };

  const spawnRecurringTask = (task: Task) => {
    const nextDate = new Date(task.dueDate);
    if (task.repeat === 'daily') nextDate.setDate(nextDate.getDate() + 1);
    else if (task.repeat === 'weekly') nextDate.setDate(nextDate.getDate() + 7);
    else if (task.repeat === 'monthly') nextDate.setMonth(nextDate.getMonth() + 1);
    const nextDateStr = nextDate.toISOString().split('T')[0];
    if (!tasks.some(t => t.title === task.title && t.dueDate === nextDateStr)) {
      addTask({ title: task.title, notes: task.notes, dueDate: nextDateStr, dueTime: task.dueTime, priority: task.priority, category: task.category, repeat: task.repeat, reminderOffset: task.reminderOffset });
    }
  };

  const togglePin = (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    editTask(id, { isPinned: !task.isPinned });
  };

  // --- CRUD: Categories ---
  const addCategory = async (name: string, color: string) => {
    const newCat: Category = { id: `cat-${Date.now()}`, name, color };
    setCategories(prev => [...prev, newCat]);
    if (user && supabase) {
      try {
        await supabase.from('categories').insert({ ...newCat, user_id: user.id });
      } catch (error) {
        console.error('Failed to add category to Supabase:', error);
      }
    }
  };

  const deleteCategory = async (id: string) => {
    setCategories(prev => prev.filter(c => c.id !== id));
    if (user && supabase) {
      try {
        await supabase.from('categories').delete().eq('id', id).eq('user_id', user.id);
      } catch (error) {
        console.error('Failed to delete category from Supabase:', error);
      }
    }
  };

  const clearCompleted = async () => {
    const ids = tasks.filter(t => t.isCompleted).map(t => t.id);
    setTasks(prev => prev.filter(t => !t.isCompleted));
    if (user && supabase) {
      if (ids.length > 0) {
        try {
          await supabase.from('tasks').delete().in('id', ids).eq('user_id', user.id);
        } catch (error) {
          console.error('Failed to clear completed tasks from Supabase:', error);
        }
      }
    }
  };

  // --- Settings ---
  const updateSettings = async (updated: Partial<Settings>) => {
    const newSettings = { ...settings, ...updated };
    setSettings(newSettings);
    if (user && supabase) {
      try {
        await supabase.from('user_settings').update({
          theme: newSettings.theme,
          notifications_enabled: newSettings.notificationsEnabled,
          default_reminder_offset: newSettings.defaultReminderOffset,
        }).eq('user_id', user.id);
      } catch (error) {
        console.error('Failed to update settings in Supabase:', error);
      }
    }
  };

  // --- Backup/Restore ---
  const exportTasks = () => JSON.stringify({ tasks, categories, settings }, null, 2);

  const importTasks = (jsonStr: string): boolean => {
    try {
      const data = JSON.parse(jsonStr);
      if (Array.isArray(data.tasks)) setTasks(data.tasks);
      if (Array.isArray(data.categories)) setCategories(data.categories);
      if (data.settings) setSettings(prev => ({ ...prev, ...data.settings }));
      return true;
    } catch { return false; }
  };

  // --- Auth ---
  const logout = async () => {
    if (supabase) await supabase.auth.signOut();
  };

  return (
    <TodoContext.Provider value={{
      tasks, categories, currentTab, searchQuery, sortBy, settings, streak, bestStreak,
      addTask, editTask, deleteTask, toggleComplete, togglePin, addCategory, deleteCategory,
      clearCompleted, setCurrentTab, setSearchQuery, setSortBy, updateSettings,
      importTasks, exportTasks, isInstallable, installApp, user, session, logout,
    }}>
      {children}
    </TodoContext.Provider>
  );
};

export const useTodo = () => {
  const context = useContext(TodoContext);
  if (!context) throw new Error('useTodo must be used within a TodoProvider');
  return context;
};
