import React, { useEffect, useMemo, useState } from 'react';
import { Calculator, CheckCircle2, FileText, Inbox, ScrollText } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { WorkflowActionModal } from '../common/WorkflowActionModal';
import { DocumentViewerModal } from '../common/DocumentViewerModal';
import { CreditApplication, CreditAppStage } from '../../types';
import { StageShell } from '../credit/StageShell';
import {
  BarisAntrean, BelumAdaPilihan, Kosong, Panel, StageWorkbench, StatusPill,
} from '../credit/StageParts';
import { desimal, rupiah, sisaSla } from '../credit/pipeline';
import { Button } from '../ui/Button';

/**
 * Tahap 3 — Analisis Kredit.
 *
 * Perilaku dan kontrak data tidak berubah: `submitCreditAnalysis` menerima
 * bentuk objek yang sama, `updateCreditAppStage` dipanggil dengan argumen yang
 * sama, dan alur setelah kirim tetap menuju modul Komite.
 *
 * Yang berubah selain tampilan:
 *
 * 1. Skor dan catatan 5C dulu berupa nilai tetap di dalam kode — "Riwayat SLIK
 *    OJK bersih", "margin bersih 30%", skor 88/86/85/90/85 — yang tidak pernah
 *    ditampilkan, tidak bisa disunting, tetapi ikut tersimpan ke berkas kredit
 *    seolah analis yang menuliskannya. Padahal 5C adalah judul halaman ini.
 *    Sekarang kelimanya jadi isian sungguhan dan awalnya kosong.
 * 2. Beberapa teks bawaan mengandung sisa interpolasi yang rusak: "plafon penuh
 *    Rp 0jangka waktu 36 bulan". Ikut hilang bersama nilai karangan tadi.
 * 3. DSCR dan IDI Index dulu membagi tanpa penjagaan, jadi menampilkan NaN atau
 *    Infinity begitu tenor atau pendapatan bersih bernilai nol.
 */

interface Nilai5C {
  kunci: 'character' | 'capacity' | 'capital' | 'collateral' | 'condition';
  label: string;
  keterangan: string;
}

const ASPEK_5C: Nilai5C[] = [
  { kunci: 'character',  label: 'Character',  keterangan: 'Itikad dan riwayat pembayaran' },
  { kunci: 'capacity',   label: 'Capacity',   keterangan: 'Kemampuan arus kas membayar angsuran' },
  { kunci: 'capital',    label: 'Capital',    keterangan: 'Modal sendiri dan struktur permodalan' },
  { kunci: 'collateral', label: 'Collateral', keterangan: 'Nilai dan pengikatan agunan' },
  { kunci: 'condition',  label: 'Condition',  keterangan: 'Kondisi usaha dan sektornya' },
];

const isianAngka =
  'w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold tabular-nums ' +
  'text-foreground outline-none transition-colors focus:border-primary focus-visible:ring-2 focus-visible:ring-ring';

const isianTeks =
  'w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs text-foreground ' +
  'placeholder:text-muted outline-none transition-colors focus:border-primary focus-visible:ring-2 focus-visible:ring-ring';

const Label: React.FC<{ children: React.ReactNode; untuk?: string }> = ({ children, untuk }) => (
  <label htmlFor={untuk} className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-muted">
    {children}
  </label>
);

/** Angka hasil hitungan: sorotan kecil, bukan isian. */
const Hitungan: React.FC<{
  label: string; nilai: string; catatan?: string; nada?: 'ok' | 'awas' | 'netral';
}> = ({ label, nilai, catatan, nada = 'netral' }) => (
  <div className="rounded-xl bg-surface-muted px-3 py-2.5">
    <p className="text-[10px] font-bold uppercase tracking-wide text-muted">{label}</p>
    <p
      className={
        'mt-1 text-sm font-bold tabular-nums ' +
        (nada === 'ok' ? 'text-success' : nada === 'awas' ? 'text-danger' : 'text-foreground')
      }
    >
      {nilai}
    </p>
    {catatan && <p className="mt-0.5 text-[10px] text-slate-500">{catatan}</p>}
  </div>
);

