import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { Customer360Modal } from '../common/Customer360Modal';
import { GlobalSearchModal } from '../common/GlobalSearchModal';
import { AiAssistantDrawer } from '../common/AiAssistantDrawer';
import { GoogleCalendarModal } from '../common/GoogleCalendarModal';
import { useApp } from '../../context/AppContext';

export const AppShell: React.FC = () => {
  const { flowTasks } = useApp();
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  // Close mobile menu on route change
  React.useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <div className="flex h-screen w-full app-bg-gradient text-gray-900 dark:text-gray-100 font-sans overflow-hidden selection:bg-blue-600 selection:text-white">
      {/* Sidebar */}
      <Sidebar 
        onOpenCalendarSync={() => setIsCalendarModalOpen(true)} 
        isMobileOpen={isMobileMenuOpen}
        onMobileClose={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Top Navbar */}
        <Topbar onMobileMenuToggle={() => setIsMobileMenuOpen(true)} />

        {/* View Area - Router Outlet */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 transition-all duration-300 relative z-10">
          <div className="max-w-7xl mx-auto pb-12">
            <Outlet />
          </div>
        </div>
      </main>

      {/* Global Modals & Drawers */}
      <Customer360Modal />
      <GlobalSearchModal />
      <AiAssistantDrawer />
      
      {/* Google Calendar Sync Modal */}
      {isCalendarModalOpen && (
        <GoogleCalendarModal
          tasks={flowTasks}
          onClose={() => setIsCalendarModalOpen(false)}
        />
      )}
    </div>
  );
};
