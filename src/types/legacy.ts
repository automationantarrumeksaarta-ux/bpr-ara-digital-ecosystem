export type Role = 
  | 'Komisaris Utama'
  | 'Komisaris'
  | 'Direktur Utama'
  | 'Direktur YMFK'
  | 'PE Audit Intern & Strategi Anti Fraud'
  | 'PE Kepatuhan, Manrisk, APU PPT'
  | 'PE Literasi & Edukasi, PE Bisnis & Collection'
  | 'TEKNOLOGI INFORMASI (TI)'
  | 'CRM & DIGITALISASI'
  | 'ADMIN - SDM - LEGAL'
  | 'PENGEMBANGAN SDM'
  | 'ACCOUNTING'
  | 'ANALIS KREDIT'
  | 'BAGIAN UMUM'
  | 'CUSTOMER SERVICE'
  | 'Teller'
  | 'Marketing Dana'
  | 'Kepala Kas'
  | 'KOORDINATOR COLLECTION'
  | 'STAFF COLLECTION'
  | 'Account Officer'
  | 'Kepala Cabang'
  | 'Surveyor'
  | 'Master Admin';

export type CreditStatus = 
  | 'INPUT_AO'
  | 'VERIFIKASI_ADMIN'
  | 'ANALISA_KREDIT'
  | 'KOMITE'
  | 'APPROVAL'
  | 'PENCAIRAN'
  | 'DITOLAK';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  avatarUrl?: string;
  createdAt?: string;
}

export interface ApplicationFile {
  id?: string;
  name: string;
  type: string; // 'AO' | 'Analis' | 'Admin' | 'Kepatuhan' | etc.
  url?: string;
  createdAt?: string;
}

export interface CreditApplication {
  id: string;
  name: string;
  wa?: string;
  address?: string;
  rtRw?: string;
  kel?: string;
  kec?: string;
  kab?: string;
  kodePos?: string;
  ktp?: string;
  maritalStatus?: string;
  gender?: string;
  motherMaidenName?: string;
  spouseName?: string;
  businessType?: string;
  amount: number;
  purpose: string;
  termMonths?: string | number;
  interestType?: string;
  creditType?: string;
  customerStatus?: string;
  accountNo?: string;
  sourceInfo?: string;
  usageDetail?: string;
  repaymentPlan?: string;
  riskProfile?: string;
  status: CreditStatus;
  ao: string;
  dateInput: string;
  slaDays: number;
  files: ApplicationFile[];
  opini: string;
  docImages?: Record<string, string>;
  userId?: string;
}

export type ViewTab = 
  | 'EXECUTIVE_DIREKSI'
  | 'PE_BISNIS'
  | 'PE_KEPATUHAN'
  | 'PE_AUDIT'
  | 'CRM'
  | 'ABSENSI_LAPANGAN'
  | 'MANAJEMEN_TUGAS'
  | 'PIPELINE'
  | 'NPL'
  | 'HEATMAP'
  | 'AGUNAN'
  | 'JANJI_BAYAR'
  | 'TARGET_BUNGA'
  | 'PENCAPAIAN_BISNIS';

export type TaskPriority = 'TINGGI' | 'SEDANG' | 'RENDAH';
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'COMPLETED';
export type TaskCategory = 'Proses Kredit' | 'Kunjungan Lapangan' | 'Audit & Kepatuhan' | 'Collection' | 'Operasional BPR';

export interface TaskItem {
  id: string;
  title: string;
  description: string;
  category: TaskCategory;
  priority: TaskPriority;
  status: TaskStatus;
  assigneeName: string;
  assigneeRole: Role | string;
  assigneeEmail?: string;
  dueDate: string; // YYYY-MM-DD
  dueTime?: string; // HH:mm
  relatedDebtor?: string;
  googleCalendarEventId?: string;
  googleCalendarHtmlLink?: string;
  isSyncedToGCal?: boolean;
  createdAt: string;
  completedAt?: string;
}

export interface TeamUser {
  id: string;
  fullName: string;
  email: string;
  role: Role;
  branch: string;
  phone: string;
  status: 'AKTIF' | 'CUTI' | 'NON_AKTIF';
  avatarUrl?: string;
}

export type Kolektibilitas = 'KOL_1' | 'KOL_2' | 'KOL_3' | 'KOL_4' | 'KOL_5';

export interface KreditBermasalahItem {
  id: string;
  debtorName: string;
  aoName: string;
  branch: string;
  kol: Kolektibilitas;
  outstandingPrincipal: number;
  interestArrears: number;
  daysOverdue: number;
  lastPaymentDate: string;
  actionStatus: string;
  actionNotes: string;
  region: string;
}

export interface SebaranWilayah {
  regionId: string;
  regionName: string;
  lat: number;
  lng: number;
  debtorCount: number;
  totalPlafon: number;
  nplPercentage: number;
  marketTrend: 'NAIK' | 'STABIL' | 'TURUN';
  marketTrendDescription: string;
}

export interface AgunanItem {
  id: string;
  debtorName: string;
  aoName: string;
  collateralType: 'SHM' | 'BPKB' | 'DEPOSITO' | 'OTHER';
  certificateNo: string;
  location: string;
  regionName: string;
  marketValue: number;
  liquidationValue: number;
  loanAmount: number;
  ltvRatio: number;
  isDecliningRegion: boolean;
  notes: string;
}

export interface JanjiBayarItem {
  id: string;
  debtorName: string;
  aoName: string;
  branch: string;
  promiseDate: string;
  promisedAmount: number;
  status: 'TEREALISASI' | 'INGKAR_JANJI' | 'MENUNGGU';
  notes: string;
  contactWa: string;
}

export interface AOPendapatanBunga {
  aoName: string;
  branch: string;
  targetBunga: number;
  realisasiBunga: number;
  month: string;
}

export interface PencapaianBisnisAO {
  aoName: string;
  branch: string;
  targetLanding: number;
  realisasiLanding: number;
  targetFunding: number;
  realisasiFunding: number;
}

