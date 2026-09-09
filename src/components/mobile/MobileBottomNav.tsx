import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  CalendarDays, 
  MapPin, 
  Bell, 
  UserCircle 
} from 'lucide-react';

const MobileBottomNav: React.FC = () => {
  const location = useLocation();
  const path = location.pathname;

  const navItems = [
    { name: 'Beranda', path: '/mobile', icon: Home, solidIcon: Home },
    { name: 'Data Absen', path: '/mobile/attendance', icon: CalendarDays, solidIcon: CalendarDays },
    { name: 'Absen', path: '/mobile/live-attendance', icon: MapPin, solidIcon: MapPin },
    { name: 'Notification', path: '/mobile/notifications', icon: Bell, solidIcon: Bell },
    { name: 'Profile', path: '/mobile/profile', icon: UserCircle, solidIcon: UserCircle },
  ];

  return (
    <div className="absolute bottom-0 w-full bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 px-2 py-3 flex justify-between items-center z-50 rounded-t-3xl shadow-[0_-10px_20px_rgba(0,0,0,0.03)] dark:shadow-[0_-10px_20px_rgba(0,0,0,0.2)]">
      {navItems.map((item) => {
        const isActive = path === item.path || (path === '/mobile' && item.name === 'Beranda');
        const Icon = isActive ? item.solidIcon : item.icon;
        
        return (
          <Link 
            key={item.name} 
            to={item.path} 
            className="flex flex-col items-center gap-1 w-1/5"
          >
            <div className={`transition-all duration-300 ${isActive ? 'text-blue-600 dark:text-blue-400 scale-110' : 'text-gray-400 dark:text-gray-500 scale-100'}`}>
              <Icon className="w-6 h-6" />
            </div>
            <span className={`text-[9px] font-bold transition-all duration-300 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'}`}>
              {item.name}
            </span>
          </Link>
        );
      })}
    </div>
  );
};

export default MobileBottomNav;
