import React from 'react';
import {
  LayoutDashboard,
  PieChart,
  TrendingUp,
  Building2,
  Users,
  Target,
  FileSpreadsheet,
  UploadCloud,
  Settings,
  Landmark,
  Layers,
  Sparkles,
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, setCurrentTab }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard Utama', icon: LayoutDashboard },
    { id: 'executive', label: 'Executive Board', icon: Sparkles, badge: 'Direct' },
    { id: 'portfolio', label: 'Portofolio Berjalan', icon: Layers },
    { id: 'daily', label: 'Penambahan Harian', icon: TrendingUp },
    { id: 'offices', label: 'Kantor Kas', icon: Building2 },
    { id: 'sources', label: 'Sumber Penghimpunan', icon: Users },
    { id: 'targets', label: 'Target & Realisasi', icon: Target },
    { id: 'reports', label: 'Laporan WA & Export', icon: FileSpreadsheet },
    { id: 'import', label: 'Import Excel / CSV', icon: UploadCloud },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-full lg:w-64 bg-slate-900 text-slate-300 flex-shrink-0 flex flex-col justify-between border-r border-slate-800 transition-all">
      <div>
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800/80 flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-tr from-emerald-600 to-teal-500 rounded-xl text-white shadow-md shadow-emerald-950">
            <Landmark className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-white tracking-tight text-base leading-snug">
              BPR ARA
            </h2>
            <p className="text-xs text-slate-400 font-medium">
              Funding Management System
            </p>
          </div>
        </div>

        {/* Navigation Section */}
        <nav className="p-3 space-y-1">
          <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Navigasi Utama
          </div>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                id={`sidebar-tab-${item.id}`}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase bg-emerald-500/20 text-emerald-300 rounded">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Info Box */}
      <div className="p-4 m-3 bg-slate-800/60 border border-slate-800 rounded-xl text-xs text-slate-400">
        <p className="font-semibold text-slate-300 text-[11px] mb-1">
          BPR Antar Rumeksa Arta
        </p>
        <p className="text-[10px] text-slate-400 leading-relaxed">
          Sistem Penghimpunan CASA & Deposito Terstruktur
        </p>
      </div>
    </aside>
  );
};
