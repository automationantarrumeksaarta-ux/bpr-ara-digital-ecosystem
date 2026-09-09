import React from 'react';
import { useApp } from '../../../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { 
  User,
  Briefcase,
  Lock,
  BellRing,
  Globe,
  HelpCircle,
  LogOut,
  Settings,
  ChevronRight
} from 'lucide-react';

const MobileProfile: React.FC = () => {
  const { currentUser, setIsAuthenticated, setCurrentUser } = useApp();
  const navigate = useNavigate();

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    navigate('/');
  };

  const menus = [
    { title: 'Informasi Pribadi', subtitle: 'Nama, NIK, no. HP, email', icon: User },
    { title: 'Data Kepegawaian', subtitle: 'Unit, jabatan, status, dll', icon: Briefcase },
    { title: 'Ubah Password', subtitle: 'Atur kata sandi akun', icon: Lock },
    { title: 'Pengaturan Notifikasi', subtitle: 'Atur notifikasi aplikasi', icon: BellRing },
    { title: 'Bahasa', subtitle: 'Indonesia', icon: Globe },
    { title: 'Bantuan & FAQ', subtitle: 'Pusat bantuan dan pertanyaan', icon: HelpCircle },
  ];

  return (
    <div className="bg-[#f8fafc] dark:bg-gray-900 min-h-screen pb-24">
      {/* Header */}
      <div className="bg-white dark:bg-gray-950 px-5 py-4 flex items-center justify-between border-b border-gray-100 dark:border-gray-800 sticky top-0 z-10">
        <h1 className="text-base font-bold text-gray-800 dark:text-gray-100">Profile</h1>
        <button className="text-gray-500 hover:text-gray-800 transition-colors">
          <Settings className="w-5 h-5" />
        </button>
      </div>

      <div className="p-5 flex flex-col gap-6">
        
        {/* Profile Card */}
        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/50 flex items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden border-2 border-white shadow-sm">
              <UserCircleIconSolid className="w-16 h-16 text-blue-300" />
            </div>
            <div className="absolute bottom-0 right-0 w-5 h-5 bg-blue-600 rounded-full border-2 border-white flex items-center justify-center">
              <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
          </div>
          <div>
            <h2 className="text-sm font-bold text-gray-800 dark:text-gray-100">{currentUser?.name || 'Ahmad Wahyu Aji'}</h2>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 mb-1">{currentUser?.role || 'Staff'} - BPR ARA</p>
            <span className="inline-block px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[8px] font-bold rounded">
              {currentUser?.role?.toUpperCase() || 'STAFF'}
            </span>
          </div>
        </div>

        {/* Menu List */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/50 overflow-hidden divide-y divide-gray-50 dark:divide-gray-700/50">
          {menus.map((menu, idx) => (
            <button key={idx} className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                  <menu.icon className="w-4 h-4 text-gray-500" />
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

        {/* Logout Button */}
        <button 
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 p-3.5 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-600 rounded-xl font-bold text-xs transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>

      </div>
    </div>
  );
};

const UserCircleIconSolid = (props: any) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path fillRule="evenodd" d="M18.685 19.097A9.723 9.723 0 0021.75 12c0-5.385-4.365-9.75-9.75-9.75S2.25 6.615 2.25 12a9.723 9.723 0 003.065 7.097A9.716 9.716 0 0012 21.75a9.716 9.716 0 006.685-2.653zm-12.54-1.285A7.486 7.486 0 0112 15a7.486 7.486 0 015.855 2.812A8.224 8.224 0 0112 20.25a8.224 8.224 0 01-5.855-2.438zM15.75 9a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" clipRule="evenodd" />
  </svg>
);

export default MobileProfile;
