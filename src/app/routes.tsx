import React, { Suspense } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { firstAccessibleRoute, isPathAllowed } from '../utils/access';
import { isNativeApp, RUTE_AWAL_MOBILE } from '../utils/platform';

/*
 * Kerangka yang selalu dibutuhkan begitu aplikasi menyala. Ketiganya tetap
 * diimpor statis: memecahnya hanya menambah satu putaran tunggu sebelum layar
 * pertama bisa digambar.
 */
import { AppShell } from '../components/layout/AppShell';
import { LoginScreen } from '../components/LoginScreen';
import { MobileLayout } from '../components/mobile/MobileLayout';

/**
 * Seluruh modul dimuat saat rutenya dibuka, bukan saat aplikasi menyala.
 *
 * Sebelumnya keempat puluh modul diimpor statis di berkas ini, web dan mobile
 * sekaligus. Akibatnya semuanya menyatu menjadi satu berkas 1.995 kB — 533 kB
 * setelah dimampatkan — yang harus selesai diunduh dan diurai sebelum piksel
 * pertama muncul. Seorang penagih yang membuka layar absensi di ponsel ikut
 * menunggu dashboard eksekutif, seluruh pipeline kredit, data geografis peta
 * sebaran, dan dua belas layar mobile yang tidak akan pernah ia buka.
 *
 * `<Suspense>` yang membungkus seluruh rute di bawah sudah ada sejak awal, jadi
 * setiap modul yang belum sampai akan menampilkan pemutar tunggu pada area
 * isinya saja. Kerangka aplikasi, menu samping, dan bilah atas tetap terlihat.
 */
function modul<M extends Record<string, any>, K extends keyof M>(
  ambil: () => Promise<M>,
  nama: K,
): M[K] {
  return React.lazy(async () => ({ default: (await ambil())[nama] })) as M[K];
}

const ExecutiveDashboard = modul(() => import('../components/modules/ExecutiveDashboard'), 'ExecutiveDashboard');
const SuperAdminView = modul(() => import('../components/modules/SuperAdminView'), 'SuperAdminView');
const CrmCustomersView = modul(() => import('../components/modules/CrmCustomersView'), 'CrmCustomersView');
const MarketingActivityView = modul(() => import('../components/modules/MarketingActivityView'), 'MarketingActivityView');
const FundingDashboardView = modul(() => import('../components/modules/FundingDashboardView'), 'FundingDashboardView');
const LosCreditView = modul(() => import('../components/modules/LosCreditView'), 'LosCreditView');
const OtsSurveyView = modul(() => import('../components/modules/OtsSurveyView'), 'OtsSurveyView');
const CreditAnalysisView = modul(() => import('../components/modules/CreditAnalysisView'), 'CreditAnalysisView');
const CollateralAppraisalView = modul(() => import('../components/modules/CollateralAppraisalView'), 'CollateralAppraisalView');
const CreditApprovalView = modul(() => import('../components/modules/CreditApprovalView'), 'CreditApprovalView');
const LegalDocumentsView = modul(() => import('../components/modules/LegalDocumentsView'), 'LegalDocumentsView');
const DisbursementPortfolioView = modul(() => import('../components/modules/DisbursementPortfolioView'), 'DisbursementPortfolioView');
const CollectionMgmtView = modul(() => import('../components/modules/CollectionMgmtView'), 'CollectionMgmtView');
const PtpTrackerView = modul(() => import('../components/modules/PtpTrackerView'), 'PtpTrackerView');
const NplRestructuringView = modul(() => import('../components/modules/NplRestructuringView'), 'NplRestructuringView');
const EwsRiskView = modul(() => import('../components/modules/EwsRiskView'), 'EwsRiskView');
const AuditLogView = modul(() => import('../components/modules/AuditLogView'), 'AuditLogView');
const BranchNetworkView = modul(() => import('../components/modules/BranchNetworkView'), 'BranchNetworkView');
const FlowTasksView = modul(() => import('../components/modules/FlowTasksView'), 'FlowTasksView');
const ReportsAnalyticsView = modul(() => import('../components/modules/ReportsAnalyticsView'), 'ReportsAnalyticsView');
const HrKpiView = modul(() => import('../components/modules/HrKpiView'), 'HrKpiView');
const PayrollView = modul(() => import('../components/modules/PayrollView'), 'PayrollView');
const BEISDashboard = modul(() => import('../components/modules/beis/BEISDashboard'), 'BEISDashboard');
const DecisionQueue = modul(() => import('../components/modules/DecisionQueue'), 'DecisionQueue');
const CalendarView = modul(() => import('../components/modules/CalendarView'), 'CalendarView');
const PeBisnisView = modul(() => import('../components/modules/PeBisnisView'), 'PeBisnisView');
const DataCenterUploadView = modul(() => import('../components/modules/DataCenterUploadView'), 'DataCenterUploadView');
const PeKepatuhanView = modul(() => import('../components/modules/PeKepatuhanView'), 'PeKepatuhanView');
const PeAuditView = modul(() => import('../components/modules/PeAuditView'), 'PeAuditView');
const HeatMapView = modul(() => import('../components/modules/HeatMapView'), 'HeatMapView');
const TargetBungaView = modul(() => import('../components/modules/TargetBungaView'), 'TargetBungaView');
const PencapaianBisnisView = modul(() => import('../components/modules/PencapaianBisnisView'), 'PencapaianBisnisView');
const ProjectManagementView = modul(() => import('../components/modules/ProjectManagementView'), 'ProjectManagementView');
const CBSDataCenterView = modul(() => import('../components/modules/CBSDataCenterView'), 'CBSDataCenterView');
const ProfileView = modul(() => import('../components/modules/ProfileView'), 'ProfileView');

