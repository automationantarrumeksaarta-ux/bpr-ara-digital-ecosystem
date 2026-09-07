import React, { useState } from 'react';
import { DataProvider, useData } from '../../context/FundingContext';
import { MainDashboard } from './funding/MainDashboard';
import { PortfolioPage } from './funding/PortfolioPage';
import { DailyPage } from './funding/DailyPage';
import { OfficeDetailPage } from './funding/OfficeDetailPage';
import { ExecutivePage } from './funding/ExecutivePage';
import { TargetsPage } from './funding/TargetsPage';
import { SourcesPage } from './funding/SourcesPage';
import { ReportsPage } from './funding/ReportsPage';
import { ImportPage } from './funding/ImportPage';
import { SettingsPage } from './funding/SettingsPage';
import { AddDataModal } from './funding/AddDataModal';
import { FundingFilters } from './funding/FundingFilters';
import { PageContainer, PageHeader } from '../ui/PageContainer';
import { Button } from '../ui/Button';

import {
  LayoutDashboard,
  Layers,
  TrendingUp,
  Building2,
  Sparkles,
  Target,
  Users,
  FileText,
  Upload,
  Settings,
  Plus,
  MessageSquare,
  FileSpreadsheet
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type NavigationTab =
  | 'dashboard'
  | 'portfolio'
  | 'daily'
  | 'office-detail'
  | 'executive'
  | 'targets'
  | 'sources'
  | 'reports'
  | 'import'
  | 'settings';

const FundingContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavigationTab>('dashboard');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalDefaultTab, setModalDefaultTab] = useState<'daily' | 'portfolio'>('daily');

  const { selectedOfficeName, setSelectedKasOffice } = useData() || {};

  const handleSelectOffice = (officeName: string) => {
    if (setSelectedKasOffice) setSelectedKasOffice(officeName);
    setActiveTab('office-detail');
  };

  const handleOpenModal = (tab: 'daily' | 'portfolio' = 'daily') => {
    setModalDefaultTab(tab);
    setIsModalOpen(true);
  };

  const navItems = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'portfolio', label: 'Snapshot', icon: Layers },
    { id: 'daily', label: 'Harian', icon: TrendingUp },
    { id: 'executive', label: 'Executive', icon: Sparkles },
    { id: 'targets', label: 'Target', icon: Target },
    { id: 'sources', label: 'Direktori', icon: Users },
    { id: 'office-detail', label: 'Kantor Kas', icon: Building2 },
    { id: 'reports', label: 'Laporan', icon: FileText },
    { id: 'import', label: 'Import', icon: Upload },
    { id: 'settings', label: 'Pengaturan', icon: Settings },
  ];

  const renderActivePage = () => {
    switch (activeTab) {
      case 'dashboard': return <MainDashboard onSelectOffice={handleSelectOffice} onOpenModal={handleOpenModal} />;
      case 'portfolio': return <PortfolioPage onSelectOffice={handleSelectOffice} onOpenModal={handleOpenModal} />;
      case 'daily': return <DailyPage onSelectOffice={handleSelectOffice} onOpenModal={handleOpenModal} />;
      case 'office-detail': return <OfficeDetailPage />;
      case 'executive': return <ExecutivePage onSelectOffice={handleSelectOffice} />;
      case 'targets': return <TargetsPage />;
      case 'sources': return <SourcesPage />;
      case 'reports': return <ReportsPage />;
      case 'import': return <ImportPage />;
      case 'settings': return <SettingsPage />;
      default: return <MainDashboard onSelectOffice={handleSelectOffice} onOpenModal={handleOpenModal} />;
    }
  };

  return (
    <PageContainer>
      <PageHeader 
        title="Penghimpunan Dana & Kampanye"
        description="Monitoring Tabungan & Deposito"
        badge="LIVE"
        badgeVariant="info"
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => setActiveTab('reports')}>
              <MessageSquare className="w-4 h-4 mr-2" /> Format WA
            </Button>
            <Button variant="outline" size="sm" onClick={() => setActiveTab('import')}>
              <FileSpreadsheet className="w-4 h-4 mr-2" /> Import
            </Button>
            <Button variant="primary" size="sm" onClick={() => handleOpenModal('daily')}>
              <Plus className="w-4 h-4 mr-2" /> Tambah Data
            </Button>
          </>
        }
      />

      {/* Filters (Extracted from old Header) */}
      <FundingFilters />

      {/* Horizontal Nav - Segmented Control */}
      <div className="flex overflow-x-auto hide-scrollbar pb-2 mt-4">
        <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl min-w-max gap-1">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as NavigationTab)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  isActive 
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' 
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-700/50'
                }`}
              >
                <Icon className="w-4 h-4" /> {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Dynamic Page Content */}
      <div className="relative mt-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {renderActivePage()}
          </motion.div>
        </AnimatePresence>
      </div>

      <AddDataModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        defaultTab={modalDefaultTab}
      />
    </PageContainer>
  );
};

export const FundingDashboardView: React.FC = () => {
  return (
    <DataProvider>
      <FundingContent />
    </DataProvider>
  );
};
