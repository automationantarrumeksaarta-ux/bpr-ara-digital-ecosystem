import React from 'react';
import { useData } from '../../../context/FundingContext';
import { formatRupiah, formatDateIndo } from '../../../utils/funding/formatters';
import { TrendingUp, Plus, Trash2, Calendar, Building2 } from 'lucide-react';

interface DailyPageProps {
  onOpenAddModal: () => void;
}

export const DailyPage: React.FC<DailyPageProps> = ({ onOpenAddModal }) => {
  const { filteredDailyAdditions, selectedDate, deleteDailyAddition, kpis } = useData();

  return (
    <div className="space-y-5 pb-12">
      {/* Header Banner */}
      <div className="glass-effect rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Catatan Penambahan Harian (Growth)
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Log setoran baru dan pembukaan rekening baru per tanggal {formatDateIndo(selectedDate, 'long')}
          </p>
        </div>

        <button
          onClick={onOpenAddModal}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Input Penambahan Harian</span>
        </button>
      </div>

      {/* KPI Total Additions Card */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-emerald-900 text-white p-4 rounded-2xl border border-emerald-800 shadow-xs">
          <span className="text-xs font-semibold text-emerald-200">Total Penambahan Volume Periode</span>
          <h3 className="text-2xl font-black mt-1">{formatRupiah(kpis.penambahanVolumePeriode)}</h3>
          <p className="text-[11px] text-emerald-300 mt-1">
            Pertumbuhan nominal tercatat di database
          </p>
        </div>

        <div className="bg-slate-900 text-white p-4 rounded-2xl border border-slate-800 shadow-xs">
          <span className="text-xs font-semibold text-slate-300">Total Penambahan NOA Periode</span>
          <h3 className="text-2xl font-black mt-1">+{kpis.penambahanNoaPeriode} NOA</h3>
          <p className="text-[11px] text-slate-400 mt-1">
            Rekening baru terbentuk
          </p>
        </div>
      </div>

      {/* Daily Additions Table */}
      <div className="glass-effect rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200/50 dark:border-white/10 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[10px] bg-slate-50/50 dark:bg-slate-800/40">
                <th className="py-3 px-4">Tanggal</th>
                <th className="py-3 px-4">Kantor Kas</th>
                <th className="py-3 px-4">Nama Sumber</th>
                <th className="py-3 px-4">Produk</th>
                <th className="py-3 px-4 text-right">NOA Baru</th>
                <th className="py-3 px-4 text-right">Volume Baru (Rp)</th>
                <th className="py-3 px-4">Keterangan</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {filteredDailyAdditions.length > 0 ? (
                filteredDailyAdditions.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300">
                      {formatDateIndo(item.tanggal)}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{item.kantor_kas}</span>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                      {item.nama_sumber}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        {item.produk}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-slate-800 dark:text-slate-200">
                      +{item.noa_baru}
                    </td>
                    <td className="py-3 px-4 text-right font-black text-emerald-600 dark:text-emerald-400">
                      +{formatRupiah(item.volume_baru)}
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-[11px]">
                      {item.keterangan || '-'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => deleteDailyAddition(item.id)}
                        className="p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 rounded-lg transition-colors"
                        title="Hapus catatan harian"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-400 text-xs">
                    Belum ada catatan penambahan harian pada filter ini
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
