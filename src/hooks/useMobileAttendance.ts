import { useCallback, useEffect, useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';

export interface AttendanceRecord {
  id: string;
  user_id: string;
  date: string;
  clock_in_time: string | null;
  clock_out_time: string | null;
  clock_in_location: string | null;
  clock_out_location: string | null;
  status: string | null;
}

export interface Rekap {
  hadir: number;
  alpa: number;
  sakit: number;
  izin: number;
  cuti: number;
  lembur: number;
  terlambat: number;
  pulangCepat: number;
  tidakAbsenPulang: number;
  /** hari kerja (Senin–Jumat) yang sudah lewat pada bulan berjalan */
  hariKerja: number;
}

/** Jam masuk standar; lewat dari ini dihitung terlambat. */
const JAM_MASUK = 8;
const JAM_MASUK_MENIT = 15; // toleransi 15 menit
const JAM_PULANG = 17;

/** Jumlah hari kerja Senin–Jumat dalam satu bulan, dibatasi sampai hari ini. */
function hitungHariKerja(tahun: number, bulan: number, hinggaHariIni: boolean): number {
  const akhir = new Date(tahun, bulan, 0).getDate();
  const now = new Date();
  const batas = hinggaHariIni && now.getFullYear() === tahun && now.getMonth() + 1 === bulan
    ? now.getDate()
    : akhir;
  let n = 0;
  for (let d = 1; d <= batas; d++) {
    const hari = new Date(tahun, bulan - 1, d).getDay();
    if (hari !== 0 && hari !== 6) n++;
  }
  return n;
}

/**
 * Terima "08:45" maupun "08.45". Data lama tersimpan dengan titik karena
 * backend memakai format id-ID; sejak diperbaiki, data baru memakai titik dua.
 * Keduanya harus tetap terbaca.
 */
const jamKe = (waktu: string | null): { jam: number; menit: number } | null => {
  if (!waktu) return null;
  const m = waktu.match(/(\d{1,2})[:.](\d{2})/);
  return m ? { jam: Number(m[1]), menit: Number(m[2]) } : null;
};

/** Tampilkan jam selalu sebagai HH:MM, apa pun format simpanannya. */
export const formatJam = (waktu: string | null | undefined): string => {
  const t = jamKe(waktu ?? null);
  return t ? `${String(t.jam).padStart(2, '0')}:${String(t.menit).padStart(2, '0')}` : '--:--';
};

/** Menit sejak tengah malam, untuk perbandingan yang benar. */
export const keMenit = (waktu: string | null | undefined): number | null => {
  const t = jamKe(waktu ?? null);
  return t ? t.jam * 60 + t.menit : null;
};

export function hitungRekap(records: AttendanceRecord[], tahun: number, bulan: number): Rekap {
  const rekap: Rekap = {
    hadir: 0, alpa: 0, sakit: 0, izin: 0, cuti: 0, lembur: 0,
    terlambat: 0, pulangCepat: 0, tidakAbsenPulang: 0,
    hariKerja: hitungHariKerja(tahun, bulan, true),
  };

  for (const r of records) {
    const status = (r.status ?? 'Hadir').toLowerCase();

    if (status.includes('sakit')) rekap.sakit++;
    else if (status.includes('izin')) rekap.izin++;
    else if (status.includes('cuti')) rekap.cuti++;
    else if (status.includes('alpa') || status.includes('alfa')) rekap.alpa++;
    else if (r.clock_in_time) rekap.hadir++;

    const masuk = jamKe(r.clock_in_time);
    if (masuk && (masuk.jam > JAM_MASUK || (masuk.jam === JAM_MASUK && masuk.menit > JAM_MASUK_MENIT))) {
      rekap.terlambat++;
    }

    const pulang = jamKe(r.clock_out_time);
    if (r.clock_in_time && !r.clock_out_time) rekap.tidakAbsenPulang++;
    if (pulang) {
      if (pulang.jam < JAM_PULANG) rekap.pulangCepat++;
      if (pulang.jam >= JAM_PULANG + 1) rekap.lembur++;
    }
  }

  // Alpa = hari kerja yang sudah lewat tanpa catatan apa pun, bila backend
  // tidak mengirim status alpa secara eksplisit.
  if (rekap.alpa === 0) {
    const tercatat = rekap.hadir + rekap.sakit + rekap.izin + rekap.cuti;
    rekap.alpa = Math.max(0, rekap.hariKerja - tercatat);
  }

  return rekap;
}

export interface HasilAbsensi {
  records: AttendanceRecord[];
  rekap: Rekap;
  hariIni: AttendanceRecord | null;
  memuat: boolean;
  error: string | null;
  muatUlang: () => void;
}

/**
 * Ambil data absensi bulan tertentu untuk pengguna aktif.
 * Sebelumnya seluruh angka rekap di layar mobile ditulis 0 secara tetap.
 */
export function useMobileAttendance(tahun?: number, bulan?: number): HasilAbsensi {
  const { currentUser } = useApp();
  const now = new Date();
  const th = tahun ?? now.getFullYear();
  const bl = bulan ?? now.getMonth() + 1;

  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [memuat, setMemuat] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  const muatUlang = useCallback(() => setNonce(n => n + 1), []);

  useEffect(() => {
    if (!currentUser?.id) {
      setMemuat(false);
      return;
    }
    let batal = false;
    setMemuat(true);
    setError(null);

    (async () => {
      try {
        const res = await fetch(
          `/api/attendances?user_id=${encodeURIComponent(currentUser.id)}&month=${bl}&year=${th}`,
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (batal) return;
        setRecords(Array.isArray(json?.data) ? json.data : []);
      } catch (e: any) {
        if (batal) return;
        setError(e?.message ?? 'Gagal memuat data absensi');
        setRecords([]);
      } finally {
        if (!batal) setMemuat(false);
      }
    })();

    return () => { batal = true; };
  }, [currentUser?.id, th, bl, nonce]);

  const rekap = useMemo(() => hitungRekap(records, th, bl), [records, th, bl]);

  const hariIni = useMemo(() => {
    const kunci = new Date().toLocaleDateString('sv-SE'); // YYYY-MM-DD waktu lokal
    return records.find(r => r.date === kunci) ?? null;
  }, [records]);

  return { records, rekap, hariIni, memuat, error, muatUlang };
}
