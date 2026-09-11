import type { CreditAppStage } from '../../types';

/**
 * Kosakata bersama pipeline kredit — satu sumber kebenaran.
 *
 * Sebelumnya tujuh halaman tahap masing-masing menyimpan peta statusnya
 * sendiri: LosCreditView punya STATUS_CONFIG lengkap, CreditApprovalView punya
 * ternary sendiri, DisbursementPortfolioView punya ternary kolektibilitas
 * sendiri, LegalDocumentsView memakai emerald mati, CreditAnalysisView memakai
 * pil abu-abu. Lima peta untuk satu himpunan status yang sama. Akibatnya satu
 * berkas berstatus sama tampil dengan warna berbeda tergantung halaman mana
 * yang sedang dibuka.
 *
 * Berkas ini juga menyimpan nama tahap dalam bahasa Indonesia. Kuncinya tetap
 * bahasa Inggris karena `PipelineStageName` dipakai sebagai tipe di tujuh
 * berkas; yang berubah hanya yang dibaca manusia.
 */

export type PipelineStageName =
  | 'Loan Origination'
  | 'Field Survey'
  | 'Credit Analysis'
  | 'Collateral Appraisal'
  | 'Committee Approval'
  | 'Legal & Documents'
  | 'Disbursement';

export interface TahapPipeline {
  kunci: PipelineStageName;
  label: string;
  /** Label ringkas untuk layar sempit. */
  pendek: string;
  rute: string;
}

export const TAHAP_PIPELINE: TahapPipeline[] = [
  { kunci: 'Loan Origination',     label: 'Pengajuan',      pendek: 'Ajukan',   rute: '/business/credit/los' },
  { kunci: 'Field Survey',         label: 'Survei Lapangan', pendek: 'Survei',   rute: '/business/credit/survey' },
  { kunci: 'Credit Analysis',      label: 'Analisis Kredit', pendek: 'Analisis', rute: '/business/credit/analysis' },
  { kunci: 'Collateral Appraisal', label: 'Taksasi Agunan',  pendek: 'Agunan',   rute: '/business/credit/appraisal' },
  { kunci: 'Committee Approval',   label: 'Putusan Komite',  pendek: 'Komite',   rute: '/business/credit/approval' },
  { kunci: 'Legal & Documents',    label: 'Legal & Akad',    pendek: 'Legal',    rute: '/business/credit/legal' },
  { kunci: 'Disbursement',         label: 'Pencairan',       pendek: 'Cair',     rute: '/business/credit/disbursement' },
];

/* ------------------------------------------------------------------ status */

export type NadaStatus = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

interface RupaStatus {
  label: string;
  nada: NadaStatus;
}

/**
 * Sebelas status basis data, satu peta.
 *
 * `nada` sengaja dibatasi pada kosakata semantik Badge yang sudah ada
 * (success/warning/danger/info/neutral). Tidak ada warna kategori: hijau berarti
 * selesai baik, kuning berarti menunggu tindakan, merah berarti berhenti.
 */
const RUPA_STATUS: Record<CreditAppStage, RupaStatus> = {
  DRAFT:            { label: 'Draf',              nada: 'neutral' },
  SUBMITTED:        { label: 'Diajukan',          nada: 'info' },
  VERIFICATION:     { label: 'Verifikasi Berkas', nada: 'warning' },
  SLIK:             { label: 'Cek SLIK',          nada: 'warning' },
  SURVEY:           { label: 'Survei Lapangan',   nada: 'warning' },
  ANALYSIS:         { label: 'Analisis Kredit',   nada: 'warning' },
  LEGAL_REVIEW:     { label: 'Telaah Legal',      nada: 'warning' },
  CREDIT_COMMITTEE: { label: 'Putusan Komite',    nada: 'info' },
  APPROVED:         { label: 'Disetujui',         nada: 'success' },
  DISBURSED:        { label: 'Cair',              nada: 'success' },
  REJECTED:         { label: 'Ditolak',           nada: 'danger' },
};

export const rupaStatus = (stage: CreditAppStage | undefined): RupaStatus =>
  (stage && RUPA_STATUS[stage]) || { label: stage ?? 'Tidak diketahui', nada: 'neutral' };

/**
 * Kolektibilitas OJK. Kol 3, 4, 5 adalah NPL.
 *
 * Menerima angka maupun bentuk `KOL_3` yang dipakai tipe `Collectibility`,
 * supaya pemanggilnya tidak perlu tahu bentuk mana yang datang.
 */
