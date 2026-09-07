import {
  Branch,
  User,
  Customer,
  FundingOpportunity,
  GrebekPasarCampaign,
  CreditApplication,
  LoanFacility,
  CollectionCase,
  PromiseToPayRecord,
  RestructuringRecord,
  FlowTaskLegacy as FlowTask,
  KpiMetric,
  EmployeePerformanceScore,
  HrAttendanceRecord,
  EwsAlert,
  AntiFraudRedFlag,
  AuditTrailRecord,
  NotificationItem,
  SystemSettings,
} from '../types';

export const INITIAL_BRANCHES: Branch[] = [
  {
    id: 'KC_PUSAT',
    code: '001',
    name: 'KC Pusat',
    city: 'Yogyakarta',
    address: 'Jl. Malioboro No. 128, Danurejan, Kota Yogyakarta',
    phone: '(0274) 512890',
    headName: 'Agus Kurniawan, S.E.',
    targetFunding: 65000000000,
    actualFunding: 68450000000,
    targetCredit: 60000000000,
    actualCredit: 59200000000,
    nplRatio: 1.85,
  },
  {
    id: 'KC_MATESIH',
    code: '002',
    name: 'Cabang Matesih',
    city: 'Karanganyar',
    address: 'Jl. Raya Matesih',
    phone: '(0271) 123456',
    headName: 'Dra. Siti Rahayu',
    targetFunding: 45000000000,
    actualFunding: 43200000000,
    targetCredit: 42000000000,
    actualCredit: 41800000000,
    nplRatio: 2.74,
  },
  {
    id: 'KC_JUMAPOLO',
    code: '003',
    name: 'Cabang Jumapolo',
    city: 'Karanganyar',
    address: 'Jl. Raya Jumapolo',
    phone: '(0271) 654321',
    headName: 'Bambang Irawan, S.E.',
    targetFunding: 30000000000,
    actualFunding: 29800000000,
    targetCredit: 28000000000,
    actualCredit: 27500000000,
    nplRatio: 2.15,
  },
  {
    id: 'KC_KLODRAN',
    code: '004',
    name: 'Cabang Klodran',
    city: 'Karanganyar',
    address: 'Jl. Raya Klodran',
    phone: '(0271) 773102',
    headName: 'Dedi Kusuma, S.Kom.',
    targetFunding: 18000000000,
    actualFunding: 16100000000,
    targetCredit: 16000000000,
    actualCredit: 15300000000,
    nplRatio: 3.12,
  }
];

