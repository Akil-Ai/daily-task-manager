import React from 'react';
import { useTodo } from '../context/TodoContext';
import { LayoutDashboard, ListTodo, Calendar, BarChart3, Settings } from 'lucide-react';

export const BottomNav: React.FC = () => {
  const { currentTab, setCurrentTab } = useTodo();

  const navItems = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { id: 'planner', label: 'Planner', icon: ListTodo },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'statistics', label: 'Stats', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ] as const;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-lg border-t border-slate-200/50 dark:border-zinc-800/50 safe-bottom">
      <div className="flex justify-around items-center h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className="relative flex flex-col items-center justify-center w-16 h-12 rounded-xl transition-all duration-300 overflow-hidden active:scale-95 group"
            >
              {}
              <div
                className={`absolute inset-x-2 top-0.5 bottom-5 rounded-full bg-indigo-100 dark:bg-indigo-950/50 transition-all duration-300 transform origin-center ${
                  isActive ? 'scale-100 opacity-100' : 'scale-50 opacity-0'
                }`}
              />
              
              {}
              <Icon
                size={20}
                className={`relative z-10 transition-all duration-300 ${
                  isActive
                    ? 'text-indigo-600 dark:text-indigo-400 translate-y-0.5 scale-110'
                    : 'text-slate-400 dark:text-zinc-500 group-hover:text-slate-600 dark:group-hover:text-zinc-400'
                }`}
              />

              {}
              <span
                className={`relative z-10 text-[10px] font-medium tracking-wide mt-1 transition-colors duration-300 ${
                  isActive
                    ? 'text-indigo-600 dark:text-indigo-400 font-semibold'
                    : 'text-slate-400 dark:text-zinc-500'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
