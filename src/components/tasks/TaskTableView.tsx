import React, { useState, useEffect, useRef } from 'react';
import { TaskItem, EvidenceFile, JenisTeknis, Timeline, BEISTaskStatus as TaskStatus, Prioritas, UserRole, BEISUserProfile as UserProfile } from '../../types';
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  Calendar, 
  ExternalLink, 
  MoreVertical, 
  Edit3, 
  Trash2, 
  CalendarPlus, 
  ChevronDown,
  Filter,
  ArrowUpDown,
  Sparkles,
  Link as LinkIcon,
  MessageSquare,
  ShieldCheck,
  Copy,
  Check,
  Plus,
  FileText,
  Award,
  History,
  ShieldAlert,
  Upload,
  X,
  Paperclip,
  Image as ImageIcon,
  Download,
  AlertTriangle,
  Camera,
  Search
} from 'lucide-react';
import { ActivityAbsenceModal } from '../common/ActivityAbsenceModal';
import { ArahanModal } from '../common/ArahanModal';
import { FilePreviewModal } from '../common/FilePreviewModal';
import { generateGoogleCalendarUrl } from '../../utils/exportUtils';
import { BEIS_STATUSES, BEIS_UNITS, BEIS_DOMAINS, getBeisBadgeClass, getBeisCategoriesForDomain, generateBeisTaskId, generateEvidenceId, runDataQualityEngine, calculateAging } from '../../utils/beisUtils';
import { BEISDomainCode } from '../../types';
import { useGetTaskEvidence, useUploadTaskEvidence } from '../../hooks/useTasks';
import { motion, AnimatePresence } from 'framer-motion';

