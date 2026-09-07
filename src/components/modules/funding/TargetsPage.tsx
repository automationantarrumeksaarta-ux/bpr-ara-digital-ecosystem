import React, { useState } from 'react';
import { useData } from '../../../context/FundingContext';
import { formatRupiah, formatCompactRupiah } from '../../../utils/funding/formatters';
import { Target, Save, CheckCircle, RefreshCw, Building2 } from 'lucide-react';

export const TargetsPage: React.FC = () => {
  const { targets, setTargets, getActivePortfolioForDate, selectedDate } = useData();
  const [selectedMonth, setSelectedMonth] = useState('2026-08');
  const [isSaved, setIsSaved] = useState(false);

  // Active portfolio to calculate actual achievement
  const activeList = getActivePortfolioForDate(selectedDate);

  // Group real active data per office & product
  const actualMap = new Map<string, { tabungan: number; deposito: number; total: number }>();
  ['Kantor Pusat', 'Matesih', 'Jumapolo', 'Klodran'].forEach((o) => {
    actualMap.set(o, { tabungan: 0, deposito: 0, total: 0 });
  });

  activeList.forEach((item) => {
    const entry = actualMap.get(item.kantor_kas);
    if (entry) {
      if (item.produk === 'Tabungan') {
        entry.tabungan += item.volume;
      } else {
        entry.deposito += item.volume;
      }
      entry.total += item.volume;
    }
  });

  // Target editing state
  const [localTargets, setLocalTargets] = useState(targets);

  const handleTargetChange = (kantorKas: string, produk: 'Tabungan' | 'Deposito' | 'Total', newVol: number) => {
    setLocalTargets((prev) =>
      prev.map((t) => {
        if (t.kantor_kas === kantorKas && t.produk === produk && t.periode === selectedMonth) {
          return { ...t, target_volume: newVol };
        }
        return t;
      })
    );
  };

  const handleSaveTargets = () => {
    setTargets(localTargets);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const offices = ['Kantor Pusat', 'Matesih', 'Jumapolo', 'Klodran'];

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="glass-effect rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Target & Achievement Per Kantor Kas
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Kelola target penghimpunan bulanan dan pantau tingkat ketercapaian secara real-time
          </p>
        </div>

        <div className="flex items-center gap-3">
          {isSaved && (
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <CheckCircle className="w-4 h-4" /> Target Tersimpan!
            </span>
          )}

          <button
            onClick={handleSaveTargets}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-all"
          >
            <Save className="w-4 h-4" />
            <span>Simpan Target</span>
          </button>
        </div>
      </div>

      {/* Target Table */}
      <div className="glass-effect rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200/50 dark:border-white/10 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 dark:text-white text-sm">
            Matriks Target Kantor Kas (Agustus 2026)
          </h3>
          <span className="text-xs text-slate-500 font-mono">Bulan: 2026-08</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200/50 dark:border-white/10 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[10px] bg-slate-50/50 dark:bg-slate-800/40">
                <th className="py-3 px-4">Kantor Kas</th>
                <th className="py-3 px-4 text-right">Target Total (Rp)</th>
                <th className="py-3 px-4 text-right">Realisasi Total (Rp)</th>
                <th className="py-3 px-4 text-right">Achievement %</th>
                <th className="py-3 px-4">Progress Bar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {offices.map((office) => {
                const totalTargetObj = localTargets.find(
                  (t) => t.kantor_kas === office && t.produk === 'Total' && t.periode === selectedMonth
                );
                const targetVol = totalTargetObj ? totalTargetObj.target_volume : 0;
                const actualVol = actualMap.get(office)?.total || 0;
                const pct = targetVol > 0 ? (actualVol / targetVol) * 100 : 0;

                return (
                  <tr key={office} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-emerald-600" />
                      <span>Kantor Kas {office}</span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <input
                        type="number"
                        value={targetVol}
                        onChange={(e) =>
                          handleTargetChange(office, 'Total', parseFloat(e.target.value) || 0)
                        }
                        className="w-36 text-right text-xs font-mono font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200/50 dark:border-white/10 rounded-lg px-2 py-1 text-slate-900 dark:text-white focus:ring-1 focus:ring-emerald-500"
                      />
                    </td>
                    <td className="py-3.5 px-4 text-right font-black text-slate-900 dark:text-white">
                      {formatRupiah(actualVol)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-black text-emerald-600 dark:text-emerald-400">
                      {pct.toFixed(1)}%
                    </td>
                    <td className="py-3.5 px-4 w-48">
                      <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, pct)}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
