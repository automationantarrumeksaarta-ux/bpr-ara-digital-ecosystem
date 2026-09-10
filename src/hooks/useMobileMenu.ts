import type React from 'react';
import { useMemo } from 'react';
import {
  BadgeCheck, CalendarDays, Camera, FileText, LayoutDashboard, ListChecks, Wallet,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { isItemAllowed } from '../utils/access';
import { navigationConfig } from '../config/navigationConfig';

export interface MobileMenuItem {
  id: string;
  label: string;
  icon: React.ElementType;
  path: string;
  /** modul yang hanya ada di aplikasi, belum ada padanannya di web */
  mobileOnly?: boolean;
}

/**
 * Menu aplikasi adalah DAFTAR PILIHAN, bukan cerminan seluruh menu web.
 *
 * Versi sebelumnya menampilkan semua modul yang boleh diakses lalu memotongnya
 * di item ke-8. Karena modul khusus aplikasi (Aktivitas, Info Gaji) ditaruh
 * paling akhir, keduanya SELALU terpotong dan tidak pernah muncul sama sekali.
 * Modul seperti Analisis Kredit, Survey Lapangan, dan Appraisal pun ikut
 * tampil padahal pekerjaannya dilakukan di meja, bukan di lapangan.
 *
 * Sekarang isinya ditetapkan eksplisit, dan tidak ada pemotongan.
 */
interface DefinisiMenu {
  id: string;
  label: string;
  icon: React.ElementType;
  path: string;
  /** id modul web yang menentukan hak aksesnya; kosong = selalu boleh */
  izinDari?: string;
  mobileOnly?: boolean;
}

const MENU_APK: DefinisiMenu[] = [
  { id: 'EXECUTIVE_DASHBOARD', label: 'Dashboard\nUmum', icon: LayoutDashboard, path: '/mobile/ringkasan', izinDari: 'EXECUTIVE_DASHBOARD' },
  { id: 'FLOW_TASKS', label: 'Task Board', icon: ListChecks, path: '/mobile/tugas', izinDari: 'FLOW_TASKS' },
  { id: 'DECISION_QUEUE', label: 'Approval\nQueue', icon: BadgeCheck, path: '/mobile/persetujuan', izinDari: 'DECISION_QUEUE' },
  { id: 'CALENDAR_VIEW', label: 'Kalender', icon: CalendarDays, path: '/mobile/kalender', izinDari: 'CALENDAR_VIEW' },
  { id: 'LOS_CREDIT', label: 'Loan\nOrigination', icon: FileText, path: '/mobile/kredit', izinDari: 'LOS_CREDIT' },

  // Modul khusus aplikasi — selalu tersedia, tidak bergantung menu web.
  { id: 'ACTIVITIES', label: 'Aktivitas', icon: Camera, path: '/mobile/aktivitas', mobileOnly: true },
  { id: 'INFO_GAJI', label: 'Info Gaji', icon: Wallet, path: '/mobile/info-gaji', mobileOnly: true },
];

/** Cari definisi item di navigationConfig untuk mengecek hak aksesnya. */
function itemWeb(id: string) {
  for (const grup of navigationConfig) {
    for (const item of grup.items) {
      if (item.id === id) return item;
      for (const anak of item.children ?? []) {
        if (anak.id === id) return anak;
      }
    }
  }
  return null;
}

/**
 * Menu beranda aplikasi. Modul web tetap tunduk pada aturan RBAC yang sama
 * dengan web; modul khusus aplikasi selalu tampil.
 */
export function useMobileMenu(): { items: MobileMenuItem[]; total: number } {
  const { currentUser, rolePermissions } = useApp();

  return useMemo(() => {
    const items = MENU_APK.filter(m => {
      if (m.mobileOnly || !m.izinDari) return true;
      const web = itemWeb(m.izinDari);
      return web ? isItemAllowed(web, currentUser?.role, rolePermissions) : false;
    }).map(({ izinDari, ...rest }) => rest);

    return { items, total: items.length };
  }, [currentUser?.role, rolePermissions]);
}
