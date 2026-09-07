import React, { useState } from 'react';
import { useData } from '../../../context/FundingContext';
import { formatRupiah, formatCompactRupiah } from '../../../utils/funding/formatters';
import { Users, Search, ArrowUpRight, ArrowDownRight, Filter } from 'lucide-react';

export const SourceBreakdownTable: React.FC = () => {
  const { groupedSources, selectedKasOffice } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  const filteredSources = groupedSources.filter((s) => {
    if (selectedKasOffice !== 'All' && s.kantor_kas !== selectedKasOffice) return false;
    if (categoryFilter !== 'All' && s.kategori !== categoryFilter) return false;
    if (searchTerm.trim() !== '') {
      const q = searchTerm.toLowerCase();
      if (!s.nama_sumber.toLowerCase().includes(q) && !s.kantor_kas.toLowerCase().includes(q)) {
        return false;
      }
    }
    return true;
  });

  const categories = ['All', 'Pasar', 'PKK', 'Pedagang', 'Komunitas', 'Sekolah', 'Desa / RW', 'Lainnya'];

  return (
    <section className="glass-effect rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              Portofolio Berdasarkan Sumber Penghimpunan
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Breakdown penghimpunan per Pasar, PKK, Komunitas, Sekolah, & Pedagang
          </p>
        </div>

        {/* Filters & Search */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari sumber..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200/50 dark:border-white/10 rounded-lg pl-8 pr-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-900 dark:text-slate-100"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200/50 dark:border-white/10 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800 dark:text-slate-200"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat === 'All' ? 'Semua Kategori' : cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-200/50 dark:border-white/10 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[10px] bg-slate-50/50 dark:bg-slate-800/40">
              <th className="py-3 px-3">Nama Sumber</th>
              <th className="py-3 px-3">Kantor Kas</th>
              <th className="py-3 px-3">Kategori</th>
              <th className="py-3 px-3 text-right">Tabungan NOA</th>
              <th className="py-3 px-3 text-right">Tabungan Volume</th>
              <th className="py-3 px-3 text-right">Deposito NOA</th>
              <th className="py-3 px-3 text-right">Deposito Volume</th>
              <th className="py-3 px-3 text-right font-bold">Total Volume</th>
              <th className="py-3 px-3 text-right">Growth (+Rp)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {filteredSources.length > 0 ? (
              filteredSources.map((item, idx) => (
                <tr
                  key={`${item.kantor_kas}-${item.nama_sumber}-${idx}`}
                  className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">
                    {item.nama_sumber}
                  </td>
                  <td className="py-3 px-3 text-slate-600 dark:text-slate-300 font-medium">
                    {item.kantor_kas}
                  </td>
                  <td className="py-3 px-3">
                    <span className="inline-block px-2 py-0.5 text-[10px] font-bold rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
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
                  <td className="py-3 px-3 text-right font-bold">
                    {item.growth_volume > 0 ? (
                      <span className="text-emerald-600 dark:text-emerald-400 inline-flex items-center justify-end gap-0.5">
                        <ArrowUpRight className="w-3.5 h-3.5" />
                        +{formatCompactRupiah(item.growth_volume)}
                      </span>
                    ) : item.growth_volume < 0 ? (
                      <span className="text-rose-600 dark:text-rose-400 inline-flex items-center justify-end gap-0.5">
                        <ArrowDownRight className="w-3.5 h-3.5" />
                        {formatCompactRupiah(item.growth_volume)}
                      </span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={9} className="py-8 text-center text-slate-400 text-xs">
                  Tidak ada data sumber penghimpunan yang cocok
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};