export const CreditAnalysisView: React.FC = () => {
  const { creditApplications, submitCreditAnalysis, currentUser, setActiveModule, updateCreditAppStage } = useApp();

  const analysisApps = creditApplications.filter(
    (a) => a.currentStage === 'ANALYSIS' || a.currentStage === 'SURVEY' || a.analysis
  );

  const [selectedAppId, setSelectedAppId] = useState<string>(
    analysisApps.length > 0 ? analysisApps[0].id : ''
  );

  // Antrean berubah saat berkas maju tahap. Tanpa ini, meja kerja bisa
  // menunjuk berkas yang sudah tidak ada dan sisi kanan jadi kosong tanpa sebab.
  useEffect(() => {
    if (analysisApps.length === 0) { if (selectedAppId) setSelectedAppId(''); return; }
    if (!analysisApps.some(a => a.id === selectedAppId)) setSelectedAppId(analysisApps[0].id);
  }, [analysisApps, selectedAppId]);

  const activeApp = creditApplications.find((a) => a.id === selectedAppId);

  const [analysisData, setAnalysisData] = useState({
    characterScore: 0,
    characterNotes: '',
    capacityScore: 0,
    capacityNotes: '',
    capitalScore: 0,
    capitalNotes: '',
    collateralScore: 0,
    collateralNotes: '',
    conditionScore: 0,
    conditionNotes: '',
    grossMonthlyRevenue: 0,
    operationalCost: 0,
    livingCost: 0,
    proposedPlafon: 0,
    proposedTenorMonths: 36,
    analystSummary: '',
  });

  // Plafon dan tenor mengikuti permohonan nasabah saat berkas dipilih, supaya
  // analis mengoreksi angka nyata, bukan mengetik ulang dari nol.
  useEffect(() => {
    if (!activeApp) return;
    setAnalysisData(d => ({
      ...d,
      proposedPlafon: activeApp.requestedPlafon ?? 0,
      proposedTenorMonths: activeApp.requestedTenorMonths || 36,
    }));
  }, [activeApp?.id]);

  const netDisposableIncome =
    analysisData.grossMonthlyRevenue - analysisData.operationalCost - analysisData.livingCost;

  const proposedInstallment = useMemo(() => {
    const tenor = analysisData.proposedTenorMonths;
    if (!tenor || tenor <= 0) return 0;
    return Math.round(analysisData.proposedPlafon / tenor + (analysisData.proposedPlafon * 0.145) / 12);
  }, [analysisData.proposedPlafon, analysisData.proposedTenorMonths]);

  /*
   * Pembagian dijaga, dan rasio baru ditampilkan setelah ada yang diisi.
   *
   * Sebelumnya kedua rasio ini menghasilkan NaN atau Infinity begitu tenor atau
   * pendapatan bersih nol. Menampilkan "0,00x" berwarna merah sebelum analis
   * mengetik apa pun juga menyesatkan: itu terbaca sebagai vonis tidak layak,
   * padahal belum ada satu angka pun yang dinilai. Selama omzet masih kosong,
   * yang jujur adalah tanda pisah.
   */
  const adaMasukan = analysisData.grossMonthlyRevenue > 0;
  const dscrRatio = proposedInstallment > 0 ? netDisposableIncome / proposedInstallment : 0;
  const dscrTeks = adaMasukan && proposedInstallment > 0 ? `${desimal(dscrRatio, 2)}x` : '—';
  const idiTeks = adaMasukan && netDisposableIncome > 0
    ? `${desimal((proposedInstallment / netDisposableIncome) * 100)}%`
    : '—';

  const dscrSehat = adaMasukan && proposedInstallment > 0 && dscrRatio >= 1.3;
  const idiSehat = adaMasukan && netDisposableIncome > 0 && (proposedInstallment / netDisposableIncome) * 100 <= 40;

  const [viewerModal, setViewerModal] = useState<{ isOpen: boolean; app: CreditApplication | null }>({ isOpen: false, app: null });
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);

  const handleWorkflowSubmit = (action: string, nextStage: CreditAppStage, notes: string, fileUrl?: string, fileName?: string) => {
    if (!selectedAppId) return;

    if (action === 'PROCEED') {
      submitCreditAnalysis(selectedAppId, {
        ...analysisData,
        netDisposableIncome,
        proposedInstallment,
        dscrRatio: Number(dscrRatio.toFixed(2)),
      });
      updateCreditAppStage(selectedAppId, nextStage, notes, fileUrl, fileName);
    } else {
      updateCreditAppStage(selectedAppId, nextStage, notes, fileUrl, fileName);
    }

    setIsActionModalOpen(false);
    setActiveModule('CREDIT_APPROVAL');
  };

  const ubahAngka = (kunci: keyof typeof analysisData) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setAnalysisData(d => ({ ...d, [kunci]: Number(e.target.value) || 0 }));

  const siapKirim = analysisData.proposedPlafon > 0 && analysisData.analystSummary.trim().length > 0;

  return (
    <StageShell
      stage="Credit Analysis"
      judul="Analisis Kelayakan Kredit"
      keterangan="Menilai kemampuan membayar lewat arus kas dan rasio DSCR, lalu menuangkan penilaian 5C sebagai dasar usulan ke komite."
    >
      <StageWorkbench
        judulAntrean="Antrean analisis"
        jumlah={analysisApps.length}
        antrean={
          analysisApps.length === 0 ? (
            <Kosong
              rapat
              icon={Inbox}
              judul="Antrean kosong"
              keterangan="Berkas masuk ke sini setelah survei lapangan selesai."
            />
          ) : (
            analysisApps.map(app => {
              const sla = sisaSla(app.slaDeadline, app.slaExceeded);
              return (
                <BarisAntrean
                  key={app.id}
                  terpilih={selectedAppId === app.id}
                  onClick={() => setSelectedAppId(app.id)}
                  utama={app.customerName}
                  kedua={`${rupiah(app.requestedPlafon)} · ${app.requestedTenorMonths} bln`}
                  kanan={<StatusPill stage={app.currentStage} />}
                  bawah={
                    sla.nada !== 'neutral' ? (
                      <span
                        className={
                          'text-[10px] font-bold ' +
                          (sla.nada === 'danger' ? 'text-danger' : 'text-warning')
                        }
                      >
                        {sla.label}
                      </span>
                    ) : undefined
                  }
                />
              );
            })
          )
        }
      >
        {!activeApp ? (
          <BelumAdaPilihan
            icon={ScrollText}
            judul="Pilih berkas untuk mulai menganalisis"
            keterangan="Klik salah satu nama di antrean sebelah kiri. Lembar kerja arus kas dan penilaian 5C akan terbuka di sini."
            antreanKosong={analysisApps.length === 0}
          />
        ) : (
          <form onSubmit={e => e.preventDefault()} className="space-y-5">
            <Panel
              judul={`Lembar kerja · ${activeApp.customerName}`}
              alat={
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setViewerModal({ isOpen: true, app: activeApp })}
                >
                  <FileText className="mr-1.5 h-3.5 w-3.5" /> Berkas & SLIK
                </Button>
              }
            >
              <p className="-mt-1 mb-5 text-[11px] tabular-nums text-slate-500">
                No. {activeApp.applicationNumber} · Analis: {currentUser?.name}
              </p>

              {/* ---------------- kapasitas membayar ---------------- */}
              <section>
                <h3 className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                  <Calculator className="h-4 w-4 text-primary" strokeWidth={2} />
                  Kapasitas membayar
                </h3>
                <p className="mt-1 text-[11px] text-slate-500">
                  Diisi dari hasil survei dan bukti usaha nasabah. Angka per bulan.
                </p>

                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div>
                    <Label untuk="omzet">Omzet kotor</Label>
                    <input id="omzet" type="number" min={0} value={analysisData.grossMonthlyRevenue}
                      onChange={ubahAngka('grossMonthlyRevenue')} className={isianAngka} />
                  </div>
                  <div>
                    <Label untuk="biaya-usaha">Biaya usaha</Label>
                    <input id="biaya-usaha" type="number" min={0} value={analysisData.operationalCost}
                      onChange={ubahAngka('operationalCost')} className={isianAngka} />
                  </div>
                  <div>
                    <Label untuk="biaya-hidup">Biaya hidup keluarga</Label>
                    <input id="biaya-hidup" type="number" min={0} value={analysisData.livingCost}
                      onChange={ubahAngka('livingCost')} className={isianAngka} />
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2 border-t border-border pt-4 sm:grid-cols-4">
                  <Hitungan
                    label="Sisa pendapatan"
                    nilai={adaMasukan ? rupiah(netDisposableIncome) : '—'}
                    nada={!adaMasukan ? 'netral' : netDisposableIncome > 0 ? 'ok' : 'awas'}
                    catatan="Omzet dikurangi biaya"
                  />
                  <Hitungan
                    label="Angsuran per bulan"
                    nilai={proposedInstallment > 0 ? rupiah(proposedInstallment) : '—'}
                    catatan="Anuitas, bunga 14,5%"
                  />
                  <Hitungan
                    label="DSCR"
                    nilai={dscrTeks}
                    nada={!adaMasukan || proposedInstallment === 0 ? 'netral' : dscrSehat ? 'ok' : 'awas'}
                    catatan="Minimum 1,30x"
                  />
                  <Hitungan
                    label="Beban cicilan"
                    nilai={idiTeks}
                    nada={!adaMasukan || netDisposableIncome <= 0 ? 'netral' : idiSehat ? 'ok' : 'awas'}
                    catatan="Maksimum 40%"
                  />
                </div>
              </section>
            </Panel>

            {/* ---------------- penilaian 5C ---------------- */}
            <Panel judul="Penilaian 5C">
              <p className="-mt-1 mb-4 text-[11px] text-slate-500">
                Skor 0–100 beserta alasannya. Isian ini tersimpan ke berkas kredit dan dibaca komite,
                jadi tuliskan penilaian Anda sendiri.
              </p>

              <div className="space-y-3">
                {ASPEK_5C.map(aspek => {
                  const kunciSkor = `${aspek.kunci}Score` as keyof typeof analysisData;
                  const kunciCatatan = `${aspek.kunci}Notes` as keyof typeof analysisData;
                  const skor = Number(analysisData[kunciSkor]);
                  return (
                    <div
                      key={aspek.kunci}
                      className="grid grid-cols-1 gap-3 rounded-xl bg-surface-muted p-3 sm:grid-cols-[10rem_5.5rem_1fr] sm:items-center"
                    >
                      <div>
                        <p className="text-xs font-bold text-foreground">{aspek.label}</p>
                        <p className="text-[10px] leading-snug text-slate-500">{aspek.keterangan}</p>
                      </div>
                      <input
                        type="number" min={0} max={100} value={skor || ''}
                        placeholder="0–100"
                        onChange={e => setAnalysisData(d => ({
                          ...d,
                          [kunciSkor]: Math.max(0, Math.min(100, Number(e.target.value) || 0)),
                        }))}
                        aria-label={`Skor ${aspek.label}`}
                        className={isianAngka}
                      />
                      <input
                        type="text" value={String(analysisData[kunciCatatan] ?? '')}
                        placeholder={`Alasan penilaian ${aspek.label.toLowerCase()}`}
                        onChange={e => setAnalysisData(d => ({ ...d, [kunciCatatan]: e.target.value }))}
                        aria-label={`Catatan ${aspek.label}`}
                        className={isianTeks}
                      />
                    </div>
                  );
                })}
              </div>
            </Panel>

            {/* ---------------- usulan ---------------- */}
            <Panel judul="Usulan analis">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <Label untuk="plafon">Plafon yang diusulkan</Label>
                  <input id="plafon" type="number" min={0} value={analysisData.proposedPlafon}
                    onChange={ubahAngka('proposedPlafon')} className={isianAngka} />
                  <p className="mt-1 text-[10px] tabular-nums text-slate-500">
                    Permohonan nasabah {rupiah(activeApp.requestedPlafon)}
                  </p>
                </div>
                <div>
                  <Label untuk="tenor">Jangka waktu (bulan)</Label>
                  <input id="tenor" type="number" min={1} value={analysisData.proposedTenorMonths}
                    onChange={ubahAngka('proposedTenorMonths')} className={isianAngka} />
                  <p className="mt-1 text-[10px] tabular-nums text-slate-500">
                    Permohonan nasabah {activeApp.requestedTenorMonths} bulan
                  </p>
                </div>
              </div>

              <div className="mt-4">
                <Label untuk="kesimpulan">Kesimpulan</Label>
                <textarea
                  id="kesimpulan" rows={3} value={analysisData.analystSummary}
                  placeholder="Layak atau tidak, dengan syarat apa, dan atas dasar apa."
                  onChange={e => setAnalysisData(d => ({ ...d, analystSummary: e.target.value }))}
                  className={isianTeks + ' resize-y'}
                />
              </div>

              <div className="mt-5 flex flex-col items-stretch gap-2 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-[11px] text-slate-500">
                  {siapKirim
                    ? 'Siap diteruskan ke komite kredit.'
                    : 'Isi plafon yang diusulkan dan kesimpulan sebelum meneruskan.'}
                </p>
                <Button type="button" disabled={!siapKirim} onClick={() => setIsActionModalOpen(true)}>
                  <CheckCircle2 className="mr-1.5 h-4 w-4" /> Teruskan hasil analisis
                </Button>
              </div>
            </Panel>
          </form>
        )}
      </StageWorkbench>

      <WorkflowActionModal
        isOpen={isActionModalOpen}
        onClose={() => setIsActionModalOpen(false)}
        title="Keputusan Analisis Kredit"
        subtitle="Rekomendasikan ke Komite, Kembalikan ke tahap sebelumnya, atau Tolak."
        applicationId={activeApp?.applicationNumber || ''}
        customerName={activeApp?.customerName || ''}
        currentStage={activeApp?.currentStage || 'ANALYSIS'}
        availableActions={['PROCEED', 'RETURN', 'REJECT']}
        proceedStage="CREDIT_COMMITTEE"
        proceedLabel="Rekomendasikan ke Komite"
        returnOptions={[
          { stage: 'VERIFICATION', label: 'Admin Legal (Verifikasi Ulang)' },
          { stage: 'SUBMITTED', label: 'AO (Data Kurang)' }
        ]}
        onSubmit={handleWorkflowSubmit}
      />

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
