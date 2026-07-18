import React, { useState } from 'react';
import { useTodo } from '../context/TodoContext';
import type { Task } from '../context/TodoContext';
import { TaskCard } from './TaskCard';
import { isToday, isTomorrow, isUpcoming } from '../utils/dateUtils';
import { Search, SlidersHorizontal, Plus, ClipboardList } from 'lucide-react';

interface PlannerViewProps {
  onOpenAddSheet: () => void;
  onEditClick: (task: Task) => void;
}

type PlannerTab = 'today' | 'tomorrow' | 'upcoming';

export const PlannerView: React.FC<PlannerViewProps> = ({ onOpenAddSheet, onEditClick }) => {
  const { tasks, searchQuery, setSearchQuery, sortBy, setSortBy } = useTodo();
  const [activeTab, setActiveTab] = useState<PlannerTab>('today');
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  const todayStr = new Date().toISOString().split('T')[0];

  const filteredTasks = tasks.filter((task) => {
    
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          task.notes.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;

    if (activeTab === 'today') {
      
      return isToday(task.dueDate) || (task.dueDate < todayStr && !task.isCompleted);
    } else if (activeTab === 'tomorrow') {
      return isTomorrow(task.dueDate);
    } else if (activeTab === 'upcoming') {
      return isUpcoming(task.dueDate);
    }
    return false;
  });

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;

    if (sortBy === 'dueDate') {
      return a.dueDate.localeCompare(b.dueDate) || (a.dueTime || '').localeCompare(b.dueTime || '');
    }

    if (sortBy === 'priority') {
      const priorityWeights = { high: 3, medium: 2, low: 1 };
      return priorityWeights[b.priority] - priorityWeights[a.priority];
    }

    if (sortBy === 'status') {
      
      if (a.isCompleted && !b.isCompleted) return 1;
      if (!a.isCompleted && b.isCompleted) return -1;
      return 0;
    }

    return 0;
  });

  const sortOptions = [
    { value: 'dueDate', label: 'Due Date' },
    { value: 'priority', label: 'Priority' },
    { value: 'status', label: 'Completion' },
  ] as const;

  return (
    <div className="pb-24 animate-fade-in">
      {}
      <div className="flex gap-2.5 mb-5 items-center">
        <div className="flex-1 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/80 rounded-2xl px-3.5 py-2.5 flex items-center gap-2.5 shadow-sm">
          <Search size={16} className="text-slate-400 dark:text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tasks..."
            className="bg-transparent text-sm w-full outline-none text-slate-800 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 font-medium"
          />
        </div>

        {}
        <div className="relative">
          <button
            onClick={() => setShowSortDropdown(!showSortDropdown)}
            className={`p-3 rounded-2xl border transition-colors shadow-sm active:scale-95 flex items-center justify-center ${
              showSortDropdown
                ? 'bg-indigo-600 border-indigo-600 text-white shadow-indigo-500/25'
                : 'bg-white dark:bg-zinc-900 border-slate-100 dark:border-zinc-800/80 text-slate-600 dark:text-zinc-400'
            }`}
            title="Sort tasks"
          >
            <SlidersHorizontal size={16} />
          </button>

          {}
          {showSortDropdown && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowSortDropdown(false)} />
              <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 shadow-xl rounded-2xl z-50 py-2 animate-scale-in">
                <span className="block px-4 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 mb-1">
                  Sort By
                </span>
                {sortOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      setSortBy(opt.value);
                      setShowSortDropdown(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-xs font-semibold flex items-center justify-between ${
                      sortBy === opt.value
                        ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/20'
                        : 'text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800/40'
                    }`}
                  >
                    {opt.label}
                    {sortBy === opt.value && <div className="w-1.5 h-1.5 bg-indigo-600 dark:bg-indigo-400 rounded-full" />}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {}
      <div className="bg-slate-100/80 dark:bg-zinc-900/80 border border-slate-200/20 dark:border-zinc-800/40 rounded-2xl p-1 flex mb-6">
        {(['today', 'tomorrow', 'upcoming'] as const).map((tab) => {
          const isActive = activeTab === tab;
          const label = tab.charAt(0).toUpperCase() + tab.slice(1);
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 text-center py-2.5 rounded-xl text-xs font-bold transition-all ${
                isActive
                  ? 'bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-500 dark:text-zinc-400'
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {}
      <div className="flex flex-col">
        {sortedTasks.length === 0 ? (
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-12 border border-slate-100 dark:border-zinc-800/80 shadow-sm flex flex-col items-center justify-center text-center">
            <ClipboardList size={42} className="text-slate-300 dark:text-zinc-700 mb-3" />
            <p className="text-sm font-bold text-slate-700 dark:text-zinc-300">No tasks found</p>
            <p className="text-xs text-slate-400 dark:text-zinc-500 mt-1 font-medium max-w-[200px]">
              {searchQuery ? 'Try modifying your search query' : `You have no tasks scheduled under ${activeTab}`}
            </p>
          </div>
        ) : (
          sortedTasks.map((task) => (
            <TaskCard key={task.id} task={task} onEditClick={onEditClick} />
          ))
        )}
      </div>

      {}
      <button
        onClick={onOpenAddSheet}
        className="fixed bottom-20 right-6 z-30 p-4 rounded-full bg-indigo-600 text-white shadow-xl shadow-indigo-600/30 border border-indigo-500 active:scale-90 transform duration-200"
        aria-label="Add new task"
      >
        <Plus size={24} />
      </button>
    </div>
  );
};
