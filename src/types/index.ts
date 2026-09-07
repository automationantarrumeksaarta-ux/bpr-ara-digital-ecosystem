export type UserRole = 
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
  // Required core system roles (preserved to prevent breakage if missing from list)
  | 'Account Officer'
  | 'Kepala Cabang'
  | 'Surveyor'
  | 'Master Admin'
  | 'Super Admin'
  | 'Staff / Member'
  | 'Atasan / Manager';

// Role Authorization Helpers
export const isExecutiveRole = (role: UserRole) => {
  return role === 'Direktur Utama' || 
         role === 'Direktur YMFK' || 
         role === 'Direktur' ||
         role === 'Komisaris Utama' || 
         role === 'Komisaris' ||
         role === 'Master Admin' ||
         role === 'Super Admin' ||
         role.includes('Direktur') ||
         role.includes('Komisaris');
};

export const isPeBisnisRole = (role: UserRole) => {
  return isExecutiveRole(role) || 
         role === 'PE Bisnis & Collection' || 
         role === 'Kepala Cabang' ||
         role.includes('PE Bisnis');
};

export const isPeKepatuhanRole = (role: UserRole) => {
  return isExecutiveRole(role) || 
         role === 'PE Kepatuhan, Manrisk & LK' || 
         role.includes('PE Kepatuhan') ||
         role.includes('Kepatuhan');
};

export const isPeAuditRole = (role: UserRole) => {
  return isExecutiveRole(role) || 
         role === 'PE Audit Intern & Anti Fraud' || 
         role.includes('PE Audit') ||
         role.includes('Audit');
};

export const isCrmRole = (role: UserRole) => {
  return isExecutiveRole(role) || 
         role === 'CRM & Digitalisasi' || 
         role.includes('CRM') ||
         role.includes('Teknologi Informasi');
};

export type RoleTier = 'LOW' | 'MID' | 'HIGH' | 'TOP' | 'Super Admin';

export type BranchId = 'KC_PUSAT' | 'KC_MATESIH' | 'KC_JUMAPOLO' | 'KC_KLODRAN';

export interface Branch {
  id: BranchId;
  code: string;
  name: string;
  city: string;
  address: string;
  phone: string;
  headName: string;
  targetFunding: number;
  actualFunding: number;
  targetCredit: number;
  actualCredit: number;
  nplRatio: number;
}

export interface User {
  id: string;
  nip: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  roleTier?: RoleTier;
  roleTitle: string;
  branchId: BranchId;
  branchName: string;
  department: string;
  avatar: string;
  approvalLimit: number; // in IDR
  status: 'ACTIVE' | 'ON_LEAVE' | 'INACTIVE';
  biometricRegistered: boolean;
  pinRegistered: boolean;
  lastLogin: string;
  username?: string;
  password?: string;
  unit?: string;
  assignedMemberTab?: string;
  pinCode?: string;
  twoFactorEnabled?: boolean;
  emailNotifications?: boolean;
  dashboardLayout?: string;
  calendarConnected?: boolean;
}

export type CustomerSegment = 'UMKM_MIKRO' | 'UMKM_KECIL' | 'KONSUMER' | 'KOMERSIAL' | 'PRIORITAS';
export type Collectibility = 'KOL_1' | 'KOL_2' | 'KOL_3' | 'KOL_4' | 'KOL_5';

export interface CustomerTimelineEvent {
  id: string;
  timestamp: string;
  module: string;
  actor: string;
  action: string;
  details: string;
  iconType: 'credit' | 'funding' | 'visit' | 'call' | 'approval' | 'ews' | 'document' | 'payment';
}

