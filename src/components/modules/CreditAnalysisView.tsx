import React, { useState } from 'react';
import {
  LineChart,
  DollarSign,
  ShieldCheck,
  Bot,
  CheckCircle2,
  TrendingUp,
  Percent,
  Sparkles,
  Calculator,
  ArrowRight,
  FileText,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { WorkflowActionModal } from '../common/WorkflowActionModal';
import { DocumentViewerModal } from '../common/DocumentViewerModal';
import { CreditApplication, CreditAppStage } from '../../types';
import { CreditPipelineHeader } from '../ui/CreditPipelineHeader';

export const CreditAnalysisView: React.FC = () => {
  const { creditApplications, submitCreditAnalysis, currentUser, setActiveModule, updateCreditAppStage } = useApp();

  const analysisApps = creditApplications.filter(
    (a) => a.currentStage === 'ANALYSIS' || a.currentStage === 'SURVEY' || a.analysis
  );

  const [selectedAppId, setSelectedAppId] = useState<string>(
    analysisApps.length > 0 ? analysisApps[0].id : ''
  );

  const activeApp = creditApplications.find((a) => a.id === selectedAppId);

  // Financial Analysis State
  const [analysisData, setAnalysisData] = useState({
    characterScore: 88,
    characterNotes: 'Riwayat SLIK OJK bersih (Kol-1 di semua lembaga), kooperatif, dan reputasi lingkungan sangat positif.',
    capacityScore: 86,
    capacityNotes: 'Arus kas usaha sangat stabil dengan omzet rata-rata Rp 0/bulan dan margin bersih 30%.',
    capitalScore: 85,
    capitalNotes: 'Modal sendiri mencapai Rp 0, struktur permodalan sehat.',
    collateralScore: 90,
    collateralNotes: 'Agunan SHM bernilai Rp 0, rasio LTV sangat aman di bawah 50%.',
    conditionScore: 85,
    conditionNotes: 'Komoditas sembako dan kebutuhan primer tahan terhadap fluktuasi inflasi.',
    grossMonthlyRevenue: 60000000,
    operationalCost: 30000000,
    livingCost: 12000000,
    proposedPlafon: 150000000,
    proposedTenorMonths: 36,
    analystSummary: 'Sangat layak disetujui dengan plafon penuh Rp 0jangka waktu 36 bulan dengan pengikatan Hak Tanggungan (APHT).',
  });

  const netDisposableIncome =
    analysisData.grossMonthlyRevenue - analysisData.operationalCost - analysisData.livingCost;
  
  const proposedInstallment = Math.round(
    analysisData.proposedPlafon / analysisData.proposedTenorMonths + (analysisData.proposedPlafon * 0.145) / 12
  );

  const [viewerModal, setViewerModal] = useState<{ isOpen: boolean; app: CreditApplication | null }>({ isOpen: false, app: null });

  const dscrRatio = (netDisposableIncome / proposedInstallment).toFixed(2);
  const idiIndexPercent = ((proposedInstallment / netDisposableIncome) * 100).toFixed(1);

  const [isActionModalOpen, setIsActionModalOpen] = useState(false);

  const handleOpenActionModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppId) return;
    setIsActionModalOpen(true);
  };

  const handleWorkflowSubmit = (action: string, nextStage: CreditAppStage, notes: string, fileUrl?: string, fileName?: string) => {
    if (!selectedAppId) return;

    if (action === 'PROCEED') {
      submitCreditAnalysis(selectedAppId, {
        ...analysisData,
        netDisposableIncome,
        proposedInstallment,
        dscrRatio: Number(dscrRatio),
      });
      // Context's updateCreditAppStage will be called to update stage
      updateCreditAppStage(selectedAppId, nextStage, notes, fileUrl, fileName);
    } else {
      // Just update stage for return/reject
      updateCreditAppStage(selectedAppId, nextStage, notes, fileUrl, fileName);
    }

    setIsActionModalOpen(false);
    setActiveModule('CREDIT_APPROVAL');
  };

  return (
    <div className="space-y-5 animate-in fade-in">
      <CreditPipelineHeader currentStage="Credit Analysis" />
      {/* Header Banner */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-purple-700 uppercase tracking-wider">
              CREDIT RISK ASSESSMENT ENGINE (5C & DSCR)
            </span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
              Analisis Kemampuan Membayar OJK
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 mt-1">Analisis Kelayakan Finansial & 5C Scoring</h1>
          <p className="text-xs text-slate-500 mt-1">
            Evaluasi mendalam Character, Capacity (DSCR & IDI Index), Capital, Collateral (LTV), dan Condition.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left Queue */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Antrean Analisis Kredit ({analysisApps.length})
          </h3>
          <div className="space-y-2">
            {analysisApps.map((app) => (
              <div
                key={app.id}
                onClick={() => setSelectedAppId(app.id)}
                className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all ${
                  selectedAppId === app.id
                    ? 'bg-purple-50 border-purple-300 text-purple-950 shadow-xs ring-1 ring-purple-400/30'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-xs'
                }`}
              >
                <div className="flex items-start justify-between">
                  <span className="font-bold text-sm text-slate-900">{app.customerName}</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 font-semibold">
                    {app.currentStage}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Permohonan: Rp {app.requestedPlafon.toLocaleString('id-ID')} • {app.requestedTenorMonths} Bln
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Workstation */}
        <div className="lg:col-span-2 space-y-4">
          {activeApp ? (
            <form onSubmit={(e) => e.preventDefault()} className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-5 text-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Worksheet Analisis 5C: {activeApp.customerName}
                  </h3>
                  <p className="text-slate-500 text-[11px]">
                    No. Permohonan: {activeApp.applicationNumber} • Analis: {currentUser.name}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setViewerModal({ isOpen: true, app: activeApp })}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold flex items-center gap-1.5 transition-colors shadow-xs"
                  >
                    <FileText className="w-4 h-4 text-blue-600" /> Lihat Dossier & SLIK
                  </button>
                  <span className="px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 font-mono text-[11px] font-bold border border-purple-200">
                    5C Scoring Model
                  </span>
                </div>
              </div>

              {/* Financial Calculation Matrix */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <h4 className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                  <Calculator className="w-4 h-4 text-blue-600" /> Analisis Arus Kas & Kapasitas Pembayaran (Capacity)
                </h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-slate-600 text-[11px] font-medium">Omzet / Pendapatan Kotor (Rp)</label>
                    <input
                      type="number"
                      value={analysisData.grossMonthlyRevenue}
                      onChange={(e) => setAnalysisData({ ...analysisData, grossMonthlyRevenue: Number(e.target.value) })}
                      className="w-full mt-1 p-2 bg-white border border-slate-200 rounded-lg text-slate-900 font-mono focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="text-slate-600 text-[11px] font-medium">Biaya Usaha / HPP (Rp)</label>
                    <input
                      type="number"
                      value={analysisData.operationalCost}
                      onChange={(e) => setAnalysisData({ ...analysisData, operationalCost: Number(e.target.value) })}
                      className="w-full mt-1 p-2 bg-white border border-slate-200 rounded-lg text-slate-900 font-mono focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="text-slate-600 text-[11px] font-medium">Biaya Hidup Keluarga (Rp)</label>
                    <input
                      type="number"
                      value={analysisData.livingCost}
                      onChange={(e) => setAnalysisData({ ...analysisData, livingCost: Number(e.target.value) })}
                      className="w-full mt-1 p-2 bg-white border border-slate-200 rounded-lg text-slate-900 font-mono focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                {/* Key Financial Outputs */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-200">
                  <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                    <span className="text-slate-500 text-[10px]">Net Disposable Income</span>
                    <p className="font-bold text-emerald-700 font-mono text-xs">
                      Rp {netDisposableIncome.toLocaleString('id-ID')}
                    </p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                    <span className="text-slate-500 text-[10px]">Estimasi Angsuran / Bln</span>
                    <p className="font-bold text-blue-700 font-mono text-xs">
                      Rp {proposedInstallment.toLocaleString('id-ID')}
                    </p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                    <span className="text-slate-500 text-[10px]">Debt Service Coverage (DSCR)</span>
                    <p className="font-bold text-emerald-700 font-mono text-xs">
                      {dscrRatio}x (Min: 1.30x)
                    </p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                    <span className="text-slate-500 text-[10px]">IDI Index (% Beban Cicilan)</span>
                    <p className="font-bold text-purple-700 font-mono text-xs">
                      {idiIndexPercent}% (Maks: 40%)
                    </p>
                  </div>
                </div>
              </div>

              {/* Analyst Proposal & Conclusion */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-medium">Usulan Plafon Rekomendasi (Rp)</label>
                  <input
                    type="number"
                    value={analysisData.proposedPlafon}
                    onChange={(e) => setAnalysisData({ ...analysisData, proposedPlafon: Number(e.target.value) })}
                    className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-emerald-700 font-bold font-mono focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-medium">Usulan Jangka Waktu (Bulan)</label>
                  <input
                    type="number"
                    value={analysisData.proposedTenorMonths}
                    onChange={(e) => setAnalysisData({ ...analysisData, proposedTenorMonths: Number(e.target.value) })}
                    className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-700 font-medium">Ulasan & Kesimpulan Analis Kredit</label>
                <textarea
                  rows={2}
                  value={analysisData.analystSummary}
                  onChange={(e) => setAnalysisData({ ...analysisData, analystSummary: e.target.value })}
                  className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* Submit */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={handleOpenActionModal}
                  className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold flex items-center gap-2 shadow-xs cursor-pointer transition-colors"
                >
                  <CheckCircle2 className="w-4 h-4" /> Tindak Lanjut Analisis &rarr;
                </button>
              </div>
            </form>
          ) : (
            <div className="p-12 text-center text-slate-500 bg-white border border-slate-200 rounded-2xl shadow-xs">
              Pilih berkas pengajuan kredit di bilah kiri untuk menyusun analisis kelayakan 5C.
            </div>
          )}
        </div>
      </div>
      
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
    </div>
  );
};
