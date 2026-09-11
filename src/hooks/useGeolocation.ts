import { useCallback, useEffect, useRef, useState } from 'react';

export interface Posisi {
  lat: number;
  lng: number;
  /** radius ketidakpastian dalam meter */
  akurasi: number;
}

export interface HasilLokasi {
  posisi: Posisi | null;
  alamat: string | null;
  memuat: boolean;
  error: string | null;
  /** Masih menunggu pembacaan yang lebih baik. */
  menajam: boolean;
  minta: () => void;
}

const PESAN_ERROR: Record<number, string> = {
  1: 'Izin lokasi ditolak. Aktifkan izin lokasi untuk aplikasi ini.',
  2: 'Lokasi tidak tersedia. Pastikan GPS aktif.',
  3: 'Waktu pencarian lokasi habis. Coba lagi di area terbuka.',
};

/** Akurasi yang dianggap sudah cukup baik; pencarian berhenti di sini. */
const AKURASI_CUKUP = 20;

/** Lama menunggu pembacaan yang lebih baik sebelum menyerah dengan yang terbaik. */
const DURASI_MENAJAM = 12_000;

/**
 * Lokasi perangkat sebenarnya.
 *
 * Memakai `watchPosition`, bukan `getCurrentPosition`, dan menyimpan pembacaan
 * TERBAIK selama beberapa detik.
 *
 * Alasannya: di Android, permintaan lokasi pertama hampir selalu dijawab
 * dengan posisi hasil triangulasi jaringan seluler dan Wi-Fi, bukan GPS. Fix
 * pertama itu bisa meleset ratusan meter sampai beberapa kilometer, dan GPS
 * baru mengunci beberapa detik kemudian. `getCurrentPosition` mengambil
 * jawaban pertama itu lalu berhenti — sehingga pegawai yang berdiri di dalam
 * kantor terbaca jauh di luar radius, berulang kali, tanpa cara memperbaikinya
 * selain menekan segarkan dan berharap.
 *
 * Sekarang pembacaan terus diamati sampai akurasinya cukup baik atau waktunya
 * habis, dan yang dipakai adalah yang paling akurat. `maximumAge: 0` memaksa
 * pembacaan segar; posisi lama yang tersimpan justru sering yang paling
 * meleset.
 */
export function useGeolocation(otomatis = true): HasilLokasi {
  const [posisi, setPosisi] = useState<Posisi | null>(null);
  const [alamat, setAlamat] = useState<string | null>(null);
  const [memuat, setMemuat] = useState(otomatis);
  const [menajam, setMenajam] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const watchRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const terbaikRef = useRef<Posisi | null>(null);

  const hentikan = useCallback(() => {
    if (watchRef.current !== null) {
      navigator.geolocation.clearWatch(watchRef.current);
      watchRef.current = null;
    }
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setMenajam(false);
  }, []);

  const minta = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setError('Perangkat ini tidak mendukung penentuan lokasi.');
      setMemuat(false);
      return;
    }

    hentikan();
    terbaikRef.current = null;
    setMemuat(true);
    setMenajam(true);
    setError(null);

    watchRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const baru: Posisi = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          akurasi: Math.round(pos.coords.accuracy),
        };

        // Simpan hanya bila lebih akurat daripada yang sudah ada.
        const terbaik = terbaikRef.current;
        if (!terbaik || baru.akurasi < terbaik.akurasi) {
          terbaikRef.current = baru;
          setPosisi(baru);
        }
        setMemuat(false);

        // Sudah cukup tajam — tidak perlu menahan GPS lebih lama.
        if (baru.akurasi <= AKURASI_CUKUP) hentikan();
      },
      (err) => {
        // Galat saat sudah ada pembacaan bukan alasan membuang yang sudah ada.
        if (!terbaikRef.current) {
          setError(PESAN_ERROR[err.code] ?? 'Gagal mendapatkan lokasi.');
        }
        setMemuat(false);
        hentikan();
      },
      { enableHighAccuracy: true, timeout: DURASI_MENAJAM, maximumAge: 0 },
    );

    // Berhenti menajamkan setelah batas waktu, memakai yang terbaik sejauh ini.
    timerRef.current = setTimeout(() => {
      hentikan();
      setMemuat(false);
      if (!terbaikRef.current) {
        setError('Waktu pencarian lokasi habis. Coba lagi di area terbuka.');
      }
    }, DURASI_MENAJAM);
  }, [hentikan]);

  useEffect(() => {
    if (otomatis) minta();
    return hentikan;
  }, [otomatis, minta, hentikan]);

  // Ubah koordinat jadi nama tempat lewat Nominatim. Gagal di sini tidak
  // menghalangi absen — koordinat tetap tercatat, hanya labelnya yang kosong.
  useEffect(() => {
    if (!posisi) return;
    let batal = false;

    (async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${posisi.lat}&lon=${posisi.lng}&zoom=16&accept-language=id`,
          { headers: { Accept: 'application/json' } },
        );
        if (!res.ok) return;
        const json = await res.json();
        if (batal) return;
        const a = json?.address ?? {};
        const bagian = [
          a.road ?? a.hamlet ?? a.neighbourhood,
          a.village ?? a.suburb,
          a.city_district ?? a.municipality ?? a.county,
          a.city ?? a.town ?? a.state,
        ].filter(Boolean);
        setAlamat(bagian.length ? bagian.join(', ') : (json?.display_name ?? null));
      } catch {
        // biarkan alamat null; koordinat sudah cukup untuk mencatat absen
      }
    })();

    return () => { batal = true; };
  }, [posisi?.lat, posisi?.lng]);

  return { posisi, alamat, memuat, error, menajam, minta };
}
