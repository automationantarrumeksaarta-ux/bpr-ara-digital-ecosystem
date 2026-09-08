import React from 'react';
import {
  LayoutDashboard,
  Users,
  Target,
  PiggyBank,
  ShoppingBag,
  FileText,
  Camera,
  LineChart,
  ShieldCheck,
  CheckSquare,
  FileBadge,
  Send,
  BadgeAlert,
  CalendarClock,
  RefreshCw,
  KanbanSquare,
  TrendingUp,
  UserCheck,
  AlertOctagon,
  Scale,
  ShieldAlert,
  BarChart3,
  Sliders,
  ChevronRight,
  Calendar,
  Briefcase,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useApp, AppModuleId } from '../../context/AppContext';
import { UserRole } from '../../types';

interface NavGroup {
  label: string;
  items: {
    id: AppModuleId;
    title: string;
    icon: React.ElementType;
    badgeCount?: number;
    badgeColor?: string;
    allowedRoles?: UserRole[];
  }[];
}

interface SidebarProps {
  onOpenCalendarSync?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onOpenCalendarSync }) => {
  const { activeModule, setActiveModule, ewsAlerts, creditApplications, ptpRecords, flowTasks, currentUser, rolePermissions } = useApp();

  const isMenuAllowed = (item: any) => {
    // If dynamic permissions exist for this role, use them (Master Admin is NOT exempt - must be configured via Edit Akses)
    if (rolePermissions && rolePermissions[currentUser.role] && rolePermissions[currentUser.role].length > 0) {
      return rolePermissions[currentUser.role].includes(item.title);
    }
    // Fallback to static config
    if (currentUser.role === 'User') return false; // Newly registered users get NO modules until Super Admin assigns a role/access
    return !item.allowedRoles || item.allowedRoles.includes(currentUser.role);
  };

  const pendingApprovalsCount = creditApplications.filter((a) => a.currentStage === 'CREDIT_COMMITTEE').length;
  const redEwsCount = ewsAlerts.filter((a) => a.severity === 'RED' && a.status !== 'RESOLVED').length;
  const duePtpCount = ptpRecords.filter((p) => p.status === 'DUE' || p.status === 'PROMISED').length;
  const openTasksCount = flowTasks.filter((t) => t.status === 'OPEN' || t.status === 'IN_PROGRESS').length;

  const navigationGroups: NavGroup[] = [
    {
      label: 'EKSEKUTIF & RINGKASAN',
      items: [
        {
          id: 'EXECUTIVE_DASHBOARD',
          title: 'Dashboard Utama',
          icon: LayoutDashboard,
        },
        {
          id: 'SUPER_ADMIN',
          title: 'Super Admin',
          icon: ShieldAlert,
          allowedRoles: ['Master Admin'],
        },
        {
          id: 'PE_BISNIS',
          title: 'PE Bisnis',
          icon: LayoutDashboard,
          allowedRoles: ['Direktur Utama', 'Direktur YMFK', 'Direktur', 'PE Bisnis & Collection', 'Master Admin'],
        },
      ],
    },
    {
      label: 'BISNIS & PEMASARAN',
      items: [
        {
          id: 'CRM_CUSTOMERS',
          title: 'CRM & Customer 360',
          icon: Users,
        },
        {
          id: 'MARKETING_ACTIVITY',
          title: 'Aktivitas Marketing',
          icon: Target,
        },
        {
          id: 'FUNDING_DASHBOARD',
          title: 'Penghimpunan Dana & Kampanye',
          icon: PiggyBank,
        },
        {
          id: 'TARGET_BUNGA',
          title: 'Rasio Target Bunga AO',
          icon: Target,
          allowedRoles: ['Direktur Utama', 'Direktur YMFK', 'PE Bisnis & Collection', 'Account Officer', 'Master Admin'],
        },
        {
          id: 'PENCAPAIAN_BISNIS',
          title: 'Pencapaian Bisnis AO',
          icon: Target,
          allowedRoles: ['Direktur Utama', 'Direktur YMFK', 'PE Bisnis & Collection', 'Account Officer', 'Master Admin'],
        },
      ],
    },
    {
      label: 'OPERASIONAL KREDIT (LOS)',
      items: [
        {
          id: 'LOS_CREDIT',
          title: 'Aplikasi Kredit & LOS',
          icon: FileText,
          allowedRoles: ['Direktur Utama', 'Direktur YMFK', 'Kepala Cabang', 'Account Officer', 'Analis Kredit'],
        },
        {
          id: 'OTS_SURVEY',
          title: 'Field Survey (OTS)',
          icon: Camera,
          allowedRoles: ['Direktur Utama', 'Direktur YMFK', 'Kepala Cabang', 'Surveyor', 'Account Officer'],
        },
        {
          id: 'CREDIT_ANALYSIS',
          title: 'Analisis Kredit 5C',
          icon: LineChart,
          allowedRoles: ['Direktur Utama', 'Direktur YMFK', 'Kepala Cabang', 'Analis Kredit'],
        },
        {
          id: 'COLLATERAL_APPRAISAL',
          title: 'Penilaian Agunan & LTV',
          icon: ShieldCheck,
          allowedRoles: ['Direktur Utama', 'Direktur YMFK', 'Kepala Cabang', 'Analis Kredit', 'Surveyor', 'Admin Legal', 'Admin Legal & SDM'],
        },
        {
          id: 'CREDIT_APPROVAL',
          title: 'Persetujuan Komite Kredit',
          icon: CheckSquare,
          badgeCount: pendingApprovalsCount,
          badgeColor: 'bg-amber-500 text-slate-900 font-bold',
          allowedRoles: ['Direktur Utama', 'Direktur YMFK', 'Komisaris Utama', 'Komisaris', 'Kepala Cabang', 'PE Bisnis & Collection', 'PE Kepatuhan, Manrisk & LK'],
        },
        {
          id: 'LEGAL_DOCUMENTS',
          title: 'Legalitas & Dokumen',
          icon: FileBadge,
          allowedRoles: ['Direktur Utama', 'Direktur YMFK', 'Kepala Cabang', 'Admin Legal', 'Admin Legal & SDM'],
        },
        {
          id: 'DISBURSEMENT_PORTFOLIO',
          title: 'Pencairan & Portofolio',
          icon: Send,
          allowedRoles: ['Direktur Utama', 'Direktur YMFK', 'Kepala Cabang', 'Admin Legal', 'Admin Legal & SDM', 'Account Officer'],
        },
      ],
    },
    {
      label: 'PENAGIHAN & REMEDIAL',
      items: [
        {
          id: 'COLLECTION_MGMT',
          title: 'Manajemen Penagihan',
          icon: BadgeAlert,
        },
        {
          id: 'PTP_TRACKER',
          title: 'Janji Bayar (PTP)',
          icon: CalendarClock,
          badgeCount: duePtpCount,
          badgeColor: 'bg-blue-500 text-white',
        },
        {
          id: 'NPL_RESTRUCTURING',
          title: 'NPL & Restrukturisasi 3R',
          icon: RefreshCw,
        },
      ],
    },
    {
      label: 'MANAJEMEN KERJA & KINERJA',
      items: [
        {
          id: 'FLOW_TASKS',
          title: 'FlowTask Workspace',
          icon: KanbanSquare,
          badgeCount: openTasksCount,
          badgeColor: 'bg-indigo-500 text-white',
        },
        {
          id: 'PROJECT_MANAGEMENT',
          title: 'Manajemen Project',
          icon: Briefcase,
        },
        {
          id: 'REPORTS_BEIS',
          title: 'Laporan BEIS',
          icon: FileText,
        },
        {
          id: 'DECISION_QUEUE',
          title: 'Antrean Keputusan',
          icon: CheckSquare,
        },
        {
          id: 'CALENDAR_VIEW',
          title: 'Kalender Kegiatan',
          icon: Calendar,
        },
        {
          id: 'KPI_PERFORMANCE',
          title: 'Kinerja, KPI & OKR',
          icon: TrendingUp,
        },
      ],
    },

    {
      label: 'RISIKO, KEPATUHAN & AUDIT',
      items: [
        {
          id: 'EWS_RISK',
          title: 'Early Warning System (EWS)',
          icon: AlertOctagon,
          badgeCount: redEwsCount,
          badgeColor: 'bg-red-500 text-white font-bold',
        },
        {
          id: 'PE_KEPATUHAN',
          title: 'PE Kepatuhan & Risk',
          icon: ShieldCheck,
          allowedRoles: ['Direktur Utama', 'Direktur YMFK', 'PE Kepatuhan, Manrisk & LK', 'Master Admin'],
        },
        {
          id: 'PE_AUDIT',
          title: 'PE Audit Intern',
          icon: ShieldCheck,
          allowedRoles: ['Direktur Utama', 'Direktur YMFK', 'PE Audit Intern & Anti Fraud', 'Master Admin'],
        },
        {
          id: 'COMPLIANCE',
          title: 'Kepatuhan & APU-PPT',
          icon: Scale,
        },
        {
          id: 'ANTI_FRAUD_AUDIT',
          title: 'Anti-Fraud & Audit Trail',
          icon: ShieldAlert,
        },
      ],
    },
    {
      label: 'LAPORAN & SISTEM',
      items: [
        {
          id: 'REPORTS_CENTER',
          title: 'Pusat Laporan & OJK',
          icon: BarChart3,
        },
        {
          id: 'HEAT_MAP',
          title: 'Heat Map Sebaran Kredit',
          icon: BarChart3,
          allowedRoles: ['Direktur Utama', 'Direktur YMFK', 'PE Bisnis & Collection', 'PE Kepatuhan, Manrisk & LK', 'Analis Kredit', 'Master Admin'],
        },
        {
          id: 'MASTER_SETTINGS',
          title: 'Master Data & Pengaturan',
          icon: Sliders,
        },
      ],
    },
  ];

  return (
    <aside className="fixed lg:static top-0 bottom-0 left-0 z-50 w-[260px] bg-white dark:bg-[#111111] border-r border-transparent flex flex-col h-full select-none shrink-0 transition-transform duration-300 ease-in-out">
      {/* Header Branding */}
      <div className="flex items-center mb-6 mt-8 px-6">
        <h1 className="text-2xl font-bold font-sans text-gray-900 dark:text-white tracking-tight">
          BPR ARA
        </h1>
      </div>

      {/* Scrollable Navigation List */}
      <div className="flex-1 overflow-y-auto py-6 px-4 space-y-8 scrollbar-hide">
        {navigationGroups.map((group, groupIndex) => {
          // Filter items based on currentUser.role or rolePermissions
          const visibleItems = group.items.filter(isMenuAllowed);

          if (visibleItems.length === 0) return null;

          return (
            <div key={groupIndex}>
              <h3 className="px-3 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">
                {group.label}
              </h3>
              <div className="space-y-1">
                {visibleItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeModule === item.id;
                return (
                  <motion.button 
                    whileHover={{ scale: 1.01 }} 
                    whileTap={{ scale: 0.99 }}
                    key={item.id}
                    onClick={() => setActiveModule(item.id)}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-[14px] transition-all mb-1 ${
                      isActive
                        ? 'bg-gray-100/80 text-gray-900 dark:bg-[#1C1C1C] dark:text-white font-medium'
                        : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-[#1C1C1C]/50'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Icon
                        strokeWidth={1.5}
                        className={`w-4 h-4 shrink-0 transition-colors ${
                          isActive ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'
                        }`}
                      />
                      <span className="truncate">{item.title}</span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {item.badgeCount !== undefined && item.badgeCount > 0 && (
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                            item.badgeColor || 'bg-blue-500 text-white'
                          }`}
                        >
                          {item.badgeCount}
                        </span>
                      )}
                      <ChevronRight
                        className={`w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity ${
                          isActive ? 'opacity-100 text-white dark:text-blue-400' : 'text-gray-400'
                        }`}
                      />
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>
        );
        })}
      </div>
    </aside>
  );
};
