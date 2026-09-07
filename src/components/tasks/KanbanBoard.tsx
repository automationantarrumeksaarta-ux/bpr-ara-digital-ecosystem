import React from 'react';
import { Calendar, Trash2, Check } from 'lucide-react';
import { TaskItem, TaskStatus } from '../../types/legacy';
import { Card, CardHeader, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

interface KanbanBoardProps {
  tasks: TaskItem[];
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void;
  onDelete: (taskId: string) => void;
  onSyncGCal: (task: TaskItem) => void;
}

interface TaskCardProps {
  task: TaskItem;
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void;
  onDelete: (taskId: string) => void;
  onSyncGCal: (task: TaskItem) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onStatusChange, onDelete, onSyncGCal }) => {
  return (
    <Card className="hover:shadow-md transition-all space-y-3 p-4">
      <div className="flex items-start justify-between gap-2">
        <Badge variant={task.priority === 'TINGGI' ? 'destructive' : task.priority === 'SEDANG' ? 'warning' : 'secondary'} className="text-[9px] px-2 py-0.5 uppercase">
          {task.priority}
        </Badge>
        <Badge variant="outline" className="text-[10px] px-2 py-0.5">
          {task.category}
        </Badge>
      </div>

      <div>
        <h5 className="text-xs font-bold text-slate-900 dark:text-white leading-snug">{task.title}</h5>
        <p className="text-[11px] text-slate-500 dark:text-gray-400 mt-1 line-clamp-2 leading-relaxed">{task.description}</p>
      </div>

      {task.relatedDebtor && (
        <div className="text-[10px] bg-slate-100 dark:bg-slate-800 p-1.5 rounded-lg font-medium">
          👤 Debitur: <strong>{task.relatedDebtor}</strong>
        </div>
      )}

      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
        <span className="font-semibold text-slate-700 dark:text-gray-200">{task.assigneeName}</span>
        <span className="font-mono text-slate-500 dark:text-gray-400">{task.dueDate} {task.dueTime}</span>
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-between pt-1">
        <select
          value={task.status}
          onChange={(e) => onStatusChange(task.id, e.target.value as TaskStatus)}
          className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-gray-100 text-[10px] font-bold rounded-lg px-2 py-1 outline-none cursor-pointer"
        >
          <option value="TODO">To-Do</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="REVIEW">Review</option>
          <option value="COMPLETED">Completed</option>
        </select>

        <div className="flex items-center gap-1">
          {!task.isSyncedToGCal ? (
            <Button
              variant="outline"
              size="icon"
              className="w-7 h-7 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30"
              onClick={() => onSyncGCal(task)}
              title="Sync ke Google Calendar"
            >
              <Calendar size={13} />
            </Button>
          ) : (
            <a
              href={task.googleCalendarHtmlLink || 'https://calendar.google.com'}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center w-7 h-7 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-600 dark:border-emerald-900 dark:bg-emerald-900/30 dark:text-emerald-400"
              title="Terbuka di Google Calendar"
            >
              <Check size={13} />
            </a>
          )}
          
          <Button
            variant="outline"
            size="icon"
            className="w-7 h-7 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30"
            onClick={() => onDelete(task.id)}
          >
            <Trash2 size={13} />
          </Button>
        </div>
      </div>
    </Card>
  );
};

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ tasks, onStatusChange, onDelete, onSyncGCal }) => {
  const columns = [
    { id: 'TODO', title: 'To-Do (Belum)', status: 'TODO', dotColor: 'bg-slate-400' },
    { id: 'IN_PROGRESS', title: 'Sedang Dikerjakan', status: 'IN_PROGRESS', dotColor: 'bg-blue-500' },
    { id: 'REVIEW', title: 'Dalam Review', status: 'REVIEW', dotColor: 'bg-amber-500' },
    { id: 'COMPLETED', title: 'Selesai (Done)', status: 'COMPLETED', dotColor: 'bg-emerald-500' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {columns.map(col => {
        const colTasks = tasks.filter(t => t.status === col.status);
        return (
          <Card key={col.id} className="flex flex-col gap-3 min-h-[480px] bg-slate-50 dark:bg-slate-900/50">
            <CardHeader className="pb-2 border-b border-slate-200 dark:border-slate-800 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${col.dotColor}`} />
                  <span className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider">{col.title}</span>
                </div>
                <Badge variant="secondary" className="text-xs px-2 py-0.5">
                  {colTasks.length}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 flex-1 overflow-y-auto no-scrollbar p-3">
              {colTasks.map(task => (
                <TaskCard 
                  key={task.id} 
                  task={task} 
                  onStatusChange={onStatusChange} 
                  onDelete={onDelete}
                  onSyncGCal={onSyncGCal}
                />
              ))}
              {colTasks.length === 0 && (
                <div className="p-8 text-center text-xs text-slate-400 italic">Tidak ada tugas</div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
