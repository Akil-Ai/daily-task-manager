import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({ isOpen, onClose, title, children }) => {
  
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      {}
      <div
        className="absolute inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-[2px] transition-opacity duration-300 ease-out"
        onClick={onClose}
      />

      {}
      <div className="relative z-10 w-full bg-white dark:bg-zinc-900 rounded-t-[28px] max-h-[92vh] flex flex-col shadow-2xl border-t border-slate-200/50 dark:border-zinc-800/50 transform animate-slide-up pb-safe">
        {}
        <div className="w-12 h-1 bg-slate-200 dark:bg-zinc-700 rounded-full mx-auto mt-3 mb-2" onClick={onClose} />

        {}
        <div className="flex items-center justify-between px-6 pb-2 pt-1">
          <h2 className="text-xl font-bold tracking-tight text-slate-800 dark:text-zinc-100">{title}</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 active:scale-90 transition-transform"
          >
            <X size={18} />
          </button>
        </div>

        {}
        <div className="overflow-y-auto px-6 pb-8 pt-2 flex-grow no-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
};
