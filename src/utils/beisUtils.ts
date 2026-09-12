import { 
  BEISDomainCode, 
  BEISLevelCode, 
  BEISTaskStatus, 
  BEISAuditLog, 
  TaskItem 
} from '../types';

export interface BEISCategoryInfo {
  code: string;
  label: string;
}

export interface BEISUnitInfo {
  code: string;
  label: string;
}

export const BEIS_UNITS: BEISUnitInfo[] = [
  { code: 'DIR', label: 'Direksi' },
  { code: 'BIS', label: 'Bisnis' },
  { code: 'KPT', label: 'Kepatuhan' },
  { code: 'AUD', label: 'Audit' },
  { code: 'PMO', label: 'Project Management Office' },
  { code: 'OPS', label: 'Operasional' },
  { code: 'COL', label: 'Collection' },
  { code: 'FND', label: 'Funding' },
  { code: 'HCM', label: 'Human Capital' },
  { code: 'ITD', label: 'IT Digital' },
  { code: 'LGL', label: 'Legal' },
  { code: 'KOM', label: 'Komisaris' }
];

export interface BEISDomainInfo {
  level: BEISLevelCode;
  code: BEISDomainCode;
  title: string;
  description: string;
  defaultCategories: string[];
  categories: BEISCategoryInfo[];
  exampleId: string;
}

