import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { navigationConfig } from '../config/navigationConfig';
import {
  User,
  UserRole,
  Branch,
  BranchId,
  Customer,
  FundingOpportunity,
  GrebekPasarCampaign,
  CreditApplication,
  LoanFacility,
  CollectionCase,
  PromiseToPayRecord,
  RestructuringRecord,
  FlowTaskLegacy, TaskItem,
  EwsAlert,
  AntiFraudRedFlag,
  AuditTrailRecord,
  HrAttendanceRecord,
  EmployeePerformanceScore,
  NotificationItem,
  SystemSettings,
  TaskModule,
  AuditAction,
  AOPendapatanBunga,
  PencapaianBisnisAO,
  AgunanItem,
} from '../types';
import {
  INITIAL_BRANCHES,
  INITIAL_USERS,
  INITIAL_CUSTOMERS,
  INITIAL_FUNDING_OPPORTUNITIES,
  INITIAL_GREBEK_PASAR_CAMPAIGNS,
  INITIAL_CREDIT_APPLICATIONS,
  INITIAL_LOAN_FACILITIES,
  INITIAL_COLLECTION_CASES,
  INITIAL_PROMISE_TO_PAY,
  INITIAL_RESTRUCTURING,
  INITIAL_EWS_ALERTS,
  INITIAL_ANTI_FRAUD_FLAGS,
  INITIAL_AUDIT_TRAIL,
  INITIAL_ATTENDANCE,
  INITIAL_EMPLOYEE_SCORES,
  INITIAL_NOTIFICATIONS,
  INITIAL_SETTINGS,
  INITIAL_MACRO_METRICS
} from '../mock/initialData';
import { INITIAL_TASKS } from '../data/initialData';
import { 
  INITIAL_AGUNAN_DATA, 
  INITIAL_TARGET_BUNGA_DATA, 
  INITIAL_PENCAPAIAN_BISNIS_DATA 
} from '../mock/legacyDashboardData';

export type AppModuleId =
  | 'EXECUTIVE_DASHBOARD'
  | 'CRM_CUSTOMERS'
  | 'MARKETING_ACTIVITY'
  | 'FUNDING_DASHBOARD'
  | 'FUNDING_CASA'
  | 'GREBEK_PASAR'
  | 'LOS_CREDIT'
  | 'OTS_SURVEY'
  | 'CREDIT_ANALYSIS'
  | 'COLLATERAL_APPRAISAL'
  | 'CREDIT_APPROVAL'
  | 'LEGAL_DOCUMENTS'
  | 'DISBURSEMENT_PORTFOLIO'
  | 'COLLECTION_MGMT'
  | 'PTP_TRACKER'
  | 'NPL_RESTRUCTURING'
  | 'FLOW_TASKS'
  | 'KPI_PERFORMANCE'
  | 'PAYROLL_MGMT'
  | 'EWS_RISK'
  | 'COMPLIANCE'
  | 'ANTI_FRAUD_AUDIT'
  | 'REPORTS_BEIS'
  | 'DECISION_QUEUE'
  | 'CALENDAR_VIEW'
  | 'REPORTS_CENTER'
  | 'MASTER_SETTINGS'
  | 'PE_BISNIS'
  | 'PE_KEPATUHAN'
  | 'PE_AUDIT'
  | 'HEAT_MAP'
  | 'TARGET_BUNGA'
  | 'PENCAPAIAN_BISNIS'
  | 'BRANCH_NETWORK'
  | 'PROJECT_MANAGEMENT'
  | 'DATA_CENTER_CBS';

interface AppContextType {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  isAuthenticated: boolean;
  setIsAuthenticated: (val: boolean) => void;
  isAuthLoading: boolean;
  switchUserByRole: (role: UserRole) => void;
  rolePermissions: Record<string, string[]>;
  updateRolePermissions: (role: string, perms: string[]) => void;
  allUsers: User[];
  branches: Branch[];
  selectedBranchId: BranchId | 'ALL';
  setSelectedBranchId: (branchId: BranchId | 'ALL') => void;
  activeModule: AppModuleId;
  setActiveModule: (mod: AppModuleId) => void;
  isAuthenticated: boolean;
  setIsAuthenticated: (auth: boolean) => void;
  macroMetrics: { rr: number; npl: number; totalAset: number; outstandingKredit: number; totalTabungan?: number; totalDeposito?: number; noaTabungan?: number; noaDeposito?: number; noaTabunganBaru?: number; noaDepositoBaru?: number; labaTahunBerjalan?: number };
  setMacroMetrics: React.Dispatch<React.SetStateAction<{ rr: number; npl: number; totalAset: number; outstandingKredit: number; totalTabungan?: number; totalDeposito?: number; noaTabungan?: number; noaDeposito?: number; noaTabunganBaru?: number; noaDepositoBaru?: number; labaTahunBerjalan?: number }>>;
  syncDailyBprData: (
    newMetrics: { npl: number; rr: number; outstanding: number; tabungan: number; deposito: number; laba: number },
    ewsTriggers: any[]
  ) => void;

  // Entities
  customers: Customer[];

  grebekPasarCampaigns: GrebekPasarCampaign[];
  creditApplications: CreditApplication[];
  loanFacilities: LoanFacility[];
  collectionCases: CollectionCase[];
  setCollectionCases: React.Dispatch<React.SetStateAction<CollectionCase[]>>;
  ptpRecords: PromiseToPayRecord[];
  restructurings: RestructuringRecord[];
  flowTasks: TaskItem[];
  ewsAlerts: EwsAlert[];
  antiFraudFlags: AntiFraudRedFlag[];
  auditTrail: AuditTrailRecord[];
  attendances: HrAttendanceRecord[];
  employeeScores: EmployeePerformanceScore[];
  notifications: NotificationItem[];
  settings: SystemSettings;
  targetBungaData: AOPendapatanBunga[];
  pencapaianBisnisData: PencapaianBisnisAO[];
  agunanData: AgunanItem[];

  // Modals & Drawers
  selectedCustomerFor360: Customer | null;
  openCustomer360: (customerIdOrCif: string) => void;
  closeCustomer360: () => void;
  isGlobalSearchOpen: boolean;
  setIsGlobalSearchOpen: (open: boolean) => void;
  isAiAssistantOpen: boolean;
  setIsAiAssistantOpen: (open: boolean) => void;

