import React from 'react';
import { useApp } from '../../../context/AppContext';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Bell, 
  CheckCircle,
  LayoutGrid,
  FileText,
  ClipboardList,
  BadgeCheck,
  CalendarDays,
  BarChart2,
  DollarSign
} from 'lucide-react';

const MobileHome: React.FC = () => {
  const { currentUser } = useApp();
  const navigate = useNavigate();

  const mainMenus = [
    { name: 'Dashboard Utama', icon: LayoutGrid, path: '/dashboard', color: 'text-blue-500' },
    { name: 'Loan Origination', icon: FileText, path: '/business/credit/los', color: 'text-indigo-500' },
    { name: 'Task Board', icon: ClipboardList, path: '/operations/tasks', color: 'text-emerald-500' },
    { name: 'Approval Queue', icon: BadgeCheck, path: '/operations/decision-queue', color: 'text-teal-500' },
    { name: 'Calendar', icon: CalendarDays, path: '/operations/calendar', color: 'text-purple-500' },
    { name: 'Activities', icon: BarChart2, path: '#', color: 'text-orange-500' },
    { name: 'Info Gaji', icon: DollarSign, path: '#', color: 'text-green-600' },
  ];

  return (
    <div className="p-5 flex flex-col gap-6">
      
      {/* Header Profile */}
      <div className="flex justify-between items-center mt-2">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden border border-blue-200">
            <UserCircleIconSolid className="w-12 h-12 text-blue-300" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-gray-800 dark:text-gray-100">{currentUser?.name || 'Ahmad Wahyu Aji'}</h1>
            <p className="text-[10px] text-gray-500 dark:text-gray-400">{currentUser?.role || 'Staff'} - BPR ARA</p>
            <span className="inline-block mt-0.5 px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[8px] font-bold rounded">
              {currentUser?.role?.toUpperCase() || 'STAFF'}
            </span>
          </div>
        </div>
        <button onClick={() => navigate('/mobile/notifications')} className="relative p-2">
          <Bell className="w-6 h-6 text-gray-600 dark:text-gray-300" />
          <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-gray-900"></span>
        </button>
      </div>

      {/* Greeting */}
      <div>
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Selamat Pagi,</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Semoga hari ini berjalan dengan lancar.</p>
      </div>

      {/* Rekap Absensi Card */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700/50">
        <div className="flex items-center gap-2 mb-4">
          <CalendarDays className="w-4 h-4 text-gray-500" />
          <h3 className="text-xs font-bold text-gray-700 dark:text-gray-200">Rekap Absensi Bulan Ini</h3>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          {/* Hadir */}
          <div className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 dark:border-gray-700/50">
            <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-[10px] text-gray-500 dark:text-gray-400">Hadir</p>
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-bold text-gray-800 dark:text-gray-100">0</span>
                <span className="text-[10px] text-gray-400">/ 22 hari</span>
              </div>
            </div>
          </div>
          
          {/* Izin */}
          <div className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 dark:border-gray-700/50">
            <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-[10px] text-gray-500 dark:text-gray-400">Izin</p>
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-bold text-gray-800 dark:text-gray-100">0</span>
                <span className="text-[10px] text-gray-400">/ 22 hari</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Menu Utama */}
      <div>
        <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100 mb-4">Menu Utama</h3>
        <div className="grid grid-cols-4 gap-x-2 gap-y-4">
          {mainMenus.map((menu, idx) => (
            <Link 
              key={idx} 
              to={menu.path}
              className="flex flex-col items-center gap-2 group"
            >
              <div className="w-14 h-14 rounded-2xl bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700/50 flex items-center justify-center group-hover:scale-105 transition-transform">
                <menu.icon className={`w-6 h-6 ${menu.color}`} />
              </div>
              <span className="text-[10px] text-center font-medium text-gray-600 dark:text-gray-300 leading-tight px-1">
                {menu.name}
              </span>
            </Link>
          ))}
        </div>
      </div>

    </div>
  );
};

// Extracted solid icon for profile to avoid extra imports
const UserCircleIconSolid = (props: any) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path fillRule="evenodd" d="M18.685 19.097A9.723 9.723 0 0021.75 12c0-5.385-4.365-9.75-9.75-9.75S2.25 6.615 2.25 12a9.723 9.723 0 003.065 7.097A9.716 9.716 0 0012 21.75a9.716 9.716 0 006.685-2.653zm-12.54-1.285A7.486 7.486 0 0112 15a7.486 7.486 0 015.855 2.812A8.224 8.224 0 0112 20.25a8.224 8.224 0 01-5.855-2.438zM15.75 9a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" clipRule="evenodd" />
  </svg>
);

export default MobileHome;
