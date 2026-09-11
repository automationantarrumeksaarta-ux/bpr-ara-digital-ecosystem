import React, { useEffect, useState } from 'react';
import {
  FileSearch, FileSignature, FileText, Inbox, Printer, QrCode, ShieldCheck,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { CreditApplication, CreditAppStage } from '../../types';
import { WorkflowActionModal } from '../common/WorkflowActionModal';
import { DocumentViewerModal } from '../common/DocumentViewerModal';
import { StageShell } from '../credit/StageShell';
import {
  BarisAntrean, BelumAdaPilihan, Kosong, Panel, StageWorkbench, StatusPill,
} from '../credit/StageParts';
import { desimal, rupiah, tanggalPendek } from '../credit/pipeline';
import { Button } from '../ui/Button';
import { cn } from '../../lib/utils';

/**
 * Tahap 6 — Legal & Akad.
 *
 * Draf perjanjian kredit di halaman ini bisa dicetak lewat window.print(),
 * jadi isinya diperlakukan sebagai dokumen sungguhan, bukan hiasan. Yang
 * diperbaiki:
 *
 * 1. **Nama bank sendiri salah ketik** — "PT BPR ANTAR RUMEBSA ARTA" muncul dua
 *    kali di badan akad, padahal kalimat tepat di bawahnya mengejanya dengan
 *    benar: RUMEKSA.
 * 2. Nomor akad, tanggal, nomor sertifikat agunan, dan kode verifikasi semuanya
 *    nilai tetap di dalam kode: "PK/ARA/SLM/VIII/2026/041", "Jumat, 21 Agustus
 *    2026", "SHM No. 4412/Matesih", "ARA-DOC-VERIFIED-2026-X892". Berkas siapa
 *    pun yang dibuka akan mencetak agunan milik orang lain. Sekarang semuanya
 *    diturunkan dari berkas yang sedang dibuka, dan bagian yang datanya belum
 *    ada ditandai perlu dilengkapi, bukan ditambal angka.
 * 3. Plafon di akad memakai `requestedPlafon` — yang dimohon nasabah, bukan yang
 *    disetujui komite. Sekarang memakai putusan komite bila sudah ada.
 * 4. Bunga tertulis mati "0% p.a.".
 *
 * Alur kerja tidak berubah: penyaring antrean, tahap tujuan, dan argumen
 * `updateCreditAppStage` sama persis.
 */

type Tab = 'VERIFICATION' | 'AKAD';

/** Bagian akad yang datanya belum ada. Ditandai, bukan ditambal. */
const Rumpang: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="rounded bg-warning/15 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-warning">
    {children}
  </span>
);

