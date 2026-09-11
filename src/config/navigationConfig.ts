import React from 'react';
import {
  Building2,
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
  Calendar,
  Briefcase,
  WalletCards,
  Database,
  Folders
} from 'lucide-react';
import { AppModuleId } from '../context/AppContext';
import { UserRole } from '../types';

export interface NavItem {
  id: string;
  /**
   * Kunci hak akses, BUKAN teks yang dibaca pengguna.
   *
   * Izin dinamis yang diatur Super Admin disimpan sebagai daftar `title`
   * (`dynamicPerms.includes(item.title)` di Sidebar dan di src/utils/access.ts),
   * jadi mengubah nilai ini akan mencabut akses peran yang izinnya sudah
   * tersimpan. Untuk mengganti teks yang tampil, isi `label`.
   */
  title: string;
  /** Teks yang ditampilkan. Bila kosong, `title` yang dipakai. */
  label?: string;
  path?: string;
  icon: React.ElementType;
  allowedRoles?: UserRole[];
  badgeType?: 'APPROVALS' | 'EWS' | 'PTP' | 'TASKS';
  badgeColor?: string;
  children?: NavItem[];
}

export interface NavGroup {
  id: string;
  label: string;
  items: NavItem[];
}

const ALL_ROLES: UserRole[] = [
  'Direktur Utama', 'Direktur YMFK', 'Komisaris Utama', 'Komisaris', 'Kepala Cabang', 'PE Literasi & Edukasi, PE Bisnis & Collection', 'PE Kepatuhan, Manrisk, APU PPT', 'Kepatuhan',
  'Teknologi Informasi', 'CRM & Digitalisasi', 'Admin Legal & SDM', 'Admin Legal', 'Pengembangan SDM',
  'Accounting', 'Analis Kredit', 'Bagian Umum', 'Customer Service',
  'Kepala Cabang', 'Kepala Kas', 'Teller', 'Marketing Dana (Funding)', 'Account Officer', 'Surveyor',
  'Koordinator Collection', 'Staff Collection'
];

const DIR_KOM: UserRole[] = ['Komisaris Utama', 'Komisaris', 'Direktur Utama', 'Direktur YMFK', 'Direktur'];
const BISNIS: UserRole[] = [...DIR_KOM, 'PE Bisnis & Collection', 'Kepala Cabang', 'Kepala Kas', 'Account Officer', 'Marketing Dana (Funding)'];
const KREDIT: UserRole[] = [...DIR_KOM, 'PE Bisnis & Collection', 'Kepala Cabang', 'Analis Kredit'];
const COLLECTION: UserRole[] = [...DIR_KOM, 'PE Bisnis & Collection', 'Kepala Cabang', 'Koordinator Collection', 'Staff Collection'];
const LEGAL_HR: UserRole[] = [...DIR_KOM, 'Admin Legal & SDM', 'Admin Legal', 'Pengembangan SDM'];
const AUDIT_RISK: UserRole[] = [...DIR_KOM, 'PE Audit Intern & Anti Fraud', 'PE Kepatuhan, Manrisk & LK', 'Kepatuhan'];

