import React, { useState, useEffect } from 'react';
import { useTodo } from '../context/TodoContext';
import type { Task } from '../context/TodoContext';
import { BottomSheet } from './BottomSheet';
import { VoiceInput } from './VoiceInput';
import { Calendar, Clock, Plus, Sparkles, Folder } from 'lucide-react';

interface AddTaskSheetProps {
  isOpen: boolean;
  onClose: () => void;
  taskToEdit?: Task | null;
}

const PRESET_HUES = [
  '262, 83%, 58%', 
  '200, 95%, 48%', 
  '142, 70%, 45%', 
  '35, 92%, 50%',  
  '325, 78%, 49%', 
  '14, 85%, 55%',  
  '180, 80%, 40%', 
];

export const AddTaskSheet: React.FC<AddTaskSheetProps> = ({ isOpen, onClose, taskToEdit }) => {
  const { categories, addTask, editTask, addCategory, settings } = useTodo();

  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [category, setCategory] = useState('Personal');
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('');
  const [repeat, setRepeat] = useState<'none' | 'daily' | 'weekly' | 'monthly'>('none');
  const [reminderOffset, setReminderOffset] = useState<number>(15);

  const [showNewCatInput, setShowNewCatInput] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatHue, setNewCatHue] = useState(PRESET_HUES[0]);

  useEffect(() => {
    if (taskToEdit) {
      setTitle(taskToEdit.title);
      setNotes(taskToEdit.notes);
      setCategory(taskToEdit.category);
      setPriority(taskToEdit.priority);
      setDueDate(taskToEdit.dueDate);
      setDueTime(taskToEdit.dueTime || '');
      setRepeat(taskToEdit.repeat);
      setReminderOffset(taskToEdit.reminderOffset);
    } else {
      
      setTitle('');
      setNotes('');
      setCategory(categories[0]?.name || 'Personal');
      setPriority('medium');
      setDueDate(new Date().toISOString().split('T')[0]);
      setDueTime('');
      setRepeat('none');
      setReminderOffset(settings.defaultReminderOffset);
    }
  }, [taskToEdit, isOpen, categories, settings]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !dueDate) return;

    const taskData = {
      title: title.trim(),
      notes: notes.trim(),
      category,
      priority,
      dueDate,
      dueTime: dueTime || undefined,
      repeat,
      reminderOffset,
    };

    if (taskToEdit) {
      editTask(taskToEdit.id, taskData);
    } else {
      addTask(taskData);
    }
    onClose();
  };

  const handleVoiceTranscript = (text: string) => {
    setTitle((prev) => (prev ? `${prev} ${text}` : text));
  };

  const handleCreateCategory = () => {
    const trimmed = newCatName.trim();
    if (!trimmed) return;

    const exists = categories.some((c) => c.name.toLowerCase() === trimmed.toLowerCase());
    if (!exists) {
      addCategory(trimmed, newCatHue);
      setCategory(trimmed);
    }
    setNewCatName('');
    setShowNewCatInput(false);
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title={taskToEdit ? 'Edit Task' : 'Add New Task'}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        
        {}
        <div className="flex gap-2 items-center">
          <div className="flex-1 border-b-2 border-slate-100 dark:border-zinc-800 focus-within:border-indigo-500 transition-colors py-1 flex items-center">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              className="bg-transparent text-[16px] font-bold w-full outline-none text-slate-800 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-600"
              required
              autoFocus
            />
          </div>
          <VoiceInput onTranscript={handleVoiceTranscript} />
        </div>

        {}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
            Task Description / Notes
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add detailed task instructions..."
            className="w-full text-xs font-semibold p-3 rounded-2xl bg-slate-50 dark:bg-zinc-800/40 border border-slate-100 dark:border-zinc-800/60 text-slate-800 dark:text-zinc-200 outline-none focus:border-indigo-500 min-h-[70px] resize-none"
          />
        </div>

        {}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
            Priority Level
          </label>
          <div className="flex gap-2">
            {(['low', 'medium', 'high'] as const).map((p) => {
              const isActive = priority === p;
              const styles = {
                low: isActive ? 'bg-indigo-600 text-white shadow-indigo-500/20' : 'bg-slate-50 dark:bg-zinc-800/40 text-indigo-600 dark:text-indigo-400',
                medium: isActive ? 'bg-amber-500 text-white shadow-amber-500/20' : 'bg-slate-50 dark:bg-zinc-800/40 text-amber-600 dark:text-amber-500',
                high: isActive ? 'bg-rose-500 text-white shadow-rose-500/20' : 'bg-slate-50 dark:bg-zinc-800/40 text-rose-600 dark:text-rose-400',
              };

              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold capitalize transition-all active:scale-95 ${styles[p]}`}
                >
                  {p}
                </button>
              );
            })}
          </div>
        </div>

        {}
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between items-center">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
              Category
            </label>
            <button
              type="button"
              onClick={() => setShowNewCatInput(!showNewCatInput)}
              className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-0.5 hover:underline"
            >
              <Plus size={10} /> Custom
            </button>
          </div>

          {}
          {showNewCatInput && (
            <div className="bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/80 p-3 rounded-2xl flex flex-col gap-3.5 animate-scale-in">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="E.g. Fitness, Hobbies"
                  className="flex-1 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700/60 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 dark:text-zinc-100 outline-none"
                />
                <button
                  type="button"
                  onClick={handleCreateCategory}
                  className="bg-indigo-600 text-white font-bold text-xs px-3 py-1.5 rounded-xl active:scale-95 transition-transform"
                >
                  Create
                </button>
              </div>
              {}
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-bold text-slate-400 uppercase">Dot Color:</span>
                <div className="flex gap-1.5">
                  {PRESET_HUES.map((hue) => (
                    <button
                      key={hue}
                      type="button"
                      onClick={() => setNewCatHue(hue)}
                      style={{ backgroundColor: `rgb(${hue})` }}
                      className={`w-5 h-5 rounded-full border-2 transition-transform duration-100 ${
                        newCatHue === hue ? 'border-indigo-950 dark:border-white scale-110' : 'border-transparent'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {}
          <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar flex-wrap">
            {categories.map((cat) => {
              const isSelected = category === cat.name;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.name)}
                  style={{
                    backgroundColor: isSelected ? `rgba(${cat.color}, 0.2)` : 'transparent',
                    borderColor: `rgb(${cat.color})`,
                    color: `rgb(${cat.color})`,
                  }}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all active:scale-95 flex items-center gap-1.5 ${
                    isSelected ? 'shadow-sm' : 'border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400'
                  }`}
                >
                  <Folder size={11} className="opacity-90" />
                  {cat.name}
                </button>
              );
            })}
          </div>
        </div>

        {}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 flex items-center gap-1">
              <Calendar size={11} /> Due Date
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="text-xs font-bold bg-slate-50 dark:bg-zinc-800/40 border border-slate-100 dark:border-zinc-800/60 p-3 rounded-2xl text-slate-800 dark:text-zinc-200 outline-none"
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 flex items-center gap-1">
              <Clock size={11} /> Time (Optional)
            </label>
            <input
              type="time"
              value={dueTime}
              onChange={(e) => setDueTime(e.target.value)}
              className="text-xs font-bold bg-slate-50 dark:bg-zinc-800/40 border border-slate-100 dark:border-zinc-800/60 p-3 rounded-2xl text-slate-800 dark:text-zinc-200 outline-none"
            />
          </div>
        </div>

        {}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
              Repeat Cycle
            </label>
            <select
              value={repeat}
              onChange={(e: any) => setRepeat(e.target.value)}
              className="text-xs font-bold bg-slate-50 dark:bg-zinc-800/40 border border-slate-100 dark:border-zinc-800/60 p-3 rounded-2xl text-slate-800 dark:text-zinc-200 outline-none capitalize"
            >
              <option value="none">None</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
              Set Alarm Reminder
            </label>
            <select
              value={reminderOffset}
              onChange={(e) => setReminderOffset(Number(e.target.value))}
              className="text-xs font-bold bg-slate-50 dark:bg-zinc-800/40 border border-slate-100 dark:border-zinc-800/60 p-3 rounded-2xl text-slate-800 dark:text-zinc-200 outline-none"
            >
              <option value="-1">No Reminder</option>
              <option value="0">At due time</option>
              <option value="5">5 min before</option>
              <option value="15">15 min before</option>
              <option value="30">30 min before</option>
              <option value="60">1 hour before</option>
            </select>
          </div>
        </div>

        {}
        <button
          type="submit"
          className="w-full py-3.5 mt-2 rounded-2xl bg-indigo-600 text-white font-black text-sm tracking-wide shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-1.5 hover:bg-indigo-700 active:scale-98 transition-all"
        >
          <Sparkles size={16} />
          {taskToEdit ? 'Save Changes' : 'Create Task'}
        </button>
      </form>
    </BottomSheet>
  );
};
