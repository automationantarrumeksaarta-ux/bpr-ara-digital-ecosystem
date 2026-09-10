/**
 * Token desain mobile BPR ARA.
 *
 * Alasan file ini ada: sebelumnya tiap layar menulis ukuran font sendiri
 * (text-[8px] sampai text-[11px] bercampur tanpa aturan) dan tiap ikon menu
 * diberi warna berbeda-beda. Hasilnya tidak ada hierarki — semua elemen
 * berteriak sama keras. Di sini skalanya dikunci sekali, lalu dipakai ulang.
 *
 * DUA HAL PENTING TENTANG TEMA PROYEK INI (lihat src/index.css):
 *
 * 1. Palet `emerald-*` sudah DIPETAKAN ULANG MENJADI BIRU untuk keperluan
 *    rebranding. Jadi `bg-emerald-600` menghasilkan biru, bukan hijau. Karena
 *    itu file ini memakai token semantik proyek (`success`, `warning`,
 *    `danger`, `primary`) yang warnanya sesuai namanya.
 *
 * 2. Dark mode DIMATIKAN project-wide lewat @custom-variant. Semua kelas
 *    `dark:` tidak pernah aktif, jadi sengaja tidak ditulis di sini agar
 *    tidak menumpuk kode mati.
 */

/**
 * Skala tipografi. Angka mengikuti kebiasaan UI mobile: tidak ada yang di
 * bawah 11px karena di layar HP sungguhan ukuran itu sudah tidak terbaca.
 */
export const text = {
  /** label mikro: satuan, timestamp, keterangan bantu */
  caption: 'text-[11px] leading-[14px]',
  /** teks pendukung di dalam baris daftar */
  footnote: 'text-[12px] leading-[16px]',
  /** teks utama */
  body: 'text-[13px] leading-[18px]',
  /** judul baris daftar / kartu */
  headline: 'text-[15px] leading-[20px] font-semibold',
  /** judul layar */
  title: 'text-[17px] leading-[22px] font-bold',
  /** sapaan di beranda */
  largeTitle: 'text-[22px] leading-[28px] font-bold',
  /** angka statistik */
  stat: 'text-[24px] leading-[28px] font-bold tabular-nums',
} as const;

/**
 * Satu warna aksen saja. Warna lain hanya boleh muncul kalau membawa makna
 * (hijau = hadir, kuning = terlambat, merah = alpa), bukan sebagai hiasan.
 */
export const tone = {
  primary: {
    text: 'text-primary',
    bg: 'bg-primary',
    bgSoft: 'bg-primary-light',
  },
  positive: {
    text: 'text-success',
    bg: 'bg-success',
    bgSoft: 'bg-success/10',
  },
  warning: {
    text: 'text-warning',
    bg: 'bg-warning',
    bgSoft: 'bg-warning/10',
  },
  danger: {
    text: 'text-danger',
    bg: 'bg-danger',
    bgSoft: 'bg-danger/10',
  },
  neutral: {
    text: 'text-slate-500',
    bg: 'bg-slate-400',
    bgSoft: 'bg-slate-100',
  },
} as const;

export type ToneName = keyof typeof tone;

export const surface = {
  /** latar layar */
  page: 'bg-[#F7F9FC]',
  /** kartu di atas latar */
  card: 'bg-white',
  /** garis pemisah — sangat tipis; hierarki dibentuk oleh jarak, bukan garis */
  divider: 'border-slate-100',
  hairline: 'divide-slate-100',
} as const;

export const ink = {
  strong: 'text-slate-900',
  base: 'text-slate-700',
  muted: 'text-slate-500',
  faint: 'text-slate-400',
} as const;

export const radius = {
  card: 'rounded-2xl',
  control: 'rounded-xl',
  pill: 'rounded-full',
} as const;

/**
 * Target sentuh minimum. Baris daftar dan tombol wajib memenuhi ini —
 * di desain sebelumnya beberapa tombol hanya setinggi ~28px.
 */
export const HIT_TARGET = 'min-h-[44px]';
