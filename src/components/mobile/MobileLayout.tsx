import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import MobileBottomNav from './MobileBottomNav';
import { surface } from './ui/tokens';

export const MobileLayout: React.FC = () => {
  const { pathname } = useLocation();

  return (
    // h-dvh, bukan min-h-screen: di browser HP, 100vh termasuk area yang
    // tertutup bilah URL, sehingga navigasi bawah ikut terdorong keluar layar.
    <div className={`h-dvh flex justify-center ${surface.page}`}>
      <div className={`w-full max-w-md h-full flex flex-col ${surface.page} relative overflow-hidden`}>
        {/*
          key={pathname} mereset posisi gulir saat berpindah tab. Tanpa ini,
          membuka tab baru bisa mendarat di tengah halaman karena posisi gulir
          layar sebelumnya ikut terbawa.
        */}
        <main key={pathname} className="flex-1 overflow-y-auto overscroll-contain">
          <Outlet />
        </main>

        <MobileBottomNav />
      </div>
    </div>
  );
};
