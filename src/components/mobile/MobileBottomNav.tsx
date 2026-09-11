import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
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

/**
 * Pegas yang dipakai seluruh gerakan di bilah ini.
 *
 * Ditahan agar cepat selesai: pengguna menekan tab untuk berpindah, bukan untuk
 * menonton animasinya. Gerak di sini menerangkan perpindahan, bukan menghiasi.
 */
const PEGAS = { type: 'spring' as const, stiffness: 520, damping: 38, mass: 0.7 };

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
                <motion.span
                  className={`relative w-14 h-14 rounded-full flex items-center justify-center shadow-lg shadow-primary/30 ${
                    aktif ? 'bg-primary-dark' : 'bg-primary'
                  }`}
                  whileTap={{ scale: 0.92 }}
                  animate={{ scale: aktif ? 1.06 : 1 }}
                  transition={PEGAS}
                >
                  {/*
                    Cincin lembut saat tab absen aktif. Sekadar penegas keadaan,
                    bukan denyut berulang — animasi yang tidak pernah berhenti
                    menarik mata terus-menerus dari isi layar.
                  */}
                  {aktif && (
                    <motion.span
                      aria-hidden
                      layoutId="cincin-absen"
                      className="absolute -inset-1.5 rounded-full border-2 border-primary/30"
                      transition={PEGAS}
                    />
                  )}
                  <Icon className="w-7 h-7 text-white" strokeWidth={2} />
                </motion.span>
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
              className="relative flex-1 min-h-[56px] flex flex-col items-center justify-center gap-1 pt-1.5 pb-1.5"
            >
              {/*
                Satu pil biru yang BERPINDAH antar tab, bukan empat pil yang
                muncul-hilang. `layoutId` yang sama membuat motion menganimasikan
                perpindahannya, sehingga terlihat ke mana fokus berpindah.
              */}
              {aktif && (
                <motion.span
                  aria-hidden
                  layoutId="pil-tab-aktif"
                  className="absolute inset-x-3 inset-y-1 rounded-2xl bg-primary/10"
                  transition={PEGAS}
                />
              )}

              <motion.span
                className="relative"
                animate={{ y: aktif ? -1 : 0, scale: aktif ? 1.08 : 1 }}
                whileTap={{ scale: 0.88 }}
                transition={PEGAS}
              >
                <Icon
                  className={`w-[22px] h-[22px] transition-colors ${aktif ? 'text-primary' : ink.faint}`}
                  strokeWidth={aktif ? 2.4 : 1.8}
                />
                {tab.name === 'Notifikasi' && belumDibaca > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={PEGAS}
                    className="absolute -top-1 -right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-danger text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white"
                  >
                    {belumDibaca > 9 ? '9+' : belumDibaca}
                  </motion.span>
                )}
              </motion.span>

              <span
                className={`relative ${text.caption} transition-colors ${
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
