/**
 * Titik kantor dan aturan jarak absensi.
 *
 * Berkas ini adalah satu-satunya sumber koordinat kantor. Aplikasi Android
 * mengambil daftarnya dari server lewat /api/attendances/kantor, bukan
 * menyimpan salinannya sendiri, supaya menambah atau memindahkan kantor cukup
 * dilakukan di sini tanpa membangun ulang APK.
 *
 * Penegakan jarak dilakukan di server. Pemeriksaan di ponsel hanya untuk
 * memberi tahu pengguna lebih awal; koordinat yang dikirim dari peramban bisa
 * dipalsukan, jadi keputusannya tidak boleh bergantung pada itu.
 */

export interface Kantor {
  id: string;
  nama: string;
  lat: number;
  lng: number;
}

export const KANTOR: Kantor[] = [
  { id: 'pusat',    nama: 'Kantor Pusat',   lat: -7.5876434230544625, lng: 110.92156060184888 },
  { id: 'matesih',  nama: 'Kas Matesih',    lat: -7.640994326257833,  lng: 111.04872255621707 },
  { id: 'jumapolo', nama: 'Kas Jumapolo',   lat: -7.700636089297331,  lng: 111.00178222599617 },
  { id: 'klodran',  nama: 'Kas Klodran',    lat: -7.533948795607715,  lng: 110.79147304635002 },
];

/** Jarak maksimum dari kantor terdekat agar absen diterima. */
export const RADIUS_ABSEN_METER = 50;

/**
 * Batas ketidakakuratan GPS yang masih dianggap layak dipercaya.
 *
 * Di dalam gedung atau saat sinyal lemah, ponsel bisa melaporkan posisi dengan
 * ketidakpastian ratusan meter. Menolaknya sebagai "di luar radius" menyesatkan
 * — yang sebenarnya terjadi adalah posisinya belum diketahui dengan cukup
 * yakin. Dibedakan supaya pesannya bisa menyarankan tindakan yang benar:
 * keluar sebentar ke tempat terbuka, bukan mendekat ke kantor.
 */
export const AKURASI_MAKS_METER = 100;

/** Jarak dua titik di permukaan bumi dalam meter (haversine). */
export function jarakMeter(
  lat1: number, lng1: number, lat2: number, lng2: number,
): number {
  const R = 6_371_000;
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(lat2 - lat1);
  const dLng = rad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)));
}

export interface HasilKantorTerdekat {
  kantor: Kantor;
  jarak: number;
  diDalamRadius: boolean;
}

/** Kantor terdekat dari sebuah titik, beserta jaraknya. */
export function kantorTerdekat(lat: number, lng: number): HasilKantorTerdekat | null {
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || KANTOR.length === 0) return null;

  let terdekat = KANTOR[0];
  let jarak = jarakMeter(lat, lng, terdekat.lat, terdekat.lng);
  for (const k of KANTOR.slice(1)) {
    const d = jarakMeter(lat, lng, k.lat, k.lng);
    if (d < jarak) { terdekat = k; jarak = d; }
  }
  return { kantor: terdekat, jarak, diDalamRadius: jarak <= RADIUS_ABSEN_METER };
}

/**
 * Memeriksa apakah sebuah titik boleh dipakai absen.
 *
 * Mengembalikan alasan yang bisa langsung ditampilkan ke pengguna, bukan
 * sekadar benar/salah, supaya layar tidak perlu menyusun kalimatnya sendiri
 * dan pesan di web maupun aplikasi selalu sama.
 */
export interface HasilPeriksaLokasi {
  boleh: boolean;
  /** Terisi bila tidak boleh; kalimatnya siap ditampilkan apa adanya. */
  alasan?: string;
  /** Terisi bila boleh. */
  kantor?: Kantor;
  jarak?: number;
}

/*
 * Memakai satu bentuk dengan kolom opsional, bukan union yang dibedakan oleh
 * `boleh: true | false`. Proyek ini tidak menyalakan `strict` di tsconfig,
 * sehingga strictNullChecks mati dan TypeScript tidak menyempitkan union
 * semacam itu — `lokasi.alasan` akan dianggap galat walau sudah di dalam
 * penjagaan `if (!lokasi.boleh)`.
 */
export function periksaLokasiAbsen(
  lat: unknown, lng: unknown, akurasi?: unknown,
): HasilPeriksaLokasi {
  const la = Number(lat), ln = Number(lng);
  if (!Number.isFinite(la) || !Number.isFinite(ln)) {
    return { boleh: false, alasan: 'Lokasi belum terbaca. Nyalakan GPS lalu coba lagi.' };
  }

  const akur = Number(akurasi);
  if (Number.isFinite(akur) && akur > AKURASI_MAKS_METER) {
    return {
      boleh: false,
      alasan:
        `Sinyal GPS belum cukup akurat (meleset hingga ${Math.round(akur)} meter). ` +
        `Coba berdiri di tempat terbuka sebentar, lalu ulangi.`,
    };
  }

  const dekat = kantorTerdekat(la, ln);
  if (!dekat) {
    return { boleh: false, alasan: 'Daftar kantor belum tersedia.' };
  }
  if (!dekat.diDalamRadius) {
    return {
      boleh: false,
      alasan:
        `Anda berada ${Math.round(dekat.jarak).toLocaleString('id-ID')} meter dari ` +
        `${dekat.kantor.nama}. Absen hanya bisa dilakukan dalam radius ` +
        `${RADIUS_ABSEN_METER} meter dari kantor.`,
    };
  }
  return { boleh: true, kantor: dekat.kantor, jarak: dekat.jarak };
}
