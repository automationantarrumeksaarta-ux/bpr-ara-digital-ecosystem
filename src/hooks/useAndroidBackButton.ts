import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { App } from '@capacitor/app';
import { isNativeApp, RUTE_AWAL_MOBILE } from '../utils/platform';

/**
 * Tombol kembali perangkat Android.
 *
 * Capacitor 8 tidak meng-override onBackPressed pada BridgeActivity, sehingga
 * perilaku bawaan Android berlaku: activity ditutup dan aplikasi keluar —
 * berapa pun dalamnya pengguna sudah menelusuri layar. Pengguna yang sedang
 * membuka Info Gaji dan menekan kembali akan langsung terlempar keluar.
 *
 * Aturan yang dipasang di sini:
 *  1. Bila masih ada riwayat di dalam aplikasi, mundur satu layar.
 *  2. Dari layar mana pun yang bukan beranda, kembali ke beranda.
 *  3. Di beranda, tekan dua kali dalam dua detik untuk keluar — supaya tidak
 *     keluar karena tidak sengaja tersenggol.
 */

/** Rute yang dianggap "akar" — menekan kembali di sini berarti hendak keluar. */
const AKAR = new Set<string>([RUTE_AWAL_MOBILE, '/mobile', '/']);

const JEDA_KELUAR_MS = 2000;

export function useAndroidBackButton(onPeringatanKeluar?: () => void) {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!isNativeApp()) return;

    let terakhirDitekan = 0;
    let lepas: (() => void) | undefined;

    const pasang = async () => {
      const handle = await App.addListener('backButton', () => {
        // Lembar penuh (kamera, form tugas) memasang penanda ini supaya
        // tombol kembali menutup lembarnya lebih dulu, bukan pindah layar.
        const lembar = document.querySelector('[data-lembar-terbuka]') as HTMLElement | null;
        if (lembar) {
          lembar.dispatchEvent(new CustomEvent('tutup-lembar', { bubbles: true }));
          return;
        }

        if (!AKAR.has(location.pathname)) {
          // window.history.length > 1 berarti ada layar sebelumnya di dalam
          // aplikasi; kalau tidak ada (mis. dibuka langsung ke layar dalam),
          // arahkan ke beranda daripada membiarkan pengguna buntu.
          if (window.history.length > 1) navigate(-1);
          else navigate(RUTE_AWAL_MOBILE, { replace: true });
          return;
        }

        const sekarang = Date.now();
        if (sekarang - terakhirDitekan < JEDA_KELUAR_MS) {
          App.exitApp();
        } else {
          terakhirDitekan = sekarang;
          onPeringatanKeluar?.();
        }
      });
      lepas = () => { handle.remove(); };
    };

    pasang();
    return () => { lepas?.(); };
  }, [navigate, location.pathname, onPeringatanKeluar]);
}
