import { useCallback, useEffect, useState } from 'react';

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
  minta: () => void;
}

const PESAN_ERROR: Record<number, string> = {
  1: 'Izin lokasi ditolak. Aktifkan izin lokasi untuk aplikasi ini.',
  2: 'Lokasi tidak tersedia. Pastikan GPS aktif.',
  3: 'Waktu pencarian lokasi habis. Coba lagi di area terbuka.',
};

/**
 * Lokasi perangkat sebenarnya.
 *
 * Sebelumnya koordinat absen ditulis tetap di dalam komponen
 * (-7.795580, 110.369490 "Jl. Melati No. 12") sehingga setiap karyawan
 * tercatat absen dari titik yang sama — data absensinya jadi tidak bermakna.
 */
export function useGeolocation(otomatis = true): HasilLokasi {
  const [posisi, setPosisi] = useState<Posisi | null>(null);
  const [alamat, setAlamat] = useState<string | null>(null);
  const [memuat, setMemuat] = useState(otomatis);
  const [error, setError] = useState<string | null>(null);

  const minta = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setError('Perangkat ini tidak mendukung penentuan lokasi.');
      setMemuat(false);
      return;
    }

    setMemuat(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosisi({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          akurasi: Math.round(pos.coords.accuracy),
        });
        setMemuat(false);
      },
      (err) => {
        setError(PESAN_ERROR[err.code] ?? 'Gagal mendapatkan lokasi.');
        setMemuat(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 },
    );
  }, []);

  useEffect(() => {
    if (otomatis) minta();
  }, [otomatis, minta]);

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
  }, [posisi]);

  return { posisi, alamat, memuat, error, minta };
}
