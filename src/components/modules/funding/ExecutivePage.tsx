import React from 'react';
import { useData } from '../../../context/FundingContext';
import { formatRupiah, formatCompactRupiah, calculateGrowthPercent } from '../../../utils/funding/formatters';
import { Award, AlertTriangle, CheckCircle2, ArrowUpRight, Sparkles, Building2 } from 'lucide-react';
import { ExecutiveBriefingCard } from './ExecutiveBriefingCard';

export const ExecutivePage: React.FC = () => {
  const { kpis, getActivePortfolioForDate, selectedDate, targets } = useData();

  // Active snapshot for current date
  const currentActive = getActivePortfolioForDate(selectedDate);
  const prevActive = getActivePortfolioForDate('2026-08-10');

  // Office rankings for executive view
  const officeMap = new Map<string, { current: number; prev: number; noa: number; target: number }>();
  ['Kantor Pusat', 'Matesih', 'Jumapolo', 'Klodran'].forEach((off) => {
    officeMap.set(off, { current: 0, prev: 0, noa: 0, target: 0 });
  });

  currentActive.forEach((item) => {
    const entry = officeMap.get(item.kantor_kas) || { current: 0, prev: 0, noa: 0, target: 0 };
    entry.current += item.volume;
    entry.noa += item.noa;
    officeMap.set(item.kantor_kas, entry);
  });

  prevActive.forEach((item) => {
    const entry = officeMap.get(item.kantor_kas);
    if (entry) {
      entry.prev += item.volume;
    }
  });

  targets.forEach((tgt) => {
    if (tgt.produk === 'Total') {
      const entry = officeMap.get(tgt.kantor_kas);
      if (entry) {
        entry.target = tgt.target_volume;
      }
    }
  });

  const officeRankings = Array.from(officeMap.entries()).map(([name, data]) => {
    const diff = data.current - data.prev;
    const growthPct = calculateGrowthPercent(data.current, data.prev);
    const achievementPct = data.target > 0 ? (data.current / data.target) * 100 : 0;
    return {
      kantor_kas: name,
      volume: data.current,
      noa: data.noa,
      diff,
      growthPct,
      target: data.target,
      achievementPct,
    };
  }).sort((a, b) => b.volume - a.volume);

  // Lagging or passive offices
  const laggingOffices = officeRankings.filter((o) => o.volume === 0 || (o.target > 0 && o.achievementPct < 50));

  return (
    <div className="space-y-6 pb-12">
      {/* 60-Second Executive Briefing Card */}
      <ExecutiveBriefingCard />

      {/* Grid: Office Performance Matrix & Direksi Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Ranking & Progress */}
        <div className="lg:col-span-2 glass-effect rounded-2xl border border-slate-200/50 dark:border-white/10 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              <span>Matriks Pencapaian Kantor Kas</span>
            </h3>
            <span className="text-xs text-slate-500 font-medium">Data Real-Time</span>
          </div>

          <div className="space-y-3">
            {officeRankings.map((item, idx) => (
              <div
                key={item.kantor_kas}
                className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 flex items-center justify-center font-bold text-xs rounded-full bg-slate-900 text-white dark:bg-slate-700">
                    {idx + 1}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                        Kantor Kas {item.kantor_kas}
                      </h4>
                      {item.volume > 0 ? (
                        <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 rounded-md font-bold text-[10px]">
                          Aktif (100% Porsi)
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-md font-bold text-[10px]">
                          Pasif / Portofolio 0
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-500 block mt-0.5">
                      {item.noa} Rekening NOA • Growth: {item.growthPct.toFixed(1)}%
                    </span>
                  </div>
                </div>

                <div className="text-right sm:w-48">
                  <div className="font-black text-slate-900 dark:text-white text-sm">
                    {formatRupiah(item.volume)}
                  </div>
                  {item.target > 0 && (
                    <div className="mt-1">
                      <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-0.5">
                        <span>Target ({item.achievementPct.toFixed(1)}%)</span>
                        <span>{formatCompactRupiah(item.target)}</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full"
                          style={{ width: `${Math.min(100, item.achievementPct)}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Col: Perhatian Direksi */}
        <div className="glass-effect rounded-2xl border border-slate-200/50 dark:border-white/10 p-5 shadow-xs space-y-4">
          <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <span>Fokus Perhatian Direksi</span>
          </h3>

          <div className="space-y-3">
            {laggingOffices.map((off) => (
              <div
                key={`lag-${off.kantor_kas}`}
                className="p-3 bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-xl text-xs text-amber-900 dark:text-amber-200 space-y-1"
              >
                <div className="font-bold flex items-center justify-between">
                  <span>Kantor Kas {off.kantor_kas}</span>
                  <span className="px-1.5 py-0.5 bg-amber-200 dark:bg-amber-900 text-amber-800 dark:text-amber-300 rounded font-bold text-[10px]">
                    {off.volume === 0 ? 'Belum Ada DPK' : 'Kurang Target'}
                  </span>
                </div>
                <p className="text-[11px] opacity-90 leading-snug">
                  {off.volume === 0
                    ? `Perlu akselerasi tim jaringan untuk penetrasi pasar lokal ${off.kantor_kas}.`
                    : `Pencapaian target baru ${off.achievementPct.toFixed(1)}%.`}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

