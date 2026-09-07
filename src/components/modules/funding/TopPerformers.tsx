import React from 'react';
import { useData } from '../../../context/FundingContext';
import { formatRupiah, formatCompactRupiah } from '../../../utils/funding/formatters';
import { Trophy, TrendingUp, Users, PlusCircle } from 'lucide-react';

export const TopPerformers: React.FC = () => {
  const { groupedSources, dailyAdditions, selectedDate } = useData();

  // Top 5 by Volume
  const topByVolume = [...groupedSources]
    .sort((a, b) => b.total_volume - a.total_volume)
    .slice(0, 5);

  // Top 5 by NOA
  const topByNoa = [...groupedSources]
    .sort((a, b) => b.total_noa - a.total_noa)
    .slice(0, 5);

  // Top 5 Daily Growth
  const dailyMap = new Map<string, { nama_sumber: string; kantor_kas: string; volume_baru: number; noa_baru: number }>();
  dailyAdditions
    .filter((d) => d.tanggal === selectedDate)
    .forEach((d) => {
      const key = `${d.kantor_kas}||${d.nama_sumber}`;
      const curr = dailyMap.get(key) || {
        nama_sumber: d.nama_sumber,
        kantor_kas: d.kantor_kas,
        volume_baru: 0,
        noa_baru: 0,
      };
      curr.volume_baru += d.volume_baru;
      curr.noa_baru += d.noa_baru;
      dailyMap.set(key, curr);
    });

  const topByDailyGrowth = Array.from(dailyMap.values())
    .sort((a, b) => b.volume_baru - a.volume_baru)
    .slice(0, 5);

  return (
    <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Top 5 Volume */}
      <div className="glass-effect rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-xs">
        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100 dark:border-slate-800">
          <Trophy className="w-4 h-4 text-amber-500" />
          <h4 className="font-bold text-slate-900 dark:text-white text-sm">
            Top 5 Volume Penghimpunan
          </h4>
        </div>
        <div className="space-y-2.5">
          {topByVolume.map((item, idx) => (
            <div
              key={`top-vol-${item.nama_sumber}-${idx}`}
              className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 flex items-center justify-center font-bold text-[10px] rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                  {idx + 1}
                </span>
                <div>
                  <p className="font-bold text-slate-900 dark:text-white truncate max-w-[120px] sm:max-w-[150px]">
                    {item.nama_sumber}
                  </p>
                  <p className="text-[10px] text-slate-500">{item.kantor_kas} • {item.kategori}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-emerald-700 dark:text-emerald-400">
                  {formatCompactRupiah(item.total_volume)}
                </p>
                <p className="text-[10px] text-slate-500">{item.total_noa} NOA</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top 0 NOA */}
      <div className="glass-effect rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-xs">
        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100 dark:border-slate-800">
          <Users className="w-4 h-4 text-blue-500" />
          <h4 className="font-bold text-slate-900 dark:text-white text-sm">
            Top 0 Rekening (NOA)
          </h4>
        </div>
        <div className="space-y-2.5">
          {topByNoa.map((item, idx) => (
            <div
              key={`top-noa-${item.nama_sumber}-${idx}`}
              className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 flex items-center justify-center font-bold text-[10px] rounded-full bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300">
                  {idx + 1}
                </span>
                <div>
                  <p className="font-bold text-slate-900 dark:text-white truncate max-w-[120px] sm:max-w-[150px]">
                    {item.nama_sumber}
                  </p>
                  <p className="text-[10px] text-slate-500">{item.kantor_kas} • {item.kategori}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-blue-600 dark:text-blue-400">
                  {item.total_noa} NOA
                </p>
                <p className="text-[10px] text-slate-500">{formatCompactRupiah(item.total_volume)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top 5 Daily Growth */}
      <div className="glass-effect rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-xs">
        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100 dark:border-slate-800">
          <PlusCircle className="w-4 h-4 text-teal-500" />
          <h4 className="font-bold text-slate-900 dark:text-white text-sm">
            Top Penambahan Hari Ini
          </h4>
        </div>
        <div className="space-y-2.5">
          {topByDailyGrowth.length > 0 ? (
            topByDailyGrowth.map((item, idx) => (
              <div
                key={`top-daily-${item.nama_sumber}-${idx}`}
                className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 flex items-center justify-center font-bold text-[10px] rounded-full bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300">
                    {idx + 1}
                  </span>
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white truncate max-w-[120px] sm:max-w-[150px]">
                      {item.nama_sumber}
                    </p>
                    <p className="text-[10px] text-slate-500">{item.kantor_kas}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-teal-600 dark:text-teal-400">
                    +{formatCompactRupiah(item.volume_baru)}
                  </p>
                  <p className="text-[10px] text-slate-500">+{item.noa_baru} NOA</p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-6 text-xs text-slate-400">
              Belum ada catatan pertumbuhan hari ini
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
