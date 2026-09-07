import React from 'react';
import DashboardPeBisnis from './legacy-dashboards/DashboardPeBisnis';
import { useApp } from '../../context/AppContext';

export const PeBisnisView: React.FC = () => {
  const { macroMetrics } = useApp();
  
  return (
    <div className="w-full h-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      <DashboardPeBisnis macroMetrics={macroMetrics} />
    </div>
  );
};
