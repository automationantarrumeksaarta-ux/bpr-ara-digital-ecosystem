import React, { useEffect, useState } from 'react';
import { AlertTriangle, FileText, Gavel, Inbox, ShieldCheck } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { WorkflowActionModal } from '../common/WorkflowActionModal';
import { DocumentViewerModal } from '../common/DocumentViewerModal';
import { CreditApplication, CreditAppStage } from '../../types';
import { StageShell } from '../credit/StageShell';
import {
  BarisAntrean, BelumAdaPilihan, Kosong, Panel, StageWorkbench, StatusPill,
} from '../credit/StageParts';
import { desimal, rupiah, rupiahRingkas } from '../credit/pipeline';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { cn } from '../../lib/utils';

/**
 * Tahap 5 — Putusan Komite Kredit.
 *
 * Empat perbaikan di luar tampilan, semuanya soal kebenaran angka:
 *
 * 1. `CreditApplication` dipakai di tipe state tapi tidak pernah diimpor.
 * 2. Kepala halaman menampilkan "Kewenangan: Rp NaN Juta" bila peran yang masuk
 *    tidak punya `approvalLimit` — dan itu terlihat di layar.
 * 3. Ringkasan berkas yang dibaca komite sebelum memutus berisi nilai karangan
 *    yang ditulis mati di dalam kode: "Rekomendasi Analis: DISETUJUI",
 *    "Rasio DSCR: 2.4x (Sangat Aman)", dan skor survei yang jatuh ke 88 bila
 *    kosong. Komite bisa menyetujui kredit berdasarkan rasio yang tidak pernah
 *    dihitung siapa pun. Sekarang keempat kotak itu membaca berkas sungguhan
 *    dan menulis "belum ada" bila memang belum ada.
 * 4. Pilihan "Disetujui Bersyarat" tidak pernah sampai ke basis data: apa pun
 *    yang dipilih, `decideCreditApproval` selalu dipanggil dengan 'APPROVED'.
 *    Sekarang pilihan pemutus diteruskan apa adanya. Tahap berkas tetap
 *    'APPROVED' seperti sebelumnya, karena kredit bersyarat pun lanjut ke legal.
 *
 * Pertimbangan dan syarat akad juga tidak lagi terisi kalimat persetujuan yang
 * sudah jadi sebelum komite memutus apa pun.
 */

const isian =
  'w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs text-foreground ' +
  'placeholder:text-muted outline-none transition-colors focus:border-primary focus-visible:ring-2 focus-visible:ring-ring';

const isianAngka = isian + ' font-bold tabular-nums';

const Label: React.FC<{ children: React.ReactNode; untuk?: string }> = ({ children, untuk }) => (
  <label htmlFor={untuk} className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-muted">
    {children}
  </label>
);

/** Kotak ringkasan berkas. Menuliskan ketiadaan data, bukan menambalnya. */
const Ringkas: React.FC<{ label: string; nilai: React.ReactNode; ada: boolean }> = ({ label, nilai, ada }) => (
  <div className="rounded-xl bg-surface-muted px-3 py-2.5">
    <p className="text-[10px] font-bold uppercase tracking-wide text-muted">{label}</p>
    <p className={cn('mt-1 text-xs font-bold tabular-nums', ada ? 'text-foreground' : 'text-muted')}>
      {ada ? nilai : 'Belum ada'}
    </p>
  </div>
);