export const rupaKolektibilitas = (kol: number | string | undefined): RupaStatus => {
  /*
   * Tiga bentuk penulisan dipakai di sistem ini dan ketiganya harus dikenali:
   * angka (1..5), bentuk `KOL_3` dari tipe Collectibility, dan huruf
   * L/DPK/KL/D/M dari kolom Kolek pada berkas nominatif. Sebelumnya huruf
   * tidak tertangani, sehingga seluruh kredit lancar tampil sebagai "—".
   */
  const HURUF: Record<string, number> = { L: 1, DPK: 2, KL: 3, D: 4, M: 5 };
  if (typeof kol === 'string') {
    const huruf = HURUF[kol.trim().toUpperCase()];
    if (huruf) kol = huruf;
  }
  const n = typeof kol === 'string' ? Number(kol.replace(/^KOL[_-]?/i, '')) : Number(kol);
  if (n === 1) return { label: 'Kol 1 · Lancar',           nada: 'success' };
  if (n === 2) return { label: 'Kol 2 · Perhatian Khusus', nada: 'warning' };
  if (n === 3) return { label: 'Kol 3 · Kurang Lancar',    nada: 'danger' };
  if (n === 4) return { label: 'Kol 4 · Diragukan',        nada: 'danger' };
  if (n === 5) return { label: 'Kol 5 · Macet',            nada: 'danger' };
  return { label: '—', nada: 'neutral' };
};

/* ------------------------------------------------------------------- angka */

/**
 * Rupiah tanpa desimal. Nilai yang belum ada ditulis sebagai tanda pisah,
 * bukan "Rp 0" — nol adalah angka, kosong bukan, dan di laporan kredit
 * keduanya berarti hal yang sangat berbeda.
 */
export const rupiah = (nilai: number | null | undefined): string => {
  if (nilai === null || nilai === undefined || !Number.isFinite(Number(nilai))) return '—';
  return 'Rp ' + Math.round(Number(nilai)).toLocaleString('id-ID');
};

/** Rupiah ringkas untuk angka besar: 1,24 M / 850 jt. */
export const rupiahRingkas = (nilai: number | null | undefined): string => {
  if (nilai === null || nilai === undefined || !Number.isFinite(Number(nilai))) return '—';
  const n = Number(nilai);
  if (Math.abs(n) >= 1e9) return `Rp ${(n / 1e9).toLocaleString('id-ID', { maximumFractionDigits: 2 })} M`;
  if (Math.abs(n) >= 1e6) return `Rp ${(n / 1e6).toLocaleString('id-ID', { maximumFractionDigits: 0 })} jt`;
  return rupiah(n);
};

/**
 * Persentase yang jujur soal pembagian nol.
 *
 * Halaman Pencairan sebelumnya menghitung (kol1/total)*100 tanpa penjagaan,
 * sehingga menampilkan "NaN% dari Total Portofolio" di layar begitu portofolio
 * kosong — dan portofolio memang kosong hari ini.
 */
export const persen = (pembilang: number, penyebut: number, desimal = 1): string => {
  if (!Number.isFinite(pembilang) || !Number.isFinite(penyebut) || penyebut === 0) return '—';
  return (pembilang / penyebut * 100).toLocaleString('id-ID', {
    minimumFractionDigits: desimal,
    maximumFractionDigits: desimal,
  }) + '%';
};

/**
 * Angka desimal dengan koma, bukan titik.
 *
 * `toFixed()` selalu memakai titik sebagai pemisah desimal, sehingga rasio LTV
 * dan DSCR tampil "56.1%" berdampingan dengan persentase lain yang sudah
 * memakai koma. Di dokumen keuangan berbahasa Indonesia titik berarti pemisah
 * ribuan, jadi campuran keduanya bisa terbaca keliru.
 */
export const desimal = (nilai: number | null | undefined, angkaDiBelakang = 1): string =>
  nilai === null || nilai === undefined || !Number.isFinite(Number(nilai))
    ? '—'
    : Number(nilai).toLocaleString('id-ID', {
        minimumFractionDigits: angkaDiBelakang,
        maximumFractionDigits: angkaDiBelakang,
      });

/** Angka bulat dengan pemisah ribuan, atau tanda pisah bila tidak ada. */
export const cacah = (nilai: number | null | undefined): string =>
  nilai === null || nilai === undefined || !Number.isFinite(Number(nilai))
    ? '—'
    : Number(nilai).toLocaleString('id-ID');

export const tanggalPendek = (iso: string | undefined | null): string => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
};

/**
 * Sisa waktu SLA dalam kata, bukan tanggal mentah.
 *
 * Petugas kredit perlu tahu "tinggal 2 hari", bukan menghitung selisih tanggal
 * di kepala.
 */
export const sisaSla = (batas: string | undefined, terlampaui?: boolean): RupaStatus => {
  if (terlampaui) return { label: 'SLA terlampaui', nada: 'danger' };
  if (!batas) return { label: '—', nada: 'neutral' };
  const selisih = new Date(batas).getTime() - Date.now();
  if (Number.isNaN(selisih)) return { label: '—', nada: 'neutral' };
  const hari = Math.ceil(selisih / 86_400_000);
  if (hari < 0) return { label: 'SLA terlampaui', nada: 'danger' };
  if (hari === 0) return { label: 'Jatuh tempo hari ini', nada: 'danger' };
  if (hari <= 2) return { label: `Sisa ${hari} hari`, nada: 'warning' };
  return { label: `Sisa ${hari} hari`, nada: 'neutral' };
};
