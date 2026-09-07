import React, { useState } from 'react';
import { Target, Layers, Briefcase, ChevronRight } from 'lucide-react';
import { HrKpiDashboard } from './hr-kpi/HrKpiDashboard';
import { HrOkrDashboard } from './hr-kpi/HrOkrDashboard';
import { HrProjectDashboard } from './hr-kpi/HrProjectDashboard';

type TabId = 'kpi' | 'okr' | 'project';

export const HrKpiView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('kpi');

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header Banner */}
      <div className="p-6 rounded-[24px] bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 shadow-lg relative overflow-hidden">
        {/* Dekorasi BG */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-blue-500 rounded-full blur-[80px] opacity-20 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-48 h-48 bg-emerald-500 rounded-full blur-[60px] opacity-20 pointer-events-none"></div>

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">
                HUMAN CAPITAL PERFORMANCE
              </span>
              <span className="px-2 py-0.5 rounded-md bg-white/10 text-white text-[10px] font-bold border border-white/20 backdrop-blur-sm">
                Target vs Realisasi
              </span>
            </div>
            <h1 className="text-2xl font-black text-white mt-1">Master Karyawan, KPI & OKR</h1>
            <p className="text-xs text-slate-300 mt-1.5 font-medium max-w-xl leading-relaxed">
              Sistem manajemen performa terintegrasi untuk melacak indikator kinerja individu, tujuan strategis cabang, dan inisiatif proyek khusus.
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mt-8 flex items-center gap-2 overflow-x-auto pb-2 relative z-10 no-scrollbar">
          <button
            onClick={() => setActiveTab('kpi')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap
              ${activeTab === 'kpi' 
                ? 'bg-blue-600 text-white shadow-md' 
                : 'bg-white/10 text-slate-300 hover:bg-white/20 hover:text-white backdrop-blur-sm'
              }`}
          >
            <Target size={18} />
            KPI Karyawan & Disiplin
          </button>
          
          <button
            onClick={() => setActiveTab('okr')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap
              ${activeTab === 'okr' 
                ? 'bg-blue-600 text-white shadow-md' 
                : 'bg-white/10 text-slate-300 hover:bg-white/20 hover:text-white backdrop-blur-sm'
              }`}
          >
            <Layers size={18} />
            OKR Kantor Cabang
          </button>

          <button
            onClick={() => setActiveTab('project')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap
              ${activeTab === 'project' 
                ? 'bg-blue-600 text-white shadow-md' 
                : 'bg-white/10 text-slate-300 hover:bg-white/20 hover:text-white backdrop-blur-sm'
              }`}
          >
            <Briefcase size={18} />
            Project Lintas Divisi
          </button>
        </div>
      </div>

      {/* Tab Content Rendering */}
      <div className="mt-2">
        {activeTab === 'kpi' && <HrKpiDashboard />}
        {activeTab === 'okr' && <HrOkrDashboard />}
        {activeTab === 'project' && <HrProjectDashboard />}
      </div>

    </div>
  );
};
