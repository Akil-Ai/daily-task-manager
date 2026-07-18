import React from 'react';
import { useTodo } from '../context/TodoContext';
import { Flame, CheckCircle, Clock, BarChart3, TrendingUp, Calendar } from 'lucide-react';

export const StatsView: React.FC = () => {
  const { tasks, streak, bestStreak } = useTodo();

  const totalTasksCount = tasks.length;
  const completedTasksCount = tasks.filter((t) => t.isCompleted).length;
  const pendingTasksCount = totalTasksCount - completedTasksCount;

  const completedRatio = totalTasksCount > 0 ? (completedTasksCount / totalTasksCount) * 100 : 0;
  const pendingRatio = totalTasksCount > 0 ? (pendingTasksCount / totalTasksCount) * 100 : 0;

  const getWeeklyData = () => {
    const data = [];
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayName = weekdays[d.getDay()];

      const dayTasks = tasks.filter((t) => t.dueDate === dateStr);
      const dayCompleted = dayTasks.filter((t) => t.isCompleted).length;
      
      const completionPercentage = dayTasks.length > 0 
        ? Math.round((dayCompleted / dayTasks.length) * 100) 
        : 0;

      data.push({
        dayName,
        dateStr,
        total: dayTasks.length,
        completed: dayCompleted,
        percentage: completionPercentage,
      });
    }
    return data;
  };

  const weeklyData = getWeeklyData();

  return (
    <div className="pb-24 animate-fade-in">
      <h1 className="text-xl font-black text-slate-800 dark:text-zinc-50 mb-5 tracking-tight flex items-center gap-1.5">
        <BarChart3 size={20} className="text-indigo-500" />
        Activity Statistics
      </h1>

      {}
      <div className="bg-gradient-to-r from-indigo-500 to-violet-600 text-white rounded-3xl p-5 shadow-lg shadow-indigo-500/15 mb-6 flex justify-between items-center">
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-indigo-100 block">
            Current Momentum
          </span>
          <span className="text-3xl font-black tracking-tight mt-1 block">
            {streak} Day{streak !== 1 ? 's' : ''} Streak
          </span>
          <span className="text-xs text-indigo-100 font-medium block mt-1.5">
            Keep it up! Best record is {bestStreak} days.
          </span>
        </div>
        <div className="p-3 bg-white/10 dark:bg-black/20 rounded-2xl">
          <Flame size={32} className="fill-current text-amber-300 animate-pulse" />
        </div>
      </div>

      {}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-slate-100 dark:border-zinc-800/80 shadow-sm flex items-center gap-3">
          <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 rounded-xl">
            <CheckCircle size={18} />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wide block">
              Completed
            </span>
            <span className="text-lg font-black text-slate-800 dark:text-zinc-100 block mt-0.5 leading-none">
              {completedTasksCount}
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-slate-100 dark:border-zinc-800/80 shadow-sm flex items-center gap-3">
          <div className="p-2.5 bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 rounded-xl">
            <Clock size={18} />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wide block">
              Pending
            </span>
            <span className="text-lg font-black text-slate-800 dark:text-zinc-100 block mt-0.5 leading-none">
              {pendingTasksCount}
            </span>
          </div>
        </div>
      </div>

      {}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl p-5 border border-slate-100 dark:border-zinc-800/80 shadow-sm mb-6">
        <h3 className="text-sm font-black text-slate-800 dark:text-zinc-100 mb-4 flex items-center gap-1.5">
          <TrendingUp size={16} className="text-indigo-500" />
          Completion Split Ratio
        </h3>

        {totalTasksCount === 0 ? (
          <p className="text-xs text-slate-400 dark:text-zinc-500 font-medium text-center py-4">
            Create tasks to view completion ratios.
          </p>
        ) : (
          <div>
            {}
            <div className="w-full h-4 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden flex">
              <div
                style={{ width: `${completedRatio}%` }}
                className="bg-emerald-500 h-full transition-all duration-300"
              />
              <div
                style={{ width: `${pendingRatio}%` }}
                className="bg-amber-500 h-full transition-all duration-300"
              />
            </div>

            {}
            <div className="flex justify-between items-center mt-3.5 text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-slate-600 dark:text-zinc-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Done ({Math.round(completedRatio)}%)
              </span>
              <span className="flex items-center gap-1.5 text-slate-600 dark:text-zinc-400">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                Pending ({Math.round(pendingRatio)}%)
              </span>
            </div>
          </div>
        )}
      </div>

      {}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl p-5 border border-slate-100 dark:border-zinc-800/80 shadow-sm">
        <h3 className="text-sm font-black text-slate-800 dark:text-zinc-100 mb-5 flex items-center gap-1.5">
          <Calendar size={16} className="text-indigo-500" />
          Last 7 Days Completion
        </h3>

        <div className="flex justify-between items-end h-32 px-1 gap-2.5">
          {weeklyData.map((day) => {
            const hasActivity = day.total > 0;
            const barHeight = hasActivity ? `${day.percentage}%` : '5%';

            return (
              <div key={day.dateStr} className="flex-1 flex flex-col items-center group h-full justify-end">
                {}
                <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 dark:bg-zinc-700 text-white text-[9px] font-bold px-1.5 py-0.5 rounded absolute -translate-y-28 shadow duration-150">
                  {day.completed}/{day.total} ({day.percentage}%)
                </span>

                {}
                <div className="w-full relative rounded-t-lg bg-slate-50 dark:bg-zinc-800/40 h-full flex flex-col justify-end">
                  <div
                    style={{ height: barHeight }}
                    className={`w-full rounded-t-lg transition-all duration-500 ${
                      hasActivity
                        ? day.percentage === 100
                          ? 'bg-emerald-500'
                          : 'bg-indigo-500'
                        : 'bg-slate-200 dark:bg-zinc-800 border-2 border-dashed border-slate-300 dark:border-zinc-700'
                    }`}
                  />
                </div>

                {}
                <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 mt-2">
                  {day.dayName}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