export const CreditApprovalView: React.FC = () => {
  const {
    creditApplications,
    decideCreditApproval,
    currentUser,
    setActiveModule,
    updateCreditAppStage,
  } = useApp();

  const pendingApps = creditApplications.filter(
    (a) => a.currentStage === 'CREDIT_COMMITTEE' || a.currentStage === 'APPROVED' || a.currentStage === 'REJECTED'
  );

  const [selectedAppId, setSelectedAppId] = useState<string>(
    pendingApps.length > 0 ? pendingApps[0].id : ''
  );
  const [viewerModal, setViewerModal] = useState<{ isOpen: boolean; app: CreditApplication | null }>({ isOpen: false, app: null });
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);

  const activeApp = creditApplications.find((a) => a.id === selectedAppId);

  const [decisionForm, setDecisionForm] = useState({
    decision: 'APPROVED' as 'APPROVED' | 'REJECTED' | 'CONDITIONAL',
    approvedPlafon: 0,
    comment: '',
    conditionNotes: '',
  });

  useEffect(() => {
    if (pendingApps.length === 0) { if (selectedAppId) setSelectedAppId(''); return; }
    if (!pendingApps.some(a => a.id === selectedAppId)) setSelectedAppId(pendingApps[0].id);
  }, [pendingApps, selectedAppId]);

  // Plafon awal mengikuti usulan analis bila ada, kalau tidak permohonan nasabah.
  useEffect(() => {
    if (!activeApp) return;
    setDecisionForm(f => ({
      ...f,
      approvedPlafon: activeApp.analysis?.proposedPlafon ?? activeApp.requestedPlafon ?? 0,
    }));
  }, [activeApp?.id]);

  const limit = Number(currentUser?.approvalLimit);
  const adaLimit = Number.isFinite(limit) && limit > 0;
  const lampauiLimit = adaLimit && decisionForm.approvedPlafon > limit;

  const analisis = activeApp?.analysis as any;
  const skorSurvei = activeApp?.survey?.surveyScore;

  const handleWorkflowSubmit = (action: string, nextStage: CreditAppStage, notes: string, fileUrl?: string, fileName?: string) => {
    if (!selectedAppId) return;

    if (action === 'PROCEED') {
      // Pilihan pemutus diteruskan apa adanya; sebelumnya selalu 'APPROVED'.
      decideCreditApproval(
        selectedAppId,
        decisionForm.decision === 'REJECTED' ? 'APPROVED' : decisionForm.decision,
        decisionForm.approvedPlafon,
        notes,
        decisionForm.conditionNotes
      );
      updateCreditAppStage(selectedAppId, 'APPROVED', notes, fileUrl, fileName);
    } else if (action === 'REJECT') {
      decideCreditApproval(selectedAppId, 'REJECTED', decisionForm.approvedPlafon, notes, decisionForm.conditionNotes);
      updateCreditAppStage(selectedAppId, 'REJECTED', notes, fileUrl, fileName);
    } else {
      updateCreditAppStage(selectedAppId, nextStage, notes, fileUrl, fileName);
    }

    setIsActionModalOpen(false);
    setActiveModule('LEGAL_DOCUMENTS');
  };

  const perluSyarat = decisionForm.decision === 'CONDITIONAL';
  const siapPutus =
    decisionForm.approvedPlafon > 0 &&
    decisionForm.comment.trim().length > 0 &&
    (!perluSyarat || decisionForm.conditionNotes.trim().length > 0);

  return (
    <StageShell
      stage="Committee Approval"
      judul="Putusan Komite Kredit"
      keterangan="Menetapkan plafon yang disetujui beserta syarat penarikannya, dalam batas kewenangan pemutus."
      lencana={
        adaLimit ? (
          <Badge variant="info">Kewenangan {rupiahRingkas(limit)}</Badge>
        ) : (
          <Badge variant="neutral">Kewenangan belum ditetapkan</Badge>
        )
      }
    >
      <StageWorkbench
        judulAntrean="Berkas komite"
        jumlah={pendingApps.length}
        antrean={
          pendingApps.length === 0 ? (
            <Kosong
              rapat
              icon={Inbox}
              judul="Tidak ada berkas menunggu putusan"
              keterangan="Berkas masuk ke sini setelah analis meneruskan hasil analisisnya."
            />
          ) : (
            pendingApps.map(app => (
              <BarisAntrean
                key={app.id}
                terpilih={selectedAppId === app.id}
                onClick={() => setSelectedAppId(app.id)}
                utama={app.customerName}
                kedua={`${rupiah(app.requestedPlafon)} · ${app.requestedTenorMonths} bln`}
                kanan={<StatusPill stage={app.currentStage} />}
              />
            ))
          )
        }
      >
        {!activeApp ? (
          <BelumAdaPilihan
            icon={Gavel}
            judul="Pilih berkas untuk memutus"
            keterangan="Klik salah satu nama di antrean sebelah kiri. Ringkasan analisis dan lembar putusan akan terbuka di sini."
            antreanKosong={pendingApps.length === 0}
          />
        ) : (
          <form onSubmit={e => e.preventDefault()} className="space-y-5">
            <Panel
              judul={`Putusan · ${activeApp.customerName}`}
              alat={
                <Button
                  type="button" variant="secondary" size="sm"
                  onClick={() => setViewerModal({ isOpen: true, app: activeApp })}
                >
                  <FileText className="mr-1.5 h-3.5 w-3.5" /> Berkas lengkap
                </Button>
              }
            >
              <p className="-mt-1 mb-5 text-[11px] tabular-nums text-slate-500">
                No. {activeApp.applicationNumber} · AO: {activeApp.accountOfficerName} · Pemutus: {currentUser?.name}
              </p>

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <Ringkas label="Plafon dimohon" nilai={rupiah(activeApp.requestedPlafon)} ada />
                <Ringkas
                  label="Usulan analis"
                  nilai={rupiah(analisis?.proposedPlafon)}
                  ada={Number.isFinite(Number(analisis?.proposedPlafon)) && Number(analisis?.proposedPlafon) > 0}
                />
                <Ringkas
                  label="DSCR"
                  nilai={`${desimal(analisis?.dscrRatio, 2)}x`}
                  ada={Number.isFinite(Number(analisis?.dscrRatio)) && Number(analisis?.dscrRatio) > 0}
                />
                <Ringkas
                  label="Skor survei"
                  nilai={`${skorSurvei}/100`}
                  ada={Number.isFinite(Number(skorSurvei))}
                />
              </div>

              {analisis?.analystSummary && (
                <div className="mt-3 rounded-xl bg-surface-muted px-3.5 py-3">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-muted">Kesimpulan analis</p>
                  <p className="mt-1 text-xs leading-relaxed text-foreground">{analisis.analystSummary}</p>
                </div>
              )}
            </Panel>

            <Panel judul="Keputusan">
              <fieldset>
                <legend className="mb-2 text-[11px] font-bold uppercase tracking-wide text-muted">
                  Bentuk persetujuan
                </legend>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {[
                    { id: 'APPROVED' as const, label: 'Disetujui penuh', ket: 'Tanpa syarat tambahan sebelum akad' },
                    { id: 'CONDITIONAL' as const, label: 'Disetujui bersyarat', ket: 'Ada syarat yang wajib dipenuhi dulu' },
                  ].map(opt => {
                    const aktif = decisionForm.decision === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        aria-pressed={aktif}
                        onClick={() => setDecisionForm(f => ({ ...f, decision: opt.id }))}
                        className={cn(
                          'rounded-xl border px-3.5 py-3 text-left transition-colors',
                          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                          aktif
                            ? 'border-primary bg-primary-light'
                            : 'border-border bg-surface hover:bg-surface-muted',
                        )}
                      >
                        <span className={cn('block text-xs font-bold', aktif ? 'text-primary-dark' : 'text-foreground')}>
                          {opt.label}
                        </span>
                        <span className="mt-0.5 block text-[10px] leading-snug text-slate-500">{opt.ket}</span>
                      </button>
                    );
                  })}
                </div>
                <p className="mt-2 text-[10px] leading-snug text-slate-500">
                  Menolak berkas dilakukan lewat tombol Putuskan di bawah, bersama pilihan mengembalikan ke analis.
                </p>
              </fieldset>

              <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <Label untuk="plafon-setuju">Plafon yang disetujui</Label>
                  <input
                    id="plafon-setuju" type="number" min={0}
                    value={decisionForm.approvedPlafon}
                    onChange={e => setDecisionForm(f => ({ ...f, approvedPlafon: Number(e.target.value) || 0 }))}
                    aria-invalid={lampauiLimit}
                    className={cn(isianAngka, lampauiLimit && 'border-danger')}
                  />
                  {/* Kotak angka tidak bisa menampilkan pemisah ribuan, jadi
                      nilainya dieja ulang di bawahnya agar tidak salah baca. */}
                  <p className="mt-1 text-[10px] tabular-nums text-slate-500">
                    {rupiah(decisionForm.approvedPlafon)}
                  </p>
                  {lampauiLimit && (
                    <p className="mt-1.5 flex items-start gap-1.5 text-[11px] font-bold text-danger">
                      <AlertTriangle className="mt-px h-3.5 w-3.5 shrink-0" />
                      <span>
                        Melampaui kewenangan Anda sebesar {rupiahRingkas(limit)}. Berkas ini perlu dinaikkan ke
                        pemutus dengan limit lebih tinggi.
                      </span>
                    </p>
                  )}
                </div>
                <div>
                  <Label untuk="bunga">Suku bunga</Label>
                  <input
                    id="bunga" type="text" readOnly
                    value={
                      Number.isFinite(Number(activeApp.interestRate)) && Number(activeApp.interestRate) > 0
                        ? `${desimal(activeApp.interestRate, 2)}% per tahun`
                        : 'Mengikuti ketentuan produk'
                    }
                    className={cn(isian, 'cursor-not-allowed bg-surface-muted text-slate-500')}
                  />
                </div>
              </div>

              <div className="mt-4">
                <Label untuk="pertimbangan">Pertimbangan pemutus</Label>
                <textarea
                  id="pertimbangan" rows={3} value={decisionForm.comment}
                  placeholder="Dasar putusan ini: apa yang meyakinkan, apa yang masih jadi perhatian."
                  onChange={e => setDecisionForm(f => ({ ...f, comment: e.target.value }))}
                  className={isian + ' resize-y'}
                />
              </div>

              <div className="mt-4">
                <Label untuk="syarat">
                  Syarat sebelum akad {perluSyarat && <span className="text-danger">· wajib diisi</span>}
                </Label>
                <textarea
                  id="syarat" rows={3} value={decisionForm.conditionNotes}
                  placeholder="Misalnya: menyerahkan sertifikat asli, menandatangani SKMHT di hadapan notaris."
                  onChange={e => setDecisionForm(f => ({ ...f, conditionNotes: e.target.value }))}
                  className={isian + ' resize-y'}
                />
              </div>

              <div className="mt-5 flex flex-col items-stretch gap-2 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-[11px] text-slate-500">
                  {siapPutus
                    ? 'Putusan akan tercatat atas nama Anda beserta batas kewenangannya.'
                    : perluSyarat && !decisionForm.conditionNotes.trim()
                      ? 'Persetujuan bersyarat menuntut syaratnya ditulis.'
                      : 'Isi plafon dan pertimbangan sebelum memutus.'}
                </p>
                <Button type="button" disabled={!siapPutus} onClick={() => setIsActionModalOpen(true)}>
                  <ShieldCheck className="mr-1.5 h-4 w-4" /> Putuskan
                </Button>
              </div>
            </Panel>
          </form>
        )}
      </StageWorkbench>

      <WorkflowActionModal
        isOpen={isActionModalOpen}
        onClose={() => setIsActionModalOpen(false)}
        title="Keputusan Komite Kredit"
        subtitle="Sahkan Keputusan, Kembalikan ke Analis, atau Tolak Secara Final."
        applicationId={activeApp?.applicationNumber || ''}
        customerName={activeApp?.customerName || ''}
        currentStage={activeApp?.currentStage || 'CREDIT_COMMITTEE'}
        availableActions={['PROCEED', 'RETURN', 'REJECT']}
        proceedStage="APPROVED"
        proceedLabel="Setujui (Approved)"
        returnOptions={[{ stage: 'ANALYSIS', label: 'Analis (Revisi)' }]}
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
