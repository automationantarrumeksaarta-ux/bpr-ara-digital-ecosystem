import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileText, CheckCircle, AlertTriangle, 
  Search, Plus, Activity, FileCheck, CheckSquare,
  XCircle, ShieldCheck, Edit, RefreshCw,
  Sparkles, Zap, Scan, Database, User, Phone, DollarSign,
  ChevronDown
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { CreditApplication, CreditAppStage } from '../../types';
import { WorkflowActionModal } from '../common/WorkflowActionModal';
import { DocumentViewerModal } from '../common/DocumentViewerModal';
import { CreditPipelineHeader } from '../ui/CreditPipelineHeader';

// Logo diambil dari aset sendiri. Sebelumnya menunjuk ke domain pihak ketiga
// (antarrumeksaarta.vittoriaproperti.com), sehingga logo pada dokumen kredit
// ikut hilang bila domain itu mati atau berkasnya dipindah.
const LOGO_URL = '/logo.png';

const FLOW_STEPS: CreditAppStage[] = [
  'SUBMITTED', 
  'VERIFICATION', 
  'ANALYSIS', 
  'CREDIT_COMMITTEE', 
  'APPROVED', 
  'DISBURSED', 
  'REJECTED'
];

const STATUS_CONFIG: Record<CreditAppStage, { label: string; color: string; badgeBg: string; icon: any }> = {
  'DRAFT': { label: 'Draft', color: 'text-muted', badgeBg: 'bg-surface-muted text-foreground', icon: FileText },
  'SUBMITTED': { label: 'Input AO', color: 'text-foreground', badgeBg: 'bg-surface-muted border-border text-foreground', icon: FileText },
  'VERIFICATION': { label: 'Verifikasi Admin Legal', color: 'text-amber-800', badgeBg: 'bg-amber-50 border-amber-200/80 text-amber-800', icon: FileCheck },
  'SLIK': { label: 'SLIK Checking', color: 'text-amber-800', badgeBg: 'bg-amber-50 text-amber-800', icon: FileCheck },
  'SURVEY': { label: 'Survey OTS', color: 'text-blue-800', badgeBg: 'bg-blue-50 text-blue-800', icon: Activity },
  'ANALYSIS': { label: 'Analisa Kredit', color: 'text-blue-800', badgeBg: 'bg-blue-50 border-blue-200/80 text-blue-800', icon: Activity },
  'LEGAL_REVIEW': { label: 'Legal Review', color: 'text-purple-800', badgeBg: 'bg-purple-50 text-purple-800', icon: ShieldCheck },
  'CREDIT_COMMITTEE': { label: 'Review Kepatuhan / Komite', color: 'text-purple-800', badgeBg: 'bg-purple-50 border-purple-200/80 text-purple-800', icon: ShieldCheck },
  'APPROVED': { label: 'Approval Direktur', color: 'text-indigo-800', badgeBg: 'bg-indigo-50 border-indigo-200/80 text-indigo-800', icon: CheckSquare },
  'DISBURSED': { label: 'Pencairan (Selesai)', color: 'text-emerald-800', badgeBg: 'bg-emerald-50 border-emerald-200/80 text-emerald-800', icon: CheckCircle },
  'REJECTED': { label: 'Ditolak', color: 'text-rose-800', badgeBg: 'bg-rose-50 border-rose-200/80 text-rose-800', icon: XCircle },
};

const formatIDR = (val: number) => 
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

const compressImageFile = (file: File, maxWidth = 800, quality = 0.7): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      resolve(''); return;
    }
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const scaleSize = maxWidth / img.width;
        canvas.width = maxWidth;
        canvas.height = img.height * scaleSize;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
};

