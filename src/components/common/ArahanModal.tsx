import React, { useState, useEffect } from 'react';
import { TaskItem } from '../../types';
import { X, MessageSquare, Save } from 'lucide-react';
import { canApproveTask } from '../../utils/beisUtils';

interface ArahanModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: TaskItem | null;
  onSave: (taskId: string, arahanAtasan: string, arahanAtasanUtama: string) => void;
  userRole: string;
  currentUser?: any;
}

export const ArahanModal: React.FC<ArahanModalProps> = ({ isOpen, onClose, task, onSave, userRole, currentUser }) => {
  const [arahanA, setArahanA] = useState('');
  const [arahanB, setArahanB] = useState('');

  useEffect(() => {
    if (task) {
      setArahanA(task.arahanAtasan || '');
      setArahanB(task.arahanAtasanUtama || '');
    }
  }, [task]);

  if (!isOpen || !task) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (task) {
      onSave(task.id, arahanA, arahanB);
    }
    onClose();
  };

  const isSuperAdmin = userRole === 'Super Admin' || userRole === 'Master Admin';
  const userNameLower = currentUser?.name?.toLowerCase() || '';
  const userTabLower = currentUser?.assignedMemberTab?.toLowerCase() || '';

  const isValidator = currentUser && task?.validator 
    ? task.validator.split(',').some((v: string) => v.trim().toLowerCase() === userNameLower) 
    : false;

  const isPic = currentUser && task 
    ? (task.pic && task.pic.split(',').some((p: string) => p.trim().toLowerCase() === userNameLower || p.trim().toLowerCase() === userTabLower)) ||
      (task.assignedTo && task.assignedTo.split(',').some((p: string) => p.trim().toLowerCase() === userNameLower || p.trim().toLowerCase() === userTabLower))
    : false;
  
  const canEdit = isSuperAdmin || isValidator || isPic;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#1C1C1E] rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-[#252528]/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800 dark:text-white">Arahan Atasan (WOOPS)</h2>
              <p className="text-xs text-gray-500">ID: {task.taskId}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        <form id="arahan-form" onSubmit={handleSubmit} className="p-6 flex flex-col gap-6">
          <div>
            <label className="block font-bold text-sm text-purple-700 dark:text-purple-400 mb-2">
              👑 Arahan Atasan (WOOPS)
            </label>
            <textarea
              value={arahanB}
              onChange={(e) => setArahanB(e.target.value)}
              disabled={!canEdit}
              placeholder="Tuliskan arahan dari atasan di sini..."
              rows={8}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-purple-50/30 dark:bg-purple-900/10 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 outline-none resize-none disabled:opacity-70"
            />
          </div>
        </form>

        <div className="p-6 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-3 bg-gray-50/50 dark:bg-[#252528]/50">
          <button 
            type="button" 
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            Tutup
          </button>
          {canEdit && (
            <button 
              form="arahan-form"
              type="submit"
              className="px-6 py-2.5 flex items-center gap-2 rounded-xl font-bold bg-purple-600 hover:bg-purple-700 text-white transition-colors shadow-md shadow-purple-500/20"
            >
              <Save className="w-4 h-4" />
              Simpan Arahan
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
