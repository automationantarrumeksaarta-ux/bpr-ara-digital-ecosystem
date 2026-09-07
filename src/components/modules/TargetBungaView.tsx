import React from 'react';
import DashboardRasioBungaAO from './legacy-dashboards/DashboardRasioBungaAO';

import { useApp } from '../../context/AppContext';

export const TargetBungaView: React.FC = () => {
  const { targetBungaData } = useApp();
  return (
    <div className="w-full h-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      <DashboardRasioBungaAO bungaList={targetBungaData} onAddBunga={() => {}} />
    </div>
  );
};