export const LegalDocumentsView: React.FC = () => {
  const { creditApplications, updateCreditAppStage } = useApp();
  const [activeTab, setActiveTab] = useState<Tab>('VERIFICATION');

  const verificationApps = creditApplications.filter((a) => a.currentStage === 'VERIFICATION');
  const akadApps = creditApplications.filter((a) => a.currentStage === 'APPROVED');

  const [selectedVerifAppId, setSelectedVerifAppId] = useState<string>(verificationApps.length > 0 ? verificationApps[0].id : '');
  const [selectedAkadAppId, setSelectedAkadAppId] = useState<string>(akadApps.length > 0 ? akadApps[0].id : '');

  const [actionModal, setActionModal] = useState<{
    isOpen: boolean; app: CreditApplication | null; type: 'VERIF' | 'AKAD';
  }>({ isOpen: false, app: null, type: 'VERIF' });
  const [viewerModal, setViewerModal] = useState<{ isOpen: boolean; app: CreditApplication | null }>({ isOpen: false, app: null });

  const activeVerifApp = creditApplications.find((a) => a.id === selectedVerifAppId);
  const activeAkadApp = creditApplications.find((a) => a.id === selectedAkadAppId);

  useEffect(() => {
    if (verificationApps.length && !verificationApps.some(a => a.id === selectedVerifAppId)) {
      setSelectedVerifAppId(verificationApps[0].id);
    }
    if (akadApps.length && !akadApps.some(a => a.id === selectedAkadAppId)) {
      setSelectedAkadAppId(akadApps[0].id);
    }
  }, [verificationApps, akadApps, selectedVerifAppId, selectedAkadAppId]);

  const openModal = (app: CreditApplication, type: 'VERIF' | 'AKAD') => setActionModal({ isOpen: true, app, type });
  const closeModal = () => setActionModal({ isOpen: false, app: null, type: 'VERIF' });

  const handleWorkflowSubmit = (action: string, nextStage: CreditAppStage, notes: string, fileUrl?: string, fileName?: string) => {
    if (!actionModal.app) return;
    updateCreditAppStage(actionModal.app.id, nextStage, notes, fileUrl, fileName);
    closeModal();
  };

  const daftar = activeTab === 'VERIFICATION' ? verificationApps : akadApps;
  const terpilihId = activeTab === 'VERIFICATION' ? selectedVerifAppId : selectedAkadAppId;
  const pilih = (id: string) =>
    activeTab === 'VERIFICATION' ? setSelectedVerifAppId(id) : setSelectedAkadAppId(id);

  /* ------------------------------------------------------------ draf akad */

  const putusan = activeAkadApp?.approvals?.[activeAkadApp.approvals.length - 1];
  const plafonAkad = putusan?.approvedPlafon ?? activeAkadApp?.requestedPlafon;
  const tenorAkad = putusan?.approvedTenor || activeAkadApp?.requestedTenorMonths;
  const bungaAkad = putusan?.approvedRate ?? activeAkadApp?.interestRate;
  const agunan = activeAkadApp?.collaterals?.[0];

  return (
    <StageShell
      stage="Legal & Documents"
      judul="Legal & Akad Kredit"
      keterangan="Memeriksa kelengkapan berkas awal, lalu menyiapkan perjanjian kredit dan pengikatan agunan sebelum dana dicairkan."
    >
      {/* Dua pekerjaan berbeda di satu halaman, jadi dipisah tab. */}
      <div role="tablist" aria-label="Jenis pekerjaan legal" className="flex w-fit gap-1 rounded-xl border border-border bg-surface-muted p-1">
        {([
          { id: 'VERIFICATION' as Tab, label: 'Verifikasi berkas', n: verificationApps.length },
          { id: 'AKAD' as Tab, label: 'Akad kredit', n: akadApps.length },
        ]).map(t => {
          const aktif = activeTab === t.id;
          return (
            <button
              key={t.id}
              role="tab"
              aria-selected={aktif}
              onClick={() => setActiveTab(t.id)}
              className={cn(
                'flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-bold transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                aktif ? 'bg-surface text-primary shadow-sm' : 'text-slate-500 hover:text-foreground',
              )}
            >
              {t.label}
              <span
                className={cn(
                  'rounded-full px-1.5 py-0.5 text-[10px] tabular-nums',
                  aktif ? 'bg-primary-light text-primary-dark' : 'bg-surface text-slate-500',
                )}
              >
                {t.n}
              </span>
            </button>
          );
        })}
      </div>

      <StageWorkbench
        judulAntrean={activeTab === 'VERIFICATION' ? 'Menunggu verifikasi' : 'Menunggu akad'}
        jumlah={daftar.length}
        antrean={
          daftar.length === 0 ? (
            <Kosong
              rapat
              icon={Inbox}
              judul="Antrean kosong"
              keterangan={
                activeTab === 'VERIFICATION'
                  ? 'Berkas masuk ke sini segera setelah AO mengirim pengajuan.'
                  : 'Berkas masuk ke sini setelah komite menyetujui kredit.'
              }
            />
          ) : (
            daftar.map(app => (
              <BarisAntrean
                key={app.id}
                terpilih={terpilihId === app.id}
                onClick={() => pilih(app.id)}
                utama={app.customerName}
                kedua={`${rupiah(app.requestedPlafon)} · ${app.requestedTenorMonths} bln`}
                kanan={<StatusPill stage={app.currentStage} />}
              />
            ))
          )
        }
      >
        {activeTab === 'VERIFICATION' ? (
          !activeVerifApp ? (
            <BelumAdaPilihan
              icon={FileSearch}
              judul="Pilih berkas untuk diperiksa"
              keterangan="Klik salah satu nama di antrean sebelah kiri untuk melihat KTP, KK, dan dokumen pendukungnya."
              antreanKosong={verificationApps.length === 0}
            />
          ) : (
            <Panel
              judul={`Berkas identitas · ${activeVerifApp.customerName}`}
              alat={
                <Button
                  variant="secondary" size="sm"
                  onClick={() => setViewerModal({ isOpen: true, app: activeVerifApp })}
                >
                  <FileSearch className="mr-1.5 h-3.5 w-3.5" /> Semua dokumen
                </Button>
              }
            >
              {(() => {
                const identitas = (activeVerifApp.documents ?? []).filter(d => d.type === 'ktp' || d.type === 'kk');
                if (identitas.length === 0) {
                  return (
                    <Kosong
                      icon={FileSearch}
                      judul="Belum ada KTP atau KK terunggah"
                      keterangan="Berkas identitas belum masuk untuk pengajuan ini. Kembalikan ke Account Officer agar dilengkapi, atau periksa dokumen lain yang sudah ada."
                      aksi={
                        <Button variant="secondary" size="sm" onClick={() => setViewerModal({ isOpen: true, app: activeVerifApp })}>
                          Lihat dokumen lain
                        </Button>
                      }
                    />
                  );
                }
                return (
                  <div className="flex gap-3 overflow-x-auto pb-1">
                    {identitas.map(doc => (
                      <button
                        key={doc.id}
                        type="button"
                        onClick={() => setViewerModal({ isOpen: true, app: activeVerifApp })}
                        className="w-48 shrink-0 overflow-hidden rounded-xl border border-border bg-surface text-left transition-colors hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <span className="flex h-32 items-center justify-center overflow-hidden bg-surface-muted">
                          {doc.url?.startsWith('data:image')
                            ? <img src={doc.url} alt={doc.name} className="h-full w-full object-cover" />
                            : <FileText className="h-8 w-8 text-muted" />}
                        </span>
                        <span className="block truncate px-3 py-2 text-[11px] font-bold uppercase tracking-wide text-foreground">
                          {doc.name}
                        </span>
                      </button>
                    ))}
                  </div>
                );
              })()}

              <div className="mt-5 flex justify-end border-t border-border pt-4">
                <Button onClick={() => openModal(activeVerifApp, 'VERIF')}>
                  Tindak lanjuti verifikasi
                </Button>
              </div>
            </Panel>
          )
        ) : !activeAkadApp ? (
          <BelumAdaPilihan
            icon={FileSignature}
            judul="Pilih berkas untuk menyiapkan akad"
            keterangan="Klik salah satu nama di antrean sebelah kiri. Draf perjanjian kredit akan tersusun dari putusan komite."
            antreanKosong={akadApps.length === 0}
          />
        ) : (
          <Panel
            judul={`Draf perjanjian kredit · ${activeAkadApp.customerName}`}
            alat={
              <>
                <Button variant="secondary" size="sm" onClick={() => window.print()}>
                  <Printer className="mr-1.5 h-3.5 w-3.5" /> Cetak
                </Button>
                <Button size="sm" onClick={() => openModal(activeAkadApp, 'AKAD')}>
                  Proses tanda tangan
                </Button>
              </>
            }
          >
            <p className="-mt-1 mb-4 text-[11px] tabular-nums text-slate-500">
              No. registrasi PK-ARA/{activeAkadApp.applicationNumber}
            </p>

            <article className="rounded-xl border border-border bg-surface-muted p-6 text-foreground">
              <header className="border-b border-border pb-3 text-center">
                <h3 className="text-sm font-bold uppercase tracking-wide text-foreground">
                  Surat Perjanjian Kredit
                </h3>
                <p className="mt-0.5 text-[11px] tabular-nums text-slate-500">
                  PK-ARA/{activeAkadApp.applicationNumber} · PT BPR Antar Rumeksa Arta
                </p>
              </header>

              <p className="mt-4 text-[11px] leading-relaxed text-foreground">
                Pada hari ini,{' '}
                <strong className="tabular-nums">
                  {new Date().toLocaleDateString('id-ID', {
                    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
                  })}
                </strong>
                , telah dibuat dan disepakati perjanjian fasilitas pinjaman antara:
              </p>

              <ol className="mt-3 space-y-1 border-l-2 border-border pl-3 text-[11px] text-foreground">
                <li>
                  1. <strong>PT BPR Antar Rumeksa Arta</strong>, selanjutnya disebut <strong>Kreditur</strong>.
                </li>
                <li>
                  2. <strong>{activeAkadApp.customerName}</strong>
                  {activeAkadApp.cif && <span className="tabular-nums"> · CIF {activeAkadApp.cif}</span>}
                  , selanjutnya disebut <strong>Debitur</strong>.
                </li>
              </ol>

              <section className="mt-4 rounded-lg bg-surface p-3.5">
                <h4 className="text-xs font-bold text-foreground">Pasal 1 — Ketentuan pokok</h4>
                <dl className="mt-2 grid grid-cols-1 gap-x-4 gap-y-1.5 text-[11px] sm:grid-cols-2">
                  <div className="flex justify-between gap-2 border-b border-border pb-1">
                    <dt className="text-slate-500">Plafon</dt>
                    <dd className="font-bold tabular-nums text-foreground">{rupiah(plafonAkad)}</dd>
                  </div>
                  <div className="flex justify-between gap-2 border-b border-border pb-1">
                    <dt className="text-slate-500">Jangka waktu</dt>
                    <dd className="font-bold tabular-nums text-foreground">{tenorAkad ? `${tenorAkad} bulan` : '—'}</dd>
                  </div>
                  <div className="flex justify-between gap-2 border-b border-border pb-1">
                    <dt className="text-slate-500">Suku bunga</dt>
                    <dd className="font-bold tabular-nums text-foreground">
                      {Number.isFinite(Number(bungaAkad)) && Number(bungaAkad) > 0
                        ? `${desimal(bungaAkad, 2)}% per tahun`
                        : <Rumpang>Belum ditetapkan</Rumpang>}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-2 border-b border-border pb-1">
                    <dt className="text-slate-500">Sifat kredit</dt>
                    <dd className="font-bold text-foreground">Non-revolving</dd>
                  </div>
                </dl>
                {putusan && (
                  <p className="mt-2.5 text-[10px] text-slate-500">
                    Sesuai putusan komite {tanggalPendek((putusan as any).decidedAt)} oleh {putusan.approverName}.
                  </p>
                )}
              </section>

              <section className="mt-3 rounded-lg bg-surface p-3.5">
                <h4 className="text-xs font-bold text-foreground">Pasal 2 — Agunan dan pengikatan</h4>
                {agunan ? (
                  <p className="mt-1.5 text-[11px] leading-relaxed text-foreground">
                    Fasilitas ini dijamin dengan {agunan.type} No.{' '}
                    <strong className="tabular-nums">{agunan.documentNumber}</strong> atas nama{' '}
                    <strong>{agunan.ownerName}</strong>
                    {agunan.addressOrPlateNumber && <> yang terletak di {agunan.addressOrPlateNumber}</>}.
                  </p>
                ) : (
                  <p className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px] text-foreground">
                    <Rumpang>Agunan belum tercatat</Rumpang>
                    <span className="text-slate-500">
                      Lengkapi data agunan di tahap Taksasi Agunan sebelum akad ditandatangani.
                    </span>
                  </p>
                )}
              </section>

              {putusan?.conditionNotes && (
                <section className="mt-3 rounded-lg bg-surface p-3.5">
                  <h4 className="text-xs font-bold text-foreground">Pasal 3 — Syarat sebelum penarikan</h4>
                  <p className="mt-1.5 text-[11px] leading-relaxed text-foreground">{putusan.conditionNotes}</p>
                </section>
              )}

              <footer className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3 text-[10px] text-slate-500">
                <span className="flex items-center gap-2">
                  <QrCode className="h-7 w-7 text-primary" strokeWidth={1.5} />
                  <span>
                    <span className="block font-bold text-foreground">Verifikasi dokumen elektronik</span>
                    <span className="tabular-nums">PK-ARA/{activeAkadApp.applicationNumber}</span>
                  </span>
                </span>
                <span className="flex items-center gap-1.5 font-bold text-slate-500">
                  <ShieldCheck className="h-4 w-4" /> Draf, belum ditandatangani
                </span>
              </footer>
            </article>
          </Panel>
        )}
      </StageWorkbench>

      <WorkflowActionModal
        isOpen={actionModal.isOpen}
        onClose={closeModal}
        title={actionModal.type === 'VERIF' ? "Verifikasi Berkas Awal" : "Persetujuan Akad & Pencairan"}
        subtitle={actionModal.type === 'VERIF' ? "Putuskan hasil verifikasi berkas AO" : "Selesaikan tanda tangan akad"}
        applicationId={actionModal.app?.applicationNumber || ''}
        customerName={actionModal.app?.customerName || ''}
        currentStage={actionModal.app?.currentStage || 'VERIFICATION'}
        availableActions={actionModal.type === 'VERIF' ? ['PROCEED', 'RETURN', 'REJECT'] : ['PROCEED', 'RETURN']}
        proceedStage={actionModal.type === 'VERIF' ? 'SLIK' : 'DISBURSED'}
        proceedLabel={actionModal.type === 'VERIF' ? 'Teruskan ke SLIK' : 'Selesai Akad (Cairkan)'}
        returnOptions={
          actionModal.type === 'VERIF'
            ? [{ stage: 'SUBMITTED', label: 'AO (Perlu Dilengkapi)' }]
            : [{ stage: 'CREDIT_COMMITTEE', label: 'Komite (Tinjau Ulang)' }]
        }
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
