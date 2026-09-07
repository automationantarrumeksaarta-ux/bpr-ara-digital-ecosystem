import React from 'react';
import DashboardKreditBermasalah from './legacy-dashboards/DashboardKreditBermasalah';
import { 
  INITIAL_NPL_DATA, 
  INITIAL_SEBARAN_DATA, 
  INITIAL_AGUNAN_DATA, 
  INITIAL_JANJI_BAYAR_DATA, 
  INITIAL_TARGET_BUNGA_DATA, 
  INITIAL_PENCAPAIAN_BISNIS_DATA 
} from '../../mock/legacyDashboardData';
import { useApp } from '../../context/AppContext';

export const NplRestructuringView: React.FC = () => {
  const { currentUser } = useApp();
  // Using partial mock data for now to fulfill the UI rendering seamlessly
  return (
    <div className="w-full h-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 flex items-center gap-2">
        <span className="text-[10px] font-black text-slate-400 tracking-widest uppercase">
          COLLECTION & RECOVERY / NPL & RESTRUCTURING
        </span>
      </div>
      <DashboardKreditBermasalah nplList={INITIAL_NPL_DATA} onUpdateItem={() => {}} onAddItem={() => {}} currentUser={{id:"1", fullName:"Admin", role:"Master Admin", email:"admin@bprara.co.id"}} />
    </div>
  );
};
