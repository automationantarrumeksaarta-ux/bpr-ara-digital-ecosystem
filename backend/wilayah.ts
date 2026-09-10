/**
 * Pemetaan wilayah Karesidenan Surakarta (Solo Raya).
 *
 * Dipakai untuk menurunkan kabupaten/kecamatan dari kolom alamat pada file
 * nominatif kredit, supaya data hasil upload bisa diplot ke heat map.
 *
 * PENTING: daftar kecamatan di bawah disusun dari pembagian administratif
 * baku. Kalau penulisan alamat di data CBS memakai ejaan lain (mis. "Klaten
 * Tgh", "Ps. Kliwon"), tambahkan ke ALIAS_KECAMATAN agar tetap terpetakan.
 */

export type WilayahId =
  | 'BOYOLALI' | 'SRAGEN' | 'KLATEN' | 'SURAKARTA'
  | 'KARANGANYAR' | 'SUKOHARJO' | 'WONOGIRI';

export const KECAMATAN_PER_WILAYAH: Record<WilayahId, string[]> = {
  SURAKARTA: [
    'Laweyan', 'Serengan', 'Pasar Kliwon', 'Jebres', 'Banjarsari',
  ],
  SUKOHARJO: [
    'Weru', 'Bulu', 'Tawangsari', 'Sukoharjo', 'Nguter', 'Bendosari',
    'Polokarto', 'Mojolaban', 'Grogol', 'Baki', 'Gatak', 'Kartasura',
  ],
  KARANGANYAR: [
    'Jatipuro', 'Jatiyoso', 'Jumapolo', 'Jumantono', 'Matesih', 'Tawangmangu',
    'Ngargoyoso', 'Karangpandan', 'Karanganyar', 'Tasikmadu', 'Jaten',
    'Colomadu', 'Gondangrejo', 'Kebakkramat', 'Mojogedang', 'Kerjo', 'Jenawi',
  ],
  SRAGEN: [
    'Kalijambe', 'Plupuh', 'Masaran', 'Kedawung', 'Sambirejo', 'Gondang',
    'Sambungmacan', 'Ngrampal', 'Karangmalang', 'Sragen', 'Sidoharjo', 'Tanon',
    'Gemolong', 'Miri', 'Sumberlawang', 'Mondokan', 'Sukodono', 'Gesi',
    'Tangen', 'Jenar',
  ],
  KLATEN: [
    'Prambanan', 'Gantiwarno', 'Wedi', 'Bayat', 'Cawas', 'Trucuk', 'Kalikotes',
    'Kebonarum', 'Jogonalan', 'Manisrenggo', 'Karangnongko', 'Ngawen', 'Ceper',
    'Pedan', 'Karangdowo', 'Juwiring', 'Wonosari', 'Delanggu', 'Polanharjo',
    'Karanganom', 'Tulung', 'Jatinom', 'Kemalang', 'Klaten Selatan',
    'Klaten Tengah', 'Klaten Utara',
  ],
  BOYOLALI: [
    'Selo', 'Ampel', 'Cepogo', 'Musuk', 'Boyolali', 'Mojosongo', 'Teras',
    'Sawit', 'Banyudono', 'Sambi', 'Ngemplak', 'Nogosari', 'Simo',
    'Karanggede', 'Klego', 'Andong', 'Kemusu', 'Wonosegoro', 'Juwangi',
    'Gladagsari', 'Tamansari', 'Wonosamodro',
  ],
  WONOGIRI: [
    'Pracimantoro', 'Paranggupito', 'Giritontro', 'Giriwoyo', 'Batuwarno',
    'Karangtengah', 'Tirtomoyo', 'Nguntoronadi', 'Baturetno', 'Eromoko',
    'Wuryantoro', 'Manyaran', 'Selogiri', 'Wonogiri', 'Ngadirojo', 'Sidoharjo',
    'Jatiroto', 'Kismantoro', 'Purwantoro', 'Bulukerto', 'Puhpelem',
    'Slogohimo', 'Jatisrono', 'Jatipurno', 'Girimarto',
  ],
};

/** Ejaan alternatif yang lazim muncul di data CBS -> nama kecamatan baku. */
const ALIAS_KECAMATAN: Record<string, { kecamatan: string; wilayah: WilayahId }> = {
  'ps kliwon': { kecamatan: 'Pasar Kliwon', wilayah: 'SURAKARTA' },
  'pasarkliwon': { kecamatan: 'Pasar Kliwon', wilayah: 'SURAKARTA' },
  'klaten tgh': { kecamatan: 'Klaten Tengah', wilayah: 'KLATEN' },
  'klaten sel': { kecamatan: 'Klaten Selatan', wilayah: 'KLATEN' },
  'klaten utr': { kecamatan: 'Klaten Utara', wilayah: 'KLATEN' },
  'solo': { kecamatan: 'Banjarsari', wilayah: 'SURAKARTA' },
};