/* Layar mobile memakai export bawaan, jadi tidak perlu penamaan ulang. */
const MobileHome = React.lazy(() => import('../components/mobile/pages/MobileHome'));
const MobileAttendanceData = React.lazy(() => import('../components/mobile/pages/MobileAttendanceData'));
const MobileLiveAttendance = React.lazy(() => import('../components/mobile/pages/MobileLiveAttendance'));
const MobileNotifications = React.lazy(() => import('../components/mobile/pages/MobileNotifications'));
const MobileProfile = React.lazy(() => import('../components/mobile/pages/MobileProfile'));
const MobileDashboard = React.lazy(() => import('../components/mobile/pages/MobileDashboard'));
const MobileTaskBoard = React.lazy(() => import('../components/mobile/pages/MobileTaskBoard'));
const MobileActivities = React.lazy(() => import('../components/mobile/pages/MobileActivities'));
const MobileInfoGaji = React.lazy(() => import('../components/mobile/pages/MobileInfoGaji'));
const MobileApprovalQueue = React.lazy(() => import('../components/mobile/pages/MobileApprovalQueue'));
const MobileCalendar = React.lazy(() => import('../components/mobile/pages/MobileCalendar'));
const MobileLoanOrigination = React.lazy(() => import('../components/mobile/pages/MobileLoanOrigination'));

const FallbackLoading = () => (
  <div className="p-6 flex items-center justify-center h-full">
    <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
  </div>
);

const NotFound = () => (
  <div className="flex flex-col items-center justify-center h-full text-center p-6">
    <h1 className="text-4xl font-bold text-slate-800 dark:text-slate-200 mb-2">404</h1>
    <p className="text-slate-500 dark:text-slate-400 mb-6">Halaman tidak ditemukan.</p>
    <a href="/" className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">
      Kembali ke Dashboard
    </a>
  </div>
);

// Fallback for modules that don't have components yet in the switch-case
const PlaceholderView = ({ title }: { title: string }) => (
  <div className="p-6">
    <h2 className="text-2xl font-bold mb-4">{title}</h2>
    <p className="text-gray-500">Modul ini sedang dalam pengembangan.</p>
  </div>
);

