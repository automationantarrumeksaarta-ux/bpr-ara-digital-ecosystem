import React from 'react';
import HeatMapSebaranKredit from './legacy-dashboards/HeatMapSebaranKredit';
import { 
  INITIAL_NPL_DATA, 
  INITIAL_SEBARAN_DATA, 
  INITIAL_AGUNAN_DATA, 
  INITIAL_JANJI_BAYAR_DATA, 
  INITIAL_TARGET_BUNGA_DATA, 
  INITIAL_PENCAPAIAN_BISNIS_DATA 
} from '../../mock/legacyDashboardData';
import { useApp } from '../../context/AppContext';

export const HeatMapView: React.FC = () => {
  const { currentUser } = useApp();
  // Using partial mock data for now to fulfill the UI rendering seamlessly
  return (
    <div className="w-full h-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      <HeatMapSebaranKredit sebaranList={INITIAL_SEBARAN_DATA} />
    </div>
  );
};
