import React, { useState } from 'react';
import { useData } from '../../../context/FundingContext';
import { Upload, FileCheck, AlertTriangle, CheckCircle2, ArrowRight, Trash2, Database } from 'lucide-react';

export const ImportPage: React.FC = () => {
  const { addPortfolioItem, portfolioList } = useData();
  const [pasteData, setPasteData] = useState('');
  const [parsedItems, setParsedItems] = useState<any[]>([]);
  const [importSuccess, setImportSuccess] = useState(false);

  const handleParseText = () => {
    if (!pasteData.trim()) return;

    const lines = pasteData.trim().split('\n');
    const items: any[] = [];

    lines.forEach((line, idx) => {
      // Split by tab or comma or semicolon
      const parts = line.split(/[\t,;]+/);
      if (parts.length >= 6) {
        const tanggal = parts[0]?.trim() || '2026-08-11';
        const kantor_kas = parts[1]?.trim() || 'Matesih';
        const nama_sumber = parts[2]?.trim() || 'Sumber Baru';
        const kategori_sumber = parts[3]?.trim() || 'Lainnya';
        const produk = parts[4]?.trim().toLowerCase().includes('deposito') ? 'Deposito' : 'Tabungan';
        const noa = parseInt(parts[5]?.trim(), 10) || 1;
        const volume = parseFloat(parts[6]?.replace(/[^0-9]/g, '')) || 1000000;
        const jadwal = parts[7]?.trim() || 'Harian';

        items.push({
          id: `imp-${Date.now()}-${idx}`,
          tanggal,
          kantor_kas,
          nama_sumber,
          kategori_sumber,
          produk,
          noa,
          volume,
          jadwal,
        });
      }
    });

    setParsedItems(items);
  };

  const handleCommitImport = () => {
    parsedItems.forEach((item) => {
      addPortfolioItem(item);
    });
    setImportSuccess(true);
    setParsedItems([]);
    setPasteData('');
    setTimeout(() => setImportSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="glass-effect rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs">
        <div className="flex items-center gap-2">
          <Upload className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Import Batch Data Excel / CSV
          </h2>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Paste baris data dari Excel (Format: Tanggal | Kantor Kas | Nama Sumber | Kategori | Produk | NOA | Volume | Jadwal)
        </p>
      </div>

      {/* Input Box */}
      <div className="glass-effect rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs space-y-4">
        <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
          Paste Data Baris Excel / CSV:
        </label>
        <textarea
          rows={6}
          value={pasteData}
          onChange={(e) => setPasteData(e.target.value)}
          placeholder={`2026-08-11\tMatesih\tPasar Matesih\tPasar\tTabungan\t15\t50000000\tHarian
2026-08-11\tKlodran\tPKK Klodran\tPKK\tTabungan\t8\t25000000\tMingguan`}
          className="w-full text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200/50 dark:border-white/10 rounded-xl p-3 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        />

        <div className="flex items-center justify-between">
          <button
            onClick={handleParseText}
            className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl transition-all"
          >
            Pratinjau & Validasi Data
          </button>

          {importSuccess && (
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" /> Data berhasil di-import ke Database!
            </span>
          )}
        </div>
      </div>

      {/* Parsed Preview Table */}
      {parsedItems.length > 0 && (
        <div className="glass-effect rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-emerald-600" />
              <span>Pratinjau Data Valid ({parsedItems.length} Baris)</span>
            </h3>

            <button
              onClick={handleCommitImport}
              className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-all flex items-center gap-1"
            >
              <span>Commit Import Sekarang</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200/50 dark:border-white/10 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-2.5 px-3">Tanggal</th>
                  <th className="py-2.5 px-3">Kantor Kas</th>
                  <th className="py-2.5 px-3">Sumber</th>
                  <th className="py-2.5 px-3">Kategori</th>
                  <th className="py-2.5 px-3">Produk</th>
                  <th className="py-2.5 px-3 text-right">NOA</th>
                  <th className="py-2.5 px-3 text-right">Volume</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {parsedItems.map((item, idx) => (
                  <tr key={idx}>
                    <td className="py-2 px-3 font-mono">{item.tanggal}</td>
                    <td className="py-2 px-3 font-bold">{item.kantor_kas}</td>
                    <td className="py-2 px-3">{item.nama_sumber}</td>
                    <td className="py-2 px-3">{item.kategori_sumber}</td>
                    <td className="py-2 px-3">{item.produk}</td>
                    <td className="py-2 px-3 text-right font-medium">{item.noa}</td>
                    <td className="py-2 px-3 text-right font-black text-emerald-600">
                      Rp {item.volume.toLocaleString('id-ID')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