export interface Customer {
  id: string;
  cif: string;
  nik: string;
  npwp?: string;
  name: string;
  motherMaidenName: string;
  phone: string;
  email: string;
  dateOfBirth: string;
  gender: 'L' | 'P';
  maritalStatus: 'MENIKAH' | 'BELUM_MENIKAH' | 'DUDA_JANDA';
  address: string;
  rtRw: string;
  kelurahan: string;
  kecamatan: string;
  city: string;
  occupation: string;
  businessName?: string;
  businessType?: string;
  businessYears?: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  branchId: BranchId;
  accountOfficerId: string;
  accountOfficerName: string;
  segment: CustomerSegment;
  riskRating: 'LOW' | 'MEDIUM' | 'HIGH';
  currentCollectibility: Collectibility;
  totalFundingBalance: number;
  totalCreditOutstanding: number;
  fraudAlertFlag: boolean;
  createdAt: string;
  relatedParties: Array<{ name: string; relation: string; cif?: string; phone: string }>;
  emergencyContacts: Array<{ name: string; relation: string; phone: string; address: string }>;
  documents: Array<{ id: string; type: string; title: string; fileUrl: string; verified: boolean; uploadDate: string }>;
  timeline: CustomerTimelineEvent[];
}

export type FundingProductType =
  | 'TABUNGAN_ARTA_UTAMA'
  | 'TABUNGAN_SIMPEL'
  | 'TABUNGAN_BERJANGKA_ARA'
  | 'DEPOSITO_1_BULAN'
  | 'DEPOSITO_3_BULAN'
  | 'DEPOSITO_6_BULAN'
  | 'DEPOSITO_12_BULAN';

export type FundingPipelineStage =
  | 'PROSPECT'
  | 'QUALIFIED'
  | 'INTERESTED'
  | 'FOLLOW_UP'
  | 'COMMITMENT'
  | 'ACCOUNT_OPENED'
  | 'FUNDING_RECEIVED';

export type FundingSource =
  | 'GREBEK_PASAR'
  | 'COMMUNITY'
  | 'REFERRAL'
  | 'EXISTING_CUSTOMER'
  | 'PAYROLL'
  | 'INSTITUTION'
  | 'WALK_IN'
  | 'CROSS_SELLING'
  | 'MARKETING_VISIT'
  | 'EVENT';

export interface FundingOpportunity {
  id: string;
  cif: string;
  customerName: string;
  phone: string;
  productType: FundingProductType;
  productCategory: 'CASA' | 'DEPOSITO';
  targetAmount: number;
  realizedAmount: number;
  interestRate: number; // % p.a
  tenorMonths?: number;
  source: FundingSource;
  stage: FundingPipelineStage;
  branchId: BranchId;
  officerId: string;
  officerName: string;
  campaignId?: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
  accountNumber?: string;
}

export interface GrebekPasarCampaign {
  id: string;
  code: string;
  name: string;
  marketLocation: string;
  city: string;
  branchId: BranchId;
  startDate: string;
  endDate: string;
  teamLeaderId: string;
  teamLeaderName: string;
  teamMembers: string[];
  targetProspects: number;
  targetFundingAmount: number;
  actualVisits: number;
  actualProspects: number;
  actualInterested: number;
  actualAccountsOpened: number;
  actualFundingRealized: number;
  status: 'UPCOMING' | 'ACTIVE' | 'COMPLETED';
}

export type CreditProductType =
  | 'KREDIT_MODAL_KERJA_MIKRO'
  | 'KREDIT_INVESTASI_USAHA'
  | 'KREDIT_MULTI_GUNA_KONSUMTIF'
  | 'KREDIT_PEGAWAI_KARYAWAN'
  | 'KREDIT_MUSIMAN_PERTANIAN';

export type CreditAppStage =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'VERIFICATION'
  | 'SLIK'
  | 'SURVEY'
  | 'ANALYSIS'
  | 'LEGAL_REVIEW'
  | 'CREDIT_COMMITTEE'
  | 'APPROVED'
  | 'DISBURSED'
  | 'REJECTED';

export interface SlikRecord {
  bankName: string;
  facilityType: string;
  plafon: number;
  bakiDebet: number;
  collectibility: Collectibility;
  worstDpd: number;
  status: 'LANCAR' | 'PERHATIAN_KHUSUS' | 'MACET';
}

