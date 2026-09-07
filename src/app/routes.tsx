import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

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

export const AppRouter: React.FC = () => {
  const { isAuthenticated, setIsAuthenticated, setCurrentUser, flowTasks, currentUser } = useApp();

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="*" element={<LoginScreen onLoginSuccess={(user) => {
          setCurrentUser(user);
          setIsAuthenticated(true);
        }} />} />
      </Routes>
    );
  }

  // Determine default route based on role if needed, but for now /dashboard is safe.
  // We can just rely on the AppShell to render.

  return (
    <Suspense fallback={<FallbackLoading />}>
      <Routes>
        <Route element={<AppShell />}>
          {/* Default Redirect */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          
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
          <Route path="/operations/decision-queue" element={<DecisionQueue tasks={flowTasks} currentUser={currentUser!} />} />
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
          
          {/* 404 Route */}
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Suspense>
  );
};
