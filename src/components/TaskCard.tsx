import React, { useState } from 'react';
import { useTodo } from '../context/TodoContext';
import type { Task } from '../context/TodoContext';
import { Swipeable } from './Swipeable';
import { Calendar, Clock, Pin, Edit3, Trash2, Repeat, ChevronDown, ChevronUp } from 'lucide-react';
import { isOverdue, formatDateString } from '../utils/dateUtils';

interface TaskCardProps {
  task: Task;
  onEditClick: (task: Task) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, onEditClick }) => {
  const { toggleComplete, togglePin, deleteTask, categories } = useTodo();
  const [isExpanded, setIsExpanded] = useState(false);

  const categoryObj = categories.find((c) => c.name === task.category);
  const categoryColor = categoryObj ? categoryObj.color : '220, 14%, 60%'; 

  const priorityConfig = {
    high: { border: 'border-l-[6px] border-l-rose-500', text: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-950/20' },
    medium: { border: 'border-l-[6px] border-l-amber-500', text: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/20' },
    low: { border: 'border-l-[6px] border-l-indigo-500', text: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-950/20' },
  };

  const currentPriority = priorityConfig[task.priority];
  const overdue = isOverdue(task.dueDate, task.isCompleted);

  return (
    <div className="w-full mb-3.5 px-0.5">
      <Swipeable
        onSwipeRight={() => toggleComplete(task.id)}
        onSwipeLeft={() => deleteTask(task.id)}
      >
        <div
          className={`w-full bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-slate-100 dark:border-zinc-800/80 transition-all duration-200 ${
            currentPriority.border
          } ${task.isCompleted ? 'opacity-65' : ''}`}
        >
          {}
          <div className="p-4 flex items-start justify-between gap-3">
            {}
            <div className="flex items-center mt-1">
              <button
                onClick={() => toggleComplete(task.id)}
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 active:scale-75 ${
                  task.isCompleted
                    ? 'bg-indigo-600 border-indigo-600 text-white'
                    : 'border-slate-300 dark:border-zinc-600 hover:border-indigo-400'
                }`}
              >
                {task.isCompleted && (
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                    <path d="M7.629 14.571L3.357 10.3a.999.999 0 0 1 1.414-1.414l2.857 2.857 6.643-6.643a.999.999 0 1 1 1.414 1.414L7.629 14.571z" />
                  </svg>
                )}
              </button>
            </div>

            {}
            <div className="flex-1 min-w-0" onClick={() => setIsExpanded(!isExpanded)}>
              <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                {}
                <span
                  style={{
                    backgroundColor: `rgba(${categoryColor}, 0.15)`,
                    color: `rgb(${categoryColor})`,
                  }}
                  className="px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide uppercase"
                >
                  {task.category}
                </span>

                {}
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${currentPriority.bg} ${currentPriority.text}`}
                >
                  {task.priority}
                </span>

                {}
                {task.repeat !== 'none' && (
                  <span className="flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400">
                    <Repeat size={10} />
                    <span className="capitalize">{task.repeat}</span>
                  </span>
                )}

                {}
                {overdue && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold tracking-wider bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 animate-pulse">
                    Overdue
                  </span>
                )}
              </div>

              {}
              <h3
                className={`text-[15px] font-bold text-slate-800 dark:text-zinc-100 break-words pr-1 leading-snug transition-all ${
                  task.isCompleted ? 'line-through text-slate-400 dark:text-zinc-500' : ''
                }`}
              >
                {task.title}
              </h3>

              {}
              <div className="flex items-center gap-3.5 mt-2 text-xs text-slate-500 dark:text-zinc-400">
                <span className={`flex items-center gap-1 font-medium ${overdue ? 'text-rose-600 dark:text-rose-400 font-bold' : ''}`}>
                  <Calendar size={13} />
                  {formatDateString(task.dueDate)}
                </span>
                {task.dueTime && (
                  <span className="flex items-center gap-1 font-medium">
                    <Clock size={13} />
                    {task.dueTime}
                  </span>
                )}
              </div>
            </div>

            {}
            <div className="flex items-center gap-1">
              {}
              <button
                onClick={() => togglePin(task.id)}
                className={`p-1.5 rounded-lg transition-colors duration-150 ${
                  task.isPinned
                    ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/20'
                    : 'text-slate-300 dark:text-zinc-600 hover:text-slate-400'
                }`}
              >
                <Pin size={16} fill={task.isPinned ? 'currentColor' : 'none'} />
              </button>

              {}
              {task.notes && (
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="p-1.5 rounded-lg text-slate-400 dark:text-zinc-500 transition-colors"
                >
                  {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
              )}
            </div>
          </div>

          {}
          {isExpanded && (
            <div className="px-4 pb-4 pt-1 border-t border-slate-50 dark:border-zinc-800/50 flex flex-col gap-3 animate-fade-in">
              {task.notes && (
                <p className="text-xs text-slate-600 dark:text-zinc-400 break-words leading-relaxed whitespace-pre-wrap">
                  {task.notes}
                </p>
              )}
              <div className="flex items-center justify-end gap-2 mt-1">
                <button
                  onClick={() => onEditClick(task)}
                  className="flex items-center gap-1 px-3 py-1.5 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/20 rounded-xl transition-all active:scale-95"
                >
                  <Edit3 size={12} />
                  Edit Task
                </button>
                <button
                  onClick={() => deleteTask(task.id)}
                  className="flex items-center gap-1 px-3 py-1.5 text-[11px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/20 rounded-xl transition-all active:scale-95"
                >
                  <Trash2 size={12} />
                  Delete
                </button>
              </div>
            </div>
          )}
        </div>
      </Swipeable>
    </div>
  );
};