export const BEIS_DOMAINS: BEISDomainInfo[] = [
  {
    level: 'L01',
    code: 'ADM',
    title: 'Administrative',
    description: 'Administrasi umum, tata kelola dokumen, dan operasional surat menyurat.',
    defaultCategories: ['SUR', 'MEM', 'DSP', 'NOT', 'SOP', 'DOC', 'CHK', 'BAP'],
    categories: [
      { code: 'SUR', label: 'Surat' },
      { code: 'MEM', label: 'Memo' },
      { code: 'DSP', label: 'Disposisi' },
      { code: 'NOT', label: 'Notulen' },
      { code: 'SOP', label: 'SOP' },
      { code: 'DOC', label: 'Dokumen' },
      { code: 'CHK', label: 'Checklist' },
      { code: 'BAP', label: 'Berita Acara' }
    ],
    exampleId: 'BEIS-L01-ADM-SUR-OPS-20260727-001'
  },
  {
    level: 'L02',
    code: 'OPS',
    title: 'Operational',
    description: 'Kegiatan operasional harian kantor cabang/pusat dan kasir/teller.',
    defaultCategories: ['CHH', 'KAS', 'VLT', 'TRX', 'DSH', 'JDW', 'TDL', 'INV'],
    categories: [
      { code: 'CHH', label: 'Checklist Harian' },
      { code: 'KAS', label: 'Kas' },
      { code: 'VLT', label: 'Vault' },
      { code: 'TRX', label: 'Transaksi' },
      { code: 'DSH', label: 'Dashboard' },
      { code: 'JDW', label: 'Jadwal' },
      { code: 'TDL', label: 'To Do List' },
      { code: 'INV', label: 'Inventaris' }
    ],
    exampleId: 'BEIS-L02-OPS-TDL-OPS-20260727-001'
  },
  {
    level: 'L03',
    code: 'CRD',
    title: 'Credit',
    description: 'Analisa, pengajuan, komite, dan penyaluran kredit BPR.',
    defaultCategories: ['KDB', 'LOK', 'AKR', 'RPC', 'AGN', 'SRV', 'SLK', 'CLR', 'WAW', 'DDB'],
    categories: [
      { code: 'KDB', label: 'Kunjungan Debitur' },
      { code: 'LOK', label: 'Lokasi' },
      { code: 'AKR', label: 'Analisa Kredit' },
      { code: 'RPC', label: 'Repayment Capacity' },
      { code: 'AGN', label: 'Agunan' },
      { code: 'SRV', label: 'Survey' },
      { code: 'SLK', label: 'SLIK' },
      { code: 'CLR', label: 'Call Report' },
      { code: 'WAW', label: 'Wawancara' },
      { code: 'DDB', label: 'Dokumen Debitur' }
    ],
    exampleId: 'BEIS-L03-CRD-AKR-BIS-20260727-001'
  },
  {
    level: 'L04',
    code: 'COL',
    title: 'Collection',
    description: 'Penagihan, penanganan kredit bermasalah, dan restrukturisasi.',
    defaultCategories: ['FKJ', 'CLE', 'WAP', 'BYR', 'STG', 'MED', 'RST', 'PAG'],
    categories: [
      { code: 'FKJ', label: 'Foto Kunjungan' },
      { code: 'CLE', label: 'Call Evidence' },
      { code: 'WAP', label: 'WhatsApp' },
      { code: 'BYR', label: 'Pembayaran' },
      { code: 'STG', label: 'Surat Teguran' },
      { code: 'MED', label: 'Mediasi' },
      { code: 'RST', label: 'Restrukturisasi' },
      { code: 'PAG', label: 'Penarikan Agunan' }
    ],
    exampleId: 'BEIS-L04-COL-BYR-COL-20260727-001'
  },
  {
    level: 'L05',
    code: 'FND',
    title: 'Funding',
    description: 'Penghimpunan dana pihak ketiga (Tabungan & Deposito).',
    defaultCategories: ['KNB', 'FPB', 'BST', 'FLW', 'PRL', 'MOU', 'FDB'],
    categories: [
      { code: 'KNB', label: 'Kunjungan Nasabah' },
      { code: 'FPB', label: 'Form Pembukaan' },
      { code: 'BST', label: 'Bukti Setoran' },
      { code: 'FLW', label: 'Follow Up' },
      { code: 'PRL', label: 'Prospect List' },
      { code: 'MOU', label: 'MoU' },
      { code: 'FDB', label: 'Funding Dashboard' }
    ],
    exampleId: 'BEIS-L05-FND-FLW-FND-20260727-001'
  },
  {
    level: 'L06',
    code: 'MKT',
    title: 'Marketing',
    description: 'Promosi, branding, akuisisi nasabah baru, dan event.',
    defaultCategories: ['KTN', 'VID', 'FEV', 'INS', 'LED', 'EVR', 'REG', 'TST'],
    categories: [
      { code: 'KTN', label: 'Konten' },
      { code: 'VID', label: 'Video' },
      { code: 'FEV', label: 'Foto Event' },
      { code: 'INS', label: 'Insight' },
      { code: 'LED', label: 'Leads' },
      { code: 'EVR', label: 'Event Report' },
      { code: 'REG', label: 'Registrasi' },
      { code: 'TST', label: 'Testimoni' }
    ],
    exampleId: 'BEIS-L06-MKT-KTN-BIS-20260727-001'
  },
  {
    level: 'L07',
    code: 'HCM',
    title: 'Human Capital',
    description: 'Pengembangan SDM, absensi, pelatihan, dan kinerja pegawai.',
    defaultCategories: ['TRN', 'COA', 'KPI', 'ASM', 'IDP', 'ABS', 'EVL'],
    categories: [
      { code: 'TRN', label: 'Training' },
      { code: 'COA', label: 'Coaching' },
      { code: 'KPI', label: 'KPI' },
      { code: 'ASM', label: 'Assessment' },
      { code: 'IDP', label: 'Individual Development Plan' },
      { code: 'ABS', label: 'Absensi' },
      { code: 'EVL', label: 'Evaluasi' }
    ],
    exampleId: 'BEIS-L07-HCM-TRN-HCM-20260727-001'
  },
  {
    level: 'L08',
    code: 'CRK',
    title: 'Compliance & Risk',
    description: 'Kepatuhan APU-PPT, audit internal, manajemen risiko, dan OJK.',
    defaultCategories: ['AUD', 'TMN', 'RSK', 'CAP', 'MON', 'CCL', 'SAS'],
    categories: [
      { code: 'AUD', label: 'Audit' },
      { code: 'TMN', label: 'Temuan' },
      { code: 'RSK', label: 'Risk Register' },
      { code: 'CAP', label: 'CAPA' },
      { code: 'MON', label: 'Monitoring' },
      { code: 'CCL', label: 'Compliance Checklist' },
      { code: 'SAS', label: 'Self Assessment' }
    ],
    exampleId: 'BEIS-L08-CRK-AUD-AUD-20260727-001'
  },
  {
    level: 'L09',
    code: 'ITD',
    title: 'IT & Digital',
    description: 'Infrastruktur TI, otomatisasi sistem, core banking, dan security.',
    defaultCategories: ['ITT', 'SCR', 'BKP', 'LGA', 'UAC', 'CLD', 'DSH'],
    categories: [
      { code: 'ITT', label: 'IT Ticket' },
      { code: 'SCR', label: 'Screenshot' },
      { code: 'BKP', label: 'Backup' },
      { code: 'LGA', label: 'Log Aktivitas' },
      { code: 'UAC', label: 'User Access' },
      { code: 'CLD', label: 'Cloud' },
      { code: 'DSH', label: 'Dashboard' }
    ],
    exampleId: 'BEIS-L09-ITD-ITT-ITD-20260727-001'
  },
  {
    level: 'L10',
    code: 'EXE',
    title: 'Executive',
    description: 'Keputusan Direksi/Komisaris, RUPS, dan strategi bisnis jangka panjang.',
    defaultCategories: ['KPD', 'MDR', 'BDR', 'MOM', 'STP', 'EAN', 'DLG'],
    categories: [
      { code: 'KPD', label: 'KPI Direksi' },
      { code: 'MDR', label: 'Memo Direksi' },
      { code: 'BDR', label: 'Board Report' },
      { code: 'MOM', label: 'Minutes Meeting' },
      { code: 'STP', label: 'Strategic Plan' },
      { code: 'EAN', label: 'Executive Analysis' },
      { code: 'DLG', label: 'Decision Log' }
    ],
    exampleId: 'BEIS-L10-EXE-DLG-DIR-20260727-001'
  },
  {
    level: 'L11',
    code: 'LGL',
    title: 'Legal',
    description: 'Legalitas akad, jaminan, penanganan perkara hukum, dan notaris.',
    defaultCategories: ['KTR', 'AKT', 'IZN', 'LOP', 'PJN', 'SOM'],
    categories: [
      { code: 'KTR', label: 'Kontrak' },
      { code: 'AKT', label: 'Akta' },
      { code: 'IZN', label: 'Perizinan' },
      { code: 'LOP', label: 'Legal Opinion' },
      { code: 'PJN', label: 'Perjanjian' },
      { code: 'SOM', label: 'Somasi' }
    ],
    exampleId: 'BEIS-L11-LGL-KTR-LGL-20260727-001'
  },
  {
    level: 'L12',
    code: 'KIM',
    title: 'Knowledge & Improvement',
    description: 'Inovasi, SOP, evaluasi proses kerja, dan perbaikan berkelanjutan.',
    defaultCategories: ['LLN', 'SBR', 'PAI', 'KZN', 'IMP', 'INO', 'PLB'],
    categories: [
      { code: 'LLN', label: 'Lesson Learned' },
      { code: 'SBR', label: 'SOP Baru' },
      { code: 'PAI', label: 'Prompt AI' },
      { code: 'KZN', label: 'Kaizen' },
      { code: 'IMP', label: 'Improvement' },
      { code: 'INO', label: 'Innovation' },
      { code: 'PLB', label: 'Playbook' }
    ],
    exampleId: 'BEIS-L12-KIM-PAI-PMO-20260727-001'
  }
];

