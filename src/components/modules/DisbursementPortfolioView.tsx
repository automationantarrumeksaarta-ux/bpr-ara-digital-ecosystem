import React, { useState } from 'react';
import {
  Send,
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  Search,
  Filter,
  DollarSign,
  TrendingUp,
  Calendar,
  Layers,
  ArrowRight,
  ShieldCheck,
  Building,
  FileText,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { DocumentViewerModal } from '../common/DocumentViewerModal';
import { CreditPipelineHeader } from '../ui/CreditPipelineHeader';
import { CreditApplication } from '../../types';
import { LoanFacility, Collectibility } from '../../types';

export const DisbursementPortfolioView: React.FC = () => {
  const {
    loanFacilities,
    creditApplications,
    disburseCreditFacility,
    openCustomer360,
    currentUser,
    branches,
    selectedBranchId,
    setActiveModule,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedKolFilter, setSelectedKolFilter] = useState<string>('ALL');

  // Applications pending disbursement
  const pendingDisbursementApps = creditApplications.filter((a) => a.currentStage === 'APPROVED');
  const [viewerModal, setViewerModal] = useState<{ isOpen: boolean; app: CreditApplication | null }>({ isOpen: false, app: null });

  const totalOutstanding = loanFacilities.reduce((acc, f) => acc + f.outstandingPrincipal, 0);
  const totalOriginalPlafon = loanFacilities.reduce((acc, f) => acc + f.originalPlafon, 0);
  const kol1Total = loanFacilities
    .filter((f) => f.collectibility === 'KOL_1')
    .reduce((acc, f) => acc + f.outstandingPrincipal, 0);

  const filteredFacilities = loanFacilities.filter((f) => {
    const matchesSearch =
      f.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.facilityNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.accountNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.cif.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesKol = selectedKolFilter === 'ALL' || f.collectibility === selectedKolFilter;
    const matchesBranch = selectedBranchId === 'ALL' || f.branchId === selectedBranchId;

    return matchesSearch && matchesKol && matchesBranch;
  });

  return (
    <div className="space-y-5 animate-in fade-in">
      <CreditPipelineHeader currentStage="Disbursement" />
      {/* Header Banner */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
              LOAN DISBURSEMENT & PORTFOLIO ENGINE
            </span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
              Otorisasi Pencairan Dana Rekening
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 mt-1">Pencairan & Manajemen Portofolio Pinjaman</h1>
          <p className="text-xs text-slate-500 mt-1">
            Eksekusi pencairan kredit ke rekening debitur, monitoring baki debet harian, dan pemantauan hari menunggak (DPD).
          </p>
        </div>
      </div>

      {/* Pending Disbursement Action Queue */}
      {pendingDisbursementApps.length > 0 && (
        <div className="p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Send className="w-5 h-5 text-emerald-700" />
              <h3 className="text-sm font-bold text-emerald-950">
                Antrean Otorisasi Pencairan ({pendingDisbursementApps.length} Berkas Telah Disetujui)
              </h3>
            </div>
            <span className="text-xs text-emerald-800 font-semibold">Siap Eksekusi Dana</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {pendingDisbursementApps.map((app) => (
              <div
                key={app.id}
                className="p-4 rounded-xl bg-white border border-emerald-200/80 flex items-center justify-between text-xs shadow-xs"
              >
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{app.customerName}</h4>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    No. LOS: {app.applicationNumber} • Plafon: Rp {app.requestedPlafon.toLocaleString('id-ID')}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setViewerModal({ isOpen: true, app })}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center gap-1.5 shadow-xs cursor-pointer text-xs transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5 text-blue-600" /> Buka Dossier
                  </button>
                  <button
                    onClick={() => {
                      disburseCreditFacility(app.id);
                      alert(`Pencairan Dana Rp ${app.requestedPlafon.toLocaleString('id-ID')} untuk ${app.customerName} Sukses Diproses ke Rekening Debitur!`);
                    }}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 shadow-xs cursor-pointer text-xs transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" /> Cairkan Dana
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top 3 Portfolio Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">Total Baki Debet Dikelola</span>
          <div className="text-2xl font-bold text-slate-900 mt-1 font-mono">
            Rp {(totalOutstanding / 1000000000).toFixed(2)} Miliar
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Dari Total Plafon Asal Rp {(totalOriginalPlafon / 1000000000).toFixed(2)} M
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">Portofolio Kol-1 (Lancar)</span>
          <div className="text-2xl font-bold text-emerald-700 mt-1 font-mono">
            Rp {(kol1Total / 1000000000).toFixed(2)} Miliar
          </div>
          <div className="text-[11px] text-emerald-700 font-medium mt-1">
            {((kol1Total / totalOutstanding) * 100).toFixed(1)}% dari Total Portofolio
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">Tingkat Penagihan Tepat Waktu</span>
          <div className="text-2xl font-bold text-blue-700 mt-1">0%</div>
          <div className="text-[11px] text-slate-500 mt-1">SLA Jatuh Tempo Terjaga</div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari berdasarkan Debitur, Nomor Fasilitas, Nomor Rekening, atau CIF..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
          />
        </div>

        <select
          value={selectedKolFilter}
          onChange={(e) => setSelectedKolFilter(e.target.value)}
          className="bg-slate-50 text-xs text-slate-700 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-blue-500 cursor-pointer"
        >
          <option value="ALL">Semua Kolektibilitas</option>
          <option value="KOL_1">KOL-1 (Lancar)</option>
          <option value="KOL_2">KOL-2 (DPK 1-90 Hari)</option>
          <option value="KOL_3">KOL-3 (Kurang Lancar)</option>
          <option value="KOL_4">KOL-4 (Diragukan)</option>
          <option value="KOL_5">KOL-5 (Macet)</option>
        </select>
      </div>

      {/* Loan Facilities Master Table */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>Menampilkan {filteredFacilities.length} Fasilitas Pinjaman Aktif</span>
          <span>Klik nama nasabah untuk melihat detail 360°</span>
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3">No. Fasilitas & Rekening</th>
                <th className="p-3">Debitur & CIF</th>
                <th className="p-3">Plafon Awal</th>
                <th className="p-3">Baki Debet Saat Ini</th>
                <th className="p-3">Angsuran / Bln</th>
                <th className="p-3">Kolektibilitas & DPD</th>
                <th className="p-3">Jatuh Tempo</th>
                <th className="p-3 text-right">Aksi Terintegrasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {filteredFacilities.map((fac) => (
                <tr key={fac.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-3 font-mono">
                    <div className="font-semibold text-slate-900">{fac.facilityNumber}</div>
                    <div className="text-[10px] text-slate-500">{fac.accountNumber}</div>
                  </td>

                  <td className="p-3">
                    <button
                      onClick={() => openCustomer360(fac.cif)}
                      className="font-bold text-slate-900 hover:text-blue-600 text-left block cursor-pointer"
                    >
                      {fac.customerName}
                    </button>
                    <span className="text-[10px] text-slate-500 font-mono">{fac.cif}</span>
                  </td>

                  <td className="p-3 font-mono font-medium text-slate-700">
                    Rp {fac.originalPlafon.toLocaleString('id-ID')}
                  </td>

                  <td className="p-3 font-mono font-bold text-emerald-700">
                    Rp {fac.outstandingPrincipal.toLocaleString('id-ID')}
                  </td>

                  <td className="p-3 font-mono text-blue-700 font-medium">
                    Rp {fac.monthlyInstallment.toLocaleString('id-ID')}
                  </td>

                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        fac.collectibility === 'KOL_1'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : fac.collectibility === 'KOL_2'
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : 'bg-red-50 text-red-700 border-red-200'
                      }`}
                    >
                      {fac.collectibility} (DPD: {fac.dpdDays} Hari)
                    </span>
                  </td>

                  <td className="p-3 text-slate-600 font-mono text-[11px]">{fac.nextDueDate}</td>

                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {fac.dpdDays > 0 && (
                        <button
                          onClick={() => setActiveModule('PTP_TRACKER')}
                          className="px-2 py-1 rounded bg-amber-50 hover:bg-amber-100 text-amber-800 text-[10px] font-semibold border border-amber-200 cursor-pointer transition-colors"
                        >
                          Catat PTP
                        </button>
                      )}
                      <button
                        onClick={() => openCustomer360(fac.cif)}
                        className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white text-[11px] font-medium transition-colors border border-blue-200 cursor-pointer"
                      >
                        Lihat 360°
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

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