export const navigationConfig: NavGroup[] = [
  {
    id: 'executive',
    label: 'EXECUTIVE',
    items: [
      {
        id: 'EXECUTIVE_DASHBOARD',
        title: 'Dashboard Utama',
        path: '/dashboard',
        icon: LayoutDashboard,
        allowedRoles: ALL_ROLES,
      },
      {
        id: 'SUPER_ADMIN',
        title: 'Super Admin',
        path: '/super-admin',
        icon: ShieldAlert,
        allowedRoles: ['Master Admin', 'Super Admin'],
      }
    ],
  },
  {
    id: 'workspace',
    label: 'MY WORKSPACE',
    items: [
      {
        id: 'FLOW_TASKS',
        title: 'Task Board',
        path: '/operations/tasks',
        icon: KanbanSquare,
        badgeType: 'TASKS',
        badgeColor: 'bg-indigo-500 text-white',
        allowedRoles: ALL_ROLES,
      },
      {
        id: 'DECISION_QUEUE',
        title: 'Approval Queue',
        path: '/operations/decision-queue',
        icon: CheckSquare,
        allowedRoles: [...DIR_KOM, 'PE Bisnis & Collection', 'Kepala Cabang'],
      },
      {
        id: 'CALENDAR_VIEW',
        title: 'Calendar',
        path: '/operations/calendar',
        icon: Calendar,
        allowedRoles: ALL_ROLES,
      },
      {
        id: 'PROJECT_MANAGEMENT',
        title: 'Projects',
        path: '/operations/projects',
        icon: Briefcase,
        allowedRoles: ALL_ROLES,
      }
    ]
  },
  {
    id: 'customer',
    label: 'CUSTOMER & MARKETING',
    items: [
      {
        id: 'CRM_CUSTOMERS',
        title: 'Customer 360',
        path: '/customer/360',
        icon: Users,
        allowedRoles: BISNIS,
      },
      {
        id: 'MARKETING_ACTIVITY',
        title: 'Marketing Activities',
        path: '/customer/marketing',
        icon: Target,
        allowedRoles: BISNIS,
      },
    ],
  },
  {
    id: 'credit',
    label: 'PIPELINE KREDIT',
    items: [
      {
        id: 'LOS_CREDIT',
        title: 'Loan Origination',
        label: 'Pengajuan Kredit',
        path: '/business/credit/los',
        icon: FileText,
        allowedRoles: [...KREDIT, 'Account Officer'],
      },
      {
        id: 'OTS_SURVEY',
        title: 'Field Survey',
        label: 'Survei Lapangan',
        path: '/business/credit/survey',
        icon: Camera,
        allowedRoles: ['Account Officer', 'Marketing Dana (Funding)', 'Surveyor', 'Koordinator Collection', 'Staff Collection'],
      },
      {
        id: 'CREDIT_ANALYSIS',
        title: 'Credit Analysis',
        label: 'Analisis Kredit',
        path: '/business/credit/analysis',
        icon: LineChart,
        allowedRoles: KREDIT,
      },
      {
        id: 'COLLATERAL_APPRAISAL',
        title: 'Collateral Appraisal',
        label: 'Taksasi Agunan',
        path: '/business/credit/appraisal',
        icon: ShieldCheck,
        allowedRoles: [...KREDIT, 'Admin Legal & SDM', 'Admin Legal'],
      },
      {
        id: 'CREDIT_APPROVAL',
        title: 'Committee Approval',
        label: 'Putusan Komite',
        path: '/business/credit/approval',
        icon: CheckSquare,
        badgeType: 'APPROVALS',
        badgeColor: 'bg-amber-500 text-slate-900 font-bold',
        allowedRoles: ['Direktur Utama', 'Direktur YMFK', 'PE Kepatuhan, Manrisk, APU PPT', 'Kepala Kas'],
      },
      {
        id: 'LEGAL_DOCUMENTS',
        title: 'Legal & Documents',
        label: 'Legal & Akad',
        path: '/business/credit/legal',
        icon: FileBadge,
        allowedRoles: LEGAL_HR,
      },
      {
        id: 'DISBURSEMENT_PORTFOLIO',
        title: 'Disbursement',
        label: 'Pencairan',
        path: '/business/credit/disbursement',
        icon: Send,
        allowedRoles: [...LEGAL_HR, 'Account Officer'],
      },
    ],
  },
  {
    id: 'collection',
    label: 'COLLECTION & RECOVERY',
    items: [
      {
        id: 'COLLECTION_MGMT',
        title: 'Collection Management',
        path: '/operations/collection',
        icon: BadgeAlert,
        allowedRoles: COLLECTION,
      },
      {
        id: 'PTP_TRACKER',
        title: 'PTP Tracker',
        path: '/operations/collection/ptp',
        icon: CalendarClock,
        badgeType: 'PTP',
        badgeColor: 'bg-blue-500 text-white',
        allowedRoles: COLLECTION,
      },
      {
        id: 'NPL_RESTRUCTURING',
        title: 'NPL & Restructuring',
        path: '/operations/collection/npl',
        icon: RefreshCw,
        allowedRoles: [...COLLECTION, 'Analis Kredit'],
      },
    ],
  },
  {
    id: 'funding',
    label: 'FUNDING',
    items: [
      {
        id: 'FUNDING_DASHBOARD',
        title: 'Funding Dashboard',
        path: '/business/funding',
        icon: PiggyBank,
        allowedRoles: BISNIS,
      },
    ]
  },
  {
    id: 'performance',
    label: 'PERFORMANCE & ANALYTICS',
    items: [
      {
        id: 'BRANCH_NETWORK',
        title: 'Branch Network',
        path: '/business/branch-network',
        icon: Building2,
        allowedRoles: BISNIS,
      },
      {
        id: 'REPORTS_ANALYTICS',
        title: 'Reports & Analytics',
        path: '/operations/reports/analytics',
        icon: BarChart3,
        allowedRoles: ALL_ROLES,
      },
      {
        id: 'REPORTS_BEIS',
        title: 'BEIS Reporting',
        path: '/operations/reports/beis',
        icon: FileText,
        allowedRoles: [...DIR_KOM, 'PE Bisnis & Collection', 'Kepala Cabang'],
      },
      {
        id: 'LEGACY_DASHBOARDS',
        title: 'Legacy Dashboards',
        icon: Folders,
        children: [
          {
            id: 'PE_BISNIS',
            title: 'PE Bisnis',
            path: '/executive/pe-bisnis',
            icon: LayoutDashboard,
            allowedRoles: [...DIR_KOM, 'PE Bisnis & Collection'],
          },
          {
            id: 'TARGET_BUNGA',
            title: 'Target Bunga',
            path: '/business/target-bunga',
            icon: Target,
            allowedRoles: BISNIS,
          },
          {
            id: 'PENCAPAIAN_BISNIS',
            title: 'Pencapaian Bisnis',
            path: '/business/pencapaian-bisnis',
            icon: Target,
            allowedRoles: BISNIS,
          },
          {
            id: 'HEAT_MAP',
            title: 'Heat Map',
            path: '/legacy/heat-map',
            icon: Target,
            allowedRoles: ALL_ROLES,
          }
        ]
      }
    ],
  },
  {
    id: 'risk',
    label: 'RISIKO & PENGAWASAN',
    items: [
      {
        id: 'EWS_RISK',
        title: 'EWS Risk',
        label: 'Peringatan Dini',
        path: '/system/ews',
        icon: AlertOctagon,
        badgeType: 'EWS',
        badgeColor: 'bg-red-500 text-white font-bold',
        allowedRoles: AUDIT_RISK,
      },
      {
        id: 'ANTI_FRAUD_AUDIT',
        title: 'Audit Log',
        path: '/system/audit-log',
        icon: ShieldAlert,
        allowedRoles: AUDIT_RISK,
      },
      {
        id: 'PE_KEPATUHAN',
        title: 'PE Kepatuhan',
        path: '/system/pe-kepatuhan',
        icon: ShieldCheck,
        allowedRoles: AUDIT_RISK,
      },
      {
        id: 'PE_AUDIT',
        title: 'PE Audit',
        path: '/system/pe-audit',
        icon: ShieldCheck,
        allowedRoles: AUDIT_RISK,
      }
    ],
  },
  {
    id: 'system',
    label: 'DATA & SYSTEM',
    items: [
      {
        id: 'DATA_CENTER_CBS',
        title: 'Upload Center',
        path: '/executive/pe-bisnis-upload',
        icon: Database,
        allowedRoles: ['Direktur Utama', 'Direktur YMFK', 'PE Literasi & Edukasi, PE Bisnis & Collection', 'Account Officer', 'Master Admin'],
      },
      {
        id: 'CUSTOMER_360',
        title: 'Customer 360 View',
        icon: UserCheck,
        path: '/crm/360',
        allowedRoles: ['Direktur Utama', 'Direktur YMFK', 'PE Literasi & Edukasi, PE Bisnis & Collection', 'Account Officer', 'Master Admin'],
      },
      {
        id: 'DATA_CENTER',
        title: 'Data Center',
        path: '/system/data-center',
        icon: Sliders,
        allowedRoles: [...DIR_KOM, 'Teknologi Informasi', 'CRM & Digitalisasi', 'Accounting'] as UserRole[],
      }
    ],
  },
  {
    id: 'people',
    label: 'PEOPLE',
    items: [
      {
        id: 'KPI_PERFORMANCE',
        title: 'HR KPI',
        path: '/people/hr-kpi',
        icon: TrendingUp,
        allowedRoles: LEGAL_HR,
      },
      {
        id: 'PAYROLL_MGMT',
        title: 'Payroll',
        path: '/people/payroll',
        icon: WalletCards,
        allowedRoles: LEGAL_HR,
      },
    ]
  }
];