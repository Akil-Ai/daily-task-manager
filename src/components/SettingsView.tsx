import React, { useRef } from 'react';
import { useTodo } from '../context/TodoContext';
import { useNotifications } from '../hooks/useNotifications';
import { Moon, Sun, Bell, Download, Upload, Trash2, Sparkles } from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { settings, updateSettings, clearCompleted, exportTasks, importTasks, isInstallable, installApp } = useTodo();
  const { requestPermission, permission } = useNotifications();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleTheme = () => {
    updateSettings({ theme: settings.theme === 'light' ? 'dark' : 'light' });
  };

  const handleNotificationToggle = async () => {
    if (!settings.notificationsEnabled) {
      const granted = await requestPermission();
      if (granted) {
        updateSettings({ notificationsEnabled: true });
      }
    } else {
      updateSettings({ notificationsEnabled: false });
    }
  };

  const handleExport = () => {
    try {
      const dataStr = exportTasks();
      const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', 'flowtodo-backup.json');
      linkElement.click();
    } catch (e) {
      console.error('Export failed:', e);
      alert('Failed to export backup data.');
    }
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], 'UTF-8');
      fileReader.onload = (event) => {
        const target = event.target;
        if (target && typeof target.result === 'string') {
          const success = importTasks(target.result);
          if (success) {
            alert('Settings and tasks imported successfully!');
          } else {
            alert('Invalid backup file formatting.');
          }
        }
      };
    }
  };

  const handleClearCompleted = () => {
    if (window.confirm('Are you sure you want to delete all completed tasks? This cannot be undone.')) {
      clearCompleted();
    }
  };

  return (
    <div className="pb-24 animate-fade-in">
      <h1 className="text-xl font-black text-slate-800 dark:text-zinc-50 mb-5 tracking-tight">
        Settings
      </h1>

      {}
      <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/80 rounded-3xl p-5 shadow-sm flex flex-col gap-6">
        
        {}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800/60 text-slate-600 dark:text-zinc-400">
              {settings.theme === 'light' ? <Sun size={18} /> : <Moon size={18} />}
            </div>
            <div>
              <span className="text-sm font-bold text-slate-800 dark:text-zinc-200 block leading-tight">Dark Mode</span>
              <span className="text-[10px] font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-wide block mt-0.5">
                Adjust display theme
              </span>
            </div>
          </div>
          <button
            onClick={toggleTheme}
            className={`w-12 h-6 rounded-full p-0.5 transition-colors duration-200 focus:outline-none ${
              settings.theme === 'dark' ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-zinc-800'
            }`}
          >
            <div
              className={`w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
                settings.theme === 'dark' ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        <hr className="border-slate-100 dark:border-zinc-800/80" />

        {}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800/60 text-slate-600 dark:text-zinc-400">
              <Bell size={18} />
            </div>
            <div>
              <span className="text-sm font-bold text-slate-800 dark:text-zinc-200 block leading-tight">Local Notifications</span>
              <span className="text-[10px] font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-wide block mt-0.5">
                {permission === 'denied' ? 'Blocked in system' : 'Reminders and alerts'}
              </span>
            </div>
          </div>
          <button
            onClick={handleNotificationToggle}
            className={`w-12 h-6 rounded-full p-0.5 transition-colors duration-200 focus:outline-none ${
              settings.notificationsEnabled && permission !== 'denied'
                ? 'bg-indigo-600'
                : 'bg-slate-200 dark:bg-zinc-800'
            }`}
            disabled={permission === 'denied'}
          >
            <div
              className={`w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
                settings.notificationsEnabled && permission !== 'denied' ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        <hr className="border-slate-100 dark:border-zinc-800/80" />

        {}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800/60 text-slate-600 dark:text-zinc-400">
              <Bell size={18} className="text-indigo-500" />
            </div>
            <div>
              <span className="text-sm font-bold text-slate-800 dark:text-zinc-200 block leading-tight">Default Reminder</span>
              <span className="text-[10px] font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-wide block mt-0.5">
                Pre-alarm notification trigger
              </span>
            </div>
          </div>
          <select
            value={settings.defaultReminderOffset}
            onChange={(e) => updateSettings({ defaultReminderOffset: Number(e.target.value) })}
            className="text-xs font-bold text-slate-700 dark:text-zinc-300 bg-slate-50 dark:bg-zinc-800 border border-slate-100 dark:border-zinc-700/80 px-2.5 py-1.5 rounded-xl outline-none"
          >
            <option value="-1">No reminders</option>
            <option value="0">At due time</option>
            <option value="5">5 min before</option>
            <option value="15">15 min before</option>
            <option value="30">30 min before</option>
            <option value="60">1 hour before</option>
          </select>
        </div>
      </div>

      {}
      <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 mt-6 mb-3">
        Backup & Maintenance
      </h2>
      
      <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/80 rounded-3xl p-5 shadow-sm flex flex-col gap-4">
        {isInstallable && (
          <button
            onClick={installApp}
            className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/20 dark:hover:bg-indigo-950/35 border border-indigo-100/50 dark:border-indigo-900/30 text-indigo-600 dark:text-indigo-400 transition-colors duration-150 text-left font-bold"
          >
            <div className="flex items-center gap-3">
              <Download size={18} className="text-indigo-500" />
              <span className="text-xs">Install Application</span>
            </div>
          </button>
        )}
        
        {}
        <button
          onClick={handleExport}
          className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-slate-50 hover:bg-slate-100 dark:bg-zinc-800/40 dark:hover:bg-zinc-800/70 border border-slate-100 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 transition-colors duration-150 text-left font-bold"
        >
          <div className="flex items-center gap-3">
            <Download size={18} className="text-indigo-500" />
            <span className="text-xs">Backup to File (JSON)</span>
          </div>
        </button>

        {}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-slate-50 hover:bg-slate-100 dark:bg-zinc-800/40 dark:hover:bg-zinc-800/70 border border-slate-100 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 transition-colors duration-150 text-left font-bold"
        >
          <div className="flex items-center gap-3">
            <Upload size={18} className="text-emerald-500" />
            <span className="text-xs">Restore from Backup</span>
          </div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImport}
            accept=".json"
            className="hidden"
          />
        </button>

        {}
        <button
          onClick={handleClearCompleted}
          className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-rose-50 hover:bg-rose-100/80 dark:bg-rose-950/15 dark:hover:bg-rose-950/30 border border-rose-100/50 dark:border-rose-900/20 text-rose-600 dark:text-rose-400 transition-colors duration-150 text-left font-bold"
        >
          <div className="flex items-center gap-3">
            <Trash2 size={18} />
            <span className="text-xs">Clear Completed Tasks</span>
          </div>
        </button>
      </div>

      <div className="mt-8 text-center flex flex-col items-center justify-center text-slate-400 dark:text-zinc-500 gap-1 select-none">
        <span className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5">
          FlowTodo WebApp <Sparkles size={11} className="text-indigo-500" />
        </span>
        <span className="text-[9px] font-medium opacity-80">
          Standalone PWA Edition v1.0.0
        </span>
      </div>
    </div>
  );
};
