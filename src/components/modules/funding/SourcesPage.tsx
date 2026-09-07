import React, { useState } from 'react';
import { useData } from '../../../context/FundingContext';
import { formatRupiah, formatCompactRupiah } from '../../../utils/funding/formatters';
import { Users, Search, Building2, Calendar, ArrowUpRight } from 'lucide-react';

export const SourcesPage: React.FC = () => {
  const { groupedSources, selectedKasOffice, setSelectedKasOffice } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  const categories = ['All', 'Pasar', 'PKK', 'Pedagang', 'Komunitas', 'Sekolah', 'Desa / RW', 'Lainnya'];

  const filtered = groupedSources.filter((s) => {
    if (selectedKasOffice !== 'All' && s.kantor_kas !== selectedKasOffice) return false;
    if (categoryFilter !== 'All' && s.kategori !== categoryFilter) return false;
    if (searchTerm.trim() !== '') {
      const q = searchTerm.toLowerCase();
      return (
        s.nama_sumber.toLowerCase().includes(q) ||
        s.kantor_kas.toLowerCase().includes(q) ||
        s.kategori.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-5 pb-12">
      {/* Header Banner */}
      <div className="glass-effect rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Direktori Sumber Penghimpunan
          </h2>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Monitoring seluruh entitas mitra penghimpunan: Pasar, PKK, Komunitas, Sekolah, & Pedagang
        </p>
      </div>

      {/* Filter Bar */}
      <div className="glass-effect rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari sumber/pasar/kategori..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200/50 dark:border-white/10 rounded-xl pl-9 pr-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 text-xs">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200/50 dark:border-white/10 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-200 focus:outline-none"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c === 'All' ? 'Semua Kategori' : c}
              </option>
            ))}
          </select>

          <select
            value={selectedKasOffice}
            onChange={(e) => setSelectedKasOffice(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200/50 dark:border-white/10 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-200 focus:outline-none"
          >
            <option value="All">Semua Kantor Kas</option>
            <option value="Matesih">Matesih</option>
            <option value="Klodran">Klodran</option>
            <option value="Jumapolo">Jumapolo</option>
          </select>
        </div>
      </div>

      {/* Grid of Source Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((item, idx) => (
          <div
            key={`${item.kantor_kas}-${item.nama_sumber}-${idx}`}
            className="glass-effect rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-xs hover:border-emerald-300 dark:hover:border-emerald-700 transition-all"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="inline-block px-2 py-0.5 text-[10px] font-bold rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 mb-1">
                  {item.kategori}
                </span>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                  {item.nama_sumber}
                </h3>
              </div>
              <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg">
                {item.kantor_kas}
              </span>
            </div>

            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 block">Tabungan</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {formatCompactRupiah(item.tabungan_volume)}
                </span>
                <span className="text-[10px] text-slate-500 block">{item.tabungan_noa} NOA</span>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 block">Deposito</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {item.deposito_volume > 0 ? formatCompactRupiah(item.deposito_volume) : '-'}
                </span>
                <span className="text-[10px] text-slate-500 block">{item.deposito_noa} NOA</span>
              </div>
            </div>

            <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-500 text-[11px]">Total Penghimpunan:</span>
              <span className="font-black text-emerald-700 dark:text-emerald-400 text-sm">
                {formatRupiah(item.total_volume)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