// Aturan akses dipusatkan di src/utils/access.ts agar web dan mobile
// memakai logika yang sama persis.
const isPathAccessible = isPathAllowed;

/**
 * Tujuan setelah login / saat membuka akar aplikasi.
 *
 * APK selalu masuk ke tampilan mobile: aplikasi itu ditujukan untuk aktivitas
 * lapangan dan absensi. Sebelumnya tidak ada satu pun kode yang mengarahkan
 * ke /mobile, sehingga APK selalu mendarat di dashboard web dan seluruh layar
 * mobile praktis tidak pernah terlihat.
 *
 * Modul web tetap dapat dibuka dari grid Menu di beranda mobile.
 */
const getFirstAccessibleRoute = (
  role: string | undefined,
  rolePermissions: Record<string, string[]>,
): string => (isNativeApp() ? RUTE_AWAL_MOBILE : firstAccessibleRoute(role, rolePermissions));

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { currentUser, rolePermissions } = useApp();
  const location = useLocation();
  const defaultRoute = getFirstAccessibleRoute(currentUser?.role || 'User', rolePermissions);

  if (!currentUser) return <Navigate to="/" replace />;
  if (!isPathAccessible(location.pathname, currentUser.role, rolePermissions)) {
    return <Navigate to={defaultRoute} replace />;
  }
  return <>{children}</>;
};

