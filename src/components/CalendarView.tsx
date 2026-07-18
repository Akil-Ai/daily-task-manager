import React, { useState } from 'react';
import { useTodo } from '../context/TodoContext';
import type { Task } from '../context/TodoContext';
import { getDaysInMonth, formatDateString } from '../utils/dateUtils';
import { TaskCard } from './TaskCard';
import { ChevronLeft, ChevronRight, CalendarDays, Plus } from 'lucide-react';

interface CalendarViewProps {
  onOpenAddSheet: () => void;
  onEditClick: (task: Task) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ onOpenAddSheet, onEditClick }) => {
  const { tasks } = useTodo();
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });
  
  const [currentYear, setCurrentYear] = useState(() => new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(() => new Date().getMonth()); 

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const days = getDaysInMonth(currentYear, currentMonth);
  const startDayIndex = new Date(currentYear, currentMonth, 1).getDay();

  const blanks = Array(startDayIndex).fill(null);

  const calendarCells = [...blanks, ...days];

  const getLocalDateString = (date: Date): string => {
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - offset * 60 * 1000);
    return localDate.toISOString().split('T')[0];
  };

  const todayStr = new Date().toISOString().split('T')[0];

  const selectedDateTasks = tasks.filter((task) => task.dueDate === selectedDate);

  return (
    <div className="pb-24 animate-fade-in">
      {}
      <div className="flex items-center justify-between mb-4 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/80 rounded-2xl px-4 py-3 shadow-sm">
        <h2 className="text-[16px] font-black text-slate-800 dark:text-zinc-100">
          {monthNames[currentMonth]} {currentYear}
        </h2>
        <div className="flex items-center gap-1.5">
          <button
            onClick={prevMonth}
            className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-zinc-800/60 active:scale-95 transition-transform"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={nextMonth}
            className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-zinc-800/60 active:scale-95 transition-transform"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {}
      <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/80 rounded-3xl p-4 shadow-sm mb-6">
        {}
        <div className="grid grid-cols-7 gap-1 text-center mb-2.5">
          {weekdays.map((day) => (
            <span key={day} className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
              {day}
            </span>
          ))}
        </div>

        {}
        <div className="grid grid-cols-7 gap-1">
          {calendarCells.map((cell, idx) => {
            if (cell === null) {
              return <div key={`blank-${idx}`} className="aspect-square" />;
            }

            const cellDateStr = getLocalDateString(cell);
            const isTodayCell = cellDateStr === todayStr;
            const isSelectedCell = cellDateStr === selectedDate;

            const cellTasks = tasks.filter((t) => t.dueDate === cellDateStr);
            const pendingCellTasks = cellTasks.filter((t) => !t.isCompleted);
            const completedCellTasks = cellTasks.filter((t) => t.isCompleted);

            return (
              <button
                key={cellDateStr}
                onClick={() => setSelectedDate(cellDateStr)}
                className={`relative aspect-square flex flex-col items-center justify-between py-1.5 rounded-2xl transition-all ${
                  isSelectedCell
                    ? 'bg-indigo-600 text-white font-extrabold shadow-md shadow-indigo-500/25 scale-105 z-10'
                    : isTodayCell
                    ? 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 font-bold border border-indigo-200/50 dark:border-indigo-900/30'
                    : 'text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800/40'
                }`}
              >
                <span className="text-xs">{cell.getDate()}</span>

                {}
                <div className="flex items-center justify-center gap-0.5 h-1.5 w-full mt-0.5">
                  {}
                  {pendingCellTasks.length > 0 && (
                    <span
                      className={`w-1 h-1 rounded-full ${
                        isSelectedCell ? 'bg-white' : 'bg-rose-500'
                      }`}
                    />
                  )}
                  {}
                  {completedCellTasks.length > 0 && (
                    <span
                      className={`w-1 h-1 rounded-full ${
                        isSelectedCell ? 'bg-white/60' : 'bg-emerald-500'
                      }`}
                    />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {}
      <div>
        <h3 className="text-[15px] font-black text-slate-800 dark:text-zinc-100 mb-3.5 flex items-center gap-1.5">
          <CalendarDays size={18} className="text-indigo-500" />
          Schedule: {formatDateString(selectedDate)}
        </h3>

        {selectedDateTasks.length === 0 ? (
          <div className="bg-slate-50/50 dark:bg-zinc-900/30 rounded-3xl p-8 border border-dashed border-slate-200 dark:border-zinc-800 flex flex-col items-center justify-center text-center">
            <p className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">No scheduled activities</p>
          </div>
        ) : (
          <div className="flex flex-col">
            {selectedDateTasks.map((task) => (
              <TaskCard key={task.id} task={task} onEditClick={onEditClick} />
            ))}
          </div>
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
