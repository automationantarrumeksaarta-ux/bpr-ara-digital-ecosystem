import React from 'react';
import { FilterX, type LucideIcon } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { rupaStatus, rupaKolektibilitas, type NadaStatus } from './pipeline';
import type { CreditAppStage } from '../../types';
import { cn } from '../../lib/utils';

/* ----------------------------------------------------------------- lencana */

/**
 * Satu lencana status untuk seluruh pipeline.
 *
 * Menggantikan lima peta warna yang berdiri sendiri-sendiri di lima halaman.
 * Selalu memakai Badge dari kit bersama, jadi bentuk dan ukurannya tidak bisa
 * lagi berbeda antar halaman.
 */
export const StatusPill: React.FC<{ stage: CreditAppStage | undefined; className?: string }> = ({
  stage, className,
}) => {
  const { label, nada } = rupaStatus(stage);
  return <Badge variant={nada} className={className}>{label}</Badge>;
};

export const KolPill: React.FC<{ kol: number | string | undefined; className?: string }> = ({
  kol, className,
}) => {
  const { label, nada } = rupaKolektibilitas(kol);
  return <Badge variant={nada} className={className}>{label}</Badge>;
};

export const NadaPill: React.FC<{ label: string; nada: NadaStatus; className?: string }> = ({
  label, nada, className,
}) => <Badge variant={nada} className={className}>{label}</Badge>;

/* ------------------------------------------------------------- empty state */

/**
 * Dua ragam kosong, karena keduanya menuntut tindakan berbeda.
 *
 * "Belum ada apa-apa" perlu diajari cara memulai. "Saringan tidak menemukan
 * apa-apa" perlu ditawari melepas saringannya. Menyamakan keduanya jadi
 * "Tidak ada data" membuat pegawai mengira sistemnya rusak.
 *
 * Ini bukan kasus pinggiran di produk ini: belum ada satu pun pengajuan
 * tersimpan, jadi inilah tampilan yang paling sering terlihat.
 */
interface KosongProps {
  icon?: LucideIcon;
  judul: string;
  keterangan?: string;
  aksi?: React.ReactNode;
  className?: string;
  rapat?: boolean;
}

export const Kosong: React.FC<KosongProps> = ({
  icon: Icon, judul, keterangan, aksi, className, rapat,
}) => (
  <div
    className={cn(
      'flex flex-col items-center justify-center text-center',
      rapat ? 'px-5 py-8' : 'px-6 py-14',
      className,
    )}
  >
    {Icon && (
      <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-surface-muted text-muted">
        <Icon className="h-5 w-5" strokeWidth={1.75} />
      </span>
    )}
    <p className="text-sm font-bold text-foreground">{judul}</p>
    {keterangan && (
      <p className="mt-1.5 max-w-sm text-xs leading-relaxed text-slate-500">{keterangan}</p>
    )}
    {aksi && <div className="mt-4">{aksi}</div>}
  </div>
);

export const KosongKarenaSaringan: React.FC<{ onReset: () => void; rapat?: boolean }> = ({
  onReset, rapat,
}) => (
  <Kosong
    rapat={rapat}
    icon={FilterX}
    judul="Tidak ada yang cocok dengan saringan"
    keterangan="Kata kunci atau penyaring yang dipakai menyisakan nol baris. Datanya mungkin ada, hanya tersaring keluar."
    aksi={
      <button
        type="button"
        onClick={onReset}
        className="rounded-xl border border-border bg-surface px-3.5 py-2 text-xs font-bold text-foreground transition-colors hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        Hapus saringan
      </button>
    }
  />
);

/* ------------------------------------------------------------------ panel */

/**
 * Panel isi baku: judul, hitungan, alat di kanan, lalu isi.
 *
 * `padat` mematikan padding badan supaya tabel bisa menempel ke tepi panel —
 * tabel punya paddingnya sendiri, dan menumpuk keduanya membuang ruang layar.
 */
