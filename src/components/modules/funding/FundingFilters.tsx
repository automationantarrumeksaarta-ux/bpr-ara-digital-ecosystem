import React, { useState } from 'react';
import { Calendar, Filter, Search, Building2 } from 'lucide-react';
import { useData } from '../../../context/FundingContext';
import { DateFilterPreset } from '../../../types/funding';
import { Card } from '../../ui/Card';

export const FundingFilters: React.FC = () => {
  const {
    selectedDate,
    setSelectedDate,
    selectedPreset,
    setSelectedPreset,
    selectedKasOffice,
    setSelectedKasOffice,
    selectedProduct,
    setSelectedProduct,
    selectedCategory,
    setSelectedCategory,
    searchQuery,
    setSearchQuery,
  } = useData();

  const [showFilters, setShowFilters] = useState(false);

  const presets: { label: string; value: DateFilterPreset['value'] }[] = [
    { label: 'Hari Ini', value: 'today' },
    { label: 'Kemarin', value: 'yesterday' },
    { label: '7 Hari', value: '7days' },
    { label: 'Bulan Ini', value: 'this_month' },
  ];

  const offices = ['All', 'Kantor Pusat', 'Matesih', 'Jumapolo', 'Klodran'];
  const products = ['All', 'Tabungan', 'Deposito'];
  const categories = ['All', 'Pasar', 'PKK', 'Pedagang', 'Komunitas', 'Sekolah', 'Desa / RW', 'Lainnya'];

  return (
    <Card className="p-3 mt-4 flex flex-wrap items-center justify-between gap-3">
      {/* Date Picker & Presets */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
          <Calendar className="w-4 h-4 text-slate-500" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => {
              setSelectedDate(e.target.value);
              setSelectedPreset('custom');
            }}
            className="bg-transparent text-sm font-semibold text-slate-800 dark:text-slate-100 focus:outline-none cursor-pointer"
          />
        </div>

        {/* Presets */}
        <div className="hidden sm:flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
          {presets.map((p) => (
            <button
              key={p.value}
              onClick={() => {
                setSelectedPreset(p.value);
                if (p.value === 'today') setSelectedDate('2026-08-11');
                if (p.value === 'yesterday') setSelectedDate('2026-08-10');
              }}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                selectedPreset === p.value
                  ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-sm font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Toggle Filters Mobile/Desktop */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-lg transition-colors md:hidden"
        >
          <Filter className="w-3.5 h-3.5" />
          <span>Filter ({selectedKasOffice !== 'All' ? '1' : '0'})</span>
        </button>
      </div>

      {/* Desktop Filter Dropdowns */}
      <div className={`w-full md:w-auto flex-col md:flex-row flex-wrap items-center gap-2 ${showFilters ? 'flex' : 'hidden md:flex'}`}>
        {/* Search Input */}
        <div className="relative w-full md:w-48">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari pasar/sumber..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        {/* Kantor Kas Filter */}
        <div className="flex items-center gap-1 text-sm text-slate-500">
          <Building2 className="w-3.5 h-3.5 hidden xl:inline" />
          <select
            value={selectedKasOffice}
            onChange={(e) => setSelectedKasOffice(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-sm rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="All">Semua Kas</option>
            {offices.filter((o) => o !== 'All').map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
        </div>

        {/* Product Filter */}
        <select
          value={selectedProduct}
          onChange={(e) => setSelectedProduct(e.target.value)}
          className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-sm rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        >
          <option value="All">Semua Produk</option>
          {products.filter((p) => p !== 'All').map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>

        {/* Category Filter */}
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-sm rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        >
          <option value="All">Semua Kategori</option>
          {categories.filter((c) => c !== 'All').map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>
    </Card>
  );
};
