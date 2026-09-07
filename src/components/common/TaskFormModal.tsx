import React, { useState, useEffect, useRef } from 'react';
import { TaskItem, JenisTeknis, Timeline, Prioritas, BEISTaskItemStatus as TaskStatus, BEISUserRole as UserRole, BEISLevelCode, BEISDomainCode, BEISUserProfile as UserProfile, Category, Subcategory } from '../../types';
import { BEIS_DOMAINS, BEIS_STATUSES, BEIS_UNITS, generateBeisTaskId, generateEvidenceId, sanitizePersonalData, getBeisCategoriesForDomain } from '../../utils/beisUtils';
import { INITIAL_USERS } from '../../mock/initialData';
import { useApp } from '../../context/AppContext';
import { X, Calendar, Check, ShieldCheck, ShieldAlert, Award, Search, ChevronDown } from 'lucide-react';

// Statuses that staff can pick when creating/editing tasks
// Validated Closed and Improved are decision-only (set in Decision Queue)
const FORM_STATUSES = BEIS_STATUSES.filter(
  s => s.code !== 'Validated Closed' && s.code !== 'Improved'
);

const ALL_CATEGORIES = BEIS_DOMAINS.flatMap(d => 
  d.categories.map(c => ({ ...c, domainCode: d.code, level: d.level }))
);

const SUBCATEGORY_MAPPING: Record<Category, Subcategory[]> = {
  'Bisnis': [
    'Aktivitas Umum, AM dan Bisnis',
    'Fungsi Adaptasi Teknologi/Penerapan Pembelajaran Baru',
    'Fungsi Pengembangan Kredit',
    'Fungsi Pengembangan Tabungan',
    'Fungsi Kolaborasi Program Bisnis Antar Divisi/Kantor Kas'
  ],
  'Audit': [
    'Aktivitas Umum, AM dan Audit',
    'Fungsi Adaptasi Teknologi/Penerapan Pembelajaran Baru',
    'Fungsi Audit Improvement System',
    'Fungsi Cost Reduction'
  ],
  'Kepatuhan': [
    'Fungsi Adaptasi Teknologi/Penerapan Pembelajaran Baru',
    'Fungsi Kolaborasi Tata Kelola',
    'Fungsi Tata Kelola Mitigasi Kredit dan Resiko'
  ],
  'Staff/Operasional': [
    'Aktivitas Harian',
    'Kolaborasi',
    'Adaptasi Teknologi/Penerapan Pembelajaran Baru',
    'Inisiatif'
  ],
  'Account Officer': [
    'Maintenance',
    'Prospek'
  ],
  'Senior Account Officer Funding': [
    'Maintenance',
    'Prospek',
    'Pengembangan Wilayah Baru'
  ],
  'Kepala Kantor Kas': [
    'Rutinitas Harian',
    'Kolaborasi',
    'Adaptasi Teknologi Pembelajaran Baru'
  ],
  'Collection': [
    'Selling',
    'Collecting'
  ],
  'Lainnya': ['Lainnya']
};

// Mapping kode unit (saat registrasi) → Fungsi/Jabatan default
const UNIT_TO_CATEGORY: Record<string, Category> = {
  'DIR': 'Lainnya',
  'BIS': 'Bisnis',
  'KPT': 'Kepatuhan',
  'AUD': 'Audit',
  'PMO': 'Staff/Operasional',
  'OPS': 'Staff/Operasional',
  'COL': 'Collection',
  'FND': 'Senior Account Officer Funding',
  'HCM': 'Staff/Operasional',
  'ITD': 'Staff/Operasional',
  'LGL': 'Staff/Operasional',
  'KOM': 'Lainnya'
};

interface TaskFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Partial<TaskItem>) => void;
  editingTask?: TaskItem | null;
  defaultMemberTab: string;
  userRole: UserRole;
  currentUser?: UserProfile;
  currentUserUnit?: string;
  isCutoffPassed?: boolean;
}

