import { useEffect, useState } from 'react';
import { isNativeApp } from '../utils/platform';

/**
 * Pemeriksaan keutuhan perangkat untuk absensi.
 *
 * Menjawab satu pertanyaan: apakah ponsel ini sedang disiapkan untuk
 * memalsukan kehadiran. Dua hal diperiksa, dan keduanya BERBEDA:
 *
 * - `lokasiPalsu` — ada penyedia lokasi tiruan yang sedang dipakai. Ini bukti
 *   yang sesungguhnya, dan inilah yang paling layak dipakai memblokir.
 * - `modePengembang` — Opsi Pengembang menyala. Ini syarat untuk memasang
 *   lokasi palsu, bukan buktinya. Banyak orang menyalakannya untuk hal yang
 *   sama sekali tidak berkaitan dengan absen.
 *
 * Seluruh pemeriksaan GAGAL-TERBUKA. Bila plugin tidak ada, tidak didukung,
 * atau melempar galat, hasilnya dianggap aman. Aplikasi absensi yang menolak
 * dibuka karena pemeriksaannya sendiri bermasalah jauh lebih merugikan
 * daripada satu ponsel yang lolos.
 */

export interface HasilKeamanan {
  memeriksa: boolean;
  /** Plugin tersedia dan menjawab. Di web selalu false. */
  didukung: boolean;
  modePengembang: boolean;
  lokasiPalsu: boolean;
  periksaUlang: () => void;
}

export function useKeamananPerangkat(): HasilKeamanan {
  const [memeriksa, setMemeriksa] = useState(true);
  const [didukung, setDidukung] = useState(false);
  const [modePengembang, setModePengembang] = useState(false);
  const [lokasiPalsu, setLokasiPalsu] = useState(false);
  const [pemicu, setPemicu] = useState(0);

  useEffect(() => {
    let dibatalkan = false;

    (async () => {
      setMemeriksa(true);
      try {
        if (!isNativeApp()) return;
        const plugin = (window as any).Capacitor?.Plugins?.KeamananPerangkat;
        if (!plugin?.periksa) return;

        const hasil = await plugin.periksa();
        if (dibatalkan) return;
        setDidukung(!!hasil?.didukung);
        setModePengembang(!!hasil?.modePengembang);
        setLokasiPalsu(!!hasil?.lokasiPalsu);
      } catch (e) {
        // Gagal-terbuka, dan catat supaya bisa ditelusuri lewat logcat.
        console.warn('Pemeriksaan keutuhan perangkat gagal:', e);
      } finally {
        if (!dibatalkan) setMemeriksa(false);
      }
    })();

    return () => { dibatalkan = true; };
  }, [pemicu]);

  return {
    memeriksa,
    didukung,
    modePengembang,
    lokasiPalsu,
    periksaUlang: () => setPemicu(n => n + 1),
  };
}
