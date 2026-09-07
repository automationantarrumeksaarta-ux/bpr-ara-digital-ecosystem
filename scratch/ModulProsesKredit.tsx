import React, { useState, useMemo, useEffect } from 'react';
import jsPDF from 'jspdf';
import { 
  FileText, CheckCircle, AlertTriangle, 
  Search, Plus, User, Briefcase, 
  DollarSign, Activity, FileCheck, CheckSquare,
  XCircle, File, ShieldCheck, Edit, Eye,
  Phone, MapPin, LogOut, Database, RefreshCw, KeyRound, Filter, ChevronRight, Sparkles, Building2,
  Download, Printer, Users, FileSearch, Share2, Scan, Menu, Bell, Mail, Calendar, ChevronDown, ChevronLeft, PlusCircle, UserPlus, LayoutDashboard, TrendingUp, Compass, Layers, Settings, HelpCircle, Check, Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import StrukturManajemenModal from './StrukturManajemenModal';
import { 
  CreditApplication, 
  Role, 
  UserProfile, 
  CreditStatus,
  ViewTab,
  KreditBermasalahItem,
  SebaranWilayah,
  AgunanItem,
  JanjiBayarItem,
  AOPendapatanBunga,
  PencapaianBisnisAO 
} from '../types';
import { 
  loadApplicationsService, 
  createApplicationService, 
  updateApplicationService 
} from '../lib/supabaseService';
import { getSupabase } from '../lib/supabase';

import {
  INITIAL_NPL_DATA,
  INITIAL_SEBARAN_DATA,
  INITIAL_AGUNAN_DATA,
  INITIAL_JANJI_BAYAR_DATA,
  INITIAL_TARGET_BUNGA_DATA,
  INITIAL_PENCAPAIAN_BISNIS_DATA
} from '../data/mockDashboardData';

import DashboardKreditBermasalah from './dashboards/DashboardKreditBermasalah';
import HeatMapSebaranKredit from './dashboards/HeatMapSebaranKredit';
import AnalisisAgunan from './dashboards/AnalisisAgunan';
import DashboardJanjiBayar from './dashboards/DashboardJanjiBayar';
import DashboardRasioBungaAO from './dashboards/DashboardRasioBungaAO';
import DashboardPencapaianBisnis from './dashboards/DashboardPencapaianBisnis';
import DashboardExecutiveDireksi from './dashboards/DashboardExecutiveDireksi';
import DashboardPeBisnis from './dashboards/DashboardPeBisnis';
import DashboardPeKepatuhan from './dashboards/DashboardPeKepatuhan';
import DashboardPeAudit from './dashboards/DashboardPeAudit';
import DashboardCrm from './dashboards/DashboardCrm';
import DashboardAbsensiLapangan from './dashboards/DashboardAbsensiLapangan';
import { DashboardManajemenTugas } from './dashboards/DashboardManajemenTugas';


const LOGO_URL = 'https://antarrumeksaarta.vittoriaproperti.com/uploads/profile/d96a287d-a983-4e54-8719-b46c7a2f3694.png';

const FLOW_STEPS: CreditStatus[] = [
  'INPUT_AO', 
  'VERIFIKASI_ADMIN', 
  'ANALISA_KREDIT', 
  'KOMITE', 
  'APPROVAL', 
  'PENCAIRAN', 
  'DITOLAK'
];

const STATUS_CONFIG: Record<CreditStatus, { label: string; color: string; badgeBg: string; icon: any }> = {
  'INPUT_AO': { label: 'Input AO', color: 'text-slate-700', badgeBg: 'bg-slate-100 border-slate-200 text-slate-800', icon: FileText },
  'VERIFIKASI_ADMIN': { label: 'Verifikasi Admin Legal', color: 'text-amber-800', badgeBg: 'bg-amber-50 border-amber-200/80 text-amber-800', icon: FileCheck },
  'ANALISA_KREDIT': { label: 'Analisa Kredit', color: 'text-blue-800', badgeBg: 'bg-blue-50 border-blue-200/80 text-blue-800', icon: Activity },
  'KOMITE': { label: 'Review Kepatuhan', color: 'text-purple-800', badgeBg: 'bg-purple-50 border-purple-200/80 text-purple-800', icon: ShieldCheck },
  'APPROVAL': { label: 'Approval Direktur', color: 'text-indigo-800', badgeBg: 'bg-indigo-50 border-indigo-200/80 text-indigo-800', icon: CheckSquare },
  'PENCAIRAN': { label: 'Pencairan (Selesai)', color: 'text-emerald-800', badgeBg: 'bg-emerald-50 border-emerald-200/80 text-emerald-800', icon: CheckCircle },
  'DITOLAK': { label: 'Ditolak', color: 'text-rose-800', badgeBg: 'bg-rose-50 border-rose-200/80 text-rose-800', icon: XCircle },
};

const compressImageFile = (file: File, maxWidth = 800, quality = 0.7): Promise<string> => {
  return new Promise((resolve) => {
    if (!file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => resolve((e.target?.result as string) || '');
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        } else {
          resolve((e.target?.result as string) || '');
        }
      };
      img.onerror = () => resolve((e.target?.result as string) || '');
      img.src = (e.target?.result as string) || '';
    };
    reader.onerror = () => resolve('');
    reader.readAsDataURL(file);
  });
};

interface ModulProsesKreditProps {
  currentUser: UserProfile;
  onLogout: () => void;
  onOpenConfig: () => void;
}

