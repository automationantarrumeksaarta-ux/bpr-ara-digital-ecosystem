import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { useData } from '../../../context/FundingContext';
import { formatRupiah, formatCompactRupiah, formatDateIndo } from '../../../utils/funding/formatters';
import { TrendingUp, BarChart2, Layers } from 'lucide-react';

export const ChartsSection: React.FC = () => {
  const { portfolio, dailyAdditions, selectedKasOffice } = useData();
  const [dailyChartMode, setDailyChartMode] = useState<'volume' | 'noa'>('volume');

  // Generate historical volume trend data from actual portfolio snapshots
  const volumeTrendData = useMemo(() => {
    // Unique dates from portfolio
    const dateSet = new Set<string>();
    portfolio.forEach((p) => dateSet.add(p.tanggal));
    const sortedDates = Array.from(dateSet).sort();

    // Map by date
    return sortedDates.map((date) => {
      // Calculate active portfolio as of this date
      const latestMap = new Map<string, typeof portfolio[0]>();
      portfolio
        .filter((item) => item.tanggal <= date)
        .sort((a, b) => a.tanggal.localeCompare(b.tanggal) || a.created_at.localeCompare(b.created_at))
        .forEach((item) => {
          if (selectedKasOffice === 'All' || item.kantor_kas === selectedKasOffice) {
            latestMap.set(`${item.kantor_kas}||${item.nama_sumber}||${item.produk}`, item);
          }
        });

      let tabungan = 0;
      let deposito = 0;

      latestMap.forEach((item) => {
        if (item.produk === 'Tabungan') tabungan += item.volume;
        if (item.produk === 'Deposito') deposito += item.volume;
      });

      return {
        tanggal: formatDateIndo(date, 'short'),
        rawTanggal: date,
        Tabungan: tabungan,
        Deposito: deposito,
        Total: tabungan + deposito,
      };
    });
  }, [portfolio, selectedKasOffice]);

  // Generate daily additions chart data
  const dailyAdditionsData = useMemo(() => {
    const map = new Map<string, { noa: number; volume: number }>();

    dailyAdditions.forEach((item) => {
      if (selectedKasOffice !== 'All' && item.kantor_kas !== selectedKasOffice) return;
      const curr = map.get(item.tanggal) || { noa: 0, volume: 0 };
      curr.noa += item.noa_baru;
      curr.volume += item.volume_baru;
      map.set(item.tanggal, curr);
    });

    const sorted = Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));

    return sorted.map(([date, vals]) => ({
      tanggal: formatDateIndo(date, 'short'),
      'NOA Baru': vals.noa,
      'Volume Baru': vals.volume,
    }));
  }, [dailyAdditions, selectedKasOffice]);

  // Custom Tooltip for Area Chart
  const CustomVolumeTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900/95 text-white p-3 rounded-xl shadow-xl text-xs border border-slate-700/80 backdrop-blur-md">
          <p className="font-bold text-slate-300 border-b border-slate-700 pb-1 mb-2">{label}</p>
          <div className="space-y-1">
            <p className="flex justify-between gap-4 text-emerald-400">
              <span>Tabungan:</span>
              <span className="font-semibold">{formatRupiah(payload[0]?.value || 0)}</span>
            </p>
            <p className="flex justify-between gap-4 text-blue-400">
              <span>Deposito:</span>
              <span className="font-semibold">{formatRupiah(payload[1]?.value || 0)}</span>
            </p>
            <p className="flex justify-between gap-4 text-white font-bold border-t border-slate-800 pt-1 mt-1">
              <span>Total Volume:</span>
              <span>{formatRupiah(payload[2]?.value || (payload[0]?.value || 0) + (payload[1]?.value || 0))}</span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <section className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      {/* Chart 1: Perkembangan Volume Penghimpunan */}
      <div className="glass-effect p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Perkembangan Volume Penghimpunan
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Tren akumulasi volume CASA Tabungan & Deposito
            </p>
          </div>
          <span className="px-2.5 py-1 text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 rounded-md border border-emerald-200/50 dark:border-emerald-800/50">
            {selectedKasOffice === 'All' ? 'Seluruh Kantor' : selectedKasOffice}
          </span>
        </div>

        <div className="h-64 sm:h-72 w-full pt-2">
          {volumeTrendData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={volumeTrendData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTabungan" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorDeposito" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
                <XAxis dataKey="tanggal" tick={{ fontSize: 11 }} stroke="#64748b" />
                <YAxis
                  tickFormatter={(val) => formatCompactRupiah(val).replace('Rp', '')}
                  tick={{ fontSize: 11 }}
                  stroke="#64748b"
                />
                <Tooltip content={<CustomVolumeTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                <Area
                  type="monotone"
                  dataKey="Tabungan"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorTabungan)"
                />
                <Area
                  type="monotone"
                  dataKey="Deposito"
                  stroke="#3b82f6"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorDeposito)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-slate-400">
              Belum ada data grafik perkembangan
            </div>
          )}
        </div>
      </div>

      {/* Chart 2: Penambahan Harian */}
      <div className="glass-effect p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Penambahan Harian
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Grafik pertumbuhan incremental NOA / Volume baru
            </p>
          </div>

          {/* Toggle Button */}
          <div className="inline-flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200/50 dark:border-white/10">
            <button
              onClick={() => setDailyChartMode('volume')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                dailyChartMode === 'volume'
                  ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Volume Baru
            </button>
            <button
              onClick={() => setDailyChartMode('noa')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                dailyChartMode === 'noa'
                  ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              NOA Baru
            </button>
          </div>
        </div>

        <div className="h-64 sm:h-72 w-full pt-2">
          {dailyAdditionsData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyAdditionsData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
                <XAxis dataKey="tanggal" tick={{ fontSize: 11 }} stroke="#64748b" />
                <YAxis
                  tickFormatter={(val) =>
                    dailyChartMode === 'volume' ? formatCompactRupiah(val).replace('Rp', '') : val
                  }
                  tick={{ fontSize: 11 }}
                  stroke="#64748b"
                />
                <Tooltip
                  formatter={(val: any) => [
                    dailyChartMode === 'volume' ? formatRupiah(val) : `${val} NOA`,
                    dailyChartMode === 'volume' ? 'Volume Baru' : 'NOA Baru',
                  ]}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    color: '#fff',
                    borderRadius: '12px',
                    fontSize: '12px',
                  }}
                />
                <Bar
                  dataKey={dailyChartMode === 'volume' ? 'Volume Baru' : 'NOA Baru'}
                  fill={dailyChartMode === 'volume' ? '#059669' : '#0284c7'}
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-slate-400">
              Belum ada catatan penambahan harian
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
