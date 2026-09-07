import React, { useState } from 'react';
import {
  Building2,
  Search,
  Bot,
  Bell,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  Shield,
  Fingerprint,
  UserCheck,
  Sparkles,
  Layers,
  ArrowRight,
  LogOut,
  Users,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../types';
import { NotificationInboxPopover } from '../ui/notification-inbox-popover';
import StrukturManajemenModal from './StrukturManajemenModal';

export const Navbar: React.FC = () => {
  const {
    currentUser,
    switchUserByRole,
    allUsers,
    branches,
    selectedBranchId,
    setSelectedBranchId,
    setIsGlobalSearchOpen,
    isAiAssistantOpen,
    setIsAiAssistantOpen,
    notifications,
    markNotificationAsRead,
    openCustomer360,
    setActiveModule,
    ewsAlerts,
    creditApplications,
  } = useApp();

  const [isRoleMenuOpen, setIsRoleMenuOpen] = useState(false);
  const [isOrgModalOpen, setIsOrgModalOpen] = useState(false);

  const redAlertsCount = ewsAlerts.filter((a) => a.severity === 'RED' && a.status !== 'RESOLVED').length;
  const pendingApprovalsCount = creditApplications.filter((a) => a.currentStage === 'CREDIT_COMMITTEE').length;

  const roleOptions: { role: UserRole; label: string; name: string }[] = [
    { role: 'Direktur Utama', label: 'Direktur Utama', name: 'M. Rizky Hidayat S.' },
    { role: 'Direktur YMFK', label: 'Direktur YMFK', name: 'Tunggul Wisnu Hadi' },
    { role: 'Komisaris Utama', label: 'Komisaris Utama', name: 'Taka Ditya Darma' },
    { role: 'PE Bisnis & Collection', label: 'PE Bisnis', name: 'Eny Setyoningsih' },
    { role: 'PE Kepatuhan, Manrisk & LK', label: 'PE Kepatuhan', name: 'Huda Asrori' },
    { role: 'PE Audit Intern & Anti Fraud', label: 'PE Audit', name: 'Agus Santoso' },
    { role: 'CRM & Digitalisasi', label: 'CRM & Digital', name: 'Ahmad Wahyu Aji' },
    { role: 'Account Officer', label: 'Marketing AO', name: 'AO BPR ARA' },
    { role: 'Analis Kredit', label: 'Analis', name: 'Agung Bekti' },
    { role: 'Admin Legal & SDM', label: 'Admin Legal', name: 'Lilis Ariyani' },
    { role: 'Kepala Kas', label: 'Kepala Kas', name: 'Memet Fianka' },
    { role: 'Master Admin', label: 'Master Admin', name: 'System Administrator' },
  ];

  return (
    <header className="h-20 shrink-0 bg-transparent flex items-center justify-between px-6 sm:px-8 sticky top-0 z-40 transition-all duration-300">
      {/* Left: Global Search (floating) */}
      <div className="flex-1 max-w-md hidden md:block">
        <button
          onClick={() => setIsGlobalSearchOpen(true)}
          className="flex items-center gap-3 w-full bg-transparent text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all text-[15px] cursor-pointer group"
        >
          <Search className="w-5 h-5 text-gray-400 group-hover:text-gray-800 dark:group-hover:text-gray-200" strokeWidth={1.5} />
          <span className="text-left">Search customer...</span>
        </button>
      </div>



      {/* Middle: Global Omnisearch Trigger */}
      {/* Right Controls */}
      <div className="flex items-center gap-4 sm:gap-6 ml-auto">
        {/* System Live Status */}
        <div className="hidden lg:flex items-center gap-1.5 text-xs font-semibold text-slate-500 px-2 py-1 bg-slate-50 border border-slate-200/80 rounded-lg">
          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          <span>Live</span>
        </div>

        {/* Mobile Search Button */}
        <button
          onClick={() => setIsGlobalSearchOpen(true)}
          className="md:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
          title="Cari"
        >
          <Search className="w-5 h-5" />
        </button>


        {/* Quick Indicators (EWS & Approval Badges) */}
        {redAlertsCount > 0 && (
          <button
            onClick={() => setActiveModule('EWS_RISK')}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-50 text-red-700 border border-red-200 text-xs font-semibold hover:bg-red-100 transition-colors"
            title="EWS Merah Aktif"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
            <span className="hidden lg:inline">EWS:</span>
            <div className="hidden lg:block h-5 w-[1px] bg-gray-200 dark:bg-gray-800 mx-1" />
            <span className="font-bold">{redAlertsCount}</span>
          </button>
        )}

        {/* Org Directory Button */}
        <button
          onClick={() => setIsOrgModalOpen(true)}
          className="relative flex items-center justify-center h-10 px-3 gap-2 text-slate-600 dark:text-slate-300 bg-white dark:bg-[#18181B] border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors shadow-sm"
          title="Direktori Organisasi"
        >
          <Users className="w-4 h-4" strokeWidth={2} />
          <span className="text-xs font-bold">Direktori Organisasi</span>
        </button>

        {/* Notifications Popover */}
        <NotificationInboxPopover />

      </div>
      {/* Render Struktur Manajemen Modal */}
      <StrukturManajemenModal 
        isOpen={isOrgModalOpen} 
        onClose={() => setIsOrgModalOpen(false)} 
      />
    </header>
  );
};
