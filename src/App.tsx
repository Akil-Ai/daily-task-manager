import React, { useState, useEffect } from 'react';
import { TodoProvider, useTodo } from './context/TodoContext';
import type { Task } from './context/TodoContext';
import { BottomNav } from './components/BottomNav';
import { DashboardView } from './components/DashboardView';
import { PlannerView } from './components/PlannerView';
import { CalendarView } from './components/CalendarView';
import { StatsView } from './components/StatsView';
import { SettingsView } from './components/SettingsView';
import { AddTaskSheet } from './components/AddTaskSheet';
import { AuthScreen } from './components/AuthScreen';
import { registerServiceWorker } from './utils/swRegister';
import { isSupabaseEnabled } from './lib/supabase';

registerServiceWorker();

const AppContent: React.FC = () => {
  const { currentTab, session } = useTodo();
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  // Give auth state a moment to resolve before showing auth screen
  useEffect(() => {
    const timer = setTimeout(() => setAuthChecked(true), 600);
    return () => clearTimeout(timer);
  }, []);

  const handleEditClick = (task: Task) => {
    setTaskToEdit(task);
    setIsAddSheetOpen(true);
  };

  const handleCloseAddSheet = () => {
    setIsAddSheetOpen(false);
    setTaskToEdit(null);
  };

  // Show loading spinner while session resolves
  if (isSupabaseEnabled && !authChecked) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
          <span className="text-xs font-semibold text-slate-400 dark:text-zinc-500">Loading…</span>
        </div>
      </div>
    );
  }

  // If Supabase is enabled and there is no session, show the auth screen
  if (isSupabaseEnabled && !session) {
    return <AuthScreen onAuthenticated={() => {}} />;
  }

  const renderView = () => {
    switch (currentTab) {
      case 'dashboard':
        return <DashboardView onOpenAddSheet={() => setIsAddSheetOpen(true)} onEditClick={handleEditClick} />;
      case 'planner':
        return <PlannerView onOpenAddSheet={() => setIsAddSheetOpen(true)} onEditClick={handleEditClick} />;
      case 'calendar':
        return <CalendarView onOpenAddSheet={() => setIsAddSheetOpen(true)} onEditClick={handleEditClick} />;
      case 'statistics':
        return <StatsView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <DashboardView onOpenAddSheet={() => setIsAddSheetOpen(true)} onEditClick={handleEditClick} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 pb-20 transition-colors duration-200">
      <div className="max-w-md mx-auto px-4.5 pt-6">
        {renderView()}
      </div>
      <BottomNav />
      <AddTaskSheet isOpen={isAddSheetOpen} onClose={handleCloseAddSheet} taskToEdit={taskToEdit} />
    </div>
  );
};

function App() {
  return (
    <TodoProvider>
      <AppContent />
    </TodoProvider>
  );
}

export default App;