const EvidenceThumbnail: React.FC<{ file: EvidenceFile }> = ({ file }) => {
  const { data, isLoading, isError } = useGetTaskEvidence(file.id);
  const objectUrl = data ? URL.createObjectURL(data) : undefined;

  // Cleanup object url to avoid memory leak
  useEffect(() => {
    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [objectUrl]);

  if (isLoading) {
    return <div className="w-8 h-8 rounded bg-gray-200 dark:bg-gray-700 animate-pulse shrink-0" />;
  }

  if (isError || !objectUrl) {
    return <div className="w-8 h-8 rounded bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shrink-0 flex items-center justify-center"><FileText className="w-4 h-4 text-gray-400" /></div>;
  }

  return <img src={objectUrl} alt={file.name} className="w-8 h-8 rounded object-cover border border-gray-200 dark:border-gray-700 shrink-0" />;
};

const ALL_CATEGORIES = BEIS_DOMAINS.flatMap(d => 
  d.categories.map(c => ({ ...c, domainCode: d.code, level: d.level }))
);

interface TaskTableViewProps {
  tasks: TaskItem[];
  userRole: UserRole;
  currentUser?: UserProfile;
  currentUserUnit?: string;
  onUpdateTask: (task: TaskItem) => void;
  onDeleteTask: (id: string) => void;
  onEditTask: (task: TaskItem) => void;
  onSyncCalendar: (task: TaskItem) => void;
  selectedTab: string;
  onQuickAddTask?: (deskripsi: string, jenisTeknis: JenisTeknis, timeline: Timeline, prioritas: Prioritas) => void;
  onAddTask?: () => void;
  isCutoffPassed?: boolean;
  isLoading?: boolean;
}

export const TaskTableView: React.FC<TaskTableViewProps> = ({
  tasks,
  userRole,
  currentUser,
  currentUserUnit,
  onUpdateTask,
  onDeleteTask,
  onEditTask,
  onSyncCalendar,
  selectedTab,
  onQuickAddTask,
  onAddTask,
  isCutoffPassed = false,
  isLoading = false
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterJenis, setFilterJenis] = useState<string>('ALL');
  const [filterPrioritas, setFilterPrioritas] = useState<string>('ALL');
  const [filterSearch, setFilterSearch] = useState<string>('');
  const [sortField, setSortField] = useState<'tanggal' | 'prioritas' | 'status'>('tanggal');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);

  // Audit Trail Modal State
  const [auditModalTask, setAuditModalTask] = useState<TaskItem | null>(null);
  const [copiedTaskId, setCopiedTaskId] = useState<string | null>(null);
  
  const [isAbsenceModalOpen, setIsAbsenceModalOpen] = useState(false);
  
  // Arahan Modal State
  const [arahanModalTask, setArahanModalTask] = useState<TaskItem | null>(null);

  // Evidence Input Modal State
  const [evidenceModalTask, setEvidenceModalTask] = useState<TaskItem | null>(null);
  const [evDomain, setEvDomain] = useState<BEISDomainCode>('CRD');
  const [evCategory, setEvCategory] = useState<string>('');
  const [evUnit, setEvUnit] = useState<string>(currentUserUnit || 'BIS');
  const [evUrl, setEvUrl] = useState<string>('');
  const [evFiles, setEvFiles] = useState<EvidenceFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewFile, setPreviewFile] = useState<EvidenceFile | null>(null);

  const [isEvCategoryOpen, setIsEvCategoryOpen] = useState(false);
  const [evCategorySearchQuery, setEvCategorySearchQuery] = useState('');
  const evCategoryDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (evCategoryDropdownRef.current && !evCategoryDropdownRef.current.contains(event.target as Node)) {
        setIsEvCategoryOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTaskId(text);
    setTimeout(() => setCopiedTaskId(null), 2000);
  };

  const handlePenyelesaianChange = (task: TaskItem, value: string) => {
    const finalEvidenceId = value.trim() ? (task.evidenceId || generateEvidenceId(task.taskId, 1)) : task.evidenceId;
    onUpdateTask({
      ...task,
      penyelesaian: value,
      evidenceId: finalEvidenceId,
      updatedAt: new Date().toISOString()
    });
  };

  const handleSaveArahan = (taskId: string, arahanA: string, arahanB: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (task && onUpdateTask) {
      onUpdateTask({
        ...task,
        arahanAtasan: arahanA,
        arahanAtasanUtama: arahanB,
        updatedAt: new Date().toISOString()
      });
    }
  };

  const openEvidenceModal = (task: TaskItem) => {
    setEvidenceModalTask(task);
    setEvDomain(task.beisDomain || 'CRD');
    const domainObj = BEIS_DOMAINS.find(d => d.code === (task.beisDomain || 'CRD'));
    setEvCategory(task.beisCategory || (domainObj?.categories[0]?.code || ''));
    setEvUnit(task.unit || currentUserUnit || 'BIS');
    setEvUrl(task.penyelesaian || '');
    setEvFiles(task.evidenceFiles || []);
  };

  const handleEvidenceSubmit = () => {
    if (!evidenceModalTask) return;
    const domainObj = BEIS_DOMAINS.find(d => d.code === evDomain);
    const level = domainObj?.level || 'L03';
    const newTaskId = generateBeisTaskId({
      level,
      domain: evDomain,
      category: evCategory,
      unit: evUnit,
      date: evidenceModalTask.tanggal,
      sequenceNumber: 1
    });
    const evidenceId = generateEvidenceId(newTaskId, 1);
    onUpdateTask({
      ...evidenceModalTask,
      penyelesaian: evUrl,
      evidenceId,
      taskId: newTaskId,
      beisLevel: level as any,
      beisDomain: evDomain,
      beisCategory: evCategory,
      unit: evUnit,
      evidenceFiles: evFiles,
      updatedAt: new Date().toISOString()
    });
    setEvidenceModalTask(null);
    setEvFiles([]);
  };

  const { mutateAsync: uploadEvidence } = useUploadTaskEvidence();

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || !evidenceModalTask) return;
    const maxSize = 10 * 1024 * 1024; // 10MB per file
    for (const file of Array.from(files)) {
      if (file.size > maxSize) {
        alert(`File "${file.name}" terlalu besar (maks 10MB).`);
        continue;
      }
      try {
        const response = await uploadEvidence({ taskId: evidenceModalTask.id, file });
        if (response.success) {
          setEvFiles(prev => [...prev, response.data]);
        }
      } catch (error) {
        console.error('Error uploading file:', error);
        alert(`Gagal mengupload file "${file.name}".`);
      }
    }
  };

  const removeEvFile = (fileId: string) => {
    setEvFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <ImageIcon className="w-3.5 h-3.5 text-gray-800 dark:text-gray-200" />;
    return <FileText className="w-3.5 h-3.5 text-amber-500" />;
  };

  const evCategories = getBeisCategoriesForDomain(evDomain);

  const getPriorityBadgeClass = (p: string) => {
    if (p === 'P1' || p === 'P2') {
      return 'text-red-600 dark:text-red-400 font-bold';
    }
    if (p === 'P3' || p === 'P4' || p === 'P5') {
      return 'text-amber-600 dark:text-amber-400 font-semibold';
    }
    return 'text-blue-600 dark:text-blue-400 font-medium';
  };

  // Filter tasks
  const filteredTasks = tasks.filter(t => {
    const isSuperAdmin = currentUser?.role === 'Super Admin' || currentUser?.roleTier === 'Super Admin' || currentUser?.roleTier === 'TOP' || currentUser?.role === 'Master Admin';
    if (!isSuperAdmin && currentUser) {
      const userNameLower = currentUser.name?.trim().toLowerCase() || '';
      const userTabLower = currentUser.assignedMemberTab?.trim().toLowerCase() || '';

      const isPic = 
        (t.assignedTo && userTabLower && t.assignedTo.trim().toLowerCase() === userTabLower) ||
        (t.pic && userTabLower && t.pic.trim().toLowerCase() === userTabLower) ||
        (t.assignedTo && userNameLower && t.assignedTo.trim().toLowerCase() === userNameLower) ||
        (t.pic && userNameLower && t.pic.trim().toLowerCase() === userNameLower);
      const isValidator = t.validator && t.validator.split(',').some((v: string) => v.trim().toLowerCase() === userNameLower);
      
      if (!isPic && !isValidator) return false;
    }

    if (filterStatus !== 'ALL' && t.status !== filterStatus) return false;
    if (filterJenis !== 'ALL' && t.jenisTeknis !== filterJenis) return false;
    if (filterPrioritas !== 'ALL' && t.prioritas !== filterPrioritas) return false;
    if (filterSearch.trim()) {
      const query = filterSearch.toLowerCase();
      const matchId = t.taskId ? t.taskId.toLowerCase().includes(query) : false;
      const matchDesc = t.deskripsiTugas ? t.deskripsiTugas.toLowerCase().includes(query) : false;
      const matchPic = t.assignedTo ? t.assignedTo.toLowerCase().includes(query) : false;
      const matchUnit = (t.unit || '').toLowerCase().includes(query);
      return matchId || matchDesc || matchPic || matchUnit;
    }
    return true;
  }).sort((a, b) => {
    if (sortField === 'tanggal') {
      return sortDirection === 'desc' 
        ? new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime()
        : new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime();
    }
    return 0;
  });

  const toggleSelectAll = () => {
    if (selectedTaskIds.length === filteredTasks.length) {
      setSelectedTaskIds([]);
    } else {
      setSelectedTaskIds(filteredTasks.map(t => t.id));
    }
  };

  const toggleSelectTask = (id: string) => {
    if (selectedTaskIds.includes(id)) {
      setSelectedTaskIds(selectedTaskIds.filter(i => i !== id));
    } else {
      setSelectedTaskIds([...selectedTaskIds, id]);
    }
  };

  const handleStatusChange = (task: TaskItem, newStatus: TaskStatus) => {
    const isClosing = newStatus === 'Validated Closed' || (newStatus as string) === 'Selesai';
    onUpdateTask({
      ...task,
      status: newStatus,
      closedDate: isClosing ? new Date().toISOString().split('T')[0] : task.closedDate,
      updatedAt: new Date().toISOString()
    });
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#F9F9FB] dark:bg-[#121214]">


      {/* Top Filter Bar */}
      <div className="p-4 sm:p-6 pb-2 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* BEIS Search Input */}
          <div className="relative">
            <input
              type="text"
              value={filterSearch}
              onChange={(e) => setFilterSearch(e.target.value)}
              placeholder="Cari Task ID, Deskripsi, Unit..."
              className="bg-white dark:bg-[#18181A] border border-gray-200/80 dark:border-gray-800 rounded-xl px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 shadow-xs w-52"
            />
          </div>

          {/* Status BEIS Filter */}
          <div className="relative">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="appearance-none bg-white dark:bg-[#18181A] border border-gray-200/80 dark:border-gray-800 rounded-xl px-3 py-1.5 pr-8 text-xs font-bold text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 shadow-xs"
            >
              <option value="ALL">Semua Status BEIS</option>
              {BEIS_STATUSES.map(s => (
                <option key={s.code} value={s.code}>
                  {s.label}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-2.5 text-gray-400 pointer-events-none" />
          </div>

          {/* Jenis Teknis Filter */}
          <div className="relative">
            <select
              value={filterJenis}
              onChange={(e) => setFilterJenis(e.target.value)}
              className="appearance-none bg-white dark:bg-[#18181A] border border-gray-200/80 dark:border-gray-800 rounded-xl px-3 py-1.5 pr-8 text-xs font-bold text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 shadow-xs"
            >
              <option value="ALL">Semua Jenis Teknis</option>
              <option value="Rutin">Rutin</option>
              <option value="Project">Project</option>
              <option value="Inisiatif">Inisiatif</option>
              <option value="Arahan Pimpinan">Arahan Pimpinan</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-2.5 text-gray-400 pointer-events-none" />
          </div>

          {/* Prioritas Filter */}
          <div className="relative">
            <select
              value={filterPrioritas}
              onChange={(e) => setFilterPrioritas(e.target.value)}
              className="appearance-none bg-white dark:bg-[#18181A] border border-gray-200/80 dark:border-gray-800 rounded-xl px-3 py-1.5 pr-8 text-xs font-bold text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 shadow-xs"
            >
              <option value="ALL">Semua Prioritas</option>
              <option value="P1">P1</option>
              <option value="P2">P2</option>
              <option value="P3">P3</option>
              <option value="P4">P4</option>
              <option value="P5">P5</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-2.5 text-gray-400 pointer-events-none" />
          </div>

          <span className="text-xs text-gray-400 dark:text-gray-500 ml-1">
            Menampilkan <strong className="text-gray-700 dark:text-gray-200">{filteredTasks.length}</strong> aktivitas
          </span>
          <button
            onClick={() => onAddTask?.()}
            disabled={isCutoffPassed && userRole === 'Staff / Member'}
            className={`flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all shadow-sm shrink-0 ${
              isCutoffPassed && userRole === 'Staff / Member'
                ? 'bg-gray-200 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
                : 'bg-gray-900 hover:bg-black dark:bg-white dark:hover:bg-gray-200 text-white dark:text-gray-900 shadow-sm'
            }`}
          >
            <Plus className="w-4 h-4" />
            Input Aktivitas
          </button>
        </div>

        {/* Selected Batch Bar */}
        {selectedTaskIds.length > 0 && (
          <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 px-3 py-1.5 rounded-xl text-xs font-medium border border-emerald-200/60 dark:border-emerald-800/40 animate-fade-in">
            <span>{selectedTaskIds.length} dipilih</span>
            <button 
              onClick={() => {
                tasks.filter(t => selectedTaskIds.includes(t.id)).forEach(t => {
                  onUpdateTask({ 
                    ...t, 
                    status: 'Validated Closed', 
                    closedDate: new Date().toISOString().split('T')[0] 
                  });
                });
                setSelectedTaskIds([]);
              }}
              className="px-2 py-0.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-[11px] font-semibold"
            >
              Tandai Validated Closed
            </button>
          </div>
        )}
      </div>

      {/* Main Table Container - Editorial Responsive Table */}
      <div className="p-4 sm:p-6 pt-2 flex-1">
        <div className="bg-white dark:bg-[#18181A] rounded-3xl border border-gray-100 dark:border-gray-800/80 shadow-xs overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1100px]">
            <thead>
              <tr className="bg-gray-50/80 dark:bg-gray-800/40 border-b border-gray-100 dark:border-gray-800 text-xs uppercase tracking-wider font-bold text-gray-400 dark:text-gray-500">
                <th className="py-5 px-5 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={selectedTaskIds.length === filteredTasks.length && filteredTasks.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                </th>

                {selectedTab === 'REKAP PUSAT' && <th className="py-5 px-4 w-24">PIC</th>}
                <th className="py-5 px-5">Deskripsi Aktivitas</th>
                <th className="py-5 px-5 max-w-xs">Arahan Atasan</th>
                <th className="py-5 px-4 w-20">Prioritas</th>
                <th className="py-5 px-4 w-20">Aging</th>
                <th className="py-5 px-4 w-36">Status BEIS</th>
                <th className="py-5 px-4 w-48">Evidence (E01) / Result</th>
                <th className="py-5 px-4 w-28">Validator</th>
                <th className="py-5 px-4 w-20 text-right pr-5">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60 text-xs text-gray-800 dark:text-gray-200">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={`loading-${i}`} className="animate-pulse bg-white dark:bg-[#18181A]">
                    <td className="px-4 py-4"><div className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded"></div></td>
                    <td className="px-4 py-4"><div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div></td>
                    <td className="px-4 py-4"><div className="h-4 w-48 bg-gray-200 dark:bg-gray-700 rounded"></div></td>
                    <td className="px-4 py-4"><div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div></td>
                    <td className="px-4 py-4"><div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div></td>
                    <td className="px-4 py-4"><div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div></td>
                    <td className="px-4 py-4"><div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div></td>
                    <td className="px-4 py-4"><div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div></td>
                    <td className="px-4 py-4"><div className="h-4 w-8 bg-gray-200 dark:bg-gray-700 rounded"></div></td>
                  </tr>
                ))
              ) : filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={selectedTab === 'REKAP PUSAT' ? 9 : 8} className="py-12 text-center text-gray-400 dark:text-gray-500">
                    <div className="max-w-xs mx-auto space-y-2">
                      <Sparkles className="w-8 h-8 text-gray-300 mx-auto" />
                      <p className="font-semibold text-gray-700 dark:text-gray-300">Tidak ada aktivitas BEIS ditemukan</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Belum ada data tugas yang sesuai dengan pencarian atau filter status.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                <AnimatePresence mode="popLayout">
                {filteredTasks.map((t, index) => {
                  const isChecked = selectedTaskIds.includes(t.id);
                  const isClosed = t.status === 'Validated Closed' || (t.status as string) === 'Selesai';
                  const dqResult = runDataQualityEngine(t);

                  return (
                    <motion.tr 
                      layout
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                      transition={{ duration: 0.3, delay: Math.min(index * 0.05, 0.5) }}
                      key={t.id}
                      className={`hover:bg-emerald-50/20 dark:hover:bg-emerald-950/20 transition-colors ${
                        isClosed ? 'opacity-75 bg-gray-50/40 dark:bg-gray-900/20' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3.5 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSelectTask(t.id)}
                          className="rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                        />
                      </td>

                      {/* Member Tab Name (Rekap Mode) */}
                      {selectedTab === 'REKAP PUSAT' && (
                        <td className="py-3.5 px-3 font-bold text-gray-900 dark:text-white">
                          <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded-md text-[10px]">
                            {t.assignedTo}
                          </span>
                        </td>
                      )}

                      {/* Deskripsi Aktivitas */}
                      <td className="py-3.5 px-4 max-w-sm">
                        <div className="space-y-1.5">
                          <div className="font-semibold text-gray-900 dark:text-white leading-snug">
                            {isClosed ? (
                              <span className="line-through text-gray-400 dark:text-gray-500">{t.deskripsiTugas}</span>
                            ) : (
                              t.deskripsiTugas
                            )}
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            {/* Task ID with Copy */}
                            <div className="flex items-center gap-1 group">
                              <span className="bg-gray-100 dark:bg-gray-800/90 px-1.5 py-0.5 rounded text-[10px] text-emerald-700 dark:text-emerald-400 border border-gray-200/80 dark:border-gray-700 font-mono font-bold whitespace-nowrap">
                                {t.taskId}
                              </span>
                              {dqResult.length > 0 && (
                                <div className="group/tooltip relative">
                                  <ShieldAlert className="w-3.5 h-3.5 text-red-500" />
                                  <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover/tooltip:block w-48 bg-gray-900 text-white text-[10px] p-2 rounded z-10 shadow-lg">
                                    <ul className="list-disc pl-3">
                                      {dqResult.map((flag, idx) => <li key={idx}>{flag}</li>)}
                                    </ul>
                                  </div>
                                </div>
                              )}
                              <button
                                onClick={() => copyToClipboard(t.taskId)}
                                className="opacity-0 group-hover:opacity-100 p-0.5 text-gray-400 hover:text-emerald-600 transition-all"
                                title="Salin Task ID"
                              >
                                {copiedTaskId === t.taskId ? <Check className="w-3 h-3 text-gray-800 dark:text-gray-200" /> : <Copy className="w-3 h-3" />}
                              </button>
                            </div>

                            {/* Unit & Level */}
                            <div className="flex items-center gap-1 text-[10px] bg-blue-50/50 dark:bg-blue-900/20 px-1.5 py-0.5 rounded border border-blue-100/50 dark:border-blue-800/30">
                              <span className="font-bold text-blue-900 dark:text-blue-300 uppercase">{t.unit || 'BIS'}</span>
                              <span className="text-blue-600/70 dark:text-blue-400/70 font-mono">[{t.beisLevel || 'L03'}] {t.beisDomain || 'CRD'}</span>
                            </div>
                          </div>

                          {t.outputDoD && (
                            <p className="text-[10px] text-gray-500 dark:text-gray-400 font-serif italic">
                              Target DoD: {t.outputDoD}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Arahan Atasan (B -> A -> Staff) */}
                      <td 
                        className="py-3.5 px-4 max-w-xs cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors rounded-xl"
                        onClick={() => setArahanModalTask(t)}
                        title="Klik untuk melihat atau mengedit Arahan Atasan"
                      >
                        <div className="flex items-start justify-between gap-2 group">
                          <div className="space-y-1 text-[11px] w-full">
                            {t.arahanAtasanUtama && (
                              <div className="text-purple-900 dark:text-purple-300 bg-purple-50/80 dark:bg-purple-950/40 p-1.5 rounded-lg border border-purple-100 dark:border-purple-900/40 font-serif italic">
                                <span className="font-sans font-bold not-italic text-[10px] text-purple-700 dark:text-purple-400 block">👑 B → A:</span>
                                <span className="line-clamp-2">{t.arahanAtasanUtama}</span>
                              </div>
                            )}
                            {t.arahanAtasan && (
                              <div className="text-blue-900 dark:text-blue-300 bg-blue-50/80 dark:bg-blue-950/40 p-1.5 rounded-lg border border-blue-100 dark:border-blue-900/40 font-serif italic">
                                <span className="font-sans font-bold not-italic text-[10px] text-blue-700 dark:text-blue-400 block">👔 A → Staff:</span>
                                <span className="line-clamp-2">{t.arahanAtasan}</span>
                              </div>
                            )}
                            {!t.arahanAtasanUtama && !t.arahanAtasan && (
                              <div className="text-center w-full">
                                <span className="text-gray-400 dark:text-gray-500 italic font-serif text-[10px] border border-dashed border-gray-300 dark:border-gray-700 rounded p-1 block hover:bg-gray-200 dark:hover:bg-gray-700">
                                  + Tambah Arahan
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Prioritas */}
                      <td className={`py-3.5 px-3 font-medium ${getPriorityBadgeClass(t.prioritas)}`}>
                        {t.prioritas}
                      </td>

                      {/* Aging */}
                      <td className="py-3.5 px-3 font-medium text-gray-700 dark:text-gray-300">
                        {calculateAging(t.tanggal, t.status)} Hari
                      </td>

                      {/* Status Dropdown (BEIS Standard) */}
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-1.5">
                          <select
                            value={t.status}
                            onChange={(e) => handleStatusChange(t, e.target.value as TaskStatus)}
                            className={`text-xs font-bold px-2 py-1 rounded-xl border cursor-pointer focus:outline-none transition-all ${getBeisBadgeClass(t.status)}`}
                          >
                            {BEIS_STATUSES.filter(s => {
                              if (s.code === t.status) return true;
                              if (s.code === 'Validated Closed' || s.code === 'Improved') return false;
                              
                              const isValidator = currentUser?.name && t.validator && t.validator.split(',').some((v: string) => v.trim().toLowerCase() === currentUser.name.toLowerCase());
                              const isSuperAdmin = userRole === 'Super Admin';
                              
                              if (!isValidator && !isSuperAdmin) {
                                return s.code === 'Planned' || s.code === 'In Progress';
                              }
                              return true;
                            }).map(s => (
                              <option key={s.code} value={s.code}>
                                {s.label}
                              </option>
                            ))}
                          </select>
                          <button
                            onClick={() => onEditTask(t)}
                            className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            title="Buka / Edit Detail Task"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                      {/* Evidence / Penyelesaian (Input Evidence Button + Info) */}
                      <td className="py-2.5 px-3">
                        <div className="flex flex-col gap-1.5 min-w-[160px]">
                          <button
                            onClick={() => openEvidenceModal(t)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
                          >
                            <Upload className="w-3 h-3" />
                            Input Evidence
                          </button>
                          {t.penyelesaian && (
                            <div className="flex items-center gap-1">
                              <span className="text-[9px] text-gray-500 dark:text-gray-400 truncate max-w-[120px] font-mono" title={t.penyelesaian}>
                                {t.penyelesaian}
                              </span>
                              <a
                                href={t.penyelesaian.startsWith('http') ? t.penyelesaian : `https://${t.penyelesaian}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-0.5 text-emerald-600 hover:text-emerald-700 bg-emerald-50 dark:bg-emerald-950 rounded shrink-0"
                                title="Buka Evidence"
                              >
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                          )}
                          {t.evidenceLink && (
                            <div className="flex items-center gap-1 mt-1">
                              <span className="text-[9px] text-gray-500 dark:text-gray-400 truncate max-w-[120px] font-mono" title={t.evidenceLink}>
                                {t.evidenceLink}
                              </span>
                              <a
                                href={t.evidenceLink.startsWith('http') ? t.evidenceLink : `https://${t.evidenceLink}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-0.5 text-blue-600 hover:text-blue-700 bg-blue-50 dark:bg-blue-950 rounded shrink-0"
                                title="Buka Link Evidence (Baru)"
                              >
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                          )}
                          {t.evidenceId && (
                            <span className="text-[9px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
                              {t.evidenceId}
                            </span>
                          )}
                          {t.evidenceFiles && t.evidenceFiles.length > 0 && (
                            <div className="flex flex-col gap-1.5 mt-2">
                              {t.evidenceFiles.map(f => (
                                <div key={f.id} className="flex items-center gap-1.5 group/file bg-gray-50 dark:bg-gray-800/40 p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors cursor-pointer" onClick={() => setPreviewFile(f)}>
                                  {f.type.startsWith('image/') ? (
                                    <ImageIcon className="w-3.5 h-3.5 text-gray-800 dark:text-gray-200 shrink-0" />
                                  ) : (
                                    <FileText className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                  )}
                                  <span className="text-[10px] text-gray-700 dark:text-gray-300 group-hover/file:text-emerald-600 dark:group-hover/file:text-emerald-400 font-medium truncate max-w-[120px]" title={`Preview ${f.name}`}>
                                    {f.name}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Validator */}
                      <td className="py-3.5 px-3 font-medium text-gray-500 dark:text-gray-400 text-[11px] whitespace-nowrap">
                        {t.validator || 'Pak Taka'}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-3 text-right pr-4">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setAuditModalTask(t)}
                            className="p-1.5 text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            title="Lihat Audit Trail BEIS"
                          >
                            <History className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onSyncCalendar(t)}
                            className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            title="Sinkron Calendar"
                          >
                            <CalendarPlus className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onEditTask(t)}
                            className="p-1.5 text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            title="Edit Aktivitas"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          {userRole !== 'Staff / Member' && (
                            <button
                              onClick={() => onDeleteTask(t.id)}
                              className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                              title="Hapus Aktivitas"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
                </AnimatePresence>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Audit Trail Log Modal */}
      {auditModalTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-[#18181A] w-full max-w-lg rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-gray-800 dark:text-gray-200 dark:text-gray-800 dark:text-gray-200" />
                <div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">Audit Trail Record BEIS</h3>
                  <p className="text-xs font-mono text-emerald-600">{auditModalTask.taskId}</p>
                </div>
              </div>
              <button 
                onClick={() => setAuditModalTask(null)}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1 text-xs">
              <div className="p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl space-y-1">
                <p className="font-bold text-gray-900 dark:text-white">{auditModalTask.deskripsiTugas}</p>
                <div className="flex flex-wrap gap-2 text-[10px] text-gray-500 font-mono pt-1">
                  <span>Unit: {auditModalTask.unit}</span>
                  <span>Domain: {auditModalTask.beisDomain}</span>
                  <span>PIC: {auditModalTask.assignedTo}</span>
                  <span>Validator: {auditModalTask.validator}</span>
                </div>
              </div>

              <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-3 space-y-2">
                <p className="font-bold text-gray-700 dark:border-gray-300 flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4 text-gray-800 dark:text-gray-200" />
                  <span>Log Aktivitas & Perubahan (Audit Log)</span>
                </p>

                {auditModalTask.auditTrail && auditModalTask.auditTrail.length > 0 ? (
                  <div className="space-y-2 pt-1">
                    {auditModalTask.auditTrail.map((log) => (
                      <div key={log.id} className="p-2 bg-gray-50 dark:bg-gray-800/40 rounded-lg space-y-1 border-l-2 border-emerald-500">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="font-bold text-gray-800 dark:text-gray-200">{log.action}</span>
                          <span className="text-gray-400 font-mono">{new Date(log.timestamp).toLocaleString()}</span>
                        </div>
                        <p className="text-[11px] text-gray-600 dark:text-gray-300">{log.details}</p>
                        <span className="text-[9px] text-gray-400">Oleh: {log.user}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-400 text-[11px]">
                    Record dibuat otomatis pada {auditModalTask.tanggal} oleh {auditModalTask.assignedTo}. Status: {auditModalTask.status}.
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end pt-2">
              <button
                onClick={() => setAuditModalTask(null)}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-500/20"
              >
                Tutup Audit Log
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Evidence Input Modal */}
      {evidenceModalTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-[#18181A] w-full max-w-md rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl">
                  <Upload className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-sm">Input Evidence</h3>
                  <span className="text-[10px] uppercase font-bold text-gray-400">Task: {evidenceModalTask.taskId}</span>
                </div>
              </div>
              <button
                onClick={() => setEvidenceModalTask(null)}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            {/* Task Info */}
            <div className="bg-slate-50 dark:bg-gray-800/50 rounded-xl p-3">
              <p className="text-xs font-semibold text-gray-900 dark:text-white">{evidenceModalTask.deskripsiTugas}</p>
              <p className="text-[10px] text-gray-500 mt-1">PIC: {evidenceModalTask.assignedTo} • Deadline: {evidenceModalTask.deadline || '-'}</p>
            </div>

            {/* Domain BEIS */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Domain BEIS</label>
              <select
                value={evDomain}
                onChange={(e) => {
                  const newDomain = e.target.value as BEISDomainCode;
                  setEvDomain(newDomain);
                  const domainObj = BEIS_DOMAINS.find(d => d.code === newDomain);
                  setEvCategory(domainObj?.categories[0]?.code || '');
                }}
                className="w-full px-3 py-2 text-xs bg-white dark:bg-gray-800/90 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
              >
                {BEIS_DOMAINS.map(d => (
                  <option key={d.code} value={d.code}>
                    [{d.level}] {d.code} — {d.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Kategori BEIS */}
            <div className="space-y-1.5 relative" ref={evCategoryDropdownRef}>
              <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Kategori BEIS</label>
              <div 
                className="relative w-full cursor-pointer"
                onClick={() => setIsEvCategoryOpen(!isEvCategoryOpen)}
              >
                <div className="w-full flex items-center justify-between px-3 py-2 text-xs bg-white dark:bg-gray-800/90 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium">
                  <span className="truncate pr-2">
                    {evCategory} - {ALL_CATEGORIES.find(c => c.code === evCategory)?.label || ''}
                  </span>
                  <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
                </div>
              </div>

              {isEvCategoryOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg max-h-60 flex flex-col overflow-hidden">
                  <div className="p-2 border-b border-gray-100 dark:border-gray-700 relative flex items-center">
                    <Search className="w-3.5 h-3.5 text-gray-400 absolute left-4" />
                    <input
                      autoFocus
                      type="text"
                      placeholder="Cari..."
                      value={evCategorySearchQuery}
                      onChange={(e) => setEvCategorySearchQuery(e.target.value)}
                      className="w-full pl-7 pr-2 py-1.5 text-xs bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 text-gray-900 dark:text-white"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                  <div className="overflow-y-auto p-1 flex-1">
                    {ALL_CATEGORIES.filter(c => `${c.code} ${c.label}`.toLowerCase().includes(evCategorySearchQuery.toLowerCase())).length === 0 ? (
                      <div className="px-3 py-2 text-xs text-gray-500 text-center">Tidak ditemukan</div>
                    ) : (
                      ALL_CATEGORIES.filter(c => `${c.code} ${c.label}`.toLowerCase().includes(evCategorySearchQuery.toLowerCase())).map(c => (
                        <div
                          key={c.code}
                          onClick={() => {
                            setEvCategory(c.code);
                            setEvDomain(c.domainCode); // Update domain too
                            setIsEvCategoryOpen(false);
                            setEvCategorySearchQuery('');
                          }}
                          className={`px-2.5 py-1.5 text-[11px] font-mono font-bold cursor-pointer rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/30 truncate ${
                            evCategory === c.code 
                              ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' 
                              : 'text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          {c.code} - {c.label}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Unit Operasional */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Unit Operasional</label>
              <select
                value={evUnit}
                onChange={(e) => setEvUnit(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white dark:bg-gray-800/90 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
              >
                {BEIS_UNITS.map(u => (
                  <option key={u.code} value={u.code}>
                    {u.code} — {u.label}
                  </option>
                ))}
              </select>
            </div>

            {/* URL / Link Evidence */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">URL / Link Evidence</label>
              <input
                type="text"
                value={evUrl}
                onChange={(e) => setEvUrl(e.target.value)}
                placeholder="https://drive.google.com/... atau catatan evidence"
                className="w-full px-3 py-2 text-xs bg-white dark:bg-gray-800/90 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
              />
            </div>

            {/* Upload File Evidence */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Upload File Evidence</label>
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  handleFileUpload(e.dataTransfer.files);
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`relative w-full border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all duration-200 ${
                  isDragging
                    ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-950/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-emerald-300 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv"
                  onChange={(e) => {
                    handleFileUpload(e.target.files);
                    e.target.value = '';
                  }}
                  className="hidden"
                />
                <Upload className={`w-5 h-5 mx-auto mb-1 ${isDragging ? 'text-emerald-500' : 'text-gray-400'}`} />
                <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400">
                  {isDragging ? 'Lepaskan file di sini...' : 'Drag & drop atau klik untuk upload'}
                </p>
                <p className="text-[9px] text-gray-400 mt-0.5">
                  Gambar, PDF, Dokumen — Maks 10MB per file
                </p>
              </div>

              {/* Uploaded Files List */}
              {evFiles.length > 0 && (
                <div className="space-y-1.5 mt-2 max-h-[120px] overflow-y-auto">
                  {evFiles.map(f => (
                    <div key={f.id} className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg px-2.5 py-1.5 group">
                      {getFileIcon(f.type)}
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-semibold text-gray-700 dark:text-gray-300 truncate">{f.name}</p>
                        <p className="text-[9px] text-gray-400">{formatFileSize(f.size)}</p>
                      </div>
                      {f.type.startsWith('image/') && (
                        <EvidenceThumbnail file={f} />
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); removeEvFile(f.id); }}
                        className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded transition-colors shrink-0 opacity-0 group-hover:opacity-100"
                        title="Hapus file"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Preview Evidence ID */}
            <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl p-3">
              <p className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 tracking-wider mb-1">Preview Evidence ID</p>
              <p className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-300 break-all">
                {generateEvidenceId(
                  generateBeisTaskId({
                    level: BEIS_DOMAINS.find(d => d.code === evDomain)?.level || 'L03',
                    domain: evDomain,
                    category: evCategory,
                    unit: evUnit,
                    date: evidenceModalTask.tanggal,
                    sequenceNumber: 1
                  }),
                  1
                )}
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                onClick={() => setEvidenceModalTask(null)}
                className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleEvidenceSubmit}
                className="px-5 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-500/20 hover:shadow-lg transition-all"
              >
                Simpan Evidence
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <ActivityAbsenceModal 
        isOpen={isAbsenceModalOpen} 
        onClose={() => setIsAbsenceModalOpen(false)} 
        userRole={userRole}
      />
      <ArahanModal 
        isOpen={!!arahanModalTask}
        onClose={() => setArahanModalTask(null)}
        task={arahanModalTask}
        onSave={handleSaveArahan}
        userRole={userRole}
        currentUser={currentUser}
      />
      {/* File Preview Modal */}
      <FilePreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />


    </div>
  );
};