export const INITIAL_USERS = [
  { id: 'usr-superadmin', nip: 'ARA-00000', name: 'Demo Super Admin', email: 'superadmin@bprara.co.id', role: 'Master Admin', roleTitle: 'Super Admin', branchId: 'KC_PUSAT', branchName: 'KC Pusat', department: 'IT', status: 'ACTIVE' },
  { id: 'usr-dirut', nip: 'ARA-01001', name: 'Demo Dirut', email: 'dirut@bprara.co.id', role: 'Direktur Utama', roleTitle: 'Direktur Utama', branchId: 'KC_PUSAT', branchName: 'KC Pusat', department: 'Direksi', status: 'ACTIVE' },
  { id: 'usr-dir-ymfk', nip: 'ARA-01002', name: 'Demo Dir. YMFK', email: 'dirymfk@bprara.co.id', role: 'Direktur YMFK', roleTitle: 'Direktur YMFK', branchId: 'KC_PUSAT', branchName: 'KC Pusat', department: 'Direksi', status: 'ACTIVE' },
  { id: 'usr-pe-bisnis', nip: 'ARA-01003', name: 'Demo PE Bisnis', email: 'pebisnis@bprara.co.id', role: 'PE Literasi & Edukasi, PE Bisnis & Collection', roleTitle: 'PE Bisnis & Collection', branchId: 'KC_PUSAT', branchName: 'KC Pusat', department: 'Eksekutif', status: 'ACTIVE' },
  { id: 'usr-pe-kepatuhan', nip: 'ARA-01004', name: 'Demo PE Kepatuhan', email: 'pekepatuhan@bprara.co.id', role: 'PE Kepatuhan, Manrisk, APU PPT', roleTitle: 'PE Kepatuhan', branchId: 'KC_PUSAT', branchName: 'KC Pusat', department: 'Eksekutif', status: 'ACTIVE' },
  { id: 'usr-pe-audit', nip: 'ARA-01005', name: 'Demo PE Audit', email: 'peaudit@bprara.co.id', role: 'PE Audit Intern & Strategi Anti Fraud', roleTitle: 'PE Audit', branchId: 'KC_PUSAT', branchName: 'KC Pusat', department: 'Eksekutif', status: 'ACTIVE' },
  { id: 'usr-kacab', nip: 'ARA-02001', name: 'Demo Kacab', email: 'kacab@bprara.co.id', role: 'Kepala Cabang', roleTitle: 'Kepala Cabang', branchId: 'KC_PUSAT', branchName: 'KC Pusat', department: 'Cabang', status: 'ACTIVE' },
  { id: 'usr-kakas', nip: 'ARA-02002', name: 'Demo Kepala Kas', email: 'kakas@bprara.co.id', role: 'Kepala Kas', roleTitle: 'Kepala Kas', branchId: 'KC_PUSAT', branchName: 'KK Solo', department: 'Kantor Kas', status: 'ACTIVE' },
  { id: 'usr-ao', nip: 'ARA-03001', name: 'Demo Account Officer', email: 'ao@bprara.co.id', role: 'Account Officer', roleTitle: 'Account Officer', branchId: 'KC_PUSAT', branchName: 'KC Pusat', department: 'Bisnis', status: 'ACTIVE' },
  { id: 'usr-funding', nip: 'ARA-03002', name: 'Demo Funding', email: 'funding@bprara.co.id', role: 'Marketing Dana (Funding)', roleTitle: 'Marketing Dana', branchId: 'KC_PUSAT', branchName: 'KC Pusat', department: 'Bisnis', status: 'ACTIVE' },
  { id: 'usr-surveyor', nip: 'ARA-03003', name: 'Demo Surveyor', email: 'surveyor@bprara.co.id', role: 'Surveyor', roleTitle: 'Surveyor', branchId: 'KC_PUSAT', branchName: 'KC Pusat', department: 'Bisnis', status: 'ACTIVE' },
  { id: 'usr-analis', nip: 'ARA-04001', name: 'Demo Analis Kredit', email: 'analis@bprara.co.id', role: 'Analis Kredit', roleTitle: 'Analis Kredit', branchId: 'KC_PUSAT', branchName: 'KC Pusat', department: 'Operasional', status: 'ACTIVE' },
  { id: 'usr-legal', nip: 'ARA-04002', name: 'Demo Admin Legal', email: 'legal@bprara.co.id', role: 'Admin Legal', roleTitle: 'Admin Legal', branchId: 'KC_PUSAT', branchName: 'KC Pusat', department: 'Operasional', status: 'ACTIVE' },
  { id: 'usr-sdm', nip: 'ARA-04003', name: 'Demo HRD', email: 'sdm@bprara.co.id', role: 'PENGEMBANGAN SDM', roleTitle: 'HRD', branchId: 'KC_PUSAT', branchName: 'KC Pusat', department: 'Operasional', status: 'ACTIVE' },
  { id: 'usr-teller', nip: 'ARA-05001', name: 'Demo Teller', email: 'teller@bprara.co.id', role: 'Teller', roleTitle: 'Teller', branchId: 'KC_PUSAT', branchName: 'KC Pusat', department: 'Layanan', status: 'ACTIVE' },
  { id: 'usr-cs', nip: 'ARA-05002', name: 'Demo CS', email: 'cs@bprara.co.id', role: 'CUSTOMER SERVICE', roleTitle: 'CS', branchId: 'KC_PUSAT', branchName: 'KC Pusat', department: 'Layanan', status: 'ACTIVE' },
  { id: 'usr-kolektor-spv', nip: 'ARA-06001', name: 'Demo Koor. Collection', email: 'kolektorspv@bprara.co.id', role: 'KOORDINATOR COLLECTION', roleTitle: 'Koor Collection', branchId: 'KC_PUSAT', branchName: 'KC Pusat', department: 'Collection', status: 'ACTIVE' },
  { id: 'usr-kolektor', nip: 'ARA-06002', name: 'Demo Staff Collection', email: 'kolektor@bprara.co.id', role: 'STAFF COLLECTION', roleTitle: 'Staff Collection', branchId: 'KC_PUSAT', branchName: 'KC Pusat', department: 'Collection', status: 'ACTIVE' },
] as User[];