export const LosCreditView: React.FC = () => {
  const { currentUser, creditApplications: allApplications, createCreditApplication, updateCreditAppStage } = useApp();
  const applications = allApplications;
  
  const currentRole = currentUser.role;
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const [actionModal, setActionModal] = useState<{ isOpen: boolean; app: CreditApplication | null }>({ isOpen: false, app: null });
  const [viewerModal, setViewerModal] = useState<{ isOpen: boolean; app: CreditApplication | null }>({ isOpen: false, app: null });
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);

  // --- FULL FORM STATES ---
  const [formData, setFormData] = useState({
    name: '',
    ktp: '',
    wa: '',
    maritalStatus: 'Single / Belum Menikah',
    motherName: '',
    spouseName: '',
    address: '',
    rtRw: '',
    kelurahan: '',
    kecamatan: '',
    kabupaten: '',
    amount: '',
    interestRate: '',
    termMonths: '12',
    purpose: 'Modal Kerja Usaha',
    businessType: '',
    creditType: 'Umum',
    debtorStatus: 'Debitur Baru'
  });
  
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, string | null>>({
    formPengajuan: null, ktp: null, kk: null, suratNikah: null, slipGaji: null, pdam: null,
    bpkb: null, stnk: null, esekNosin: null, shm: null, ktpPenjamin: null, pbb: null
  });
  const [uploadedImages, setUploadedImages] = useState<Record<string, string>>({});

  const [isOcrScanning, setIsOcrScanning] = useState<boolean>(false);
  const [autoFillNotification, setAutoFillNotification] = useState<string | null>(null);
  const [cifSearchInput, setCifSearchInput] = useState<string>('');
  const ocrFileInputRef = useRef<HTMLInputElement | null>(null);

  const DEMO_PRESETS = [
    {
      id: 'sembako', label: '🏢 Usaha Sembako (Bambang Purnomo)',
      data: {
        name: 'Bambang Purnomo', ktp: '3273012508820005', wa: '081223456789', maritalStatus: 'Menikah',
        motherName: 'Siti Aminah', spouseName: 'Sri Wahyuni', address: 'Jl. Raya Soreang No. 142',
        rtRw: '003/007', kelurahan: 'Padasuka', kecamatan: 'Soreang', kabupaten: 'Bandung',
        businessType: 'Perdagangan Grosir Sembako', amount: '75000000', interestRate: '12.5', termMonths: '24', purpose: 'Modal Kerja Usaha'
      }
    },
    {
      id: 'pns', label: '💼 Payroll PNS (Ratna Juwita)',
      data: {
        name: 'Dra. Ratna Juwita, M.Si', ktp: '3273045411800002', wa: '081398765432', maritalStatus: 'Menikah',
        motherName: 'Hj. Rukmini', spouseName: 'Drs. Hendra Wijaya', address: 'Komplek Permata',
        rtRw: '005/012', kelurahan: 'Sekarwangi', kecamatan: 'Soreang', kabupaten: 'Bandung',
        businessType: 'PNS Dinas Pendidikan', amount: '45000000', interestRate: '11', termMonths: '36', purpose: 'Konsumtif'
      }
    }
  ];

  const applyPresetData = (preset: typeof DEMO_PRESETS[0]) => {
    setFormData(prev => ({ ...prev, ...preset.data }));
    setAutoFillNotification(`⚡ Data Otomatis Diisi: ${preset.data.name}`);
    setTimeout(() => setAutoFillNotification(null), 4000);
  };

  const handleCifSearch = () => {
    if (!cifSearchInput.trim()) return;
    setIsOcrScanning(true);
    setTimeout(() => {
      setIsOcrScanning(false);
      const query = cifSearchInput.toLowerCase();
      let matched = DEMO_PRESETS[0].data;
      if (query.includes('ratna') || query.includes('pns')) matched = DEMO_PRESETS[1].data;
      setFormData(prev => ({ ...prev, ...matched }));
      setAutoFillNotification(`🏦 Core Banking: Data NIK/CIF '${cifSearchInput}' ditemukan!`);
      setTimeout(() => setAutoFillNotification(null), 5000);
    }, 800);
  };

  const handleOcrFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsOcrScanning(true);
    setTimeout(() => {
      setIsOcrScanning(false);
      setFormData(prev => ({
        ...prev,
        name: prev.name || 'Drs. Supriatna Hidayat',
        ktp: prev.ktp || '3273051408790003',
        wa: prev.wa || '081299887766',
        address: prev.address || 'Jl. Terusan Kopo No. 205',
        businessType: prev.businessType || 'Bengkel & Sparepart',
        amount: prev.amount || '60000000'
      }));
      setUploadedFiles(prev => ({ ...prev, ktp: file.name }));
      setAutoFillNotification(`📷 Smart OCR Extrak: Berkas '${file.name}' diproses!`);
      setTimeout(() => setAutoFillNotification(null), 5000);
    }, 1200);
  };

  const convertFilenameToPdf = (originalName: string, fallbackType?: string) => {
    if (!originalName) return `${fallbackType || 'Dokumen'}_Converted.pdf`;
    return `${originalName.replace(/\.[^/.]+$/, "")}.pdf`;
  };

  const handleFileChange = async (docType: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadedFiles(prev => ({ ...prev, [docType]: convertFilenameToPdf(file.name, docType) }));
      const dataUrl = await compressImageFile(file);
      if (dataUrl) setUploadedImages(prev => ({ ...prev, [docType]: dataUrl }));
    }
  };

  const renderUploadRow = (key: string, label: string) => {
    const fileName = uploadedFiles[key];
    const imgData = uploadedImages[key];
    return (
      <div className="flex items-center justify-between bg-surface shadow-md p-2.5 border border-border/80 dark:border-white/10 rounded-2xl shadow-sm">
        <div className="flex items-center gap-2.5 overflow-hidden min-w-0">
          {imgData ? (
            <img src={imgData} alt="Thumb" className="w-9 h-9 object-cover rounded-xl border-2 border-emerald-400 shrink-0" />
          ) : fileName ? (
            <CheckCircle size={18} className="text-emerald-500 shrink-0" />
          ) : (
            <div className="w-4 h-4 border-2 border-slate-300 dark:border-primary-light/20 rounded-md shrink-0" />
          )}
          <div className="flex flex-col truncate min-w-0">
            <span className={`text-xs font-semibold ${fileName ? 'text-foreground' : 'text-muted dark:text-muted'}`}>
              {label}
            </span>
            {fileName && (
              <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-bold mt-0.5">
                {imgData ? 'Foto Terlampir' : `PDF: ${fileName}`}
              </span>
            )}
          </div>
        </div>
        <label className="cursor-pointer shrink-0 ml-2">
          <span className={`text-[11px] font-bold px-3 py-1 rounded-full ${fileName ? 'bg-slate-200 text-foreground' : 'bg-slate-800 text-white'}`}>
            {fileName ? 'Ganti Foto' : 'Upload'}
          </span>
          <input type="file" className="hidden" onChange={(e) => handleFileChange(key, e)} accept="image/*,.pdf" />
        </label>
      </div>
    );
  };

  const handleRtRwChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/[^0-9/]/g, '');
    if ((val.length === 2 || val.length === 3) && !val.includes('/') && formData.rtRw.length < val.length) {
      val += '/';
    }
    setFormData({...formData, rtRw: val});
  };

  const handleNewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const initialDocs: any[] = [
      {
        id: `doc-${Date.now()}-form01`,
        name: 'Form_01_Permohonan.pdf',
        type: 'FORM_01',
        url: 'virtual',
        uploadedBy: 'Sistem LOS',
        uploadedAt: new Date().toISOString(),
        stage: 'SUBMITTED',
      }
    ];
    Object.keys(uploadedImages).forEach((key) => {
      initialDocs.push({
        id: `doc-${Date.now()}-${key}`,
        name: uploadedFiles[key] || `${key}.jpg`,
        type: key,
        url: uploadedImages[key],
        uploadedBy: currentUser.name,
        uploadedAt: new Date().toISOString(),
        stage: 'SUBMITTED',
      });
    });

    createCreditApplication({
      cif: formData.ktp ? `CIF-${formData.ktp.slice(-4)}` : undefined,
      customerName: formData.name,
      phone: formData.wa,
      maritalStatus: formData.maritalStatus,
      motherName: formData.motherName,
      spouseName: formData.spouseName,
      address: formData.address,
      rtRw: formData.rtRw,
      kelurahan: formData.kelurahan,
      kecamatan: formData.kecamatan,
      kabupaten: formData.kabupaten,
      creditType: formData.creditType,
      debtorStatus: formData.debtorStatus,
      interestRate: parseFloat(formData.interestRate) || undefined,
      requestedPlafon: parseInt(formData.amount) || 0,
      requestedTenorMonths: parseInt(formData.termMonths) || 12,
      purpose: (formData.purpose === 'Modal Kerja Usaha' ? 'MODAL_KERJA' : formData.purpose === 'Investasi' ? 'INVESTASI' : 'KONSUMTIF'),
      purposeDetails: formData.businessType || formData.purpose,
      documents: initialDocs,
    });
    setIsNewModalOpen(false);
  };

  const refreshApplications = () => { setLoading(true); setTimeout(() => setLoading(false), 800); };
  const openActionModal = (app: CreditApplication) => setActionModal({ isOpen: true, app });
  const closeActionModal = () => setActionModal({ isOpen: false, app: null });
  const handleWorkflowSubmit = (action: string, nextStage: CreditAppStage, notes: string, fileUrl?: string, fileName?: string) => {
    if (!actionModal.app) return;
    updateCreditAppStage(actionModal.app.id, nextStage, notes, fileUrl, fileName);
    closeActionModal();
  };

  const getStageConfig = (stage: CreditAppStage | undefined) => {
    switch (stage) {
      case 'SUBMITTED': return { title: 'Ajukan ke Legal', subtitle: 'Verifikasi kelengkapan', next: 'VERIFICATION', label: 'Ajukan ke Legal' };
      case 'VERIFICATION': return { title: 'Proses SLIK OJK', subtitle: 'Pengecekan riwayat kredit', next: 'SLIK', label: 'Proses SLIK' };
      case 'SLIK': return { title: 'Tugaskan Survey', subtitle: 'Survey lokasi & usaha', next: 'SURVEY', label: 'Tugaskan Survey' };
      case 'SURVEY': return { title: 'Analisa Kredit', subtitle: 'Evaluasi kelayakan', next: 'ANALYSIS', label: 'Mulai Analisa' };
      case 'ANALYSIS': return { title: 'Legal Review', subtitle: 'Review perjanjian kredit', next: 'LEGAL_REVIEW', label: 'Kirim ke Legal' };
      case 'LEGAL_REVIEW': return { title: 'Komite Kredit', subtitle: 'Sidang putusan komite', next: 'CREDIT_COMMITTEE', label: 'Ajukan ke Komite' };
      case 'CREDIT_COMMITTEE': return { title: 'Keputusan Komite', subtitle: 'Persetujuan akhir direksi', next: 'APPROVED', label: 'Setujui Pengajuan' };
      case 'APPROVED': return { title: 'Pencairan Kredit', subtitle: 'Disbursement ke rekening nasabah', next: 'DISBURSED', label: 'Cairkan Dana' };
      default: return { title: 'Aplikasi Selesai', subtitle: 'Tidak ada tindakan lanjutan', next: 'DISBURSED', label: 'Selesai' };
    }
  };

  const filteredApps = applications.filter((app) => {
    const matchesSearch = app.customerName.toLowerCase().includes(searchTerm.toLowerCase()) || app.id.toLowerCase().includes(searchTerm.toLowerCase()) || app.purposeDetails.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || app.currentStage === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const isSlaExceeded = (app: CreditApplication) => {
    if (app.slaExceeded) return true;
    if (!app.slaDeadline) return false;
    try {
      const deadlineStr = app.slaDeadline.replace(' WIB', '').replace(' ', 'T');
      return new Date() > new Date(deadlineStr);
    } catch {
      return false;
    }
  };

  const metrics = {
    total: applications.length,
    pencairan: applications.filter(a => a.currentStage === 'DISBURSED').length,
    approvalRate: applications.length > 0 ? Math.round((applications.filter(a => a.currentStage === 'DISBURSED' || a.currentStage === 'APPROVED').length / applications.length) * 100) : 0,
    slaWarnings: applications.filter(a => (a.slaExceeded || isSlaExceeded(a)) && a.currentStage !== 'DISBURSED' && a.currentStage !== 'REJECTED').length
  };

  return (
    <div className="w-full h-full flex flex-col relative z-0 animate-in fade-in">
      <div className="p-4 sm:p-6 pt-2 flex-1">
        <CreditPipelineHeader currentStage="Loan Origination" />
        {/* Header Section */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-4 sm:mb-6 bg-surface shadow-md p-4 sm:p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-black text-foreground tracking-tight">Pipeline Kredit Nasabah</h2>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200/60">{currentRole}</span>
            </div>
            <p className="text-[11px] sm:text-xs text-muted dark:text-muted mt-1 truncate">User: <strong className="text-foreground dark:text-slate-200">{currentUser.email}</strong> • Hak verifikasi disesuaikan jabatan.</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <motion.button whileTap={{ scale: 0.9 }} onClick={refreshApplications} disabled={loading} className="p-2.5 border border-border bg-background dark:bg-[#111111] hover:bg-surface-muted text-foreground dark:text-slate-300 rounded-2xl transition-all cursor-pointer">
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </motion.button>
            <motion.button whileTap={{ scale: 0.96 }} onClick={() => setIsNewModalOpen(true)} className="hidden sm:inline-flex items-center justify-center gap-2 bg-slate-800 dark:bg-white text-white dark:text-foreground px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shadow-sm cursor-pointer hover:opacity-90">
              <Plus size={16} /> Input Pengajuan Baru
            </motion.button>
          </div>
        </motion.div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          <div className="bg-surface shadow-md p-3.5 sm:p-5 rounded-[22px] flex items-center gap-3 sm:gap-4 hover:shadow-md transition-all">
            <div className="p-2.5 sm:p-3 bg-surface-muted text-muted dark:text-slate-300 rounded-2xl shrink-0"><FileText size={20} className="sm:w-[22px] sm:h-[22px]" /></div>
            <div><p className="text-[10px] sm:text-[11px] font-extrabold text-muted uppercase tracking-wider">Total</p><h3 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">{metrics.total}</h3></div>
          </div>
          <div className="bg-surface shadow-md p-3.5 sm:p-5 rounded-[22px] flex items-center gap-3 sm:gap-4 hover:shadow-md transition-all">
            <div className="p-2.5 sm:p-3 bg-surface-muted text-muted dark:text-slate-300 rounded-2xl shrink-0"><CheckCircle size={20} className="sm:w-[22px] sm:h-[22px]" /></div>
            <div><p className="text-[10px] sm:text-[11px] font-extrabold text-muted uppercase tracking-wider">Pencairan</p><h3 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">{metrics.pencairan}</h3></div>
          </div>
          <div className="bg-surface shadow-md p-3.5 sm:p-5 rounded-[22px] flex items-center gap-3 sm:gap-4 hover:shadow-md transition-all">
            <div className="p-2.5 sm:p-3 bg-surface-muted text-muted dark:text-slate-300 rounded-2xl shrink-0"><Activity size={20} className="sm:w-[22px] sm:h-[22px]" /></div>
            <div><p className="text-[10px] sm:text-[11px] font-extrabold text-muted uppercase tracking-wider">Approval Rate</p><h3 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">{metrics.approvalRate}%</h3></div>
          </div>
          <div className="bg-surface shadow-md p-3.5 sm:p-5 rounded-[22px] flex items-center gap-3 sm:gap-4 hover:shadow-md transition-all">
            <div className="p-2.5 sm:p-3 bg-surface-muted text-muted dark:text-slate-300 rounded-2xl shrink-0"><AlertTriangle size={20} className="sm:w-[22px] sm:h-[22px]" /></div>
            <div><p className="text-[10px] sm:text-[11px] font-extrabold text-muted uppercase tracking-wider">SLA Warning</p><h3 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">{metrics.slaWarnings}</h3></div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-4">
          <div className="relative inline-block w-full sm:w-64">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="appearance-none w-full bg-surface shadow-sm border border-border/80 dark:border-white/10 rounded-2xl pl-4 pr-10 py-2.5 text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-slate-400 cursor-pointer"
            >
              <option value="ALL">Semua ({applications.length})</option>
              {FLOW_STEPS.map(step => (
                <option key={step} value={step}>
                  {STATUS_CONFIG[step].label} ({applications.filter(a => a.currentStage === step).length})
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
              <ChevronDown size={14} />
            </div>
          </div>
        </div>

        {/* Data List */}
        <div className="bg-surface shadow-md rounded-[28px] overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-border/50 dark:border-white/10 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
            <div className="flex items-center justify-between sm:justify-start gap-2">
              <h3 className="text-sm font-black text-foreground tracking-tight">Data Pengajuan Kredit</h3>
              <span className="text-[11px] font-bold bg-surface-muted text-foreground dark:text-slate-300 px-2.5 py-0.5 rounded-full">{filteredApps.length} Berkas</span>
            </div>
            <div className="relative w-full sm:w-72">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none"><Search size={15} className="text-muted" /></div>
              <input type="text" placeholder="Cari Nasabah..." className="pl-9 pr-8 py-2.5 sm:py-2 w-full bg-background dark:bg-[#111111] border border-border/80 dark:border-white/10 rounded-2xl focus:ring-2 focus:ring-slate-400 outline-none transition-all text-xs font-semibold dark:text-white" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
          </div>

          <div className="p-4 space-y-4">
            {filteredApps.map((app) => {
              const statusInfo = STATUS_CONFIG[app.currentStage];
              const StatusIcon = statusInfo.icon;
              return (
                <motion.div key={app.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-background dark:bg-[#1A1A1A] rounded-2xl p-4 border border-border/50 dark:border-white/5 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-mono text-[11px] font-extrabold text-foreground dark:text-slate-300 bg-slate-200 dark:bg-white/10 px-2.5 py-0.5 rounded-full">{app.id}</span>
                      <span className="text-[10px] text-muted font-semibold">{app.createdAt.split('T')[0]}</span>
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statusInfo.badgeBg}`}><StatusIcon size={12} /> {statusInfo.label}</span>
                    </div>
                    <h4 className="font-extrabold text-foreground text-sm leading-tight">{app.customerName}</h4>
                    <p className="text-[11px] text-muted font-medium mt-0.5">{app.productType} • AO: {app.accountOfficerName}</p>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto">
                    <div className="text-left sm:text-right">
                      <span className="text-xs font-black text-foreground dark:text-slate-300 bg-slate-200 dark:bg-white/10 px-2 py-1 rounded-xl block mb-1">{formatIDR(app.requestedPlafon)}</span>
                      <p className="text-[10px] text-muted font-medium truncate max-w-[120px]">{app.purposeDetails}</p>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <button onClick={() => openActionModal(app)} className="px-4 py-1.5 bg-slate-800 dark:bg-white text-white dark:text-foreground rounded-xl text-xs font-bold hover:opacity-90 transition-all cursor-pointer">Detail</button>
                      <button onClick={() => setViewerModal({ isOpen: true, app })} className="px-4 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold hover:bg-blue-100 transition-all cursor-pointer flex items-center justify-center gap-1"><FileText size={12}/> Dossier</button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      <WorkflowActionModal
        isOpen={actionModal.isOpen}
        onClose={closeActionModal}
        title={getStageConfig(actionModal.app?.currentStage).title}
        subtitle={getStageConfig(actionModal.app?.currentStage).subtitle}
        applicationId={actionModal.app?.applicationNumber || ''}
        customerName={actionModal.app?.customerName || ''}
        currentStage={actionModal.app?.currentStage || 'SUBMITTED'}
        availableActions={['SUBMITTED', 'DRAFT'].includes(actionModal.app?.currentStage || '') ? ['PROCEED', 'REJECT'] : []}
        proceedStage={getStageConfig(actionModal.app?.currentStage).next as CreditAppStage}
        proceedLabel={getStageConfig(actionModal.app?.currentStage).label}
        onSubmit={handleWorkflowSubmit}
      />

      <DocumentViewerModal
        isOpen={viewerModal.isOpen}
        onClose={() => setViewerModal({ isOpen: false, app: null })}
        documents={viewerModal.app?.documents || []}
        customerName={viewerModal.app?.customerName || ''}
        applicationNumber={viewerModal.app?.applicationNumber || ''}
        app={viewerModal.app}
      />

      {/* FULL LEGACY NEW MODAL (Form 01) */}
      <AnimatePresence>
        {isNewModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex justify-center items-start pt-10 sm:pt-16 pb-10 overflow-y-auto px-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-surface shadow-md rounded-2xl sm:rounded-[28px] shadow-2xl w-full max-w-2xl flex flex-col border border-primary-light/20 bg-white dark:bg-slate-900 overflow-hidden relative">
              <div className="p-4 sm:p-5 border-b border-border/50 dark:border-white/10 flex justify-between items-center bg-background dark:bg-[#111111] shrink-0">
                <div className="flex items-center gap-2.5">
                  <img src={LOGO_URL} alt="Logo" className="h-6 w-auto bg-white p-0.5 rounded-lg border border-border" />
                  <h3 className="font-bold text-xs sm:text-sm text-foreground">Formulir Pengajuan Kredit Baru (AO)</h3>
                </div>
                <button onClick={() => setIsNewModalOpen(false)} className="text-muted hover:text-foreground dark:hover:text-white cursor-pointer text-xl font-bold px-2">&times;</button>
              </div>
              
              <form onSubmit={handleNewSubmit} className="flex flex-col">
                <div className="p-4 sm:p-6 space-y-5 dark:text-white">
                  <input ref={ocrFileInputRef} type="file" accept="image/*,application/pdf" onChange={handleOcrFileSelect} className="hidden" />

                  {/* Section A */}
                  <div>
                    <h4 className="text-[11px] font-black text-muted dark:text-muted uppercase tracking-wider mb-3 border-b border-border dark:border-white/10 pb-2 flex items-center gap-1.5">A. Data Umum</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted peer-focus:text-primary transition-colors z-20"><User size={14} /></div>
                        <input type="text" id="floating_name" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="block w-full bg-background dark:bg-[#111111] border border-border rounded-xl px-3 pb-2 pt-6 pl-9 outline-none text-xs font-semibold focus:border-primary focus:ring-1 focus:ring-primary peer appearance-none transition-all" placeholder=" " />
                        <label htmlFor="floating_name" className="absolute text-[11px] font-bold text-muted duration-300 transform -translate-y-2.5 scale-75 top-3 z-10 origin-[0] left-9 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-3 peer-focus:scale-75 peer-focus:-translate-y-2.5 peer-focus:text-primary pointer-events-none">Nama Lengkap Debitur</label>
                      </div>
                      <div className="relative group">
                        <input type="text" id="floating_ktp" maxLength={16} required value={formData.ktp} onChange={(e) => setFormData({...formData, ktp: e.target.value})} className="block w-full bg-background dark:bg-[#111111] border border-border rounded-xl px-3 pb-2 pt-6 outline-none text-xs font-mono font-semibold focus:border-primary focus:ring-1 focus:ring-primary peer appearance-none transition-all" placeholder=" " />
                        <label htmlFor="floating_ktp" className="absolute text-[11px] font-bold text-muted duration-300 transform -translate-y-2.5 scale-75 top-3 z-10 origin-[0] left-3 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-3 peer-focus:scale-75 peer-focus:-translate-y-2.5 peer-focus:text-primary pointer-events-none">NIK / No. KTP</label>
                      </div>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted peer-focus:text-primary transition-colors z-20"><Phone size={14} /></div>
                        <input type="tel" id="floating_wa" required value={formData.wa} onChange={(e) => setFormData({...formData, wa: e.target.value})} className="block w-full bg-background dark:bg-[#111111] border border-border rounded-xl px-3 pb-2 pt-6 pl-9 outline-none text-xs font-semibold focus:border-primary focus:ring-1 focus:ring-primary peer appearance-none transition-all" placeholder=" " />
                        <label htmlFor="floating_wa" className="absolute text-[11px] font-bold text-muted duration-300 transform -translate-y-2.5 scale-75 top-3 z-10 origin-[0] left-9 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-3 peer-focus:scale-75 peer-focus:-translate-y-2.5 peer-focus:text-primary pointer-events-none">Nomor HP / WhatsApp</label>
                      </div>
                      <div className="relative group">
                        <select id="floating_marital" required value={formData.maritalStatus} onChange={(e) => setFormData({...formData, maritalStatus: e.target.value})} className="block w-full bg-background dark:bg-[#111111] border border-border rounded-xl px-3 pb-2 pt-6 outline-none text-xs font-semibold focus:border-primary focus:ring-1 focus:ring-primary peer appearance-none transition-all cursor-pointer">
                          <option value="Single / Belum Menikah">Single / Belum Menikah</option>
                          <option value="Menikah">Menikah</option>
                          <option value="Janda / Duda">Janda / Duda</option>
                        </select>
                        <label htmlFor="floating_marital" className="absolute text-[11px] font-bold text-muted duration-300 transform -translate-y-2.5 scale-75 top-3 z-10 origin-[0] left-3 pointer-events-none">Status Perkawinan</label>
                      </div>
                      <div className="relative group">
                        <input type="text" id="floating_mother" required value={formData.motherName} onChange={(e) => setFormData({...formData, motherName: e.target.value})} className="block w-full bg-background dark:bg-[#111111] border border-border rounded-xl px-3 pb-2 pt-6 outline-none text-xs font-semibold focus:border-primary focus:ring-1 focus:ring-primary peer appearance-none transition-all" placeholder=" " />
                        <label htmlFor="floating_mother" className="absolute text-[11px] font-bold text-muted duration-300 transform -translate-y-2.5 scale-75 top-3 z-10 origin-[0] left-3 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-3 peer-focus:scale-75 peer-focus:-translate-y-2.5 peer-focus:text-primary pointer-events-none">Nama Gadis Ibu Kandung</label>
                      </div>
                      <div className="relative group">
                        <input type="text" id="floating_spouse" value={formData.spouseName} onChange={(e) => setFormData({...formData, spouseName: e.target.value})} className="block w-full bg-background dark:bg-[#111111] border border-border rounded-xl px-3 pb-2 pt-6 outline-none text-xs font-semibold focus:border-primary focus:ring-1 focus:ring-primary peer appearance-none transition-all" placeholder=" " />
                        <label htmlFor="floating_spouse" className="absolute text-[11px] font-bold text-muted duration-300 transform -translate-y-2.5 scale-75 top-3 z-10 origin-[0] left-3 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-3 peer-focus:scale-75 peer-focus:-translate-y-2.5 peer-focus:text-primary pointer-events-none">Nama Suami / Istri (Jika Ada)</label>
                      </div>
                      <div className="relative group sm:col-span-2">
                        <input type="text" id="floating_address" required value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} className="block w-full bg-background dark:bg-[#111111] border border-border rounded-xl px-3 pb-2 pt-6 outline-none text-xs font-semibold focus:border-primary focus:ring-1 focus:ring-primary peer appearance-none transition-all" placeholder=" " />
                        <label htmlFor="floating_address" className="absolute text-[11px] font-bold text-muted duration-300 transform -translate-y-2.5 scale-75 top-3 z-10 origin-[0] left-3 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-3 peer-focus:scale-75 peer-focus:-translate-y-2.5 peer-focus:text-primary pointer-events-none">Alamat Tempat Tinggal / Usaha (Jalan / Kampung / No)</label>
                      </div>
                      <div className="grid grid-cols-4 gap-4 sm:col-span-2">
                        <div className="relative group">
                          <input type="text" id="floating_rtrw" required value={formData.rtRw} onChange={handleRtRwChange} className="block w-full bg-background dark:bg-[#111111] border border-border rounded-xl px-3 pb-2 pt-6 outline-none text-xs font-semibold focus:border-primary focus:ring-1 focus:ring-primary peer appearance-none transition-all" placeholder=" " />
                          <label htmlFor="floating_rtrw" className="absolute text-[11px] font-bold text-muted duration-300 transform -translate-y-2.5 scale-75 top-3 z-10 origin-[0] left-3 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-3 peer-focus:scale-75 peer-focus:-translate-y-2.5 peer-focus:text-primary pointer-events-none">RT / RW</label>
                        </div>
                        <div className="relative group">
                          <input type="text" id="floating_kel" required value={formData.kelurahan} onChange={(e) => setFormData({...formData, kelurahan: e.target.value})} className="block w-full bg-background dark:bg-[#111111] border border-border rounded-xl px-3 pb-2 pt-6 outline-none text-xs font-semibold focus:border-primary focus:ring-1 focus:ring-primary peer appearance-none transition-all" placeholder=" " />
                          <label htmlFor="floating_kel" className="absolute text-[11px] font-bold text-muted duration-300 transform -translate-y-2.5 scale-75 top-3 z-10 origin-[0] left-3 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-3 peer-focus:scale-75 peer-focus:-translate-y-2.5 peer-focus:text-primary pointer-events-none">Kelurahan</label>
                        </div>
                        <div className="relative group">
                          <input type="text" id="floating_kec" required value={formData.kecamatan} onChange={(e) => setFormData({...formData, kecamatan: e.target.value})} className="block w-full bg-background dark:bg-[#111111] border border-border rounded-xl px-3 pb-2 pt-6 outline-none text-xs font-semibold focus:border-primary focus:ring-1 focus:ring-primary peer appearance-none transition-all" placeholder=" " />
                          <label htmlFor="floating_kec" className="absolute text-[11px] font-bold text-muted duration-300 transform -translate-y-2.5 scale-75 top-3 z-10 origin-[0] left-3 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-3 peer-focus:scale-75 peer-focus:-translate-y-2.5 peer-focus:text-primary pointer-events-none">Kecamatan</label>
                        </div>
                        <div className="relative group">
                          <input type="text" id="floating_kab" required value={formData.kabupaten} onChange={(e) => setFormData({...formData, kabupaten: e.target.value})} className="block w-full bg-background dark:bg-[#111111] border border-border rounded-xl px-3 pb-2 pt-6 outline-none text-xs font-semibold focus:border-primary focus:ring-1 focus:ring-primary peer appearance-none transition-all" placeholder=" " />
                          <label htmlFor="floating_kab" className="absolute text-[11px] font-bold text-muted duration-300 transform -translate-y-2.5 scale-75 top-3 z-10 origin-[0] left-3 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-3 peer-focus:scale-75 peer-focus:-translate-y-2.5 peer-focus:text-primary pointer-events-none">Kab/Kota</label>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Section B (Detail) */}
                  <div className="mt-4">
                    <h4 className="text-[11px] font-black text-muted dark:text-muted uppercase tracking-wider mb-3 border-b border-border dark:border-white/10 pb-2 flex items-center gap-1.5">B. Detail Pengajuan Fasilitas Kredit (Form 01)</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted peer-focus:text-primary transition-colors z-20"><span className="text-[10px] font-bold">Rp</span></div>
                        <input type="number" id="floating_amount" required min="1000000" value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})} className="block w-full bg-background dark:bg-[#111111] border border-border rounded-xl px-3 pb-2 pt-6 pl-9 outline-none text-xs font-black focus:border-primary focus:ring-1 focus:ring-primary peer appearance-none transition-all" placeholder=" " />
                        <label htmlFor="floating_amount" className="absolute text-[11px] font-bold text-muted duration-300 transform -translate-y-2.5 scale-75 top-3 z-10 origin-[0] left-9 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-3 peer-focus:scale-75 peer-focus:-translate-y-2.5 peer-focus:text-primary pointer-events-none">Plafon Pinjaman / Kredit (Rp)</label>
                      </div>
                      <div className="relative group">
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-muted peer-focus:text-primary transition-colors z-20"><span className="text-[10px] font-bold">Bulan</span></div>
                        <input type="number" id="floating_term" required min="1" max="120" value={formData.termMonths} onChange={(e) => setFormData({...formData, termMonths: e.target.value})} className="block w-full bg-background dark:bg-[#111111] border border-border rounded-xl px-3 pb-2 pt-6 outline-none text-xs font-semibold focus:border-primary focus:ring-1 focus:ring-primary peer appearance-none transition-all" placeholder=" " />
                        <label htmlFor="floating_term" className="absolute text-[11px] font-bold text-muted duration-300 transform -translate-y-2.5 scale-75 top-3 z-10 origin-[0] left-3 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-3 peer-focus:scale-75 peer-focus:-translate-y-2.5 peer-focus:text-primary pointer-events-none">Jangka Waktu</label>
                      </div>
                      <div className="relative group">
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-muted peer-focus:text-primary transition-colors z-20"><span className="text-[10px] font-bold">%</span></div>
                        <input type="number" id="floating_interest" step="0.01" value={formData.interestRate} onChange={(e) => setFormData({...formData, interestRate: e.target.value})} className="block w-full bg-background dark:bg-[#111111] border border-border rounded-xl px-3 pb-2 pt-6 outline-none text-xs font-semibold focus:border-primary focus:ring-1 focus:ring-primary peer appearance-none transition-all" placeholder=" " />
                        <label htmlFor="floating_interest" className="absolute text-[11px] font-bold text-muted duration-300 transform -translate-y-2.5 scale-75 top-3 z-10 origin-[0] left-3 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-3 peer-focus:scale-75 peer-focus:-translate-y-2.5 peer-focus:text-primary pointer-events-none">Suku Bunga</label>
                      </div>
                      <div className="relative group">
                        <input type="text" id="floating_business" required value={formData.businessType} onChange={(e) => setFormData({...formData, businessType: e.target.value})} className="block w-full bg-background dark:bg-[#111111] border border-border rounded-xl px-3 pb-2 pt-6 outline-none text-xs font-semibold focus:border-primary focus:ring-1 focus:ring-primary peer appearance-none transition-all" placeholder=" " />
                        <label htmlFor="floating_business" className="absolute text-[11px] font-bold text-muted duration-300 transform -translate-y-2.5 scale-75 top-3 z-10 origin-[0] left-3 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-3 peer-focus:scale-75 peer-focus:-translate-y-2.5 peer-focus:text-primary pointer-events-none">Jenis Usaha / Pekerjaan</label>
                      </div>
                      <div className="relative group">
                        <select id="floating_credittype" required value={formData.creditType} onChange={(e) => setFormData({...formData, creditType: e.target.value})} className="block w-full bg-background dark:bg-[#111111] border border-border rounded-xl px-3 pb-2 pt-6 outline-none text-xs font-semibold focus:border-primary focus:ring-1 focus:ring-primary peer appearance-none transition-all cursor-pointer">
                          <option value="Umum">Umum</option>
                          <option value="Tepat">Tepat</option>
                          <option value="KKKB">KKKB</option>
                        </select>
                        <label htmlFor="floating_credittype" className="absolute text-[11px] font-bold text-muted duration-300 transform -translate-y-2.5 scale-75 top-3 z-10 origin-[0] left-3 pointer-events-none">Jenis Kredit (Bank)</label>
                      </div>
                      <div className="relative group">
                        <select id="floating_purpose" required value={formData.purpose} onChange={(e) => setFormData({...formData, purpose: e.target.value})} className="block w-full bg-background dark:bg-[#111111] border border-border rounded-xl px-3 pb-2 pt-6 outline-none text-xs font-semibold focus:border-primary focus:ring-1 focus:ring-primary peer appearance-none transition-all cursor-pointer">
                          <option value="Modal Kerja Usaha">Modal Kerja Usaha</option>
                          <option value="Investasi">Investasi</option>
                          <option value="Konsumtif">Konsumtif</option>
                        </select>
                        <label htmlFor="floating_purpose" className="absolute text-[11px] font-bold text-muted duration-300 transform -translate-y-2.5 scale-75 top-3 z-10 origin-[0] left-3 pointer-events-none">Tujuan Penggunaan</label>
                      </div>
                      <div className="relative group">
                        <select id="floating_debtorstatus" required value={formData.debtorStatus} onChange={(e) => setFormData({...formData, debtorStatus: e.target.value})} className="block w-full bg-background dark:bg-[#111111] border border-border rounded-xl px-3 pb-2 pt-6 outline-none text-xs font-semibold focus:border-primary focus:ring-1 focus:ring-primary peer appearance-none transition-all cursor-pointer">
                          <option value="Debitur Baru">Debitur Baru</option>
                          <option value="Debitur Lama">Debitur Lama</option>
                        </select>
                        <label htmlFor="floating_debtorstatus" className="absolute text-[11px] font-bold text-muted duration-300 transform -translate-y-2.5 scale-75 top-3 z-10 origin-[0] left-3 pointer-events-none">Status Debitur</label>
                      </div>
                    </div>
                  </div>

                  {/* Section C: Lampiran */}
                  <div className="mt-4">
                    <h4 className="text-[11px] font-black text-muted dark:text-muted uppercase tracking-wider mb-3 border-b border-border dark:border-white/10 pb-2 flex items-center gap-1.5"><FileText size={14} className="text-foreground dark:text-white" />C. Lampiran Kelengkapan (HVS Sequential)</h4>
                    <div className="space-y-2">
                      <div className="bg-background dark:bg-[#111111] p-3 rounded-2xl border border-border space-y-2">
                        <span className="text-[10px] font-black uppercase bg-slate-200 dark:bg-white/10 text-foreground dark:text-white px-2 py-0.5 rounded">Halaman 2-4: Syarat Utama Debitur</span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {renderUploadRow('ktp', 'KTP Pemohon & Pasangan')}
                          {renderUploadRow('kk', 'Kartu Keluarga (KK)')}
                          {renderUploadRow('suratNikah', 'Surat Nikah/Cerai')}
                          {renderUploadRow('mutasi', 'Mutasi / Rekening Koran')}
                        </div>
                      </div>
                      <div className="bg-background dark:bg-[#111111] p-3 rounded-2xl border border-border space-y-2">
                        <span className="text-[10px] font-black uppercase bg-slate-200 dark:bg-white/10 text-foreground dark:text-white px-2 py-0.5 rounded">Halaman 5: Syarat Agunan</span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {renderUploadRow('shm', 'Sertifikat SHM/SHGB')}
                          {renderUploadRow('bpkb', 'BPKB & STNK')}
                          {renderUploadRow('esekEsek', 'Esek-esek Kendaraan')}
                          {renderUploadRow('ktpPenjamin', 'KTP Penjamin')}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 border-t border-border/50 dark:border-white/10 flex justify-end gap-2 bg-background dark:bg-[#111111] shrink-0">
                  <button type="button" onClick={() => setIsNewModalOpen(false)} className="px-4 py-2.5 border border-border bg-white dark:bg-[#1A1A1A] text-foreground dark:text-slate-300 rounded-2xl hover:bg-background dark:hover:bg-white/5 text-xs font-bold transition-colors cursor-pointer">
                    Batal
                  </button>
                  <motion.button whileTap={{ scale: 0.96 }} type="submit" className="px-5 py-2.5 bg-slate-800 dark:bg-white text-white dark:text-foreground rounded-2xl hover:opacity-90 text-xs font-bold flex items-center gap-1.5 shadow-md transition-all cursor-pointer">
                    <CheckCircle size={15} /> Simpan & Kirim
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
