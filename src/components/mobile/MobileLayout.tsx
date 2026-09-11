import React, { useCallback, useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import MobileBottomNav, { TAB_UTAMA } from './MobileBottomNav';
import { useAndroidBackButton } from '../../hooks/useAndroidBackButton';
import { useMobileAttendance } from '../../hooks/useMobileAttendance';
import { useKantorAbsen } from '../../hooks/useKantorAbsen';
import { usePengingatAbsen } from '../../hooks/usePengingatAbsen';
import { radius, text } from './ui/tokens';
import { surface } from './ui/tokens';

export const MobileLayout: React.FC = () => {
  /*
   * Pengingat absen dipasang di kerangka, bukan di layar absen.
   *
   * Kalau dipasang di layar absen, jadwalnya hanya diperbarui ketika pegawai
   * membuka layar itu — padahal justru yang lupa membukanya yang perlu
   * diingatkan. Di sini, setiap kali aplikasi dibuka jadwalnya disegarkan.
   */
  const { hariIni } = useMobileAttendance();
  const { jamMasuk, jamPulang } = useKantorAbsen(null);
  usePengingatAbsen({
    jamMasuk,
    jamPulang,
    sudahMasuk: !!hariIni?.clock_in_time,
    sudahPulang: !!hariIni?.clock_out_time,
  });

  const { pathname } = useLocation();
  const [pesanKeluar, setPesanKeluar] = useState(false);

  /*
   * Tombol kembali perangkat. Tanpa ini, Android menutup aplikasi dari layar
   * mana pun — termasuk saat pengguna baru masuk satu tingkat ke dalam.
   */
  const peringatkanKeluar = useCallback(() => setPesanKeluar(true), []);
  useAndroidBackButton(peringatkanKeluar);

  useEffect(() => {
    if (!pesanKeluar) return;
    const t = setTimeout(() => setPesanKeluar(false), 2000);
    return () => clearTimeout(t);
  }, [pesanKeluar]);

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
        <main
          key={pathname}
          /* scrollbar-hide: tanpa ini bilah gulir 6px memakan lebar dan
             menyisakan celah di tepi kanan, terlihat jelas pada kepala
             beranda yang berwarna. */
          className="flex-1 overflow-y-auto overscroll-contain scrollbar-hide"
        >
          <Outlet />
        </main>

        {tampilkanNav && <MobileBottomNav />}

        {/* Konfirmasi keluar, gaya snackbar Material. */}
        {pesanKeluar && (
          <div
            role="status"
            className={`absolute left-1/2 -translate-x-1/2 bottom-24 z-50 px-4 py-2.5 ${radius.pill} bg-slate-900 text-white ${text.footnote} font-medium shadow-lg whitespace-nowrap`}
          >
            Tekan sekali lagi untuk keluar
          </div>
        )}
      </div>
    </div>
  );
};
