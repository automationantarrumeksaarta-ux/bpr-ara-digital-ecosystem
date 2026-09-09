import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronLeft,
  ChevronDown,
  ChevronRight,
  CheckCircle,
  XCircle,
  PlusCircle,
  FileText,
  CalendarDays,
  Clock,
  AlertCircle,
  LogOut,
  Ban
} from 'lucide-react';

const MobileAttendanceData: React.FC = () => {
  const navigate = useNavigate();

  const stats = [
    { label: 'Hadir', value: 0, icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/30' },
    { label: 'Alpa', value: 0, icon: XCircle, color: 'text-slate-400', bg: 'bg-slate-50 dark:bg-slate-800' },
    { label: 'Sakit', value: 0, icon: PlusCircle, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/30' },
    { label: 'Izin', value: 0, icon: FileText, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/30' },
    { label: 'Cuti', value: 0, icon: CalendarDays, color: 'text-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-900/30' },
    { label: 'Lembur', value: 0, icon: Clock, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/30' },
    { label: 'Terlambat', value: 0, icon: AlertCircle, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/30' },
    { label: 'Pulang Cepat', value: 0, icon: LogOut, color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-900/30' },
    { label: 'Tidak Absen Pulang', value: 0, icon: Ban, color: 'text-gray-400', bg: 'bg-gray-50 dark:bg-gray-800' },
  ];

  const menus = [
    { title: 'Pembatalan Cuti / Izin', subtitle: 'Ajukan pembatalan cuti atau izin', icon: CalendarDays },
    { title: 'Data Absensi', subtitle: 'Lihat riwayat data absensi', icon: CheckCircle },
    { title: 'Data Izin', subtitle: 'Lihat data izin Anda', icon: FileText },
    { title: 'Data Lembur', subtitle: 'Lihat data lembur Anda', icon: Clock },
  ];

  return (
    <div className="bg-[#f8fafc] dark:bg-gray-900 min-h-screen pb-24">
      {/* Header */}
      <div className="bg-white dark:bg-gray-950 px-4 py-4 flex items-center justify-between border-b border-gray-100 dark:border-gray-800 sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-700 dark:text-gray-300">
          <ChevronLeft className="w-5 h-5 font-bold" />
        </button>
        <h1 className="text-base font-bold text-gray-800 dark:text-gray-100">Data Absen</h1>
        <div className="w-9" /> {/* Spacer for centering */}
      </div>

      <div className="p-5 flex flex-col gap-6">
        
        {/* Dropdown Month Selection */}
        <button className="w-full flex items-center justify-between bg-white dark:bg-gray-800 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-gray-400" />
            <span className="font-bold text-gray-700 dark:text-gray-200 text-sm">Bulan Ini</span>
          </div>
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </button>

        {/* Stats Grid */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/50 overflow-hidden">
          <div className="grid grid-cols-3 divide-x divide-y divide-gray-100 dark:divide-gray-700/50">
            {stats.map((stat, idx) => (
              <div key={idx} className="p-4 flex flex-col items-center justify-center gap-1">
                <div className="flex items-center gap-1.5 mb-1">
                  <div className={`w-5 h-5 rounded-full ${stat.bg} flex items-center justify-center`}>
                    <stat.icon className={`w-3 h-3 ${stat.color}`} />
                  </div>
                  <span className="text-[9px] font-bold text-gray-500 dark:text-gray-400 leading-none text-center">{stat.label}</span>
                </div>
                <span className="text-xl font-black text-gray-800 dark:text-gray-100">{stat.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Menu Lainnya */}
        <div>
          <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100 mb-3 ml-1">Menu Lainnya</h3>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/50 overflow-hidden divide-y divide-gray-50 dark:divide-gray-700/50">
            {menus.map((menu, idx) => (
              <button key={idx} className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 flex items-center justify-center">
                    <menu.icon className="w-4 h-4 text-gray-400" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold text-gray-800 dark:text-gray-100">{menu.title}</p>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">{menu.subtitle}</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default MobileAttendanceData;
