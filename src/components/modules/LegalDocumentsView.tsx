import React, { useState } from 'react';
import {
  FileBadge,
  FileText,
  Printer,
  CheckCircle2,
  AlertTriangle,
  User,
  Building,
  ExternalLink,
  ShieldCheck,
  QrCode,
  CheckCircle,
  FileSearch,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { CreditApplication, CreditAppStage } from '../../types';
import { WorkflowActionModal } from '../common/WorkflowActionModal';
import { DocumentViewerModal } from '../common/DocumentViewerModal';
import { CreditPipelineHeader } from '../ui/CreditPipelineHeader';

export const LegalDocumentsView: React.FC = () => {
  const { creditApplications, updateCreditAppStage, setActiveModule } = useApp();
  const [activeTab, setActiveTab] = useState<'VERIFICATION' | 'AKAD'>('VERIFICATION');
  
  const verificationApps = creditApplications.filter((a) => a.currentStage === 'VERIFICATION');
  const akadApps = creditApplications.filter(
    (a) => a.currentStage === 'APPROVED' || a.currentStage === 'LEGAL_SIGNING'
  );

  const [selectedVerifAppId, setSelectedVerifAppId] = useState<string>(verificationApps.length > 0 ? verificationApps[0].id : '');
  const [selectedAkadAppId, setSelectedAkadAppId] = useState<string>(akadApps.length > 0 ? akadApps[0].id : '');

  const [actionModal, setActionModal] = useState<{
    isOpen: boolean;
    app: CreditApplication | null;
    type: 'VERIF' | 'AKAD';
  }>({ isOpen: false, app: null, type: 'VERIF' });

  const [viewerModal, setViewerModal] = useState<{ isOpen: boolean; app: CreditApplication | null }>({ isOpen: false, app: null });

  const activeVerifApp = creditApplications.find((a) => a.id === selectedVerifAppId);
  const activeAkadApp = creditApplications.find((a) => a.id === selectedAkadAppId);

  const openModal = (app: CreditApplication, type: 'VERIF' | 'AKAD') => setActionModal({ isOpen: true, app, type });
  const closeModal = () => setActionModal({ isOpen: false, app: null, type: 'VERIF' });

  const handleWorkflowSubmit = (action: string, nextStage: CreditAppStage, notes: string, fileUrl?: string, fileName?: string) => {
    if (!actionModal.app) return;
    updateCreditAppStage(actionModal.app.id, nextStage, notes, fileUrl, fileName);
    closeModal();
  };



  return (
    <div className="space-y-5 animate-in fade-in">
      <CreditPipelineHeader currentStage="Legal & Documents" />
      {/* Header */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">
              LEGALITY & NOTARIAL DOCUMENTATION
            </span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
              Standar Akad Kredit OJK & Kemenkumham
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 mt-1">Penyusunan Perjanjian Kredit (Akad) & APHT</h1>
          <p className="text-xs text-slate-500 mt-1">
            Penyiapan draf Perjanjian Kredit (PK), Akta Pembebanan Hak Tanggungan (APHT), Akta Fidusia, dan koordinasi Notaris Rekanan.
          </p>
        </div>
      </div>

      <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('VERIFICATION')}
          className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
            activeTab === 'VERIFICATION'
              ? 'bg-white dark:bg-slate-700 text-blue-700 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          Verifikasi Berkas Awal ({verificationApps.length})
        </button>
        <button
          onClick={() => setActiveTab('AKAD')}
          className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
            activeTab === 'AKAD'
              ? 'bg-white dark:bg-slate-700 text-blue-700 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          Pembuatan Akad & Pencairan ({akadApps.length})
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left Side: Dossiers */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Daftar Antrean
          </h3>
          <div className="space-y-2">
            {(activeTab === 'VERIFICATION' ? verificationApps : akadApps).map((app) => (
              <div
                key={app.id}
                onClick={() => activeTab === 'VERIFICATION' ? setSelectedVerifAppId(app.id) : setSelectedAkadAppId(app.id)}
                className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all ${
                  (activeTab === 'VERIFICATION' ? selectedVerifAppId : selectedAkadAppId) === app.id
                    ? 'bg-blue-50/70 border-blue-300 text-slate-900 shadow-xs ring-1 ring-blue-400/30'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-xs'
                }`}
              >
                <div className="flex items-start justify-between">
                  <span className="font-bold text-sm text-slate-900">{app.customerName}</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                    {app.currentStage}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Plafon: Rp {app.requestedPlafon.toLocaleString('id-ID')} • Tenor: {app.requestedTenorMonths} Bln
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-[10px] text-blue-700 font-mono font-semibold">{app.applicationNumber}</span>
                  <button onClick={(e) => { e.stopPropagation(); openModal(app, activeTab); }} className="px-2 py-1 bg-slate-800 text-white rounded text-[10px] font-bold">Proses</button>
                </div>
              </div>
            ))}
            {(activeTab === 'VERIFICATION' ? verificationApps : akadApps).length === 0 && (
              <p className="text-xs text-slate-500 p-4 border rounded-xl text-center">Tidak ada antrean.</p>
            )}
          </div>
        </div>

        {/* Right Side: Contract Preview Workstation */}
        <div className="lg:col-span-2 space-y-4">
          {activeTab === 'VERIFICATION' ? (
            activeVerifApp ? (
              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-5 text-xs flex flex-col min-h-[300px]">
                <div className="flex items-center justify-between border-b pb-3">
                  <h3 className="text-lg font-bold text-slate-800">Preview Berkas KTP & KK</h3>
                  <button
                    onClick={() => setViewerModal({ isOpen: true, app: activeVerifApp })}
                    className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold flex items-center gap-2 transition-colors"
                  >
                    <FileSearch className="w-4 h-4" /> Buka Master Dossier
                  </button>
                </div>

                <div className="flex gap-4 overflow-x-auto pb-4">
                  {(activeVerifApp.documents && activeVerifApp.documents.length > 0) ? (
                    activeVerifApp.documents.filter(d => d.type === 'ktp' || d.type === 'kk').map(doc => (
                      <div key={doc.id} className="min-w-[200px] border rounded-xl overflow-hidden shadow-sm bg-slate-50 cursor-pointer hover:border-blue-400 transition-colors" onClick={() => setViewerModal({ isOpen: true, app: activeVerifApp })}>
                        <div className="h-32 bg-slate-200 flex items-center justify-center overflow-hidden">
                          {doc.url.startsWith('data:image') ? <img src={doc.url} className="w-full h-full object-cover" /> : <FileText className="w-8 h-8 text-slate-400" />}
                        </div>
                        <div className="p-2 text-center text-[10px] font-bold text-slate-700 uppercase">{doc.name}</div>
                      </div>
                    ))
                  ) : (
                    <div className="w-full py-8 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
                      <FileSearch className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>Preview cepat tidak tersedia untuk data ini.</p>
                      <button onClick={() => setViewerModal({ isOpen: true, app: activeVerifApp })} className="mt-2 text-blue-600 font-bold hover:underline">Buka Dossier Manual</button>
                    </div>
                  )}
                </div>

                <div className="mt-auto flex justify-end pt-4 border-t border-slate-100">
                  <button
                    onClick={() => openModal(activeVerifApp, 'VERIF')}
                    className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all shadow-md"
                  >
                    Tindak Lanjut & Unggah SLIK
                  </button>
                </div>
              </div>
            ) : (
               <div className="p-12 text-center text-slate-500 bg-white border border-slate-200 rounded-2xl shadow-xs">
                Pilih berkas untuk diverifikasi.
              </div>
            )
          ) : (
            activeAkadApp ? (
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-5 text-xs">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      Draf Perjanjian Kredit: {activeAkadApp.customerName}
                    </h3>
                    <p className="text-slate-500 text-[11px]">
                      No. Registrasi: PK-ARA/{activeAkadApp.applicationNumber}/2026
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => window.print()}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
                    >
                      <Printer className="w-3.5 h-3.5" /> Cetak Dokumen
                    </button>
                    <button
                      onClick={() => openModal(activeAkadApp, 'AKAD')}
                      className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
                    >
                      Proses Penandatanganan &rarr;
                    </button>
                  </div>
                </div>

                {/* Document Paper Preview Simulation */}
                <div className="p-6 rounded-xl bg-slate-50 border border-slate-200 space-y-4 text-slate-800 font-serif leading-relaxed">
                  <div className="text-center pb-3 border-b border-slate-200 font-sans">
                    <h4 className="font-bold text-slate-900 text-sm uppercase tracking-wider">
                      SURAT PERJANJIAN KREDIT (PK)
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      NOMOR: PK/ARA/SLM/VIII/2026/041 • PT BPR ANTAR RUMEBSA ARTA
                    </p>
                  </div>

                  <p className="text-[11px] text-slate-700">
                    Pada hari ini, <strong>Jumat, 21 Agustus 2026</strong>, bertempat di Kantor PT BPR Antar Rumeksa Arta Cabang Matesih, telah dibuat dan disepakati perjanjian fasilitas pinjaman antara:
                  </p>

                  <div className="space-y-1 text-[11px] pl-3 border-l-2 border-slate-300 text-slate-700">
                    <div>1. <strong>PT BPR ANTAR RUMEBSA ARTA</strong>, berkedudukan di Yogyakarta (selanjutnya disebut <strong>KREDITUR</strong>).</div>
                    <div>2. <strong>{activeAkadApp.customerName}</strong>, No. CIF: {activeAkadApp.cif} (selanjutnya disebut <strong>DEBITUR</strong>).</div>
                  </div>

                  <div className="p-3 rounded-lg bg-white border border-slate-200 font-sans text-xs space-y-1.5 shadow-xs">
                    <div className="font-bold text-slate-900">Pasal 1: Ketentuan Pokok Fasilitas Pinjaman</div>
                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600">
                      <div>• Plafon Pinjaman: <strong className="text-emerald-700 font-mono">Rp {activeAkadApp.requestedPlafon.toLocaleString('id-ID')}</strong></div>
                      <div>• Jangka Waktu: <strong>{activeAkadApp.requestedTenorMonths} Bulan</strong></div>
                      <div>• Suku Bunga: <strong>0% p.a. Efektif Anuitas</strong></div>
                      <div>• Sifat Kredit: <strong>Non-Revolving (Term Loan)</strong></div>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-white border border-slate-200 font-sans text-xs space-y-1.5 shadow-xs">
                    <div className="font-bold text-slate-900">Pasal 2: Agunan & Pengikatan Hukum</div>
                    <p className="text-[11px] text-slate-600">
                      Fasilitas ini dijamin dengan Sertifikat Hak Milik (SHM) No. 4412/Matesih atas nama Debitur dengan pengikatan Akta Pembebanan Hak Tanggungan (APHT) Peringkat Pertama.
                    </p>
                  </div>

                  {/* QR Code Validation */}
                  <div className="pt-3 border-t border-slate-200 flex items-center justify-between font-sans text-[10px] text-slate-500">
                    <div className="flex items-center gap-2">
                      <QrCode className="w-8 h-8 text-blue-600" />
                      <div>
                        <span className="font-bold text-slate-800">Verifikasi Dokumen Elektronik OJK</span>
                        <div>KODE: ARA-DOC-VERIFIED-2026-X892</div>
                      </div>
                    </div>
                    <span className="text-emerald-700 font-semibold flex items-center gap-1">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" /> Siap Tanda Tangan & Akad
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center text-slate-500 bg-white border border-slate-200 rounded-2xl shadow-xs">
                Pilih berkas kredit yang telah disetujui di bilah kiri untuk melihat draf akad legal.
              </div>
            )
          )}
        </div>
      </div>
      
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
    </div>
  );
};
