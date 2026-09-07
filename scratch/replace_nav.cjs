const fs = require('fs');

const content = `import React from 'react';
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
} from 'lucide-react';
import { AppModuleId } from '../context/AppContext';
import { UserRole } from '../types';

export interface NavItem {
  id: AppModuleId;
  title: string;
  path: string;
  icon: React.ElementType;
  allowedRoles?: UserRole[];
  badgeType?: 'APPROVALS' | 'EWS' | 'PTP' | 'TASKS';
  badgeColor?: string;
}

export interface NavGroup {
  id: string;
  label: string;
  items: NavItem[];
}

const ALL_ROLES: UserRole[] = [
  'Komisaris Utama', 'Komisaris', 'Direktur Utama', 'Direktur YMFK', 'Direktur',
  'PE Audit Intern & Anti Fraud', 'PE Kepatuhan, Manrisk & LK', 'PE Bisnis & Collection', 'Kepatuhan',
  'Teknologi Informasi', 'CRM & Digitalisasi', 'Admin Legal & SDM', 'Admin Legal', 'Pengembangan SDM',
  'Accounting', 'Analis Kredit', 'Bagian Umum', 'Customer Service',
  'Kepala Cabang', 'Kepala Kas', 'Teller', 'Marketing Dana (Funding)', 'Account Officer', 'Surveyor',
  'Koordinator Collection', 'Staff Collection'
];

const DIR_KOM = ['Komisaris Utama', 'Komisaris', 'Direktur Utama', 'Direktur YMFK', 'Direktur'];
const BISNIS = [...DIR_KOM, 'PE Bisnis & Collection', 'Kepala Cabang', 'Kepala Kas', 'Account Officer', 'Marketing Dana (Funding)'];
const KREDIT = [...DIR_KOM, 'PE Bisnis & Collection', 'Kepala Cabang', 'Analis Kredit'];
const COLLECTION = [...DIR_KOM, 'PE Bisnis & Collection', 'Kepala Cabang', 'Koordinator Collection', 'Staff Collection'];
const LEGAL_HR = [...DIR_KOM, 'Admin Legal & SDM', 'Admin Legal', 'Pengembangan SDM'];
const AUDIT_RISK = [...DIR_KOM, 'PE Audit Intern & Anti Fraud', 'PE Kepatuhan, Manrisk & LK', 'Kepatuhan'];

export const navigationConfig: NavGroup[] = [
  {
    id: 'executive',
    label: 'EXECUTIVE',
    items: [
      {
        id: 'EXECUTIVE_DASHBOARD',
        title: 'Executive Dashboard',
        path: '/dashboard',
        icon: LayoutDashboard,
        allowedRoles: DIR_KOM,
      },
      {
        id: 'PE_BISNIS',
        title: 'PE Bisnis & Target AO',
        path: '/executive/pe-bisnis',
        icon: LayoutDashboard,
        allowedRoles: [...DIR_KOM, 'PE Bisnis & Collection'],
      },
    ],
  },
  {
    id: 'customer',
    label: 'CUSTOMER',
    items: [
      {
        id: 'CRM_CUSTOMERS',
        title: 'CRM & Customer 360',
        path: '/customer/360',
        icon: Users,
        allowedRoles: BISNIS,
      },
      {
        id: 'MARKETING_ACTIVITY',
        title: 'Aktivitas Marketing',
        path: '/customer/marketing',
        icon: Target,
        allowedRoles: BISNIS,
      },
    ],
  },
  {
    id: 'business',
    label: 'BUSINESS',
    items: [
      {
        id: 'FUNDING_DASHBOARD',
        title: 'Penghimpunan Dana',
        path: '/business/funding',
        icon: PiggyBank,
        allowedRoles: BISNIS,
      },
      {
        id: 'LOS_CREDIT',
        title: 'Aplikasi Kredit & LOS',
        path: '/business/credit/los',
        icon: FileText,
        allowedRoles: [...KREDIT, 'Account Officer'],
      },
      {
        id: 'OTS_SURVEY',
        title: 'BPR ARA Super App (Karyawan)',
        path: '/business/credit/survey',
        icon: Camera,
        allowedRoles: ['Account Officer', 'Marketing Dana (Funding)', 'Surveyor', 'Koordinator Collection', 'Staff Collection'],
      },
      {
        id: 'CREDIT_ANALYSIS',
        title: 'Analisis Kredit 5C',
        path: '/business/credit/analysis',
        icon: LineChart,
        allowedRoles: KREDIT,
      },
      {
        id: 'COLLATERAL_APPRAISAL',
        title: 'Penilaian Agunan & LTV',
        path: '/business/credit/appraisal',
        icon: ShieldCheck,
        allowedRoles: [...KREDIT, 'Admin Legal & SDM', 'Admin Legal'],
      },
      {
        id: 'CREDIT_APPROVAL',
        title: 'Persetujuan Komite Kredit',
        path: '/business/credit/approval',
        icon: CheckSquare,
        badgeType: 'APPROVALS',
        badgeColor: 'bg-amber-500 text-slate-900 font-bold',
        allowedRoles: [...DIR_KOM, 'PE Bisnis & Collection', 'PE Kepatuhan, Manrisk & LK', 'Kepala Cabang', 'Kepala Kas'],
      },
      {
        id: 'LEGAL_DOCUMENTS',
        title: 'Legalitas & Dokumen',
        path: '/business/credit/legal',
        icon: FileBadge,
        allowedRoles: LEGAL_HR,
      },
      {
        id: 'DISBURSEMENT_PORTFOLIO',
        title: 'Pencairan Kredit',
        path: '/business/credit/disbursement',
        icon: Send,
        allowedRoles: [...LEGAL_HR, 'Account Officer'],
      },
      {
        id: 'TARGET_BUNGA',
        title: 'Rasio Target Bunga',
        path: '/business/target-bunga',
        icon: Target,
        allowedRoles: BISNIS,
      },
      {
        id: 'PENCAPAIAN_BISNIS',
        title: 'Pencapaian Bisnis AO',
        path: '/business/pencapaian-bisnis',
        icon: Target,
        allowedRoles: BISNIS,
      },
    ],
  },
  {
    id: 'operations',
    label: 'OPERATIONS',
    items: [
      {
        id: 'COLLECTION_MGMT',
        title: 'Manajemen Penagihan',
        path: '/operations/collection',
        icon: BadgeAlert,
        allowedRoles: COLLECTION,
      },
      {
        id: 'PTP_TRACKER',
        title: 'Janji Bayar (PTP)',
        path: '/operations/collection/ptp',
        icon: CalendarClock,
        badgeType: 'PTP',
        badgeColor: 'bg-blue-500 text-white',
        allowedRoles: COLLECTION,
      },
      {
        id: 'NPL_RESTRUCTURING',
        title: 'NPL & Restrukturisasi 3R',
        path: '/operations/collection/npl',
        icon: RefreshCw,
        allowedRoles: [...COLLECTION, 'Analis Kredit'],
      },
      {
        id: 'FLOW_TASKS',
        title: 'FlowTask Workspace',
        path: '/operations/tasks',
        icon: KanbanSquare,
        badgeType: 'TASKS',
        badgeColor: 'bg-indigo-500 text-white',
        allowedRoles: ALL_ROLES,
      },
      {
        id: 'REPORTS_BEIS',
        title: 'Laporan BEIS',
        path: '/operations/reports/beis',
        icon: FileText,
        allowedRoles: [...DIR_KOM, 'PE Bisnis & Collection', 'Kepala Cabang'],
      },
      {
        id: 'DECISION_QUEUE',
        title: 'Antrean Keputusan',
        path: '/operations/decision-queue',
        icon: CheckSquare,
        allowedRoles: [...DIR_KOM, 'PE Bisnis & Collection', 'Kepala Cabang'],
      },
    ],
  },
  {
    id: 'people',
    label: 'PEOPLE',
    items: [
      {
        id: 'KPI_PERFORMANCE',
        title: 'Kinerja, KPI & OKR',
        path: '/people/hr-kpi',
        icon: TrendingUp,
        allowedRoles: LEGAL_HR,
      },
      {
        id: 'PAYROLL_MGMT',
        title: 'Penggajian & Reward Terpadu',
        path: '/people/payroll',
        icon: WalletCards,
        allowedRoles: LEGAL_HR,
      },
    ],
  },
  {
    id: 'system',
    label: 'SYSTEM',
    items: [
      {
        id: 'EWS_RISK',
        title: 'Early Warning System (EWS)',
        path: '/system/ews',
        icon: AlertOctagon,
        badgeType: 'EWS',
        badgeColor: 'bg-red-500 text-white font-bold',
        allowedRoles: AUDIT_RISK,
      },
      {
        id: 'PE_KEPATUHAN',
        title: 'PE Kepatuhan & Risk',
        path: '/system/pe-kepatuhan',
        icon: ShieldCheck,
        allowedRoles: AUDIT_RISK,
      },
      {
        id: 'PE_AUDIT',
        title: 'PE Audit Intern',
        path: '/system/pe-audit',
        icon: ShieldCheck,
        allowedRoles: AUDIT_RISK,
      },
      {
        id: 'COMPLIANCE',
        title: 'Kepatuhan & APU-PPT',
        path: '/system/compliance',
        icon: Scale,
        allowedRoles: AUDIT_RISK,
      },
      {
        id: 'ANTI_FRAUD_AUDIT',
        title: 'Anti-Fraud & Audit Trail',
        path: '/system/anti-fraud',
        icon: ShieldAlert,
        allowedRoles: AUDIT_RISK,
      },
      {
        id: 'DATA_CENTER_CBS',
        title: 'Data Center CBS',
        path: '/system/data-center',
        icon: Sliders,
        allowedRoles: [...DIR_KOM, 'Teknologi Informasi', 'CRM & Digitalisasi', 'Accounting'],
      },
      {
        id: 'MASTER_SETTINGS',
        title: 'Master Data & Pengaturan',
        path: '/system/settings',
        icon: Sliders,
        allowedRoles: ['Direktur Utama', 'Teknologi Informasi'],
      },
    ],
  },
];`;
fs.writeFileSync('src/config/navigationConfig.ts', content, 'utf8');