export function getBeisCategoriesForDomain(domainCode: BEISDomainCode): BEISCategoryInfo[] {
  const domainObj = BEIS_DOMAINS.find(d => d.code === domainCode);
  return domainObj ? domainObj.categories : [];
}

/**
 * Domain yang lazim dikerjakan tiap unit operasional, yang paling sering lebih
 * dahulu.
 *
 * Kode BEIS tersusun menurun: unit menentukan domain apa yang masuk akal, dan
 * domain menentukan kategori apa yang tersedia. Sebelumnya tidak ada pemetaan
 * ini sama sekali, sehingga formulir aktivitas membuka dua belas domain dan
 * seluruh kategori dari semuanya kepada siapa pun — seorang petugas Collection
 * harus menyaring sendiri kategori Funding, Human Capital, dan IT hanya untuk
 * mencatat satu kunjungan penagihan.
 *
 * Daftar ini menyarankan, bukan membatasi. Domain di luar daftar tetap dapat
 * dipilih, hanya dikelompokkan terpisah, karena satu unit sesekali memang
 * mengerjakan hal di luar kebiasaannya.
 */
const DOMAIN_PER_UNIT: Record<string, BEISDomainCode[]> = {
  DIR: ['EXE', 'CRK', 'CRD', 'FND'],
  KOM: ['EXE', 'CRK'],
  BIS: ['CRD', 'MKT', 'FND', 'COL'],
  KPT: ['CRK', 'LGL'],
  AUD: ['CRK'],
  PMO: ['KIM', 'EXE', 'ITD'],
  OPS: ['OPS'],
  COL: ['COL', 'CRD', 'LGL'],
  FND: ['FND', 'MKT'],
  HCM: ['HCM'],
  ITD: ['ITD'],
  LGL: ['LGL', 'CRD', 'CRK'],
};

