import React, { useState } from 'react';
import {
  PiggyBank,
  Plus,
  ArrowRight,
  CheckCircle2,
  Calendar,
  DollarSign,
  TrendingUp,
  Percent,
  Layers,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { FundingOpportunity, FundingStage } from '../../types';

export const FundingCasaView: React.FC = () => {
  const {
    fundingOpportunities,
    updateFundingStage,
    addFundingOpportunity,
    customers,
    openCustomer360,
    currentUser,
    branches,
  } = useApp();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newForm, setNewForm] = useState({
    customerName: 'Budi Santoso',
    cif: 'CIF-00892',
    phone: '081234567890',
    productType: 'DEPOSITO_6_BULAN' as const,
    productCategory: 'DEPOSITO' as const,
    targetAmount: 200000000,
    interestRate: 6.0,
    tenorMonths: 6,
    source: 'MARKETING_VISIT' as const,
    notes: 'Penempatan dana hasil ekspansi usaha.',
  });

  const stages: { key: FundingStage; label: string; color: string }[] = [
    { key: 'PROSPECT', label: 'Prospek Awal', color: 'border-slate-200 bg-slate-50 text-slate-700' },
    { key: 'QUALIFIED', label: 'Terkualifikasi', color: 'border-blue-200 bg-blue-50/50 text-blue-800' },
    { key: 'INTERESTED', label: 'Berminat / Edukasi', color: 'border-indigo-200 bg-indigo-50/50 text-indigo-800' },
    { key: 'FOLLOW_UP', label: 'Tindak Lanjut', color: 'border-purple-200 bg-purple-50/50 text-purple-800' },
    { key: 'COMMITMENT', label: 'Komitmen Nominal', color: 'border-amber-200 bg-amber-50/50 text-amber-800' },
    { key: 'ACCOUNT_OPENED', label: 'Buka Bilyet / Rekening', color: 'border-cyan-200 bg-cyan-50/50 text-cyan-800' },
    { key: 'FUNDING_RECEIVED', label: 'Dana Masuk (Cair)', color: 'border-emerald-200 bg-emerald-50/50 text-emerald-800' },
  ];

  const totalFunded = fundingOpportunities.reduce((acc, f) => acc + f.realizedAmount, 0);
  const totalPipeline = fundingOpportunities.reduce((acc, f) => acc + f.targetAmount, 0);

  const handleCreateFunding = (e: React.FormEvent) => {
    e.preventDefault();
    addFundingOpportunity(newForm);
    setIsAddModalOpen(false);
  };

  return (
    <div className="space-y-5 animate-in fade-in">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-cyan-700 uppercase tracking-wider">
              FUNDING & CASA PIPELINE
            </span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
              Tingkat Bunga LPS: Maks 0%
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 mt-1">Penghimpunan Dana Pihak Ketiga (DPK)</h1>
          <p className="text-xs text-slate-500 mt-1">
            Manajemen pipeline simpanan sukarela, tabungan berjangka, dan deposito berjangka dengan pelacakan jatuh tempo.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-semibold flex items-center gap-2 shadow-sm transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Peluang Funding</span>
        </button>
      </div>

      {/* Metrics Top */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 font-medium">Total DPK Berhasil Terhimpun</span>
          <div className="text-2xl font-bold text-emerald-700 mt-1 font-mono">
            Rp {(totalFunded / 1000000000).toFixed(2)} Miliar
          </div>
          <div className="text-[11px] text-slate-500 mt-1">0% dari Target Bulanan BPR</div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 font-medium">Pipeline Potensial Dalam Proses</span>
          <div className="text-2xl font-bold text-slate-900 mt-1 font-mono">
            Rp {(totalPipeline / 1000000000).toFixed(2)} Miliar
          </div>
          <div className="text-[11px] text-cyan-700 font-semibold mt-1">
            {fundingOpportunities.filter((f) => f.stage !== 'FUNDING_RECEIVED').length} Calon Deposan
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 font-medium">Rasio Biaya Dana (Cost of Funds)</span>
          <div className="text-2xl font-bold text-blue-700 mt-1">0% p.a.</div>
          <div className="text-[11px] text-emerald-700 font-medium mt-1">Efisien (Batas Maks: 0%)</div>
        </div>
      </div>

      {/* Kanban Pipeline Stages */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900">Pipeline Corong Tahapan Funding (CASA & Deposito)</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {stages.map((stg) => {
            const itemsInStage = fundingOpportunities.filter((f) => f.stage === stg.key);
            const totalStageAmt = itemsInStage.reduce((acc, f) => acc + (f.realizedAmount || f.targetAmount), 0);

            return (
              <div
                key={stg.key}
                className={`p-3 rounded-xl border flex flex-col space-y-2.5 ${stg.color}`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs">{stg.label}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white text-slate-700 font-mono border border-slate-200 shadow-xs">
                    {itemsInStage.length}
                  </span>
                </div>
                <div className="text-[10px] text-slate-500 font-mono">
                  Rp {(totalStageAmt / 1000000).toFixed(0)} Jt
                </div>

                <div className="space-y-2 flex-1">
                  {itemsInStage.map((item) => (
                    <div
                      key={item.id}
                      className="p-2.5 rounded-lg bg-white border border-slate-200 space-y-2 shadow-xs text-xs"
                    >
                      <div className="flex items-start justify-between">
                        <div className="font-semibold text-slate-900 truncate">{item.customerName}</div>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-50 text-cyan-700 font-mono border border-cyan-200">
                          {item.productCategory}
                        </span>
                      </div>

                      <div className="font-bold text-emerald-700 font-mono text-[11px]">
                        Rp {(item.targetAmount / 1000000).toLocaleString('id-ID')} Juta
                      </div>

                      <div className="text-[10px] text-slate-500">
                        Bunga: {item.interestRate}% • {item.tenorMonths} Bln
                      </div>

                      {/* Advance Stage Trigger */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                        <button
                          onClick={() => openCustomer360(item.cif)}
                          className="text-[10px] text-blue-600 hover:text-blue-700 font-medium"
                        >
                          360°
                        </button>

                        {stg.key !== 'FUNDING_RECEIVED' && (
                          <button
                            onClick={() => {
                              const nextStageMap: Record<FundingStage, FundingStage> = {
                                PROSPECT: 'QUALIFIED',
                                QUALIFIED: 'INTERESTED',
                                INTERESTED: 'FOLLOW_UP',
                                FOLLOW_UP: 'COMMITMENT',
                                COMMITMENT: 'ACCOUNT_OPENED',
                                ACCOUNT_OPENED: 'FUNDING_RECEIVED',
                                FUNDING_RECEIVED: 'FUNDING_RECEIVED',
                              };
                              const nextStage = nextStageMap[stg.key];
                              updateFundingStage(item.id, nextStage, item.targetAmount);
                            }}
                            className="px-2 py-0.5 rounded bg-blue-600 hover:bg-blue-700 text-white text-[10px] flex items-center gap-1 cursor-pointer font-medium shadow-xs"
                          >
                            Maju &rarr;
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-5 space-y-4 text-slate-800 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900">Tambah Peluang Simpanan / Deposito</h3>
            <form onSubmit={handleCreateFunding} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-700 font-medium">Nasabah / Deposan</label>
                <select
                  value={newForm.cif}
                  onChange={(e) => {
                    const cust = customers.find((c) => c.cif === e.target.value);
                    setNewForm({
                      ...newForm,
                      cif: e.target.value,
                      customerName: cust?.name || '',
                      phone: cust?.phone || '',
                    });
                  }}
                  className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.cif}>
                      {c.name} ({c.cif})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-700 font-medium">Jenis Produk Simpanan</label>
                <select
                  value={newForm.productType}
                  onChange={(e) => setNewForm({ ...newForm, productType: e.target.value as any })}
                  className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500"
                >
                  <option value="DEPOSITO_1_BULAN">Deposito Berjangka 1 Bulan</option>
                  <option value="DEPOSITO_3_BULAN">Deposito Berjangka 3 Bulan</option>
                  <option value="DEPOSITO_6_BULAN">Deposito Berjangka 6 Bulan</option>
                  <option value="DEPOSITO_12_BULAN">Deposito Berjangka 12 Bulan</option>
                  <option value="TABUNGAN_ARA_UTAMA">Tabungan ARA Utama (CASA)</option>
                  <option value="TABUNGAN_BERJANGKA">Tabungan Berjangka Rencana</option>
                </select>
              </div>

              <div>
                <label className="text-slate-700 font-medium">Nominal Target (Rp)</label>
                <input
                  type="number"
                  required
                  value={newForm.targetAmount}
                  onChange={(e) => setNewForm({ ...newForm, targetAmount: Number(e.target.value) })}
                  className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-medium">Suku Bunga (% p.a.)</label>
                  <input
                    type="number"
                    step="0.05"
                    value={newForm.interestRate}
                    onChange={(e) => setNewForm({ ...newForm, interestRate: Number(e.target.value) })}
                    className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-medium">Jangka Waktu (Bulan)</label>
                  <input
                    type="number"
                    value={newForm.tenorMonths}
                    onChange={(e) => setNewForm({ ...newForm, tenorMonths: Number(e.target.value) })}
                    className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-semibold cursor-pointer shadow-xs"
                >
                  Simpan Peluang
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