/** Nama kabupaten/kota untuk pencocokan tingkat kabupaten. */
const NAMA_WILAYAH: Record<WilayahId, string[]> = {
  SURAKARTA: ['surakarta', 'solo', 'kota solo'],
  SUKOHARJO: ['sukoharjo'],
  KARANGANYAR: ['karanganyar'],
  SRAGEN: ['sragen'],
  KLATEN: ['klaten'],
  BOYOLALI: ['boyolali'],
  WONOGIRI: ['wonogiri'],
};

const normalize = (s: string) =>
  s.toLowerCase()
    .replace(/[.,\-_/]/g, ' ')
    .replace(/\b(kab|kabupaten|kota|kec|kecamatan|kel|kelurahan|desa|ds|dsn|dukuh|rt|rw)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

/**
 * Indeks kecamatan -> wilayah. Kecamatan yang namanya muncul di lebih dari satu
 * kabupaten (mis. "Sidoharjo" ada di Sragen dan Wonogiri) sengaja ditandai
 * ambigu supaya tidak salah dipetakan; wilayahnya harus ditentukan lewat nama
 * kabupaten pada alamat.
 */
const INDEKS_KECAMATAN = (() => {
  const idx = new Map<string, { kecamatan: string; wilayah: WilayahId } | 'AMBIGU'>();
  for (const [wilayah, list] of Object.entries(KECAMATAN_PER_WILAYAH) as [WilayahId, string[]][]) {
    for (const kec of list) {
      const key = normalize(kec);
      idx.set(key, idx.has(key) ? 'AMBIGU' : { kecamatan: kec, wilayah });
    }
  }
  for (const [alias, target] of Object.entries(ALIAS_KECAMATAN)) {
    if (!idx.has(alias)) idx.set(alias, target);
  }
  return idx;
})();

export interface HasilResolusi {
  wilayah: WilayahId | null;
  kecamatan: string | null;
}

/** Cocokkan sebagai kata utuh, supaya "Simo" tidak ikut cocok pada "Simongan". */
const mengandungKata = (teks: string, frasa: string) =>
  new RegExp(`(^| )${frasa.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}( |$)`).test(teks);

/**
 * Turunkan kabupaten & kecamatan dari teks alamat bebas.
 * Kabupaten dicari lebih dulu karena lebih dapat dipercaya; kecamatan
 * kemudian dibatasi pada kabupaten tersebut bila ketemu.
 */
export function resolveWilayah(alamat: string | undefined | null): HasilResolusi {
  if (!alamat) return { wilayah: null, kecamatan: null };
  const teks = normalize(String(alamat));
  if (!teks) return { wilayah: null, kecamatan: null };

  // 1. kabupaten/kota
  let wilayah: WilayahId | null = null;
  for (const [id, nama] of Object.entries(NAMA_WILAYAH) as [WilayahId, string[]][]) {
    if (nama.some(n => mengandungKata(teks, n))) { wilayah = id; break; }
  }

  // 2. kecamatan — cari nama terpanjang dulu agar "Klaten Tengah" menang atas "Klaten"
  let kecamatan: string | null = null;
  const kandidat = wilayah
    ? KECAMATAN_PER_WILAYAH[wilayah].map(k => ({ kecamatan: k, wilayah: wilayah as WilayahId }))
    : [...INDEKS_KECAMATAN.values()].filter((v): v is { kecamatan: string; wilayah: WilayahId } => v !== 'AMBIGU');

  const terurut = [...kandidat].sort((a, b) => b.kecamatan.length - a.kecamatan.length);
  for (const c of terurut) {
    if (mengandungKata(teks, normalize(c.kecamatan))) {
      kecamatan = c.kecamatan;
      if (!wilayah) wilayah = c.wilayah;
      break;
    }
  }

  return { wilayah, kecamatan };
}

/** Kolektibilitas dinormalkan ke kode baku: L, DPK, KL, D, M. */
export type Kolektibilitas = 'L' | 'DPK' | 'KL' | 'D' | 'M';

export function normalizeKolektibilitas(raw: unknown): Kolektibilitas | null {
  const v = String(raw ?? '').trim().toUpperCase();
  if (!v) return null;
  if (['L', '1', 'LANCAR'].includes(v)) return 'L';
  if (['DPK', '2', 'DALAM PERHATIAN KHUSUS'].includes(v)) return 'DPK';
  if (['KL', '3', 'KURANG LANCAR'].includes(v)) return 'KL';
  if (['D', '4', 'DIRAGUKAN'].includes(v)) return 'D';
  if (['M', '5', 'MACET'].includes(v)) return 'M';
  return null;
}

/**
 * Definisi nasabah bermasalah = NPL standar OJK (Kurang Lancar, Diragukan,
 * Macet). DPK sengaja TIDAK dihitung karena belum masuk kategori NPL.
 */
export const KOLEK_BERMASALAH: Kolektibilitas[] = ['KL', 'D', 'M'];

export const isBermasalah = (k: Kolektibilitas | null): boolean =>
  k !== null && KOLEK_BERMASALAH.includes(k);
