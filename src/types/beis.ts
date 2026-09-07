export type BEISLevelCode = 
  | 'L01' | 'L02' | 'L03' | 'L04' | 'L05' | 'L06' 
  | 'L07' | 'L08' | 'L09' | 'L10' | 'L11' | 'L12';

export type BEISDomainCode = 
  | 'ADM' // Administrative
  | 'OPS' // Operational
  | 'CRD' // Credit
  | 'COL' // Collection
  | 'FND' // Funding
  | 'MKT' // Marketing
  | 'HCM' // Human Capital
  | 'CRK' // Compliance & Risk
  | 'ITD' // IT & Digital
  | 'EXE' // Executive
  | 'LGL' // Legal
  | 'KIM'; // Knowledge & Improvement

export type BEISTaskStatus = 
  | 'Planned'
  | 'In Progress'
  | 'At Risk'
  | 'Blocked'
  | 'Submitted'
  | 'Validated Closed'
  | 'Improved'
  | 'Accepted'
  | 'Minor Rework'
  | 'Major Rework'
  | 'Escalated';

export type BEISTaskItemStatus = 
  | BEISTaskStatus
  | 'Belum Dimulai' 
  | 'Proses' 
  | 'Selesai' 
  | 'Tertunda';

export type Category = 
  | 'Bisnis'
  | 'Audit'
  | 'Kepatuhan'
  | 'Staff/Operasional'
  | 'Account Officer'
  | 'Senior Account Officer Funding'
  | 'Kepala Kantor Kas'
  | 'Collection'
  | 'Lainnya';

export type Subcategory = 
  | 'Aktivitas Umum, AM dan Bisnis'
  | 'Fungsi Adaptasi Teknologi/Penerapan Pembelajaran Baru'
  | 'Fungsi Pengembangan Kredit'
  | 'Fungsi Pengembangan Tabungan'
  | 'Fungsi Kolaborasi Program Bisnis Antar Divisi/Kantor Kas'
  | 'Aktivitas Umum, AM dan Audit'
  | 'Fungsi Audit Improvement System'
  | 'Fungsi Cost Reduction'
  | 'Fungsi Kolaborasi Tata Kelola'
  | 'Fungsi Tata Kelola Mitigasi Kredit dan Resiko'
  | 'Aktivitas Harian'
  | 'Kolaborasi'
  | 'Adaptasi Teknologi/Penerapan Pembelajaran Baru'
  | 'Inisiatif'
  | 'Maintenance'
  | 'Prospek'
  | 'Pengembangan Wilayah Baru'
  | 'Rutinitas Harian'
  | 'Adaptasi Teknologi Pembelajaran Baru'
  | 'Selling'
  | 'Collecting'
  | 'Lainnya';

export interface BEISAuditLog {
  id: string;
  timestamp: string;
  action: string;
  actor: string;
  details?: string;
  previousValue?: string;
  newValue?: string;
}

export type JenisTeknis = 
  | 'Rutinitas Harian'
  | 'Prospek Calon Debitur'
  | 'Visit Maintenance Debitur'
  | 'Kolaborasi'
  | 'Inisiatif'
  | 'Inovasi'
  | 'Adaptasi Teknologi Pembelajaran Baru'
  | 'Finding Problem dan Solusi'
  | 'Laporan';

export type Timeline = 'Harian' | 'Mingguan' | 'Bulanan' | '3 Bulanan' | 'Aksidental';

export type Prioritas = 
  | 'P1' | 'P2' | 'P3' | 'P4' | 'P5' 
  | 'P6' | 'P7' | 'P8' | 'P9' | 'P10' 
  | 'P11' | 'P12' | 'P13' | 'P14' | 'P15';

export type RoleTier = 'LOW' | 'MID' | 'HIGH' | 'TOP' | 'Super Admin';
export type BEISUserRole = 
  | 'Super Admin' 
  | 'Atasan / Manager' 
  | 'Staff / Member';

export interface EvidenceFile {
  id: string;
  name: string;
  size: number;
  type: string;
  storageKey?: string; // Optional metadata, binary file handled via stream
  uploadedAt: string;
}