export const Panel: React.FC<{
  judul?: string;
  hitungan?: number | string;
  alat?: React.ReactNode;
  children: React.ReactNode;
  padat?: boolean;
  className?: string;
}> = ({ judul, hitungan, alat, children, padat, className }) => (
  <section className={cn('overflow-hidden rounded-2xl border border-border bg-surface shadow-sm', className)}>
    {(judul || alat) && (
      <div className="flex flex-col gap-3 border-b border-border px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          {judul && <h2 className="text-sm font-bold text-foreground">{judul}</h2>}
          {hitungan !== undefined && (
            <span className="rounded-full bg-surface-muted px-2 py-0.5 text-[11px] font-bold tabular-nums text-slate-500">
              {hitungan}
            </span>
          )}
        </div>
        {alat && <div className="flex items-center gap-2">{alat}</div>}
      </div>
    )}
    <div className={padat ? '' : 'p-5'}>{children}</div>
  </section>
);

/* -------------------------------------------------- antrean + meja kerja */

/**
 * Kerangka "pilih satu berkas, lalu kerjakan".
 *
 * Dipakai tiga tahap yang menangani satu berkas dalam satu waktu: Analisis,
 * Komite, dan Legal. Ketiganya sebelumnya menyalin kerangka ini kata per kata
 * — kelas CSS terpilih/tidak-terpilih yang identik, hanya warna aksennya beda.
 */
export const StageWorkbench: React.FC<{
  judulAntrean: string;
  jumlah: number;
  antrean: React.ReactNode;
  children: React.ReactNode;
}> = ({ judulAntrean, jumlah, antrean, children }) => (
  <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-12">
    <div className="lg:col-span-4 xl:col-span-3">
      <Panel judul={judulAntrean} hitungan={jumlah} padat>
        <div className="max-h-[calc(100vh-20rem)] overflow-y-auto">{antrean}</div>
      </Panel>
    </div>
    <div className="lg:col-span-8 xl:col-span-9">{children}</div>
  </div>
);

/**
 * Satu baris antrean.
 *
 * Seluruh baris adalah tombol, bukan hanya judulnya — sasaran klik selebar
 * panel jauh lebih mudah dikenai daripada teks setinggi 16px.
 */
export const BarisAntrean: React.FC<{
  terpilih: boolean;
  onClick: () => void;
  utama: React.ReactNode;
  kedua?: React.ReactNode;
  kanan?: React.ReactNode;
  bawah?: React.ReactNode;
}> = ({ terpilih, onClick, utama, kedua, kanan, bawah }) => (
  <button
    type="button"
    onClick={onClick}
    aria-current={terpilih ? 'true' : undefined}
    className={cn(
      'flex w-full flex-col gap-1.5 border-b border-border px-4 py-3 text-left transition-colors last:border-b-0',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring',
      terpilih ? 'bg-primary-light' : 'hover:bg-surface-muted',
    )}
  >
    <div className="flex items-start justify-between gap-2">
      <div className="min-w-0">
        <p className={cn('truncate text-xs font-bold', terpilih ? 'text-primary-dark' : 'text-foreground')}>
          {utama}
        </p>
        {kedua && <p className="mt-0.5 truncate text-[11px] tabular-nums text-slate-500">{kedua}</p>}
      </div>
      {kanan && <div className="shrink-0">{kanan}</div>}
    </div>
    {bawah}
  </button>
);

/**
 * Sisi kanan sebelum ada berkas yang dipilih.
 *
 * Sebelumnya ini kotak kosong berisi satu kalimat abu-abu di tengah, tanpa
 * bingkai atau petunjuk apa pun tentang apa yang akan dikerjakan di sini.
 */
export const BelumAdaPilihan: React.FC<{
  icon?: LucideIcon;
  judul: string;
  keterangan: string;
  antreanKosong?: boolean;
}> = ({ icon, judul, keterangan, antreanKosong }) => (
  <Panel>
    <Kosong
      icon={icon}
      judul={antreanKosong ? 'Belum ada berkas di tahap ini' : judul}
      keterangan={
        antreanKosong
          ? 'Berkas akan muncul di sini setelah tahap sebelumnya selesai. Tidak ada yang perlu dikerjakan sekarang.'
          : keterangan
      }
    />
  </Panel>
);

/* ------------------------------------------------------------------ tabel */

/** Sel angka: rata kanan, lebar digit tetap. */
export const SelAngka: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children, className,
}) => <span className={cn('block text-right tabular-nums', className)}>{children}</span>;
