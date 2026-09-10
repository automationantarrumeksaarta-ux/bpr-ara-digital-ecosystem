/**
 * Sumber data Dashboard Heat Map & Risiko Pembiayaan (PE Kepatuhan).
 *
 * CATATAN: angka di bawah ini masih contoh/mock. Struktur sengaja dibuat rata
 * (satu baris = satu nasabah) supaya seluruh agregat — KPI, rasio per wilayah,
 * per sektor, per tujuan, ranking AO, risk matrix — dihitung dari sumber yang
 * sama. Saat data asli sudah tersedia, cukup ganti isi `NASABAH_BERMASALAH`
 * dan `PORTOFOLIO_WILAYAH` (mis. dari `/api/metrics`) tanpa mengubah komponen.
 */

export type WilayahId =
  | 'BOYOLALI' | 'SRAGEN' | 'KLATEN' | 'SURAKARTA'
  | 'KARANGANYAR' | 'SUKOHARJO' | 'WONOGIRI';

export type Kolektibilitas = 'L' | 'DPK' | 'KL' | 'D' | 'M';

export interface NasabahBermasalah {
  id: string;
  wilayah: WilayahId;
  kecamatan: string;
  ao: string;
  nama: string;
  kolektibilitas: Kolektibilitas;
  sektor: string;
  tujuan: string;
  bakiDebet: number;
  tunggakan: number;
  jumlahTagihan: number;
  jumlahAngsuran: number;
}

/** Total portofolio per wilayah — penyebut untuk menghitung rasio bermasalah. */
export interface PortofolioWilayah {
  wilayah: WilayahId;
  totalNasabah: number;
  totalBakiDebet: number;
  /** jumlah nasabah bermasalah (kol. KL/D/M) pada periode berjalan */
  nasabahBermasalah: number;
  bakiDebetBermasalah: number;
}

export interface PortofolioAO {
  ao: string;
  totalNasabah: number;
  nasabahBermasalah: number;
  bakiDebetBermasalah: number;
}

export const KECAMATAN_PER_WILAYAH: Record<WilayahId, string[]> = {
  BOYOLALI: ['Boyolali', 'Simo', 'Ampel', 'Banyudono', 'Mojosongo', 'Ngemplak', 'Sawit', 'Teras'],
  SRAGEN: ['Sragen', 'Gesi', 'Masaran', 'Gemolong', 'Kalijambe', 'Plupuh', 'Sidoharjo', 'Tanon'],
  KLATEN: ['Klaten Tengah', 'Delanggu', 'Ceper', 'Pedan', 'Prambanan', 'Jatinom', 'Wedi', 'Trucuk'],
  SURAKARTA: ['Jebres', 'Banjarsari', 'Laweyan', 'Serengan', 'Pasar Kliwon'],
  KARANGANYAR: ['Karanganyar', 'Karangpandan', 'Matesih', 'Jaten', 'Colomadu', 'Tawangmangu', 'Gondangrejo'],
  SUKOHARJO: ['Sukoharjo', 'Grogol', 'Kartasura', 'Baki', 'Mojolaban', 'Polokarto', 'Tawangsari'],
  WONOGIRI: ['Wonogiri', 'Wuryantoro', 'Baturetno', 'Ngadirojo', 'Purwantoro', 'Selogiri', 'Jatisrono'],
};

export const SEKTOR_USAHA = [
  'Perdagangan', 'Pertanian', 'Jasa', 'Industri Pengolahan',
  'Konstruksi', 'Transportasi & Pergudangan', 'Lainnya',
] as const;

export const TUJUAN_PEMBIAYAAN = [
  'Modal Kerja', 'Investasi', 'Konsumsi Produktif',
  'Pembelian Aset', 'Refinancing', 'Lainnya',
] as const;

export const DAFTAR_AO = ['Deddie', 'Wahid Budi S.', 'B Windra', 'Ariyanto', 'Tri Surono'] as const;

