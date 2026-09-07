import React, { useState, useMemo } from 'react';
import { 
  Target, TrendingUp, AlertTriangle, Users, 
  CheckCircle, Plus, Layers, Flag, MapPin,
  Edit2, Trash2, ChevronDown, BarChart
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';

const CURRENT_QUARTER = "Q2 2026 (April - Juni)";

// Data OKR (Objective & Key Results) berdasarkan Lokasi
const INITIAL_OKR_DATABASE: Record<string, any> = {
  'All': {
    objective: "Pertumbuhan Kredit Berkualitas (Konsolidasi)",
    keyResults: [
      {
        id: 'kr-1', title: 'Growth kredit mencapai 15%',
        target: 15, actual: 12, unit: '%', type: 'higher_better',
        mappedKPIs: ['Outstanding Loan', 'Loan Growth'], icon: TrendingUp
      },
      {
        id: 'kr-2', title: 'Menjaga NPL di bawah 3%',
        target: 3, actual: 2.1, unit: '%', type: 'lower_better', 
        mappedKPIs: ['Tingkat NPL'], icon: AlertTriangle
      },
      {
        id: 'kr-3', title: 'Akuisisi 200 nasabah baru',
        target: 200, actual: 115, unit: 'Nasabah', type: 'higher_better',
        mappedKPIs: ['Nasabah Baru (Funding & Lending)', 'CASA Growth'], icon: Users
      }
    ]
  },
  'Pusat': {
    objective: "Ekspansi & Retensi Kualitas (Kantor Pusat)",
    keyResults: [
      {
        id: 'kr-1', title: 'Growth kredit mencapai 15%',
        target: 15, actual: 14.5, unit: '%', type: 'higher_better',
        mappedKPIs: ['Outstanding Loan', 'Loan Growth'], icon: TrendingUp
      },
      {
        id: 'kr-2', title: 'Menjaga NPL di bawah 3%',
        target: 3, actual: 1.8, unit: '%', type: 'lower_better', 
        mappedKPIs: ['Tingkat NPL'], icon: AlertTriangle
      },
      {
        id: 'kr-3', title: 'Akuisisi 80 nasabah baru',
        target: 80, actual: 68, unit: 'Nasabah', type: 'higher_better',
        mappedKPIs: ['Nasabah Baru', 'CASA Growth'], icon: Users
      }
    ]
  },
  'Klodran': {
    objective: "Pemulihan Kualitas Aset (Cabang Klodran)",
    keyResults: [
      {
        id: 'kr-1', title: 'Growth kredit mencapai 15%',
        target: 15, actual: 8, unit: '%', type: 'higher_better',
        mappedKPIs: ['Outstanding Loan', 'Loan Growth'], icon: TrendingUp
      },
      {
        id: 'kr-2', title: 'Menjaga NPL di bawah 3%',
        target: 3, actual: 3.5, unit: '%', type: 'lower_better', 
        mappedKPIs: ['Tingkat NPL'], icon: AlertTriangle
      },
      {
        id: 'kr-3', title: 'Akuisisi 40 nasabah baru',
        target: 40, actual: 18, unit: 'Nasabah', type: 'higher_better',
        mappedKPIs: ['Nasabah Baru'], icon: Users
      }
    ]
  },
  'Matesih': {
    objective: "Pertumbuhan Dana & Kredit (Cabang Matesih)",
    keyResults: [
      {
        id: 'kr-1', title: 'Growth kredit mencapai 12%',
        target: 12, actual: 9, unit: '%', type: 'higher_better',
        mappedKPIs: ['Outstanding Loan', 'Loan Growth'], icon: TrendingUp
      },
      {
        id: 'kr-2', title: 'Menjaga NPL di bawah 4%',
        target: 4, actual: 2.5, unit: '%', type: 'lower_better', 
        mappedKPIs: ['Tingkat NPL'], icon: AlertTriangle
      },
      {
        id: 'kr-3', title: 'Akuisisi 50 nasabah baru',
        target: 50, actual: 25, unit: 'Nasabah', type: 'higher_better',
        mappedKPIs: ['Nasabah Baru'], icon: Users
      }
    ]
  },
  'Jumapolo': {
    objective: "Penetrasi Pasar Mikro (Cabang Jumapolo)",
    keyResults: [
      {
        id: 'kr-1', title: 'Growth kredit mencapai 20%',
        target: 20, actual: 15, unit: '%', type: 'higher_better',
        mappedKPIs: ['Outstanding Loan', 'Loan Growth'], icon: TrendingUp
      },
      {
        id: 'kr-2', title: 'Menjaga NPL di bawah 2.5%',
        target: 2.5, actual: 1.2, unit: '%', type: 'lower_better', 
        mappedKPIs: ['Tingkat NPL'], icon: AlertTriangle
      },
      {
        id: 'kr-3', title: 'Akuisisi 60 nasabah baru',
        target: 60, actual: 40, unit: 'Nasabah', type: 'higher_better',
        mappedKPIs: ['Nasabah Baru'], icon: Users
      }
    ]
  }
};

// --- LOGIC HELPER ---
const calculateKRProgress = (target: number, actual: number, type: string) => {
  if (target === 0) return actual === 0 ? 100 : 0; 
  if (type === 'higher_better') {
    return Math.min(Math.round((actual / target) * 100), 100);
  } else {
    // Logic untuk NPL (Makin rendah makin bagus)
    if (actual <= target) return 100;
    const over = actual - target;
    const penalty = (over / target) * 100;
    return Math.max(Math.round(100 - penalty), 0);
  }
};

const getTrafficLight = (progress: number) => {
  if (progress >= 100) return { color: 'bg-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', label: 'On Track' };
  if (progress >= 70) return { color: 'bg-amber-500', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', label: 'Warning' };
  return { color: 'bg-red-500', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', label: 'Off Track' };
};

export const HrOkrDashboard: React.FC = () => {
  const { currentUser } = useApp();
  const [selectedLocation, setSelectedLocation] = useState('All');

  const isSuperAdmin = currentUser?.role === 'DIREKSI' || currentUser?.role === 'ADMIN';

  // Kalkulasi data OKR yang dipilih (termasuk overall progress dinamis)
  const currentOkrData = useMemo(() => {
    let data = INITIAL_OKR_DATABASE[selectedLocation] || {
      objective: "Data tidak ditemukan untuk lokasi ini",
      keyResults: []
    };
    
    const krs = data.keyResults;
    let overallProgress = 0;
    
    if (krs.length > 0) {
      const totalProg = krs.reduce((acc: number, kr: any) => acc + calculateKRProgress(kr.target, kr.actual, kr.type || 'higher_better'), 0);
      overallProgress = Math.round(totalProg / krs.length);
    }
    
    return { ...data, overallProgress };
  }, [selectedLocation]);

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            Objective & Key Results (OKR)
          </h2>
          <div className="flex items-center gap-2 mt-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Lokasi Penerapan:</span>
            <div className="relative inline-flex items-center">
              <MapPin size={14} className="absolute left-3 text-blue-600 pointer-events-none" />
              <select 
                value={selectedLocation} onChange={(e) => setSelectedLocation(e.target.value)}
                className="pl-8 pr-8 py-1.5 bg-blue-50 border border-blue-200 text-blue-700 font-bold text-xs rounded-full outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer appearance-none shadow-sm transition-all"
              >
                <option value="All">Seluruh Kantor (Konsolidasi)</option>
                <option value="Pusat">Kantor Pusat</option>
                <option value="Matesih">Cabang Matesih</option>
                <option value="Jumapolo">Cabang Jumapolo</option>
                <option value="Klodran">Cabang Klodran</option>
              </select>
              <ChevronDown size={14} className="absolute right-3 text-blue-600 pointer-events-none" />
            </div>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl shadow-sm flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Periode:</span>
            <span className="text-xs font-bold text-slate-800">{CURRENT_QUARTER}</span>
          </div>
          
          {isSuperAdmin && (
            <button className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 px-3 py-1.5 rounded-xl shadow-sm transition-colors">
              <Plus size={14} /> Tambah KR Baru
            </button>
          )}
        </div>
      </div>

      {/* Objective Card (Premium Design) */}
      <div className="relative p-[1.5px] rounded-3xl bg-gradient-to-r from-blue-300 via-indigo-300 to-emerald-300 mb-8 shadow-md">
        <div className="bg-white rounded-[23px] p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-8 h-full w-full relative overflow-hidden">
          
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full blur-3xl opacity-60 -mr-20 -mt-20 pointer-events-none"></div>

          <div className="flex-1 relative z-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-blue-50 text-blue-700 text-[10px] font-black mb-5 uppercase tracking-widest border border-blue-200">
              <Flag size={14} className="text-blue-600" /> Objective Utama
            </div>
            
            <div className="flex items-center gap-3 mb-3">
              <h2 className="text-2xl md:text-3xl font-black text-slate-900 leading-tight">
                {currentOkrData.objective}
              </h2>
              {isSuperAdmin && (
                <button className="p-1.5 text-slate-500 bg-slate-100 hover:bg-blue-600 hover:text-white rounded-lg transition-colors shadow-sm">
                  <Edit2 size={16} />
                </button>
              )}
            </div>

            <p className="text-slate-500 text-sm md:text-base leading-relaxed max-w-2xl font-medium">
              Fokus kuartal ini untuk lokasi <strong className="text-slate-800">{selectedLocation === 'All' ? 'Seluruh Kantor' : selectedLocation}</strong> adalah ekspansi portofolio kredit secara agresif namun tetap mempertahankan kualitas aset dan mitigasi risiko NPL.
            </p>
          </div>

          {/* Overall Progress Circle */}
          <div className="flex-shrink-0 relative flex items-center justify-center w-36 h-36 md:mr-4 z-10">
            <svg className="w-full h-full transform -rotate-90 drop-shadow-sm" viewBox="0 0 36 36">
              <path className="text-slate-100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="4" />
              <path
                className="text-blue-600 transition-all duration-1000 ease-out"
                strokeDasharray={`${currentOkrData.overallProgress}, 100`}
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-4xl font-black text-slate-900">{currentOkrData.overallProgress}%</span>
              <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-1 text-center leading-tight">Average<br/>Progress</span>
            </div>
          </div>
        </div>
      </div>

      {/* Key Results List */}
      <div className="flex items-center gap-2 mb-4 border-b border-slate-200 pb-2">
        <Layers className="text-blue-600" size={20} />
        <h3 className="text-lg font-bold text-slate-900">Key Results (KR)</h3>
      </div>

      {currentOkrData.keyResults.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500 text-sm shadow-sm font-medium">
          Belum ada Key Result untuk lokasi ini.
        </div>
      ) : (
        <div className="space-y-4">
          {currentOkrData.keyResults.map((kr: any, index: number) => {
            const progress = calculateKRProgress(kr.target, kr.actual, kr.type);
            const status = getTrafficLight(progress);
            const Icon = kr.icon || Target;

            return (
              <div key={kr.id} className="bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-md transition-all group relative">
                
                {isSuperAdmin && (
                  <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10 bg-white p-1 rounded-lg border border-slate-100 shadow-sm">
                    <button className="p-1.5 text-blue-600 bg-blue-50 hover:bg-blue-600 hover:text-white rounded-md transition-colors">
                      <Edit2 size={14} />
                    </button>
                    <button className="p-1.5 text-red-500 bg-red-50 hover:bg-red-500 hover:text-white rounded-md transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}

                <div className="flex flex-col lg:flex-row gap-6">
                  {/* Left: Info */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-start gap-3">
                        <div className={`p-2.5 rounded-xl ${status.bg} ${status.text} border ${status.border} transition-colors mt-0.5`}>
                          <Icon size={20} />
                        </div>
                        <div>
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Key Result {index + 1}</span>
                          <h4 className="text-base font-bold text-slate-900 leading-tight mt-1 pr-12 lg:pr-0">{kr.title}</h4>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 lg:ml-[52px]">
                      <span className="text-[10px] text-slate-500 font-bold mb-2 block uppercase tracking-wider">Mapping KPI Operasional:</span>
                      <div className="flex flex-wrap gap-2">
                        {kr.mappedKPIs?.map((kpi: string, i: number) => (
                          <span key={i} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-md">
                            <BarChart size={12} className="text-slate-400" />
                            {kpi}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right: Progress & Traffic Light */}
                  <div className="lg:w-[40%] flex flex-col justify-center border-t lg:border-t-0 lg:border-l border-slate-100 pt-5 lg:pt-0 lg:pl-8">
                    <div className="flex justify-between items-end mb-3">
                      <div>
                        <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-1">Realisasi Saat Ini</div>
                        <div className="text-xl font-black text-slate-900">
                          {kr.actual} <span className="text-sm font-semibold text-slate-500">{kr.unit}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-1">Target Threshold</div>
                        <div className="text-sm font-bold text-slate-700">
                          {kr.type === 'lower_better' ? 'Maks ' : ''}{kr.target} {kr.unit}
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="relative pt-1">
                      <div className="overflow-hidden h-2.5 mb-3 text-xs flex rounded-full bg-slate-100 border border-slate-200/50 shadow-inner">
                        <div 
                          style={{ width: `${progress}%` }} 
                          className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center transition-all duration-1000 ease-out ${status.color}`}
                        ></div>
                      </div>
                      <div className="flex justify-between items-center">
                         <span className={`text-[10px] font-black px-2 py-0.5 uppercase tracking-wider rounded-md border ${status.text} ${status.bg} ${status.border}`}>
                           {status.label}
                         </span>
                         <span className={`text-xs font-black ${status.text}`}>{progress}% Tercapai</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
