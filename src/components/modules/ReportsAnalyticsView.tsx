import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Download,
  CheckCircle2,
  TrendingUp,
  ShieldCheck,
  Building,
  DollarSign,
  PieChart,
  Calendar,
  Layers,
  FileText,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const ReportsAnalyticsView: React.FC = () => {
  const [selectedReport, setSelectedReport] = useState('LBBPR');

  const reportsList = [
    { id: 'LBBPR', title: 'Laporan Bulanan Bank Perekonomian Rakyat (LBBPR - OJK)', period: 'Agustus 2026', format: 'Form 01 s/d Form 08 (.xlsx)' },
    { id: 'SLIK', title: 'Ekspor Data SLIK OJK (Sistem Layanan Informasi Keuangan)', period: 'Harian (21 Agt 2026)', format: 'Format Standar Pelaporan OJK (.txt/.xml)' },
    { id: 'CAMEL', title: 'Tingkat Kesehatan Bank Metode CAMEL (CAR, NPL, ROA, BOPO, CR)', period: 'Semester II 2026', format: 'Ringkasan Eksekutif & Rasio' },
    { id: 'NERACA', title: 'Neraca Keuangan & Laporan Laba Rugi Komprehensif', period: 'Per 21 Agustus 2026', format: 'Standard PSAK 71' },
    { id: 'APUPPT', title: 'Laporan Transaksi Keuangan Mencurigakan (LTKM / APU-PPT PPATK)', period: 'Bulan Berjalan', format: 'Kesesuaian Profil Nasabah' },
  ];

  const handleDownload = (title: string) => {
    alert(`Mengunduh file laporan: "${title}" untuk periode pelaporan OJK. File siap dikirim ke portal APOLO OJK.`);
  };

  return (
    <div className="space-y-5 animate-in fade-in">
      {/* Header Banner */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">
              OJK REGULATORY & FINANCIAL COMPLIANCE
            </span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
              APOLO & SLIK OJK Ready
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 mt-1">Laporan Regulasi OJK & Analitik Keuangan</h1>
          <p className="text-xs text-slate-500 mt-1">
            Ekspor otomatis Laporan Bulanan BPR (LBBPR), perhitungan rasio CAMEL, pelaporan SLIK harian, dan kepatuhan APU-PPT.
          </p>
        </div>
      </div>

      {/* CAMEL Metrics Status */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" /> Profil Tingkat Kesehatan BPR ARA (Metode CAMEL)
          </h3>
          <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
            PREDIKAT: SEHAT (Skor: 94.2)
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-slate-500 text-[10px] font-medium">Capital Adequacy (CAR)</span>
            <div className="text-lg font-bold text-emerald-700 mt-1 font-mono">0%</div>
            <div className="text-[10px] text-slate-400">Batas Min OJK: 0%</div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-slate-500 text-[10px] font-medium">Kualitas Aset (NPL Neto)</span>
            <div className="text-lg font-bold text-emerald-700 mt-1 font-mono">0%</div>
            <div className="text-[10px] text-slate-400">Batas Maks OJK: 0%</div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-slate-500 text-[10px] font-medium">Rentabilitas (ROA)</span>
            <div className="text-lg font-bold text-blue-700 mt-1 font-mono">0%</div>
            <div className="text-[10px] text-slate-400">Batas Min OJK: 0%</div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-slate-500 text-[10px] font-medium">Efisiensi (BOPO)</span>
            <div className="text-lg font-bold text-emerald-700 mt-1 font-mono">0%</div>
            <div className="text-[10px] text-slate-400">Batas Maks OJK: 0%</div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-slate-500 text-[10px] font-medium">Likuiditas (Cash Ratio)</span>
            <div className="text-lg font-bold text-cyan-700 mt-1 font-mono">0%</div>
            <div className="text-[10px] text-slate-400">Batas Min OJK: 0%</div>
          </div>
        </div>
      </div>

      {/* Reports Directory & Export List */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900">Daftar Paket Laporan Regulasi Siap Unduh (OJK / BI / LPS)</h3>

        <div className="space-y-2.5">
          {reportsList.map((rep) => (
            <div
              key={rep.id}
              className="p-4 rounded-xl bg-slate-50 border border-slate-200 hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <h4 className="font-bold text-slate-900 text-xs">{rep.title}</h4>
                </div>
                <div className="text-[11px] text-slate-500">
                  Periode: <strong className="text-slate-800">{rep.period}</strong> • Format: {rep.format}
                </div>
              </div>

              <button
                onClick={() => handleDownload(rep.title)}
                className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold flex items-center gap-1.5 cursor-pointer self-end sm:self-center transition-colors shadow-xs"
              >
                <Download className="w-3.5 h-3.5" /> Unduh Laporan
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
