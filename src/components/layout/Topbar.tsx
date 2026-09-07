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
  Menu,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../types';
import { NotificationInboxPopover } from '../ui/notification-inbox-popover';
import StrukturManajemenModal from '../common/StrukturManajemenModal';
import { Breadcrumb } from './Breadcrumb';
import { useNavigate } from 'react-router-dom';

interface TopbarProps {
  onMobileMenuToggle: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({ onMobileMenuToggle }) => {
  const navigate = useNavigate();
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
    ewsAlerts,
    creditApplications,
  } = useApp();

  const [isRoleMenuOpen, setIsRoleMenuOpen] = useState(false);
  const [isOrgModalOpen, setIsOrgModalOpen] = useState(false);

  const redAlertsCount = ewsAlerts.filter((a) => a.severity === 'RED' && a.status !== 'RESOLVED').length;
  
  const roleOptions = allUsers.map(u => ({
    role: u.role,
    label: u.roleTitle,
    name: u.name
  }));

  const handleRoleSwitch = (role: UserRole) => {
    switchUserByRole(role);
    setIsRoleMenuOpen(false);
    
    // Auto navigation to match context switch logic
    switch (role) {
      case 'Surveyor': navigate('/business/credit/survey'); break;
      case 'Analis Kredit': navigate('/business/credit/analysis'); break;
      case 'Account Officer': navigate('/customer/360'); break;
      case 'Staff Collection': navigate('/operations/collection'); break;
      case 'Pengembangan SDM': navigate('/people/hr-kpi'); break;
      case 'PE Kepatuhan, Manrisk & LK':
      case 'PE Audit Intern & Anti Fraud':
        navigate('/system/ews'); break;
      case 'Admin Legal': navigate('/business/credit/legal'); break;
      default: navigate('/dashboard'); break;
    }
  };

  return (
    <header className="h-16 lg:h-20 shrink-0 bg-surface border-b border-border flex items-center justify-between px-4 sm:px-6 lg:px-8 sticky top-0 z-30 transition-all duration-300">
      
      {/* Mobile Menu Toggle & Breadcrumb */}
      <div className="flex items-center gap-4 flex-1">
        <button
          onClick={onMobileMenuToggle}
          className="lg:hidden p-2 -ml-2 text-slate-600 hover:text-slate-900 rounded-lg"
          title="Menu"
        >
          <Menu className="w-6 h-6" />
        </button>
        
        {/* Breadcrumb replaces the old search bar position in desktop */}
        <div className="hidden lg:block">
          <Breadcrumb />
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3 sm:gap-6 ml-auto">
        

        {/* EWS Badge */}
        {redAlertsCount > 0 && (
          <button
            onClick={() => navigate('/system/ews')}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-50 text-red-700 border border-red-200 text-xs font-semibold hover:bg-red-100 transition-colors"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
            <span className="font-bold">{redAlertsCount}</span>
          </button>
        )}

        {/* Org Directory Button */}
        <button
          onClick={() => setIsOrgModalOpen(true)}
          className="hidden sm:flex relative items-center justify-center h-10 px-3 gap-2 text-slate-600 dark:text-slate-300 bg-white dark:bg-[#18181B] border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
        >
          <Users className="w-4 h-4" strokeWidth={2} />
        </button>

        {/* Notifications */}
        <NotificationInboxPopover />

        {/* Logout Button */}
        <button
          onClick={() => {
            localStorage.removeItem('auth_token');
            setIsAuthenticated(false);
            window.location.reload();
          }}
          className="hidden sm:flex relative items-center justify-center h-10 px-3 gap-2 text-red-600 dark:text-red-400 bg-white dark:bg-[#18181B] border border-red-200 dark:border-red-900/50 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors shadow-sm"
          title="Logout"
        >
          <LogOut className="w-4 h-4" strokeWidth={2} />
        </button>

      </div>
      
      <StrukturManajemenModal 
        isOpen={isOrgModalOpen} 
        onClose={() => setIsOrgModalOpen(false)} 
      />
    </header>
  );
};
