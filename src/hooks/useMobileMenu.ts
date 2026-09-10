import type React from 'react';
import { useMemo } from 'react';
import { Wallet, Camera } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { accessibleItems } from '../utils/access';

export interface MobileMenuItem {
  id: string;
  /** label pendek untuk grid mobile; judul web sering terlalu panjang */
  label: string;
  icon: React.ElementType;
  path: string;
  /** modul yang hanya ada di aplikasi mobile, belum ada padanannya di web */
  mobileOnly?: boolean;
}

/**
 * Judul web -> label pendek untuk grid mobile. Di lebar 4 kolom, teks seperti
 * "Collection Management" akan terpotong atau memaksa 3 baris.
 */
const LABEL_PENDEK: Record<string, string> = {
  'Dashboard Utama': 'Dashboard',
  'Loan Origination': 'Loan\nOrigination',
  'Approval Queue': 'Approval\nQueue',
  'Collection Management': 'Collection',
  'NPL & Restructuring': 'NPL &\nRestruk.',
  'Reports & Analytics': 'Reports',
  'Marketing Activities': 'Marketing',
  'Collateral Appraisal': 'Appraisal',
  'Committee Approval': 'Komite\nKredit',
  'Legal & Documents': 'Legal',
  'Funding Dashboard': 'Funding',
  'Branch Network': 'Jaringan\nCabang',
  'BEIS Reporting': 'BEIS',
  'Customer 360': 'Customer\n360',
  'Credit Analysis': 'Analisis\nKredit',
  'Field Survey': 'Survey\nLapangan',
};

/**
 * Modul yang sudah punya layar versi APK tersendiri.
 *
 * Modul di luar daftar ini tetap membuka halaman web-nya di dalam WebView.
 * Halaman web dirancang untuk layar lebar, jadi terasa sempit di HP — modul
 * yang sering dipakai di lapangan sebaiknya dipindah ke daftar ini.
 */
const VERSI_MOBILE: Record<string, string> = {
  EXECUTIVE_DASHBOARD: '/mobile/ringkasan',
  FLOW_TASKS: '/mobile/tugas',
};

/**
 * Modul yang sengaja TIDAK ditampilkan di aplikasi.
 *
 * Ketiganya adalah pekerjaan meja: mengelola proyek, menelusuri profil
 * nasabah, dan merekap kampanye pemasaran. Semuanya butuh layar lebar dan
 * tidak dikerjakan sambil di lapangan. Pencatatan lapangannya sendiri
 * diwakili menu Aktivitas, yang hasilnya dibaca lewat menu Marketing di web.
 */
const SEMBUNYIKAN_DI_APK = new Set([
  'PROJECT_MANAGEMENT',
  'CRM_CUSTOMERS',
  'MARKETING_ACTIVITY',
]);

/** Modul yang memang hanya hidup di mobile — belum ada halaman web-nya. */
const MOBILE_ONLY: MobileMenuItem[] = [
  { id: 'ACTIVITIES', label: 'Aktivitas', icon: Camera, path: '/mobile/aktivitas', mobileOnly: true },
  { id: 'INFO_GAJI', label: 'Info Gaji', icon: Wallet, path: '/mobile/info-gaji', mobileOnly: true },
];

/**
 * Menu beranda mobile = modul web yang boleh diakses pengguna (memakai aturan
 * RBAC yang sama dengan web) + modul khusus mobile di urutan terakhir.
 *
 * Sebelumnya daftar menu ditulis tetap di MobileHome, sehingga semua peran
 * melihat menu yang sama — termasuk modul yang tidak berhak mereka buka.
 */
export function useMobileMenu(limit?: number): { items: MobileMenuItem[]; total: number } {
  const { currentUser, rolePermissions } = useApp();

  return useMemo(() => {
    const dariWeb = accessibleItems(currentUser?.role, rolePermissions)
      .filter(item => !SEMBUNYIKAN_DI_APK.has(item.id))
      .map(item => ({
      id: item.id,
      label: LABEL_PENDEK[item.title] ?? item.title,
      icon: item.icon,
      path: VERSI_MOBILE[item.id] ?? item.path!,
    }));

    // Buang duplikat path bila satu modul muncul di lebih dari satu grup.
    const unik = new Map<string, MobileMenuItem>();
    for (const m of [...dariWeb, ...MOBILE_ONLY]) {
      if (!unik.has(m.path)) unik.set(m.path, m);
    }

    const semua = [...unik.values()];
    return { items: limit ? semua.slice(0, limit) : semua, total: semua.length };
  }, [currentUser?.role, rolePermissions, limit]);
}
