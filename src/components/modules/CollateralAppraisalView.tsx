import React, { useMemo, useState } from 'react';
import { Landmark, Search, TriangleAlert } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { StageShell, DeretAngka } from '../credit/StageShell';
import { Kosong, KosongKarenaSaringan, NadaPill, Panel } from '../credit/StageParts';
import { desimal, persen, rupiah, rupiahRingkas } from '../credit/pipeline';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/Table';
import { cn } from '../../lib/utils';

/**
 * Tahap 4 — Taksasi Agunan.
 *
 * Sebelumnya berkas ini hanya pembungkus 15 baris yang meneruskan `agunanData`
 * ke komponen dasbor lama, dengan `onAddAgunan` dan `onUpdateAgunan` diisi
 * fungsi kosong. Akibatnya tombol "Input Agunan Baru" di dalamnya membuka form,
 * menerima isian, lalu membuang semuanya tanpa memberi tahu siapa pun.
 *
 * Halaman ini sekarang berdiri sendiri, membaca data yang sama, dan tidak
 * menawarkan tindakan yang tidak bisa dipenuhinya. Komponen lama tetap utuh
 * untuk rute dasbor lama yang masih memakainya.
 *
 * Ambang LTV memakai ketentuan pengamanan agunan yang lazim: di atas 70% berarti
 * nilai agunan tipis terhadap pinjaman.
 */

const AMBANG_LTV = 70;