/**
 * Domain administratif dan pembelajaran berlaku untuk semua unit: setiap orang
 * membuat notulen, mengurus dokumen, dan mengikuti pelatihan.
 */
const DOMAIN_UMUM: BEISDomainCode[] = ['ADM', 'KIM'];

/** Domain yang disarankan untuk sebuah unit, sudah termasuk domain umum. */
export function domainDisarankanUntukUnit(unitCode: string): BEISDomainCode[] {
  const khusus = DOMAIN_PER_UNIT[unitCode] ?? [];
  return [...khusus, ...DOMAIN_UMUM.filter(d => !khusus.includes(d))];
}

/** Domain di luar saran, tetap dapat dipilih. */
export function domainLainnyaUntukUnit(unitCode: string): BEISDomainCode[] {
  const disarankan = domainDisarankanUntukUnit(unitCode);
  return BEIS_DOMAINS.map(d => d.code).filter(c => !disarankan.includes(c));
}

export const BEIS_STATUSES: { code: BEISTaskStatus; label: string; badgeClass: string; desc: string }[] = [
  { 
    code: 'Planned', 
    label: 'Planned (Direncanakan)', 
    badgeClass: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700',
    desc: 'Tugas telah dijadwalkan dan menunggu pelaksanaan.'
  },
  { 
    code: 'In Progress', 
    label: 'In Progress (Proses)', 
    badgeClass: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-300 dark:border-blue-700',
    desc: 'Tugas sedang aktif dikerjakan oleh PIC.'
  },
  { 
    code: 'At Risk', 
    label: 'At Risk (Beresiko)', 
    badgeClass: 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 border-amber-300 dark:border-amber-700',
    desc: 'Mendekati deadline atau berpotensi mengalami keterlambatan.'
  },
  { 
    code: 'Blocked', 
    label: 'Blocked (Terganggu)', 
    badgeClass: 'bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-300 border-red-300 dark:border-red-700',
    desc: 'Terhenti karena kendala eksternal, data, atau persetujuan.'
  },
  { 
    code: 'Submitted', 
    label: 'Submitted (Diajukan)', 
    badgeClass: 'bg-purple-100 text-purple-900 dark:bg-purple-950 dark:text-purple-300 border-purple-300 dark:border-purple-700',
    desc: 'Evidence telah diunggah dan diajukan ke Validator.'
  },
  { 
    code: 'Validated Closed', 
    label: 'Validated Closed (Tervalidasi)', 
    badgeClass: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700',
    desc: 'Evidence telah disetujui Validator dan tugas ditutup.'
  },
  { 
    code: 'Improved', 
    label: 'Improved (Ditingkatkan)', 
    badgeClass: 'bg-cyan-100 text-cyan-900 dark:bg-cyan-950 dark:text-cyan-300 border-cyan-300 dark:border-cyan-700',
    desc: 'Telah dilakukan perbaikan/revisi hasil evaluasi.'
  }
];

/**
 * Generates a standard BEIS Task ID
 * Format: BEIS-[LEVEL]-[DOMAIN]-[CATEGORY]-[UNIT]-[YYYYMMDD]-[SEQUENCE]
 * Example: BEIS-L03-CRD-AKR-BIS-20260727-001
 */
export function generateBeisTaskId(params: {
  level?: BEISLevelCode;
  domain?: BEISDomainCode;
  category?: string;
  unit?: string;
  date?: string; // YYYY-MM-DD or YYYYMMDD
  sequenceNumber?: number;
}): string {
  const level = params.level || 'L03';
  const domain = params.domain || 'CRD';
  const rawCat = (params.category || 'BIS').toUpperCase().replace(/[^A-Z0-9]/g, '');
  const category = (rawCat.length >= 3 ? rawCat.substring(0, 4) : rawCat.padEnd(3, 'X'));
  
  const rawUnit = (params.unit || 'BIS').toUpperCase().replace(/[^A-Z0-9]/g, '');
  const unit = rawUnit.length > 0 ? rawUnit : 'BIS';

  let dateStr = '';
  if (params.date) {
    dateStr = params.date.replace(/-/g, '');
  } else {
    dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
  }

  const seq = String(params.sequenceNumber || 1).padStart(3, '0');

  return `BEIS-${level}-${domain}-${category}-${unit}-${dateStr}-${seq}`;
}

