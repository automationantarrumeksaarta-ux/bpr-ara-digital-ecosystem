import React, { useState } from 'react';
import { TaskItem } from '../../types';
import { generateGoogleCalendarUrl } from '../../utils/exportUtils';
import { X, Calendar, Check, RefreshCw, ExternalLink, ShieldCheck, Sparkles } from 'lucide-react';

interface GoogleCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: TaskItem[];
  onSyncAll: () => void;
}

export const GoogleCalendarModal: React.FC<GoogleCalendarModalProps> = ({
  isOpen,
  onClose,
  tasks,
  onSyncAll
}) => {
  const [isConnected, setIsConnected] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  if (!isOpen) return null;

  const handleSyncNow = () => {
    setIsSyncing(true);
    setTimeout(() => {
      onSyncAll();
      setIsSyncing(false);
    }, 1200);
  };

  const syncableTasks = tasks.filter(t => t.tanggalFU || t.tanggal);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
      <div className="bg-white dark:bg-[#18181A] w-full max-w-xl rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-800 dark:text-gray-200 dark:text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">Integrasi API Google Calendar</h3>
              <p className="text-xs text-gray-400">Sinkronisasi otomatis agenda & reminder tugas</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Status Badge */}
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-900/40 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-5 h-5 text-gray-800 dark:text-gray-200 dark:text-gray-800 dark:text-gray-200" />
              <div>
                <p className="text-xs font-bold text-emerald-900 dark:text-emerald-200">Terhubung: Google Workspace Calendar</p>
                <p className="text-[11px] text-emerald-700 dark:text-emerald-400">Akun: ara.sinau@gmail.com (Kalender Matesih)</p>
              </div>
            </div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 px-2 py-0.5 rounded-full">
              Aktif
            </span>
          </div>

          {/* Sync Stats */}
          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="p-4 bg-gray-50 dark:bg-gray-800/40 rounded-2xl border border-gray-100 dark:border-gray-800">
              <p className="text-[10px] uppercase font-bold text-gray-400">Tugas Siap Sinkron</p>
              <p className="text-2xl font-extrabold text-gray-900 dark:text-white">{syncableTasks.length}</p>
            </div>

            <div className="p-4 bg-gray-50 dark:bg-gray-800/40 rounded-2xl border border-gray-100 dark:border-gray-800">
              <p className="text-[10px] uppercase font-bold text-gray-400">Sudah Tersinkron</p>
              <p className="text-2xl font-extrabold text-blue-600 dark:text-blue-400">
                {tasks.filter(t => t.syncedToCalendar).length}
              </p>
            </div>
          </div>

          {/* Task Preview List */}
          <div>
            <p className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">Pratinjau Agenda yang Akan Disinkronkan:</p>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {syncableTasks.slice(0, 5).map(t => (
                <div key={t.id} className="p-2.5 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-100 dark:border-gray-700 flex items-center justify-between text-xs">
                  <div className="truncate pr-2">
                    <p className="font-semibold text-gray-800 dark:text-gray-200 truncate">{t.deskripsiTugas}</p>
                    <p className="text-[10px] text-gray-400">Tgl FU: {t.tanggalFU || t.tanggal} • {t.assignedTo}</p>
                  </div>
                  <a
                    href={generateGoogleCalendarUrl(t)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/40 rounded-lg transition-colors shrink-0"
                    title="Buka di Google Calendar Web"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/30">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-full text-xs font-semibold text-gray-600 dark:text-gray-300"
          >
            Tutup
          </button>
          <button
            onClick={handleSyncNow}
            disabled={isSyncing}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-xs font-bold shadow-md shadow-blue-500/20 flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Menyinkronkan...' : 'Sinkron Semua ke G-Cal'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
