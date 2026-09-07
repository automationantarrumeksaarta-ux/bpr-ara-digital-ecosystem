import React, { useState } from 'react';
import { useData } from '../../../context/FundingContext';
import { formatRupiah, formatCompactRupiah, formatDateIndo } from '../../../utils/funding/formatters';
import { Building2, ArrowUpRight, ArrowDownRight, Layers, Users, PiggyBank, Vault, Target } from 'lucide-react';

interface OfficeDetailPageProps {
  initialOffice?: string;
  onBack?: () => void;
}

export const OfficeDetailPage: React.FC<OfficeDetailPageProps> = ({ initialOffice = 'Matesih', onBack }) => {
  const { getActivePortfolioForDate, selectedDate, targets } = useData();
  const [currentOffice, setCurrentOffice] = useState<string>(initialOffice);

  const offices = ['Kantor Pusat', 'Matesih', 'Jumapolo', 'Klodran'];

  // Calculate office specific metrics
  const activeList = getActivePortfolioForDate(selectedDate).filter(
    (item) => item.kantor_kas === currentOffice
  );

  const prevList = getActivePortfolioForDate('2026-08-10').filter(
    (item) => item.kantor_kas === currentOffice
  );

  let tabunganNoa = 0;
  let tabunganVolume = 0;
  let depositoNoa = 0;
  let depositoVolume = 0;

  activeList.forEach((item) => {
    if (item.produk === 'Tabungan') {
      tabunganNoa += item.noa;
      tabunganVolume += item.volume;
    } else {
      depositoNoa += item.noa;
      depositoVolume += item.volume;
    }
  });

  const totalNoa = tabunganNoa + depositoNoa;
  const totalVolume = tabunganVolume + depositoVolume;

  let prevTotalVolume = 0;
  prevList.forEach((item) => {
    prevTotalVolume += item.volume;
  });

  const growthNominal = totalVolume - prevTotalVolume;
  const growthPercent = prevTotalVolume > 0 ? ((totalVolume - prevTotalVolume) / prevTotalVolume) * 100 : 0;

  // Target for this office
  const officeTarget = targets.find((t) => t.kantor_kas === currentOffice && t.produk === 'Total');
  const targetVolume = officeTarget ? officeTarget.target_volume : 0;
  const achievementPercent = targetVolume > 0 ? (totalVolume / targetVolume) * 100 : 0;

  // Group portfolio by source name for the detailed table
  const sourceMap = new Map<
    string,
    {
      nama_sumber: string;
      kategori: string;
      tabungan_noa: number;
      tabungan_volume: number;
      deposito_noa: number;
      deposito_volume: number;
      total_volume: number;
    }
  >();

  activeList.forEach((item) => {
    let entry = sourceMap.get(item.nama_sumber);
    if (!entry) {
      entry = {
        nama_sumber: item.nama_sumber,
        kategori: item.kategori_sumber,
        tabungan_noa: 0,
        tabungan_volume: 0,
        deposito_noa: 0,
        deposito_volume: 0,
        total_volume: 0,
      };
      sourceMap.set(item.nama_sumber, entry);
    }

    if (item.produk === 'Tabungan') {
      entry.tabungan_noa += item.noa;
      entry.tabungan_volume += item.volume;
    } else {
      entry.deposito_noa += item.noa;
      entry.deposito_volume += item.volume;
    }
    entry.total_volume = entry.tabungan_volume + entry.deposito_volume;
  });

  const sourceTable = Array.from(sourceMap.values()).sort((a, b) => b.total_volume - a.total_volume);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner & Selector */}
      <div className="glass-effect rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-xl font-black text-slate-900 dark:text-white">
              Detail Kantor Kas {currentOffice}
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Laporan lengkap penghimpunan dana Kantor Kas {currentOffice} posisi {formatDateIndo(selectedDate, 'long')}
          </p>
        </div>

        {/* Switcher */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">Pilih Kantor Kas:</span>
          <select
            value={currentOffice}
            onChange={(e) => setCurrentOffice(e.target.value)}
            className="bg-slate-100 dark:bg-slate-800 border border-slate-200/50 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none"
          >
            {offices.map((o) => (
              <option key={o} value={o}>
                Kantor Kas {o}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* KPI Overview for Selected Office */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-emerald-900 text-white p-4 rounded-xl border border-emerald-800">
          <span className="text-xs font-semibold text-emerald-300">Total Volume</span>
          <h3 className="text-lg sm:text-xl font-black mt-1">{formatRupiah(totalVolume)}</h3>
          <p className="text-[10px] text-emerald-200 mt-1">Total NOA: {totalNoa} Rekening</p>
        </div>

        <div className="glass-effect p-4 rounded-xl border border-slate-200/50 dark:border-white/10">
          <span className="text-xs font-semibold text-slate-500">Volume Tabungan</span>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-1">{formatRupiah(tabunganVolume)}</h3>
          <p className="text-[10px] text-slate-400 mt-1">NOA Tabungan: {tabunganNoa}</p>
        </div>

        <div className="glass-effect p-4 rounded-xl border border-slate-200/50 dark:border-white/10">
          <span className="text-xs font-semibold text-slate-500">Volume Deposito</span>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-1">{formatRupiah(depositoVolume)}</h3>
          <p className="text-[10px] text-slate-400 mt-1">NOA Deposito: {depositoNoa}</p>
        </div>

        <div className="glass-effect p-4 rounded-xl border border-slate-200/50 dark:border-white/10">
          <span className="text-xs font-semibold text-slate-500">Growth vs Posisi Lalu</span>
          <h3 className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            {growthNominal >= 0 ? `+${formatCompactRupiah(growthNominal)}` : formatCompactRupiah(growthNominal)}
          </h3>
          <p className="text-[10px] text-slate-400 mt-1">Pertumbuhan: {growthPercent.toFixed(1)}%</p>
        </div>
      </div>

      {/* Target Progress Bar */}
      {targetVolume > 0 && (
        <div className="glass-effect rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Target className="w-4 h-4 text-emerald-600" />
              Target vs Realisasi Volume ({currentOffice})
            </span>
            <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
              {achievementPercent.toFixed(1)}% ({formatCompactRupiah(totalVolume)} / {formatCompactRupiah(targetVolume)})
            </span>
          </div>
          <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-700"
              style={{ width: `${Math.min(100, achievementPercent)}%` }}
            />
          </div>
        </div>
      )}

      {/* Table: Portofolio Berjalan Kantor Kas */}
      <div className="glass-effect rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs">
        <h3 className="font-bold text-slate-900 dark:text-white text-base mb-3">
          Portofolio Berjalan Kantor Kas {currentOffice}
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200/50 dark:border-white/10 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[10px] bg-slate-50/50 dark:bg-slate-800/40">
                <th className="py-3 px-3">Sumber</th>
                <th className="py-3 px-3">Kategori</th>
                <th className="py-3 px-3 text-right">Tabungan NOA</th>
                <th className="py-3 px-3 text-right">Tabungan Volume</th>
                <th className="py-3 px-3 text-right">Deposito NOA</th>
                <th className="py-3 px-3 text-right">Deposito Volume</th>
                <th className="py-3 px-3 text-right font-bold">Total Volume</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {sourceTable.length > 0 ? (
                sourceTable.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">
                      {item.nama_sumber}
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded">
                        {item.kategori}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right text-slate-700 dark:text-slate-300">
                      {item.tabungan_noa}
                    </td>
                    <td className="py-3 px-3 text-right font-medium text-slate-800 dark:text-slate-200">
                      {formatRupiah(item.tabungan_volume)}
                    </td>
                    <td className="py-3 px-3 text-right text-slate-700 dark:text-slate-300">
                      {item.deposito_noa}
                    </td>
                    <td className="py-3 px-3 text-right font-medium text-slate-800 dark:text-slate-200">
                      {item.deposito_volume > 0 ? formatRupiah(item.deposito_volume) : '-'}
                    </td>
                    <td className="py-3 px-3 text-right font-black text-emerald-700 dark:text-emerald-400">
                      {formatRupiah(item.total_volume)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 text-xs">
                    Belum ada data sumber untuk Kantor Kas {currentOffice}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