/**
 * Generates Evidence ID with suffix -E01, -E02, etc.
 */
export function generateEvidenceId(taskId: string, index: number = 1): string {
  const num = String(index).padStart(2, '0');
  return `${taskId}-E${num}`;
}

/**
 * Generates Revision ID with suffix -R01, -R02, etc.
 */
export function generateRevisionId(taskId: string, index: number = 1): string {
  const num = String(index).padStart(2, '0');
  return `${taskId}-R${num}`;
}

/**
 * Data Privacy Check: BEIS strictly prohibits personal data like NIK, credit account numbers, customer names.
 * Sanitizes or alerts on sensitive personal patterns.
 */
export function sanitizePersonalData(text: string): { cleanText: string; detectedSensitive: boolean } {
  if (!text) return { cleanText: '', detectedSensitive: false };

  let detectedSensitive = false;
  let cleanText = text;

  // 16-digit NIK pattern
  const nikRegex = /\b\d{16}\b/g;
  if (nikRegex.test(cleanText)) {
    detectedSensitive = true;
    cleanText = cleanText.replace(nikRegex, '[NIK_PROTECTED_BEIS]');
  }

  // Account / Rekening number patterns (10-14 digits)
  const accountRegex = /\b(rek|rekening|no\.?\s*rek)\s*[:=]?\s*(\d{8,16})\b/gi;
  if (accountRegex.test(cleanText)) {
    detectedSensitive = true;
    cleanText = cleanText.replace(accountRegex, 'Rekening [NO_REK_PROTECTED_BEIS]');
  }

  return { cleanText, detectedSensitive };
}

/**
 * Helper to build an audit log record for BEIS compliance
 */
export function createAuditLogEntry(
  action: string,
  actor: string,
  details?: string,
  previousValue?: string,
  newValue?: string
): BEISAuditLog {
  return {
    id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
    action,
    actor,
    details,
    previousValue,
    newValue
  };
}

/**
 * Normalizes any task status to BEIS standard status badge styling
 */
export function getBeisBadgeClass(status: string): string {
  switch (status) {
    case 'Planned':
    case 'Belum Dimulai':
      return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700';
    case 'In Progress':
    case 'Proses':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-300 dark:border-blue-700';
    case 'At Risk':
      return 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 border-amber-300 dark:border-amber-700';
    case 'Blocked':
    case 'Tertunda':
      return 'bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-300 border-red-300 dark:border-red-700';
    case 'Submitted':
      return 'bg-purple-100 text-purple-900 dark:bg-purple-950 dark:text-purple-300 border-purple-300 dark:border-purple-700';
    case 'Validated Closed':
    case 'Selesai':
      return 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700';
    case 'Improved':
      return 'bg-cyan-100 text-cyan-900 dark:bg-cyan-950 dark:text-cyan-300 border-cyan-300 dark:border-cyan-700';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-700';
  }
}

/**
 * Returns the Role Tier ('LOW' | 'MID' | 'HIGH' | 'TOP' | 'Super Admin') for a given member tab
 */
import { INITIAL_USERS } from '../data/initialData';
import { RoleTier, BEISUserProfile as UserProfile } from '../types';

const TIER_MIGRATION_MAP: Record<string, RoleTier> = {
  'High': 'HIGH', 'Mid': 'MID', 'Low': 'LOW',
  'HIGH': 'HIGH', 'MID': 'MID', 'LOW': 'LOW',
  'TOP': 'TOP', 'Super Admin': 'Super Admin'
};