export interface TaskItem {
  id: string; // Internal unique ID
  taskId: string; // BEIS Task ID e.g. BEIS-L03-CRD-AKR-BIS-20260727-001
  parentCaseId?: string; // Parent/Case ID
  projectId?: string; // Link to Project
  unit: string; // Unit (e.g. BIS, PUSAT, MKT, OPS, CRD, ITD)
  pic: string; // PIC / Staff name
  output?: string; // New field from PRD (Cetha)
  outcome?: string; // Outcome Berhasil
  outputDoD?: string; // Definition of Done / Expected Output
  outputDoD2?: string; // Output Target 2
  deadline?: string; // Deadline YYYY-MM-DD
  evidenceLink?: string; // Tautan Evidence (Cetha)
  dataQualityFlags?: string[]; // E.g., ['Missing Evidence', 'No Deadline']
  agingDays?: number; // Calculated aging/overdue days
  category?: Category;
  subcategory?: Subcategory;
  evidenceId?: string; // Evidence ID e.g. BEIS-L03-CRD-AKR-BIS-20260727-001-E01
  revisionId?: string; // Revision ID e.g. BEIS-L03-CRD-AKR-BIS-20260727-001-R01
  validator?: string; // Validator PIC / Role
  closedDate?: string; // Closed Date YYYY-MM-DD
  beisLevel?: BEISLevelCode;
  beisDomain?: BEISDomainCode;
  beisCategory?: string;
  mentions?: string[]; // Pihak/divisi yang di-mention
  auditTrail?: BEISAuditLog[];
  evidenceFiles?: EvidenceFile[]; // Uploaded evidence files
  escalatedTo?: string; // ID of the user this task is escalated to

  assignedTo: string; // Member tab name (e.g., EGI, AJI, TITOES, REKAP PUSAT)
  tanggal: string; // YYYY-MM-DD format
  deskripsiTugas: string;
  jenisTeknis: JenisTeknis;
  timeline: Timeline;
  arahanAtasan: string; // Arahan Atasan A -> Staff (WOPS)
  arahanAtasanUtama?: string; // Arahan Atasan B -> Atasan A (WOPS)
  prioritas: Prioritas;
  status: BEISTaskItemStatus;
  penyelesaian: string; // URL or notes (Evidence)
  tanggalFU: string; // Follow up date YYYY-MM-DD
  createdAt: string;
  updatedAt: string;
  syncedToCalendar?: boolean;
  calendarEventId?: string;
  commentsCount?: number;
}

export interface BEISUserProfile {
  id: string;
  name: string;
  email: string;
  username?: string;
  password?: string;
  role: BEISUserRole;
  roleTier?: RoleTier;
  unit?: string; // Kode Unit BEIS (e.g., DIR, BIS, KPT, AUD, PMO, OPS, COL, FND, HCM, ITD, LGL, KOM)
  assignedMemberTab: string;
  avatarUrl: string;
  pinCode?: string;
  twoFactorEnabled: boolean;
  emailNotifications: boolean;
  calendarConnected: boolean;
  approverId?: string; // ID of the approver
}

export interface BEISNotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'reminder' | 'sync' | 'security' | 'report' | 'system';
  read: boolean;
  timestamp: string;
}

export interface TeamMemberStats {
  member: string;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  productivityScore: number;
}

export interface WeeklyReportData {
  weekTitle: string;
  startDate: string;
  endDate: string;
  totalTasks: number;
  completedTasks: number;
  completionRate: number;
  topPerformers: { name: string; completed: number; score: number }[];
  categoryBreakdown: { category: string; count: number }[];
  aiExecutiveSummary: string;
  keyHighlights: string[];
}

export interface Project {
  id: string;
  title: string;
  target: number;
  actual: number;
  unit: string;
  status: 'On Track' | 'Delayed' | 'At Risk' | 'Completed';
  deadline: string;
  manager: string;
  trend?: { label: string; realisasi: number }[];
}

export interface KPI {
  id: string;
  userId: string;
  metric: string;
  target: number;
  actual: number;
  unit: string;
  weight: number;
}

export interface OKR {
  id: string;
  department: string;
  objective: string;
  keyResults: { id: string; description: string; target: number; actual: number; unit: string }[];
}

export interface Score {
  userId: string;
  disiplin: number; // DSP scored by approver
  redFlags: string[]; // Red flag IDs
  rfReviewer?: string;
  rfDate?: string;
  totalPoints: number; // dynamically calculated final score
  breakdown: { category: string; points: number }[];
}

export interface AbsenceActivity {
  id: string;
  userId: string;
  taskId?: string;
  activity: string;
  clientName: string;
  visitResult: string;
  category: string;
  photoUrl: string;
  latitude: number;
  longitude: number;
  address: string;
  timestamp: string;
}

export interface BEISCategoryItem {
  id: string; // Unique ID
  level: string; // e.g. L01
  domain: string; // e.g. ADM
  code: string; // e.g. SOP
  name: string; // Full name
}

export interface BEISValidatorItem {
  id: string; // Unique ID
  domain: string; // e.g. L01 - Administrative
  pic: string;
  validator: string;
  trigger: string;
}
