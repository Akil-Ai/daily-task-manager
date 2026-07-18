import React, { useState } from 'react';
import { TodoProvider, useTodo } from './context/TodoContext';
import type { Task } from './context/TodoContext';
import { BottomNav } from './components/BottomNav';
import { DashboardView } from './components/DashboardView';
import { PlannerView } from './components/PlannerView';
import { CalendarView } from './components/CalendarView';
import { StatsView } from './components/StatsView';
import { SettingsView } from './components/SettingsView';
import { AddTaskSheet } from './components/AddTaskSheet';
import { registerServiceWorker } from './utils/swRegister';

registerServiceWorker();

const AppContent: React.FC = () => {
  const { currentTab } = useTodo();
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);

  const handleEditClick = (task: Task) => {
    setTaskToEdit(task);
    setIsAddSheetOpen(true);
  };

  const handleCloseAddSheet = () => {
    setIsAddSheetOpen(false);
    setTaskToEdit(null);
  };

  const renderView = () => {
    switch (currentTab) {
      case 'dashboard':
        return (
          <DashboardView
            onOpenAddSheet={() => setIsAddSheetOpen(true)}
            onEditClick={handleEditClick}
          />
        );
      case 'planner':
        return (
          <PlannerView
            onOpenAddSheet={() => setIsAddSheetOpen(true)}
            onEditClick={handleEditClick}
          />
        );
      case 'calendar':
        return (
          <CalendarView
            onOpenAddSheet={() => setIsAddSheetOpen(true)}
            onEditClick={handleEditClick}
          />
        );
      case 'statistics':
        return <StatsView />;
      case 'settings':
        return <SettingsView />;
      default:
        return (
          <DashboardView
            onOpenAddSheet={() => setIsAddSheetOpen(true)}
            onEditClick={handleEditClick}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 pb-20 transition-colors duration-200">
      {}
      <div className="max-w-md mx-auto px-4.5 pt-6">
        {renderView()}
      </div>

      {}
      <BottomNav />

      {}
      <AddTaskSheet
        isOpen={isAddSheetOpen}
        onClose={handleCloseAddSheet}
        taskToEdit={taskToEdit}
      />
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
