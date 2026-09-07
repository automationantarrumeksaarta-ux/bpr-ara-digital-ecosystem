import React, { useState } from 'react';
import {
  CheckSquare,
  ShieldCheck,
  UserCheck,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Lock,
  Fingerprint,
  FileText,
  DollarSign,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { WorkflowActionModal } from '../common/WorkflowActionModal';
import { DocumentViewerModal } from '../common/DocumentViewerModal';
import { CreditAppStage } from '../../types';
import { CreditPipelineHeader } from '../ui/CreditPipelineHeader';

export const CreditApprovalView: React.FC = () => {
  const {
    creditApplications,
    decideCreditApproval,
    currentUser,
    openCustomer360,
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

  const activeApp = creditApplications.find((a) => a.id === selectedAppId);

  // Approval Form
  const [decisionForm, setDecisionForm] = useState({
    decision: 'APPROVED' as 'APPROVED' | 'REJECTED' | 'CONDITIONAL',
    approvedPlafon: activeApp?.requestedPlafon || 150000000,
    comment: 'Plafond disetujui penuh sesuai rekomendasi komite kredit dengan mempertimbangkan integritas debitur dan agunan SHM yang kuat.',
    conditionNotes: 'Wajib menyerahkan bukti asli sertifikat SHM dan tanda tangan Surat Kuasa Membebankan Hak Tanggungan (SKMHT) di hadapan Notaris Rekanan BPR ARA.',
  });

  const [isActionModalOpen, setIsActionModalOpen] = useState(false);

  const handleOpenActionModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppId) return;
    setIsActionModalOpen(true);
  };

  const handleWorkflowSubmit = (action: string, nextStage: CreditAppStage, notes: string, fileUrl?: string, fileName?: string) => {
    if (!selectedAppId) return;

    if (action === 'PROCEED') {
      // Setujui
      decideCreditApproval(
        selectedAppId,
        'APPROVED',
        decisionForm.approvedPlafon,
        notes,
        decisionForm.conditionNotes
      );
      updateCreditAppStage(selectedAppId, 'APPROVED', notes, fileUrl, fileName);
    } else if (action === 'REJECT') {
      // Tolak
      decideCreditApproval(
        selectedAppId,
        'REJECTED',
        decisionForm.approvedPlafon,
        notes,
        decisionForm.conditionNotes
      );
      updateCreditAppStage(selectedAppId, 'REJECTED', notes, fileUrl, fileName);
    } else {
      // Return
      updateCreditAppStage(selectedAppId, nextStage, notes, fileUrl, fileName);
    }

    setIsActionModalOpen(false);
    setActiveModule('LEGAL_DOCUMENTS');
  };

  return (
    <div className="space-y-5 animate-in fade-in">
      <CreditPipelineHeader currentStage="Committee Approval" />
      {/* Header */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">
              CREDIT COMMITTEE APPROVAL ENGINE
            </span>
            <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-mono border border-blue-200 font-semibold">
              Kewenangan: Rp {(currentUser.approvalLimit / 1000000).toLocaleString('id-ID')} Juta
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 mt-1">Ruang Sidang & Pemutusan Komite Kredit</h1>
          <p className="text-xs text-slate-500 mt-1">
            Penetapan keputusan pembiayaan, validasi limit kewenangan pemutus, dan penandatanganan digital sah OJK.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left Side: Pending Apps */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Berkas Masuk Komite ({pendingApps.length})
          </h3>
          <div className="space-y-2">
            {pendingApps.map((app) => (
              <div
                key={app.id}
                onClick={() => {
                  setSelectedAppId(app.id);
                  setDecisionForm((prev) => ({
                    ...prev,
                    approvedPlafon: app.requestedPlafon,
                  }));
                }}
                className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all ${
                  selectedAppId === app.id
                    ? 'bg-amber-50/70 border-amber-300 text-slate-900 shadow-xs ring-1 ring-amber-400/30'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-xs'
                }`}
              >
                <div className="flex items-start justify-between">
                  <span className="font-bold text-sm text-slate-900">{app.customerName}</span>
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold border ${
                      app.currentStage === 'APPROVED'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : app.currentStage === 'REJECTED'
                        ? 'bg-red-50 text-red-700 border-red-200'
                        : 'bg-amber-50 text-amber-800 border-amber-200'
                    }`}
                  >
                    {app.currentStage}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Permohonan: Rp {app.requestedPlafon.toLocaleString('id-ID')} • Tenor: {app.requestedTenorMonths} Bln
                </div>
                <div className="mt-2 text-[10px] text-amber-800 font-mono font-semibold">{app.applicationNumber}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side: Decision Terminal */}
        <div className="lg:col-span-2 space-y-4">
          {activeApp ? (
            <form onSubmit={(e) => e.preventDefault()} className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-5 text-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Pemutusan Kredit: {activeApp.customerName}
                  </h3>
                  <p className="text-slate-500 text-[11px]">
                    No. LOS: {activeApp.applicationNumber} • AO: {activeApp.accountOfficerName}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-slate-500 block">Pemutus Aktif</span>
                  <span className="text-xs font-bold text-amber-800">
                    {currentUser.roleTitle} ({currentUser.name})
                  </span>
                </div>
              </div>

              {/* Dossier Summary Badge */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 text-[10px]">Plafon Dimohon</span>
                  <p className="font-bold text-slate-900 font-mono text-xs">
                    Rp {activeApp.requestedPlafon.toLocaleString('id-ID')}
                  </p>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 text-[10px]">Rekomendasi Analis</span>
                  <p className="font-bold text-emerald-700 text-xs">DISETUJUI</p>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 text-[10px]">Skor Survey OTS</span>
                  <p className="font-bold text-blue-700 font-mono text-xs">
                    {activeApp.survey?.surveyScore || 88}/100
                  </p>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 text-[10px]">Rasio DSCR Arus Kas</span>
                  <p className="font-bold text-emerald-700 font-mono text-xs">2.4x (Sangat Aman)</p>
                </div>
              </div>

              {/* Decision Options */}
              <div className="space-y-2">
                <label className="text-slate-700 font-medium">Keputusan Pemutus Kredit</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'APPROVED', label: 'Disetujui Penuh', color: 'border-emerald-300 bg-emerald-50 text-emerald-800 ring-1 ring-emerald-400/30' },
                    { id: 'CONDITIONAL', label: 'Disetujui Bersyarat', color: 'border-amber-300 bg-amber-50 text-amber-800 ring-1 ring-amber-400/30' },
                    { id: 'REJECTED', label: 'Ditolak', color: 'border-red-300 bg-red-50 text-red-800 ring-1 ring-red-400/30' },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setDecisionForm({ ...decisionForm, decision: opt.id as any })}
                      className={`p-3 rounded-xl border font-bold text-xs transition-all cursor-pointer ${
                        decisionForm.decision === opt.id ? opt.color : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 shadow-xs'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Approved Plafon */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-medium">Plafon yang Disetujui (Rp)</label>
                  <input
                    type="number"
                    value={decisionForm.approvedPlafon}
                    onChange={(e) => setDecisionForm({ ...decisionForm, approvedPlafon: Number(e.target.value) })}
                    className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-emerald-700 font-bold font-mono text-base focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-medium">Suku Bunga Disetujui (% p.a.)</label>
                  <input
                    type="text"
                    disabled
                    value="0% p.a. (Anuitas Efektif)"
                    className="w-full mt-1 p-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-600 font-mono"
                  />
                </div>
              </div>

              {/* Notes & Conditions */}
              <div>
                <label className="text-slate-700 font-medium">Pertimbangan & Catatan Pemutus</label>
                <textarea
                  rows={2}
                  required
                  value={decisionForm.comment}
                  onChange={(e) => setDecisionForm({ ...decisionForm, comment: e.target.value })}
                  className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-slate-700 font-medium">Syarat Penarikan / Syarat Akad (Conditions Precedent)</label>
                <textarea
                  rows={2}
                  value={decisionForm.conditionNotes}
                  onChange={(e) => setDecisionForm({ ...decisionForm, conditionNotes: e.target.value })}
                  className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Digital Signature Confirmation Badge */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Fingerprint className="w-5 h-5 text-emerald-600" />
                  <div>
                    <div className="font-semibold text-slate-900">Tanda Tangan Digital Tersertifikasi (Digital Signature)</div>
                    <div className="text-[10px] text-slate-500">Hash SHA-256 Otentik BPR ARA Secure Enclave</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setViewerModal({ isOpen: true, app: activeApp })}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold flex items-center gap-1.5 transition-colors shadow-xs"
                  >
                    <FileText className="w-4 h-4 text-blue-600" /> Buka Master Dossier
                  </button>
                  <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 font-mono text-xs font-bold border border-emerald-200">
                    Menunggu Keputusan Komite
                  </span>
                </div>
              </div>

              {/* Submit */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={handleOpenActionModal}
                  className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold flex items-center gap-2 shadow-xs cursor-pointer text-xs transition-colors"
                >
                  <ShieldCheck className="w-4 h-4 text-white" /> Putusan Komite Kredit &rarr;
                </button>
              </div>
            </form>
          ) : (
            <div className="p-12 text-center text-slate-500 bg-white border border-slate-200 rounded-2xl shadow-xs">
              Pilih berkas pengajuan kredit di bilah kiri untuk memberikan putusan komite.
            </div>
          )}
        </div>
      </div>
      
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
    </div>
  );
};