export function getAllUsersList(): UserProfile[] {
  try {
    const saved = localStorage.getItem('flowtask_users_v2');
    if (saved) {
      const users: UserProfile[] = JSON.parse(saved);
      // Merge INITIAL_USERS so built-in users always present
      const mergedMap = new Map<string, UserProfile>();
      INITIAL_USERS.forEach(u => mergedMap.set(u.id, u));
      users.forEach(u => mergedMap.set(u.id, {
        ...u,
        roleTier: TIER_MIGRATION_MAP[u.roleTier as string] || 'LOW'
      }));
      return Array.from(mergedMap.values());
    }
    const oldSaved = localStorage.getItem('flowtask_custom_users');
    if (oldSaved) {
      const custom: UserProfile[] = JSON.parse(oldSaved);
      return [...INITIAL_USERS, ...custom];
    }
  } catch (e) {
    console.error(e);
  }
  return INITIAL_USERS;
}

/*
 * getMemberRoleTier() dan canViewTier() dihapus.
 *
 * Keduanya menghitung bobot tingkatan — Super Admin 50, TOP 40, HIGH 30, MID
 * 20, LOW 10 — untuk menentukan siapa boleh melihat siapa, tetapi tidak pernah
 * dipanggil dari mana pun di seluruh aplikasi. Kewenangan yang benar-benar
 * berlaku ditentukan peran pada struktur organisasi dan atasan langsung pada
 * task_routes, bukan bobot tingkatan.
 *
 * Menyimpan aturan yang tidak pernah berjalan lebih berbahaya daripada tidak
 * punya aturan sama sekali: ia terbaca seolah ada penjagaan di sana.
 */

/**
 * Calculates aging/overdue days based on deadline and current date.
 * Returns 0 if not overdue.
 */
export function calculateAging(deadline?: string, status?: string): number {
  if (!deadline) return 0;
  if (status === 'Selesai' || status === 'Validated Closed' || status === 'Accepted' || status === 'Improved') return 0;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const deadlineDate = new Date(deadline);
  deadlineDate.setHours(0, 0, 0, 0);
  
  const diffTime = today.getTime() - deadlineDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays > 0 ? diffDays : 0;
}

/**
 * Calculates evidence rate: (Completed tasks with evidenceLink) / (Total Completed Tasks) * 100
 */
export function calculateEvidenceRate(tasks: TaskItem[]): number {
  const completedTasks = tasks.filter(t => 
    t.status === 'Selesai' || 
    t.status === 'Validated Closed' || 
    t.status === 'Accepted'
  );
  
  if (completedTasks.length === 0) return 0;
  
  const tasksWithEvidence = completedTasks.filter(t => !!t.evidenceLink || !!t.penyelesaian || (t.evidenceFiles && t.evidenceFiles.length > 0));
  return (tasksWithEvidence.length / completedTasks.length) * 100;
}

/**
 * Runs the Data Quality Engine to check for anomalies.
 * Returns an array of string flags.
 */
export function runDataQualityEngine(task: TaskItem): string[] {
  const flags: string[] = [];
  
  // Rule: Selesai tanpa evidence
  const isCompleted = task.status === 'Selesai' || task.status === 'Validated Closed' || task.status === 'Accepted';
  const hasEvidenceFile = task.evidenceFiles && task.evidenceFiles.length > 0;
  if (isCompleted && !task.evidenceLink && !task.penyelesaian && !hasEvidenceFile) {
    flags.push('Selesai tanpa evidence');
  }

  // Rule: Aktivitas terbuka tanpa deadline
  const isOpen = !isCompleted;
  const taskDeadline = task.deadline || task.tanggalFU;
  if (isOpen && !taskDeadline) {
    flags.push('Tanpa deadline definitif');
  }

  // Rule: Tenggat waktu sebelum tanggal mulai
  if (task.tanggal && taskDeadline) {
    const startDate = new Date(task.tanggal);
    const deadlineDate = new Date(taskDeadline);
    if (deadlineDate < startDate) {
      flags.push('Tanggal Anomali (Deadline sebelum mulai)');
    }
  }

  return flags;
}

/**
 * Checks if a user has permission to approve/review a task.
 * The user must be a Super Admin (PMO) or the assigned approver for the task's PIC.
 */
export function canApproveTask(currentUser: UserProfile, taskPic: string, allUsers: UserProfile[]): boolean {
  if (currentUser.role === 'Super Admin') return true;
  
  const picUser = allUsers.find(u => u.assignedMemberTab === taskPic || u.name.toUpperCase().includes(taskPic));
  if (picUser && picUser.approverId === currentUser.id) {
    return true;
  }
  
  return false;
}