export const PERIODE_OPTIONS = [
  'Jan 2024 – Des 2024',
  'Jul 2024 – Des 2024',
  'Okt 2024 – Des 2024',
  'Des 2024',
] as const;

export const CABANG_OPTIONS = [
  'Semua Cabang', 'KC Pusat Surakarta', 'KC Sragen', 'KC Karanganyar', 'KK Sukoharjo',
] as const;

/**
 * Agregat portofolio per wilayah.
 * `nasabahBermasalah` / `totalNasabah` = rasio bermasalah yang mewarnai peta.
 */
export const PORTOFOLIO_WILAYAH: PortofolioWilayah[] = [
  { wilayah: 'KARANGANYAR', totalNasabah: 685, totalBakiDebet: 101_600_000_000, nasabahBermasalah: 126, bakiDebetBermasalah: 18_700_000_000 },
  { wilayah: 'SRAGEN',      totalNasabah: 690, totalBakiDebet: 94_400_000_000,  nasabahBermasalah: 98,  bakiDebetBermasalah: 13_400_000_000 },
  { wilayah: 'SUKOHARJO',   totalNasabah: 605, totalBakiDebet: 90_700_000_000,  nasabahBermasalah: 72,  bakiDebetBermasalah: 10_800_000_000 },
  { wilayah: 'SURAKARTA',   totalNasabah: 512, totalBakiDebet: 62_300_000_000,  nasabahBermasalah: 55,  bakiDebetBermasalah: 8_100_000_000 },
  { wilayah: 'WONOGIRI',    totalNasabah: 500, totalBakiDebet: 33_200_000_000,  nasabahBermasalah: 48,  bakiDebetBermasalah: 6_700_000_000 },
  { wilayah: 'KLATEN',      totalNasabah: 517, totalBakiDebet: 25_800_000_000,  nasabahBermasalah: 45,  bakiDebetBermasalah: 5_900_000_000 },
  { wilayah: 'BOYOLALI',    totalNasabah: 520, totalBakiDebet: 18_780_000_000,  nasabahBermasalah: 38,  bakiDebetBermasalah: 4_800_000_000 },
];

export const PORTOFOLIO_AO: PortofolioAO[] = [
  { ao: 'Deddie',        totalNasabah: 520,  nasabahBermasalah: 112, bakiDebetBermasalah: 15_800_000_000 },
  { ao: 'Wahid Budi S.', totalNasabah: 480,  nasabahBermasalah: 86,  bakiDebetBermasalah: 12_400_000_000 },
  { ao: 'B Windra',      totalNasabah: 430,  nasabahBermasalah: 72,  bakiDebetBermasalah: 9_800_000_000 },
  { ao: 'Ariyanto',      totalNasabah: 390,  nasabahBermasalah: 58,  bakiDebetBermasalah: 7_600_000_000 },
  { ao: 'Tri Surono',    totalNasabah: 360,  nasabahBermasalah: 49,  bakiDebetBermasalah: 6_200_000_000 },
  { ao: 'Lainnya',       totalNasabah: 1302, nasabahBermasalah: 135, bakiDebetBermasalah: 16_700_000_000 },
];

/** Rasio bermasalah per sektor usaha (%). */
export const RASIO_SEKTOR: { sektor: string; rasio: number; icon: string }[] = [
  { sektor: 'Perdagangan', rasio: 21.7, icon: '🛒' },
  { sektor: 'Pertanian', rasio: 16.3, icon: '🌾' },
  { sektor: 'Jasa', rasio: 13.2, icon: '🔧' },
  { sektor: 'Industri Pengolahan', rasio: 11.5, icon: '🏭' },
  { sektor: 'Konstruksi', rasio: 9.8, icon: '🏗️' },
  { sektor: 'Transportasi & Pergudangan', rasio: 7.4, icon: '🚚' },
  { sektor: 'Lainnya', rasio: 6.1, icon: '📦' },
];

