import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, CalendarDays, Fingerprint, Bell, User } from 'lucide-react';
import { text, ink, surface } from './ui/tokens';
import { useApp } from '../../context/AppContext';

interface Tab {
  name: string;
  path: string;
  icon: React.ElementType;
  /** tab tengah tampil sebagai tombol aksi utama, bukan ikon biasa */
  primary?: boolean;
}

/**
 * Kelima rute ini adalah tab sejajar — hanya di sinilah navigasi bawah muncul.
 * Layar lain (modul yang dibuka dari menu beranda) memakai tombol kembali.
 */
export const TAB_UTAMA = [
  '/mobile/home',
  '/mobile/attendance',
  '/mobile/live-attendance',
  '/mobile/notifications',
  '/mobile/profile',
] as const;

const TABS: Tab[] = [
  { name: 'Beranda', path: '/mobile/home', icon: Home },
  { name: 'Absensi', path: '/mobile/attendance', icon: CalendarDays },
  { name: 'Absen', path: '/mobile/live-attendance', icon: Fingerprint, primary: true },
  { name: 'Notifikasi', path: '/mobile/notifications', icon: Bell },
  { name: 'Profil', path: '/mobile/profile', icon: User },
];

const MobileBottomNav: React.FC = () => {
  const { pathname } = useLocation();
  const { notifications } = useApp();

  const belumDibaca = notifications?.filter(n => !n.read).length ?? 0;

  return (
    <nav
      className={`shrink-0 ${surface.card} border-t ${surface.divider}`}
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex items-stretch">
        {TABS.map(tab => {
          const aktif = pathname === tab.path || pathname.startsWith(`${tab.path}/`);
          const Icon = tab.icon;

          if (tab.primary) {
            // Aksi utama aplikasi ini adalah absen. Diberi bobot visual paling
            // besar supaya tidak setara dengan tab navigasi biasa.
            return (
              <Link
                key={tab.path}
                to={tab.path}
                aria-label={tab.name}
                aria-current={aktif ? 'page' : undefined}
                className="flex-1 flex flex-col items-center justify-end pb-1.5 -mt-5"
              >
                <span
                  className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg shadow-primary/25 transition-transform active:scale-95 ${
                    aktif ? 'bg-primary-dark' : 'bg-primary'
                  }`}
                >
                  <Icon className="w-7 h-7 text-white" strokeWidth={2} />
                </span>
                <span className={`${text.caption} font-semibold mt-1 text-primary`}>
                  {tab.name}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={tab.path}
              to={tab.path}
              aria-current={aktif ? 'page' : undefined}
              className="flex-1 min-h-[56px] flex flex-col items-center justify-center gap-1 pt-1.5 pb-1.5 active:opacity-60 transition-opacity"
            >
              <span className="relative">
                <Icon
                  className={`w-[22px] h-[22px] ${aktif ? 'text-primary' : ink.faint}`}
                  // Ketebalan garis dipakai untuk menandai tab aktif, bukan
                  // efek skala yang membuat baris nav bergoyang saat berpindah.
                  strokeWidth={aktif ? 2.4 : 1.8}
                />
                {tab.name === 'Notifikasi' && belumDibaca > 0 && (
                  <span className="absolute -top-1 -right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-danger text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
                    {belumDibaca > 9 ? '9+' : belumDibaca}
                  </span>
                )}
              </span>
              <span
                className={`${text.caption} ${
                  aktif ? 'font-semibold text-primary' : `font-medium ${ink.faint}`
                }`}
              >
                {tab.name}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileBottomNav;
