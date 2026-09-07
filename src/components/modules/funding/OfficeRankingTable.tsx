import React, { useState, useMemo } from 'react';
import { useData } from '../../../context/FundingContext';
import { formatRupiah, formatCompactRupiah, calculateGrowthPercent } from '../../../utils/funding/formatters';
import { Award, ArrowUpDown, ArrowUpRight, ArrowDownRight, ChevronRight, Building2 } from 'lucide-react';

interface OfficeRankingTableProps {
  onSelectOffice?: (officeName: string) => void;
}

export const OfficeRankingTable: React.FC<OfficeRankingTableProps> = ({ onSelectOffice }) => {
  const { getActivePortfolioForDate, selectedDate, targets } = useData();
  const [sortBy, setSortBy] = useState<'volume' | 'noa' | 'growth' | 'achievement'>('volume');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const officeStats = useMemo(() => {
    const currentActive = getActivePortfolioForDate(selectedDate);

    // Calculate previous active snapshot (e.g. 10/08/2026)
    const prevDate = '2026-08-10';
    const prevActive = getActivePortfolioForDate(prevDate);

    const map = new Map<
      string,
      {
        kantor_kas: string;
        noa: number;
        volume: number;
        prevVolume: number;
        targetVolume: number;
        targetNoa: number;
      }
    >();

    // Seed offices so all known offices appear
    ['Kantor Pusat', 'Matesih', 'Jumapolo', 'Klodran'].forEach((office) => {
      map.set(office, {
        kantor_kas: office,
        noa: 0,
        volume: 0,
        prevVolume: 0,
        targetVolume: 0,
        targetNoa: 0,
      });
    });

    // Aggregate current
    currentActive.forEach((item) => {
      const entry = map.get(item.kantor_kas) || {
        kantor_kas: item.kantor_kas,
        noa: 0,
        volume: 0,
        prevVolume: 0,
        targetVolume: 0,
        targetNoa: 0,
      };
      entry.noa += item.noa;
      entry.volume += item.volume;
      map.set(item.kantor_kas, entry);
    });

    // Aggregate prev
    prevActive.forEach((item) => {
      const entry = map.get(item.kantor_kas);
      if (entry) {
        entry.prevVolume += item.volume;
      }
    });

    // Attach target volume
    targets.forEach((tgt) => {
      if (tgt.produk === 'Total') {
        const entry = map.get(tgt.kantor_kas);
        if (entry) {
          entry.targetVolume = tgt.target_volume;
          entry.targetNoa = tgt.target_noa;
        }
      }
    });

    const list = Array.from(map.values()).map((entry) => {
      const growthNominal = entry.volume - entry.prevVolume;
      const growthPercent = calculateGrowthPercent(entry.volume, entry.prevVolume);
      const achievementPercent = entry.targetVolume > 0 ? (entry.volume / entry.targetVolume) * 100 : 0;

      return {
        ...entry,
        growthNominal,
        growthPercent,
        achievementPercent,
      };
    });

    // Sort list
    return list.sort((a, b) => {
      let valA = 0;
      let valB = 0;
      if (sortBy === 'volume') {
        valA = a.volume;
        valB = b.volume;
      } else if (sortBy === 'noa') {
        valA = a.noa;
        valB = b.noa;
      } else if (sortBy === 'growth') {
        valA = a.growthPercent;
        valB = b.growthPercent;
      } else if (sortBy === 'achievement') {
        valA = a.achievementPercent;
        valB = b.achievementPercent;
      }

      return sortOrder === 'desc' ? valB - valA : valA - valB;
    });
  }, [getActivePortfolioForDate, selectedDate, targets, sortBy, sortOrder]);

  const handleSort = (field: 'volume' | 'noa' | 'growth' | 'achievement') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  return (
    <section className="glass-effect rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-500" />
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              Performance Kantor Kas
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Peringkat pencapaian dan pertumbuhan penghimpunan per Kantor Kas
          </p>
        </div>

        {/* Sort selector */}
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-slate-500 dark:text-slate-400">Urutkan:</span>
          {(['volume', 'noa', 'growth', 'achievement'] as const).map((field) => (
            <button
              key={field}
              onClick={() => handleSort(field)}
              className={`px-2.5 py-1 rounded-lg font-semibold text-xs transition-all ${
                sortBy === field
                  ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              {field === 'volume' && 'Volume'}
              {field === 'noa' && 'NOA'}
              {field === 'growth' && 'Growth'}
              {field === 'achievement' && 'Target %'}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-200/50 dark:border-white/10 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[10px] bg-slate-50/50 dark:bg-slate-800/40">
              <th className="py-3 px-3 w-12 text-center">Rank</th>
              <th className="py-3 px-3">Kantor Kas</th>
              <th className="py-3 px-3 text-right">Total NOA</th>
              <th className="py-3 px-3 text-right">Total Volume</th>
              <th className="py-3 px-3 text-right">Growth (vs Prev)</th>
              <th className="py-3 px-3 text-right">Target Volume</th>
              <th className="py-3 px-3 text-center w-36">Achievement</th>
              <th className="py-3 px-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {officeStats.map((item, idx) => {
              const rank = idx + 1;
              const isTop = rank === 1;

              return (
                <tr
                  key={item.kantor_kas}
                  onClick={() => onSelectOffice && onSelectOffice(item.kantor_kas)}
                  className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group"
                >
                  <td className="py-3 px-3 text-center">
                    <span
                      className={`inline-flex items-center justify-center w-6 h-6 rounded-full font-bold text-xs ${
                        rank === 1
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          : rank === 2
                          ? 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                          : rank === 3
                          ? 'bg-amber-900/20 text-amber-700 dark:text-amber-400'
                          : 'text-slate-400'
                      }`}
                    >
                      {rank}
                    </span>
                  </td>

                  <td className="py-3 px-3 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                    <span>{item.kantor_kas}</span>
                  </td>

                  <td className="py-3 px-3 text-right font-medium text-slate-700 dark:text-slate-300">
                    {item.noa.toLocaleString('id-ID')}
                  </td>

                  <td className="py-3 px-3 text-right font-bold text-slate-900 dark:text-white">
                    {formatRupiah(item.volume)}
                  </td>

                  <td className="py-3 px-3 text-right">
                    {item.growthNominal > 0 ? (
                      <span className="inline-flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400 font-semibold">
                        <ArrowUpRight className="w-3.5 h-3.5" />
                        +{formatCompactRupiah(item.growthNominal)} ({item.growthPercent.toFixed(1)}%)
                      </span>
                    ) : item.growthNominal < 0 ? (
                      <span className="inline-flex items-center gap-0.5 text-rose-600 dark:text-rose-400 font-semibold">
                        <ArrowDownRight className="w-3.5 h-3.5" />
                        {formatCompactRupiah(item.growthNominal)} ({item.growthPercent.toFixed(1)}%)
                      </span>
                    ) : (
                      <span className="text-slate-400">— 0,0%</span>
                    )}
                  </td>

                  <td className="py-3 px-3 text-right text-slate-600 dark:text-slate-400">
                    {item.targetVolume > 0 ? formatRupiah(item.targetVolume) : 'Belum diatur'}
                  </td>

                  <td className="py-3 px-3">
                    {item.targetVolume > 0 ? (
                      <div>
                        <div className="flex justify-between text-[11px] font-bold mb-1">
                          <span
                            className={
                              item.achievementPercent >= 80
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : item.achievementPercent >= 50
                                ? 'text-amber-600 dark:text-amber-400'
                                : 'text-rose-600 dark:text-rose-400'
                            }
                          >
                            {item.achievementPercent.toFixed(1)}%
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              item.achievementPercent >= 80
                                ? 'bg-emerald-500'
                                : item.achievementPercent >= 50
                                ? 'bg-amber-500'
                                : 'bg-rose-500'
                            }`}
                            style={{ width: `${Math.min(100, item.achievementPercent)}%` }}
                          />
                        </div>
                      </div>
                    ) : (
                      <span className="text-slate-400 text-[11px] text-center block">-</span>
                    )}
                  </td>

                  <td className="py-3 px-2 text-right">
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition-colors inline" />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
};
