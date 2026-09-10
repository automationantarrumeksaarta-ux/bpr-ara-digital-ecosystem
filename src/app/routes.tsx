import React, { Suspense } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { firstAccessibleRoute, isPathAllowed } from '../utils/access';
import { isNativeApp, RUTE_AWAL_MOBILE } from '../utils/platform';

// Import all views
import { ExecutiveDashboard } from '../components/modules/ExecutiveDashboard';
import { SuperAdminView } from '../components/modules/SuperAdminView';
import { CrmCustomersView } from '../components/modules/CrmCustomersView';
import { MarketingActivityView } from '../components/modules/MarketingActivityView';
import { FundingDashboardView } from '../components/modules/FundingDashboardView';
import { LosCreditView } from '../components/modules/LosCreditView';
import { OtsSurveyView } from '../components/modules/OtsSurveyView';
import { CreditAnalysisView } from '../components/modules/CreditAnalysisView';
import { CollateralAppraisalView } from '../components/modules/CollateralAppraisalView';
import { CreditApprovalView } from '../components/modules/CreditApprovalView';
import { LegalDocumentsView } from '../components/modules/LegalDocumentsView';
import { DisbursementPortfolioView } from '../components/modules/DisbursementPortfolioView';
import { CollectionMgmtView } from '../components/modules/CollectionMgmtView';
import { PtpTrackerView } from '../components/modules/PtpTrackerView';
import { NplRestructuringView } from '../components/modules/NplRestructuringView';
import { EwsRiskView } from '../components/modules/EwsRiskView';
import { AuditLogView } from '../components/modules/AuditLogView';
import { BranchNetworkView } from '../components/modules/BranchNetworkView';
import { FlowTasksView } from '../components/modules/FlowTasksView';
import { ReportsAnalyticsView } from '../components/modules/ReportsAnalyticsView';
import { HrKpiView } from '../components/modules/HrKpiView';
import { PayrollView } from '../components/modules/PayrollView';
import { BEISDashboard } from '../components/modules/beis/BEISDashboard';
import { DecisionQueue } from '../components/modules/DecisionQueue';
import { CalendarView } from '../components/modules/CalendarView';
import { PeBisnisView } from '../components/modules/PeBisnisView';
import { DataCenterUploadView } from '../components/modules/DataCenterUploadView';
import { PeKepatuhanView } from '../components/modules/PeKepatuhanView';
import { PeAuditView } from '../components/modules/PeAuditView';
import { HeatMapView } from '../components/modules/HeatMapView';
import { TargetBungaView } from '../components/modules/TargetBungaView';
import { PencapaianBisnisView } from '../components/modules/PencapaianBisnisView';
import { ProjectManagementView } from '../components/modules/ProjectManagementView';
import { CBSDataCenterView } from '../components/modules/CBSDataCenterView';
import { AppShell } from '../components/layout/AppShell';
import { LoginScreen } from '../components/LoginScreen';

// Mobile Components
import { MobileLayout } from '../components/mobile/MobileLayout';
import MobileHome from '../components/mobile/pages/MobileHome';
import MobileAttendanceData from '../components/mobile/pages/MobileAttendanceData';
import MobileLiveAttendance from '../components/mobile/pages/MobileLiveAttendance';
import MobileNotifications from '../components/mobile/pages/MobileNotifications';
import MobileProfile from '../components/mobile/pages/MobileProfile';
import MobileDashboard from '../components/mobile/pages/MobileDashboard';
import MobileTaskBoard from '../components/mobile/pages/MobileTaskBoard';
import MobileActivities from '../components/mobile/pages/MobileActivities';
import MobileInfoGaji from '../components/mobile/pages/MobileInfoGaji';

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
