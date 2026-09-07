import React, { useState } from 'react';
import { useData } from '../../../context/FundingContext';
import { generateWhatsAppReport, formatDateIndo } from '../../../utils/funding/formatters';
import { FileText, Copy, Check, Download, MessageSquare, Building2, Calendar } from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const { selectedDate, setSelectedDate, getActivePortfolioForDate, dailyAdditions, kpis } = useData();
  const [copied, setCopied] = useState(false);

  const activeList = getActivePortfolioForDate(selectedDate);

  // Office filter for report preview
  const [selectedOfficeFilter, setSelectedOfficeFilter] = useState('All');

  // WhatsApp Report string
  const waReportText = generateWhatsAppReport(
    selectedDate,
    activeList,
    dailyAdditions,
    selectedOfficeFilter
  );

  const handleCopy = () => {
    navigator.clipboard.writeText(waReportText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadExcel = () => {
    // Generate CSV export format
    const headers = ['Tanggal', 'Kantor Kas', 'Nama Sumber', 'Kategori', 'Produk', 'NOA', 'Volume (Rp)', 'Jadwal'];
    const rows = activeList.map((i) => [
      i.tanggal,
      i.kantor_kas,
      `"${i.nama_sumber}"`,
      i.kategori_sumber,
      i.produk,
      i.noa,
      i.volume,
      `"${i.jadwal || i.keterangan || ''}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Laporan_Funding_ARA_${selectedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="glass-effect rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Pusat Laporan & Format WhatsApp
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Salin format laporan harian siap kirim ke WhatsApp Group Manajemen atau ekspor data ke CSV/Excel
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadExcel}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-slate-800 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Ekspor Excel/CSV</span>
          </button>
        </div>
      </div>

      {/* Filter Options */}
      <div className="glass-effect rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span className="font-medium text-slate-500">Pilih Tanggal:</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200/50 dark:border-white/10 rounded-xl px-3 py-1.5 font-bold text-slate-800 dark:text-slate-100 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <Building2 className="w-4 h-4 text-slate-400" />
            <span className="font-medium text-slate-500">Kantor Kas:</span>
            <select
              value={selectedOfficeFilter}
              onChange={(e) => setSelectedOfficeFilter(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200/50 dark:border-white/10 rounded-xl px-3 py-1.5 font-bold text-slate-800 dark:text-slate-100 focus:outline-none"
            >
              <option value="All">Semua Kantor Kas</option>
              <option value="Matesih">Matesih</option>
              <option value="Klodran">Klodran</option>
              <option value="Jumapolo">Jumapolo</option>
              <option value="Kantor Pusat">Kantor Pusat</option>

            </select>
          </div>
        </div>

        <button
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-all"
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          <span>{copied ? 'Tersalin ke Clipboard!' : 'Salin Laporan WA'}</span>
        </button>
      </div>

      {/* WhatsApp Preview Card */}
      <div className="glass-effect rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-emerald-600" />
            Preview Teks Laporan WhatsApp
          </span>
          <span className="text-[11px] text-slate-400">Siap di-copy & paste</span>
        </div>

        <div className="bg-slate-950 text-slate-100 font-mono text-xs p-4 rounded-xl border border-slate-800 whitespace-pre-wrap leading-relaxed select-all overflow-x-auto max-h-[500px]">
          {waReportText}
        </div>
      </div>
    </div>
  );
};
