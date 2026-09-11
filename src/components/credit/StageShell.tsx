import React from 'react';
import { PipelineRail } from './PipelineRail';
import type { PipelineStageName } from './pipeline';
import { PageContainer } from '../ui/PageContainer';
import { cn } from '../../lib/utils';

/**
 * Kerangka satu tahap pipeline.
 *
 * Sebelumnya lima dari tujuh halaman menyalin spanduk judul yang sama kata per
 * kata — pembungkus, ukuran huruf, dan warna identik — masing-masing dengan
 * aksen berbeda tanpa alasan (ungu, kuning, biru, emerald). Satu berkas ini
 * menggantikan kelimanya, sehingga berpindah tahap tidak lagi terasa seperti
 * berpindah aplikasi.
 *
 * Urutannya baku dan sengaja: rel tahap, judul, angka, saringan, isi.
 */

interface Props {
  stage: PipelineStageName;
  judul: string;
  keterangan?: string;
  /** Tindakan utama tahap ini. Satu saja; sisanya masuk ke dalam isi. */
  aksi?: React.ReactNode;
  /** Lencana kecil di samping judul, mis. kewenangan pemutus. */
  lencana?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const StageShell: React.FC<Props> = ({
  stage, judul, keterangan, aksi, lencana, children, className,
}) => (
  <PageContainer className={className}>
    <PipelineRail currentStage={stage} />

    <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-bold tracking-tight text-foreground">{judul}</h1>
          {lencana}
        </div>
        {keterangan && (
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-slate-500">{keterangan}</p>
        )}
      </div>
      {aksi && <div className="flex shrink-0 items-center gap-2">{aksi}</div>}
    </header>

    {children}
  </PageContainer>
);

/* ------------------------------------------------------------------ angka ringkas */

export interface Angka {
  label: string;
  nilai: React.ReactNode;
  /** Konteks di bawah angka: periode pembanding, dasar hitungan, atau satuan. */
  konteks?: string;
  nada?: 'default' | 'success' | 'warning' | 'danger';
}

/**
 * Deret angka ringkas sebagai satu panel, bukan empat kartu sejajar.
 *
 * Kartu seukuran berjajar adalah wadah termalas untuk struktur halaman, dan
 * angka-angka ini memang saling dibandingkan — memisahkannya ke dalam kotak
 * masing-masing justru memutus perbandingan itu. Satu panel dengan garis
 * pemisah membacanya sebagai satu instrumen.
 *
 * Semua nilai memakai tabular-nums supaya lebar digit tidak berubah saat data
 * disegarkan dan kolom angka tetap rata.
 */
export const DeretAngka: React.FC<{ angka: Angka[] }> = ({ angka }) => (
  <div
    className={cn(
      'overflow-hidden rounded-2xl border border-border bg-surface shadow-sm',
      // Dua kolom di layar sempit, sejajar penuh di layar lebar. Garis pemisah
      // digambar per sel lalu dimatikan di kolom pertama tiap baris, supaya
      // tidak ada garis menggantung di tepi panel.
      'grid grid-cols-2 lg:grid-cols-4',
      '[&>*]:border-l [&>*]:border-t [&>*]:border-border',
      '[&>*:nth-child(-n+2)]:border-t-0 [&>*:nth-child(2n+1)]:border-l-0',
      'lg:[&>*:nth-child(-n+4)]:border-t-0',
      'lg:[&>*:nth-child(2n+1)]:border-l lg:[&>*:nth-child(4n+1)]:border-l-0',
    )}
  >
    {angka.map(a => (
      <div key={a.label} className="px-5 py-4">
        <p className="text-[11px] font-bold uppercase tracking-wide text-muted">{a.label}</p>
        <p
          className={cn(
            'mt-1.5 text-2xl font-bold tracking-tight tabular-nums',
            a.nada === 'success' && 'text-success',
            a.nada === 'warning' && 'text-warning',
            a.nada === 'danger' && 'text-danger',
            (!a.nada || a.nada === 'default') && 'text-foreground',
          )}
        >
          {a.nilai}
        </p>
        {a.konteks && <p className="mt-1 text-[11px] text-slate-500">{a.konteks}</p>}
      </div>
    ))}
  </div>
);
