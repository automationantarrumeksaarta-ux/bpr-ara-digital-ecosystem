import React, { useState, useMemo } from 'react';
import { 
  Target, TrendingUp, AlertTriangle, Users, DollarSign, Activity, 
  ChevronDown, Plus, Trash2, Edit2, Clock, CalendarCheck, 
  UserMinus, ShieldCheck, ListTodo, Smartphone, Briefcase,
  Award, Paperclip, XCircle, CheckCircle2
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';

// --- MOCK DATABASE ---
const CURRENT_MONTH = "April 2026";

const INITIAL_DB = [
  {
    id: 'AO-001',
    name: "Eko Prabowo",
    role: "Account Officer",
    branch: "Pusat",
    kpis: [
      { id: 'kpi-1', title: 'Outstanding Loan', target: 5000000000, actual: 4850000000, unit: 'Rp', type: 'higher_better', weight: 30, icon: DollarSign, attachment: 'Laporan_OS_April.pdf' },
      { id: 'kpi-2', title: 'Nasabah Baru (Funding & Lending)', target: 20, actual: 22, unit: 'Orang', type: 'higher_better', weight: 20, icon: Users },
      { id: 'kpi-3', title: 'Tingkat NPL (Non-Performing Loan)', target: 3.5, actual: 2.1, unit: '%', type: 'lower_better', weight: 25, icon: AlertTriangle, attachment: 'Data_NPL_Cabang.xlsx' },
      { id: 'kpi-4', title: 'CASA Growth', target: 15, actual: 12, unit: '%', type: 'higher_better', weight: 15, icon: TrendingUp },
      { id: 'kpi-5', title: 'Produktivitas AO (Approval)', target: 15, actual: 10, unit: 'Aplikasi', type: 'higher_better', weight: 10, icon: Activity }
    ],
    projects: [
      { id: 'prj-1', title: 'Migrasi Nasabah ke Mobile Banking', target: 50, actual: 35, unit: 'Nasabah', type: 'higher_better', weight: 40, icon: Smartphone },
      { id: 'prj-2', title: 'Penyelesaian NPL Khusus (Debitur X)', target: 100, actual: 80, unit: '%', type: 'higher_better', weight: 60, icon: Briefcase, attachment: 'Berita_Acara_DebiturX.pdf' }
    ],
    disiplin: [
      { id: 'dsp-1', title: 'Akumulasi Menit Keterlambatan', target: 0, actual: 5, unit: 'Menit', type: 'lower_better', icon: Clock },
      { id: 'dsp-2', title: 'Tingkat Kehadiran', target: 22, actual: 22, unit: 'Hari', type: 'higher_better', icon: CalendarCheck },
      { id: 'dsp-3', title: 'Jumlah Izin / Sakit', target: 1, actual: 0, unit: 'Hari', type: 'lower_better', icon: UserMinus },
      { id: 'dsp-4', title: 'Kepatuhan SOP (Sampling)', target: 100, actual: 100, unit: '%', type: 'higher_better', icon: ShieldCheck },
      { id: 'dsp-5', title: 'Resolusi To Do List', target: 90, actual: 75, unit: '%', type: 'higher_better', icon: ListTodo }
    ],
    trendKPI: [
      { month: 'Jan', realisasi: 85, target: 100 }, { month: 'Feb', realisasi: 92, target: 100 },
      { month: 'Mar', realisasi: 105, target: 100 }, { month: 'Apr', realisasi: 75, target: 100 },
    ],
    trendDisiplin: [
      { label: 'Jan', realisasi: 80 }, { label: 'Feb', realisasi: 50 },
      { label: 'Mar', realisasi: 20 }, { label: 'Apr', realisasi: 0 },
    ]
  },
  {
    id: 'AO-002',
    name: "Rina Marlina",
    role: "Funding Officer",
    branch: "Klodran",
    kpis: [
      { id: 'kpi-1', title: 'Volume Penghimpunan DPK', target: 4000000000, actual: 3500000000, unit: 'Rp', type: 'higher_better', weight: 50, icon: DollarSign },
      { id: 'kpi-2', title: 'Nasabah Baru', target: 15, actual: 10, unit: 'Orang', type: 'higher_better', weight: 20, icon: Users },
      { id: 'kpi-3', title: 'Retensi Deposito', target: 90, actual: 95, unit: '%', type: 'higher_better', weight: 30, icon: Target },
    ],
    projects: [],
    disiplin: [
      { id: 'dsp-1', title: 'Akumulasi Menit Keterlambatan', target: 0, actual: 0, unit: 'Menit', type: 'lower_better', icon: Clock },
      { id: 'dsp-2', title: 'Tingkat Kehadiran', target: 22, actual: 22, unit: 'Hari', type: 'higher_better', icon: CalendarCheck },
      { id: 'dsp-3', title: 'Jumlah Izin / Sakit', target: 1, actual: 0, unit: 'Hari', type: 'lower_better', icon: UserMinus },
      { id: 'dsp-4', title: 'Kepatuhan SOP', target: 100, actual: 100, unit: '%', type: 'higher_better', icon: ShieldCheck },
    ],
    trendKPI: [
      { month: 'Jan', realisasi: 70, target: 100 }, { month: 'Feb', realisasi: 75, target: 100 },
      { month: 'Mar', realisasi: 80, target: 100 }, { month: 'Apr', realisasi: 72, target: 100 },
    ],
    trendDisiplin: [
      { label: 'Jan', realisasi: 15 }, { label: 'Feb', realisasi: 10 },
      { label: 'Mar', realisasi: 0 }, { label: 'Apr', realisasi: 0 },
    ]
  }
];

// --- LOGIC HELPER ---
const calculateStatus = (target: number, actual: number, type: string) => {
  if (type === 'higher_better') {
    const percentage = target > 0 ? (actual / target) * 100 : 0;
    if (percentage >= 100) return 'ON_TRACK';
    if (percentage >= 80) return 'WARNING';
    return 'OFF_TRACK';
  } else {
    if (target === 0) {
      if (actual === 0) return 'ON_TRACK';
      if (actual <= 2) return 'WARNING';
      return 'OFF_TRACK';
    }
    if (actual <= target) return 'ON_TRACK';
    if (actual <= target * 1.2) return 'WARNING';
    return 'OFF_TRACK';
  }
};

const getStatusColor = (status: string) => {
  switch(status) {
    case 'ON_TRACK': return { bg: 'bg-emerald-100', text: 'text-emerald-700', bar: 'bg-emerald-500', label: 'On Track' };
    case 'WARNING': return { bg: 'bg-amber-100', text: 'text-amber-700', bar: 'bg-amber-500', label: 'Warning' };
    case 'OFF_TRACK': return { bg: 'bg-red-100', text: 'text-red-700', bar: 'bg-red-500', label: 'Off Track' };
    default: return { bg: 'bg-slate-100', text: 'text-slate-700', bar: 'bg-slate-400', label: 'Unknown' };
  }
};

const formatValue = (val: number, unit: string) => {
  if (unit === 'Rp') return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  return `${val} ${unit}`;
};

export const HrKpiDashboard: React.FC = () => {
  const { allUsers: users, currentUser } = useApp();
  const [selectedEmpId, setSelectedEmpId] = useState(users.length > 0 ? users[0].id : '');

  // Master Admin role check (simulation)
  const isSuperAdmin = currentUser?.role === 'DIREKSI' || currentUser?.role === 'ADMIN';

  const mergedUsers = useMemo(() => {
    return users.map(appUser => {
      // Cari dummy KPI atau fallback ke default
      const dummyData = INITIAL_DB.find(d => d.name === appUser.name) || {
        kpis: [],
        projects: [],
        disiplin: [
          { id: 'dsp-1', title: 'Kehadiran', target: 22, actual: 22, unit: 'Hari', type: 'higher_better', icon: CalendarCheck }
        ],
        trendKPI: [],
        trendDisiplin: []
      };

      return {
        id: appUser.id,
        name: appUser.name,
        role: appUser.roleTitle || appUser.role,
        branch: appUser.branchName || 'Pusat',
        kpis: dummyData.kpis,
        projects: dummyData.projects,
        disiplin: dummyData.disiplin,
        trendKPI: dummyData.trendKPI,
        trendDisiplin: dummyData.trendDisiplin
      };
    });
  }, [users]);

  // Ensure selected user is accessible
  const currentEmp = useMemo(() => mergedUsers.find(emp => emp.id === selectedEmpId) || mergedUsers[0] || {
    id: 'dummy', name: 'No User', role: '-', kpis: [], projects: [], disiplin: [], trendKPI: [], trendDisiplin: []
  }, [mergedUsers, selectedEmpId]);

  // Kalkulasi Skor
  const totalScore = useMemo(() => {
    if (!currentEmp.kpis || currentEmp.kpis.length === 0) return 0;
    let totalWeight = 0;
    const sum = currentEmp.kpis.reduce((acc, kpi) => {
      let pct = 0;
      if (kpi.target !== 0) {
        if (kpi.type === 'higher_better') {
          pct = Math.min((kpi.actual / kpi.target) * 100, 100);
        } else {
          pct = kpi.actual <= kpi.target ? 100 : Math.max(100 - (((kpi.actual - kpi.target) / kpi.target) * 100), 0);
        }
      } else {
        pct = kpi.actual === 0 ? 100 : 0;
      }
      const weight = kpi.weight || 0;
      totalWeight += weight;
      return acc + (pct * weight);
    }, 0);
    return totalWeight > 0 ? Math.round(sum / totalWeight) : 0;
  }, [currentEmp.kpis]);

  const dynamicTrendKPI = useMemo(() => {
    if (!currentEmp.trendKPI) return [];
    const trend = [...currentEmp.trendKPI];
    if (trend.length > 0) {
      trend[trend.length - 1] = { ...trend[trend.length - 1], realisasi: totalScore };
    }
    return trend;
  }, [currentEmp.trendKPI, totalScore]);

  const renderMetricCard = (item: any) => {
    const status = calculateStatus(item.target, item.actual, item.type);
    const style = getStatusColor(status);
    const Icon = item.icon || Target;
    
    let progressPct = item.target !== 0 ? (item.actual / item.target) * 100 : (item.actual === 0 ? 100 : 0);
    if (item.type === 'lower_better' && item.target !== 0) progressPct = (item.target / item.actual) * 100; 
    const clampPct = Math.min(Math.max(progressPct, 0), 100);

    return (
      <div key={item.id} className="bg-white border border-slate-200 rounded-2xl p-5 relative group flex flex-col justify-between shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
        <div className={`absolute top-0 left-0 w-full h-1.5 ${style.bar} rounded-t-2xl`}></div>
        
        <div>
          {/* Master Admin Controls */}
          {isSuperAdmin && (
            <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
              <button className="p-1.5 bg-slate-100 text-blue-600 hover:bg-blue-600 hover:text-white rounded transition-colors">
                <Edit2 size={14} />
              </button>
              <button className="p-1.5 bg-slate-100 text-red-500 hover:bg-red-500 hover:text-white rounded transition-colors">
                <Trash2 size={14} />
              </button>
            </div>
          )}

          <div className="flex items-start mb-4 mt-1">
            <div className={`p-2.5 rounded-lg ${style.bg} ${style.text} mr-3`}><Icon size={20} /></div>
            <div>
              <h4 className="font-semibold text-slate-800 text-sm">{item.title}</h4>
              {item.weight !== undefined && (
                 <span className="inline-block mt-1 text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                   Bobot: {item.weight}%
                 </span>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center text-xs mb-1.5">
              <span className="text-slate-500 font-medium">Realisasi:</span>
              <span className="font-bold text-slate-800">{formatValue(item.actual, item.unit)}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500 font-medium">Target:</span>
              <span className="font-semibold text-slate-600">{formatValue(item.target, item.unit)}</span>
            </div>

            <div className="pt-3">
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden mb-2">
                <div className={`h-full rounded-full ${style.bar}`} style={{ width: `${clampPct}%` }}></div>
              </div>
              <div className="flex justify-between items-center">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${style.bg} ${style.text}`}>{style.label}</span>
                <span className="text-xs font-bold text-slate-500">
                  {item.type === 'higher_better' ? `${Math.round(progressPct)}%` : ''}
                </span>
              </div>
            </div>
          </div>
        </div>

        {item.attachment && (
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
            <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-blue-700 bg-blue-50 px-2.5 py-1.5 rounded-lg border border-blue-100 w-fit cursor-pointer hover:bg-blue-100 transition-colors">
              <Paperclip size={12} className="text-blue-700" />
              <span className="truncate max-w-[150px]">{item.attachment}</span>
            </div>
            {isSuperAdmin && (
              <button className="text-slate-400 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <XCircle size={16} />
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            Evaluasi Kinerja & KPI
          </h2>
          <div className="flex items-center gap-3 mt-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Karyawan:</span>
            <div className="relative">
              <select 
                value={selectedEmpId}
                onChange={(e) => setSelectedEmpId(e.target.value)}
                className="w-full appearance-none bg-slate-50 border border-slate-200 text-slate-800 py-1.5 pl-4 pr-10 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-bold shadow-sm transition-all text-xs cursor-pointer"
              >
                {mergedUsers.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.name} - {emp.role}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl shadow-sm">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Periode:</span>
          <div className="flex items-center gap-1 text-xs font-bold text-slate-800">
            {CURRENT_MONTH} <ChevronDown size={14} className="text-slate-400" />
          </div>
        </div>
      </div>

      {/* Rata-Rata Skor */}
      <div className="bg-white border border-slate-200 shadow-sm rounded-3xl p-6 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
        {/* Dekorasi BG */}
        <div className="absolute top-0 right-0 -mr-8 -mt-8 w-40 h-40 bg-blue-50 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -ml-8 -mb-8 w-32 h-32 bg-emerald-50 rounded-full blur-3xl opacity-50 pointer-events-none"></div>

        <div className="flex-shrink-0 relative flex items-center justify-center w-32 h-32 z-10">
          <svg className="w-full h-full transform -rotate-90 drop-shadow-md" viewBox="0 0 36 36">
            <path className="text-slate-100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
            <path
              className={`${totalScore >= 90 ? 'text-emerald-500' : totalScore >= 75 ? 'text-amber-500' : 'text-red-500'} transition-all duration-1000 ease-out`}
              strokeDasharray={`${totalScore}, 100`}
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"
            />
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className="text-3xl font-black text-slate-800">{totalScore}</span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">/ 100</span>
          </div>
        </div>
        
        <div className="flex-grow z-10">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-2">
            <Award className="text-amber-500" size={20} /> Rata-rata Skor KPI Operasional
          </h3>
          <p className="text-slate-500 text-xs max-w-2xl leading-relaxed">
            Skor rata-rata ini dihitung murni dari komponen <strong>KPI Operasional</strong> menggunakan metode *Weighted Average* (Bobot). Ketiga data di bawah (KPI, Project, dan Disiplin) akan dikonsolidasi bersama nilai OKR untuk membentuk Nilai Kinerja Akhir di <strong>Scoring Board</strong>.
          </p>
          {isSuperAdmin && (
            <div className="mt-4 inline-flex items-center gap-2">
              <span className="text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-wider uppercase">
                Hak Akses: Master Admin
              </span>
            </div>
          )}
        </div>
      </div>

      {/* KPI Operasional */}
      <div>
        <div className="flex justify-between items-end mb-4 border-b border-slate-200 pb-2">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Activity className="text-blue-600" size={20} /> Indikator Kinerja (KPI)
            <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200 ml-2">BOBOT 40%</span>
          </h3>
          {isSuperAdmin && (
            <button className="flex items-center gap-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 px-3 py-1.5 rounded-lg shadow-sm transition-colors">
              <Plus size={14} /> Tambah KPI
            </button>
          )}
        </div>
        
        {!currentEmp.kpis || currentEmp.kpis.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-500 text-sm font-medium shadow-sm">Belum ada data KPI.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-6">
            {currentEmp.kpis.map((kpi: any) => renderMetricCard(kpi))}
          </div>
        )}

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mt-6">
          <div className="flex flex-col mb-6">
            <h4 className="font-bold text-slate-900 text-sm">Trend KPI Operasional (Rata-rata)</h4>
            <p className="text-xs text-slate-500 mt-1">Real-time Target vs Realisasi Bulanan</p>
          </div>
          <div className="space-y-4">
            {dynamicTrendKPI.map((data: any, idx: number) => {
              const colorClass = data.realisasi >= 100 ? 'bg-emerald-500' : data.realisasi >= 80 ? 'bg-amber-500' : 'bg-red-500';
              return (
                <div key={idx} className="flex items-center gap-4 group">
                  <div className="w-12 text-xs font-bold text-slate-600 uppercase">{data.month}</div>
                  <div className="flex-1 bg-slate-100 rounded-lg h-8 relative flex items-center border border-slate-200/50 shadow-inner overflow-hidden">
                    <div className={`h-full rounded-r-lg flex items-center justify-end px-3 text-xs font-bold text-white ${colorClass}`} style={{ width: `${Math.min((data.realisasi/120)*100, 100)}%`, transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)' }}>
                      {data.realisasi}%
                    </div>
                    <div className="absolute left-[83.33%] top-0 bottom-0 w-0.5 bg-slate-300 border-r border-dashed border-slate-400 z-10" title="Target 100%"></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Disiplin Kerja */}
      <div className="mt-8">
        <div className="flex justify-between items-end mb-4 border-b border-slate-200 pb-2">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <CheckCircle2 className="text-emerald-600" size={20} /> Disiplin Kerja
            <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200 ml-2">BOBOT 10%</span>
          </h3>
        </div>
        
        <div className="overflow-hidden border border-slate-200 bg-white rounded-2xl shadow-sm">
           <div className="overflow-x-auto">
             <table className="w-full text-left text-sm border-collapse">
               <thead className="bg-slate-50 border-b border-slate-200">
                 <tr>
                   <th className="py-3 px-5 font-bold text-xs text-slate-600 uppercase tracking-wider">Parameter Disiplin</th>
                   <th className="py-3 px-5 font-bold text-xs text-slate-600 uppercase tracking-wider">Target Threshold</th>
                   <th className="py-3 px-5 font-bold text-xs text-slate-600 uppercase tracking-wider">Aktual (Bulan Ini)</th>
                   <th className="py-3 px-5 font-bold text-xs text-slate-600 uppercase tracking-wider text-center">Status</th>
                   {isSuperAdmin && <th className="py-3 px-5 font-bold text-xs text-slate-600 uppercase tracking-wider text-center">Aksi</th>}
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                 {currentEmp.disiplin?.map((dsp: any) => {
                    const status = calculateStatus(dsp.target, dsp.actual, dsp.type);
                    const style = getStatusColor(status);
                    const Icon = dsp.icon || Target;
                    return (
                      <tr key={dsp.id} className="hover:bg-slate-50 transition-colors group">
                        <td className="py-3 px-5">
                          <div className="flex items-center gap-3">
                            <Icon size={16} className="text-slate-400" />
                            <span className="text-sm font-semibold text-slate-800">{dsp.title}</span>
                          </div>
                        </td>
                        <td className="py-3 px-5 text-sm font-medium text-slate-500">
                          {dsp.type === 'lower_better' && dsp.target !== 0 ? 'Maks ' : ''}
                          {dsp.target === 0 && dsp.type === 'lower_better' ? '0' : formatValue(dsp.target, '')} {dsp.unit}
                        </td>
                        <td className="py-3 px-5">
                          <span className="text-sm font-bold text-slate-900">{formatValue(dsp.actual, '')} {dsp.unit}</span>
                        </td>
                        <td className="py-3 px-5 text-center">
                          <span className={`inline-block px-2.5 py-1 rounded-md text-[10px] uppercase tracking-wider font-bold ${style.bg} ${style.text} border border-${style.text.split('-')[1]}-200`}>
                            {style.label}
                          </span>
                        </td>
                        {isSuperAdmin && (
                          <td className="py-3 px-5 text-center">
                             <button className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                               <Edit2 size={14} />
                             </button>
                          </td>
                        )}
                      </tr>
                    );
                 })}
               </tbody>
             </table>
           </div>
        </div>
      </div>
    </div>
  );
};
