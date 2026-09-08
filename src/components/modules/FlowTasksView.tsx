import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { TaskTableView } from '../tasks/TaskTableView';
import { TaskFormModal } from '../common/TaskFormModal';
import { TaskItem, FlowTaskLegacy } from '../../types';

export const FlowTasksView: React.FC = () => {
  const { flowTasks, currentUser, updateTaskStatus, createFlowTask, deleteFlowTask } = useApp();
  
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);

  // We need to provide a selectedTab for the spreadsheet. 
  // For BPR ARA, we can default to the user's role/tab or 'REKAP PUSAT'.
  const selectedTab = 'REKAP PUSAT';

  const handleUpdateTask = (updated: any) => {
    updateTaskStatus(updated.id, updated.status, 100, updated.penyelesaian);
  };

  const handleAddTask = () => {
    setEditingTask(null);
    setIsTaskModalOpen(true);
  };

  const handleEditTask = (task: TaskItem) => {
    setEditingTask(task);
    setIsTaskModalOpen(true);
  };

  const handleSaveTask = (taskData: Partial<TaskItem>) => {
    if (editingTask && taskData.id) {
      updateTaskStatus(taskData.id, taskData.status || editingTask.status, 100, taskData.penyelesaian || editingTask.penyelesaian, { evidenceFiles: taskData.evidenceFiles });
    } else {
      createFlowTask(taskData);
    }
  };

  return (
    <div className="w-full h-full flex flex-col relative z-0 animate-in fade-in">
      <div className="mb-2 mx-4 sm:mx-6 mt-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 flex items-center gap-2">
        <span className="text-[10px] font-black text-slate-400 tracking-widest uppercase">
          MY WORKSPACE / TASK MANAGEMENT
        </span>
      </div>
      <TaskTableView
        tasks={flowTasks}
        userRole={currentUser.role as any}
        currentUser={currentUser as any}
        currentUserUnit={currentUser.unit || 'BIS'}
        onUpdateTask={handleUpdateTask}
        onDeleteTask={deleteFlowTask}
        onEditTask={handleEditTask}
        onAddTask={handleAddTask}
        onSyncCalendar={(task) => console.log('Sync', task)}
        selectedTab={selectedTab}
      />

      <TaskFormModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onSave={handleSaveTask}
        editingTask={editingTask}
        defaultMemberTab={selectedTab}
        userRole={currentUser.role as any}
        currentUser={currentUser as any}
        currentUserUnit={currentUser.unit || 'BIS'}
      />
    </div>
  );
};