export interface SlikCheckResult {
  checkedAt: string;
  checkedBy: string;
  referenceNo: string;
  overallScore: 'CLEAN' | 'ACCEPTABLE' | 'HIGH_RISK' | 'REJECT';
  totalActiveFacilities: number;
  totalBakiDebet: number;
  worstKol: Collectibility;
  facilities: SlikRecord[];
  notes: string;
}

export interface OTSFieldSurvey {
  id: string;
  applicationId: string;
  surveyorId: string;
  surveyorName: string;
  scheduledDate: string;
  conductedDate?: string;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'NEED_VERIFICATION';
  gpsLatitude: number;
  gpsLongitude: number;
  gpsAccuracyMeters: number;
  locationAddress: string;
  houseOwnership: 'MILIK_SENDIRI' | 'SEWA_KONTRAK' | 'MILIK_KELUARGA';
  residenceCondition: 'SANGAT_BAIK' | 'BAIK' | 'CUKUP' | 'BURUK';
  businessCondition: 'AKTIF_RAMAI' | 'SEDANG' | 'SEPI' | 'TIDAK_BEROPERASI';
  accessRoadWidth: number; // meters
  neighborhoodCharacterNotes: string;
  neighborIntervieweeName: string;
  neighborIntervieweeRelation: string;
  neighborFeedback: 'SANGAT_POSITIF' | 'POSITIF' | 'NETRAL' | 'NEGATIF';
  photos: Array<{ id: string; label: string; url: string; timestamp: string; gpsTag: string }>;
  surveyorSummary: string;
  surveyScore: number; // 0-100
}

export interface CollateralItem {
  id: string;
  applicationId: string;
  cif: string;
  ownerName: string;
  type: 'SHM' | 'SHGB' | 'AJB' | 'BPKB_MOBIL' | 'BPKB_MOTOR' | 'GIRO_BILYET';
  documentNumber: string;
  issuedBy: string;
  issueDate: string;
  expiryDate?: string;
  description: string;
  addressOrPlateNumber: string;
  surfaceAreaSqMeters?: number;
  buildingAreaSqMeters?: number;
  vehicleBrandModelYear?: string;
  engineFrameNo?: string;
  marketValue: number;
  liquidationValue: number;
  safetyMarginPercent: number; // e.g. 70%
  ltvPercent: number; // Loan-to-Value calculated
  bpnVerificationStatus: 'VERIFIED' | 'IN_PROCESS' | 'BLOCKED' | 'UNVERIFIED';
  insuranceStatus: 'ACTIVE' | 'EXPIRED' | 'NOT_INSURED';
  insurancePolicyNumber?: string;
  insuranceExpiry?: string;
  photos: string[];
}

export interface CreditAnalysisRecord {
  id: string;
  applicationId: string;
  analystId: string;
  analystName: string;
  analyzedAt: string;
  // 5C Scoring
  characterScore: number; // 0 - 100
  characterNotes: string;
  capacityScore: number;
  capacityNotes: string;
  capitalScore: number;
  capitalNotes: string;
  collateralScore: number;
  collateralNotes: string;
  conditionScore: number;
  conditionNotes: string;
  // Financial metrics
  grossMonthlyRevenue: number;
  operationalCost: number;
  livingCost: number;
  netDisposableIncome: number;
  proposedInstallment: number;
  existingDebtInstallments: number;
  totalObligations: number;
  dscrRatio: number; // Debt Service Coverage Ratio (e.g. 1.85)
  idiIndexPercent: number; // Installment to Disposable Income (e.g. 42%)
  aiRiskAssessment: string;
  aiSuggestedPlafon: number;
  analystRecommendation: 'RECOMMENDED_APPROVE' | 'RECOMMENDED_REJECT' | 'RECOMMENDED_MODIFY';
  proposedPlafon: number;
  proposedTenorMonths: number;
  proposedInterestRate: number; // % p.a.
  proposedProvisionPercent: number;
  analystSummary: string;
}