export const CollateralAppraisalView: React.FC = () => {
  const { agunanData } = useApp();

  const [cari, setCari] = useState('');
  const [jenis, setJenis] = useState<string>('ALL');

  const daftar = useMemo(() => agunanData.filter(a => {
    const q = cari.trim().toLowerCase();
    const cocokCari = q === '' ||
      a.debtorName?.toLowerCase().includes(q) ||
      a.certificateNo?.toLowerCase().includes(q) ||
      a.location?.toLowerCase().includes(q) ||
      a.regionName?.toLowerCase().includes(q);
    const cocokJenis = jenis === 'ALL' || a.collateralType === jenis;
    return cocokCari && cocokJenis;
  }), [agunanData, cari, jenis]);

  const totalPasar = agunanData.reduce((s, a) => s + (a.marketValue || 0), 0);
  const totalLikuidasi = agunanData.reduce((s, a) => s + (a.liquidationValue || 0), 0);
  const totalPinjaman = agunanData.reduce((s, a) => s + (a.loanAmount || 0), 0);
  const ltvRerata = totalPasar > 0 ? (totalPinjaman / totalPasar) * 100 : null;
  const wilayahTurun = agunanData.filter(a => a.isDecliningRegion).length;

  const adaSaringan = cari.trim() !== '' || jenis !== 'ALL';
  const reset = () => { setCari(''); setJenis('ALL'); };

  return (
    <StageShell
      stage="Collateral Appraisal"
      judul="Taksasi Agunan"
      keterangan="Menilai nilai pasar dan nilai likuidasi agunan, lalu memeriksa rasio pinjaman terhadap nilai agunan sebelum berkas maju ke komite."
    >
      {/* Catatan ini aturan kerja, bukan hiasan: nilai agunan di wilayah yang
          harganya sedang turun tidak boleh dipakai sebagai acuan utama. */}
      <div className="flex items-start gap-3 rounded-2xl border border-border bg-surface px-5 py-4 shadow-sm">
        <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
        <p className="text-xs leading-relaxed text-slate-600">
          Nilai agunan wajib mempertimbangkan kondisi wilayah. Daerah dengan tren harga menurun,
          misalnya kawasan rawan genangan atau yang aktivitas pasarnya melemah, tidak dipakai
          sebagai acuan utama dalam menetapkan taksasi dan limit kredit.
        </p>
      </div>

      <DeretAngka
        angka={[
          { label: 'Nilai pasar', nilai: rupiahRingkas(totalPasar), konteks: `${agunanData.length} agunan tercatat` },
          { label: 'Nilai likuidasi', nilai: rupiahRingkas(totalLikuidasi), konteks: `${persen(totalLikuidasi, totalPasar)} dari nilai pasar` },
          { label: 'Pinjaman dijamin', nilai: rupiahRingkas(totalPinjaman), konteks: 'Total baki debet ter-cover' },
          {
            label: 'LTV rata-rata',
            nilai: ltvRerata === null ? '—' : `${desimal(ltvRerata)}%`,
            konteks: `Ambang aman ${AMBANG_LTV}%`,
            nada: ltvRerata !== null && ltvRerata > AMBANG_LTV ? 'warning' : 'default',
          },
        ]}
      />

      {wilayahTurun > 0 && (
        <div className="flex items-center gap-2 rounded-xl border border-warning/30 bg-warning/10 px-4 py-2.5">
          <TriangleAlert className="h-4 w-4 shrink-0 text-warning" />
          <p className="text-xs font-bold text-warning">
            {wilayahTurun} agunan berada di wilayah dengan tren harga menurun.
          </p>
        </div>
      )}

      <Panel
        judul="Daftar agunan"
        hitungan={daftar.length}
        padat
        alat={
          <>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
              <input
                type="search" value={cari} onChange={e => setCari(e.target.value)}
                placeholder="Cari debitur, sertifikat, atau lokasi"
                aria-label="Cari agunan"
                className="w-56 rounded-xl border border-border bg-surface py-2 pl-9 pr-3 text-xs text-foreground placeholder:text-muted outline-none transition-colors focus:border-primary focus-visible:ring-2 focus-visible:ring-ring lg:w-72"
              />
            </div>
            <select
              value={jenis} onChange={e => setJenis(e.target.value)}
              aria-label="Saring jenis agunan"
              className="cursor-pointer rounded-xl border border-border bg-surface px-3 py-2 text-xs font-medium text-foreground outline-none transition-colors focus:border-primary focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="ALL">Semua jenis</option>
              <option value="SHM">SHM</option>
              <option value="BPKB">BPKB</option>
              <option value="DEPOSITO">Deposito</option>
              <option value="OTHER">Lainnya</option>
            </select>
          </>
        }
      >
        {daftar.length === 0 ? (
          adaSaringan ? (
            <KosongKarenaSaringan onReset={reset} />
          ) : (
            <Kosong
              icon={Landmark}
              judul="Belum ada agunan tercatat"
              keterangan="Agunan muncul di sini setelah surveyor mencatat sertifikat, nilai pasar, dan lokasinya pada berkas pengajuan."
            />
          )
        ) : (
          <Table wrapperClassName="border-0 rounded-none">
            <TableHeader>
              <TableRow>
                <TableHead>Debitur</TableHead>
                <TableHead>Sertifikat</TableHead>
                <TableHead className="text-right">Nilai pasar</TableHead>
                <TableHead className="text-right">Nilai likuidasi</TableHead>
                <TableHead className="text-right">Pinjaman</TableHead>
                <TableHead className="text-right">LTV</TableHead>
                <TableHead>Wilayah</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {daftar.map(a => {
                const ltv = Number(a.ltvRatio);
                const ltvTinggi = Number.isFinite(ltv) && ltv > AMBANG_LTV;
                return (
                  <TableRow key={a.id}>
                    <TableCell className="py-3">
                      <span className="block font-bold text-foreground">{a.debtorName}</span>
                      {a.aoName && <span className="block text-[10px] text-slate-500">AO {a.aoName}</span>}
                    </TableCell>
                    <TableCell className="py-3">
                      <span className="block font-bold tabular-nums text-foreground">{a.certificateNo || '—'}</span>
                      <span className="block text-[10px] text-slate-500">{a.collateralType}</span>
                    </TableCell>
                    <TableCell className="py-3 text-right tabular-nums text-slate-600">{rupiah(a.marketValue)}</TableCell>
                    <TableCell className="py-3 text-right tabular-nums text-slate-600">{rupiah(a.liquidationValue)}</TableCell>
                    <TableCell className="py-3 text-right font-bold tabular-nums text-foreground">{rupiah(a.loanAmount)}</TableCell>
                    <TableCell className={cn('py-3 text-right font-bold tabular-nums', ltvTinggi ? 'text-danger' : 'text-foreground')}>
                      {Number.isFinite(ltv) ? `${desimal(ltv)}%` : '—'}
                    </TableCell>
                    <TableCell className="py-3">
                      <span className="block text-slate-600">{a.regionName || a.location || '—'}</span>
                      {a.isDecliningRegion && (
                        <NadaPill className="mt-1" label="Tren harga menurun" nada="warning" />
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Panel>
    </StageShell>
  );
};