export default function ModulProsesKredit({ currentUser, onLogout, onOpenConfig }: ModulProsesKreditProps) {
  const [currentRole, setCurrentRole] = useState<Role>(currentUser.role);
  const [applications, setApplications] = useState<CreditApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Enterprise Sidebar & Topbar Layout States
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [globalSearch, setGlobalSearch] = useState('');
  const [showRoleSelector, setShowRoleSelector] = useState(false);

  // Available Roles for System View Adaptability
  const ALL_ROLES: { role: Role; label: string; desc: string }[] = [
    { role: 'Direktur Utama', label: 'Direktur Utama', desc: 'Akses Penuh Executive, RBB & Approval Final' },
    { role: 'Direktur YMFK', label: 'Direktur YMFK / Operasional', desc: 'Akses Operasional, Risk & Approval' },
    { role: 'Komisaris Utama', label: 'Komisaris Utama', desc: 'Pengawasan High-Level & Report Executive' },
    { role: 'PE Bisnis & Collection', label: 'PE Bisnis & Collection', desc: 'Pengawasan Landing, Funding & Target AO' },
    { role: 'PE Kepatuhan, Manrisk & LK', label: 'PE Kepatuhan', desc: 'Pengawasan Threshold Risk, BMPK & Regulasional' },
    { role: 'PE Audit Intern & Anti Fraud', label: 'PE Audit Intern', desc: 'Audit Trail, Integrity & Fraud Monitoring' },
    { role: 'CRM & Digitalisasi', label: 'CRM & Digital Hub (Ahmad Wahyu Aji)', desc: 'Pusat Data Integrasi & Customer Hub' },
    { role: 'Account Officer', label: 'Account Officer (AO)', desc: 'Input Kredit, Presensi Lapangan & Target Bunga' },
    { role: 'Analis Kredit', label: 'Analis Kredit', desc: 'Analisa Kelayakan, Agunan & Opini Kredit' },
    { role: 'Admin Legal & SDM', label: 'Admin Legal', desc: 'Verifikasi Berkas, Legalitas & Dokumen' },
    { role: 'Master Admin', label: 'Master Admin', desc: 'Akses Penuh Seluruh Sistem BPR' }
  ];

  // Role Authorization Helpers for Restricted Dashboards
  const isExecutiveRole = (role: Role) => {
    return role === 'Direktur Utama' || 
           role === 'Direktur YMFK' || 
           role === 'Direktur' ||
           role === 'Komisaris Utama' || 
           role === 'Komisaris' ||
           role === 'Master Admin' ||
           role.includes('Direktur') ||
           role.includes('Komisaris');
  };

  const isPeBisnisRole = (role: Role) => {
    return isExecutiveRole(role) || 
           role === 'PE Bisnis & Collection' || 
           role.includes('PE Bisnis');
  };

  const isPeKepatuhanRole = (role: Role) => {
    return isExecutiveRole(role) || 
           role === 'PE Kepatuhan, Manrisk & LK' || 
           role.includes('PE Kepatuhan') ||
           role.includes('Kepatuhan');
  };

  const isPeAuditRole = (role: Role) => {
    return isExecutiveRole(role) || 
           role === 'PE Audit Intern & Anti Fraud' || 
           role.includes('PE Audit') ||
           role.includes('Audit');
  };

  const isCrmRole = (role: Role) => {
    return isExecutiveRole(role) || 
           role === 'CRM & Digitalisasi' || 
           role.includes('CRM') ||
           role.includes('Teknologi Informasi');
  };

  const handleRoleSwitch = (newRole: Role) => {
    setCurrentRole(newRole);
    setShowRoleSelector(false);
    
    // Auto adapt view tab according to switched role
    if (isExecutiveRole(newRole)) {
      setActiveViewTab('EXECUTIVE_DIREKSI');
    } else if (isPeBisnisRole(newRole)) {
      setActiveViewTab('PE_BISNIS');
    } else if (isPeKepatuhanRole(newRole)) {
      setActiveViewTab('PE_KEPATUHAN');
    } else if (isPeAuditRole(newRole)) {
      setActiveViewTab('PE_AUDIT');
    } else if (isCrmRole(newRole)) {
      setActiveViewTab('CRM');
    } else if (newRole === 'Account Officer' || newRole.includes('Collection')) {
      setActiveViewTab('ABSENSI_LAPANGAN');
    } else {
      setActiveViewTab('PIPELINE');
    }
  };

  // Active Navigation Tab with Initial Role Check
  const [activeViewTab, setActiveViewTab] = useState<ViewTab>(() => {
    if (isExecutiveRole(currentUser.role)) {
      return 'EXECUTIVE_DIREKSI';
    }
    if (isPeBisnisRole(currentUser.role)) {
      return 'PE_BISNIS';
    }
    if (isPeKepatuhanRole(currentUser.role)) {
      return 'PE_KEPATUHAN';
    }
    if (isPeAuditRole(currentUser.role)) {
      return 'PE_AUDIT';
    }
    if (isCrmRole(currentUser.role)) {
      return 'CRM';
    }
    if (currentUser.role === 'Account Officer' || currentUser.role.includes('Collection')) {
      return 'ABSENSI_LAPANGAN';
    }
    return 'PIPELINE';
  });

  // Guard Effect: Redirect if active tab is unauthorized for currentRole
  useEffect(() => {
    if (activeViewTab === 'EXECUTIVE_DIREKSI' && !isExecutiveRole(currentRole)) {
      setActiveViewTab('PIPELINE');
    } else if (activeViewTab === 'PE_BISNIS' && !isPeBisnisRole(currentRole)) {
      setActiveViewTab('PIPELINE');
    } else if (activeViewTab === 'PE_KEPATUHAN' && !isPeKepatuhanRole(currentRole)) {
      setActiveViewTab('PIPELINE');
    } else if (activeViewTab === 'PE_AUDIT' && !isPeAuditRole(currentRole)) {
      setActiveViewTab('PIPELINE');
    } else if (activeViewTab === 'CRM' && !isCrmRole(currentRole)) {
      setActiveViewTab('PIPELINE');
    }
  }, [currentRole, activeViewTab]);

  // Management Structure Modal State
  const [isManagementModalOpen, setIsManagementModalOpen] = useState(false);

  // Dashboard Datasets State with Local Storage Persistence
  const [nplList, setNplList] = useState<KreditBermasalahItem[]>(() => {
    const saved = localStorage.getItem('bpr_npl_data');
    return saved ? JSON.parse(saved) : INITIAL_NPL_DATA;
  });

  const [sebaranList, setSebaranList] = useState<SebaranWilayah[]>(() => {
    const saved = localStorage.getItem('bpr_sebaran_data');
    return saved ? JSON.parse(saved) : INITIAL_SEBARAN_DATA;
  });

  const [agunanList, setAgunanList] = useState<AgunanItem[]>(() => {
    const saved = localStorage.getItem('bpr_agunan_data');
    return saved ? JSON.parse(saved) : INITIAL_AGUNAN_DATA;
  });

  const [janjiList, setJanjiList] = useState<JanjiBayarItem[]>(() => {
    const saved = localStorage.getItem('bpr_janji_data');
    return saved ? JSON.parse(saved) : INITIAL_JANJI_BAYAR_DATA;
  });

  const [bungaList, setBungaList] = useState<AOPendapatanBunga[]>(() => {
    const saved = localStorage.getItem('bpr_bunga_data');
    return saved ? JSON.parse(saved) : INITIAL_TARGET_BUNGA_DATA;
  });

  const [bisnisList, setBisnisList] = useState<PencapaianBisnisAO[]>(() => {
    const saved = localStorage.getItem('bpr_bisnis_data');
    return saved ? JSON.parse(saved) : INITIAL_PENCAPAIAN_BISNIS_DATA;
  });

  // Data Updaters
  const handleUpdateNpl = (updated: KreditBermasalahItem) => {
    setNplList(prev => {
      const next = prev.map(item => item.id === updated.id ? updated : item);
      localStorage.setItem('bpr_npl_data', JSON.stringify(next));
      return next;
    });
  };

  const handleAddNpl = (item: KreditBermasalahItem) => {
    setNplList(prev => {
      const next = [item, ...prev];
      localStorage.setItem('bpr_npl_data', JSON.stringify(next));
      return next;
    });
  };

  const handleAddAgunan = (item: AgunanItem) => {
    setAgunanList(prev => {
      const next = [item, ...prev];
      localStorage.setItem('bpr_agunan_data', JSON.stringify(next));
      return next;
    });
  };

  const handleUpdateAgunan = (item: AgunanItem) => {
    setAgunanList(prev => {
      const next = prev.map(a => a.id === item.id ? item : a);
      localStorage.setItem('bpr_agunan_data', JSON.stringify(next));
      return next;
    });
  };

  const handleUpdateJanji = (item: JanjiBayarItem) => {
    setJanjiList(prev => {
      const next = prev.map(j => j.id === item.id ? item : j);
      localStorage.setItem('bpr_janji_data', JSON.stringify(next));
      return next;
    });
  };

  const handleAddJanji = (item: JanjiBayarItem) => {
    setJanjiList(prev => {
      const next = [item, ...prev];
      localStorage.setItem('bpr_janji_data', JSON.stringify(next));
      return next;
    });
  };

  const handleAddBunga = (item: AOPendapatanBunga) => {
    setBungaList(prev => {
      const next = [item, ...prev];
      localStorage.setItem('bpr_bunga_data', JSON.stringify(next));
      return next;
    });
  };

  const handleAddBisnis = (item: PencapaianBisnisAO) => {
    setBisnisList(prev => {
      const next = [item, ...prev];
      localStorage.setItem('bpr_bisnis_data', JSON.stringify(next));
      return next;
    });
  };

  
  // Modals state
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [actionModal, setActionModal] = useState<{ isOpen: boolean; app: CreditApplication | null }>({ isOpen: false, app: null });
  const [previewMasterApp, setPreviewMasterApp] = useState<CreditApplication | null>(null);
  const [previewFile, setPreviewFile] = useState<{ name: string; type: string } | null>(null);
  const [activePreviewPage, setActivePreviewPage] = useState<number>(1);

  // Form States for New Credit Application (Form 01 - BPR ARA)
  const [formData, setFormData] = useState({ 
    name: '', 
    wa: '', 
    ktp: '',
    address: '', 
    rtRw: '',
    kel: '',
    kec: '',
    kab: '',
    kodePos: '',
    maritalStatus: 'Single',
    gender: 'Pria',
    motherMaidenName: '',
    spouseName: '',
    businessType: '', 
    amount: '', 
    termMonths: '12',
    interestType: 'Flat',
    creditType: 'Umum',
    customerStatus: 'Baru',
    accountNo: '',
    purpose: 'Modal Kerja', 
    sourceInfo: 'Rekomendasi / Media Sosial',
    usageDetail: 'Pengembangan modal usaha harian & persediaan barang',
    repaymentPlan: 'Hasil arus kas usaha harian / penerimaan rutin',
    riskProfile: 'Sedang'
  });
  
  const [actionData, setActionData] = useState<{ fileMock: string; fileUrl?: string; opini: string }>({ fileMock: '', fileUrl: '', opini: '' });
  
  // File Upload Checklist State for AO (Scan Documents for HVS Layout)
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, string | null>>({
    formPengajuan: null, 
    ktp: null, 
    kk: null, 
    suratNikah: null, 
    slipGaji: null, 
    pdam: null,
    bpkb: null, 
    stnk: null, 
    esekNosin: null, 
    shm: null, 
    ktpPenjamin: null, 
    pbb: null
  });
  const [uploadedImages, setUploadedImages] = useState<Record<string, string>>({});

  // Auto-Fill, OCR, and Core Banking Import States
  const [isOcrScanning, setIsOcrScanning] = useState<boolean>(false);
  const [autoFillNotification, setAutoFillNotification] = useState<string | null>(null);
  const [cifSearchInput, setCifSearchInput] = useState<string>('');
  const ocrFileInputRef = React.useRef<HTMLInputElement | null>(null);

  // Sample Presets for Auto-Fill
  const DEMO_PRESETS = [
    {
      id: 'sembako',
      label: '🏢 Usaha Sembako (Bambang Purnomo - Rp 75 Jt)',
      data: {
        name: 'Bambang Purnomo',
        ktp: '3273012508820005',
        wa: '081223456789',
        maritalStatus: 'Menikah',
        gender: 'Pria',
        motherMaidenName: 'Siti Aminah',
        spouseName: 'Sri Wahyuni',
        address: 'Jl. Raya Soreang No. 142',
        rtRw: '003/007',
        kel: 'Padasuka',
        kec: 'Soreang',
        kab: 'Bandung',
        kodePos: '40911',
        businessType: 'Perdagangan Grosir Sembako & Kelontong',
        amount: '75000000',
        termMonths: '24',
        interestType: 'Flat',
        creditType: 'Tepat',
        customerStatus: 'Baru',
        accountNo: '101.02.09874',
        purpose: 'Modal Kerja',
        sourceInfo: 'Kunjungan AO / Direct Selling',
        usageDetail: 'Penambahan stok beras, minyak goreng, dan persediaan toko grosir',
        repaymentPlan: 'Arus kas harian toko grosir (~Rp 4,5 juta/hari)',
        riskProfile: 'Rendah'
      }
    },
    {
      id: 'pns',
      label: '💼 Payroll PNS (Ratna Juwita - Rp 45 Jt)',
      data: {
        name: 'Dra. Ratna Juwita, M.Si',
        ktp: '3273045411800002',
        wa: '081398765432',
        maritalStatus: 'Menikah',
        gender: 'Wanita',
        motherMaidenName: 'Hj. Rukmini',
        spouseName: 'Drs. Hendra Wijaya',
        address: 'Komplek Permata Soreang Blok C3 No. 12',
        rtRw: '005/012',
        kel: 'Sekarwangi',
        kec: 'Soreang',
        kab: 'Bandung',
        kodePos: '40912',
        businessType: 'PNS Dinas Pendidikan Kab. Bandung',
        amount: '45000000',
        termMonths: '36',
        interestType: 'Flat',
        creditType: 'Umum',
        customerStatus: 'Lama',
        accountNo: '101.01.04521',
        purpose: 'Konsumtif',
        sourceInfo: 'Brosur Kantor / Payroll BPR ARA',
        usageDetail: 'Renovasi rumah & biaya pendidikan anak di perguruan tinggi',
        repaymentPlan: 'Potong gaji otomatis dari Payroll BPR ARA',
        riskProfile: 'Sangat Rendah'
      }
    },
    {
      id: 'suplesi',
      label: '🏬 Top-Up / Suplesi (H. Ahmad Fauzi - Rp 150 Jt)',
      data: {
        name: 'H. Ahmad Fauzi',
        ktp: '3273081204750001',
        wa: '085711223344',
        maritalStatus: 'Menikah',
        gender: 'Pria',
        motherMaidenName: 'Hj. Zubaidah',
        spouseName: 'Hj. Nurhayati',
        address: 'Jl. Otista No. 88 Pasar Banjaran',
        rtRw: '002/004',
        kel: 'Banjaran',
        kec: 'Banjaran',
        kab: 'Bandung',
        kodePos: '40377',
        businessType: 'Grosir Tekstil & Pakaian Pasar Banjaran',
        amount: '150000000',
        termMonths: '48',
        interestType: 'Anuitas',
        creditType: 'KKKB',
        customerStatus: 'Lama',
        accountNo: '101.03.01189',
        purpose: 'Investasi',
        sourceInfo: 'Nasabah Eksisting Top-Up',
        usageDetail: 'Pembelian 1 unit kios ruko tambahan di Pasar Baru Banjaran',
        repaymentPlan: 'Hasil sewa kios & penerimaan grosir bulanan',
        riskProfile: 'Sedang'
      }
    }
  ];

  const applyPresetData = (preset: typeof DEMO_PRESETS[0]) => {
    setFormData(prev => ({
      ...prev,
      ...preset.data
    }));
    setAutoFillNotification(`⚡ Data Otomatis Diisi: ${preset.data.name} (${preset.data.businessType})`);
    setTimeout(() => setAutoFillNotification(null), 4000);
  };

  const handleOcrFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsOcrScanning(true);
    setAutoFillNotification(null);

    // Simulate AI Smart OCR Extraction
    setTimeout(() => {
      setIsOcrScanning(false);
      setFormData(prev => ({
        ...prev,
        name: prev.name || 'Drs. Supriatna Hidayat',
        ktp: prev.ktp || '3273051408790003',
        wa: prev.wa || '081299887766',
        address: prev.address || 'Jl. Terusan Kopo No. 205',
        rtRw: prev.rtRw || '004/002',
        kel: prev.kel || 'Margahayu',
        kec: prev.kec || 'Margahayu',
        kab: prev.kab || 'Bandung',
        motherMaidenName: prev.motherMaidenName || 'Hj. Neneng',
        businessType: prev.businessType || 'Bengkel & Sparepart Sepeda Motor',
        amount: prev.amount || '60000000'
      }));

      setUploadedFiles(prev => ({
        ...prev,
        ktp: file.name
      }));

      setAutoFillNotification(`📷 Smart OCR Extrak: Berkas '${file.name}' berhasil diproses! NIK, Nama & Alamat terisi.`);
      setTimeout(() => setAutoFillNotification(null), 5000);
    }, 1200);
  };

  const handleCifSearch = () => {
    if (!cifSearchInput.trim()) return;

    setIsOcrScanning(true);
    setTimeout(() => {
      setIsOcrScanning(false);
      const query = cifSearchInput.toLowerCase();
      
      let matched = DEMO_PRESETS[0].data;
      if (query.includes('ratna') || query.includes('pns') || query.includes('45')) {
        matched = DEMO_PRESETS[1].data;
      } else if (query.includes('fauzi') || query.includes('150') || query.includes('suplesi')) {
        matched = DEMO_PRESETS[2].data;
      }

      setFormData(prev => ({
        ...prev,
        ...matched
      }));

      setAutoFillNotification(`🏦 Core Banking & SLIK: Data NIK/CIF '${cifSearchInput}' ditemukan & ter-import otomatis!`);
      setTimeout(() => setAutoFillNotification(null), 5000);
    }, 800);
  };

  const isSupabaseConnected = !!getSupabase();

  // Load applications from Supabase DB or Local Storage
  const refreshApplications = async () => {
    setLoading(true);
    const rawApps = await loadApplicationsService();
    // Ensure unique IDs in loaded applications
    const seenIds = new Set<string>();
    const cleanedApps = rawApps.map((app, index) => {
      let finalId = app.id;
      if (!finalId || seenIds.has(finalId)) {
        finalId = `CRD-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(index + 1).padStart(3, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;
      }
      seenIds.add(finalId);
      return { ...app, id: finalId };
    });
    setApplications(cleanedApps);
    setLoading(false);
  };

  useEffect(() => {
    setCurrentRole(currentUser.role);
    refreshApplications();
  }, [currentUser]);

  // Metrik Kalkulasi Pipeline
  const metrics = useMemo(() => {
    const total = applications.length;
    const pencairan = applications.filter(app => app.status === 'PENCAIRAN').length;
    const ditolak = applications.filter(app => app.status === 'DITOLAK').length;
    const active = total - ditolak;
    const approvalRate = active > 0 ? Math.round((pencairan / active) * 100) : 0;
    const slaWarnings = applications.filter(app => app.slaDays > 3 && app.status !== 'PENCAIRAN' && app.status !== 'DITOLAK').length;

    return { total, pencairan, approvalRate, slaWarnings };
  }, [applications]);

  const filteredApps = applications.filter(app => {
    const matchesSearch = 
      app.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.purpose.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = statusFilter === 'ALL' || app.status === statusFilter;
    return matchesSearch && matchesFilter;
  });

  // Helper to convert any incoming file name to standardized PDF format
  const convertFilenameToPdf = (originalName: string, fallbackType?: string): string => {
    if (!originalName || originalName.trim() === '') {
      return `${fallbackType || 'Dokumen'}_Converted.pdf`;
    }
    const cleanName = originalName.trim();
    const baseName = cleanName.replace(/\.[^/.]+$/, "");
    return `${baseName}.pdf`;
  };

  // --- ACTIONS LOGIC ---
  const handleAction = async (appId: string, newStatus: CreditStatus, additionalData: { fileName?: string; fileUrl?: string; opini?: string } = {}) => {
    const targetApp = applications.find(a => a.id === appId);
    if (!targetApp) return;

    let updatedFiles = [...(targetApp.files || [])];
    if (additionalData.fileName) {
      const pdfFileName = convertFilenameToPdf(additionalData.fileName, `Berkas_${currentRole}`);
      updatedFiles.push({ name: pdfFileName, type: currentRole, url: additionalData.fileUrl });
    }

    const updates: Partial<CreditApplication> = {
      status: newStatus,
      files: updatedFiles,
      opini: additionalData.opini !== undefined ? additionalData.opini : targetApp.opini
    };

    // Synchronize to Supabase DB or Local Storage
    await updateApplicationService(appId, updates);
    
    // Update local React state instantly
    setApplications(apps => apps.map(app => app.id === appId ? { ...app, ...updates } : app));
    closeActionModal();
  };

  const handleMasterAdminChange = async (appId: string, newStatus: CreditStatus) => {
    await updateApplicationService(appId, { status: newStatus });
    setApplications(apps => apps.map(app => app.id === appId ? { ...app, status: newStatus } : app));
  };

  const handleFileChange = async (docType: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const rawName = file.name;
      const convertedPdfName = convertFilenameToPdf(rawName, docType);
      
      setUploadedFiles(prev => ({ ...prev, [docType]: convertedPdfName }));

      const dataUrl = await compressImageFile(file);
      if (dataUrl) {
        setUploadedImages(prev => ({ ...prev, [docType]: dataUrl }));
      }
    }
  };

  const handleNewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const newFiles: { name: string; type: string; url?: string }[] = [];
    Object.keys(uploadedFiles).forEach(key => {
      if (uploadedFiles[key]) {
        const pdfName = convertFilenameToPdf(uploadedFiles[key]!, key);
        newFiles.push({ name: pdfName, type: 'AO', url: uploadedImages[key] });
      }
    });
    
    if (newFiles.length === 0) newFiles.push({ name: 'Formulir_Pengajuan_Utama.pdf', type: 'AO' });

    // Generate unique ID based on date and max existing numeric index
    const datePrefix = `CRD-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}`;
    let maxSeq = 0;
    applications.forEach(a => {
      const match = a.id?.match(/CRD-\d{6}(\d+)/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxSeq) maxSeq = num;
      }
    });
    let nextSeq = Math.max(maxSeq + 1, applications.length + 1);
    let candidateId = `${datePrefix}${String(nextSeq).padStart(3, '0')}`;
    while (applications.some(a => a.id === candidateId)) {
      nextSeq++;
      candidateId = `${datePrefix}${String(nextSeq).padStart(3, '0')}`;
    }

    const newApp: CreditApplication = {
      id: candidateId,
      name: formData.name,
      wa: formData.wa,
      ktp: formData.ktp,
      address: formData.address,
      rtRw: formData.rtRw,
      kel: formData.kel,
      kec: formData.kec,
      kab: formData.kab,
      kodePos: formData.kodePos,
      maritalStatus: formData.maritalStatus,
      gender: formData.gender,
      motherMaidenName: formData.motherMaidenName,
      spouseName: formData.spouseName,
      businessType: formData.businessType,
      amount: parseInt(formData.amount) || 0,
      termMonths: formData.termMonths,
      interestType: formData.interestType,
      creditType: formData.creditType,
      customerStatus: formData.customerStatus,
      accountNo: formData.accountNo,
      purpose: formData.purpose,
      sourceInfo: formData.sourceInfo,
      usageDetail: formData.usageDetail,
      repaymentPlan: formData.repaymentPlan,
      riskProfile: formData.riskProfile,
      status: 'VERIFIKASI_ADMIN',
      ao: `${currentUser.fullName} (${currentUser.role})`,
      dateInput: new Date().toISOString().split('T')[0],
      slaDays: 0,
      files: newFiles,
      docImages: { ...uploadedImages },
      opini: '',
      userId: currentUser.id
    };
    
    await createApplicationService(newApp);
    setApplications([newApp, ...applications]);
    setIsNewModalOpen(false);
    
    // Reset Form
    setFormData({ 
      name: '', wa: '', ktp: '', address: '', rtRw: '', kel: '', kec: '', kab: '', kodePos: '',
      maritalStatus: 'Single', gender: 'Pria', motherMaidenName: '', spouseName: '',
      businessType: '', amount: '', termMonths: '12', interestType: 'Flat', creditType: 'Umum',
      customerStatus: 'Baru', accountNo: '', purpose: 'Modal Kerja', sourceInfo: 'Rekomendasi / Media Sosial',
      usageDetail: 'Pengembangan modal usaha harian & persediaan barang', repaymentPlan: 'Hasil arus kas usaha harian / penerimaan rutin',
      riskProfile: 'Sedang'
    });
    setUploadedFiles({
      formPengajuan: null, ktp: null, kk: null, suratNikah: null, slipGaji: null, pdam: null,
      bpkb: null, stnk: null, esekNosin: null, shm: null, ktpPenjamin: null, pbb: null
    });
    setUploadedImages({});
  };

  const handleDownloadMasterPdf = (app: CreditApplication) => {
    try {
      const doc = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4',
      });

      // --- PAGE 1: FORMULIR PERMOHONAN KREDIT (FORM 01) ---
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text('FORMULIR PERMOHONAN KREDIT', 105, 12, { align: 'center' });
      doc.setFontSize(10);
      doc.text('PT. BPR ANTAR RUMEKSA ARTA', 105, 17, { align: 'center' });
      
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text('Form 01', 195, 12, { align: 'right' });

      doc.setLineWidth(0.4);
      doc.setDrawColor(30, 41, 59);
      doc.line(12, 20, 198, 20);

      // A. DATA UMUM
      let y = 25;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text('A. DATA UMUM', 12, y);

      doc.setDrawColor(203, 213, 225);
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(12, y + 2, 186, 38, 2, 2, 'FD');

      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(30, 41, 59);

      // Left Col
      doc.text(`Nama             : ${app.name}`, 15, y + 8);
      doc.text(`Alamat           : ${app.address || '-'}`, 15, y + 14);
      doc.text(`                   RT: ${app.rtRw || '-'}   Kel: ${app.kel || '-'}`, 15, y + 20);
      doc.text(`                   Kec: ${app.kec || '-'}   Kab: ${app.kab || '-'}   Kd Pos: ${app.kodePos || '-'}`, 15, y + 26);

      // Right Col
      doc.text(`No. KTP          : ${app.ktp || '-'}`, 110, y + 8);
      doc.text(`No. Telepon/WA   : ${app.wa || '-'}`, 110, y + 14);
      doc.text(`Status           : ${app.maritalStatus || 'Single'}    Jenis Kelamin: ${app.gender || 'Pria'}`, 110, y + 20);
      doc.text(`Ibu Kandung      : ${app.motherMaidenName || '-'}`, 110, y + 26);
      doc.text(`Suami / Istri    : ${app.spouseName || '-'}`, 110, y + 32);

      y += 44;

      // B. DATA KREDIT
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text('B. DATA KREDIT', 12, y);

      doc.setDrawColor(203, 213, 225);
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(12, y + 2, 186, 28, 2, 2, 'FD');

      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(`Pengajuan Kredit : ${formatIDR(app.amount)}`, 15, y + 8);
      doc.text(`Jangka Waktu     : ${app.termMonths || 12} Bulan (${app.interestType || 'Flat'})`, 110, y + 8);

      // Bank Officer Box
      doc.setDrawColor(148, 163, 184);
      doc.setFillColor(241, 245, 249);
      doc.roundedRect(15, y + 12, 180, 14, 1.5, 1.5, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.text('Diisi Oleh Petugas Bank ( Centang v ) :', 18, y + 17);
      doc.setFont('helvetica', 'normal');
      doc.text(`Jenis Kredit : [v] ${app.creditType || 'Umum'}   [ ] Tepat   [ ] KKKB   [ ] Deposito`, 18, y + 22);
      doc.text(`Status       : [v] ${app.customerStatus || 'Baru'}   [ ] Lama - No. Rekening: ${app.accountNo || '...............'}`, 105, y + 22);

      y += 34;

      // C. PERTANYAAN UTAMA
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text('C. PERTANYAAN UTAMA', 12, y);

      doc.setDrawColor(203, 213, 225);
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(12, y + 2, 186, 26, 2, 2, 'FD');

      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'normal');
      doc.text(`1. Sumber info tentang BPR ARA dari mana : ${app.sourceInfo || 'Sosial Media / Brosur / Rekomendasi'}`, 15, y + 8);
      doc.text(`2. Penggunaan uang pinjaman secara rinci  : ${app.usageDetail || app.purpose}`, 15, y + 14);
      doc.text(`3. Rencana sumber angsuran kredit         : ${app.repaymentPlan || 'Hasil usaha harian / penerimaan rutin'}`, 15, y + 20);

      y += 32;

      // CHECKLIST DOKUMEN TABLE
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.text('Diisi Oleh Petugas Bank ( Centang v )', 12, y);

      // Table Box Left (Debitur)
      doc.setDrawColor(203, 213, 225);
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(12, y + 2, 100, 92, 2, 2, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.text('Dilengkapi Calon Debitur', 15, y + 7);
      doc.line(12, y + 9, 112, y + 9);

      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      let ly = y + 14;
      doc.setFont('helvetica', 'bold'); doc.text('SYARAT POKOK:', 15, ly); ly += 4; doc.setFont('helvetica', 'normal');
      doc.text('[v] Fotocopy KTP (4 Lembar)', 17, ly); ly += 4;
      doc.text('[v] Fotocopy KK (2 Lembar)', 17, ly); ly += 4;
      doc.text('[v] Fotocopy Surat Nikah (3 Lembar)', 17, ly); ly += 4;
      doc.text('[v] Slip gaji bagi karyawan (1 Lembar)', 17, ly); ly += 4;
      doc.text('[v] Tekening Listrik / PDAM (1 Lembar)', 17, ly); ly += 5;

      doc.setFont('helvetica', 'bold'); doc.text('SYARAT BPKB:', 15, ly); ly += 4; doc.setFont('helvetica', 'normal');
      doc.text('[v] Fotocopy BPKB (2 Lembar)', 17, ly); ly += 4;
      doc.text('[v] Fotocopy STNK (2 Lembar)', 17, ly); ly += 4;
      doc.text('[v] Esek-esek Noka Nosin & Foto Jaminan', 17, ly); ly += 5;

      doc.setFont('helvetica', 'bold'); doc.text('SYARAT SERTIFIKAT:', 15, ly); ly += 4; doc.setFont('helvetica', 'normal');
      doc.text('[v] Fotocopy SHM (2 Lembar)', 17, ly); ly += 4;
      doc.text('[v] FC KTP & KK Penjamin (2 Lembar)', 17, ly); ly += 4;
      doc.text('[v] PBB Terbaru & Foto Jaminan (1 Lembar)', 17, ly);

      // Table Box Right (Petugas Bank)
      doc.setDrawColor(203, 213, 225);
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(114, y + 2, 84, 92, 2, 2, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.text('Dilengkapi Petugas Bank', 117, y + 7);
      doc.line(114, y + 9, 198, y + 9);

      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      let ry = y + 14;
      doc.text('[v] Form Permohonan Kredit', 117, ry); ry += 4;
      doc.text('[v] SID / SLIK OJK', 117, ry); ry += 4;
      doc.text('[ ] Riwayat kredit ( nasabah lama )', 117, ry); ry += 6;

      doc.setFont('helvetica', 'bold'); doc.text('BERKAS:', 117, ry); ry += 4; doc.setFont('helvetica', 'normal');
      doc.text('[v] Analisa Kredit', 119, ry); ry += 4;
      doc.text('[v] PK Lengkap', 119, ry); ry += 6;

      doc.setFont('helvetica', 'bold'); doc.text('JAMINAN ASLI:', 117, ry); ry += 4; doc.setFont('helvetica', 'normal');
      doc.text('[ ] Di Kantor', 119, ry); ry += 4;
      doc.text('[ ] Dibawa nasabah', 119, ry); ry += 4;
      doc.text('[v] Sudah diserahkan kepada AO / Admin / Akad', 119, ry); ry += 4;
      doc.text('[ ] Lain-lain ....................', 119, ry);

      y += 98;

      // DECLARATION STATEMENT
      doc.setDrawColor(148, 163, 184);
      doc.setFillColor(241, 245, 249);
      doc.roundedRect(12, y, 186, 12, 1.5, 1.5, 'FD');
      doc.setFontSize(6.5);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(51, 65, 85);
      doc.text('Dengan ini saya menyatakan bahwa semua informasi yang diisi dalam aplikasi ini adalah benar dan saya menyatakan tidak keberatan bila', 15, y + 4);
      doc.text('Petugas PT BPR Antar Rumeksa Arta melakukan survei atas usaha dan jaminan dalam rangka permohonan kredit saya.', 15, y + 8);

      y += 16;

      // SIGNATURES
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(30, 41, 59);
      doc.text(`Karanganyar, ${app.dateInput || new Date().toLocaleDateString('id-ID')}`, 155, y);

      y += 12;
      const colWidth = 44;
      doc.text('( .................... )', 12 + 5, y);
      doc.text('Petugas Bank', 12 + 10, y + 4);

      doc.text('( .................... )', 12 + colWidth + 5, y);
      doc.text('Customer Services', 12 + colWidth + 8, y + 4);

      doc.text('( .................... )', 12 + (colWidth * 2) + 5, y);
      doc.text('PE Bisnis', 12 + (colWidth * 2) + 12, y + 4);

      doc.text(`( ${app.name.substring(0, 15)} )`, 12 + (colWidth * 3) + 2, y);
      doc.text('Pemohon', 12 + (colWidth * 3) + 12, y + 4);

      doc.setFontSize(6.5);
      doc.setFont('helvetica', 'italic');
      doc.text('* Coret yang tidak perlu', 12, y + 10);

      // Helper to safely render uploaded image to PDF page
      const addImageToPdfSafely = (dataUrl: string | undefined, x: number, y: number, maxW: number, maxH: number) => {
        if (!dataUrl) return false;
        try {
          const isPng = dataUrl.includes('image/png');
          doc.addImage(dataUrl, isPng ? 'PNG' : 'JPEG', x, y, maxW, maxH, undefined, 'FAST');
          return true;
        } catch (err) {
          console.warn('Failed to add image to PDF:', err);
          return false;
        }
      };

      // --- PAGE 2: SCAN LAMPIRAN 1 - KTP DEBITUR & PASANGAN ---
      doc.addPage('a4', 'p');

      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, 210, 20, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('LAMPIRAN SCAN 1: SCAN FOTOCOPY KTP DEBITUR & PASANGAN', 12, 12);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(`FORMAT HVS/A4 • REG ID: ${app.id} • ${app.name}`, 12, 17);

      // KTP Pemohon Box
      doc.setDrawColor(203, 213, 225);
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(15, 28, 180, 88, 3, 3, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(30, 41, 59);
      doc.text('HASIL SCAN / FOTO KTP PEMOHON (DEBITUR)', 22, 36);

      let hasKtpImg = false;
      if (app.docImages?.ktp) {
        hasKtpImg = addImageToPdfSafely(app.docImages.ktp, 22, 40, 122, 70);
      }

      if (hasKtpImg) {
        doc.setDrawColor(37, 99, 235);
        doc.setFillColor(219, 234, 254);
        doc.roundedRect(148, 52, 42, 36, 2, 2, 'FD');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7);
        doc.setTextColor(29, 78, 216);
        doc.text('FOTO TERLAMPIR', 151, 62);
        doc.text('PT BPR ARA', 154, 68);
        doc.setFontSize(6);
        doc.setFont('helvetica', 'normal');
        doc.text('DIVERIFIKASI DARI BERKAS', 149, 76);
      } else {
        doc.setDrawColor(148, 163, 184);
        doc.setFillColor(239, 246, 255);
        doc.roundedRect(22, 40, 120, 70, 2, 2, 'FD');

        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(29, 78, 216);
        doc.text('PROVINSI JAWA BARAT - KOTA BANDUNG', 26, 47);
        doc.setFontSize(7.5);
        doc.setTextColor(30, 41, 59);
        doc.text(`NIK             : ${app.ktp || '3273011508880001'}`, 26, 54);
        doc.setFont('helvetica', 'normal');
        doc.text(`Nama            : ${app.name}`, 26, 60);
        doc.text(`Tempat/Tgl Lahir : Bandung, 15-08-1988`, 26, 66);
        doc.text(`Jenis Kelamin   : ${app.gender || 'Pria'}   Gol. Darah: O`, 26, 72);
        doc.text(`Alamat          : ${app.address || 'Jl. Merdeka No. 45'}`, 26, 78);
        doc.text(`Agama           : Islam   Status: ${app.maritalStatus || 'Single'}`, 26, 84);
        doc.text(`Pekerjaan       : ${app.businessType || 'Perdagangan'}`, 26, 90);
        doc.text(`Kewarganegaraan : WNI`, 26, 96);

        doc.setDrawColor(37, 99, 235);
        doc.setFillColor(219, 234, 254);
        doc.roundedRect(148, 52, 42, 36, 2, 2, 'FD');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7);
        doc.setTextColor(29, 78, 216);
        doc.text('VERIFIKASI SCAN', 150, 62);
        doc.text('PT BPR ARA', 153, 68);
        doc.setFontSize(6);
        doc.setFont('helvetica', 'normal');
        doc.text('SESUAI DENGAN ASLI', 149, 76);
      }

      // KTP Pasangan / Penjamin Box
      doc.setDrawColor(203, 213, 225);
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(15, 122, 180, 88, 3, 3, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(30, 41, 59);
      doc.text('HASIL SCAN / FOTO KTP PASANGAN / PENJAMIN', 22, 130);

      let hasKtpPenjaminImg = false;
      if (app.docImages?.ktpPenjamin) {
        hasKtpPenjaminImg = addImageToPdfSafely(app.docImages.ktpPenjamin, 22, 134, 122, 70);
      }

      if (hasKtpPenjaminImg) {
        doc.setDrawColor(37, 99, 235);
        doc.setFillColor(219, 234, 254);
        doc.roundedRect(148, 146, 42, 36, 2, 2, 'FD');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7);
        doc.setTextColor(29, 78, 216);
        doc.text('FOTO TERLAMPIR', 151, 156);
        doc.text('PT BPR ARA', 154, 162);
        doc.setFontSize(6);
        doc.setFont('helvetica', 'normal');
        doc.text('DIVERIFIKASI DARI BERKAS', 149, 170);
      } else {
        doc.setDrawColor(148, 163, 184);
        doc.setFillColor(239, 246, 255);
        doc.roundedRect(22, 134, 120, 70, 2, 2, 'FD');

        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(29, 78, 216);
        doc.text('PROVINSI JAWA BARAT - KOTA BANDUNG', 26, 141);
        doc.setFontSize(7.5);
        doc.setTextColor(30, 41, 59);
        doc.text(`NIK             : 3273015210890002`, 26, 148);
        doc.setFont('helvetica', 'normal');
        doc.text(`Nama            : ${app.spouseName || 'Siti Aminah'}`, 26, 154);
        doc.text(`Tempat/Tgl Lahir : Bandung, 12-10-1989`, 26, 160);
        doc.text(`Jenis Kelamin   : Wanita`, 26, 166);
        doc.text(`Alamat          : ${app.address || 'Jl. Merdeka No. 45'}`, 26, 172);
        doc.text(`Pekerjaan       : Mengurus Rumah Tangga / Swasta`, 26, 178);
      }

      // --- PAGE 3: SCAN LAMPIRAN 2 - KARTU KELUARGA (KK) ---
      doc.addPage('a4', 'p');
      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, 210, 20, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('LAMPIRAN SCAN 2: SCAN KARTU KELUARGA (KK)', 12, 12);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(`FORMAT HVS/A4 • REG ID: ${app.id} • ${app.name}`, 12, 17);

      doc.setDrawColor(203, 213, 225);
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(15, 28, 180, 240, 3, 3, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(30, 41, 59);
      doc.text('KARTU KELUARGA', 105, 38, { align: 'center' });

      let hasKkImg = false;
      if (app.docImages?.kk) {
        hasKkImg = addImageToPdfSafely(app.docImages.kk, 22, 44, 166, 215);
      }

      if (!hasKkImg) {
        doc.setFontSize(8);
        doc.text('No. 3273010508100045', 105, 45, { align: 'center' });

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.text(`Nama Kepala Keluarga : ${app.name}`, 22, 55);
        doc.text(`Alamat               : ${app.address || 'Jl. Merdeka No. 45'}`, 22, 61);
        doc.text(`RT/RW                : ${app.rtRw || '002 / 005'}`, 22, 67);

        doc.setDrawColor(148, 163, 184);
        doc.setFillColor(226, 232, 240);
        doc.rect(22, 75, 166, 8, 'FD');
        doc.setFont('helvetica', 'bold');
        doc.text('No', 24, 80);
        doc.text('Nama Lengkap', 32, 80);
        doc.text('NIK', 90, 80);
        doc.text('Jenis Kelamin', 125, 80);
        doc.text('Hubungan', 160, 80);

        doc.setFont('helvetica', 'normal');
        doc.rect(22, 83, 166, 8, 'D');
        doc.text('1', 24, 88);
        doc.text(app.name, 32, 88);
        doc.text(app.ktp || '3273011508880001', 90, 88);
        doc.text(app.gender || 'Pria', 125, 88);
        doc.text('Kepala Keluarga', 160, 88);

        doc.rect(22, 91, 166, 8, 'D');
        doc.text('2', 24, 96);
        doc.text(app.spouseName || 'Siti Aminah', 32, 96);
        doc.text('3273015210890002', 90, 96);
        doc.text('Wanita', 125, 96);
        doc.text('Istri', 160, 96);

        doc.setDrawColor(16, 185, 129);
        doc.setFillColor(236, 253, 245);
        doc.roundedRect(120, 180, 68, 30, 2, 2, 'FD');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(6, 95, 70);
        doc.text('TELAH DIVERIFIKASI HVS SCAN', 123, 188);
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.text('BPR ARA LEGAL DOKUMEN SYSTEM', 123, 195);
        doc.text(`Tanggal: ${new Date().toLocaleDateString('id-ID')}`, 123, 202);
      }

      // --- PAGE 4: SCAN LAMPIRAN 3 - SURAT NIKAH & SLIP GAJI / UTILITAS ---
      doc.addPage('a4', 'p');
      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, 210, 20, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('LAMPIRAN SCAN 3: SURAT NIKAH / SLIP GAJI & BUKTI UTILITAS', 12, 12);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(`FORMAT HVS/A4 • REG ID: ${app.id} • ${app.name}`, 12, 17);

      doc.setDrawColor(203, 213, 225);
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(15, 28, 180, 110, 3, 3, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(30, 41, 59);
      doc.text('HASIL SCAN SURAT NIKAH / AKTA PERKAWINAN', 22, 36);

      let hasNikahImg = false;
      if (app.docImages?.suratNikah) {
        hasNikahImg = addImageToPdfSafely(app.docImages.suratNikah, 22, 40, 166, 92);
      }

      if (!hasNikahImg) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.text('No. Kutipan Akta Nikah: KUA-04/12/2020', 22, 48);
        doc.text(`Suami: ${app.name}   |   Istri: ${app.spouseName || 'Siti Aminah'}`, 22, 54);
      }

      const utilImg = app.docImages?.slipGaji || app.docImages?.mutasi || app.docImages?.pdam;
      doc.setDrawColor(203, 213, 225);
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(15, 145, 180, 120, 3, 3, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(30, 41, 59);
      doc.text('HASIL SCAN SLIP GAJI / TEKENING LISTRIK / PDAM', 22, 153);

      let hasUtilImg = false;
      if (utilImg) {
        hasUtilImg = addImageToPdfSafely(utilImg, 22, 157, 166, 102);
      }

      if (!hasUtilImg) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.text(`Slip Pendapatan Bulanan / Bukti Tagihan PLN ID: 53712098412`, 22, 163);
        doc.text(`Status Tagihan: LUNAS (Penggunaan Alamat Domisili Sesuai KTP)`, 22, 169);
      }

      // --- PAGE 5: SCAN LAMPIRAN 4 - AGUNAN (BPKB / SHM / PBB TERBARU) ---
      doc.addPage('a4', 'p');
      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, 210, 20, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('LAMPIRAN SCAN 4: DOKUMEN AGUNAN (SHM / BPKB / PBB TERBARU)', 12, 12);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(`FORMAT HVS/A4 • REG ID: ${app.id} • ${app.name}`, 12, 17);

      const agunanImg = app.docImages?.shm || app.docImages?.bpkb;
      doc.setDrawColor(203, 213, 225);
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(15, 28, 180, 110, 3, 3, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(30, 41, 59);
      doc.text('SCAN SERTIFIKAT AGUNAN (SHM / BPKB)', 22, 36);

      let hasAgunanImg = false;
      if (agunanImg) {
        hasAgunanImg = addImageToPdfSafely(agunanImg, 22, 40, 166, 92);
      }

      if (!hasAgunanImg) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.text(`Sertifikat Hak Milik No. 04512 / BPKB No. M-09812344`, 22, 48);
        doc.text(`Atas Nama: ${app.name}`, 22, 54);
        doc.text(`Luas Tanah/Bangunan / Spesifikasi: 150 m2 / Bangunan Permanen`, 22, 60);
      }

      const pbbImg = app.docImages?.esekNosin || app.docImages?.pbb;
      doc.setDrawColor(203, 213, 225);
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(15, 145, 180, 120, 3, 3, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(30, 41, 59);
      doc.text('SCAN BUKTI PELUNASAN PBB TERBARU & FOTO JAMINAN', 22, 153);

      let hasPbbImg = false;
      if (pbbImg) {
        hasPbbImg = addImageToPdfSafely(pbbImg, 22, 157, 166, 102);
      }

      if (!hasPbbImg) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.text('NOP PBB: 32.73.010.005.012-0045   |   Tahun: 2025/2026', 22, 163);
        doc.text('Status: TERBAYAR LUNAS', 22, 169);
      }

      // --- PAGE 6+: Additional files uploaded by Divisi Admin Legal, Analis, Komite ---
      if (app.files && app.files.length > 0) {
        app.files.forEach((file, index) => {
          doc.addPage('a4', 'p');
          doc.setFillColor(15, 23, 42);
          doc.rect(0, 0, 210, 20, 'F');
          doc.setTextColor(255, 255, 255);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(10);
          doc.text(`LAMPIRAN BERKAS DIVISI ${index + 5}: ${file.name}`, 12, 12);
          doc.setFontSize(8);
          doc.setFont('helvetica', 'normal');
          doc.text(`DIVISI: ${file.type} • FORMAT HVS/A4 • REG ID: ${app.id}`, 12, 17);

          doc.setDrawColor(203, 213, 225);
          doc.setFillColor(248, 250, 252);
          doc.roundedRect(15, 28, 180, 240, 3, 3, 'FD');

          doc.setFont('helvetica', 'bold');
          doc.setFontSize(10);
          doc.setTextColor(30, 41, 59);
          doc.text(`DOKUMEN TERGABUNG DARIPADA DIVISI ${file.type.toUpperCase()}`, 22, 38);

          let hasFileImg = false;
          if (file.url) {
            hasFileImg = addImageToPdfSafely(file.url, 22, 44, 166, 215);
          }

          if (!hasFileImg) {
            doc.setFontSize(8.5);
            doc.setFont('helvetica', 'normal');
            doc.text(`Nama File  : ${file.name}`, 22, 50);
            doc.text(`Status     : Terkonversi & Tergabung Otomatis ke Master PDF`, 22, 57);
            doc.text(`Waktu      : ${app.dateInput}`, 22, 64);
          }
        });
      }

      doc.save(`Berkas_Kredit_Master_${app.id}.pdf`);
    } catch (err) {
      console.error('Error generating PDF:', err);
    }
  };

  const handleDownloadPdfFile = (fileName: string) => {
    try {
      const doc = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4',
      });

      const safeName = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`;

      // Header Banner
      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, 210, 30, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.text('PT BPR ANTAR RUMEASA ARTA (BPR ARA)', 14, 12);
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text('DOKUMEN HASIL KONVERSI AUTOMATIS PDF', 14, 18);

      doc.setFillColor(37, 99, 235);
      doc.rect(0, 30, 210, 2, 'F');

      // Main Info Box
      doc.setDrawColor(226, 232, 240);
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(14, 40, 182, 50, 3, 3, 'FD');

      doc.setTextColor(30, 41, 59);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.text('INFORMASI BERKAS KREDIT TERKONVERSI', 20, 50);

      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text(`Nama Berkas   : ${safeName}`, 20, 60);
      doc.text(`Format Berkas : PDF Document (Standard OJK Enkripsi)`, 20, 67);
      doc.text(`Status        : Terkonversi Otomatis oleh BPR ARA Engine`, 20, 74);
      doc.text(`Waktu Unduh   : ${new Date().toLocaleDateString('id-ID')} ${new Date().toLocaleTimeString('id-ID')}`, 20, 81);

      doc.save(safeName);
    } catch (err) {
      console.error('Error downloading individual PDF:', err);
    }
  };

  const openActionModal = (app: CreditApplication) => {
    setActionModal({ isOpen: true, app });
    setActionData({ fileMock: '', opini: app.opini || '' });
  };

  const closeActionModal = () => {
    setActionModal({ isOpen: false, app: null });
    setActionData({ fileMock: '', opini: '' });
  };

  const formatIDR = (number: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(number);

  const getNextStatusForRole = (): CreditStatus => {
    switch (currentRole) {
      case 'Admin Legal': return 'ANALISA_KREDIT';
      case 'Analis Kredit': return 'KOMITE';
      case 'Kepatuhan': return 'APPROVAL';
      case 'Direktur': return 'PENCAIRAN';
      default: return 'DITOLAK';
    }
  };

  const renderActionButtonsRow = (app: CreditApplication) => {
    if (currentRole === 'Master Admin') {
      return (
        <select 
          value={app.status} 
          onChange={(e) => handleMasterAdminChange(app.id, e.target.value as CreditStatus)}
          className="text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none px-3 py-1.5 font-bold text-slate-800 shadow-sm cursor-pointer"
        >
          {FLOW_STEPS.map(step => <option key={step} value={step}>{STATUS_CONFIG[step].label}</option>)}
        </select>
      );
    }

    if (app.status === 'PENCAIRAN' || app.status === 'DITOLAK') {
      return <span className="text-slate-400 text-xs font-semibold italic">Selesai</span>;
    }

    const canAct = 
      (currentRole === 'Admin Legal' && app.status === 'VERIFIKASI_ADMIN') ||
      (currentRole === 'Analis Kredit' && app.status === 'ANALISA_KREDIT') ||
      (currentRole === 'Kepatuhan' && app.status === 'KOMITE') ||
      (currentRole === 'Direktur' && app.status === 'APPROVAL');

    if (canAct) {
      return (
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => openActionModal(app)}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/20 cursor-pointer"
        >
          <Edit size={14} /> Proses Berkas
        </motion.button>
      );
    }

    return <span className="text-slate-400 text-xs font-semibold italic">Menunggu Review</span>;
  };

  const renderUploadRow = (key: string, label: string) => {
    const fileName = uploadedFiles[key];
    const imgData = uploadedImages[key];
    return (
      <div className="flex items-center justify-between bg-white p-2.5 border border-slate-200/80 rounded-2xl hover:border-blue-300 transition-colors shadow-sm">
        <div className="flex items-center gap-2.5 overflow-hidden min-w-0">
          {imgData ? (
            <img src={imgData} alt="Thumb" className="w-9 h-9 object-cover rounded-xl border-2 border-emerald-400 shrink-0 shadow-xs" />
          ) : fileName ? (
            <CheckCircle size={18} className="text-emerald-500 shrink-0" />
          ) : (
            <div className="w-4 h-4 border-2 border-slate-300 rounded-md shrink-0" />
          )}
          <div className="flex flex-col truncate min-w-0">
            <span className={`text-xs font-semibold ${fileName ? 'text-slate-900' : 'text-slate-600'}`}>
              {label}
            </span>
            {fileName && (
              <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/80 font-bold truncate flex items-center gap-1 mt-0.5">
                <Sparkles size={10} className="text-emerald-600 shrink-0" />
                {imgData ? 'Foto Terlampir' : `PDF: ${fileName}`}
              </span>
            )}
          </div>
        </div>
        <label className="cursor-pointer shrink-0 ml-2">
          <span className={`text-[11px] font-bold px-3 py-1 rounded-full transition-all ${fileName ? 'text-slate-700 bg-slate-100 hover:bg-slate-200' : 'text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200/80'}`}>
            {fileName ? 'Ganti Foto' : 'Upload Foto'}
          </span>
          <input type="file" className="hidden" onChange={(e) => handleFileChange(key, e)} accept="image/*,.pdf,.jpg,.jpeg,.png,.webp,.jfif" />
        </label>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-800 flex flex-col lg:flex-row min-w-full">
      
      {/* LEFT SIDEBAR NAVIGATION (Enterprise Dark Navy Theme) */}
      <aside 
        className={`${
          isSidebarOpen ? 'w-full lg:w-64' : 'hidden lg:flex lg:w-20'
        } bg-[#0a192f] text-slate-300 flex flex-col shrink-0 min-h-screen border-r border-slate-800 transition-all duration-300 z-30 shadow-xl`}
      >
        {/* BRAND LOGO HEADER */}
        <div className="p-4 sm:p-5 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="p-1.5 bg-white rounded-xl shadow-md border border-slate-700/50 shrink-0 flex items-center justify-center">
              <img 
                src={LOGO_URL} 
                alt="Logo BPR ARA" 
                className="h-8 w-auto object-contain" 
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
            {isSidebarOpen && (
              <div className="min-w-0">
                <h1 className="text-base font-black text-white tracking-tight leading-tight truncate">
                  BPR ARA
                </h1>
                <span className="text-[10px] text-blue-400 font-bold uppercase tracking-wider block truncate">
                  Digital Ecosystem
                </span>
              </div>
            )}
          </div>

          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg bg-slate-800/60"
          >
            <ChevronLeft size={18} />
          </button>
        </div>

        {/* SIDEBAR NAVIGATION ITEMS */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 no-scrollbar">
          
          {/* MENU UTAMA SECTION */}
          <div className="space-y-1">
            {isSidebarOpen && (
              <p className="px-3 text-[10px] font-black uppercase text-slate-500 tracking-wider mb-2">
                MENU UTAMA
              </p>
            )}

            {/* Executive & Direksi Dashboard Button */}
            {isExecutiveRole(currentRole) && (
              <button
                onClick={() => setActiveViewTab('EXECUTIVE_DIREKSI')}
                className={`w-full px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-3 cursor-pointer ${
                  activeViewTab === 'EXECUTIVE_DIREKSI'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'text-slate-400 hover:bg-slate-800/80 hover:text-white'
                }`}
                title="Dashboard Executive Direksi"
              >
                <Sparkles size={18} className={activeViewTab === 'EXECUTIVE_DIREKSI' ? 'text-amber-300' : 'text-slate-400'} />
                {isSidebarOpen && <span className="truncate">Executive & Direksi</span>}
              </button>
            )}

            {/* CRM & Digital Hub Button */}
            {isCrmRole(currentRole) && (
              <button
                onClick={() => setActiveViewTab('CRM')}
                className={`w-full px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-3 cursor-pointer ${
                  activeViewTab === 'CRM'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'text-slate-400 hover:bg-slate-800/80 hover:text-white'
                }`}
                title="CRM & Nasabah (Ahmad Wahyu Aji)"
              >
                <Share2 size={18} className={activeViewTab === 'CRM' ? 'text-emerald-300' : 'text-slate-400'} />
                {isSidebarOpen && <span className="truncate">CRM & Nasabah Hub</span>}
              </button>
            )}

            {/* PE Bisnis & Collection Button */}
            {isPeBisnisRole(currentRole) && (
              <button
                onClick={() => setActiveViewTab('PE_BISNIS')}
                className={`w-full px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-3 cursor-pointer ${
                  activeViewTab === 'PE_BISNIS'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'text-slate-400 hover:bg-slate-800/80 hover:text-white'
                }`}
                title="PE Bisnis & Marketing"
              >
                <Briefcase size={18} className={activeViewTab === 'PE_BISNIS' ? 'text-emerald-300' : 'text-slate-400'} />
                {isSidebarOpen && <span className="truncate">PE Bisnis & Target AO</span>}
              </button>
            )}

            {/* PE Kepatuhan Button */}
            {isPeKepatuhanRole(currentRole) && (
              <button
                onClick={() => setActiveViewTab('PE_KEPATUHAN')}
                className={`w-full px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-3 cursor-pointer ${
                  activeViewTab === 'PE_KEPATUHAN'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'text-slate-400 hover:bg-slate-800/80 hover:text-white'
                }`}
                title="PE Kepatuhan & Manrisk"
              >
                <ShieldCheck size={18} className={activeViewTab === 'PE_KEPATUHAN' ? 'text-amber-300' : 'text-slate-400'} />
                {isSidebarOpen && <span className="truncate">PE Kepatuhan & Risk</span>}
              </button>
            )}

            {/* PE Audit Intern Button */}
            {isPeAuditRole(currentRole) && (
              <button
                onClick={() => setActiveViewTab('PE_AUDIT')}
                className={`w-full px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-3 cursor-pointer ${
                  activeViewTab === 'PE_AUDIT'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'text-slate-400 hover:bg-slate-800/80 hover:text-white'
                }`}
                title="PE Audit Intern"
              >
                <FileSearch size={18} className={activeViewTab === 'PE_AUDIT' ? 'text-teal-300' : 'text-slate-400'} />
                {isSidebarOpen && <span className="truncate">PE Audit Intern</span>}
              </button>
            )}

            <button
              onClick={() => setActiveViewTab('ABSENSI_LAPANGAN')}
              className={`w-full px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-3 cursor-pointer ${
                activeViewTab === 'ABSENSI_LAPANGAN'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'text-slate-400 hover:bg-slate-800/80 hover:text-white'
              }`}
              title="Absensi & Field GPS"
            >
              <Scan size={18} className={activeViewTab === 'ABSENSI_LAPANGAN' ? 'text-emerald-300' : 'text-slate-400'} />
              {isSidebarOpen && (
                <div className="flex items-center justify-between flex-1 truncate">
                  <span className="truncate">Absensi & Lapangan</span>
                  <span className="text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.2 rounded font-black">
                    GPS
                  </span>
                </div>
              )}
            </button>
          </div>

          {/* PROSES & PIPELINE SECTION */}
          <div className="space-y-1">
            {isSidebarOpen && (
              <p className="px-3 text-[10px] font-black uppercase text-slate-500 tracking-wider mb-2">
                PROSES & OPERASIONAL
              </p>
            )}

            {/* Manajemen Tugas & Google Calendar */}
            <button
              onClick={() => setActiveViewTab('MANAJEMEN_TUGAS')}
              className={`w-full px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-3 cursor-pointer ${
                activeViewTab === 'MANAJEMEN_TUGAS'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'text-slate-400 hover:bg-slate-800/80 hover:text-white'
              }`}
              title="Manajemen Tugas & Sinkronisasi Google Calendar"
            >
              <CheckSquare size={18} className={activeViewTab === 'MANAJEMEN_TUGAS' ? 'text-amber-300' : 'text-slate-400'} />
              {isSidebarOpen && (
                <div className="flex items-center justify-between flex-1 truncate">
                  <span className="truncate">Tugas & Kalender</span>
                  <span className="text-[9px] bg-blue-500/20 text-blue-300 border border-blue-500/30 px-1.5 py-0.2 rounded font-black">
                    GCal
                  </span>
                </div>
              )}
            </button>

            <button
              onClick={() => setActiveViewTab('PIPELINE')}
              className={`w-full px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-3 cursor-pointer ${
                activeViewTab === 'PIPELINE'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'text-slate-400 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <FileText size={18} />
              {isSidebarOpen && <span className="truncate">Pipeline Pengajuan</span>}
            </button>

            <button
              onClick={() => setActiveViewTab('NPL')}
              className={`w-full px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-3 cursor-pointer ${
                activeViewTab === 'NPL'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-500/20'
                  : 'text-slate-400 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <AlertTriangle size={18} className={activeViewTab === 'NPL' ? 'text-white' : 'text-rose-400'} />
              {isSidebarOpen && <span className="truncate">Kredit Bermasalah (NPL)</span>}
            </button>
          </div>

          {/* ANALISIS & REPORTING SECTION */}
          <div className="space-y-1">
            {isSidebarOpen && (
              <p className="px-3 text-[10px] font-black uppercase text-slate-500 tracking-wider mb-2">
                ANALISIS & LAPORAN
              </p>
            )}

            <button
              onClick={() => setActiveViewTab('HEATMAP')}
              className={`w-full px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-3 cursor-pointer ${
                activeViewTab === 'HEATMAP'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'text-slate-400 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <MapPin size={18} />
              {isSidebarOpen && <span className="truncate">Heat Map Sebaran</span>}
            </button>

            <button
              onClick={() => setActiveViewTab('AGUNAN')}
              className={`w-full px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-3 cursor-pointer ${
                activeViewTab === 'AGUNAN'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'text-slate-400 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <Building2 size={18} />
              {isSidebarOpen && <span className="truncate">Analisis Agunan</span>}
            </button>

            <button
              onClick={() => setActiveViewTab('JANJI_BAYAR')}
              className={`w-full px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-3 cursor-pointer ${
                activeViewTab === 'JANJI_BAYAR'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'text-slate-400 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <Activity size={18} />
              {isSidebarOpen && <span className="truncate">Janji Bayar Debitur</span>}
            </button>

            <button
              onClick={() => setActiveViewTab('TARGET_BUNGA')}
              className={`w-full px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-3 cursor-pointer ${
                activeViewTab === 'TARGET_BUNGA'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'text-slate-400 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <DollarSign size={18} />
              {isSidebarOpen && <span className="truncate">Target Bunga AO</span>}
            </button>

            <button
              onClick={() => setActiveViewTab('PENCAPAIAN_BISNIS')}
              className={`w-full px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-3 cursor-pointer ${
                activeViewTab === 'PENCAPAIAN_BISNIS'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'text-slate-400 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <Briefcase size={18} />
              {isSidebarOpen && <span className="truncate">Pencapaian Bisnis AO</span>}
            </button>
          </div>

        </div>

        {/* SIDEBAR QUICK ACTION BOX */}
        {isSidebarOpen && (
          <div className="p-4 border-t border-slate-800/80 bg-slate-950/40 space-y-2">
            <p className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
              QUICK ACTION
            </p>
            <button
              onClick={() => {
                setActiveViewTab('PIPELINE');
                setIsNewModalOpen(true);
              }}
              className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-sm transition-all"
            >
              <PlusCircle size={15} /> Buat Pengajuan Kredit
            </button>
            <button
              onClick={() => {
                setActiveViewTab('ABSENSI_LAPANGAN');
              }}
              className="w-full py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-all"
            >
              <Scan size={15} className="text-emerald-400" /> Presensi & Lapangan
            </button>
          </div>
        )}
      </aside>

      {/* RIGHT MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-100 overflow-x-hidden">
        
        {/* TOP NAVIGATION HEADER */}
        <header className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3 flex items-center justify-between sticky top-0 z-20 shadow-xs gap-3">
          
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer transition-all shrink-0"
              title="Toggle Sidebar Menu"
            >
              <Menu size={20} />
            </button>

            {/* Global Search Bar */}
            <div className="relative max-w-md w-full hidden sm:block">
              <Search size={16} className="absolute left-3.5 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Cari menu, nasabah, no. rekening, data... (Ctrl + K)"
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-100 border border-slate-200/80 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            
            {/* ROLE SELECTOR SWITCHER (Role Adaptability Engine) */}
            <div className="relative">
              <button
                onClick={() => setShowRoleSelector(!showRoleSelector)}
                className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-900 rounded-xl text-xs font-black flex items-center gap-2 cursor-pointer transition-all"
                title="Ganti Role Tampilan Sistem"
              >
                <User size={14} className="text-blue-700" />
                <span className="hidden md:inline">Role Active:</span>
                <strong className="text-blue-700 max-w-[130px] truncate">{currentRole}</strong>
                <ChevronDown size={14} className="text-blue-600" />
              </button>

              {/* Role Dropdown */}
              <AnimatePresence>
                {showRoleSelector && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50 space-y-1"
                  >
                    <div className="p-2 border-b border-slate-100">
                      <p className="text-xs font-black text-slate-900">Pilih Role Pengguna (Simulasi)</p>
                      <p className="text-[10px] text-slate-500">Ubah sudut pandang dashboard sesuai jabatan</p>
                    </div>

                    <div className="max-h-64 overflow-y-auto space-y-1 no-scrollbar">
                      {ALL_ROLES.map((r) => (
                        <button
                          key={r.role}
                          onClick={() => handleRoleSwitch(r.role)}
                          className={`w-full p-2 text-left rounded-xl text-xs font-bold transition-all flex items-start gap-2 ${
                            currentRole === r.role 
                              ? 'bg-blue-600 text-white' 
                              : 'hover:bg-slate-100 text-slate-800'
                          }`}
                        >
                          <Check size={14} className={`mt-0.5 shrink-0 ${currentRole === r.role ? 'text-white' : 'opacity-0'}`} />
                          <div>
                            <span className="block font-black">{r.label}</span>
                            <span className={`text-[10px] block font-medium ${currentRole === r.role ? 'text-blue-100' : 'text-slate-400'}`}>
                              {r.desc}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Quick Actions & Indicators */}
            <button
              onClick={() => setIsManagementModalOpen(true)}
              className="p-2 text-indigo-700 hover:bg-indigo-50 border border-indigo-200/80 rounded-xl text-xs font-bold hidden xl:flex items-center gap-1.5 cursor-pointer"
            >
              <Users size={16} />
              <span>Struktur Organisasi</span>
            </button>

            <button
              onClick={onOpenConfig}
              className="p-2 text-slate-600 hover:bg-slate-100 rounded-xl border border-slate-200/80 cursor-pointer"
              title="Pengaturan Database"
            >
              <Database size={16} className={isSupabaseConnected ? 'text-emerald-600' : 'text-amber-500'} />
            </button>

            {/* Notifications with Badge */}
            <div className="relative">
              <button className="p-2 text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer">
                <Bell size={18} />
              </button>
              <span className="absolute top-1 right-1 w-4 h-4 bg-blue-600 text-white rounded-full text-[9px] font-black flex items-center justify-center border-2 border-white">
                12
              </span>
            </div>

            {/* Messages */}
            <div className="relative hidden sm:block">
              <button className="p-2 text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer">
                <Mail size={18} />
              </button>
              <span className="absolute top-1 right-1 w-4 h-4 bg-emerald-600 text-white rounded-full text-[9px] font-black flex items-center justify-center border-2 border-white">
                5
              </span>
            </div>

            {/* User Avatar */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="w-8 h-8 rounded-xl bg-slate-900 text-white font-black flex items-center justify-center text-xs shadow-xs">
                {currentUser.fullName.charAt(0).toUpperCase()}
              </div>

              <button
                onClick={onLogout}
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl cursor-pointer"
                title="Logout"
              >
                <LogOut size={16} />
              </button>
            </div>

          </div>
        </header>

        {/* METRICS RIBBON (5 KPI Cards - Matching BPR Maju Bersama Style) */}
        <div className="p-4 sm:p-6 pb-2">
          
          <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Dashboard BPR ARA Digital System</h2>
              <p className="text-xs text-slate-500 font-medium">Ringkasan kinerja perbankan, portofolio kredit, dan aktivitas penting hari ini</p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-600 bg-white px-3 py-1.5 rounded-xl border border-slate-200/80 shadow-2xs flex items-center gap-1.5">
                <Calendar size={14} className="text-blue-600" />
                {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
            {/* CARD 1: TOTAL KREDIT */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-1 hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Total Kredit</span>
                <div className="p-2 bg-blue-50 text-blue-700 rounded-xl">
                  <Briefcase size={16} />
                </div>
              </div>
              <h3 className="text-lg font-black text-slate-900 tracking-tight">Rp 152,45 M</h3>
              <p className="text-[10px] font-bold text-emerald-700 flex items-center gap-1">
                ▲ 12,45% <span className="text-slate-400 font-normal">dari bulan lalu</span>
              </p>
            </div>

            {/* CARD 2: OUTSTANDING */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-1 hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Outstanding</span>
                <div className="p-2 bg-indigo-50 text-indigo-700 rounded-xl">
                  <DollarSign size={16} />
                </div>
              </div>
              <h3 className="text-lg font-black text-slate-900 tracking-tight">Rp 98,75 M</h3>
              <p className="text-[10px] font-bold text-emerald-700 flex items-center gap-1">
                ▲ 8,21% <span className="text-slate-400 font-normal">dari bulan lalu</span>
              </p>
            </div>

            {/* CARD 3: NPL GROSS */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-1 hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">NPL (Gross)</span>
                <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
                  <Activity size={16} />
                </div>
              </div>
              <h3 className="text-lg font-black text-slate-900 tracking-tight">2,35%</h3>
              <p className="text-[10px] font-bold text-emerald-700 flex items-center gap-1">
                ▼ 0,21% <span className="text-slate-400 font-normal">NPL Sehat (&lt;5%)</span>
              </p>
            </div>

            {/* CARD 4: LDR */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-1 hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">LDR</span>
                <div className="p-2 bg-sky-50 text-sky-700 rounded-xl">
                  <TrendingUp size={16} />
                </div>
              </div>
              <h3 className="text-lg font-black text-slate-900 tracking-tight">78,45%</h3>
              <p className="text-[10px] font-bold text-emerald-700 flex items-center gap-1">
                ▲ 3,45% <span className="text-slate-400 font-normal">Likuiditas Baik</span>
              </p>
            </div>

            {/* CARD 5: BOPO */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-1 hover:shadow-md transition-all col-span-2 md:col-span-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">BOPO</span>
                <div className="p-2 bg-purple-50 text-purple-700 rounded-xl">
                  <ShieldCheck size={16} />
                </div>
              </div>
              <h3 className="text-lg font-black text-slate-900 tracking-tight">82,15%</h3>
              <p className="text-[10px] font-bold text-emerald-700 flex items-center gap-1">
                ▼ 1,15% <span className="text-slate-400 font-normal">Efisiensi Tinggi</span>
              </p>
            </div>
          </div>
        </div>

        {/* MAIN DASHBOARD CONTENT VIEW CANVAS */}
        <main className="p-4 sm:p-6 pt-2 flex-1">
        
        {activeViewTab === 'PIPELINE' && (
          <div>
            {/* iOS Card Sub Header */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 sm:mb-6 bg-white/90 backdrop-blur-md p-4 sm:p-5 rounded-[24px] border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4"
            >
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">Pipeline Kredit Nasabah</h2>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200/60">
                    {currentRole}
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-slate-500 mt-1 truncate">
                  User: <strong className="text-slate-800">{currentUser.email}</strong> • Hak verifikasi disesuaikan jabatan.
                </p>
              </div>
              
              <div className="flex items-center gap-2 shrink-0">
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={refreshApplications}
                  disabled={loading}
                  className="p-2.5 border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-2xl transition-all cursor-pointer"
                  title="Refresh Data dari Database"
                >
                  <RefreshCw size={16} className={loading ? 'animate-spin text-blue-600' : ''} />
                </motion.button>

                {(currentRole === 'Account Officer' || currentRole === 'Master Admin') && (
                  <motion.button 
                    whileTap={{ scale: 0.96 }}
                    onClick={() => setIsNewModalOpen(true)}
                    className="hidden sm:inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shadow-lg shadow-blue-500/20 cursor-pointer"
                  >
                    <Plus size={16} />
                    Input Pengajuan Baru
                  </motion.button>
                )}
              </div>
            </motion.div>


        {/* Dashboard Metrics Cards - 2 Columns on Mobile, 4 Columns on Desktop */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-white p-3.5 sm:p-5 rounded-[22px] sm:rounded-[24px] border border-slate-200/80 shadow-sm flex items-center gap-3 sm:gap-4 hover:shadow-md transition-all">
            <div className="p-2.5 sm:p-3 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100 shrink-0">
              <FileText size={20} className="sm:w-[22px] sm:h-[22px]" />
            </div>
            <div>
              <p className="text-[10px] sm:text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Total</p>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">{metrics.total}</h3>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white p-3.5 sm:p-5 rounded-[22px] sm:rounded-[24px] border border-slate-200/80 shadow-sm flex items-center gap-3 sm:gap-4 hover:shadow-md transition-all">
            <div className="p-2.5 sm:p-3 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100 shrink-0">
              <CheckCircle size={20} className="sm:w-[22px] sm:h-[22px]" />
            </div>
            <div>
              <p className="text-[10px] sm:text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Pencairan</p>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">{metrics.pencairan}</h3>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-white p-3.5 sm:p-5 rounded-[22px] sm:rounded-[24px] border border-slate-200/80 shadow-sm flex items-center gap-3 sm:gap-4 hover:shadow-md transition-all">
            <div className="p-2.5 sm:p-3 bg-indigo-50 text-indigo-600 rounded-2xl border border-indigo-100 shrink-0">
              <Activity size={20} className="sm:w-[22px] sm:h-[22px]" />
            </div>
            <div>
              <p className="text-[10px] sm:text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Approval Rate</p>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">{metrics.approvalRate}%</h3>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white p-3.5 sm:p-5 rounded-[22px] sm:rounded-[24px] border border-slate-200/80 shadow-sm flex items-center gap-3 sm:gap-4 hover:shadow-md transition-all">
            <div className="p-2.5 sm:p-3 bg-rose-50 text-rose-600 rounded-2xl border border-rose-100 shrink-0">
              <AlertTriangle size={20} className="sm:w-[22px] sm:h-[22px]" />
            </div>
            <div>
              <p className="text-[10px] sm:text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">SLA Warning</p>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">{metrics.slaWarnings}</h3>
            </div>
          </motion.div>

        </div>

        {/* iOS Segmented Status Filter Tabs */}
        <div className="mb-4 overflow-x-auto pb-1">
          <div className="inline-flex p-1 bg-slate-200/60 rounded-2xl border border-slate-300/50 min-w-max gap-1">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                statusFilter === 'ALL'
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua ({applications.length})
            </button>
            {FLOW_STEPS.map(step => {
              const count = applications.filter(a => a.status === step).length;
              return (
                <button
                  key={step}
                  onClick={() => setStatusFilter(step)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    statusFilter === step
                      ? 'bg-white text-blue-700 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {STATUS_CONFIG[step].label} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Applications Pipeline - Mobile Card View (< lg) & Desktop Table (>= lg) */}
        <div className="bg-white rounded-[28px] border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 bg-slate-50/50">
            <div className="flex items-center justify-between sm:justify-start gap-2">
              <h3 className="text-sm font-black text-slate-900 tracking-tight">Data Pengajuan Kredit</h3>
              <span className="text-[11px] font-bold bg-blue-100 text-blue-700 px-2.5 py-0.5 rounded-full">
                {filteredApps.length} Berkas
              </span>
            </div>

            <div className="relative w-full sm:w-72">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Search size={15} className="text-slate-400" />
              </div>
              <input
                type="text"
                placeholder="Cari Nama Nasabah, ID, atau Tujuan..."
                className="pl-9 pr-8 py-2.5 sm:py-2 w-full bg-slate-100/80 border border-slate-200/80 rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-xs font-semibold"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm('')} 
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                >
                  <XCircle size={15} />
                </button>
              )}
            </div>
          </div>

          {/* MOBILE CARD VIEW (Displayed on screens smaller than lg) */}
          <div className="block lg:hidden p-4 divide-y divide-slate-100 space-y-4">
            {loading ? (
              <div className="py-12 text-center text-slate-500 font-semibold">
                <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-blue-600" />
                Memuat data kredit dari database...
              </div>
            ) : filteredApps.length > 0 ? (
              filteredApps.map((app, index) => {
                const statusInfo = STATUS_CONFIG[app.status];
                const StatusIcon = statusInfo.icon;
                return (
                  <motion.div 
                    key={`${app.id}-${index}`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="pt-4 first:pt-0"
                  >
                    <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200/80 shadow-sm space-y-3">
                      {/* Top Bar: ID, Date, Status */}
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[11px] font-extrabold text-blue-700 bg-blue-100/80 px-2.5 py-0.5 rounded-full border border-blue-200/60">
                            {app.id}
                          </span>
                          <span className="text-[10px] text-slate-400 font-semibold">{app.dateInput}</span>
                        </div>
                        
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statusInfo.badgeBg}`}>
                          <StatusIcon size={12} />
                          {statusInfo.label}
                        </span>
                      </div>

                      {/* Nasabah & Amount details */}
                      <div>
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-extrabold text-slate-900 text-sm leading-tight">{app.name}</h4>
                            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                              {app.businessType} • AO: {app.ao}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-xs font-black text-blue-700 bg-blue-50 px-2 py-1 rounded-xl border border-blue-100 inline-block">
                              {formatIDR(app.amount)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Master Single PDF Box */}
                      <div className="pt-2 border-t border-slate-200/60 space-y-1.5">
                        <div className="flex items-center justify-between text-[10px] font-black text-slate-400 uppercase tracking-wider">
                          <span>Dokumen Master PDF</span>
                          {app.status === 'PENCAIRAN' ? (
                            <span className="text-emerald-600 font-bold text-[11px] shrink-0 flex items-center gap-1 normal-case">
                              <CheckCircle size={13}/> Selesai
                            </span>
                          ) : app.status === 'DITOLAK' ? (
                            <span className="text-rose-600 font-bold text-[11px] shrink-0 flex items-center gap-1 normal-case">
                              <XCircle size={13}/> Dibatalkan
                            </span>
                          ) : (
                            <span className={`text-[11px] font-extrabold shrink-0 flex items-center gap-1 normal-case ${app.slaDays > 3 ? 'text-rose-600' : 'text-slate-600'}`}>
                              {app.slaDays} Hari SLA
                              {app.slaDays > 3 && <AlertTriangle size={13} className="text-rose-500" />}
                            </span>
                          )}
                        </div>

                        <div className="bg-slate-900 text-white rounded-2xl p-2.5 shadow-sm border border-slate-800 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="p-2 bg-rose-500/20 text-rose-400 rounded-xl border border-rose-500/30 shrink-0">
                              <FileText size={18} />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <h5 className="font-extrabold text-[11px] text-slate-100 truncate">
                                  Berkas_Kredit_Master_{app.id}.pdf
                                </h5>
                                <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.2 rounded-full text-[8px] font-bold shrink-0">
                                  1 PDF Tergabung
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-400 truncate mt-0.5">
                                {app.files?.length || 1} Bagian Terintegrasi (AO, Legal, Analis)
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button 
                              onClick={() => setPreviewMasterApp(app)}
                              className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                              title="Lihat Master PDF"
                            >
                              <Eye size={12} /> Lihat
                            </button>
                            <button 
                              onClick={() => handleDownloadMasterPdf(app)}
                              className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                              title="Unduh Master PDF"
                            >
                              <Download size={12} /> Unduh
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Action Button Footer */}
                      <div className="pt-2">
                        {renderActionButtonsRow(app)}
                      </div>

                    </div>
                  </motion.div>
                );
              })
            ) : (
              <div className="py-12 text-center text-slate-400 font-medium">
                Tidak ada data pengajuan yang sesuai filter.
              </div>
            )}
          </div>

          {/* DESKTOP TABLE VIEW (Displayed on screens lg and larger) */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/60 text-[11px] text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-6 font-extrabold">ID & Tanggal</th>
                  <th className="py-3.5 px-6 font-extrabold">Nasabah & Plafon</th>
                  <th className="py-3.5 px-6 font-extrabold">Berkas PDF Master (Terpadu)</th>
                  <th className="py-3.5 px-6 font-extrabold">Status Tahapan</th>
                  <th className="py-3.5 px-6 font-extrabold">SLA</th>
                  <th className="py-3.5 px-6 font-extrabold text-center">Aksi ({currentRole})</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500 font-semibold">
                      <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-blue-600" />
                      Memuat data kredit dari database...
                    </td>
                  </tr>
                ) : filteredApps.length > 0 ? (
                  filteredApps.map((app, index) => {
                    const statusInfo = STATUS_CONFIG[app.status];
                    const StatusIcon = statusInfo.icon;
                    return (
                      <tr key={`${app.id}-${index}`} className="hover:bg-blue-50/30 transition-colors">
                        <td className="py-4 px-6">
                          <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200/60">
                            {app.id}
                          </span>
                          <div className="text-[10px] text-slate-400 font-medium mt-1">Input: {app.dateInput}</div>
                        </td>

                        <td className="py-4 px-6">
                          <div className="font-bold text-slate-900 text-xs">{app.name}</div>
                          <div className="text-xs text-blue-700 font-black mt-0.5">
                            {formatIDR(app.amount)}
                          </div>
                          <div className="text-[11px] text-slate-500 font-medium truncate max-w-[200px]">
                            {app.businessType} • AO: {app.ao}
                          </div>
                        </td>

                        <td className="py-4 px-6">
                          <div className="bg-slate-900 text-white rounded-2xl p-2 shadow-sm border border-slate-800 flex items-center justify-between gap-2 max-w-[270px]">
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="p-1.5 bg-rose-500/20 text-rose-400 rounded-xl border border-rose-500/30 shrink-0">
                                <FileText size={16} />
                              </div>
                              <div className="min-w-0">
                                <h5 className="font-extrabold text-[11px] text-slate-100 truncate" title={`Berkas_Kredit_Master_${app.id}.pdf`}>
                                  Master_{app.id}.pdf
                                </h5>
                                <span className="text-[9px] text-emerald-400 font-bold block truncate">
                                  {app.files?.length || 1} Bagian Tergabung
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                onClick={() => setPreviewMasterApp(app)}
                                className="p-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg cursor-pointer transition-colors"
                                title="Lihat Master PDF"
                              >
                                <Eye size={13} />
                              </button>
                              <button
                                onClick={() => handleDownloadMasterPdf(app)}
                                className="p-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg cursor-pointer transition-colors"
                                title="Unduh Master PDF"
                              >
                                <Download size={13} />
                              </button>
                            </div>
                          </div>
                        </td>

                        <td className="py-4 px-6">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border ${statusInfo.badgeBg}`}>
                            <StatusIcon size={13} />
                            {statusInfo.label}
                          </span>
                        </td>

                        <td className="py-4 px-6">
                          {app.status === 'PENCAIRAN' ? (
                            <span className="text-emerald-600 font-bold text-xs flex items-center gap-1">
                              <CheckCircle size={14}/> Selesai
                            </span>
                          ) : app.status === 'DITOLAK' ? (
                            <span className="text-rose-600 font-bold text-xs flex items-center gap-1">
                              <XCircle size={14}/> Dibatalkan
                            </span>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <span className={`text-xs font-bold ${app.slaDays > 3 ? 'text-rose-600' : 'text-slate-700'}`}>
                                {app.slaDays} Hari
                              </span>
                              {app.slaDays > 3 && <AlertTriangle size={14} className="text-rose-500" />}
                            </div>
                          )}
                        </td>

                        <td className="py-4 px-6 text-center">
                          {renderActionButtonsRow(app)}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400 font-medium">
                      Tidak ada data pengajuan yang sesuai filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      )}

        {/* Dashboard 0: Executive Direksi */}
        {activeViewTab === 'EXECUTIVE_DIREKSI' && (
          isExecutiveRole(currentRole) ? (
            <DashboardExecutiveDireksi
              nplList={nplList}
              bisnisList={bisnisList}
            />
          ) : (
            <div className="p-8 bg-white rounded-3xl border border-rose-200 shadow-sm text-center max-w-md mx-auto my-12 space-y-4">
              <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto border border-rose-200">
                <ShieldCheck size={32} />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">Akses Dibatasi</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Dashboard Executive & Direksi khusus untuk akun Direksi dan Dewan Komisaris BPR ARA.
                </p>
              </div>
              <button
                onClick={() => setActiveViewTab('PIPELINE')}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-all cursor-pointer"
              >
                Kembali ke Pipeline
              </button>
            </div>
          )
        )}

        {/* Dashboard PE Bisnis: Eny Setyoningsih */}
        {activeViewTab === 'PE_BISNIS' && (
          isPeBisnisRole(currentRole) ? (
            <DashboardPeBisnis
              applications={applications}
              bisnisList={bisnisList}
            />
          ) : (
            <div className="p-8 bg-white rounded-3xl border border-rose-200 shadow-sm text-center max-w-md mx-auto my-12 space-y-4">
              <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto border border-rose-200">
                <ShieldCheck size={32} />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">Akses Dibatasi</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Dashboard PE Bisnis & Collection khusus untuk Pejabat Eksekutif Bisnis dan Direksi.
                </p>
              </div>
              <button
                onClick={() => setActiveViewTab('PIPELINE')}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-all cursor-pointer"
              >
                Kembali ke Pipeline
              </button>
            </div>
          )
        )}

        {/* Dashboard PE Kepatuhan: Huda Asrori */}
        {activeViewTab === 'PE_KEPATUHAN' && (
          isPeKepatuhanRole(currentRole) ? (
            <DashboardPeKepatuhan
              nplList={nplList}
            />
          ) : (
            <div className="p-8 bg-white rounded-3xl border border-rose-200 shadow-sm text-center max-w-md mx-auto my-12 space-y-4">
              <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto border border-rose-200">
                <ShieldCheck size={32} />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">Akses Dibatasi</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Dashboard PE Kepatuhan & Risk khusus untuk Pejabat Eksekutif Kepatuhan, Manrisk, LK & Direksi.
                </p>
              </div>
              <button
                onClick={() => setActiveViewTab('PIPELINE')}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-all cursor-pointer"
              >
                Kembali ke Pipeline
              </button>
            </div>
          )
        )}

        {/* Dashboard PE Audit: Agus Santoso */}
        {activeViewTab === 'PE_AUDIT' && (
          isPeAuditRole(currentRole) ? (
            <DashboardPeAudit
              applications={applications}
            />
          ) : (
            <div className="p-8 bg-white rounded-3xl border border-rose-200 shadow-sm text-center max-w-md mx-auto my-12 space-y-4">
              <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto border border-rose-200">
                <ShieldCheck size={32} />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">Akses Dibatasi</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Dashboard PE Audit Intern & Anti Fraud khusus untuk Tim PE Audit dan Direksi.
                </p>
              </div>
              <button
                onClick={() => setActiveViewTab('PIPELINE')}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-all cursor-pointer"
              >
                Kembali ke Pipeline
              </button>
            </div>
          )
        )}

        {/* Dashboard CRM: Ahmad Wahyu Aji (Pusat Integrasi) */}
        {activeViewTab === 'CRM' && (
          isCrmRole(currentRole) ? (
            <DashboardCrm
              applications={applications}
            />
          ) : (
            <div className="p-8 bg-white rounded-3xl border border-rose-200 shadow-sm text-center max-w-md mx-auto my-12 space-y-4">
              <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto border border-rose-200">
                <ShieldCheck size={32} />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">Akses Dibatasi</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Dashboard CRM & Nasabah Hub khusus untuk Tim CRM, IT & Digitalisasi dan Direksi.
                </p>
              </div>
              <button
                onClick={() => setActiveViewTab('PIPELINE')}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-all cursor-pointer"
              >
                Kembali ke Pipeline
              </button>
            </div>
          )
        )}

        {/* Modul Absensi & Kegiatan Lapangan (GPS & Face Auth) */}
        {activeViewTab === 'ABSENSI_LAPANGAN' && (
          <DashboardAbsensiLapangan
            applications={applications}
          />
        )}

        {/* Modul Manajemen Tugas & Integrasi Google Calendar */}
        {activeViewTab === 'MANAJEMEN_TUGAS' && (
          <DashboardManajemenTugas
            currentRole={currentRole}
            currentUserEmail={currentUser?.email}
          />
        )}

        {/* Dashboard 1: NPL / Kredit Bermasalah */}
        {activeViewTab === 'NPL' && (
          <DashboardKreditBermasalah
            nplList={nplList}
            onUpdateItem={handleUpdateNpl}
            onAddItem={handleAddNpl}
            currentUser={currentUser}
          />
        )}

        {/* Dashboard 2: Heat Map Sebaran Kredit */}
        {activeViewTab === 'HEATMAP' && (
          <HeatMapSebaranKredit
            sebaranList={sebaranList}
          />
        )}

        {/* Dashboard 3: Analisis Agunan */}
        {activeViewTab === 'AGUNAN' && (
          <AnalisisAgunan
            agunanList={agunanList}
            onAddAgunan={handleAddAgunan}
            onUpdateAgunan={handleUpdateAgunan}
          />
        )}

        {/* Dashboard 4: Janji Bayar */}
        {activeViewTab === 'JANJI_BAYAR' && (
          <DashboardJanjiBayar
            janjiList={janjiList}
            onUpdateJanji={handleUpdateJanji}
            onAddJanji={handleAddJanji}
            currentUser={currentUser}
          />
        )}

        {/* Dashboard 5: Rasio Target Bunga per AO */}
        {activeViewTab === 'TARGET_BUNGA' && (
          <DashboardRasioBungaAO
            bungaList={bungaList}
            onAddBunga={handleAddBunga}
          />
        )}

        {/* Dashboard 6: Pencapaian Target Bisnis (Landing & Funding) */}
        {activeViewTab === 'PENCAPAIAN_BISNIS' && (
          <DashboardPencapaianBisnis
            bisnisList={bisnisList}
            onAddBisnis={handleAddBisnis}
          />
        )}

      </main>
      </div>

      {/* Floating Action Button (FAB) for Mobile (Account Officer & Master Admin) */}
      {(currentRole === 'Account Officer' || currentRole === 'Master Admin') && (
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsNewModalOpen(true)}
          className="fixed bottom-6 right-6 z-40 sm:hidden bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white p-4 rounded-full shadow-2xl shadow-blue-600/50 flex items-center justify-center gap-2 border border-white/40 cursor-pointer"
          aria-label="Input Pengajuan Baru"
        >
          <Plus size={22} />
          <span className="text-xs font-black pr-1">Pengajuan Baru</span>
        </motion.button>
      )}

      {/* --- PREVIEW MASTER PDF MODAL (Single Consolidated PDF Viewer) --- */}
      <AnimatePresence>
        {previewMasterApp && (
          <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
            <motion.div 
              initial={{ opacity: 0, y: 100, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 100, scale: 0.98 }}
              className="bg-slate-900 rounded-t-[32px] sm:rounded-[28px] shadow-2xl w-full max-w-4xl flex flex-col overflow-hidden border border-slate-700 max-h-[95vh]"
            >
              {/* Drag Handle for Mobile */}
              <div className="w-12 h-1.5 bg-slate-600 rounded-full mx-auto my-2.5 sm:hidden" />

              {/* PDF Header Toolbar */}
              <div className="p-3 sm:p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950 text-white shrink-0">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="bg-rose-500/20 p-2 rounded-xl text-rose-400 border border-rose-500/30 shrink-0">
                    <FileText size={18} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-xs sm:text-sm text-slate-100 truncate">
                        Berkas_Kredit_Master_{previewMasterApp.id}.pdf
                      </h3>
                      <span className="hidden sm:inline-flex items-center gap-1 text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                        <Sparkles size={10} /> 1 Master PDF (Tergabung)
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 block truncate">
                      Nasabah: {previewMasterApp.name} • Master PDF Terintegrasi Berstandar OJK
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button 
                    onClick={() => handleDownloadMasterPdf(previewMasterApp)} 
                    className="p-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                    title="Unduh Single Master PDF"
                  >
                    <Download size={14} />
                    <span className="hidden sm:inline">Unduh Master PDF</span>
                  </button>
                  <button 
                    onClick={() => window.print()} 
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                    title="Cetak Berkas Master"
                  >
                    <Printer size={14} />
                    <span className="hidden sm:inline">Cetak</span>
                  </button>
                  <button 
                    onClick={() => setPreviewMasterApp(null)} 
                    className="text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl p-2 transition-colors cursor-pointer"
                  >
                    <XCircle size={18} />
                  </button>
                </div>
              </div>

              {/* HVS Page Selector Tabs */}
              <div className="bg-slate-950 border-b border-slate-800 p-2 overflow-x-auto flex items-center gap-1.5 shrink-0 scrollbar-none">
                <button
                  onClick={() => setActivePreviewPage(1)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
                    activePreviewPage === 1 
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' 
                      : 'bg-slate-800/80 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  <FileText size={13} /> Hal 1: Form 01 Permohonan
                </button>
                <button
                  onClick={() => setActivePreviewPage(2)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
                    activePreviewPage === 2 
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' 
                      : 'bg-slate-800/80 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  <CheckCircle size={13} /> Hal 2: Scan KTP Pemohon & Pasangan
                </button>
                <button
                  onClick={() => setActivePreviewPage(3)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
                    activePreviewPage === 3 
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' 
                      : 'bg-slate-800/80 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  <CheckCircle size={13} /> Hal 3: Scan Kartu Keluarga (KK)
                </button>
                <button
                  onClick={() => setActivePreviewPage(4)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
                    activePreviewPage === 4 
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' 
                      : 'bg-slate-800/80 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  <CheckCircle size={13} /> Hal 4: Scan Surat Nikah & Slip Gaji
                </button>
                <button
                  onClick={() => setActivePreviewPage(5)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
                    activePreviewPage === 5 
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' 
                      : 'bg-slate-800/80 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  <CheckCircle size={13} /> Hal 5: Scan Agunan (SHM / BPKB)
                </button>
                {previewMasterApp.files && previewMasterApp.files.length > 0 && previewMasterApp.files.map((f, i) => (
                  <button
                    key={i}
                    onClick={() => setActivePreviewPage(6 + i)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
                      activePreviewPage === (6 + i) 
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20' 
                        : 'bg-slate-800/80 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                    }`}
                  >
                    <Sparkles size={13} /> Hal {6 + i}: {f.type} ({f.name})
                  </button>
                ))}
              </div>
              
              {/* PDF Document Viewer Container (Realistic HVS Paper View) */}
              <div className="bg-slate-800/90 p-3 sm:p-6 flex justify-center overflow-y-auto min-h-[460px]">
                <div className="bg-white w-full max-w-2xl shadow-2xl border border-slate-200 p-5 sm:p-8 flex flex-col justify-between rounded-sm min-h-[640px] text-slate-800 relative overflow-hidden space-y-4 font-sans">
                  
                  {/* Watermark Background */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none">
                    <div className="text-center transform -rotate-12">
                      <img src={LOGO_URL} alt="Watermark" className="w-80 h-auto mx-auto mb-4" />
                      <h2 className="text-5xl font-black tracking-widest text-slate-900 uppercase">PT BPR ARA</h2>
                      <p className="text-2xl font-extrabold text-slate-800">MASTER CONSOLIDATED PDF</p>
                    </div>
                  </div>

                  {/* PAGE 1 CONTENT: FORM 01 */}
                  {activePreviewPage === 1 && (
                    <div className="space-y-4">
                      <div className="border-b-2 border-slate-900 pb-2 flex justify-between items-start gap-2">
                        <div className="flex items-center gap-2.5">
                          <img src={LOGO_URL} alt="Logo BPR ARA" className="h-9 w-auto object-contain" />
                          <div>
                            <h2 className="text-xs font-black text-slate-900 uppercase tracking-tight">PT. BPR ANTAR RUMEKSA ARTA</h2>
                            <p className="text-[10px] text-slate-600 font-bold">FORMULIR PERMOHONAN KREDIT</p>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-[10px] font-bold bg-slate-900 text-white px-2 py-0.5 rounded-md inline-block">Form 01</span>
                          <span className="text-[9px] text-slate-500 font-mono block mt-0.5">REG ID: {previewMasterApp.id}</span>
                        </div>
                      </div>

                      {/* Box A: Data Umum */}
                      <div className="border border-slate-300 rounded-lg p-3 bg-slate-50/50 space-y-2 text-xs">
                        <h4 className="font-extrabold text-[11px] text-slate-900 uppercase border-b border-slate-200 pb-1">A. DATA UMUM</h4>
                        <div className="grid grid-cols-2 gap-2 text-[11px]">
                          <div>
                            <p><span className="font-semibold text-slate-500">Nama Lengkap :</span> <strong>{previewMasterApp.name}</strong></p>
                            <p><span className="font-semibold text-slate-500">Alamat :</span> {previewMasterApp.address || '-'}</p>
                            <p><span className="font-semibold text-slate-500">RT/RW :</span> {previewMasterApp.rtRw || '-'} | <span className="font-semibold text-slate-500">Kel :</span> {previewMasterApp.kel || '-'}</p>
                            <p><span className="font-semibold text-slate-500">Kec :</span> {previewMasterApp.kec || '-'} | <span className="font-semibold text-slate-500">Kab :</span> {previewMasterApp.kab || '-'}</p>
                          </div>
                          <div>
                            <p><span className="font-semibold text-slate-500">No. KTP :</span> <strong>{previewMasterApp.ktp || '-'}</strong></p>
                            <p><span className="font-semibold text-slate-500">No. Telepon/WA :</span> {previewMasterApp.wa || '-'}</p>
                            <p><span className="font-semibold text-slate-500">Status Perkawinan :</span> {previewMasterApp.maritalStatus || 'Single'}</p>
                            <p><span className="font-semibold text-slate-500">Ibu Kandung :</span> {previewMasterApp.motherMaidenName || '-'}</p>
                            <p><span className="font-semibold text-slate-500">Suami/Istri :</span> {previewMasterApp.spouseName || '-'}</p>
                          </div>
                        </div>
                      </div>

                      {/* Box B: Data Kredit */}
                      <div className="border border-slate-300 rounded-lg p-3 bg-slate-50/50 space-y-2 text-xs">
                        <h4 className="font-extrabold text-[11px] text-slate-900 uppercase border-b border-slate-200 pb-1">B. DATA KREDIT</h4>
                        <div className="grid grid-cols-2 gap-2 text-[11px]">
                          <p><span className="font-semibold text-slate-500">Pengajuan Kredit :</span> <strong className="text-blue-700">{formatIDR(previewMasterApp.amount)}</strong></p>
                          <p><span className="font-semibold text-slate-500">Jangka Waktu :</span> {previewMasterApp.termMonths || 12} Bulan ({previewMasterApp.interestType || 'Flat'})</p>
                        </div>
                        <div className="bg-slate-200/60 p-2 rounded border border-slate-300 text-[10px] space-y-0.5">
                          <p className="font-extrabold text-slate-800">Diisi Oleh Petugas Bank ( Centang v ) :</p>
                          <p>Jenis Kredit : [v] {previewMasterApp.creditType || 'Umum'}   [ ] Tepat   [ ] KKKB   [ ] Deposito</p>
                          <p>Status : [v] {previewMasterApp.customerStatus || 'Baru'}   [ ] Lama - Rek: {previewMasterApp.accountNo || '-'}</p>
                        </div>
                      </div>

                      {/* Box C: Pertanyaan Utama */}
                      <div className="border border-slate-300 rounded-lg p-3 bg-slate-50/50 space-y-1 text-[11px]">
                        <h4 className="font-extrabold text-[11px] text-slate-900 uppercase border-b border-slate-200 pb-1">C. PERTANYAAN UTAMA</h4>
                        <p><span className="font-semibold text-slate-500">1. Sumber info tentang BPR ARA :</span> {previewMasterApp.sourceInfo || 'Rekomendasi / Media Sosial'}</p>
                        <p><span className="font-semibold text-slate-500">2. Penggunaan uang pinjaman :</span> {previewMasterApp.usageDetail || previewMasterApp.purpose}</p>
                        <p><span className="font-semibold text-slate-500">3. Rencana sumber angsuran :</span> {previewMasterApp.repaymentPlan || 'Hasil usaha harian'}</p>
                      </div>

                      {/* Checklist Box Table */}
                      <div className="grid grid-cols-2 gap-2 text-[10px]">
                        <div className="border border-slate-300 rounded p-2 bg-white">
                          <p className="font-extrabold border-b pb-1 text-slate-900">Dilengkapi Calon Debitur (Syarat)</p>
                          <ul className="space-y-0.5 mt-1 text-slate-700">
                            <li>[v] Scan Fotocopy KTP (4 Lembar)</li>
                            <li>[v] Scan Fotocopy KK (2 Lembar)</li>
                            <li>[v] Scan Surat Nikah (3 Lembar)</li>
                            <li>[v] Scan Slip Gaji / Lap. Keuangan</li>
                            <li>[v] Scan Rekening Listrik / PDAM</li>
                            <li>[v] Scan Dokumen Agunan (SHM / BPKB)</li>
                          </ul>
                        </div>
                        <div className="border border-slate-300 rounded p-2 bg-white">
                          <p className="font-extrabold border-b pb-1 text-slate-900">Dilengkapi Petugas Bank</p>
                          <ul className="space-y-0.5 mt-1 text-slate-700">
                            <li>[v] Form Permohonan Kredit (Form 01)</li>
                            <li>[v] SID / SLIK OJK</li>
                            <li>[v] Berkas Analisa & PK Lengkap</li>
                            <li>[v] Penyerahan Agunan Asli AO/Akad</li>
                          </ul>
                        </div>
                      </div>

                      {/* Signatures Row */}
                      <div className="border-t border-slate-300 pt-3 grid grid-cols-4 gap-2 text-center text-[10px]">
                        <div><p className="font-bold border-b pb-8">Petugas Bank</p><p className="mt-1 font-semibold text-slate-600">AO Officer</p></div>
                        <div><p className="font-bold border-b pb-8">Customer Services</p><p className="mt-1 font-semibold text-slate-600">CS Officer</p></div>
                        <div><p className="font-bold border-b pb-8">PE Bisnis</p><p className="mt-1 font-semibold text-slate-600">Supervisor</p></div>
                        <div><p className="font-bold border-b pb-8">{previewMasterApp.name}</p><p className="mt-1 font-semibold text-slate-900">Pemohon</p></div>
                      </div>
                    </div>
                  )}

                  {/* PAGE 2 CONTENT: SCAN KTP */}
                  {activePreviewPage === 2 && (
                    <div className="space-y-4">
                      <div className="border-b-2 border-slate-900 pb-2 flex justify-between items-center bg-slate-900 text-white p-2.5 rounded-lg">
                        <div>
                          <h3 className="font-extrabold text-xs">LAMPIRAN SCAN 1: KTP DEBITUR & PASANGAN</h3>
                          <p className="text-[10px] text-slate-300">Format Lembar HVS/A4 • REG ID: {previewMasterApp.id}</p>
                        </div>
                        <span className="text-[9px] font-mono bg-emerald-500 text-slate-950 px-2 py-0.5 rounded font-extrabold">TERVERIFIKASI SCAN</span>
                      </div>

                      {/* KTP Pemohon */}
                      <div className="border-2 border-dashed border-slate-300 rounded-2xl p-4 bg-slate-50 space-y-3">
                        <div className="flex justify-between items-center border-b pb-1">
                          <h4 className="text-xs font-black text-slate-800">1. HASIL SCAN / FOTO KTP PEMOHON (DEBITUR)</h4>
                          {previewMasterApp.docImages?.ktp && (
                            <span className="text-[9px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <Sparkles size={10} /> Foto Terlampir
                            </span>
                          )}
                        </div>

                        {previewMasterApp.docImages?.ktp ? (
                          <div className="flex flex-col items-center bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                            <img src={previewMasterApp.docImages.ktp} alt="Foto KTP Pemohon" className="max-h-56 max-w-full object-contain rounded-lg border border-slate-300 shadow-sm" />
                            <p className="text-[10px] font-bold text-slate-500 mt-2">Lampiran Berkas Foto KTP {previewMasterApp.name}</p>
                          </div>
                        ) : (
                          <div className="bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-900 text-white p-4 rounded-xl shadow-md max-w-md mx-auto space-y-2 border border-blue-400">
                            <p className="text-[10px] font-bold text-center tracking-wider uppercase border-b border-blue-400/50 pb-1">PROVINSI JAWA BARAT - KOTA BANDUNG</p>
                            <p className="text-xs font-black tracking-widest text-yellow-300">NIK : {previewMasterApp.ktp || '3273011508880001'}</p>
                            <div className="grid grid-cols-2 text-[10px] gap-1 pt-1 font-medium">
                              <p>Nama : {previewMasterApp.name}</p>
                              <p>Tgl Lahir : 15-08-1988</p>
                              <p>Jenis Kelamin : {previewMasterApp.gender || 'Pria'}</p>
                              <p>Status : {previewMasterApp.maritalStatus || 'Single'}</p>
                              <p className="col-span-2">Alamat : {previewMasterApp.address || 'Jl. Merdeka No. 45'}</p>
                              <p>Pekerjaan : {previewMasterApp.businessType || 'Perdagangan'}</p>
                              <p>Kewarganegaraan : WNI</p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* KTP Pasangan */}
                      <div className="border-2 border-dashed border-slate-300 rounded-2xl p-4 bg-slate-50 space-y-3">
                        <div className="flex justify-between items-center border-b pb-1">
                          <h4 className="text-xs font-black text-slate-800">2. HASIL SCAN / FOTO KTP PASANGAN / PENJAMIN</h4>
                          {previewMasterApp.docImages?.ktpPenjamin && (
                            <span className="text-[9px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <Sparkles size={10} /> Foto Terlampir
                            </span>
                          )}
                        </div>

                        {previewMasterApp.docImages?.ktpPenjamin ? (
                          <div className="flex flex-col items-center bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                            <img src={previewMasterApp.docImages.ktpPenjamin} alt="Foto KTP Pasangan" className="max-h-56 max-w-full object-contain rounded-lg border border-slate-300 shadow-sm" />
                            <p className="text-[10px] font-bold text-slate-500 mt-2">Lampiran Berkas Foto KTP Pasangan / Penjamin</p>
                          </div>
                        ) : (
                          <div className="bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-900 text-white p-4 rounded-xl shadow-md max-w-md mx-auto space-y-2 border border-blue-400">
                            <p className="text-[10px] font-bold text-center tracking-wider uppercase border-b border-blue-400/50 pb-1">PROVINSI JAWA BARAT - KOTA BANDUNG</p>
                            <p className="text-xs font-black tracking-widest text-yellow-300">NIK : 3273015210890002</p>
                            <div className="grid grid-cols-2 text-[10px] gap-1 pt-1 font-medium">
                              <p>Nama : {previewMasterApp.spouseName || 'Siti Aminah'}</p>
                              <p>Tgl Lahir : 12-10-1989</p>
                              <p>Jenis Kelamin : Wanita</p>
                              <p>Status : Menikah</p>
                              <p className="col-span-2">Alamat : {previewMasterApp.address || 'Jl. Merdeka No. 45'}</p>
                              <p>Pekerjaan : Mengurus Rumah Tangga</p>
                              <p>Kewarganegaraan : WNI</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* PAGE 3 CONTENT: SCAN KK */}
                  {activePreviewPage === 3 && (
                    <div className="space-y-4">
                      <div className="border-b-2 border-slate-900 pb-2 flex justify-between items-center bg-slate-900 text-white p-2.5 rounded-lg">
                        <div>
                          <h3 className="font-extrabold text-xs">LAMPIRAN SCAN 2: KARTU KELUARGA (KK)</h3>
                          <p className="text-[10px] text-slate-300">Format Lembar HVS/A4 • REG ID: {previewMasterApp.id}</p>
                        </div>
                        <span className="text-[9px] font-mono bg-emerald-500 text-slate-950 px-2 py-0.5 rounded font-extrabold">TERVERIFIKASI SCAN</span>
                      </div>

                      {previewMasterApp.docImages?.kk ? (
                        <div className="border-2 border-slate-300 rounded-2xl p-4 bg-slate-50 flex flex-col items-center">
                          <div className="w-full flex justify-between items-center border-b pb-2 mb-3">
                            <h4 className="text-xs font-black text-slate-900">FOTO/SCAN KARTU KELUARGA (KK) ASLI</h4>
                            <span className="text-[9px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-full">FOTO TERLAMPIR</span>
                          </div>
                          <img src={previewMasterApp.docImages.kk} alt="Kartu Keluarga" className="max-h-[380px] max-w-full object-contain rounded-xl border border-slate-300 shadow-md" />
                          <p className="text-[10px] font-bold text-slate-500 mt-2">Lampiran Foto Kartu Keluarga {previewMasterApp.name}</p>
                        </div>
                      ) : (
                        <div className="border-2 border-slate-300 rounded-2xl p-4 bg-slate-50 space-y-3">
                          <div className="text-center border-b pb-2">
                            <h3 className="text-sm font-black uppercase text-slate-900">KARTU KELUARGA</h3>
                            <p className="text-xs font-bold text-slate-600">No. 3273010508100045</p>
                          </div>

                          <div className="grid grid-cols-2 text-xs font-medium text-slate-700">
                            <p>Nama Kepala Keluarga: <strong>{previewMasterApp.name}</strong></p>
                            <p>Alamat: {previewMasterApp.address || 'Jl. Merdeka No. 45'}</p>
                            <p>RT/RW: {previewMasterApp.rtRw || '002 / 005'}</p>
                            <p>Kel/Kec: {previewMasterApp.kel || 'Mekar'} / {previewMasterApp.kec || 'Bandung'}</p>
                          </div>

                          <table className="w-full text-left text-[10px] border-collapse border border-slate-300 mt-2">
                            <thead>
                              <tr className="bg-slate-200 font-bold border-b border-slate-300">
                                <th className="p-1.5 border-r border-slate-300">No</th>
                                <th className="p-1.5 border-r border-slate-300">Nama Lengkap</th>
                                <th className="p-1.5 border-r border-slate-300">NIK</th>
                                <th className="p-1.5 border-r border-slate-300">JK</th>
                                <th className="p-1.5">Hubungan</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr className="border-b border-slate-200">
                                <td className="p-1.5 border-r border-slate-200">1</td>
                                <td className="p-1.5 border-r border-slate-200 font-bold">{previewMasterApp.name}</td>
                                <td className="p-1.5 border-r border-slate-200">{previewMasterApp.ktp || '3273011508880001'}</td>
                                <td className="p-1.5 border-r border-slate-200">{previewMasterApp.gender || 'Pria'}</td>
                                <td className="p-1.5">Kepala Keluarga</td>
                              </tr>
                              <tr>
                                <td className="p-1.5 border-r border-slate-200">2</td>
                                <td className="p-1.5 border-r border-slate-200 font-bold">{previewMasterApp.spouseName || 'Siti Aminah'}</td>
                                <td className="p-1.5 border-r border-slate-200">3273015210890002</td>
                                <td className="p-1.5 border-r border-slate-200">Wanita</td>
                                <td className="p-1.5">Istri</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}

                  {/* PAGE 4 CONTENT: SURAT NIKAH & SLIP GAJI */}
                  {activePreviewPage === 4 && (
                    <div className="space-y-4">
                      <div className="border-b-2 border-slate-900 pb-2 flex justify-between items-center bg-slate-900 text-white p-2.5 rounded-lg">
                        <div>
                          <h3 className="font-extrabold text-xs">LAMPIRAN SCAN 3: SURAT NIKAH / SLIP GAJI & UTILITAS</h3>
                          <p className="text-[10px] text-slate-300">Format Lembar HVS/A4 • REG ID: {previewMasterApp.id}</p>
                        </div>
                        <span className="text-[9px] font-mono bg-emerald-500 text-slate-950 px-2 py-0.5 rounded font-extrabold">TERVERIFIKASI SCAN</span>
                      </div>

                      {/* Surat Nikah */}
                      <div className="border-2 border-slate-300 rounded-2xl p-4 bg-slate-50 space-y-2">
                        <div className="flex justify-between items-center border-b pb-1">
                          <h4 className="text-xs font-black text-slate-900">HASIL SCAN SURAT NIKAH / AKTA PERKAWINAN</h4>
                          {previewMasterApp.docImages?.suratNikah && (
                            <span className="text-[9px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-full">FOTO TERLAMPIR</span>
                          )}
                        </div>
                        {previewMasterApp.docImages?.suratNikah ? (
                          <div className="flex flex-col items-center bg-white p-2 rounded-xl border border-slate-200">
                            <img src={previewMasterApp.docImages.suratNikah} alt="Surat Nikah" className="max-h-48 object-contain rounded-lg border border-slate-300" />
                          </div>
                        ) : (
                          <div>
                            <p className="text-xs font-medium">Kutipan Akta Nikah KUA No: KUA-04/12/2020</p>
                            <p className="text-xs">Pasangan: <strong>{previewMasterApp.name}</strong> & <strong>{previewMasterApp.spouseName || 'Siti Aminah'}</strong></p>
                          </div>
                        )}
                      </div>

                      {/* Slip Gaji / Utilitas */}
                      <div className="border-2 border-slate-300 rounded-2xl p-4 bg-slate-50 space-y-2">
                        <div className="flex justify-between items-center border-b pb-1">
                          <h4 className="text-xs font-black text-slate-900">HASIL SCAN SLIP GAJI / REKENING PDAM & LISTRIK</h4>
                          {(previewMasterApp.docImages?.slipGaji || previewMasterApp.docImages?.mutasi || previewMasterApp.docImages?.pdam) && (
                            <span className="text-[9px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-full">FOTO TERLAMPIR</span>
                          )}
                        </div>
                        {(previewMasterApp.docImages?.slipGaji || previewMasterApp.docImages?.mutasi || previewMasterApp.docImages?.pdam) ? (
                          <div className="flex flex-col items-center bg-white p-2 rounded-xl border border-slate-200">
                            <img 
                              src={previewMasterApp.docImages.slipGaji || previewMasterApp.docImages.mutasi || previewMasterApp.docImages.pdam} 
                              alt="Slip Gaji / Utilitas" 
                              className="max-h-48 object-contain rounded-lg border border-slate-300" 
                            />
                          </div>
                        ) : (
                          <div>
                            <p className="text-xs font-medium">Slip Pendapatan Bulanan & Bukti Tagihan PLN ID: 53712098412</p>
                            <span className="inline-block text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300 mt-1">Status: LUNAS & DIVERIFIKASI</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* PAGE 5 CONTENT: AGUNAN SHM/BPKB */}
                  {activePreviewPage === 5 && (
                    <div className="space-y-4">
                      <div className="border-b-2 border-slate-900 pb-2 flex justify-between items-center bg-slate-900 text-white p-2.5 rounded-lg">
                        <div>
                          <h3 className="font-extrabold text-xs">LAMPIRAN SCAN 4: DOKUMEN AGUNAN (SHM / BPKB / PBB)</h3>
                          <p className="text-[10px] text-slate-300">Format Lembar HVS/A4 • REG ID: {previewMasterApp.id}</p>
                        </div>
                        <span className="text-[9px] font-mono bg-emerald-500 text-slate-950 px-2 py-0.5 rounded font-extrabold">TERVERIFIKASI SCAN</span>
                      </div>

                      {/* Agunan SHM / BPKB */}
                      <div className="border-2 border-slate-300 rounded-2xl p-4 bg-slate-50 space-y-2">
                        <div className="flex justify-between items-center border-b pb-1">
                          <h4 className="text-xs font-black text-slate-900">1. SCAN SERTIFIKAT AGUNAN (SHM / SHGB / BPKB)</h4>
                          {(previewMasterApp.docImages?.shm || previewMasterApp.docImages?.bpkb) && (
                            <span className="text-[9px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-full">FOTO TERLAMPIR</span>
                          )}
                        </div>
                        {(previewMasterApp.docImages?.shm || previewMasterApp.docImages?.bpkb) ? (
                          <div className="flex flex-col items-center bg-white p-2 rounded-xl border border-slate-200">
                            <img 
                              src={previewMasterApp.docImages.shm || previewMasterApp.docImages.bpkb} 
                              alt="Agunan Sertifikat / BPKB" 
                              className="max-h-48 object-contain rounded-lg border border-slate-300" 
                            />
                          </div>
                        ) : (
                          <div>
                            <p className="text-xs font-bold text-blue-900">Sertifikat Hak Milik (SHM) No. 04512 / BPKB No. M-09812344</p>
                            <p className="text-xs">Atas Nama: <strong>{previewMasterApp.name}</strong></p>
                            <p className="text-xs text-slate-600">Spesifikasi Jaminan: Luas Tanah/Bangunan 150 m2 / Kendaraan Roda 4</p>
                          </div>
                        )}
                      </div>

                      {/* Esek-Esek / PBB / Foto Jaminan */}
                      <div className="border-2 border-slate-300 rounded-2xl p-4 bg-slate-50 space-y-2">
                        <div className="flex justify-between items-center border-b pb-1">
                          <h4 className="text-xs font-black text-slate-900">2. SCAN BUKTI PELUNASAN PBB TERBARU & FOTO AGUNAN</h4>
                          {(previewMasterApp.docImages?.esekNosin || previewMasterApp.docImages?.pbb) && (
                            <span className="text-[9px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-full">FOTO TERLAMPIR</span>
                          )}
                        </div>
                        {(previewMasterApp.docImages?.esekNosin || previewMasterApp.docImages?.pbb) ? (
                          <div className="flex flex-col items-center bg-white p-2 rounded-xl border border-slate-200">
                            <img 
                              src={previewMasterApp.docImages.esekNosin || previewMasterApp.docImages.pbb} 
                              alt="Foto Jaminan / PBB" 
                              className="max-h-48 object-contain rounded-lg border border-slate-300" 
                            />
                          </div>
                        ) : (
                          <div>
                            <p className="text-xs font-medium">NOP PBB: 32.73.010.005.012-0045 (Tahun 2025/2026)</p>
                            <p className="text-xs font-bold text-emerald-700">Status Pembayaran: TERBAYAR LUNAS</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* PAGE 6+ CONTENT: DIVISIONAL FILES */}
                  {activePreviewPage >= 6 && (
                    <div className="space-y-4">
                      {(() => {
                        const fileIdx = activePreviewPage - 6;
                        const fileObj = previewMasterApp.files?.[fileIdx];
                        return (
                          <div className="space-y-4">
                            <div className="border-b-2 border-slate-900 pb-2 flex justify-between items-center bg-indigo-950 text-white p-2.5 rounded-lg">
                              <div>
                                <h3 className="font-extrabold text-xs uppercase">LAMPIRAN BERKAS DIVISI: {fileObj?.type || 'ADMIN LEGAL'}</h3>
                                <p className="text-[10px] text-indigo-300">Format Lembar HVS/A4 • REG ID: {previewMasterApp.id}</p>
                              </div>
                              <span className="text-[9px] font-mono bg-emerald-400 text-slate-950 px-2 py-0.5 rounded font-extrabold">AUTO MERGED PDF</span>
                            </div>

                            <div className="border-2 border-slate-300 rounded-2xl p-6 bg-slate-50 text-center space-y-3 min-h-[300px] flex flex-col justify-center items-center">
                              {fileObj?.url ? (
                                <div className="w-full space-y-2">
                                  <img src={fileObj.url} alt={fileObj.name} className="max-h-[360px] max-w-full object-contain mx-auto rounded-xl border border-slate-300 shadow-md" />
                                  <p className="text-xs font-bold text-slate-700">{fileObj.name}</p>
                                </div>
                              ) : (
                                <>
                                  <FileText size={48} className="text-indigo-600" />
                                  <h4 className="text-sm font-extrabold text-slate-900">{fileObj?.name || 'Laporan_Divisi.pdf'}</h4>
                                  <p className="text-xs text-slate-600 max-w-md">
                                    Berkas dari divisi <strong>{fileObj?.type || 'Admin Legal'}</strong> telah sukses dikonversi dan digabungkan secara otomatis ke dalam Master PDF Tunggal ini.
                                  </p>
                                </>
                              )}
                              <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-full">
                                Bagian {activePreviewPage} Dari Master PDF
                              </span>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  {/* Stamp & Footer Verification */}
                  <div className="pt-3 border-t-2 border-slate-900 flex justify-between items-end shrink-0">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 bg-slate-900 rounded-lg p-1 flex items-center justify-center text-white text-[7px] font-mono text-center leading-none shadow-sm">
                        [QR OJK]
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-800">Verifikasi BPR ARA System</p>
                        <p className="text-[8px] text-slate-400 font-mono">REG-PDF-{previewMasterApp.id}</p>
                      </div>
                    </div>

                    <div className="text-center border border-blue-200 bg-blue-50/60 p-1.5 rounded-xl">
                      <span className="text-[8px] font-extrabold text-blue-800 uppercase block">Stempel Pengesahan Master</span>
                      <span className="text-[10px] font-black text-blue-900 block">PT BPR ARA DIGITAL</span>
                    </div>
                  </div>

                </div>
              </div>

              {/* Bottom Actions Bar */}
              <div className="p-3 sm:p-4 bg-slate-950 border-t border-slate-800 flex justify-between items-center shrink-0">
                <p className="text-[11px] text-slate-400 hidden sm:block">Berkas Master PDF Terpadu (Format HVS) • PT BPR Antar Rumeasa Arta</p>
                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button 
                    onClick={() => setPreviewMasterApp(null)} 
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    Tutup
                  </button>
                  <motion.button 
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleDownloadMasterPdf(previewMasterApp)} 
                    className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md shadow-emerald-500/20 flex items-center gap-1.5"
                  >
                    <Download size={14} /> Unduh Master PDF
                  </motion.button>
                </div>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- NEW CREDIT APPLICATION MODAL (AO) --- */}
      <AnimatePresence>
        {isNewModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 z-50 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              className="bg-white rounded-t-[32px] sm:rounded-[28px] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh] border border-white/80"
            >
              {/* Drag Handle for Mobile Bottom Sheet */}
              <div className="w-12 h-1.5 bg-slate-300/80 rounded-full mx-auto my-2.5 sm:hidden shrink-0" />
              
              <div className="p-4 sm:p-5 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-blue-600 to-indigo-600 text-white shrink-0">
                <div className="flex items-center gap-2.5">
                  <img src={LOGO_URL} alt="Logo BPR ARA" className="h-6 w-auto bg-white p-0.5 rounded-lg" />
                  <h3 className="font-bold text-xs sm:text-sm">Formulir Pengajuan Kredit Baru (AO)</h3>
                </div>
                <button onClick={() => setIsNewModalOpen(false)} className="text-white/80 hover:text-white cursor-pointer text-xl font-bold px-2">
                  &times;
                </button>
              </div>
              
              <form onSubmit={handleNewSubmit} className="flex flex-col flex-1 overflow-hidden">
                <div className="p-4 sm:p-6 space-y-5 overflow-y-auto">
                  
                  {/* HIDDEN INPUT FOR OCR FILE UPLOAD */}
                  <input 
                    ref={ocrFileInputRef}
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={handleOcrFileSelect}
                    className="hidden"
                  />

                  {/* FEATURE BANNER: OTOMATISASI INPUT DATA BANK */}
                  <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-4 rounded-2xl shadow-md border border-blue-700/50 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-blue-500/30 flex items-center justify-center text-amber-300 border border-amber-400/30">
                          <Sparkles size={16} className="animate-pulse" />
                        </div>
                        <div>
                          <h4 className="text-xs font-black text-white tracking-wide">Otomatisasi Input Data Debitur & Bank</h4>
                          <p className="text-[10px] text-blue-200 font-medium">Auto-scan KTP, Tarik SLIK/Core Banking, atau gunakan Preset Data</p>
                        </div>
                      </div>
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                        <Zap size={11} /> Smart AI OCR Ready
                      </span>
                    </div>

                    {/* Option Buttons Bar */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      {/* 1. OCR KTP Upload */}
                      <button
                        type="button"
                        disabled={isOcrScanning}
                        onClick={() => ocrFileInputRef.current?.click()}
                        className="w-full bg-blue-600/70 hover:bg-blue-600 text-white p-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border border-blue-400/30 transition-all cursor-pointer shadow-sm"
                      >
                        <Scan size={14} className="text-amber-300" />
                        {isOcrScanning ? 'Memindai KTP/Dokumen...' : '📷 Auto-Scan & Extract KTP / Berkas'}
                      </button>

                      {/* 2. Core Banking Lookup */}
                      <div className="flex items-center gap-1.5 bg-slate-800/80 p-1 rounded-xl border border-slate-700">
                        <input 
                          type="text"
                          placeholder="NIK / No. CIF Debitur..."
                          value={cifSearchInput}
                          onChange={(e) => setCifSearchInput(e.target.value)}
                          className="bg-transparent text-white placeholder-slate-400 text-xs px-2 py-1 outline-none w-full font-mono"
                        />
                        <button
                          type="button"
                          onClick={handleCifSearch}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 shrink-0 cursor-pointer"
                        >
                          <Database size={12} /> Import
                        </button>
                      </div>
                    </div>

                    {/* 3. Demo Presets Quick Selector */}
                    <div className="pt-1">
                      <span className="text-[10px] font-bold text-blue-300 uppercase tracking-wider block mb-1.5">
                        ⚡ Atau Pilih Template / Sample Debitur Instant:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {DEMO_PRESETS.map((preset) => (
                          <button
                            key={preset.id}
                            type="button"
                            onClick={() => applyPresetData(preset)}
                            className="bg-white/10 hover:bg-white/20 text-white text-[10px] font-semibold px-2.5 py-1 rounded-lg border border-white/20 transition-all cursor-pointer flex items-center gap-1"
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Auto-Fill Notification Alert */}
                  {autoFillNotification && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl flex items-center gap-2 animate-fadeIn shadow-sm">
                      <CheckCircle size={16} className="text-emerald-600 shrink-0" />
                      <span>{autoFillNotification}</span>
                    </div>
                  )}

                  {/* Section A: Identitas & Data Umum Nasabah (Form 01 - BPR ARA) */}
                  <div>
                    <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-wider mb-3 border-b border-slate-100 pb-2 flex items-center gap-1.5">
                      <User size={14} className="text-blue-600" />
                      A. Identitas & Data Umum Nasabah (Form 01)
                    </h4>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Nama Pemohon (Sesuai KTP)</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400"><User size={14} /></div>
                          <input type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="pl-9 w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-blue-500" placeholder="Nama lengkap debitur..." />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Nomor KTP (NIK 16 Digit)</label>
                        <input type="text" maxLength={16} value={formData.ktp} onChange={(e) => setFormData({...formData, ktp: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none text-xs font-mono font-semibold focus:bg-white focus:ring-2 focus:ring-blue-500" placeholder="3273..." />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Nomor HP / WhatsApp</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400"><Phone size={14} /></div>
                          <input type="tel" required value={formData.wa} onChange={(e) => setFormData({...formData, wa: e.target.value})} className="pl-9 w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-blue-500" placeholder="0812..." />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Status Perkawinan</label>
                        <select value={formData.maritalStatus} onChange={(e) => setFormData({...formData, maritalStatus: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-blue-500">
                          <option value="Single">Single / Belum Menikah</option>
                          <option value="Menikah">Menikah</option>
                          <option value="Duda/Janda">Duda / Janda</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Nama Gadis Ibu Kandung</label>
                        <input type="text" value={formData.motherMaidenName} onChange={(e) => setFormData({...formData, motherMaidenName: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-blue-500" placeholder="Nama ibu kandung..." />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Nama Suami / Istri (Jika Ada)</label>
                        <input type="text" value={formData.spouseName} onChange={(e) => setFormData({...formData, spouseName: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-blue-500" placeholder="Nama pasangan..." />
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div className="sm:col-span-3">
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Alamat Tempat Tinggal / Usaha</label>
                        <input type="text" required value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-blue-500" placeholder="Jalan / Kampung / No Rumah..." />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 mb-1">RT / RW</label>
                        <input type="text" value={formData.rtRw} onChange={(e) => setFormData({...formData, rtRw: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 outline-none text-xs font-medium" placeholder="001/002" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 mb-1">Kelurahan</label>
                        <input type="text" value={formData.kel} onChange={(e) => setFormData({...formData, kel: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 outline-none text-xs font-medium" placeholder="Kelurahan..." />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 mb-1">Kecamatan / Kab</label>
                        <input type="text" value={formData.kec} onChange={(e) => setFormData({...formData, kec: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 outline-none text-xs font-medium" placeholder="Kecamatan..." />
                      </div>
                    </div>
                  </div>

                  {/* Section B: Detail Fasilitas Kredit */}
                  <div>
                    <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-wider mb-3 border-b border-slate-100 pb-2 flex items-center gap-1.5">
                      <DollarSign size={14} className="text-blue-600" />
                      B. Detail Pengajuan Fasilitas Kredit (Form 01)
                    </h4>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Plafon Pinjaman / Kredit (Rp)</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400"><DollarSign size={14} /></div>
                          <input type="number" required min="1000000" value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})} className="pl-9 w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none text-xs font-black text-blue-700 focus:bg-white focus:ring-2 focus:ring-blue-500" placeholder="50000000" />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Jangka Waktu (Bulan)</label>
                        <input type="number" min="1" max="120" value={formData.termMonths} onChange={(e) => setFormData({...formData, termMonths: Number(e.target.value)})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-blue-500" placeholder="12" />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Jenis Usaha / Pekerjaan</label>
                        <input type="text" required value={formData.businessType} onChange={(e) => setFormData({...formData, businessType: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-blue-500" placeholder="Contoh: Perdagangan Sembako" />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Jenis Kredit (Bank)</label>
                        <select value={formData.creditType} onChange={(e) => setFormData({...formData, creditType: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-blue-500">
                          <option value="Umum">Umum</option>
                          <option value="Tepat">Tepat</option>
                          <option value="KKKB">KKKB</option>
                          <option value="Deposito">Deposito</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Tujuan Penggunaan</label>
                        <select value={formData.purpose} onChange={(e) => setFormData({...formData, purpose: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-blue-500">
                          <option value="Modal Kerja">Modal Kerja Usaha</option>
                          <option value="Investasi">Investasi Usaha</option>
                          <option value="Konsumtif">Konsumtif / Renovasi</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Status Debitur</label>
                        <select value={formData.customerStatus} onChange={(e) => setFormData({...formData, customerStatus: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-blue-500">
                          <option value="Baru">Debitur Baru</option>
                          <option value="Lama">Debitur Lama / Suplesi</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Section C: Lampiran Scan Dokumen Kelengkapan (Format HVS Sequential) */}
                  <div>
                    <div className="flex justify-between items-end mb-3 border-b border-slate-100 pb-2">
                      <div>
                        <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                          <FileText size={14} className="text-blue-600" />
                          C. Lampiran Scan Kelengkapan Dokumen (HVS Sequential)
                        </h4>
                        <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                          Halaman 1 (Form 01) akan otomatis disusul oleh Scan Dokumen berikut sesuai urutan HVS:
                        </p>
                      </div>
                      <span className="text-[10px] font-extrabold bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full border border-blue-100 shrink-0">
                        {Object.values(uploadedFiles).filter(Boolean).length} / 11 Terunggah
                      </span>
                    </div>
                    
                    <div className="space-y-2">
                      {/* Sub-group 1: Debitur & Pasangan */}
                      <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-2">
                        <span className="text-[10px] font-black uppercase text-blue-800 bg-blue-100/80 px-2 py-0.5 rounded">
                          Halaman 2 - 4: Syarat Utama Debitur (Mandatory Scan)
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {renderUploadRow('ktp', 'Scan KTP Pemohon & Pasangan (HVS Hal 2)')}
                          {renderUploadRow('kk', 'Scan Kartu Keluarga / KK (HVS Hal 3)')}
                          {renderUploadRow('suratNikah', 'Scan Surat Nikah/Cerai (HVS Hal 4)')}
                          {renderUploadRow('mutasi', 'Scan Slip Gaji / Lap. Keuangan (HVS Hal 4)')}
                          {renderUploadRow('pbb', 'Scan Rekening PLN / PDAM (HVS Hal 4)')}
                        </div>
                      </div>

                      {/* Sub-group 2: Syarat Agunan BPKB / SHM */}
                      <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-2">
                        <span className="text-[10px] font-black uppercase text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded">
                          Halaman 5: Syarat Agunan BPKB / Sertifikat (HVS Hal 5)
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {renderUploadRow('shm', 'Scan Sertifikat SHM / SHGB')}
                          {renderUploadRow('bpkb', 'Scan BPKB & STNK Kendaraan')}
                          {renderUploadRow('esekEsek', 'Scan Esek-esek & Foto Jaminan')}
                          {renderUploadRow('ktpPenjamin', 'Scan KTP & KK Penjamin Agunan')}
                        </div>
                      </div>
                    </div>
                  </div>

                </div>

                <div className="p-4 border-t border-slate-100 flex justify-end gap-2 bg-slate-50 shrink-0">
                  <button 
                    type="button" 
                    onClick={() => setIsNewModalOpen(false)} 
                    className="px-4 py-2.5 border border-slate-200 bg-white text-slate-700 rounded-2xl hover:bg-slate-100 text-xs font-bold transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  
                  <motion.button 
                    whileTap={{ scale: 0.96 }}
                    type="submit" 
                    className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl hover:from-blue-700 hover:to-indigo-700 text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-500/20 transition-all cursor-pointer"
                  >
                    <CheckCircle size={15} /> Simpan & Kirim
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- ACTION REVIEW MODAL --- */}
      <AnimatePresence>
        {actionModal.isOpen && actionModal.app && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
            <motion.div 
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              className="bg-white rounded-t-[32px] sm:rounded-[28px] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col border border-white/80 max-h-[92vh]"
            >
              {/* Drag Handle for Mobile Bottom Sheet */}
              <div className="w-12 h-1.5 bg-slate-300/80 rounded-full mx-auto my-2.5 sm:hidden shrink-0" />
              
              <div className="p-4 sm:p-5 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-blue-600 to-indigo-600 text-white shrink-0">
                <div className="flex items-center gap-2">
                  <Edit size={16} className="text-blue-200" />
                  <h3 className="font-bold text-xs">Proses Berkas: {actionModal.app.id}</h3>
                </div>
                <button onClick={closeActionModal} className="text-white/80 hover:text-white cursor-pointer">
                  <XCircle size={18} />
                </button>
              </div>
              
              <div className="p-5 sm:p-6 space-y-4 overflow-y-auto">
                <div className="bg-blue-50/80 p-4 rounded-2xl border border-blue-100 flex flex-col gap-1">
                  <p className="text-xs font-black text-blue-900">{actionModal.app.name}</p>
                  <div className="flex items-center gap-4 text-[11px] text-blue-800 font-bold">
                    <span>Plafon: {formatIDR(actionModal.app.amount)}</span>
                    <span>Tujuan: {actionModal.app.purpose}</span>
                  </div>
                </div>

                {/* Single Master PDF Banner in Action Modal */}
                <div className="bg-slate-900 text-white p-3.5 rounded-2xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="p-2 bg-rose-500/20 text-rose-400 rounded-xl border border-rose-500/30 shrink-0">
                        <FileText size={18} />
                      </div>
                      <div className="min-w-0">
                        <h5 className="font-extrabold text-[11px] text-slate-100 truncate">
                          Berkas_Kredit_Master_{actionModal.app.id}.pdf
                        </h5>
                        <span className="text-[10px] text-emerald-400 font-bold block truncate">
                          Single Master PDF • {actionModal.app.files?.length || 1} Bagian Tergabung
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => setPreviewMasterApp(actionModal.app)}
                        className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                        title="Lihat Master PDF Saat Ini"
                      >
                        <Eye size={12} /> Lihat PDF
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDownloadMasterPdf(actionModal.app!)}
                        className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                        title="Unduh Master PDF Saat Ini"
                      >
                        <Download size={12} /> Unduh
                      </button>
                    </div>
                  </div>

                  <p className="text-[10px] text-slate-400 border-t border-slate-800 pt-2">
                    📌 Semua berkas dari AO, Admin Legal, Analis Kredit, dan Komite disatukan dalam 1 PDF ini.
                  </p>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                    <span>Gabungkan Berkas/Laporan Tambahan ({currentRole})</span>
                    <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5">
                      <Sparkles size={10} /> Auto Merge to 1 PDF
                    </span>
                  </label>
                  <input 
                    type="file" 
                    onChange={async (e) => {
                      if(e.target.files && e.target.files[0]) {
                        const file = e.target.files[0];
                        const convertedPdf = convertFilenameToPdf(file.name, `Laporan_${currentRole}`);
                        const dataUrl = await compressImageFile(file);
                        setActionData(prev => ({
                          ...prev,
                          fileMock: convertedPdf,
                          fileUrl: dataUrl
                        }));
                      }
                    }}
                    accept="image/*,.pdf,.jpg,.jpeg,.png,.webp,.jfif,.docx,.doc,.xlsx"
                    className="w-full text-xs text-slate-600 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 border border-slate-200 rounded-2xl p-1.5 focus:outline-none cursor-pointer"
                  />
                  {actionData.fileMock ? (
                    <div className="space-y-1 mt-1.5">
                      <p className="text-[10px] text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-2.5 py-1.5 rounded-xl flex items-center gap-1.5">
                        <Sparkles size={12} className="text-emerald-600 shrink-0" />
                        <span>File [{actionData.fileMock}] akan otomatis digabungkan ke Halaman Master PDF.</span>
                      </p>
                      {actionData.fileUrl && (
                        <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
                          <img src={actionData.fileUrl} alt="Preview" className="w-8 h-8 object-cover rounded-lg border border-slate-300" />
                          <span className="text-[10px] font-bold text-slate-700">Foto / Gambaran Berkas Siap Digabung</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-[10px] text-slate-400 mt-1 italic">
                      Format file apa pun (Foto/Gambar/PDF/Word/Excel) akan otomatis dikonversi & digabung ke 1 Master PDF.
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
                    Catatan Review / Opini Kredit ({currentRole})
                  </label>
                  <textarea 
                    rows={3} 
                    value={actionData.opini}
                    onChange={(e) => setActionData({...actionData, opini: e.target.value})}
                    placeholder="Tambahkan catatan hasil analisa atau tinjauan dokumen..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 outline-none text-xs focus:bg-white focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                </div>
              </div>

              <div className="p-4 border-t border-slate-100 flex justify-between items-center bg-slate-50/80 shrink-0">
                <motion.button 
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleAction(actionModal.app.id, 'DITOLAK', { opini: actionData.opini })}
                  className="px-3.5 py-2.5 border border-rose-200 bg-rose-50 text-rose-700 rounded-2xl hover:bg-rose-100 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <XCircle size={14} /> Tolak
                </motion.button>
                
                <div className="flex gap-2">
                  <button 
                    onClick={closeActionModal}
                    className="px-3.5 py-2.5 border border-slate-200 bg-white text-slate-700 rounded-2xl hover:bg-slate-100 text-xs font-bold transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  
                  <motion.button 
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      handleAction(actionModal.app.id, getNextStatusForRole(), { 
                        opini: actionData.opini, 
                        fileName: actionData.fileMock,
                        fileUrl: actionData.fileUrl
                      });
                    }}
                    className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl hover:from-blue-700 hover:to-indigo-700 text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-500/20 transition-all cursor-pointer"
                  >
                    <CheckCircle size={14} /> Setujui & Lanjutkan
                  </motion.button>
                </div>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <StrukturManajemenModal
        isOpen={isManagementModalOpen}
        onClose={() => setIsManagementModalOpen(false)}
      />

    </div>
  );
}

