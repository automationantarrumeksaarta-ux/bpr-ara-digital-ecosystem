import React from 'react';
import { useData } from '../../../context/FundingContext';
import { formatRupiah, formatCompactRupiah, formatDateIndo } from '../../../utils/funding/formatters';
import { History, ArrowUpRight, ArrowDownRight, Minus, Sparkles, Activity } from 'lucide-react';

export const HistoricalComparison: React.FC = () => {
  const { changeAnalysis, selectedDate } = useData();

  const prevSnapshotDate = '2026-08-10';

  const increases = changeAnalysis.filter((c) => c.type === 'increase');
  const decreases = changeAnalysis.filter((c) => c.type === 'decrease');

  return (
    <section className="glass-effect rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              Historical Comparison & Analisis Perubahan
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Perbandingan otomatis posisi {formatDateIndo(selectedDate)} terhadap {formatDateIndo(prevSnapshotDate)}
          </p>
        </div>

        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs rounded-lg">
          <History className="w-3.5 h-3.5" />
          <span>Tracking Otomatis</span>
        </span>
      </div>

      {/* "Apa yang Berubah?" Section */}
      <div>
        <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Apa yang berubah hari ini?</span>
        </h4>

        {changeAnalysis.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {changeAnalysis.map((item, idx) => (
              <div
                key={`change-${item.nama_sumber}-${item.produk}-${idx}`}
                className={`p-3.5 rounded-xl border transition-all ${
                  item.type === 'increase'
                    ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200/80 dark:border-emerald-800/40'
                    : 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200/80 dark:border-rose-800/40'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white text-xs block">
                      {item.nama_sumber}
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium">
                      {item.kantor_kas} • {item.produk}
                    </span>
                  </div>

                  <span
                    className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md text-[10px] font-bold ${
                      item.type === 'increase'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300'
                        : 'bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-300'
                    }`}
                  >
                    {item.type === 'increase' ? (
                      <>
                        <ArrowUpRight className="w-3 h-3" />
                        <span>Bertambah</span>
                      </>
                    ) : (
                      <>
                        <ArrowDownRight className="w-3 h-3" />
                        <span>Berkurang</span>
                      </>
                    )}
                  </span>
                </div>

                {/* Nominal Comparison Details */}
                <div className="mt-2.5 pt-2 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 block">Posisi Lalu</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {formatRupiah(item.prev_volume)}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 block">Posisi Terbaru</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {formatRupiah(item.current_volume)}
                    </span>
                  </div>
                </div>

                {/* Growth Delta */}
                <div className="mt-1.5 flex items-center justify-between text-xs font-bold pt-1">
                  <span className="text-slate-500 text-[11px]">Selisih Growth:</span>
                  <span
                    className={
                      item.type === 'increase' ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'
                    }
                  >
                    {item.type === 'increase' ? '+' : ''}
                    {formatRupiah(item.nominal_change)} ({item.percent_change.toFixed(2)}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/60 dark:border-slate-800 text-xs text-slate-500 text-center">
            Posisi portofolio {formatDateIndo(selectedDate)} belum memiliki perubahan nominal dibanding posisi {formatDateIndo(prevSnapshotDate)}.
          </div>
        )}
      </div>
    </section>
  );
};