export interface CreditApprovalDecision {
  id: string;
  applicationId: string;
  approverId: string;
  approverName: string;
  approverRole: UserRole;
  approverRoleTitle: string;
  approvalLevel: 'AO_RECOMMEND' | 'KEPALA_CABANG' | 'DIREKSI' | 'KOMITE_KREDIT';
  authorityLimit: number;
  decision: 'APPROVED' | 'REJECTED' | 'CONDITIONAL' | 'RETURN_TO_ANALYST';
  approvedPlafon: number;
  approvedTenor: number;
  approvedRate: number;
  conditionNotes?: string;
  comment: string;
  digitalSignatureHash: string;
  decidedAt: string;
}

export interface CreditDocument {
  id: string;
  name: string;
  type: string;
  url: string;
  uploadedBy: string;
  uploadedAt: string;
  stage: CreditAppStage;
}

export interface CreditApplication {
  id: string;
  applicationNumber: string;
  cif: string;
  customerName: string;
  phone: string;
  branchId: BranchId;
  productType: CreditProductType;
  requestedPlafon: number;
  requestedTenorMonths: number;
  purpose: 'MODAL_KERJA' | 'INVESTASI' | 'KONSUMTIF';
  purposeDetails: string;
  maritalStatus?: string;
  motherName?: string;
  spouseName?: string;
  address?: string;
  rtRw?: string;
  kelurahan?: string;
  kecamatan?: string;
  kabupaten?: string;
  creditType?: string;
  debtorStatus?: string;
  interestRate?: number;
  accountOfficerId: string;
  accountOfficerName: string;
  currentStage: CreditAppStage;
  slaDeadline: string;
  slaExceeded: boolean;
  slikResult?: SlikCheckResult;
  survey?: OTSFieldSurvey;
  collaterals: CollateralItem[];
  analysis?: CreditAnalysisRecord;
  approvals: CreditApprovalDecision[];
  legalReviewNotes?: string;
  legalReviewPassed: boolean;
  disbursedFacilityId?: string;
  rejectionReason?: string;
  revisionNotes?: string;
  documents?: CreditDocument[];
  createdAt: string;
  updatedAt: string;
}

export interface LoanFacility {
  id: string;
  facilityNumber: string;
  accountNumber: string;
  cif: string;
  customerName: string;
  phone: string;
  branchId: BranchId;
  productType: CreditProductType;
  originalPlafon: number;
  outstandingPrincipal: number;
  tenorMonths: number;
  interestRateAnnual: number;
  monthlyInstallment: number;
  disbursementDate: string;
  maturityDate: string;
  collectibility: Collectibility;
  dpdDays: number;
  lastPaymentDate: string;
  nextDueDate: string;
  unpaidInstallmentsCount: number;
  overdueAmount: number;
  accountOfficerId: string;
  collectorId?: string;
  collectorName?: string;
  status: 'ACTIVE' | 'PAID_OFF' | 'RESTRUCTURED' | 'WRITTEN_OFF';
}

export interface PromiseToPayRecord {
  id: string;
  caseId: string;
  facilityId: string;
  cif: string;
  debtorName: string;
  collectorId: string;
  collectorName: string;
  promiseDate: string;
  promisedAmount: number;
  actualPaymentDate?: string;
  actualPaidAmount?: number;
  status: 'PROMISED' | 'DUE' | 'PAID' | 'BROKEN' | 'ESCALATED';
  brokenReason?: string;
  escalatedToLegal: boolean;
  notes: string;
  createdAt: string;
}

