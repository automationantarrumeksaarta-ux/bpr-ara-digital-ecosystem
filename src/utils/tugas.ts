/**
 * Tugas yang sudah lewat hari tetapi statusnya belum bergerak.
 *
 * Dipakai bersama oleh Task Board versi web dan versi aplikasi, supaya
 * hitungannya tidak pernah berbeda antara keduanya.
 */

/** Status yang dianggap sudah tuntas; tidak perlu diingatkan lagi. */
const STATUS_TUNTAS = new Set([
  'validated closed', 'improved', 'accepted', 'selesai', 'done', 'closed',
]);

export const sudahTuntas = (status: string | undefined): boolean =>
  STATUS_TUNTAS.has((status ?? '').trim().toLowerCase());

interface TugasTenggat {
  tanggal?: string;
  deadline?: string;
  timeline?: string;
  status?: string;
}

/**
 * Tanggal yang dipakai menilai keterlambatan.
 *
 * `deadline` didahulukan bila ada, karena itulah janji penyelesaiannya.
 * `tanggal` adalah hari tugas dicatat dan dipakai sebagai cadangan — banyak
 * tugas di data lama hanya punya itu.
 */
function tenggat(t: TugasTenggat): Date | null {
  const nilai = t.deadline || t.timeline || t.tanggal;
  if (!nilai) return null;
  const d = new Date(String(nilai));
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Awal hari ini menurut waktu perangkat; jam tidak ikut dibandingkan. */
const awalHariIni = (): number => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

/**
 * Berapa hari sebuah tugas terlambat. Nol atau kurang berarti belum terlambat.
 */
export function hariTerlambat(t: TugasTenggat): number {
  if (sudahTuntas(t.status)) return 0;
  const d = tenggat(t);
  if (!d) return 0;
  d.setHours(0, 0, 0, 0);
  const selisih = awalHariIni() - d.getTime();
  return selisih > 0 ? Math.floor(selisih / 86_400_000) : 0;
}

export const terlambat = (t: TugasTenggat): boolean => hariTerlambat(t) > 0;

/**
 * Tugas yang sudah lewat hari tetapi belum tuntas, terlama lebih dulu.
 *
 * Sengaja tidak menyaring berdasarkan pemilik: pemanggilnya yang sudah
 * menyaring daftar tugas sesuai hak aksesnya lewat src/utils/hirarki.ts.
 */
export function tugasTertunggak<T extends TugasTenggat>(daftar: T[]): T[] {
  return (daftar ?? [])
    .filter(terlambat)
    .sort((a, b) => hariTerlambat(b) - hariTerlambat(a));
}
