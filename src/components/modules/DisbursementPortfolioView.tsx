import React, { useMemo, useState } from 'react';
import { AlertTriangle, FileText, Search, Send, Wallet } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { DocumentViewerModal } from '../common/DocumentViewerModal';
import { CreditApplication } from '../../types';
import { StageShell, DeretAngka } from '../credit/StageShell';
import { Kosong, KosongKarenaSaringan, KolPill, Panel } from '../credit/StageParts';
import { persen, rupiah, rupiahRingkas, tanggalPendek } from '../credit/pipeline';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/Table';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';

/**
 * Tahap 7 — Pencairan & portofolio.
 *
 * Perbaikan di luar tampilan:
 *
 * 1. "NaN% dari Total Portofolio" tampil di layar begitu portofolio kosong,
 *    karena (kol1/total)*100 dihitung tanpa menjaga pembagi nol — dan nol
 *    adalah keadaan hari ini. Sekarang lewat helper `persen` yang menulis "—".
 * 2. "Tingkat Penagihan Tepat Waktu" selalu menampilkan 0% dengan keterangan
 *    "SLA Jatuh Tempo Terjaga". Angka itu tidak pernah dihitung dari apa pun.
 *    Diganti jumlah fasilitas menunggak, yang memang bisa dihitung dari data.
 * 3. Pencairan dana dulu langsung jalan begitu tombol ditekan, lalu memberi
 *    kabar lewat `alert()` — sesudah uangnya berpindah. Uang keluar tidak bisa
 *    ditarik kembali, jadi sekarang dikonfirmasi dulu.
 * 4. Kabar pencairan menyebut `requestedPlafon`, yaitu yang dimohon nasabah,
 *    bukan yang disetujui komite. Sekarang memakai plafon putusan.
 * 5. Tabel tidak punya keadaan kosong sama sekali — hanya kepala tabel
 *    menggantung tanpa isi.
 */