export const AppRouter: React.FC = () => {
  const { isAuthenticated, setIsAuthenticated, setCurrentUser, rolePermissions, currentUser, isAuthLoading, flowTasks, updateTask } = useApp();
  const navigate = useNavigate();

  if (isAuthLoading) {
    return <FallbackLoading />;
  }

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="*" element={<LoginScreen onLoginSuccess={(user) => {
          setCurrentUser(user);
          setIsAuthenticated(true);
          /*
           * Memakai navigate(), bukan window.location.href.
           *
           * window.location.href adalah navigasi keras: browser meminta ulang
           * path itu ke server. Di dalam APK, halaman disajikan oleh server
           * lokal Capacitor dari berkas bundel — permintaan keras ke path
           * dalam seperti /mobile/home berisiko tidak terlayani karena tidak
           * ada berkas dengan nama itu. Navigasi React Router tidak menyentuh
           * server sama sekali, sekaligus menghilangkan muat-ulang penuh yang
           * membuang seluruh state aplikasi setiap kali login.
           */
          navigate(getFirstAccessibleRoute(user.role || 'User', rolePermissions), { replace: true });
        }} />} />
      </Routes>
    );
  }

  const defaultRoute = getFirstAccessibleRoute(currentUser?.role || 'User', rolePermissions);

  return (
    <Suspense fallback={<FallbackLoading />}>
      <Routes>
        <Route element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
          {/* Default Redirect */}
          <Route path="/" element={<Navigate to={defaultRoute} replace />} />
          
          {/*
           * Profil pengguna. Sengaja di luar navigationConfig: setiap orang
           * yang sudah masuk berhak mengubah datanya sendiri, tanpa perlu
           * diberi izin menu oleh Super Admin.
           */}
          <Route path="/profile" element={<ProfileView />} />

          {/* Super Admin Route */}
          <Route path="/super-admin" element={<SuperAdminView />} />
          
          {/* Executive Group */}
          <Route path="/dashboard" element={<ExecutiveDashboard />} />
          <Route path="/executive/pe-bisnis" element={<PeBisnisView />} />
          <Route path="/executive/pe-bisnis-upload" element={<DataCenterUploadView />} />
          
          {/* Customer Group */}
          <Route path="/customer/360" element={<CrmCustomersView />} />
          <Route path="/customer/marketing" element={<MarketingActivityView />} />
          
          {/* Business Group */}
          <Route path="/business/funding" element={<FundingDashboardView />} />
          <Route path="/business/credit/los" element={<LosCreditView />} />
          <Route path="/business/credit/survey" element={<OtsSurveyView />} />
          <Route path="/business/credit/analysis" element={<CreditAnalysisView />} />
          <Route path="/business/credit/appraisal" element={<CollateralAppraisalView />} />
          <Route path="/business/credit/approval" element={<CreditApprovalView />} />
          <Route path="/business/credit/legal" element={<LegalDocumentsView />} />
          <Route path="/business/credit/disbursement" element={<DisbursementPortfolioView />} />
          <Route path="/business/target-bunga" element={<TargetBungaView />} />
          <Route path="/business/pencapaian-bisnis" element={<PencapaianBisnisView />} />
          <Route path="/business/branch-network" element={<BranchNetworkView />} />
          
          {/* Operations Group */}
          <Route path="/operations/collection" element={<CollectionMgmtView />} />
          <Route path="/operations/collection/ptp" element={<PtpTrackerView />} />
          <Route path="/operations/collection/npl" element={<NplRestructuringView />} />
          <Route path="/operations/tasks" element={<FlowTasksView />} />
          <Route path="/operations/projects" element={<ProjectManagementView />} />
          <Route path="/operations/reports/beis" element={<BEISDashboard tasks={flowTasks} currentUser={currentUser!} />} />
          <Route path="/operations/reports/analytics" element={<ReportsAnalyticsView />} />
          <Route path="/operations/reports/center" element={<PlaceholderView title="Pusat Laporan & OJK" />} />
          <Route path="/operations/decision-queue" element={<DecisionQueue tasks={flowTasks} currentUser={currentUser!} onUpdateTask={updateTask} />} />
          <Route path="/operations/calendar" element={<CalendarView tasks={flowTasks} onSyncCalendar={() => {}} />} />
          
          {/* People Group */}
          <Route path="/people/hr-kpi" element={<HrKpiView />} />
          <Route path="/people/payroll" element={<PayrollView />} />
          
          {/* System Group */}
          <Route path="/system/ews" element={<EwsRiskView />} />
          <Route path="/system/pe-kepatuhan" element={<PeKepatuhanView />} />
          <Route path="/system/pe-audit" element={<PeAuditView />} />
          <Route path="/system/compliance" element={<PlaceholderView title="Kepatuhan & APU-PPT" />} />
          <Route path="/system/anti-fraud" element={<PlaceholderView title="Anti-Fraud & Audit Trail" />} />
          <Route path="/system/audit-log" element={<AuditLogView />} />
          <Route path="/system/data-center" element={<CBSDataCenterView />} />
          <Route path="/system/settings" element={<PlaceholderView title="Master Data & Pengaturan" />} />
          
          {/* Legacy Group */}
          <Route path="/legacy/heat-map" element={<HeatMapView />} />
        </Route>

        {/* Mobile View Routes (Independent of AppShell) */}
        <Route element={<ProtectedRoute><MobileLayout /></ProtectedRoute>}>
          <Route path="/mobile" element={<Navigate to="/mobile/home" replace />} />
          <Route path="/mobile/home" element={<MobileHome />} />
          <Route path="/mobile/attendance" element={<MobileAttendanceData />} />
          <Route path="/mobile/live-attendance" element={<MobileLiveAttendance />} />
          <Route path="/mobile/notifications" element={<MobileNotifications />} />
          <Route path="/mobile/profile" element={<MobileProfile />} />
          {/* Modul web yang sudah punya layar versi APK tersendiri */}
          <Route path="/mobile/ringkasan" element={<MobileDashboard />} />
          <Route path="/mobile/tugas" element={<MobileTaskBoard />} />
          <Route path="/mobile/persetujuan" element={<MobileApprovalQueue />} />
          <Route path="/mobile/kalender" element={<MobileCalendar />} />
          <Route path="/mobile/kredit" element={<MobileLoanOrigination />} />

          {/* Modul khusus mobile — belum ada padanannya di web */}
          <Route path="/mobile/aktivitas" element={<MobileActivities />} />
          <Route path="/mobile/info-gaji" element={<MobileInfoGaji />} />
        </Route>
        
        {/* 404 Route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
};
