import React, { useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { saringTugasUntuk, semuaBawahan } from '../../utils/hirarki';
import { PengingatTugas } from '../common/PengingatTugas';
import { TaskTableView } from '../tasks/TaskTableView';
import { TaskFormModal } from '../common/TaskFormModal';
import { TaskItem, FlowTaskLegacy } from '../../types';

export const FlowTasksView: React.FC = () => {
  const {
    flowTasks, currentUser, updateTaskStatus, createFlowTask, deleteFlowTask,
    taskRoutes, allUsers,
  } = useApp() as any;

  /*
   * Papan tugas hanya memuat tugas sendiri dan tugas bawahan, berjenjang.
   *
   * Sebelumnya `flowTasks` diteruskan apa adanya, sehingga setiap orang yang
   * membuka menu ini melihat papan tugas seluruh pegawai — termasuk yang tidak
   * ada hubungan atasan–bawahan dengannya sama sekali.
   *
   * Rantai atasan diambil dari task_routes, yaitu isian "Lapor / Arahkan Task
   * Ke (Atasan Langsung)" di menu Super Admin. Aturannya berlaku untuk semua
   * peran, termasuk admin: yang ingin mengawasi banyak orang ditetapkan sebagai
   * atasan mereka, bukan dikecualikan dari aturan.
   */
  const tugasSaya = useMemo(
    () => saringTugasUntuk(flowTasks ?? [], currentUser?.id, currentUser?.name, taskRoutes ?? {}, allUsers ?? []),
    [flowTasks, currentUser?.id, currentUser?.name, taskRoutes, allUsers],
  );

  const jumlahBawahan = useMemo(
    () => semuaBawahan(taskRoutes ?? {}, currentUser?.id).size,
    [taskRoutes, currentUser?.id],
  );
  
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
          Papan Tugas
        </span>
        {/* Cakupan ditulis apa adanya supaya tidak ada yang mengira papan ini
            memuat seluruh pegawai, atau sebaliknya mengira tugasnya hilang. */}
        <span className="text-[11px] text-slate-500">
          {jumlahBawahan > 0
            ? `Tugas Anda dan ${jumlahBawahan} bawahan`
            : 'Tugas Anda'}
        </span>
      </div>
      {/* Pengingat tugas lewat tenggat; tidak muncul bila tidak ada. */}
      <PengingatTugas tugas={tugasSaya} className="mx-4 sm:mx-6 mb-2" />

      {/* `currentUserUnit` diteruskan apa adanya. Mengubah nilai kosong menjadi
          'BIS' di sini hanya akan menyembunyikan unit yang memang belum terisi,
          sementara kedua komponen penerimanya sudah punya nilai jatuh sendiri. */}
      <TaskTableView
        tasks={tugasSaya}
        userRole={currentUser.role as any}
        currentUser={currentUser as any}
        currentUserUnit={currentUser.unit}
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
        currentUserUnit={currentUser.unit}
      />
    </div>
  );
};
