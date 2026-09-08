import React, { useState, useEffect } from 'react';
import { X, Calendar, Users, MapPin, Check, Trash2 } from 'lucide-react';
import { TaskItem, UserRole } from '../../types';
import { useApp } from '../../context/AppContext';

interface AgendaFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (taskData: Partial<TaskItem>) => void;
  onDelete?: (taskId: string) => void;
  editingTask?: TaskItem | null;
}

const ROLE_OPTIONS: { role: UserRole; label: string }[] = [
  { role: 'Direktur Utama', label: 'Direktur Utama' },
  { role: 'Direktur YMFK', label: 'Direktur Bisnis' },
  { role: 'Kepala Cabang', label: 'Kepala Cabang' },
  { role: 'PE Bisnis & Collection', label: 'PE Bisnis & Pemasaran' },
  { role: 'PE Kepatuhan, Manrisk & LK', label: 'PE Kepatuhan & APU-PPT' },
  { role: 'PE Audit Intern & Anti Fraud', label: 'SKAI / Audit Intern' },
  { role: 'Account Officer', label: 'Account Officer' },
  { role: 'Surveyor', label: 'Field Surveyor' },
  { role: 'Analis Kredit', label: 'Credit Analyst' },
  { role: 'Admin Legal', label: 'Legal & Akad' },
  { role: 'Staff Collection', label: 'Collection & Remedial' },
  { role: 'Pengembangan SDM', label: 'HR / SDM' },
  { role: 'Master Admin', label: 'Administrator' },
];