/** Rasio bermasalah per tujuan penggunaan dana (%). */
export const RASIO_TUJUAN: { tujuan: string; rasio: number; icon: string }[] = [
  { tujuan: 'Modal Kerja', rasio: 20.5, icon: '💰' },
  { tujuan: 'Investasi', rasio: 15.7, icon: '📈' },
  { tujuan: 'Konsumsi Produktif', rasio: 11.9, icon: '🛍️' },
  { tujuan: 'Pembelian Aset', rasio: 8.6, icon: '🏠' },
  { tujuan: 'Refinancing', rasio: 6.8, icon: '🔄' },
  { tujuan: 'Lainnya', rasio: 5.4, icon: '📦' },
];

/**
 * Bobot sektor & tujuan per wilayah (0–1), untuk mewarnai Heat Map 2 dan 3.
 * Nilainya = rasio bermasalah wilayah tsb pada sektor/tujuan yang dipilih.
 */
export const SEKTOR_PER_WILAYAH: Record<string, Partial<Record<WilayahId, number>>> = {
  Perdagangan:                  { KARANGANYAR: 24.1, SRAGEN: 19.8, SUKOHARJO: 17.2, SURAKARTA: 22.6, WONOGIRI: 11.4, KLATEN: 10.2, BOYOLALI: 8.9 },
  Pertanian:                    { KARANGANYAR: 18.9, SRAGEN: 21.4, SUKOHARJO: 12.1, SURAKARTA: 6.2,  WONOGIRI: 15.8, KLATEN: 13.6, BOYOLALI: 12.4 },
  Jasa:                         { KARANGANYAR: 15.2, SRAGEN: 12.7, SUKOHARJO: 14.9, SURAKARTA: 17.3, WONOGIRI: 8.6,  KLATEN: 9.4,  BOYOLALI: 7.8 },
  'Industri Pengolahan':        { KARANGANYAR: 13.8, SRAGEN: 11.2, SUKOHARJO: 15.6, SURAKARTA: 12.9, WONOGIRI: 7.1,  KLATEN: 10.8, BOYOLALI: 8.2 },
  Konstruksi:                   { KARANGANYAR: 11.4, SRAGEN: 9.6,  SUKOHARJO: 10.3, SURAKARTA: 12.1, WONOGIRI: 6.9,  KLATEN: 8.4,  BOYOLALI: 7.2 },
  'Transportasi & Pergudangan': { KARANGANYAR: 8.7,  SRAGEN: 7.9,  SUKOHARJO: 8.1,  SURAKARTA: 9.4,  WONOGIRI: 5.6,  KLATEN: 6.3,  BOYOLALI: 5.9 },
  Lainnya:                      { KARANGANYAR: 7.2,  SRAGEN: 6.4,  SUKOHARJO: 6.8,  SURAKARTA: 7.6,  WONOGIRI: 4.8,  KLATEN: 5.2,  BOYOLALI: 4.6 },
};

export const TUJUAN_PER_WILAYAH: Record<string, Partial<Record<WilayahId, number>>> = {
  'Modal Kerja':        { KARANGANYAR: 23.4, SRAGEN: 19.2, SUKOHARJO: 18.6, SURAKARTA: 21.8, WONOGIRI: 12.1, KLATEN: 11.3, BOYOLALI: 9.7 },
  Investasi:            { KARANGANYAR: 18.2, SRAGEN: 16.9, SUKOHARJO: 14.3, SURAKARTA: 17.1, WONOGIRI: 10.4, KLATEN: 9.8,  BOYOLALI: 8.6 },
  'Konsumsi Produktif': { KARANGANYAR: 14.1, SRAGEN: 12.8, SUKOHARJO: 12.4, SURAKARTA: 13.6, WONOGIRI: 8.9,  KLATEN: 8.1,  BOYOLALI: 7.4 },
  'Pembelian Aset':     { KARANGANYAR: 10.6, SRAGEN: 9.2,  SUKOHARJO: 9.8,  SURAKARTA: 10.2, WONOGIRI: 6.7,  KLATEN: 6.1,  BOYOLALI: 5.8 },
  Refinancing:          { KARANGANYAR: 8.4,  SRAGEN: 7.6,  SUKOHARJO: 7.1,  SURAKARTA: 8.9,  WONOGIRI: 5.2,  KLATEN: 4.9,  BOYOLALI: 4.4 },
  Lainnya:              { KARANGANYAR: 6.8,  SRAGEN: 5.9,  SUKOHARJO: 5.6,  SURAKARTA: 6.4,  WONOGIRI: 4.1,  KLATEN: 3.8,  BOYOLALI: 3.5 },
};

