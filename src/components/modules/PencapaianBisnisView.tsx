import React from 'react';
import DashboardPencapaianBisnis from './legacy-dashboards/DashboardPencapaianBisnis';

import { useApp } from '../../context/AppContext';

export const PencapaianBisnisView: React.FC = () => {
  const { pencapaianBisnisData } = useApp();
  return (
    <div className="w-full h-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      <DashboardPencapaianBisnis bisnisList={pencapaianBisnisData} onAddBisnis={() => {}} />
    </div>
  );
};