export const AgendaFormModal: React.FC<AgendaFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  editingTask,
}) => {
  const { allUsers, currentUser } = useApp();
  const [judul, setJudul] = useState('');
  const [tanggal, setTanggal] = useState('');
  const [lokasi, setLokasi] = useState('');
  const [pesertaText, setPesertaText] = useState('');
  const [suggestionQuery, setSuggestionQuery] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (editingTask) {
        setJudul(editingTask.deskripsiTugas || '');
        setTanggal(editingTask.tanggalFU || editingTask.tanggal || '');
        setLokasi(editingTask.penyelesaian || '');
        
        // Convert mentions array back to @text
        const initialPeserta = editingTask.mentions 
          ? editingTask.mentions.map(m => `@${m}`).join(' ')
          : '';
        setPesertaText(initialPeserta);
      } else {
        setJudul('');
        setTanggal(new Date().toISOString().split('T')[0]);
        setLokasi('');
        setPesertaText('');
        setSuggestionQuery(null);
      }
    }
  }, [isOpen, editingTask]);

  if (!isOpen) return null;

  const handlePesertaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPesertaText(value);

    // Basic cursor tracking based on the last word typed
    const words = value.split(' ');
    const lastWord = words[words.length - 1];

    if (lastWord.startsWith('@')) {
      setSuggestionQuery(lastWord.substring(1).toLowerCase());
    } else {
      setSuggestionQuery(null);
    }
  };

  const handleSuggestionClick = (role: string) => {
    const words = pesertaText.split(' ');
    words.pop(); // remove the partial @word
    const newText = [...words, `@${role} `].join(' ').replace(/\s+/g, ' ');
    setPesertaText(newText);
    setSuggestionQuery(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!judul.trim() || !tanggal) {
      alert("Judul Agenda dan Tanggal wajib diisi.");
      return;
    }

    // Parse @mentions from pesertaText
    const words = pesertaText.split(/[\s,]+/);
    const parsedMentions: string[] = [];
    words.forEach(word => {
      if (word.startsWith('@') && word.length > 1) {
        // Remove @ and any trailing punctuation
        const mention = word.substring(1).replace(/[^a-zA-Z0-9_-]/g, '');
        if (mention) parsedMentions.push(mention);
      }
    });

    onSave({
      id: editingTask?.id,
      deskripsiTugas: judul,
      tanggalFU: tanggal, // use tanggalFU as deadline/event date
      tanggal: tanggal,
      penyelesaian: lokasi, // use penyelesaian to store location link temporarily
      mentions: parsedMentions,
      jenisTeknis: 'Aksidental', // marker for agenda
      status: editingTask?.status || 'Planned',
      prioritas: 'P5',
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm animate-in fade-in" onClick={() => setSuggestionQuery(null)}>
      <div 
        className="bg-white dark:bg-[#18181B] w-full max-w-lg rounded-3xl shadow-2xl flex flex-col overflow-hidden ring-1 ring-black/5 dark:ring-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center px-6 py-5 border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-[#18181B]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 tracking-tight">
                {editingTask ? 'Edit Agenda' : 'Agenda Baru'}
              </h2>
              <p className="text-[11px] text-slate-500 font-medium">Jadwalkan rapat atau kegiatan divisi</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-[13px] font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Judul Agenda <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={judul}
              onChange={(e) => setJudul(e.target.value)}
              placeholder="Contoh: Rapat Koordinasi Kredit..."
              className="w-full bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-[14px] font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:font-normal"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[13px] font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-slate-400" /> Tanggal <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
                className="w-full bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-[14px] font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-[13px] font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-slate-400" /> Lokasi / Link
              </label>
              <input
                type="text"
                value={lokasi}
                onChange={(e) => setLokasi(e.target.value)}
                placeholder="URL Meet / Ruang Rapat"
                className="w-full bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-[14px] font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:font-normal"
              />
            </div>
          </div>

          <div className="relative">
            <label className="block text-[13px] font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-slate-400" /> Peserta / Mention
            </label>
            <input
              type="text"
              value={pesertaText}
              onChange={handlePesertaChange}
              placeholder="Contoh: @Marketing @all @Danang"
              className="w-full bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-[14px] font-medium text-blue-600 dark:text-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:font-normal placeholder:text-slate-400"
            />
            <p className="text-[11px] text-slate-500 mt-1.5 ml-1">
              Gunakan <span className="font-semibold text-slate-700 dark:text-slate-300">@</span> untuk menyebut peran/nama, atau <span className="font-semibold text-slate-700 dark:text-slate-300">@all</span> untuk semua orang.
            </p>

            {/* Suggestions Popover */}
            {suggestionQuery !== null && (
              <div className="absolute z-10 w-full mt-1 bg-white dark:bg-[#18181B] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden animate-in slide-in-from-top-2">
                <div className="max-h-56 overflow-y-auto p-1.5">
                  {(() => {
                    const userOptions = allUsers.map(u => ({
                      role: u.username || u.id,
                      label: u.name
                    }));
                    const allOptions = [...ROLE_OPTIONS, ...userOptions, { role: 'all', label: 'Semua Divisi / Orang' }];
                    const filtered = allOptions.filter(r => 
                      r.role.toLowerCase().includes(suggestionQuery) || 
                      r.label.toLowerCase().includes(suggestionQuery)
                    );
                    
                    if (filtered.length === 0) {
                      return <div className="px-3 py-2 text-[12px] text-slate-500 text-center">Tidak ada yang cocok</div>;
                    }

                    return filtered.map(opt => (
                      <button
                        key={opt.role}
                        type="button"
                        onClick={() => handleSuggestionClick(opt.role)}
                        className="w-full text-left px-3 py-2 rounded-xl text-[13px] font-medium transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 flex flex-col"
                      >
                        <span className="text-slate-800 dark:text-slate-200">{opt.label}</span>
                        <span className="text-[11px] text-slate-400">@{opt.role}</span>
                      </button>
                    ));
                  })()}
                </div>
              </div>
            )}
          </div>

          <div className="pt-4 mt-2 border-t border-slate-100 dark:border-slate-800/60 flex justify-between gap-3 items-center">
            {editingTask && onDelete && (editingTask.createdBy === currentUser?.id || editingTask.createdBy === currentUser?.username) ? (
              <button
                type="button"
                onClick={() => onDelete(editingTask.id)}
                className="px-4 py-2.5 rounded-xl text-[13px] font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Hapus
              </button>
            ) : (
              <div></div>
            )}
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl text-[13px] font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[13px] font-bold shadow-lg shadow-blue-500/20 transition-colors flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                Simpan Agenda
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