export interface CollectionCase {
  id: string;
  facilityId: string;
  facilityNumber: string;
  cif: string;
  debtorName: string;
  phone: string;
  address: string;
  branchId: BranchId;
  outstandingBalance: number;
  overdueAmount: number;
  dpdDays: number;
  collectibility: Collectibility;
  collectorId: string;
  collectorName: string;
  lastContactDate?: string;
  lastContactOutcome?: string;
  ptpRecords: PromiseToPayRecord[];
  visitHistory: Array<{
    id: string;
    date: string;
    collectorName: string;
    gpsLocation: string;
    personMet: string;
    outcome: string;
    photoUrl?: string;
    nextAction: string;
  }>;
  status: 'OPEN_CALL' | 'FIELD_VISIT_SCHEDULED' | 'NEGOTIATION' | 'PTP_ACTIVE' | 'ESCALATED_RESTRUCTURING' | 'LEGAL_RECOVERY';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface RestructuringRecord {
  id: string;
  facilityId: string;
  cif: string;
  debtorName: string;
  branchId: BranchId;
  previousPlafon: number;
  previousOutstanding: number;
  previousKol: Collectibility;
  scheme: 'RESCHEDULING' | 'RECONDITIONING' | 'RESTRUCTURING_FULL';
  newTenorMonths: number;
  newInterestRate: number;
  gracePeriodMonths: number;
  approvedBy: string;
  approvalDate: string;
  status: 'PROPOSED' | 'ANALYSIS' | 'APPROVED' | 'EXECUTED' | 'FAILED';
  collateralExecutionStage?: 'SURAT_PERINGATAN_1' | 'SURAT_PERINGATAN_2' | 'SURAT_PERINGATAN_3' | 'LELANG_KPKNL' | 'AYDA';
  notes: string;
}

export type TaskModule =
  | 'CRM'
  | 'MARKETING'
  | 'FUNDING'
  | 'LOS'
  | 'SURVEY'
  | 'ANALYSIS'
  | 'APPROVAL'
  | 'LEGAL'
  | 'COLLECTION'
  | 'HR'
  | 'AUDIT'
  | 'EWS'
  | 'COMPLIANCE';

export type TaskStatus = 'OPEN' | 'IN_PROGRESS' | 'BLOCKED' | 'IN_REVIEW' | 'DONE' | 'VALIDATED' | 'CANCELLED';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface FlowTaskLegacy {
  id: string;
  title: string;
  description: string;
  module: TaskModule;
  entityType: 'CUSTOMER' | 'CREDIT_APP' | 'FUNDING_OPP' | 'FACILITY' | 'SURVEY' | 'EWS_ALERT' | 'AUDIT_FINDING' | 'HR_ATTENDANCE';
  entityId: string;
  entityReference: string; // e.g. "CIF-0941 - Budi Santoso"
  ownerId: string;
  ownerName: string;
  ownerRole: UserRole;
  approverId?: string;
  approverName?: string;
  branchId: BranchId;
  priority: TaskPriority;
  deadline: string;
  status: TaskStatus;
  progressPercent: number;
  evidenceUrls: string[];
  evidenceNotes?: string;
  createdAt: string;
  completedAt?: string;
}

export interface KpiMetric {
  id: string;
  code: string;
  name: string;
  category: 'FUNDING' | 'CREDIT' | 'COLLECTION' | 'PRODUCTIVITY' | 'COMPLIANCE';
  targetValue: number;
  actualValue: number;
  unit: 'IDR' | 'COUNT' | 'PERCENT' | 'DAYS';
  weightPercent: number;
  achievementPercent: number;
  score: number; // weighted
}

export interface EmployeePerformanceScore {
  userId: string;
  userName: string;
  role: UserRole;
  branchId: BranchId;
  period: string; // "Agustus 2026"
  fundingRealized: number;
  fundingTarget: number;
  creditDisbursed: number;
  creditTarget: number;
  crmVisitsCompleted: number;
  taskSlaAdherencePercent: number;
  collectionRecoveryRate: number;
  attendancePercent: number;
  overallScore: number; // 0 - 100
  grade: 'A_EXCEPTIONAL' | 'B_GOOD' | 'C_AVERAGE' | 'D_NEEDS_IMPROVEMENT';
}

export interface HrAttendanceRecord {
  id: string;
  userId: string;
  userName: string;
  roleTitle: string;
  branchId: BranchId;
  date: string;
  checkInTime: string;
  checkOutTime?: string;
  gpsLatitude: number;
  gpsLongitude: number;
  distanceFromBranchMeters: number;
  isWithinRadius: boolean;
  selfieUrl: string;
  status: 'ON_TIME' | 'LATE' | 'FIELD_DUTY' | 'LEAVE' | 'ABSENT';
  fieldDutyNotes?: string;
}

export interface EwsAlert {
  id: string;
  alertCode: string;
  category:
    | 'ATTENDANCE_GPS'
    | 'APPROVAL_SLA'
    | 'CREDIT_QUALITY'
    | 'CONCENTRATION_RISK'
    | 'FUNDING_LIQUIDITY'
    | 'DOCUMENTS_EXPIRY'
    | 'DATA_ACCESS'
    | 'HR_ANOMALY'
    | 'BROKEN_PTP';
  severity: 'GREEN' | 'YELLOW' | 'RED';
  title: string;
  description: string;
  module: TaskModule;
  entityType: string;
  entityId: string;
  entityReference: string;
  branchId: BranchId;
  triggeredAt: string;
  status: 'DETECTED' | 'REVIEW' | 'ACTION_REQUIRED' | 'RESOLVED';
  assignedToId?: string;
  assignedToName?: string;
  resolutionAction?: string;
  resolvedAt?: string;
}

export interface AntiFraudRedFlag {
  id: string;
  code: string;
  indicator: string;
  suspectEntityType: 'CUSTOMER' | 'COLLATERAL' | 'APPROVAL' | 'ATTENDANCE' | 'DOCUMENT';
  suspectEntityId: string;
  suspectEntityTitle: string;
  detectedAt: string;
  riskScore: number; // 0-100
  details: string;
  investigatorId?: string;
  investigatorName?: string;
  status: 'NEW' | 'INVESTIGATING' | 'CONFIRMED_FRAUD' | 'FALSE_POSITIVE' | 'CLOSED';
}

export type AuditAction =
  | 'LOGIN'
  | 'LOGOUT'
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE_ATTEMPT'
  | 'APPROVE'
  | 'REJECT'
  | 'DISBURSE'
  | 'DOWNLOAD'
  | 'UPLOAD'
  | 'EXPORT'
  | 'ROLE_CHANGE'
  | 'SETTING_CHANGE'
  | 'OVERRIDE_LIMIT'
  | 'RESTRUCTURE';

export interface AuditTrailRecord {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  ipAddress: string;
  deviceInfo: string;
  module: TaskModule | 'AUTH' | 'SETTINGS' | 'SYSTEM';
  entityType: string;
  entityId: string;
  action: AuditAction;
  previousValueSummary?: string;
  newValueSummary: string;
  resultStatus: 'SUCCESS' | 'BLOCKED' | 'FAILED';
  immutableHash: string;
}

export interface NotificationItem {
  id: string;
  timestamp: string;
  userId: string;
  title: string;
  message: string;
  module: TaskModule;
  entityType?: string;
  entityId?: string;
  read: boolean;
  priority: 'NORMAL' | 'HIGH' | 'URGENT';
}

export interface SystemSettings {
  // Approval Authority Limits (in IDR)
  limitHeadOfBranch: number;
  limitDirector: number;
  limitCreditCommittee: number;
  // EWS Thresholds
  ewsDpdWarningDays: number;
  ewsLdrUpperLimitPercent: number;
  ewsBmpkSingleDebtorLimitPercent: number;
  ewsApprovalSlaHours: number;
  ewsGpsRadiusToleranceMeters: number;
  // Interest Rates (% p.a.)
  rateModalKerja: number;
  rateInvestasi: number;
  rateKonsumtif: number;
  rateDeposito1M: number;
  rateDeposito3M: number;
  rateDeposito6M: number;
  rateDeposito12M: number;
}

// Aliases for module convenience
export type RiskLevel = 'RED' | 'YELLOW' | 'GREEN';
export type FundingStage = FundingPipelineStage;
export type LosStage = CreditAppStage;
export type LoanProductType = CreditProductType;

export * from './beis';

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


