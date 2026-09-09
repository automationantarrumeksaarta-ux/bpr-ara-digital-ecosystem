import React from 'react';
import { DashboardHeatMap } from './DashboardHeatMap';

export const PeKepatuhanView: React.FC = () => {
  return (
    <div className="w-full h-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      <DashboardHeatMap />
    </div>
  );
};