export const DisbursementPortfolioView: React.FC = () => {
  const {
    loanFacilities,
    creditApplications,
    disburseCreditFacility,
    openCustomer360,
    selectedBranchId,
    setActiveModule,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedKolFilter, setSelectedKolFilter] = useState<string>('ALL');
  const [viewerModal, setViewerModal] = useState<{ isOpen: boolean; app: CreditApplication | null }>({ isOpen: false, app: null });
  const [konfirmasi, setKonfirmasi] = useState<CreditApplication | null>(null);

  const pendingDisbursementApps = creditApplications.filter((a) => a.currentStage === 'APPROVED');

  const totalOutstanding = loanFacilities.reduce((acc, f) => acc + f.outstandingPrincipal, 0);
  const totalOriginalPlafon = loanFacilities.reduce((acc, f) => acc + f.originalPlafon, 0);
  const kol1Total = loanFacilities
    .filter((f) => f.collectibility === 'KOL_1')
    .reduce((acc, f) => acc + f.outstandingPrincipal, 0);
  const menunggak = loanFacilities.filter((f) => (f.dpdDays ?? 0) > 0).length;

  const filteredFacilities = useMemo(() => loanFacilities.filter((f) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      f.customerName.toLowerCase().includes(q) ||
      f.facilityNumber.toLowerCase().includes(q) ||
      f.accountNumber.toLowerCase().includes(q) ||
      f.cif.toLowerCase().includes(q);
    const matchesKol = selectedKolFilter === 'ALL' || f.collectibility === selectedKolFilter;
    const matchesBranch = selectedBranchId === 'ALL' || f.branchId === selectedBranchId;
    return matchesSearch && matchesKol && matchesBranch;
  }), [loanFacilities, searchQuery, selectedKolFilter, selectedBranchId]);

  const adaSaringan = searchQuery.trim() !== '' || selectedKolFilter !== 'ALL';
  const resetSaringan = () => { setSearchQuery(''); setSelectedKolFilter('ALL'); };

  /** Plafon yang benar-benar disetujui komite; jatuh ke permohonan bila belum ada putusan. */
  const plafonDisetujui = (app: CreditApplication) =>
    app.approvals?.[app.approvals.length - 1]?.approvedPlafon ?? app.requestedPlafon;

  const cairkan = () => {
    if (!konfirmasi) return;
    disburseCreditFacility(konfirmasi.id);
    setKonfirmasi(null);
  };

  return (
    <StageShell
      stage="Disbursement"
      judul="Pencairan & Portofolio Pinjaman"
      keterangan="Mencairkan kredit yang sudah berakad ke rekening debitur, lalu memantau baki debet dan hari menunggak."
    >
      {/* -------------------- antrean pencairan -------------------- */}
      {pendingDisbursementApps.length > 0 && (
        <Panel judul="Menunggu pencairan" hitungan={pendingDisbursementApps.length} padat>
          <ul className="divide-y divide-border">
            {pendingDisbursementApps.map((app) => (
              <li key={app.id} className="flex flex-col gap-3 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="truncate text-xs font-bold text-foreground">{app.customerName}</p>
                  <p className="mt-0.5 text-[11px] tabular-nums text-slate-500">
                    {app.applicationNumber} · {rupiah(plafonDisetujui(app))} disetujui
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Button variant="secondary" size="sm" onClick={() => setViewerModal({ isOpen: true, app })}>
                    <FileText className="mr-1.5 h-3.5 w-3.5" /> Berkas
                  </Button>
                  <Button size="sm" onClick={() => setKonfirmasi(app)}>
                    <Send className="mr-1.5 h-3.5 w-3.5" /> Cairkan dana
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      )}

      {/* -------------------- angka portofolio -------------------- */}
      <DeretAngka
        angka={[
          {
            label: 'Baki debet dikelola',
            nilai: rupiahRingkas(totalOutstanding),
            konteks: `Dari plafon asal ${rupiahRingkas(totalOriginalPlafon)}`,
          },
          {
            label: 'Portofolio lancar',
            nilai: rupiahRingkas(kol1Total),
            konteks: `${persen(kol1Total, totalOutstanding)} dari baki debet`,
            nada: kol1Total > 0 ? 'success' : 'default',
          },
          {
            label: 'Fasilitas aktif',
            nilai: loanFacilities.length.toLocaleString('id-ID'),
            konteks: 'Seluruh cabang terpilih',
          },
          {
            label: 'Menunggak',
            nilai: menunggak.toLocaleString('id-ID'),
            konteks: menunggak > 0 ? 'Hari menunggak di atas nol' : 'Tidak ada tunggakan',
            nada: menunggak > 0 ? 'warning' : 'default',
          },
        ]}
      />

      {/* -------------------- daftar fasilitas -------------------- */}
      <Panel
        judul="Fasilitas pinjaman"
        hitungan={filteredFacilities.length}
        padat
        alat={
          <>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari debitur, nomor rekening, atau CIF"
                aria-label="Cari fasilitas pinjaman"
                className="w-56 rounded-xl border border-border bg-surface py-2 pl-9 pr-3 text-xs text-foreground placeholder:text-muted outline-none transition-colors focus:border-primary focus-visible:ring-2 focus-visible:ring-ring lg:w-72"
              />
            </div>
            <select
              value={selectedKolFilter}
              onChange={(e) => setSelectedKolFilter(e.target.value)}
              aria-label="Saring kolektibilitas"
              className="cursor-pointer rounded-xl border border-border bg-surface px-3 py-2 text-xs font-medium text-foreground outline-none transition-colors focus:border-primary focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="ALL">Semua kolektibilitas</option>
              <option value="KOL_1">Kol 1 · Lancar</option>
              <option value="KOL_2">Kol 2 · Perhatian khusus</option>
              <option value="KOL_3">Kol 3 · Kurang lancar</option>
              <option value="KOL_4">Kol 4 · Diragukan</option>
              <option value="KOL_5">Kol 5 · Macet</option>
            </select>
          </>
        }
      >
        {filteredFacilities.length === 0 ? (
          adaSaringan ? (
            <KosongKarenaSaringan onReset={resetSaringan} />
          ) : (
            <Kosong
              icon={Wallet}
              judul="Belum ada fasilitas pinjaman"
              keterangan="Fasilitas muncul di sini setelah kredit yang berakad dicairkan. Baki debet, angsuran, dan kolektibilitasnya akan terpantau dari daftar ini."
            />
          )
        ) : (
          <Table wrapperClassName="border-0 rounded-none">
            <TableHeader>
              <TableRow>
                <TableHead>Fasilitas</TableHead>
                <TableHead>Debitur</TableHead>
                <TableHead className="text-right">Plafon awal</TableHead>
                <TableHead className="text-right">Baki debet</TableHead>
                <TableHead className="text-right">Angsuran</TableHead>
                <TableHead>Kolektibilitas</TableHead>
                <TableHead className="text-right">Jatuh tempo</TableHead>
                <TableHead className="text-right">Tindakan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFacilities.map((fac) => (
                <TableRow key={fac.id}>
                  <TableCell className="py-3">
                    <span className="block font-bold tabular-nums text-foreground">{fac.facilityNumber}</span>
                    <span className="block text-[10px] tabular-nums text-slate-500">{fac.accountNumber}</span>
                  </TableCell>

                  <TableCell className="py-3">
                    <button
                      onClick={() => openCustomer360(fac.cif)}
                      className="block text-left font-bold text-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {fac.customerName}
                    </button>
                    <span className="block text-[10px] tabular-nums text-slate-500">{fac.cif}</span>
                  </TableCell>

                  <TableCell className="py-3 text-right tabular-nums text-slate-600">
                    {rupiah(fac.originalPlafon)}
                  </TableCell>
                  <TableCell className="py-3 text-right font-bold tabular-nums text-foreground">
                    {rupiah(fac.outstandingPrincipal)}
                  </TableCell>
                  <TableCell className="py-3 text-right tabular-nums text-slate-600">
                    {rupiah(fac.monthlyInstallment)}
                  </TableCell>

                  <TableCell className="py-3">
                    <KolPill kol={fac.collectibility} />
                    {(fac.dpdDays ?? 0) > 0 && (
                      <span className="mt-1 block text-[10px] font-bold tabular-nums text-danger">
                        Menunggak {fac.dpdDays} hari
                      </span>
                    )}
                  </TableCell>

                  <TableCell className="py-3 text-right tabular-nums text-slate-600">
                    {tanggalPendek(fac.nextDueDate)}
                  </TableCell>

                  <TableCell className="py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      {(fac.dpdDays ?? 0) > 0 && (
                        <Button variant="ghost" size="sm" onClick={() => setActiveModule('PTP_TRACKER')}>
                          Catat janji bayar
                        </Button>
                      )}
                      <Button variant="secondary" size="sm" onClick={() => openCustomer360(fac.cif)}>
                        Lihat nasabah
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Panel>

      {/* -------------------- konfirmasi pencairan -------------------- */}
      <Modal
        isOpen={konfirmasi !== null}
        onClose={() => setKonfirmasi(null)}
        title="Cairkan dana ke rekening debitur?"
        description="Pencairan tercatat langsung dan tidak bisa dibatalkan dari layar ini."
      >
        {konfirmasi && (
          <div className="space-y-4">
            <dl className="divide-y divide-border rounded-xl border border-border">
              {[
                ['Debitur', konfirmasi.customerName],
                ['No. pengajuan', konfirmasi.applicationNumber],
                ['Jumlah dicairkan', rupiah(plafonDisetujui(konfirmasi))],
              ].map(([k, v]) => (
                <div key={k} className="flex items-center justify-between gap-3 px-4 py-2.5">
                  <dt className="text-xs text-slate-500">{k}</dt>
                  <dd className="text-xs font-bold tabular-nums text-foreground">{v}</dd>
                </div>
              ))}
            </dl>

            <p className="flex items-start gap-2 text-[11px] leading-relaxed text-slate-500">
              <AlertTriangle className="mt-px h-3.5 w-3.5 shrink-0 text-warning" />
              <span>Pastikan akad sudah ditandatangani dan seluruh syarat penarikan terpenuhi.</span>
            </p>

            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setKonfirmasi(null)}>Batal</Button>
              <Button onClick={cairkan}>
                <Send className="mr-1.5 h-4 w-4" /> Ya, cairkan
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <DocumentViewerModal
        isOpen={viewerModal.isOpen}
        onClose={() => setViewerModal({ isOpen: false, app: null })}
        documents={viewerModal.app?.documents || []}
        customerName={viewerModal.app?.customerName || ''}
        applicationNumber={viewerModal.app?.applicationNumber || ''}
        app={viewerModal.app}
      />
    </StageShell>
  );
};
