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
  { id: 'usr-admin', nip: 'ARA-00000', name: 'Administrator', email: 'admin@bprara.co.id', role: 'Master Admin', roleTitle: 'Super Admin', branchId: 'KC_PUSAT', branchName: 'KC Pusat', department: 'IT', status: 'ACTIVE' },
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
