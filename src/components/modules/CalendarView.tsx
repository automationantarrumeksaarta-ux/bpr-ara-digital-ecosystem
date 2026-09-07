import React, { useState } from 'react';
import { TaskItem, UserRole } from '../../types';
import { AgendaFormModal } from '../common/AgendaFormModal';
import { useApp } from '../../context/AppContext';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Plus, 
  ExternalLink,
  CheckCircle2,
  Clock,
  Sparkles
} from 'lucide-react';
import { generateGoogleCalendarUrl } from '../../utils/exportUtils';

interface CalendarViewProps {
  tasks: TaskItem[];
  userRole: UserRole;
  onEditTask?: (task: TaskItem) => void;
  onAddTask?: () => void;
  onSyncCalendar?: () => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  tasks,
  userRole,
  onEditTask,
  onAddTask,
  onSyncCalendar
}) => {
  const { currentUser, createFlowTask, updateTaskStatus } = useApp();
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);

  const handleSaveTask = (taskData: Partial<TaskItem>) => {
    if (editingTask) {
      updateTaskStatus(editingTask.id, taskData.status || editingTask.status, 100, taskData.penyelesaian || editingTask.penyelesaian);
    } else {
      createFlowTask(taskData);
    }
  };

  const handleAddTaskClick = () => {
    if (onAddTask) {
      onAddTask();
    } else {
      setEditingTask(null);
      setIsTaskModalOpen(true);
    }
  };

  const handleEditTaskClick = (task: TaskItem) => {
    if (onEditTask) {
      onEditTask(task);
    } else {
      setEditingTask(task);
      setIsTaskModalOpen(true);
    }
  };

  const realToday = new Date();
  const todayDay = realToday.getDate();
  const todayMonth = realToday.getMonth();
  const todayYear = realToday.getFullYear();

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Sun

  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const leadingBlanks = Array.from({ length: firstDayIndex }, (_, i) => i);

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Helper to find tasks for day
  const getTasksForDay = (day: number) => {
    const formattedMonth = String(month + 1).padStart(2, '0');
    const formattedDay = String(day).padStart(2, '0');
    const dateKey = `${year}-${formattedMonth}-${formattedDay}`;

    return tasks.filter(t => t.tanggal === dateKey || t.tanggalFU === dateKey);
  };

  return (
    <div className="flex-1 flex flex-col p-4 sm:p-8 min-w-0 bg-[#F9F9FB] dark:bg-[#121214]">
      <div className="mb-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 flex items-center gap-2">
        <span className="text-[10px] font-black text-slate-400 tracking-widest uppercase">
          MY WORKSPACE / CALENDAR
        </span>
      </div>
      {/* Calendar Bar Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-light italic serif tracking-tight text-gray-900 dark:text-white">
            Kalender Tugas & <span className="font-bold not-italic">Agenda Tim</span>
          </h2>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Terhubung langsung dengan integrasi API Google Calendar Matesih.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center bg-white dark:bg-[#18181A] border border-gray-200 dark:border-gray-800 rounded-2xl p-1 shadow-xs">
            <button 
              onClick={prevMonth}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors text-gray-600 dark:text-gray-300"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-4 text-xs font-bold text-gray-900 dark:text-white min-w-[130px] text-center">
              {monthNames[month]} {year}
            </span>
            <button 
              onClick={nextMonth}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors text-gray-600 dark:text-gray-300"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={handleAddTaskClick}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-semibold shadow-md shadow-blue-500/20 flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Agenda</span>
          </button>
        </div>
      </div>

      {/* Days of Week Header */}
      <div className="grid grid-cols-7 gap-2 mb-2 text-center text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
        <div>Min</div>
        <div>Sen</div>
        <div>Sel</div>
        <div>Rab</div>
        <div>Kam</div>
        <div>Jum</div>
        <div>Sab</div>
      </div>

      {/* Grid Days */}
      <div className="grid grid-cols-7 gap-2 flex-1">
        {leadingBlanks.map((_, i) => (
          <div key={`blank-${i}`} className="bg-gray-50/50 dark:bg-gray-900/10 rounded-2xl p-2 min-h-[90px] opacity-30" />
        ))}

        {daysArray.map((day) => {
          const dayTasks = getTasksForDay(day);
          const isToday = day === todayDay && month === todayMonth && year === todayYear;

          return (
            <div
              key={day}
              className={`
                bg-white dark:bg-[#18181A] rounded-2xl p-2.5 min-h-[100px] border transition-all flex flex-col justify-between
                ${isToday 
                  ? 'border-blue-500 shadow-md ring-2 ring-blue-500/20 dark:ring-blue-500/30' 
                  : 'border-gray-100 dark:border-gray-800/80 hover:border-gray-300 dark:hover:border-gray-700'
                }
              `}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className={`
                  text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center
                  ${isToday ? 'bg-blue-600 text-white' : 'text-gray-700 dark:text-gray-300'}
                `}>
                  {day}
                </span>
                {dayTasks.length > 0 && (
                  <span className="text-[9px] font-bold text-gray-400 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded-full">
                    {dayTasks.length}
                  </span>
                )}
              </div>

              {/* Day Tasks List */}
              <div className="space-y-1 flex-1 overflow-y-auto max-h-[80px]">
                {dayTasks.map((t) => {
                  const isSelesai = t.status === 'Selesai';

                  return (
                    <div
                      key={t.id}
                      onClick={(e) => {
                          e.stopPropagation();
                          handleEditTaskClick(t);
                        }}
                      className={`text-[10px] leading-tight px-1.5 py-1 mb-1 rounded-md border truncate cursor-pointer transition-colors shadow-xs font-medium truncate
                        ${isSelesai
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200/50 line-through opacity-80'
                          : 'bg-blue-50/80 dark:bg-blue-950/50 text-blue-900 dark:text-blue-200 border-blue-200/60 dark:border-blue-800/40 hover:bg-blue-100'
                        }
                      `}
                      title={`${t.deskripsiTugas} (${t.assignedTo})`}
                    >
                      <div className="font-bold truncate">[{t.assignedTo}] {t.deskripsiTugas}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      {/* Optional Modal TaskForm (Now AgendaFormModal) */}
      {currentUser && (
        <AgendaFormModal
          isOpen={isTaskModalOpen}
          onClose={() => setIsTaskModalOpen(false)}
          onSave={handleSaveTask}
          editingTask={editingTask}
        />
      )}
    </div>
  );
};
