import React from 'react';
import { Outlet } from 'react-router-dom';
import MobileBottomNav from './MobileBottomNav';

export const MobileLayout: React.FC = () => {
  return (
    <div className="bg-[#f0f2f5] dark:bg-black min-h-screen flex justify-center">
      {/* Mobile Frame Container */}
      <div className="w-full max-w-md bg-[#f8fafc] dark:bg-gray-900 min-h-screen relative shadow-2xl flex flex-col overflow-hidden">
        {/* Main Content Area (Scrollable) */}
        <div className="flex-1 overflow-y-auto pb-24 scrollbar-hide">
          <Outlet />
        </div>
        
        {/* Bottom Navigation */}
        <MobileBottomNav />
      </div>
    </div>
  );
};
