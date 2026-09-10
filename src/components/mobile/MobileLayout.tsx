import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import MobileBottomNav, { TAB_UTAMA } from './MobileBottomNav';
import { surface } from './ui/tokens';

export const MobileLayout: React.FC = () => {
  const { pathname } = useLocation();

  /*
   * Navigasi bawah hanya muncul di lima tab utama.
   *
   * Layar yang dibuka dari menu beranda adalah tujuan berikutnya dalam satu
   * alur, bukan tab sejajar — di sana yang benar adalah tombol kembali di
   * bilah atas. Menampilkan navigasi bawah sekaligus tombol kembali memberi
   * dua arah pulang yang berbeda dan memakan ruang layar yang sudah sempit.
   */
  const tampilkanNav = TAB_UTAMA.some(
    t => pathname === t || pathname.startsWith(`${t}/`),
  );

  return (
    // h-dvh, bukan min-h-screen: di browser HP, 100vh termasuk area yang
    // tertutup bilah URL, sehingga navigasi bawah ikut terdorong keluar layar.
    <div className={`h-dvh flex justify-center ${surface.page}`}>
      <div className={`w-full max-w-md h-full flex flex-col ${surface.page} relative overflow-hidden`}>
        {/*
          key={pathname} mereset posisi gulir saat berpindah layar. Tanpa ini,
          membuka layar baru bisa mendarat di tengah halaman karena posisi
          gulir layar sebelumnya ikut terbawa.
        */}
        <main key={pathname} className="flex-1 overflow-y-auto overscroll-contain">
          <Outlet />
        </main>

        {tampilkanNav && <MobileBottomNav />}
      </div>
    </div>
  );
};
