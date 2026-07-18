import React, { useRef, useState } from 'react';
import { useTodo } from '../context/TodoContext';
import { useNotifications } from '../hooks/useNotifications';
import { 
  Moon, Sun, Bell, Download, Upload, Trash2, Sparkles,
  CloudOff, LogOut, User, UserCheck, KeyRound,
  ChevronDown, ChevronUp, Info, CheckCircle2, RefreshCw, AlertCircle
} from 'lucide-react';
import { AuthModal } from './AuthModal';

export const SettingsView: React.FC = () => {
  const { 
    settings, updateSettings, clearCompleted, exportTasks, importTasks, isInstallable, installApp,
    user, isFirebaseConnected, firebaseConfig, saveConfig, clearConfig, logout, mergeLocalTasks, hasMergeableLocalTasks
  } = useTodo();
  const { requestPermission, permission } = useNotifications();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [showConfigPanel, setShowConfigPanel] = useState(false);
  const [rawConfig, setRawConfig] = useState('');
  const [configError, setConfigError] = useState<string | null>(null);
  const [isMerging, setIsMerging] = useState(false);

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

  const handleSaveConfig = () => {
    setConfigError(null);
    const cleaned = rawConfig.trim();
    if (!cleaned) {
      setConfigError('Please enter a Firebase configuration block.');
      return;
    }

    let parsed: any = null;
    
    // First try direct JSON parsing
    try {
      parsed = JSON.parse(cleaned);
    } catch (e) {
      // Regex extraction fallback for copy-pasted JS config blocks
      const fields = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];
      const config: Record<string, string> = {};
      
      fields.forEach(field => {
        const regex = new RegExp(`${field}\\s*:\\s*['"\`]([^'"\`]+)['"\`]`);
        const match = cleaned.match(regex);
        if (match && match[1]) {
          config[field] = match[1].trim();
        }
      });
      
      if (config.apiKey && config.projectId) {
        parsed = config;
      }
    }

    if (!parsed || !parsed.apiKey || !parsed.projectId) {
      setConfigError('Could not parse config. Make sure you copy-pasted the complete firebaseConfig object (with apiKey and projectId).');
      return;
    }

    const success = saveConfig(parsed);
    if (success) {
      setRawConfig('');
      setShowConfigPanel(false);
    } else {
      setConfigError('Failed to initialize Firebase with the provided credentials.');
    }
  };

  const handleMerge = async () => {
    setIsMerging(true);
    try {
      await mergeLocalTasks();
    } finally {
      setIsMerging(false);
    }
  };

  return (
    <div className="pb-24 animate-fade-in">
      <h1 className="text-xl font-black text-slate-800 dark:text-zinc-50 mb-5 tracking-tight">
        Settings
      </h1>

      {/* Main preferences */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/80 rounded-3xl p-5 shadow-sm flex flex-col gap-6">
        
        {/* Theme select */}
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

        {/* Notifications toggle */}
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

        {/* Reminder offset */}
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

      {/* Cloud sync & Account Connection */}
      <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 mt-6 mb-3">
        Cloud Sync & Account
      </h2>

      <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/80 rounded-3xl p-5 shadow-sm flex flex-col gap-4">
        {!isFirebaseConnected ? (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800/60 text-slate-400">
                <CloudOff size={18} />
              </div>
              <div>
                <span className="text-sm font-bold text-slate-800 dark:text-zinc-200 block leading-tight">Cloud Sync Offline</span>
                <span className="text-[10px] font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-wide block mt-0.5">
                  Set up Firebase to enable multi-device sync
                </span>
              </div>
            </div>
            
            <button
              onClick={() => setShowConfigPanel(!showConfigPanel)}
              className="w-full mt-1 flex items-center justify-between px-4 py-3 rounded-2xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/20 dark:hover:bg-indigo-950/35 border border-indigo-100/50 dark:border-indigo-900/30 text-indigo-600 dark:text-indigo-400 transition-colors duration-150 text-left font-bold"
            >
              <span className="text-xs">Connect Firebase Cloud DB</span>
              {showConfigPanel ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${user ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500' : 'bg-indigo-50 dark:bg-indigo-950/20 text-indigo-500'}`}>
                  {user ? <UserCheck size={18} /> : <User size={18} />}
                </div>
                <div>
                  <span className="text-sm font-bold text-slate-800 dark:text-zinc-200 block leading-tight">
                    {user ? 'Account Synced' : 'Firebase Ready'}
                  </span>
                  <span className="text-[10px] font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-wide block mt-0.5">
                    {user ? `Logged in as ${user.email}` : 'Please log in to start syncing'}
                  </span>
                </div>
              </div>
              {user && (
                <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded-full border border-emerald-100/50 dark:border-emerald-900/20">
                  <CheckCircle2 size={10} /> Online
                </span>
              )}
            </div>

            {hasMergeableLocalTasks && user && (
              <div className="p-3.5 mt-1 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/30 text-amber-800 dark:text-amber-300 text-xs flex flex-col gap-2">
                <span className="font-bold flex items-center gap-1.5">
                  <Info size={15} /> Local Tasks Found
                </span>
                <p className="leading-relaxed">
                  You have tasks stored offline on this device. Click below to merge them into your account.
                </p>
                <button
                  onClick={handleMerge}
                  disabled={isMerging}
                  className="mt-1 self-start flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold transition-all disabled:opacity-50 text-[10px] uppercase tracking-wider"
                >
                  {isMerging ? <RefreshCw size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                  Merge Tasks
                </button>
              </div>
            )}

            <div className="flex gap-2.5 mt-2">
              {!user ? (
                <button
                  onClick={() => setIsAuthOpen(true)}
                  className="flex-grow flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white transition-colors text-xs font-bold uppercase tracking-wider"
                >
                  <UserCheck size={16} /> Sign In / Register
                </button>
              ) : (
                <button
                  onClick={logout}
                  className="flex-grow flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-slate-50 hover:bg-slate-100 dark:bg-zinc-800/40 dark:hover:bg-zinc-800/70 border border-slate-100 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 transition-colors text-xs font-bold uppercase tracking-wider"
                >
                  <LogOut size={16} /> Sign Out
                </button>
              )}

              <button
                onClick={() => setShowConfigPanel(!showConfigPanel)}
                className="p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100 dark:bg-zinc-800/40 dark:hover:bg-zinc-800/70 border border-slate-100 dark:border-zinc-800 text-slate-500 dark:text-zinc-400 transition-colors"
                title="Firebase Connection Properties"
              >
                <KeyRound size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Database setup console (collapsible) */}
        {showConfigPanel && (
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-800/60 flex flex-col gap-3 mt-1 text-xs">
            <span className="font-bold text-slate-800 dark:text-zinc-200">Firebase SDK Configuration</span>
            {isFirebaseConnected && firebaseConfig ? (
              <div className="flex flex-col gap-2">
                <div className="p-2.5 bg-white dark:bg-zinc-900 rounded-xl border border-slate-100 dark:border-zinc-800/80 font-mono text-[10px] text-slate-500 dark:text-zinc-400">
                  <div className="flex justify-between border-b border-slate-50 dark:border-zinc-800/40 pb-1 mb-1">
                    <span>Project:</span>
                    <span className="font-semibold text-slate-800 dark:text-zinc-200">{firebaseConfig.projectId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Auth Domain:</span>
                    <span>{firebaseConfig.authDomain || 'None'}</span>
                  </div>
                </div>
                <button
                  onClick={clearConfig}
                  className="w-full py-2 border border-rose-100/50 hover:bg-rose-50 dark:border-rose-900/20 dark:hover:bg-rose-950/10 text-rose-500 font-bold rounded-xl transition-all uppercase tracking-wider text-[10px]"
                >
                  Disconnect Project
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <p className="text-slate-500 dark:text-zinc-400 leading-relaxed text-[11px]">
                  PWA data uses real-time sync via Firebase. Go to your <strong>Firebase Console &gt; Project Settings &gt; Web App</strong>, copy the <code className="bg-slate-200/60 dark:bg-zinc-800 px-1 py-0.5 rounded font-mono">firebaseConfig</code> block, and paste it below:
                </p>
                
                {configError && (
                  <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 text-rose-500 text-[11px] font-semibold flex items-center gap-1.5">
                    <AlertCircle size={14} /> {configError}
                  </div>
                )}

                <textarea
                  placeholder={`const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "...",
  projectId: "...",
  // ...
};`}
                  rows={6}
                  value={rawConfig}
                  onChange={(e) => setRawConfig(e.target.value)}
                  className="w-full bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-xl p-3 font-mono text-[10px] text-slate-700 dark:text-zinc-300 placeholder-slate-400 dark:placeholder-zinc-600 focus:border-indigo-500 outline-none resize-none transition-colors"
                />

                <button
                  onClick={handleSaveConfig}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors uppercase tracking-wider text-[10px]"
                >
                  Initialize database connection
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Backup & Maintenance */}
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
        
        <button
          onClick={handleExport}
          className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-slate-50 hover:bg-slate-100 dark:bg-zinc-800/40 dark:hover:bg-zinc-800/70 border border-slate-100 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 transition-colors duration-150 text-left font-bold"
        >
          <div className="flex items-center gap-3">
            <Download size={18} className="text-indigo-500" />
            <span className="text-xs">Backup to File (JSON)</span>
          </div>
        </button>

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

      {/* Authentication Bottom Sheet Modal */}
      <AuthModal 
        isOpen={isAuthOpen} 
        onClose={() => setIsAuthOpen(false)} 
      />
    </div>
  );
};