/** Rincian nasabah bermasalah (daftar pada tab bawah). */
export const NASABAH_BERMASALAH: NasabahBermasalah[] = [
  { id: 'NB-001', wilayah: 'KARANGANYAR', kecamatan: 'Karangpandan', ao: 'Deddie',        nama: 'SRI MULYANI',    kolektibilitas: 'M',  sektor: 'Perdagangan',          tujuan: 'Modal Kerja',        bakiDebet: 75_000_000,  tunggakan: 12_500_000, jumlahTagihan: 12_500_000, jumlahAngsuran: 2_800_000 },
  { id: 'NB-002', wilayah: 'KARANGANYAR', kecamatan: 'Matesih',      ao: 'Deddie',        nama: 'AGUS SETIAWAN',  kolektibilitas: 'D',  sektor: 'Pertanian',            tujuan: 'Investasi',          bakiDebet: 120_000_000, tunggakan: 8_750_000,  jumlahTagihan: 8_750_000,  jumlahAngsuran: 3_200_000 },
  { id: 'NB-003', wilayah: 'SRAGEN',      kecamatan: 'Gesi',         ao: 'Wahid Budi S.', nama: 'BUDI SANTOSO',   kolektibilitas: 'M',  sektor: 'Pertanian',            tujuan: 'Modal Kerja',        bakiDebet: 95_000_000,  tunggakan: 6_400_000,  jumlahTagihan: 6_400_000,  jumlahAngsuran: 2_100_000 },
  { id: 'NB-004', wilayah: 'SUKOHARJO',   kecamatan: 'Grogol',       ao: 'B Windra',      nama: 'ENDANG LESTARI', kolektibilitas: 'D',  sektor: 'Industri Pengolahan',  tujuan: 'Modal Kerja',        bakiDebet: 80_000_000,  tunggakan: 5_200_000,  jumlahTagihan: 5_200_000,  jumlahAngsuran: 1_900_000 },
  { id: 'NB-005', wilayah: 'WONOGIRI',    kecamatan: 'Wuryantoro',   ao: 'Ariyanto',      nama: 'JOKO SUSILO',    kolektibilitas: 'KL', sektor: 'Pertanian',            tujuan: 'Konsumsi Produktif', bakiDebet: 60_000_000,  tunggakan: 4_800_000,  jumlahTagihan: 4_800_000,  jumlahAngsuran: 1_500_000 },
  { id: 'NB-006', wilayah: 'KLATEN',      kecamatan: 'Delanggu',     ao: 'Tri Surono',    nama: 'SUTRISNO',       kolektibilitas: 'M',  sektor: 'Perdagangan',          tujuan: 'Modal Kerja',        bakiDebet: 55_000_000,  tunggakan: 3_900_000,  jumlahTagihan: 3_900_000,  jumlahAngsuran: 1_200_000 },
  { id: 'NB-007', wilayah: 'BOYOLALI',    kecamatan: 'Simo',         ao: 'Wahid Budi S.', nama: 'SUWARNO',        kolektibilitas: 'D',  sektor: 'Jasa',                 tujuan: 'Investasi',          bakiDebet: 48_000_000,  tunggakan: 3_200_000,  jumlahTagihan: 3_200_000,  jumlahAngsuran: 1_000_000 },
  { id: 'NB-008', wilayah: 'SURAKARTA',   kecamatan: 'Jebres',       ao: 'Deddie',        nama: 'RINA WATI',      kolektibilitas: 'M',  sektor: 'Perdagangan',          tujuan: 'Modal Kerja',        bakiDebet: 42_000_000,  tunggakan: 2_800_000,  jumlahTagihan: 2_800_000,  jumlahAngsuran: 900_000 },
  { id: 'NB-009', wilayah: 'SURAKARTA',   kecamatan: 'Banjarsari',   ao: 'B Windra',      nama: 'HARYONO',        kolektibilitas: 'KL', sektor: 'Jasa',                 tujuan: 'Refinancing',        bakiDebet: 68_000_000,  tunggakan: 4_100_000,  jumlahTagihan: 4_100_000,  jumlahAngsuran: 1_400_000 },
  { id: 'NB-010', wilayah: 'KARANGANYAR', kecamatan: 'Jaten',        ao: 'Deddie',        nama: 'SITI AMINAH',    kolektibilitas: 'D',  sektor: 'Industri Pengolahan',  tujuan: 'Pembelian Aset',     bakiDebet: 135_000_000, tunggakan: 9_600_000,  jumlahTagihan: 9_600_000,  jumlahAngsuran: 3_900_000 },
  { id: 'NB-011', wilayah: 'SRAGEN',      kecamatan: 'Masaran',      ao: 'Wahid Budi S.', nama: 'DARMANTO',       kolektibilitas: 'KL', sektor: 'Perdagangan',          tujuan: 'Modal Kerja',        bakiDebet: 52_000_000,  tunggakan: 3_400_000,  jumlahTagihan: 3_400_000,  jumlahAngsuran: 1_300_000 },
  { id: 'NB-012', wilayah: 'SUKOHARJO',   kecamatan: 'Kartasura',    ao: 'B Windra',      nama: 'YULI ASTUTI',    kolektibilitas: 'M',  sektor: 'Perdagangan',          tujuan: 'Modal Kerja',        bakiDebet: 88_000_000,  tunggakan: 7_200_000,  jumlahTagihan: 7_200_000,  jumlahAngsuran: 2_400_000 },
  { id: 'NB-013', wilayah: 'WONOGIRI',    kecamatan: 'Baturetno',    ao: 'Ariyanto',      nama: 'PARJIYANTO',     kolektibilitas: 'D',  sektor: 'Konstruksi',           tujuan: 'Investasi',          bakiDebet: 71_000_000,  tunggakan: 5_500_000,  jumlahTagihan: 5_500_000,  jumlahAngsuran: 1_800_000 },
  { id: 'NB-014', wilayah: 'BOYOLALI',    kecamatan: 'Banyudono',    ao: 'Tri Surono',    nama: 'MURYANI',        kolektibilitas: 'KL', sektor: 'Pertanian',            tujuan: 'Konsumsi Produktif', bakiDebet: 39_000_000,  tunggakan: 2_400_000,  jumlahTagihan: 2_400_000,  jumlahAngsuran: 850_000 },
  { id: 'NB-015', wilayah: 'KLATEN',      kecamatan: 'Ceper',        ao: 'Tri Surono',    nama: 'BAMBANG P.',     kolektibilitas: 'D',  sektor: 'Industri Pengolahan',  tujuan: 'Modal Kerja',        bakiDebet: 64_000_000,  tunggakan: 4_600_000,  jumlahTagihan: 4_600_000,  jumlahAngsuran: 1_600_000 },
];

/** Perubahan KPI dibanding periode sebelumnya (%), untuk indikator panah. */
export const TREN_PERIODE_SEBELUMNYA = {
  totalPembiayaan: 12.5,
  totalNasabah: 8.3,
  bakiDebet: 10.7,
  nasabahBermasalah: 6.2,
  rasioBermasalah: 2.1,
  bakiDebetBermasalah: 14.3,
};

/** Total pembiayaan (plafon) — belum tersedia per wilayah, jadi disimpan terpisah. */
export const TOTAL_PEMBIAYAAN = 487_250_000_000;
