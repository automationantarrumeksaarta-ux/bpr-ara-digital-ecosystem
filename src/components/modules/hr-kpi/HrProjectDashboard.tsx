import React, { useState } from 'react';
import { 
  Briefcase, Plus, Calendar, CheckCircle2, 
  AlertTriangle, BarChart3, User, Search 
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';

// --- MOCK DATABASE ---
const MOCK_PROJECTS = [
  { id: 'PRJ-001', title: 'Migrasi Core Banking System (Fase 1)', manager: 'Eko Prabowo', deadline: '2026-06-30', status: 'On Track', actual: 85, trend: [{label: 'Jan', realisasi: 10}, {label: 'Feb', realisasi: 35}, {label: 'Mar', realisasi: 60}, {label: 'Apr', realisasi: 85}] },
  { id: 'PRJ-002', title: 'Akuisisi Merchant QRIS UMKM', manager: 'Rina Marlina', deadline: '2026-05-15', status: 'Delayed', actual: 40, trend: [{label: 'Jan', realisasi: 10}, {label: 'Feb', realisasi: 20}, {label: 'Mar', realisasi: 30}, {label: 'Apr', realisasi: 40}] },
  { id: 'PRJ-003', title: 'Penyelesaian NPL Debitur Korporasi X', manager: 'Andi Setiawan', deadline: '2026-04-20', status: 'At Risk', actual: 15, trend: [{label: 'Jan', realisasi: 5}, {label: 'Feb', realisasi: 10}, {label: 'Mar', realisasi: 12}, {label: 'Apr', realisasi: 15}] },
  { id: 'PRJ-004', title: 'Pembukaan Kantor Kas Matesih Baru', manager: 'Dian Sastro', deadline: '2026-07-01', status: 'On Track', actual: 60, trend: [{label: 'Jan', realisasi: 0}, {label: 'Feb', realisasi: 10}, {label: 'Mar', realisasi: 30}, {label: 'Apr', realisasi: 60}] }
];

export const HrProjectDashboard: React.FC = () => {
  const { currentUser } = useApp();
  const isSuperAdmin = currentUser?.role === 'DIREKSI' || currentUser?.role === 'ADMIN';
  
  const [searchTerm, setSearchTerm] = useState('');
  
  const filteredProjects = MOCK_PROJECTS.filter(p => p.title.toLowerCase().includes(searchTerm.toLowerCase()));

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'On Track': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Delayed': return 'bg-red-50 text-red-700 border-red-200';
      case 'At Risk': return 'bg-amber-50 text-amber-700 border-amber-200';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 p-5 bg-white border border-slate-200 rounded-2xl shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Briefcase className="text-blue-600" /> Manajemen Project Lintas Divisi
          </h2>
          <p className="text-slate-500 mt-1 text-xs font-medium">Pantau status, timeline, dan pencapaian inisiatif strategis perusahaan.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Cari project..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 w-64 shadow-inner transition-all"
            />
          </div>
          {isSuperAdmin && (
            <button className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white px-3 py-2 rounded-xl text-xs font-bold transition-colors shadow-sm">
              <Plus size={14} /> Project Baru
            </button>
          )}
        </div>
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-5 flex items-center gap-4 group hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
            <Briefcase size={22} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Project</p>
            <p className="text-2xl font-black text-slate-900 mt-0.5">{MOCK_PROJECTS.length}</p>
          </div>
        </div>
        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-5 flex items-center gap-4 group hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
            <CheckCircle2 size={22} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">On Track</p>
            <p className="text-2xl font-black text-slate-900 mt-0.5">{MOCK_PROJECTS.filter(p => p.status === 'On Track').length}</p>
          </div>
        </div>
        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-5 flex items-center gap-4 group hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center text-red-600 group-hover:scale-110 transition-transform">
            <AlertTriangle size={22} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Delayed / At Risk</p>
            <p className="text-2xl font-black text-slate-900 mt-0.5">{MOCK_PROJECTS.filter(p => p.status !== 'On Track').length}</p>
          </div>
        </div>
        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-5 flex items-center gap-4 group hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
            <BarChart3 size={22} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Avg Progress</p>
            <p className="text-2xl font-black text-slate-900 mt-0.5">
              {Math.round(MOCK_PROJECTS.reduce((sum, p) => sum + p.actual, 0) / (MOCK_PROJECTS.length || 1))}%
            </p>
          </div>
        </div>
      </div>

      {/* PROJECT LIST */}
      <div className="bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center">
          <h3 className="font-bold text-slate-900 text-base">Daftar Inisiatif & Project</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-[10px] uppercase font-bold tracking-wider border-b border-slate-200">
                <th className="p-4">Nama Project</th>
                <th className="p-4">Manager</th>
                <th className="p-4">Deadline</th>
                <th className="p-4">Status</th>
                <th className="p-4">Progress</th>
                {isSuperAdmin && <th className="p-4 text-right">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProjects.length > 0 ? filteredProjects.map(proj => (
                <tr key={proj.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4">
                    <p className="font-bold text-slate-900">{proj.title}</p>
                    <p className="text-[10px] font-bold text-slate-400 font-mono mt-0.5">ID: {proj.id}</p>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-slate-600">
                        <User size={12} />
                      </div>
                      <span className="text-xs font-bold text-slate-700">{proj.manager}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                      <Calendar size={14} className="text-slate-400" />
                      {new Date(proj.deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-md text-[10px] uppercase tracking-wider font-bold border ${getStatusColor(proj.status)}`}>
                      {proj.status}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden w-24 border border-slate-200/50 shadow-inner">
                        <div 
                          className={`h-full rounded-full ${proj.actual >= 80 ? 'bg-emerald-500' : proj.actual >= 40 ? 'bg-blue-500' : 'bg-amber-500'}`}
                          style={{ width: `${proj.actual}%` }}
                        />
                      </div>
                      <span className="text-xs font-black text-slate-800 w-9">{proj.actual}%</span>
                    </div>
                  </td>
                  {isSuperAdmin && (
                    <td className="p-4 text-right">
                      <button className="text-blue-600 hover:text-blue-800 text-xs font-bold bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors">Update</button>
                    </td>
                  )}
                </tr>
              )) : (
                <tr>
                  <td colSpan={isSuperAdmin ? 6 : 5} className="p-8 text-center text-slate-500 text-sm font-medium">
                    Tidak ada project yang ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* BURN-UP CHART */}
      <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6">
        <div className="flex flex-col mb-6">
          <h4 className="font-bold text-slate-900 text-sm">Trend Penyelesaian Keseluruhan Project (Burn-up)</h4>
          <p className="text-xs font-medium text-slate-500 mt-1">Kumulatif Progress Mingguan Lintas Divisi</p>
        </div>
        
        <div className="w-full h-64 flex mt-2">
          <div className="w-10 relative shrink-0">
            <span className="absolute text-[10px] font-bold text-slate-400 right-2 transform -translate-y-1/2" style={{ top: '16.66%' }}>100%</span>
            <span className="absolute text-[10px] font-bold text-slate-400 right-2 transform -translate-y-1/2" style={{ top: '38.66%' }}>66%</span>
            <span className="absolute text-[10px] font-bold text-slate-400 right-2 transform -translate-y-1/2" style={{ top: '61%' }}>33%</span>
            <span className="absolute text-[10px] font-bold text-slate-400 right-2 transform -translate-y-1/2" style={{ top: '83.33%' }}>0%</span>
          </div>
          
          <div className="flex-1 relative h-full">
            <svg viewBox="0 0 1000 300" preserveAspectRatio="none" className="absolute inset-0 w-full h-full overflow-visible">
              <defs>
                <linearGradient id="projGradGlobal" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#2563eb" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#2563eb" stopOpacity="0.01" />
                </linearGradient>
              </defs>
              {[50, 116, 183, 250].map((y, i) => (
                <line key={i} x1="50" y1={y} x2="950" y2={y} stroke="#e2e8f0" strokeWidth="1" strokeDasharray="4 4" />
              ))}
              
              {(() => {
                const trend = MOCK_PROJECTS[0].trend;
                const step = 900 / (trend.length > 1 ? trend.length - 1 : 1);
                const xs = trend.map((_, i) => 50 + (i * step));
                const points = trend.map((p, i) => `${xs[i]},${250 - (p.realisasi/100)*200}`);
                const pathD = `M 50 250 L ${points.join(' L ')} L ${xs[trend.length-1]} 250 Z`;
                
                return (
                  <>
                    <path d={pathD} fill="url(#projGradGlobal)" style={{ transition: 'all 0.5s ease' }} />
                    <polyline points={points.join(' ')} fill="none" stroke="#2563eb" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                    
                    {trend.map((p, i) => (
                      <g key={i} className="group cursor-pointer">
                        <circle cx={xs[i]} cy={250 - (p.realisasi/100)*200} r="6" fill="white" stroke="#2563eb" strokeWidth="3" className="transition-all duration-300 group-hover:scale-125 origin-center" />
                        <rect x={xs[i] - 25} y={250 - (p.realisasi/100)*200 - 45} width="50" height="28" rx="6" fill="#0f172a" className="opacity-0 group-hover:opacity-100 transition-opacity" />
                        <text x={xs[i]} y={250 - (p.realisasi/100)*200 - 26} fill="white" fontSize="12" fontWeight="bold" textAnchor="middle" className="opacity-0 group-hover:opacity-100 transition-opacity">
                          {p.realisasi}%
                        </text>
                      </g>
                    ))}
                  </>
                );
              })()}
            </svg>
            
            <div className="absolute left-[5%] right-[5%] bottom-0 flex justify-between transform translate-y-6">
              {MOCK_PROJECTS[0].trend.map((p, i) => (
                <span key={i} className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{p.label}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
      
    </div>
  );
};