  // Business Action Triggers
  recordAuditLog: (
    module: TaskModule | 'AUTH' | 'SETTINGS' | 'SYSTEM',
    entityType: string,
    entityId: string,
    action: AuditAction,
    newValueSummary: string,
    previousValueSummary?: string
  ) => void;
  addCustomer: (customerData: Partial<Customer>) => Customer;
  createCreditApplication: (appData: Partial<CreditApplication>) => CreditApplication;
  updateCreditAppStage: (appId: string, newStage: import('../types').CreditAppStage, notes?: string, fileUrl?: string, fileName?: string) => void;
  submitSurveyReport: (appId: string, surveyData: any) => void;
  submitCreditAnalysis: (appId: string, analysisData: any) => void;
  decideCreditApproval: (
    appId: string,
    decision: 'APPROVED' | 'REJECTED' | 'CONDITIONAL',
    approvedPlafon: number,
    comment: string,
    conditionNotes?: string
  ) => void;
  disburseCreditFacility: (appId: string) => void;
  recordCollectionVisit: (caseId: string, visitData: { date: string; collectorName: string; gpsLocation: string; outcome: string; nextAction: string; }) => void;
  recordPromiseToPay: (ptpData: Partial<PromiseToPayRecord>) => void;
  updatePtpStatus: (ptpId: string, status: PromiseToPayRecord['status'], brokenReason?: string) => void;
  createFlowTask: (taskData: Partial<TaskItem> & Partial<FlowTaskLegacy>) => void;
  updateTaskStatus: (taskId: string, status: any, progress?: number, evidenceNote?: string) => void;
  resolveEwsAlert: (alertId: string, actionNote: string) => void;
  addEwsAlerts: (alerts: EwsAlert[]) => void;
  runEwsEngine: () => void;
  recordAttendanceCheckIn: (lat: number, lng: number, selfieUrl?: string, fieldNotes?: string) => void;
  updateSettings: (newSettings: Partial<SystemSettings>) => void;
  markNotificationAsRead: (notificationId: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [macroMetrics, setMacroMetrics] = useState(INITIAL_MACRO_METRICS);

  const [selectedBranchId, setSelectedBranchId] = useState<BranchId | 'ALL'>('ALL');
  const [activeModule, setActiveModule] = useState<AppModuleId>('EXECUTIVE_DASHBOARD');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);