export const MACRO_PORTFOLIO_DATA = {
  lancar: 0,
  dpk: 0,
  kurangLancar: 0,
  diragukan: 0,
  macet: 0,
};

export const INITIAL_MACRO_METRICS = (() => {
  const total = MACRO_PORTFOLIO_DATA.lancar + MACRO_PORTFOLIO_DATA.dpk + MACRO_PORTFOLIO_DATA.kurangLancar + MACRO_PORTFOLIO_DATA.diragukan + MACRO_PORTFOLIO_DATA.macet;
  const npl = total > 0 ? ((MACRO_PORTFOLIO_DATA.kurangLancar + MACRO_PORTFOLIO_DATA.diragukan + MACRO_PORTFOLIO_DATA.macet) / total) * 100 : 0;
  const rr = total > 0 ? (MACRO_PORTFOLIO_DATA.lancar / total) * 100 : 0;
  const totalAset = 0; // Kualitas Aktiva Produktif
  const outstandingKredit = total; // Saldo Kredit / Baki Debet
  return { 
    npl: Number(npl.toFixed(2)), 
    rr: Number(rr.toFixed(2)),
    totalAset,
    outstandingKredit,
    totalTabungan: 0,
    totalDeposito: 0,
    aoProgress: [] as any[],
    top10Kredit: [] as any[]
  };
})();

export const INITIAL_CUSTOMERS: Customer[] = [];

export const INITIAL_GREBEK_PASAR_CAMPAIGNS: GrebekPasarCampaign[] = [];

export const INITIAL_FUNDING_OPPORTUNITIES: FundingOpportunity[] = [];

export const INITIAL_CREDIT_APPLICATIONS: CreditApplication[] = [];

export const INITIAL_LOAN_FACILITIES: LoanFacility[] = [];

export const INITIAL_PROMISE_TO_PAY: PromiseToPayRecord[] = [];

export const INITIAL_COLLECTION_CASES: CollectionCase[] = [];

export const INITIAL_RESTRUCTURING: RestructuringRecord[] = [];

export const INITIAL_FLOW_TASKS: FlowTask[] = [];

export const INITIAL_EWS_ALERTS: EwsAlert[] = [];

export const INITIAL_ANTI_FRAUD_FLAGS: AntiFraudRedFlag[] = [];

export const INITIAL_AUDIT_TRAIL: AuditTrailRecord[] = [];

export const INITIAL_ATTENDANCE: HrAttendanceRecord[] = [];

export const INITIAL_EMPLOYEE_SCORES: EmployeePerformanceScore[] = [];

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [];

export const INITIAL_SETTINGS: SystemSettings = {
  limitHeadOfBranch: 500000000,
  limitDirector: 2500000000,
  limitCreditCommittee: 5000000000,
  ewsDpdWarningDays: 25,
  ewsLdrUpperLimitPercent: 94.0,
  ewsBmpkSingleDebtorLimitPercent: 20.0,
  ewsApprovalSlaHours: 48,
  ewsGpsRadiusToleranceMeters: 500,
  rateModalKerja: 14.5,
  rateInvestasi: 13.5,
  rateKonsumtif: 15.0,
  rateDeposito1M: 5.5,
  rateDeposito3M: 5.85,
  rateDeposito6M: 6.25,
  rateDeposito12M: 6.5,
};
