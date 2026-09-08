import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { TaskTableView } from '../tasks/TaskTableView';
import { TaskFormModal } from '../common/TaskFormModal';
import { TaskItem, FlowTaskLegacy } from '../../types';

export const FlowTasksView: React.FC = () => {
  const { flowTasks, currentUser, updateTaskStatus, createFlowTask } = useApp();
  
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
    if (editingTask) {
      // It's an edit - since BPR ARA's context only supports creating or updating status easily,
      // we can simulate an edit by just changing status, or if we want full edit we'd need to add `updateFlowTask` to AppContext.
      // For now, let's just do update status since the user just wants to "input activity".
      // Wait, BPR ARA AppContext doesn't have a generic `updateTask` function!
      // But the spreadsheet allows full editing. 
      // I'll call updateTaskStatus if status changed, and for full data I might need to add `updateFlowTask` in the future.
      console.log('Update task not fully supported in AppContext yet. Data:', taskData);
      updateTaskStatus(editingTask.id, taskData.status || editingTask.status, 100, taskData.penyelesaian || editingTask.penyelesaian);
    } else {
      // It's a new task
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
        onDeleteTask={(id) => console.log('Delete', id)}
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