export const TaskFormModal: React.FC<TaskFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingTask,
  defaultMemberTab,
  userRole,
  currentUser,
  currentUserUnit,
  isCutoffPassed = false
}) => {
  const isStaff = userRole === 'Staff / Member';
  const isNewTask = !editingTask;
  const isLockedForStaff = isCutoffPassed && isStaff && isNewTask;

  // Get taskRoutes from context to determine PIC based on admin routing
  const { taskRoutes, allUsers } = useApp();
  
  // Resolve PIC: use routing from admin if available, otherwise use current user's tab
  const getRoutedPIC = () => {
    if (currentUser?.id && taskRoutes[currentUser.id]) {
      const supervisorId = taskRoutes[currentUser.id];
      // Find supervisor name from allUsers or INITIAL_USERS
      const supervisor = [...allUsers, ...INITIAL_USERS].find(u => u.id === supervisorId);
      return supervisor?.name || supervisorId;
    }
    return currentUser?.assignedMemberTab || (defaultMemberTab === 'REKAP PUSAT' ? currentUser?.name || defaultMemberTab : defaultMemberTab);
  };
  const autoAssignedTo = getRoutedPIC();

  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [deskripsiTugas, setDeskripsiTugas] = useState('');
  const [jenisTeknis, setJenisTeknis] = useState<JenisTeknis>('Rutinitas Harian');
  const [timeline, setTimeline] = useState<Timeline>('Harian');
  const [prioritas, setPrioritas] = useState<Prioritas>('P1');
  const [status, setStatus] = useState<TaskStatus>('In Progress');
  const [tanggalFU, setTanggalFU] = useState('');
  const [penyelesaian, setPenyelesaian] = useState('');
  const [syncCalendar, setSyncCalendar] = useState(true);

  // BEIS Fields
  const [beisDomain, setBeisDomain] = useState<BEISDomainCode>('CRD');
  const [beisLevel, setBeisLevel] = useState<BEISLevelCode>('L03');
  const [beisCategory, setBeisCategory] = useState<string>('AKR');
  const [unit, setUnit] = useState<string>('BIS');
  const [outputDoD, setOutputDoD] = useState<string>('');
  const [outputDoD2, setOutputDoD2] = useState<string>('');
  const [outcome, setOutcome] = useState<string>('');
  const [category, setCategory] = useState<Category>('Bisnis');
  const [subcategory, setSubcategory] = useState<Subcategory>('Aktivitas Umum, AM dan Bisnis');
  const [validatorTags, setValidatorTags] = useState<string[]>([]);
  const [validatorInput, setValidatorInput] = useState<string>('');
  const [privacyWarning, setPrivacyWarning] = useState<boolean>(false);

  // Searchable Category Dropdown State
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [categorySearchQuery, setCategorySearchQuery] = useState('');
  const categoryDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target as Node)) {
        setIsCategoryOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (editingTask) {
      setTanggal(editingTask.tanggal || new Date().toISOString().split('T')[0]);
      setDeskripsiTugas(editingTask.deskripsiTugas || '');
      setJenisTeknis(editingTask.jenisTeknis || 'Rutinitas Harian');
      setTimeline(editingTask.timeline || 'Harian');
      setPrioritas(editingTask.prioritas || 'P1');
      setStatus(editingTask.status || 'In Progress');
      setTanggalFU(editingTask.tanggalFU || '');
      setPenyelesaian(editingTask.penyelesaian || '');
      setSyncCalendar(editingTask.syncedToCalendar ?? true);

      // BEIS
      setBeisDomain(editingTask.beisDomain || 'CRD');
      setBeisLevel(editingTask.beisLevel || 'L03');
      setBeisCategory(editingTask.beisCategory || 'AKR');
      setUnit(editingTask.unit || 'BIS');
      setOutputDoD(editingTask.outputDoD || '');
      setOutputDoD2(editingTask.outputDoD2 || '');
      setOutcome(editingTask.outcome || '');
      setCategory(editingTask.category || 'Bisnis');
      setSubcategory(editingTask.subcategory || 'Aktivitas Umum, AM dan Bisnis');
      setValidatorTags(editingTask.validator ? editingTask.validator.split(',').map(s => s.trim()) : []);
    } else {
      setTanggal(new Date().toISOString().split('T')[0]);
      setDeskripsiTugas('');
      setJenisTeknis('Rutinitas Harian');
      setTimeline('Harian');
      setPrioritas('P1');
      setStatus('In Progress');
      setTanggalFU('');
      setPenyelesaian('');
      setOutputDoD('');
      setOutputDoD2('');
      setOutcome('');
      setSyncCalendar(true);

      // BEIS Defaults
      setBeisDomain('CRD');
      setBeisLevel('L03');
      setBeisCategory('AKR');
      setUnit(currentUserUnit || 'BIS');
      setOutputDoD('');
      setOutcome('');
      // Auto-set Fungsi/Jabatan based on user's unit code
      const userUnit = currentUserUnit || currentUser?.unit || 'BIS';
      const autoCategory = UNIT_TO_CATEGORY[userUnit] || 'Lainnya';
      setCategory(autoCategory);
      const autoSubcategory = SUBCATEGORY_MAPPING[autoCategory]?.[0] || 'Lainnya';
      setSubcategory(autoSubcategory as Subcategory);
      setValidatorTags([]);
      setValidatorInput('');
    }
  }, [editingTask, defaultMemberTab, isOpen, autoAssignedTo]);

  // When domain changes, auto update level & default category
  const handleDomainChange = (domainCode: BEISDomainCode) => {
    setBeisDomain(domainCode);
    const domainObj = BEIS_DOMAINS.find(d => d.code === domainCode);
    if (domainObj) {
      setBeisLevel(domainObj.level);
      if (domainObj.defaultCategories.length > 0) {
        setBeisCategory(domainObj.defaultCategories[0]);
      }
    }
  };

  const handleCategoryChange = (catCode: string) => {
    setBeisCategory(catCode);
    const cat = ALL_CATEGORIES.find(c => c.code === catCode);
    if (cat) {
      setBeisDomain(cat.domainCode);
      setBeisLevel(cat.level);
    }
  };

  const handleDescriptionChange = (text: string) => {
    const { cleanText, detectedSensitive } = sanitizePersonalData(text);
    setDeskripsiTugas(cleanText);
    setPrivacyWarning(detectedSensitive);
  };

  if (!isOpen) return null;

  // Auto preview Task ID
  const previewTaskId = editingTask?.taskId || generateBeisTaskId({
    level: beisLevel,
    domain: beisDomain,
    category: beisCategory,
    unit: unit,
    date: tanggal,
    sequenceNumber: 1
  });

  // Auto-generate Case ID
  const autoCaseId = editingTask?.parentCaseId || `CASE-${Date.now().toString(36).toUpperCase()}`;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deskripsiTugas.trim()) return;

    if (isNewTask) {
      if (!outputDoD.trim() || !tanggalFU || !prioritas) {
        alert("Untuk tugas baru, Anda wajib mengisi Output Target, Deadline (Tanggal FU), dan Prioritas.");
        return;
      }
    }

    const finalTaskId = editingTask?.taskId || previewTaskId;

    onSave({
      id: editingTask ? editingTask.id : undefined,
      taskId: finalTaskId,
      parentCaseId: autoCaseId,
      unit,
      pic: autoAssignedTo,
      assignedTo: autoAssignedTo,
      tanggal,
      deskripsiTugas,
      jenisTeknis,
      timeline,
      arahanAtasan: editingTask?.arahanAtasan || '',
      arahanAtasanUtama: editingTask?.arahanAtasanUtama || '',
      prioritas,
      status,
      penyelesaian: penyelesaian,
      evidenceId: penyelesaian.trim() ? (editingTask?.evidenceId || generateEvidenceId(finalTaskId, 1)) : editingTask?.evidenceId,
      tanggalFU,
      validator: validatorTags.join(', '),
      outputDoD,
      outputDoD2,
      outcome,
      category,
      subcategory,
      beisLevel,
      beisDomain,
      beisCategory,
      syncedToCalendar: syncCalendar
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
      <div className="bg-white dark:bg-[#18181A] w-full max-w-2xl rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-[#1C1C1C]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300 rounded-2xl">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  {editingTask ? 'Edit Aktivitas' : 'Input Aktivitas Baru'}
                </h3>
                <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300 text-[10px] font-mono font-bold rounded-full">
                  BEIS Standard
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-mono mt-0.5">
                ID: <strong>{previewTaskId}</strong> · PIC: <strong>{autoAssignedTo}</strong>
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
          {isLockedForStaff && (
            <div className="p-4 bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 rounded-2xl flex items-start gap-3">
              <span className="text-xl">⚠️</span>
              <div className="text-xs text-amber-900 dark:text-amber-200 space-y-1">
                <p className="font-bold">Pengisian Tugas Baru Dikunci (Batas Jam 09:45 WIB Terlewati)</p>
                <p className="text-[11px] leading-relaxed">
                  Sesuai aturan SOP BEIS, pembuatan to-do list baru wajib diisi antara <strong>08:00 - 09:45 WIB</strong>.
                </p>
              </div>
            </div>
          )}

          {privacyWarning && (
            <div className="p-3 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-2 text-xs text-red-800 dark:text-red-300 animate-pulse">
              <ShieldAlert className="w-4 h-4 shrink-0 text-red-600" />
              <span>
                <strong>Aturan BEIS Privacy:</strong> NIK 16-digit atau Nomor Rekening terdeteksi dan otomatis disamarkan untuk menjaga keamanan data nasabah/pribadi.
              </span>
            </div>
          )}

          {/* 1. Deskripsi Tugas (Main Input) */}
          <div className="space-y-1.5">
            <label className="block text-sm font-bold text-gray-900 dark:text-white">
              Deskripsi Aktivitas / Tugas <span className="text-red-500">*</span>
            </label>
            <textarea
              value={deskripsiTugas}
              onChange={(e) => handleDescriptionChange(e.target.value)}
              placeholder="Ketik deskripsi aktivitas tugas sesuai standar BEIS..."
              rows={3}
              required
              className="w-full px-4 py-3 bg-white dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-2xl text-sm font-medium text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-200 dark:focus:ring-gray-600 shadow-sm"
            />
          </div>

          {/* BEIS Taxonomy Selector */}
          <div className="p-3.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                <span>Klasifikasi & Kategori</span>
              </span>
              <span className="text-[10px] text-gray-500 font-mono">1 Task = 1 BEIS Task ID</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 mb-1">
                  Fungsi/Jabatan
                </label>
                <select
                  value={category}
                  onChange={(e) => {
                    const newCategory = e.target.value as Category;
                    setCategory(newCategory);
                    const defaultSubcategory = SUBCATEGORY_MAPPING[newCategory][0] || 'Lainnya';
                    setSubcategory(defaultSubcategory as Subcategory);
                  }}
                  className="w-full px-2.5 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold text-gray-900 dark:text-white"
                >
                  {Object.keys(SUBCATEGORY_MAPPING).map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 mb-1">
                  Subkategori
                </label>
                <select
                  value={subcategory}
                  onChange={(e) => setSubcategory(e.target.value as Subcategory)}
                  className="w-full px-2.5 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold text-gray-900 dark:text-white"
                >
                  {(SUBCATEGORY_MAPPING[category] || []).map(sub => (
                    <option key={sub} value={sub}>{sub}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Category (Searchable) */}
              <div className="relative" ref={categoryDropdownRef}>
                <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 mb-1">
                  Kategori Kode BEIS
                </label>
                <div 
                  className="relative w-full cursor-pointer"
                  onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                >
                  <div className="w-full flex items-center justify-between px-2.5 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-mono font-bold text-gray-900 dark:text-white">
                    <span className="truncate pr-2">
                      {beisCategory} - {ALL_CATEGORIES.find(c => c.code === beisCategory)?.label || ''}
                    </span>
                    <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
                  </div>
                </div>

                {isCategoryOpen && (
                  <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg max-h-60 flex flex-col overflow-hidden">
                    <div className="p-2 border-b border-gray-100 dark:border-gray-700 relative flex items-center">
                      <Search className="w-3.5 h-3.5 text-gray-400 absolute left-4" />
                      <input
                        autoFocus
                        type="text"
                        placeholder="Cari..."
                        value={categorySearchQuery}
                        onChange={(e) => setCategorySearchQuery(e.target.value)}
                        className="w-full pl-7 pr-2 py-1.5 text-xs bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-300 dark:focus:ring-gray-600 text-gray-900 dark:text-white"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <div className="overflow-y-auto p-1 flex-1">
                      {ALL_CATEGORIES.filter(c => `${c.code} ${c.label}`.toLowerCase().includes(categorySearchQuery.toLowerCase())).length === 0 ? (
                        <div className="px-3 py-2 text-xs text-gray-500 text-center">Tidak ditemukan</div>
                      ) : (
                        ALL_CATEGORIES.filter(c => `${c.code} ${c.label}`.toLowerCase().includes(categorySearchQuery.toLowerCase())).map(c => (
                          <div
                            key={c.code}
                            onClick={() => {
                              handleCategoryChange(c.code);
                              setIsCategoryOpen(false);
                              setCategorySearchQuery('');
                            }}
                            className={`px-2.5 py-1.5 text-[11px] font-mono font-bold cursor-pointer rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 truncate ${
                              beisCategory === c.code 
                                ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white' 
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

              {/* Domain & Level */}
              <div>
                <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 mb-1">
                  Domain & Level
                </label>
                <select
                  value={beisDomain}
                  onChange={(e) => handleDomainChange(e.target.value as BEISDomainCode)}
                  className="w-full px-2.5 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold text-gray-900 dark:text-white"
                >
                  {BEIS_DOMAINS.map(d => (
                    <option key={d.code} value={d.code}>
                      [{d.level}] {d.code} - {d.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Unit Code */}
              <div>
                <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 mb-1">
                  Unit Operasional
                </label>
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full px-2.5 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-mono font-bold text-gray-900 dark:text-white"
                >
                  {BEIS_UNITS.map(u => (
                    <option key={u.code} value={u.code}>
                      {u.code} - {u.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Output & Outcome */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                Output Target <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={outputDoD}
                onChange={(e) => setOutputDoD(e.target.value)}
                placeholder="Target keluaran (Output 1)"
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-medium text-gray-900 dark:text-white"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                Output Target 2
              </label>
              <input
                type="text"
                value={outputDoD2}
                onChange={(e) => setOutputDoD2(e.target.value)}
                placeholder="Target keluaran (Output 2)"
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-medium text-gray-900 dark:text-white"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                Outcome Berhasil
              </label>
              <input
                type="text"
                value={outcome}
                onChange={(e) => setOutcome(e.target.value)}
                placeholder="Dampak keberhasilan (Outcome)"
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-medium text-gray-900 dark:text-white"
              />
            </div>
          </div>

          {/* Status, Priority, Deadline, Validator — all visible directly */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            {/* Status BEIS (without Validated Closed & Improved) */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                Status Aktivitas
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="w-full px-3 py-2.5 bg-white dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-200 dark:focus:ring-gray-600 shadow-sm"
              >
                {FORM_STATUSES.filter(s => {
                  const isValidator = currentUser?.name && validatorTags.some(tag => tag.toLowerCase() === currentUser.name.toLowerCase());
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
            </div>

            {/* Prioritas */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                Prioritas (P1 - P3)
              </label>
              <select
                value={prioritas}
                onChange={(e) => setPrioritas(e.target.value as Prioritas)}
                className="w-full px-3 py-2.5 bg-white dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-200 dark:focus:ring-gray-600 shadow-sm"
              >
                {Array.from({ length: 3 }, (_, i) => `P${i + 1}`).map((p) => (
                  <option key={p} value={p}>
                    {p} {p === 'P1' ? '(Utama)' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Deadline & Validator — directly visible, no "advanced" toggle */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                  Evidence / Link Bukti Dokumen
                </label>
                <span className="text-[10px] text-emerald-600 font-mono font-bold">
                  Suffix: {editingTask?.evidenceId || generateEvidenceId(previewTaskId, 1)}
                </span>
              </div>
              <input 
                type="text"
                value={penyelesaian}
                onChange={(e) => setPenyelesaian(e.target.value)}
                placeholder="https://... atau URL Evidence E01"
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-medium text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                Deadline (Tanggal FU) <span className="text-red-500">*</span>
              </label>
              <input 
                type="date"
                value={tanggalFU}
                onChange={(e) => setTanggalFU(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-medium text-gray-900 dark:text-white"
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                Validator BEIS <span className="text-gray-400 font-normal">(Tekan Enter untuk menambah)</span>
              </label>
              <div className="flex flex-wrap items-center gap-2 p-2 min-h-[38px] bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl">
                {validatorTags.map((tag, idx) => (
                  <span key={idx} className="flex items-center gap-1 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded-md text-xs font-semibold">
                    {tag}
                    <button type="button" onClick={() => setValidatorTags(validatorTags.filter((_, i) => i !== idx))} className="hover:text-emerald-950 dark:hover:text-emerald-100 p-0.5">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  list="validator-options"
                  value={validatorInput}
                  onChange={(e) => setValidatorInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const val = validatorInput.trim();
                      if (val && !validatorTags.includes(val)) {
                        setValidatorTags([...validatorTags, val]);
                      }
                      setValidatorInput('');
                    }
                  }}
                  placeholder={validatorTags.length === 0 ? "Ketik nama & Enter..." : ""}
                  className="flex-1 min-w-[120px] bg-transparent text-xs font-medium text-gray-900 dark:text-white focus:outline-none"
                />
                <datalist id="validator-options">
                  {INITIAL_USERS.map((u) => (
                    <option key={u.id} value={u.name}>{u.role}</option>
                  ))}
                </datalist>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-100 dark:border-gray-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-full text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isLockedForStaff}
              className={`px-6 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                isLockedForStaff
                  ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
                  : 'bg-gray-900 hover:bg-black dark:bg-white dark:hover:bg-gray-200 text-white dark:text-gray-900 shadow-sm'
              }`}
            >
              <Check className="w-4 h-4" />
              <span>{isLockedForStaff ? 'Sesi Terkunci (> 09:45 WIB)' : 'Simpan Aktivitas'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