  // Initialize auth from token
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setIsAuthLoading(false);
        return;
      }
      try {
        const res = await fetch('/api/auth/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setCurrentUser(data.user);
          setIsAuthenticated(true);
        } else {
          localStorage.removeItem('auth_token');
        }
      } catch (e) {
        console.error('Auth verification failed', e);
      } finally {
        setIsAuthLoading(false);
      }
    };
    initAuth();
  }, []);

  // Sync URL to activeModule
  useEffect(() => {
    for (const group of navigationConfig) {
      for (const item of group.items) {
        if (item.path === location.pathname) {
          if (activeModule !== item.id) {
            setActiveModule(item.id);
          }
          break;
        }
      }
    }
  }, [location.pathname]);

  // Provide a safe wrapper around setActiveModule that also navigates
  const handleSetActiveModule = (mod: AppModuleId) => {
    setActiveModule(mod);
    for (const group of navigationConfig) {
      for (const item of group.items) {
        if (item.id === mod) {
          if (location.pathname !== item.path) {
            navigate(item.path);
          }
          return;
        }
      }
    }
  };

  // Entities state
  const [customers, setCustomers] = useState<Customer[]>(INITIAL_CUSTOMERS);

  const [grebekPasarCampaigns, setGrebekPasarCampaigns] = useState<GrebekPasarCampaign[]>(INITIAL_GREBEK_PASAR_CAMPAIGNS);
  const [creditApplications, setCreditApplications] = useState<CreditApplication[]>(INITIAL_CREDIT_APPLICATIONS);
  const [loanFacilities, setLoanFacilities] = useState<LoanFacility[]>(INITIAL_LOAN_FACILITIES);
  const [collectionCases, setCollectionCases] = useState<CollectionCase[]>(INITIAL_COLLECTION_CASES);
  const [ptpRecords, setPtpRecords] = useState<PromiseToPayRecord[]>(INITIAL_PROMISE_TO_PAY);
  const [restructurings, setRestructurings] = useState<RestructuringRecord[]>(INITIAL_RESTRUCTURING);
  const [flowTasks, setFlowTasks] = useState<TaskItem[]>(INITIAL_TASKS);
  const [ewsAlerts, setEwsAlerts] = useState<EwsAlert[]>(INITIAL_EWS_ALERTS);
  const [antiFraudFlags, setAntiFraudFlags] = useState<AntiFraudRedFlag[]>(INITIAL_ANTI_FRAUD_FLAGS);
  const [auditTrail, setAuditTrail] = useState<AuditTrailRecord[]>(INITIAL_AUDIT_TRAIL);
  const [attendances, setAttendances] = useState<HrAttendanceRecord[]>(INITIAL_ATTENDANCE);
  const [employeeScores, setEmployeeScores] = useState<EmployeePerformanceScore[]>(INITIAL_EMPLOYEE_SCORES);
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [settings, setSettings] = useState<SystemSettings>(INITIAL_SETTINGS);
  
  const [targetBungaData, setTargetBungaData] = useState<AOPendapatanBunga[]>(INITIAL_TARGET_BUNGA_DATA);
  const [pencapaianBisnisData, setPencapaianBisnisData] = useState<PencapaianBisnisAO[]>(INITIAL_PENCAPAIAN_BISNIS_DATA);
  const [agunanData, setAgunanData] = useState<AgunanItem[]>(INITIAL_AGUNAN_DATA);

  // Global modals
  const [selectedCustomerFor360, setSelectedCustomerFor360] = useState<Customer | null>(null);
  const [isGlobalSearchOpen, setIsGlobalSearchOpen] = useState(false);
  const [isAiAssistantOpen, setIsAiAssistantOpen] = useState(false);

  const [rolePermissions, setRolePermissions] = useState<Record<string, string[]>>({});

  const updateRolePermissions = (role: string, perms: string[]) => {
    setRolePermissions(prev => ({
      ...prev,
      [role]: perms
    }));
  };

  // Keyboard shortcut Cmd+K / Ctrl+K for Global Omnisearch
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsGlobalSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const switchUserByRole = (role: UserRole) => {
    const targetUser = INITIAL_USERS.find((u) => u.role === role) || INITIAL_USERS[0];
    setCurrentUser(targetUser);
    
    // Auto-redirect to relevant module based on role
    switch (role) {
      case 'Surveyor': setActiveModule('OTS_SURVEY'); break;
      case 'Analis Kredit': setActiveModule('CREDIT_ANALYSIS'); break;
      case 'Account Officer': setActiveModule('CRM_CUSTOMERS'); break;
      case 'Staff Collection': setActiveModule('COLLECTION_MGMT'); break;
      case 'Pengembangan SDM': setActiveModule('HR_KPI'); break;
      case 'PE Kepatuhan, Manrisk & LK':
      case 'PE Audit Intern & Anti Fraud':
        setActiveModule('EWS_RISK'); break;
      case 'Admin Legal': setActiveModule('LEGAL_DOCS'); break;
      default: setActiveModule('EXECUTIVE_DASHBOARD'); break;
    }

    recordAuditLog(
      'AUTH',
      'USER_SESSION',
      targetUser.id,
      'ROLE_CHANGE',
      `Beralih peran pengguna aktif ke ${targetUser.roleTitle} (${targetUser.name})`
    );
  };

  const recordAuditLog = (
    module: TaskModule | 'AUTH' | 'SETTINGS' | 'SYSTEM',
    entityType: string,
    entityId: string,
    action: AuditAction,
    newValueSummary: string,
    previousValueSummary?: string
  ) => {
    const now = new Date();
    const timeString = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
      now.getDate()
    ).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(
      2,
      '0'
    )}:${String(now.getSeconds()).padStart(2, '0')} WIB`;

    const randomHash = Math.random().toString(36).substring(2, 10).toUpperCase();
    const newRecord: AuditTrailRecord = {
      id: `adt-${Date.now()}`,
      timestamp: timeString,
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      ipAddress: '192.168.1.' + Math.floor(Math.random() * 200 + 10),
      deviceInfo: navigator.userAgent.includes('Mac') ? 'Mac OS / Chrome Browser' : 'Windows 11 / Edge Browser',
      module,
      entityType,
      entityId,
      action,
      previousValueSummary,
      newValueSummary,
      resultStatus: 'SUCCESS',
      immutableHash: `HASH-SHA256-${randomHash}`,
    };

    setAuditTrail((prev) => [newRecord, ...prev]);
  };

  const openCustomer360 = (customerIdOrCif: string) => {
    const cust = customers.find(
      (c) => c.id === customerIdOrCif || c.cif === customerIdOrCif || c.name.toLowerCase().includes(customerIdOrCif.toLowerCase())
    );
    if (cust) {
      setSelectedCustomerFor360(cust);
    }
  };

  const closeCustomer360 = () => {
    setSelectedCustomerFor360(null);
  };

  const addCustomer = (customerData: Partial<Customer>): Customer => {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const newCif = `CIF-0${randomNum}`;
    const newCust: Customer = {
      id: `cst-${Date.now()}`,
      cif: newCif,
      nik: customerData.nik || '3404000000000001',
      name: customerData.name || 'Nasabah Baru',
      motherMaidenName: customerData.motherMaidenName || 'Ibu Kandung',
      phone: customerData.phone || '081234567890',
      email: customerData.email || 'nasabah@bprara.co.id',
      dateOfBirth: customerData.dateOfBirth || '1990-01-01',
      gender: customerData.gender || 'L',
      maritalStatus: customerData.maritalStatus || 'MENIKAH',
      address: customerData.address || 'Yogyakarta',
      rtRw: customerData.rtRw || '01/01',
      kelurahan: customerData.kelurahan || 'Kelurahan',
      kecamatan: customerData.kecamatan || 'Kecamatan',
      city: customerData.city || 'Matesih',
      occupation: customerData.occupation || 'Wiraswasta',
      businessName: customerData.businessName,
      businessType: customerData.businessType,
      businessYears: customerData.businessYears || 3,
      monthlyIncome: customerData.monthlyIncome || 25000000,
      monthlyExpenses: customerData.monthlyExpenses || 12000000,
      branchId: customerData.branchId || currentUser.branchId,
      accountOfficerId: currentUser.id,
      accountOfficerName: currentUser.name,
      segment: customerData.segment || 'UMKM_MIKRO',
      riskRating: 'LOW',
      currentCollectibility: 'KOL_1',
      totalFundingBalance: 0,
      totalCreditOutstanding: 0,
      fraudAlertFlag: false,
      createdAt: new Date().toISOString().split('T')[0],
      relatedParties: customerData.relatedParties || [],
      emergencyContacts: customerData.emergencyContacts || [],
      documents: customerData.documents || [],
      timeline: [
        {
          id: `tl-${Date.now()}`,
          timestamp: 'Baru saja',
          module: 'CRM',
          actor: currentUser.name,
          action: 'Pendaftaran CIF Nasabah Baru',
          details: `Pembukaan data master CIF ${newCif} terverifikasi e-KTP.`,
          iconType: 'document',
        },
      ],
    };

    setCustomers((prev) => [newCust, ...prev]);

    recordAuditLog(
      'CRM',
      'CUSTOMER',
      newCust.id,
      'CREATE',
      `Pendaftaran Nasabah Baru ${newCust.name} (CIF: ${newCust.cif})`
    );

    return newCust;
  };


  const createCreditApplication = (appData: Partial<CreditApplication>): CreditApplication => {
    const randomAppNo = `LOS-ARA-2026-08-${String(Math.floor(100 + Math.random() * 900))}`;
    const newApp: CreditApplication = {
      id: `app-${Date.now()}`,
      applicationNumber: randomAppNo,
      cif: appData.cif || 'CIF-00892',
      customerName: appData.customerName || 'Pemohon Kredit',
      phone: appData.phone || '08123456789',
      branchId: appData.branchId || currentUser.branchId,
      productType: appData.productType || 'KREDIT_MODAL_KERJA_MIKRO',
      requestedPlafon: appData.requestedPlafon || 150000000,
      requestedTenorMonths: appData.requestedTenorMonths || 36,
      interestRate: appData.interestRate,
      purpose: appData.purpose || 'MODAL_KERJA',
      purposeDetails: appData.purposeDetails || 'Tambahan modal kerja usaha.',
      maritalStatus: appData.maritalStatus,
      motherName: appData.motherName,
      spouseName: appData.spouseName,
      address: appData.address,
      rtRw: appData.rtRw,
      kelurahan: appData.kelurahan,
      kecamatan: appData.kecamatan,
      kabupaten: appData.kabupaten,
      creditType: appData.creditType,
      debtorStatus: appData.debtorStatus,
      accountOfficerId: currentUser.id,
      accountOfficerName: currentUser.name,
      currentStage: 'VERIFICATION',
      slaDeadline: '2026-08-25 17:00 WIB',
      slaExceeded: false,
      collaterals: appData.collaterals || [],
      approvals: [],
      legalReviewPassed: false,
      documents: appData.documents || [],
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    };

    setCreditApplications((prev) => [newApp, ...prev]);

    // Create automatic task for OTS Survey and SLIK checking
    createFlowTask({
      title: `Survey OTS Agunan & Usaha: ${newApp.customerName}`,
      description: `Lakukan kunjungan survey on the spot (OTS), ambil GPS, foto usaha, foto agunan, dan wawancara lingkungan.`,
      module: 'SURVEY',
      entityType: 'CREDIT_APP',
      entityId: newApp.id,
      entityReference: `${newApp.applicationNumber} - ${newApp.customerName}`,
      ownerRole: 'Surveyor',
      priority: 'HIGH',
      deadline: '2026-08-24 16:00 WIB',
    });

    recordAuditLog(
      'LOS',
      'CREDIT_APP',
      newApp.id,
      'CREATE',
      `Pengajuan Pinjaman Baru ${newApp.applicationNumber} (${newApp.customerName}) Plafon Rp ${newApp.requestedPlafon.toLocaleString(
        'id-ID'
      )}`
    );

    return newApp;
  };

  const updateCreditAppStage = (appId: string, newStage: CreditAppStage, notes?: string, fileUrl?: string, fileName?: string) => {
    setCreditApplications((prev) =>
      prev.map((app) => {
        if (app.id === appId) {
          const newDoc = fileUrl ? {
            id: `doc-${Date.now()}`,
            name: fileName || `Lampiran_${newStage}.pdf`,
            type: newStage,
            url: fileUrl,
            uploadedBy: currentUser.name,
            uploadedAt: new Date().toISOString(),
            stage: app.currentStage
          } : null;
          
          const updated = { 
            ...app, 
            currentStage: newStage,
            documents: newDoc ? [...(app.documents || []), newDoc] : (app.documents || [])
          };
          if (notes) {
            if (newStage === 'REJECTED') {
              updated.rejectionReason = notes;
            } else {
              updated.revisionNotes = notes;
            }
          }
          recordAuditLog(
            'CRM',
            'CREDIT_APP',
            app.id,
            'UPDATE',
            `Status aplikasi diubah ke ${newStage}${updated.revisionNotes ? ` dengan catatan: ${updated.revisionNotes}` : ''}`
          );
          return updated;
        }
        return app;
      })
    );
  };

  const submitSurveyReport = (appId: string, surveyData: any) => {
    setCreditApplications((prev) =>
      prev.map((app) => {
        if (app.id === appId) {
          const updated: CreditApplication = {
            ...app,
            survey: {
              id: `srv-${Date.now()}`,
              applicationId: appId,
              surveyorId: currentUser.id,
              surveyorName: currentUser.name,
              scheduledDate: new Date().toISOString().split('T')[0],
              conductedDate: '2026-08-21 10:30 WIB',
              status: 'COMPLETED',
              gpsLatitude: surveyData.gpsLatitude || -7.753821,
              gpsLongitude: surveyData.gpsLongitude || 110.391204,
              gpsAccuracyMeters: 3.8,
              locationAddress: surveyData.locationAddress || 'Yogyakarta',
              houseOwnership: surveyData.houseOwnership || 'MILIK_SENDIRI',
              residenceCondition: surveyData.residenceCondition || 'BAIK',
              businessCondition: surveyData.businessCondition || 'AKTIF_RAMAI',
              accessRoadWidth: surveyData.accessRoadWidth || 6,
              neighborhoodCharacterNotes: surveyData.neighborhoodCharacterNotes || 'Warga mengenal baik debitur.',
              neighborIntervieweeName: surveyData.neighborIntervieweeName || 'Ketua RT Setempat',
              neighborIntervieweeRelation: 'Tetangga',
              neighborFeedback: surveyData.neighborFeedback || 'POSITIF',
              photos: surveyData.photos || [
                {
                  id: 'p-new',
                  label: 'Foto Agunan & Usaha OTS',
                  url: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=500&auto=format&fit=crop&q=80',
                  timestamp: 'Baru saja',
                  gpsTag: '-7.753821, 110.391204',
                },
              ],
              surveyorSummary: surveyData.surveyorSummary || 'Usaha berjalan aktif dan agunan riil.',
              surveyScore: surveyData.surveyScore || 88,
            },
            currentStage: 'ANALYSIS',
            updatedAt: new Date().toISOString().split('T')[0],
          };

          recordAuditLog(
            'SURVEY',
            'CREDIT_APP',
            app.id,
            'UPLOAD',
            `Laporan Survey OTS Selesai untuk ${app.customerName} (Skor: ${updated.survey?.surveyScore})`
          );

          // Create next task for Analyst
          createFlowTask({
            title: `Analisis Kredit 5C: ${app.customerName}`,
            description: `Lakukan analisis kelayakan keuangan, cashflow DSCR, dan rekomendasi plafon.`,
            module: 'ANALYSIS',
            entityType: 'CREDIT_APP',
            entityId: app.id,
            entityReference: `${app.applicationNumber} - ${app.customerName}`,
            ownerRole: 'Analis Kredit',
            priority: 'HIGH',
            deadline: '2026-08-24 17:00 WIB',
          });

          return updated;
        }
        return app;
      })
    );
  };

  const submitCreditAnalysis = (appId: string, analysisData: any) => {
    setCreditApplications((prev) =>
      prev.map((app) => {
        if (app.id === appId) {
          const updated: CreditApplication = {
            ...app,
            analysis: {
              id: `anl-${Date.now()}`,
              applicationId: appId,
              analystId: currentUser.id,
              analystName: currentUser.name,
              analyzedAt: '2026-08-21 11:45 WIB',
              characterScore: analysisData.characterScore || 88,
              characterNotes: analysisData.characterNotes || 'Karakter kooperatif dan itikad baik tinggi.',
              capacityScore: analysisData.capacityScore || 86,
              capacityNotes: analysisData.capacityNotes || 'Cashflow mencukupi angsuran.',
              capitalScore: analysisData.capitalScore || 85,
              capitalNotes: analysisData.capitalNotes || 'Modal sendiri kuat.',
              collateralScore: analysisData.collateralScore || 90,
              collateralNotes: analysisData.collateralNotes || 'Agunan SHM legalitas bersih.',
              conditionScore: analysisData.conditionScore || 85,
              conditionNotes: analysisData.conditionNotes || 'Prospek usaha stabil.',
              grossMonthlyRevenue: analysisData.grossMonthlyRevenue || 60000000,
              operationalCost: analysisData.operationalCost || 30000000,
              livingCost: analysisData.livingCost || 12000000,
              netDisposableIncome: analysisData.netDisposableIncome || 18000000,
              proposedInstallment: analysisData.proposedInstallment || 5800000,
              existingDebtInstallments: 0,
              totalObligations: analysisData.proposedInstallment || 5800000,
              dscrRatio: analysisData.dscrRatio || 2.4,
              idiIndexPercent: 32.2,
              aiRiskAssessment: 'Tingkat risiko: RENDAH. Kapasitas pengembalian teruji.',
              aiSuggestedPlafon: app.requestedPlafon,
              analystRecommendation: 'RECOMMENDED_APPROVE',
              proposedPlafon: analysisData.proposedPlafon || app.requestedPlafon,
              proposedTenorMonths: analysisData.proposedTenorMonths || app.requestedTenorMonths,
              proposedInterestRate: 14.5,
              proposedProvisionPercent: 1.0,
              analystSummary: analysisData.analystSummary || 'Layak disetujui dengan pengikatan APHT.',
            },
            currentStage: 'CREDIT_COMMITTEE',
            updatedAt: new Date().toISOString().split('T')[0],
          };

          recordAuditLog(
            'ANALYSIS',
            'CREDIT_APP',
            app.id,
            'APPROVE',
            `Analisis Kredit Selesai: Rekomendasi Disetujui Plafon Rp ${(analysisData.proposedPlafon || app.requestedPlafon).toLocaleString('id-ID')}`
          );

          // Task for Approval
          createFlowTask({
            title: `Persetujuan Komite Kredit: ${app.customerName}`,
            description: `Review berkas LOS dan berikan keputusan pemutusan kredit.`,
            module: 'APPROVAL',
            entityType: 'CREDIT_APP',
            entityId: app.id,
            entityReference: `${app.applicationNumber} - ${app.customerName}`,
            ownerRole: 'Kepala Cabang',
            priority: 'URGENT',
            deadline: '2026-08-23 12:00 WIB',
          });

          return updated;
        }
        return app;
      })
    );
  };

  const decideCreditApproval = (
    appId: string,
    decision: 'APPROVED' | 'REJECTED' | 'CONDITIONAL',
    approvedPlafon: number,
    comment: string,
    conditionNotes?: string
  ) => {
    setCreditApplications((prev) =>
      prev.map((app) => {
        if (app.id === appId) {
          const newApproval = {
            id: `apr-${Date.now()}`,
            applicationId: appId,
            approverId: currentUser.id,
            approverName: currentUser.name,
            approverRole: currentUser.role,
            approverRoleTitle: currentUser.roleTitle,
            approvalLevel:
              currentUser.role === 'Kepala Cabang'
                ? ('Kepala Cabang' as const)
                : currentUser.role === 'Direktur Utama' || currentUser.role === 'Direktur YMFK'
                ? ('DIREKSI' as const)
                : ('KOMITE_KREDIT' as const),
            authorityLimit: currentUser.approvalLimit,
            decision,
            approvedPlafon,
            approvedTenor: app.requestedTenorMonths,
            approvedRate: 14.5,
            conditionNotes,
            comment,
            digitalSignatureHash: `SIG-${currentUser.id}-SHA256-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
            decidedAt: 'Baru saja',
          };

          const nextStage = decision === 'APPROVED' || decision === 'CONDITIONAL' ? 'APPROVED' : 'REJECTED';

          const updated: CreditApplication = {
            ...app,
            currentStage: nextStage,
            approvals: [...app.approvals, newApproval],
            updatedAt: new Date().toISOString().split('T')[0],
          };

          recordAuditLog(
            'APPROVAL',
            'CREDIT_APP',
            app.id,
            decision === 'APPROVED' ? 'APPROVE' : 'REJECT',
            `Keputusan Pemutus Kredit (${currentUser.roleTitle}): ${decision} - Plafon Rp ${approvedPlafon.toLocaleString(
              'id-ID'
            )} (Catatan: ${comment})`
          );

          if (decision === 'APPROVED' || decision === 'CONDITIONAL') {
            createFlowTask({
              title: `Penyusunan Perjanjian Kredit (Akad) & APHT: ${app.customerName}`,
              description: `Siapkan draf PK, koordinasi tanda tangan notaris, dan verifikasi syarat pencairan.`,
              module: 'LEGAL',
              entityType: 'CREDIT_APP',
              entityId: app.id,
              entityReference: `${app.applicationNumber} - ${app.customerName}`,
              ownerRole: 'Admin Legal',
              priority: 'HIGH',
              deadline: '2026-08-25 15:00 WIB',
            });
          }

          return updated;
        }
        return app;
      })
    );
  };

  const disburseCreditFacility = (appId: string) => {
    const targetApp = creditApplications.find((a) => a.id === appId);
    if (!targetApp) return;

    const newFacNo = `FAC-ARA-2026-${String(Math.floor(1000 + Math.random() * 9000))}`;
    const newAccNo = `KRD-00${targetApp.branchId === 'KC_PUSAT' ? '1' : '2'}-${String(Math.floor(10000 + Math.random() * 90000))}`;
    const approvedPlafon =
      targetApp.approvals.length > 0 ? targetApp.approvals[targetApp.approvals.length - 1].approvedPlafon : targetApp.requestedPlafon;

    const monthlyInstallment = Math.round(
      approvedPlafon / targetApp.requestedTenorMonths + (approvedPlafon * 0.145) / 12
    );

    const newFacility: LoanFacility = {
      id: `fac-${Date.now()}`,
      facilityNumber: newFacNo,
      accountNumber: newAccNo,
      cif: targetApp.cif,
      customerName: targetApp.customerName,
      phone: targetApp.phone,
      branchId: targetApp.branchId,
      productType: targetApp.productType,
      originalPlafon: approvedPlafon,
      outstandingPrincipal: approvedPlafon,
      tenorMonths: targetApp.requestedTenorMonths,
      interestRateAnnual: 14.5,
      monthlyInstallment,
      disbursementDate: new Date().toISOString().split('T')[0],
      maturityDate: '2029-08-21',
      collectibility: 'KOL_1',
      dpdDays: 0,
      lastPaymentDate: '-',
      nextDueDate: '2026-09-21',
      unpaidInstallmentsCount: 0,
      overdueAmount: 0,
      accountOfficerId: targetApp.accountOfficerId,
      status: 'ACTIVE',
    };

    setLoanFacilities((prev) => [newFacility, ...prev]);

    setCreditApplications((prev) =>
      prev.map((a) =>
        a.id === appId
          ? {
              ...a,
              currentStage: 'DISBURSED',
              disbursedFacilityId: newFacility.id,
              updatedAt: new Date().toISOString().split('T')[0],
            }
          : a
      )
    );

    // Update customer credit outstanding & timeline
    setCustomers((prev) =>
      prev.map((c) =>
        c.cif === targetApp.cif
          ? {
              ...c,
              totalCreditOutstanding: c.totalCreditOutstanding + approvedPlafon,
              timeline: [
                {
                  id: `tl-${Date.now()}`,
                  timestamp: 'Baru saja',
                  module: 'LOS',
                  actor: currentUser.name,
                  action: 'Pencairan Fasilitas Kredit',
                  details: `Pencairan dana Rp ${approvedPlafon.toLocaleString('id-ID')} (${newFacNo}) sukses dikreditkan.`,
                  iconType: 'credit',
                },
                ...c.timeline,
              ],
            }
          : c
      )
    );

    recordAuditLog(
      'LOS',
      'FACILITY',
      newFacility.id,
      'DISBURSE',
      `Pencairan Kredit Baru ${newFacNo} sebesar Rp ${approvedPlafon.toLocaleString('id-ID')} ke rekening debitur ${targetApp.customerName}`
    );
  };

  const syncDailyBprData = (
    newMetrics: { npl: number; rr: number; outstanding: number; tabungan: number; deposito: number; laba: number; noaTabungan?: number; noaDeposito?: number; noaTabunganBaru?: number; noaDepositoBaru?: number; },
    ewsTriggers: any[]
  ) => {
    // 1. Update Macro Metrics
    setMacroMetrics(prev => ({
      ...prev,
      npl: newMetrics.npl,
      rr: newMetrics.rr,
      outstandingKredit: newMetrics.outstanding,
      totalTabungan: newMetrics.tabungan,
      totalDeposito: newMetrics.deposito,
      labaTahunBerjalan: newMetrics.laba,
      noaTabungan: newMetrics.noaTabungan || prev.noaTabungan,
      noaDeposito: newMetrics.noaDeposito || prev.noaDeposito,
      noaTabunganBaru: newMetrics.noaTabunganBaru || prev.noaTabunganBaru,
      noaDepositoBaru: newMetrics.noaDepositoBaru || prev.noaDepositoBaru,
    }));

    // 2. Generate new EWS Alerts dynamically based on uploaded data aji 2.xls simulation
    if (ewsTriggers && ewsTriggers.length > 0) {
      const newAlerts: EwsAlert[] = ewsTriggers.map((t, idx) => ({
        id: `ews-sync-${Date.now()}-${idx}`,
        alertCode: `EWS-KOL-${t.from}-${t.to}`,
        module: 'EWS',
        category: 'CREDIT_QUALITY',
        severity: t.to === 'KL' ? 'RED' : 'YELLOW',
        title: `Indikasi Penurunan Kol: ${t.customerName}`,
        description: `Upload Laporan (data aji 2): Debitur ${t.customerName} tidak terdapat angsuran masuk bulan ini. Status terindikasi turun dari ${t.from} menjadi ${t.to}.`,
        triggeredAt: new Date().toISOString(),
        entityType: 'LOAN_FACILITY',
        entityId: `fac-sync-${Date.now()}-${idx}`,
        entityReference: t.customerName,
        branchId: 'KC_PUSAT',
        status: 'ACTION_REQUIRED'
      }));

      setEwsAlerts(prev => [...newAlerts, ...prev]);
    }

    recordAuditLog(
      'SYSTEM',
      'SYNC',
      'sync-daily-01',
      'UPLOAD',
      `Berhasil upload & sinkronisasi 6 File Laporan Harian CBS. NPL: ${newMetrics.npl}%, Laba: Rp ${newMetrics.laba.toLocaleString('id-ID')}`
    );
  };

  const recordCollectionVisit = (caseId: string, visitData: { date: string; collectorName: string; gpsLocation: string; outcome: string; nextAction: string; }) => {
    setCollectionCases(prev => prev.map(c => {
      if (c.id === caseId) {
        return {
          ...c,
          visitHistory: [
            {
              id: `visit-${Date.now()}`,
              ...visitData
            },
            ...c.visitHistory
          ]
        };
      }
      return c;
    }));
  };

  const recordPromiseToPay = (ptpData: Partial<PromiseToPayRecord>) => {
    const newPtp: PromiseToPayRecord = {
      id: `ptp-${Date.now()}`,
      caseId: ptpData.caseId || 'col-case-001',
      facilityId: ptpData.facilityId || 'fac-002',
      cif: ptpData.cif || 'CIF-01204',
      debtorName: ptpData.debtorName || 'Debitur',
      collectorId: currentUser.id,
      collectorName: currentUser.name,
      promiseDate: ptpData.promiseDate || '2026-08-26',
      promisedAmount: ptpData.promisedAmount || 15000000,
      status: 'PROMISED',
      escalatedToLegal: false,
      notes: ptpData.notes || 'Hasil negosiasi penagihan lapangan.',
      createdAt: new Date().toISOString().split('T')[0],
    };

    setPtpRecords((prev) => [newPtp, ...prev]);

    // Create task for follow-up on promise date
    createFlowTask({
      title: `Follow-up Janji Bayar: ${newPtp.debtorName} (Rp ${newPtp.promisedAmount.toLocaleString('id-ID')})`,
      description: `Pastikan dana masuk pada tanggal janji bayar ${newPtp.promiseDate}.`,
      module: 'COLLECTION',
      entityType: 'FACILITY',
      entityId: newPtp.facilityId,
      entityReference: `${newPtp.cif} - ${newPtp.debtorName}`,
      ownerRole: 'Staff Collection',
      priority: 'HIGH',
      deadline: `${newPtp.promiseDate} 15:00 WIB`,
    });

    recordAuditLog(
      'COLLECTION',
      'FACILITY',
      newPtp.facilityId,
      'CREATE',
      `Pencatatan Janji Bayar (PTP) Debitur ${newPtp.debtorName} senilai Rp ${newPtp.promisedAmount.toLocaleString(
        'id-ID'
      )} tanggal ${newPtp.promiseDate}`
    );
  };

  const updatePtpStatus = (ptpId: string, status: PromiseToPayRecord['status'], brokenReason?: string) => {
    setPtpRecords((prev) =>
      prev.map((ptp) => {
        if (ptp.id === ptpId) {
          const updated = {
            ...ptp,
            status,
            brokenReason,
            actualPaymentDate: status === 'PAID' ? new Date().toISOString().split('T')[0] : undefined,
            actualPaidAmount: status === 'PAID' ? ptp.promisedAmount : undefined,
          };

          recordAuditLog(
            'COLLECTION',
            'FACILITY',
            ptp.facilityId,
            'UPDATE',
            `Update Status PTP ${ptp.debtorName}: ${ptp.status} -> ${status} ${brokenReason ? `(Alasan: ${brokenReason})` : ''}`
          );

          if (status === 'BROKEN') {
            // Trigger Red EWS Alert
            const newAlert: EwsAlert = {
              id: `ews-${Date.now()}`,
              alertCode: `EWS-PTP-${Date.now().toString().slice(-4)}`,
              category: 'BROKEN_PTP',
              severity: 'RED',
              title: `Ingkar Janji Bayar (Broken PTP): ${ptp.debtorName}`,
              description: `Debitur gagal memenuhi komitmen pelunasan Rp ${ptp.promisedAmount.toLocaleString(
                'id-ID'
              )} pada ${ptp.promiseDate}. ${brokenReason || ''}`,
              module: 'COLLECTION',
              entityType: 'FACILITY',
              entityId: ptp.facilityId,
              entityReference: `${ptp.cif} - ${ptp.debtorName}`,
              branchId: 'KC_MATESIH',
              triggeredAt: 'Baru saja',
              status: 'ACTION_REQUIRED',
              assignedToId: currentUser.id,
              assignedToName: currentUser.name,
            };
            setEwsAlerts((a) => [newAlert, ...a]);
          }

          return updated;
        }
        return ptp;
      })
    );
  };

  const createFlowTask = (taskData: Partial<TaskItem> & Partial<FlowTaskLegacy>) => {
    const newTask: TaskItem = {
      id: Date.now().toString(),
      taskId: taskData.taskId || `T-${Date.now().toString(36).toUpperCase()}`,
      parentCaseId: taskData.parentCaseId || 'CASE-AUTO',
      unit: taskData.unit || 'BIS',
      pic: taskData.pic || taskData.ownerName || taskData.assignedTo || currentUser?.name || 'User',
      assignedTo: taskData.assignedTo || taskData.ownerName || taskData.pic || currentUser?.name || 'User',
      tanggal: taskData.tanggal || new Date().toISOString().split('T')[0],
      deskripsiTugas: taskData.deskripsiTugas || (taskData.title ? `${taskData.title} - ${taskData.entityReference || ''}` : 'Tugas Baru'),
      jenisTeknis: taskData.jenisTeknis || 'Rutinitas Harian',
      timeline: taskData.timeline || 'Harian',
      arahanAtasan: taskData.arahanAtasan || taskData.description || '-',
      arahanAtasanUtama: taskData.arahanAtasanUtama || '',
      prioritas: taskData.prioritas || 'P1',
      status: taskData.status || 'Planned',
      penyelesaian: taskData.penyelesaian || '',
      evidenceId: taskData.evidenceId,
      tanggalFU: taskData.tanggalFU || taskData.deadline || '',
      validator: taskData.validator,
      outputDoD: taskData.outputDoD,
      outcome: taskData.outcome,
      category: taskData.category,
      subcategory: taskData.subcategory,
      beisLevel: taskData.beisLevel,
      beisDomain: taskData.beisDomain,
      beisCategory: taskData.beisCategory,
      mentions: taskData.mentions,
      syncedToCalendar: taskData.syncedToCalendar,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setFlowTasks((prev) => [newTask, ...prev]);

    if (taskData.mentions && taskData.mentions.length > 0) {
      const newNotifs = taskData.mentions.map((roleId, index) => ({
        id: `notif-mention-${Date.now()}-${index}`,
        timestamp: new Date().toISOString(),
        userId: roleId,
        title: 'Undangan / Mention Agenda Baru',
        message: `Divisi ${roleId} telah di-mention sebagai peserta dalam agenda: "${taskData.deskripsiTugas || taskData.title}"`,
        module: 'SYSTEM' as const,
        read: false,
        priority: 'NORMAL' as const
      }));
      setNotifications(prev => [...newNotifs, ...prev]);
    }

    recordAuditLog(
      taskData.module || 'SYSTEM',
      taskData.entityType || 'SYSTEM',
      taskData.entityId || '-',
      'CREATE',
      `Pembuatan Tugas Baru: "${taskData.deskripsiTugas || taskData.title}" untuk ${taskData.pic || taskData.ownerName}`
    );
  };

  const updateTaskStatus = (taskId: string, status: any, progress?: number, evidenceNote?: string) => {
    setFlowTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const updated = {
            ...t,
            status,
            penyelesaian: evidenceNote || t.penyelesaian,
            updatedAt: new Date().toISOString()
          };

          recordAuditLog(
            'SYSTEM',
            'SYSTEM',
            '-',
            'UPDATE',
            `Update Status Tugas "${t.deskripsiTugas}": ${t.status} -> ${status}`
          );

          return updated;
        }
        return t;
      })
    );
  };
  const runEwsEngine = () => {
    const newAlerts: EwsAlert[] = [];
    const nowStr = new Date().toISOString().split('T')[0] + ' 10:00 WIB';

    // Rule 1: SLA Approval Exceeded
    creditApplications.forEach(app => {
      if (app.currentStage === 'CREDIT_COMMITTEE' && app.slaExceeded) {
        const existingAlert = ewsAlerts.find(a => a.entityId === app.id && a.category === 'APPROVAL_SLA');
        if (!existingAlert) {
          newAlerts.push({
            id: `ews-sla-${Date.now()}-${app.id}`,
            alertCode: `EWS-SLA-08-${Math.floor(100+Math.random()*900)}`,
            category: 'APPROVAL_SLA',
            severity: 'YELLOW',
            title: 'Pelanggaran SLA Approval Kredit (>48 Jam)',
            description: `Aplikasi kredit ${app.applicationNumber} a/n ${app.customerName} tertahan di status persetujuan melebihi batas SLA.`,
            module: 'LOS',
            entityType: 'CREDIT_APP',
            entityId: app.id,
            entityReference: `${app.applicationNumber} - ${app.customerName}`,
            branchId: app.branchId,
            triggeredAt: nowStr,
            status: 'ACTION_REQUIRED',
            assignedToId: 'usr-005', // Assumed KC or Compliance
            assignedToName: 'Sistem Otomatis',
          });
        }
      }
    });

    // Rule 2: Broken PTP (Promise to Pay)
    ptpRecords.forEach(ptp => {
      if (ptp.status === 'BROKEN') {
        const existingAlert = ewsAlerts.find(a => a.entityId === ptp.id && a.category === 'CREDIT_QUALITY');
        if (!existingAlert) {
          newAlerts.push({
            id: `ews-ptp-${Date.now()}-${ptp.id}`,
            alertCode: `EWS-CRD-08-${Math.floor(100+Math.random()*900)}`,
            category: 'CREDIT_QUALITY',
            severity: 'RED',
            title: 'Janji Bayar (PTP) Diingkari',
            description: `Nasabah mengingkari janji bayar pada tanggal ${ptp.promiseDate} sebesar Rp ${ptp.promisedAmount.toLocaleString('id-ID')}. Potensi lonjakan DPD.`,
            module: 'COLLECTION',
            entityType: 'COLLECTION_CASE',
            entityId: ptp.caseId,
            entityReference: `PTP: ${ptp.promiseDate}`,
            branchId: currentUser.branchId,
            triggeredAt: nowStr,
            status: 'ACTION_REQUIRED',
            assignedToId: 'usr-012',
            assignedToName: 'Sistem Otomatis',
          });
        }
      }
    });

    if (newAlerts.length > 0) {
      setEwsAlerts(prev => [...newAlerts, ...prev]);
      const newNotifs: NotificationItem[] = newAlerts.map(a => ({
        id: `notif-${a.id}`,
        timestamp: a.triggeredAt,
        userId: 'system',
        title: a.title,
        message: a.description,
        module: a.module,
        entityType: a.entityType,
        entityId: a.entityId,
        read: false,
        priority: a.severity === 'RED' ? 'URGENT' : 'HIGH'
      }));
      setNotifications(prev => [...newNotifs, ...prev]);
      
      recordAuditLog(
        'SYSTEM',
        'EWS_ENGINE',
        'system',
        'CREATE',
        `EWS Engine mendeteksi ${newAlerts.length} anomali baru.`
      );
    }
  };
  const addEwsAlerts = (newAlerts: EwsAlert[]) => {
    setEwsAlerts((prev) => [...newAlerts, ...prev]);
  };

  const resolveEwsAlert = (alertId: string, actionNote: string) => {
    setEwsAlerts((prev) =>
      prev.map((a) => {
        if (a.id === alertId) {
          const updated = {
            ...a,
            status: 'RESOLVED' as const,
            resolutionAction: actionNote,
            resolvedAt: 'Baru saja',
          };

          recordAuditLog(
            a.module,
            'EWS_ALERT',
            a.id,
            'UPDATE',
            `Penyelesaian Peringatan Dini EWS (${a.alertCode}): ${actionNote}`
          );

          return updated;
        }
        return a;
      })
    );
  };

  const recordAttendanceCheckIn = (lat: number, lng: number, selfieUrl?: string, fieldNotes?: string) => {
    const isWithinRadius = Math.abs(lat - -7.7956) < 0.01 && Math.abs(lng - 110.3658) < 0.01;
    const distanceMeters = isWithinRadius ? 35 : 2400;

    const newAtt: HrAttendanceRecord = {
      id: `att-${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.name,
      roleTitle: currentUser.roleTitle,
      branchId: currentUser.branchId,
      date: new Date().toISOString().split('T')[0],
      checkInTime: 'Baru saja',
      gpsLatitude: lat,
      gpsLongitude: lng,
      distanceFromBranchMeters: distanceMeters,
      isWithinRadius,
      selfieUrl:
        selfieUrl ||
        currentUser.avatar ||
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      status: isWithinRadius ? 'ON_TIME' : 'FIELD_DUTY',
      fieldDutyNotes: fieldNotes,
    };

    setAttendances((prev) => [newAtt, ...prev]);

    recordAuditLog(
      'HR',
      'HR_ATTENDANCE',
      newAtt.id,
      'CREATE',
      `Presensi Masuk ${currentUser.name} (${newAtt.checkInTime}) - GPS: ${lat.toFixed(5)}, ${lng.toFixed(5)} (${
        isWithinRadius ? 'Dalam Radius Kantor' : 'Tugas Luar / Field Duty'
      })`
    );

    if (!isWithinRadius && !fieldNotes) {
      // Create Yellow EWS Alert if far without field duty notes
      const newAlert: EwsAlert = {
        id: `ews-${Date.now()}`,
        alertCode: `EWS-GPS-${Date.now().toString().slice(-4)}`,
        category: 'ATTENDANCE_GPS',
        severity: 'YELLOW',
        title: `Presensi di Luar Radius Cabang (${distanceMeters}m)`,
        description: `Pegawai ${currentUser.name} melakukan check-in di luar radius toleransi tanpa keterangan tugas luar.`,
        module: 'HR',
        entityType: 'HR_ATTENDANCE',
        entityId: newAtt.id,
        entityReference: `${currentUser.nip} - ${currentUser.name}`,
        branchId: currentUser.branchId,
        triggeredAt: 'Baru saja',
        status: 'REVIEW',
      };
      setEwsAlerts((a) => [newAlert, ...a]);
    }
  };

  const updateSettings = (newSettings: Partial<SystemSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      recordAuditLog(
        'SETTINGS',
        'SYSTEM_SETTINGS',
        'cfg-001',
        'SETTING_CHANGE',
        `Pembaruan Pengaturan Parameter Sistem & Limit Wewenang Pemutus Kredit`
      );
      return updated;
    });
  };

  const markNotificationAsRead = (notificationId: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n)));
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        switchUserByRole,
        rolePermissions,
        updateRolePermissions,
        allUsers: INITIAL_USERS,
        branches: INITIAL_BRANCHES,
        selectedBranchId,
        setSelectedBranchId,
        activeModule,
        setActiveModule: handleSetActiveModule,
        isAuthenticated,
        setIsAuthenticated,
        isAuthLoading,
        macroMetrics,
        setMacroMetrics,
        syncDailyBprData,
        customers,
        grebekPasarCampaigns,
        creditApplications,
        loanFacilities,
        collectionCases,
        setCollectionCases,
        ptpRecords,
        restructurings,
        flowTasks,
        ewsAlerts,
        antiFraudFlags,
        auditTrail,
        attendances,
        employeeScores,
        notifications,
        settings,
        targetBungaData,
        pencapaianBisnisData,
        agunanData,
        selectedCustomerFor360,
        openCustomer360,
        closeCustomer360,
        isGlobalSearchOpen,
        setIsGlobalSearchOpen,
        isAiAssistantOpen,
        setIsAiAssistantOpen,
        recordAuditLog,
        addCustomer,
        createCreditApplication,
        updateCreditAppStage,
        submitSurveyReport,
        submitCreditAnalysis,
        decideCreditApproval,
        disburseCreditFacility,
        recordPromiseToPay,
        updatePtpStatus,
        createFlowTask,
        updateTaskStatus,
        resolveEwsAlert,
        addEwsAlerts,
        runEwsEngine,
        recordAttendanceCheckIn,
        updateSettings,
        markNotificationAsRead,
        recordCollectionVisit,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
