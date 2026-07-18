import React, { useState } from 'react';
import { useTodo } from '../context/TodoContext';
import type { Task } from '../context/TodoContext';
import { getTodayDateString } from '../utils/dateUtils';
import { Flame, CheckCircle2, ListTodo, AlertTriangle, Plus, Sparkles } from 'lucide-react';
import { TaskCard } from './TaskCard';
import { VoiceInput } from './VoiceInput';

interface DashboardViewProps {
  onOpenAddSheet: () => void;
  onEditClick: (task: Task) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onOpenAddSheet, onEditClick }) => {
  const { tasks, streak, bestStreak, addTask, isInstallable, installApp } = useTodo();
  const [quickTitle, setQuickTitle] = useState('');

  const todayStr = new Date().toISOString().split('T')[0];

  const todayTasks = tasks.filter((t) => t.dueDate === todayStr);
  const completedToday = todayTasks.filter((t) => t.isCompleted).length;

  const overdueTasks = tasks.filter((t) => !t.isCompleted && t.dueDate < todayStr);

  const completionPercentage = todayTasks.length > 0
    ? Math.round((completedToday / todayTasks.length) * 100)
    : 0;

  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeOffset = circumference - (completionPercentage / 100) * circumference;

  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;

    addTask({
      title: quickTitle,
      notes: '',
      dueDate: todayStr,
      priority: 'medium',
      category: 'Personal',
      repeat: 'none',
      reminderOffset: 15,
    });
    setQuickTitle('');
  };

  const handleVoiceTranscript = (text: string) => {
    setQuickTitle(text);
  };

  return (
    <div className="pb-24 animate-fade-in">
      {}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
            {getTodayDateString()}
          </span>
          <h1 className="text-2xl font-black text-slate-800 dark:text-zinc-50 tracking-tight flex items-center gap-1.5 mt-0.5">
            FlowTodo <Sparkles size={20} className="text-indigo-500" />
          </h1>
        </div>
        {}
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-2xl shadow-sm">
          <Flame size={18} className="fill-current" />
          <span className="text-sm font-bold">{streak} d</span>
        </div>
      </div>

      {isInstallable && (
        <div className="mb-6 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white p-4.5 rounded-3xl flex items-center justify-between shadow-md shadow-indigo-500/10 gap-3">
          <div>
            <h4 className="text-sm font-black leading-tight">Install FlowTodo App</h4>
            <p className="text-[10px] text-indigo-100 mt-1 font-semibold leading-normal">
              Download to your home screen for rapid offline access and custom reminders.
            </p>
          </div>
          <button
            onClick={installApp}
            className="px-4 py-2 bg-white text-indigo-600 font-extrabold text-xs rounded-xl flex-shrink-0 shadow active:scale-95 transition-transform"
          >
            Install
          </button>
        </div>
      )}

      {}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {}
        <div className="bg-white dark:bg-zinc-900 rounded-3xl p-5 border border-slate-100 dark:border-zinc-800/80 shadow-sm flex items-center gap-5">
          <div className="relative w-24 h-24 flex items-center justify-center flex-shrink-0">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="48"
                cy="48"
                r={radius}
                className="stroke-slate-100 dark:stroke-zinc-800"
                strokeWidth="7"
                fill="transparent"
              />
              <circle
                cx="48"
                cy="48"
                r={radius}
                className="stroke-indigo-500 transition-all duration-500"
                strokeWidth="7"
                fill="transparent"
                strokeDasharray={circumference}
                strokeDashoffset={strokeOffset}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-lg font-black text-slate-800 dark:text-zinc-50 leading-none">
                {completionPercentage}%
              </span>
              <span className="text-[9px] text-slate-400 dark:text-zinc-500 font-semibold uppercase tracking-wider mt-0.5">
                Done
              </span>
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-[16px] font-black text-slate-800 dark:text-zinc-100 mb-1 leading-tight">Today's Progress</h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed font-medium">
              {completedToday} of {todayTasks.length} tasks completed.
            </p>
            {completionPercentage === 100 && todayTasks.length > 0 && (
              <span className="inline-block mt-2 text-[10px] font-extrabold uppercase bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-md tracking-wider">
                All daily tasks done!
              </span>
            )}
          </div>
        </div>

        {}
        <div className="bg-white dark:bg-zinc-900 rounded-3xl p-5 border border-slate-100 dark:border-zinc-800/80 shadow-sm grid grid-cols-2 gap-4">
          <div className="flex flex-col justify-between">
            <div className="flex items-center gap-1.5 text-slate-500 dark:text-zinc-400">
              <CheckCircle2 size={16} className="text-indigo-500" />
              <span className="text-xs font-bold uppercase tracking-wide">Tasks</span>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-black text-slate-800 dark:text-zinc-100 block leading-none">
                {tasks.filter(t => !t.isCompleted).length}
              </span>
              <span className="text-[10px] font-medium text-slate-400 dark:text-zinc-500 uppercase tracking-wide">Pending total</span>
            </div>
          </div>
          <div className="flex flex-col justify-between border-l border-slate-100 dark:border-zinc-800/80 pl-4">
            <div className="flex items-center gap-1.5 text-slate-500 dark:text-zinc-400">
              <Flame size={16} className="text-orange-500" />
              <span className="text-xs font-bold uppercase tracking-wide">Record</span>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-black text-slate-800 dark:text-zinc-100 block leading-none">
                {bestStreak} d
              </span>
              <span className="text-[10px] font-medium text-slate-400 dark:text-zinc-500 uppercase tracking-wide">Best streak</span>
            </div>
          </div>
        </div>
      </div>

      {}
      {overdueTasks.length > 0 && (
        <div className="mb-6 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 p-4 rounded-2xl flex items-start gap-3">
          <AlertTriangle className="text-rose-500 mt-0.5 flex-shrink-0 animate-bounce" size={20} />
          <div>
            <h4 className="text-sm font-bold text-rose-800 dark:text-rose-400 leading-tight">
              You have {overdueTasks.length} overdue task{overdueTasks.length > 1 ? 's' : ''}!
            </h4>
            <p className="text-xs text-rose-600/80 dark:text-rose-400/70 mt-1 font-medium leading-relaxed">
              These tasks are pending from previous dates. Please reschedule or mark them complete.
            </p>
          </div>
        </div>
      )}

      {}
      <div className="mb-6">
        <h2 className="text-[17px] font-black text-slate-800 dark:text-zinc-100 mb-3.5 tracking-tight flex items-center gap-1.5">
          <ListTodo size={18} className="text-indigo-500" />
          Today's Schedule
        </h2>

        {todayTasks.length === 0 ? (
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-8 border border-slate-100 dark:border-zinc-800/80 shadow-sm flex flex-col items-center justify-center text-center">
            <CheckCircle2 size={40} className="text-slate-300 dark:text-zinc-700 mb-3" />
            <p className="text-sm font-bold text-slate-700 dark:text-zinc-300">Your agenda is clear today!</p>
            <p className="text-xs text-slate-400 dark:text-zinc-500 mt-1 font-medium">Add a task below to get started.</p>
          </div>
        ) : (
          <div className="flex flex-col">
            {todayTasks
              .sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0)) 
              .map((task) => (
                <TaskCard key={task.id} task={task} onEditClick={onEditClick} />
              ))}
          </div>
        )}
      </div>

      {}
      <form onSubmit={handleQuickAdd} className="bg-white dark:bg-zinc-900 rounded-2xl p-2.5 border border-slate-100 dark:border-zinc-800/80 shadow-sm flex items-center gap-2">
        <input
          type="text"
          value={quickTitle}
          onChange={(e) => setQuickTitle(e.target.value)}
          placeholder="Quick add task for Today..."
          className="flex-1 bg-transparent px-3 py-1 text-sm font-medium text-slate-800 dark:text-zinc-100 outline-none placeholder:text-slate-400 dark:placeholder:text-zinc-500"
        />
        <VoiceInput onTranscript={handleVoiceTranscript} />
        <button
          type="submit"
          disabled={!quickTitle.trim()}
          className={`p-2.5 rounded-full transition-all duration-200 active:scale-90 ${
            quickTitle.trim()
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25'
              : 'bg-slate-100 dark:bg-zinc-800 text-slate-400 dark:text-zinc-600'
          }`}
        >
          <Plus size={16} />
        </button>
      </form>

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
