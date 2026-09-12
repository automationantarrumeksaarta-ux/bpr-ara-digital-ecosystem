import { useEffect, useMemo, useState } from 'react';
import { headerAuth } from '../utils/api';

/**
 * Daftar kantor dan aturan radius absen, diambil dari server.
 *
 * Tidak ditanam di dalam aplikasi supaya menambah atau memindahkan kantor
 * cukup diubah di backend/kantor.ts tanpa membangun ulang APK.
 *
 * Perhitungan jarak di sini hanya untuk memberi tahu pengguna lebih awal —
 * mana kantor terdekat, berapa meter lagi. Yang menentukan absen diterima atau
 * ditolak tetap pemeriksaan di server, karena koordinat yang dikirim peramban
 * bisa dipalsukan.
 */

export interface Kantor {
  id: string;
  nama: string;
  lat: number;
  lng: number;
}

/**
 * Haversine. Rumusnya sengaja disalin dari backend/kantor.ts karena kode
 * peramban tidak bisa mengimpor berkas backend. Rumus ini tetap, jadi tidak
 * ada risiko keduanya berbeda; yang bisa berubah — daftar kantor dan radiusnya
 * — justru diambil dari server supaya selalu satu sumber.
 */
export function jarakMeter(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6_371_000;
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(lat2 - lat1);
  const dLng = rad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)));
}

interface Hasil {
  memuat: boolean;
  kantor: Kantor[];
  radiusMeter: number;
  akurasiMaksMeter: number;
  /** Jam operasional kantor, "HH:MM". */
  jamMasuk: string;
  jamPulang: string;
  /** Sumber ubin peta bila diatur di server; null berarti pakai bawaan. */
  petaUbinUrl: string | null;
  petaAtribusi: string | null;
  /** null selama daftar kantor atau posisi belum ada. */
  terdekat: { kantor: Kantor; jarak: number; diDalamRadius: boolean } | null;
  /**
   * Jarak ke SEMUA kantor, terdekat lebih dulu.
   *
   * Dipakai menelusuri absen yang tertolak: bila kantor tempat pegawai berdiri
   * ternyata bukan yang terdekat menurut hitungan, berarti koordinat kantor itu
   * yang meleset — bukan ponselnya.
   */
  semuaJarak: { kantor: Kantor; jarak: number }[];
}

export function useKantorAbsen(posisi: { lat: number; lng: number; akurasi?: number } | null): Hasil {
  const [kantor, setKantor] = useState<Kantor[]>([]);
  const [radiusMeter, setRadius] = useState(50);
  const [akurasiMaksMeter, setAkurasiMaks] = useState(100);
  const [jamMasuk, setJamMasuk] = useState('08:00');
  const [jamPulang, setJamPulang] = useState('17:00');
  const [petaUbinUrl, setPetaUbinUrl] = useState<string | null>(null);
  const [petaAtribusi, setPetaAtribusi] = useState<string | null>(null);
  const [memuat, setMemuat] = useState(true);

  useEffect(() => {
    let dibatalkan = false;
    (async () => {
      try {
        const res = await fetch('/api/attendances/kantor', { headers: headerAuth() });
        const json = await res.json();
        if (dibatalkan) return;
        setKantor(json.kantor ?? []);
        if (Number.isFinite(json.radiusMeter)) setRadius(json.radiusMeter);
        if (Number.isFinite(json.akurasiMaksMeter)) setAkurasiMaks(json.akurasiMaksMeter);
        if (typeof json.jamMasuk === 'string') setJamMasuk(json.jamMasuk);
        if (typeof json.jamPulang === 'string') setJamPulang(json.jamPulang);
        if (typeof json.petaUbinUrl === 'string') setPetaUbinUrl(json.petaUbinUrl);
        if (typeof json.petaAtribusi === 'string') setPetaAtribusi(json.petaAtribusi);
      } catch {
        // Dibiarkan kosong: layar tetap boleh mengirim absen, dan server yang
        // memutuskan. Memblokir absen hanya karena daftar kantor gagal dimuat
        // akan menghukum pegawai atas masalah jaringan.
      } finally {
        if (!dibatalkan) setMemuat(false);
      }
    })();
    return () => { dibatalkan = true; };
  }, []);

  const terdekat = useMemo(() => {
    if (!posisi || kantor.length === 0) return null;
    let pilih = kantor[0];
    let jarak = jarakMeter(posisi.lat, posisi.lng, pilih.lat, pilih.lng);
    for (const k of kantor.slice(1)) {
      const d = jarakMeter(posisi.lat, posisi.lng, k.lat, k.lng);
      if (d < jarak) { pilih = k; jarak = d; }
    }
    /*
     * Ketidakpastian GPS ikut diperhitungkan, sama seperti di server.
     *
     * Di dalam gedung ponsel lazim melaporkan akurasi 20–60 meter, sehingga
     * pegawai yang benar-benar berada di kantor bisa terbaca puluhan meter di
     * luar titiknya. Yang dibandingkan adalah jarak terdekat yang masih
     * mungkin, yaitu jarak terbaca dikurangi ketidakpastiannya.
     */
    const toleransi = Number.isFinite(posisi.akurasi) && (posisi.akurasi ?? 0) > 0
      ? Math.min(posisi.akurasi!, akurasiMaksMeter)
      : 0;
    const terdekatMungkin = Math.max(0, jarak - toleransi);

    return { kantor: pilih, jarak, diDalamRadius: terdekatMungkin <= radiusMeter };
  }, [posisi?.lat, posisi?.lng, posisi?.akurasi, kantor, radiusMeter, akurasiMaksMeter]);

  const semuaJarak = useMemo(() => {
    if (!posisi || kantor.length === 0) return [];
    return kantor
      .map(k => ({ kantor: k, jarak: jarakMeter(posisi.lat, posisi.lng, k.lat, k.lng) }))
      .sort((a, b) => a.jarak - b.jarak);
  }, [posisi?.lat, posisi?.lng, kantor]);

  return {
    memuat, kantor, radiusMeter, akurasiMaksMeter,
    jamMasuk, jamPulang, petaUbinUrl, petaAtribusi, terdekat, semuaJarak,
  };
}
