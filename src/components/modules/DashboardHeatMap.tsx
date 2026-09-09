import React, { useState } from 'react';
import { 
  Coins as BanknotesIcon, 
  Users as UserGroupIcon, 
  FileText as DocumentTextIcon, 
  AlertTriangle as ExclamationTriangleIcon, 
  BarChart3 as ChartBarIcon, 
  MapPin as MapPinIcon,
  Briefcase as BriefcaseIcon,
  TrendingUp as ArrowTrendingUpIcon,
  ChevronDown as ChevronDownIcon
} from 'lucide-react';

// Mock Data for the Map Colors
const WILAYAH_COLORS = {
  Karanganyar: '#f43f5e', // Sangat Tinggi (Merah)
  Sragen: '#f97316',      // Tinggi (Oranye)
  Sukoharjo: '#fbbf24',   // Sedang (Kuning)
  Wonogiri: '#4ade80',    // Rendah (Hijau)
  Klaten: '#4ade80',      // Rendah (Hijau)
  Boyolali: '#4ade80',    // Rendah (Hijau)
  Surakarta: '#ef4444',   // Sangat Tinggi (Merah)
};

const SEKTOR_COLORS = {
  Karanganyar: '#f97316', 
  Sragen: '#fbbf24',      
  Sukoharjo: '#f97316',   
  Wonogiri: '#4ade80',    
  Klaten: '#fbbf24',      
  Boyolali: '#4ade80',    
  Surakarta: '#ef4444',   
};

const TUJUAN_COLORS = {
  Karanganyar: '#f97316', 
  Sragen: '#fbbf24',      
  Sukoharjo: '#f97316',   
  Wonogiri: '#4ade80',    
  Klaten: '#fbbf24',      
  Boyolali: '#4ade80',    
  Surakarta: '#ef4444',   
};

// SVG Component representing the Map
const SurakartaMap = ({ colors }: { colors: Record<string, string> }) => {
  return (
    <div className="relative w-full aspect-[4/3] flex items-center justify-center bg-gray-50/50 dark:bg-gray-800/30 rounded-xl overflow-hidden">
      <svg viewBox="0 0 400 300" className="w-full h-full drop-shadow-md">
        {/* Simple Abstract Map Polygons representing Surakarta region */}
        <g stroke="#ffffff" strokeWidth="2" strokeLinejoin="round">
          {/* Boyolali (Top Left) */}
          <path d="M 50 150 L 80 80 L 160 90 L 180 140 L 120 180 Z" fill={colors['Boyolali']} />
          <text x="110" y="130" fill="#fff" fontSize="10" fontWeight="bold" textAnchor="middle" style={{textShadow: '0 1px 2px rgba(0,0,0,0.5)'}}>Boyolali</text>
          
          {/* Klaten (Bottom Left) */}
          <path d="M 50 150 L 120 180 L 140 240 L 80 260 L 40 200 Z" fill={colors['Klaten']} />
          <text x="90" y="210" fill="#fff" fontSize="10" fontWeight="bold" textAnchor="middle" style={{textShadow: '0 1px 2px rgba(0,0,0,0.5)'}}>Klaten</text>
          
          {/* Sragen (Top Right) */}
          <path d="M 160 90 L 250 70 L 320 100 L 280 160 L 210 130 Z" fill={colors['Sragen']} />
          <text x="240" y="115" fill="#fff" fontSize="10" fontWeight="bold" textAnchor="middle" style={{textShadow: '0 1px 2px rgba(0,0,0,0.5)'}}>Sragen</text>
          
          {/* Surakarta (Center) */}
          <circle cx="195" cy="155" r="25" fill={colors['Surakarta']} />
          <text x="195" y="158" fill="#fff" fontSize="10" fontWeight="bold" textAnchor="middle" style={{textShadow: '0 1px 2px rgba(0,0,0,0.5)'}}>Surakarta</text>
          
          {/* Sukoharjo (Bottom Center) */}
          <path d="M 175 175 L 215 175 L 240 220 L 190 270 L 140 240 Z" fill={colors['Sukoharjo']} />
          <text x="190" y="225" fill="#fff" fontSize="10" fontWeight="bold" textAnchor="middle" style={{textShadow: '0 1px 2px rgba(0,0,0,0.5)'}}>Sukoharjo</text>
          
          {/* Karanganyar (Right) */}
          <path d="M 210 130 L 280 160 L 340 180 L 330 230 L 240 220 L 215 175 Z" fill={colors['Karanganyar']} />
          <text x="275" y="190" fill="#fff" fontSize="10" fontWeight="bold" textAnchor="middle" style={{textShadow: '0 1px 2px rgba(0,0,0,0.5)'}}>Karanganyar</text>
          
          {/* Wonogiri (Bottom Right) */}
          <path d="M 190 270 L 240 220 L 330 230 L 300 290 L 220 295 Z" fill={colors['Wonogiri']} />
          <text x="260" y="265" fill="#fff" fontSize="10" fontWeight="bold" textAnchor="middle" style={{textShadow: '0 1px 2px rgba(0,0,0,0.5)'}}>Wonogiri</text>
        </g>
      </svg>
      
      {/* Zoom Controls */}
      <div className="absolute bottom-4 left-4 flex flex-col bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
        <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 border-b border-gray-200 dark:border-gray-700 font-bold">+</button>
        <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 font-bold">-</button>
      </div>
      <div className="absolute top-4 right-4 bg-white dark:bg-gray-800 p-1.5 rounded-full shadow border border-gray-200 dark:border-gray-700">
        <MapPinIcon className="w-4 h-4 text-gray-500" />
      </div>
    </div>
  );
};

export const DashboardHeatMap: React.FC = () => {
  const [activeTab, setActiveTab] = useState('Daftar Nasabah Bermasalah');

  // Stats Data
  const stats = [
    { label: 'Total Pembiayaan', value: 'Rp 487.250.000.000', icon: BanknotesIcon, trend: '+12,5%', trendUp: true, bg: 'bg-blue-50 dark:bg-blue-900/20', color: 'text-blue-600 dark:text-blue-400' },
    { label: 'Total Nasabah', value: '3.482', icon: UserGroupIcon, trend: '+8,3%', trendUp: true, bg: 'bg-indigo-50 dark:bg-indigo-900/20', color: 'text-indigo-600 dark:text-indigo-400' },
    { label: 'Baki Debet', value: 'Rp 426.780.000.000', icon: DocumentTextIcon, trend: null, bg: 'bg-cyan-50 dark:bg-cyan-900/20', color: 'text-cyan-600 dark:text-cyan-400' },
    { label: 'Nasabah Bermasalah', value: '412', icon: ExclamationTriangleIcon, trend: '+6,2%', trendUp: false, bg: 'bg-red-50 dark:bg-red-900/20', color: 'text-red-600 dark:text-red-400' },
    { label: 'Rasio Bermasalah', value: '11,8%', icon: ChartBarIcon, trend: '+2,1%', trendUp: false, bg: 'bg-blue-50 dark:bg-blue-900/20', color: 'text-blue-600 dark:text-blue-400' },
    { label: 'Baki Debet Bermasalah', value: 'Rp 68.420.000.000', icon: BanknotesIcon, trend: '+14,3%', trendUp: false, bg: 'bg-blue-50 dark:bg-blue-900/20', color: 'text-blue-800 dark:text-blue-400' },
  ];

  return (
    <div className="w-full h-full p-4 sm:p-6 lg:p-8 overflow-y-auto space-y-6">
      
      {/* Title & Filters */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-800 dark:text-gray-100 tracking-tight">
            Dashboard Heat Map & Risiko Pembiayaan
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Analisis Persebaran Pembiayaan, Nasabah Bermasalah, dan Kontribusi AO Karesidenan Surakarta
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {['Periode: Jan 2024 - Des 2024', 'Cabang: Semua Cabang', 'AO: Semua AO', 'Kabupaten: Semua Kabupaten', 'Kecamatan: Semua Kecamatan'].map((filter, i) => (
            <button key={i} className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-semibold text-gray-600 dark:text-gray-300 shadow-sm hover:bg-gray-50 transition-colors">
              {filter.split(': ')[0] === 'Periode' ? <ChartBarIcon className="w-3.5 h-3.5"/> : <MapPinIcon className="w-3.5 h-3.5"/>}
              <div className="flex flex-col items-start leading-none">
                <span className="text-[9px] text-gray-400">{filter.split(': ')[0]}</span>
                <span>{filter.split(': ')[1]}</span>
              </div>
              <ChevronDownIcon className="w-3 h-3 ml-1" />
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/50 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-xs font-semibold">
              <div className={`p-1.5 rounded-lg ${stat.bg} ${stat.color}`}>
                <stat.icon className="w-4 h-4" />
              </div>
              {stat.label}
            </div>
            <div className="text-lg sm:text-xl font-black text-gray-800 dark:text-gray-100">
              {stat.value}
            </div>
            {stat.trend && (
              <div className={`text-[10px] font-bold flex items-center gap-1 ${stat.trendUp ? 'text-emerald-500' : 'text-red-500'}`}>
                <ArrowTrendingUpIcon className={`w-3 h-3 ${stat.trendUp ? '' : 'rotate-180'}`} />
                {stat.trend} dari periode sebelumnya
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 3 Heat Maps Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Heat Map 1 */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/50 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                <MapPinIcon className="w-4 h-4 text-blue-500" />
                1. Heat Map Wilayah (Rasio Nasabah Bermasalah)
              </h3>
              <p className="text-[10px] text-gray-500 mt-1">Sebaran tingkat risiko nasabah bermasalah di wilayah Karesidenan Surakarta</p>
            </div>
          </div>
          
          <div className="flex items-center justify-center gap-4 text-[9px] font-bold text-gray-500 mb-4">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#4ade80]"></span> Rendah</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#fbbf24]"></span> Sedang</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#f97316]"></span> Tinggi</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#ef4444]"></span> Sangat Tinggi</span>
          </div>

          <div className="flex flex-col lg:flex-row gap-4 items-center">
            <div className="w-full lg:w-1/2">
              <SurakartaMap colors={WILAYAH_COLORS} />
            </div>
            <div className="w-full lg:w-1/2 space-y-2.5">
              <h4 className="text-[10px] font-bold text-gray-700 dark:text-gray-300">Rasio Bermasalah per Kabupaten</h4>
              {[
                { name: 'Karanganyar', val: '18,4%', color: 'bg-rose-500 text-rose-500' },
                { name: 'Sragen', val: '14,2%', color: 'bg-orange-500 text-orange-500' },
                { name: 'Sukoharjo', val: '11,9%', color: 'bg-amber-400 text-amber-500' },
                { name: 'Wonogiri', val: '9,6%', color: 'bg-emerald-400 text-emerald-500' },
                { name: 'Klaten', val: '8,7%', color: 'bg-emerald-400 text-emerald-500' },
                { name: 'Boyolali', val: '7,3%', color: 'bg-emerald-400 text-emerald-500' },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-sm ${item.color.split(' ')[0]}`}></span>
                    <span className="text-gray-600 dark:text-gray-400 font-medium">{item.name}</span>
                  </div>
                  <span className={`font-bold ${item.color.split(' ')[1]}`}>{item.val}</span>
                </div>
              ))}
              <button className="text-[10px] text-blue-500 font-bold hover:underline w-full text-left mt-2">Klik wilayah untuk detail</button>
            </div>
          </div>
        </div>

        {/* Heat Map 2 */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/50 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                <BriefcaseIcon className="w-4 h-4 text-indigo-500" />
                2. Heat Map Sektor
              </h3>
              <p className="text-[10px] text-gray-500 mt-1">Kontribusi jumlah nasabah bermasalah per sektor usaha</p>
            </div>
          </div>
          
          <div className="flex items-center justify-center gap-4 text-[9px] font-bold text-gray-500 mb-4">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#4ade80]"></span> Rendah</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#fbbf24]"></span> Sedang</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#f97316]"></span> Tinggi</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#ef4444]"></span> Sangat Tinggi</span>
          </div>

          <div className="flex flex-col lg:flex-row gap-4 items-center">
            <div className="w-full lg:w-1/2">
              <SurakartaMap colors={SEKTOR_COLORS} />
            </div>
            <div className="w-full lg:w-1/2 space-y-2.5">
              <h4 className="text-[10px] font-bold text-gray-700 dark:text-gray-300">Sektor dengan Risiko Tertinggi</h4>
              {[
                { name: 'Perdagangan', val: '21,7%', color: 'text-rose-500', icon: '🛒' },
                { name: 'Pertanian', val: '16,3%', color: 'text-orange-500', icon: '🌾' },
                { name: 'Jasa', val: '13,2%', color: 'text-amber-500', icon: '🔧' },
                { name: 'Industri Pengolahan', val: '11,5%', color: 'text-amber-500', icon: '🏭' },
                { name: 'Konstruksi', val: '9,8%', color: 'text-emerald-500', icon: '🏗️' },
                { name: 'Transportasi & ...', val: '7,4%', color: 'text-emerald-500', icon: '🚚' },
                { name: 'Lainnya', val: '6,1%', color: 'text-emerald-500', icon: '📦' },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px]">{item.icon}</span>
                    <span className="text-gray-600 dark:text-gray-400 font-medium truncate max-w-[90px]">{item.name}</span>
                  </div>
                  <span className={`font-bold ${item.color}`}>{item.val}</span>
                </div>
              ))}
              <button className="text-[10px] text-blue-500 font-bold hover:underline w-full text-left mt-2">Klik sektor untuk detail</button>
            </div>
          </div>
        </div>

        {/* Heat Map 3 */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/50 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                <DocumentTextIcon className="w-4 h-4 text-cyan-500" />
                3. Heat Map Tujuan Pembiayaan
              </h3>
              <p className="text-[10px] text-gray-500 mt-1">Rasio nasabah bermasalah berdasarkan tujuan penggunaan dana</p>
            </div>
          </div>
          
          <div className="flex items-center justify-center gap-4 text-[9px] font-bold text-gray-500 mb-4">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#4ade80]"></span> Rendah</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#fbbf24]"></span> Sedang</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#f97316]"></span> Tinggi</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#ef4444]"></span> Sangat Tinggi</span>
          </div>

          <div className="flex flex-col lg:flex-row gap-4 items-center">
            <div className="w-full lg:w-1/2">
              <SurakartaMap colors={TUJUAN_COLORS} />
            </div>
            <div className="w-full lg:w-1/2 space-y-2.5">
              <h4 className="text-[10px] font-bold text-gray-700 dark:text-gray-300">Tujuan dengan Risiko Tertinggi</h4>
              {[
                { name: 'Modal Kerja', val: '20,5%', color: 'text-rose-500', icon: '💰' },
                { name: 'Investasi', val: '15,7%', color: 'text-orange-500', icon: '📈' },
                { name: 'Konsumsi Produktif', val: '11,9%', color: 'text-amber-500', icon: '🛍️' },
                { name: 'Pembelian Aset', val: '8,6%', color: 'text-emerald-500', icon: '🏠' },
                { name: 'Refinancing', val: '6,8%', color: 'text-emerald-500', icon: '🔄' },
                { name: 'Lainnya', val: '5,4%', color: 'text-emerald-500', icon: '📦' },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px]">{item.icon}</span>
                    <span className="text-gray-600 dark:text-gray-400 font-medium truncate max-w-[90px]">{item.name}</span>
                  </div>
                  <span className={`font-bold ${item.color}`}>{item.val}</span>
                </div>
              ))}
              <button className="text-[10px] text-blue-500 font-bold hover:underline w-full text-left mt-2">Klik tujuan untuk detail</button>
            </div>
          </div>
        </div>
      </div>

      {/* Tables and Matrix Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Heat Map Wilayah Table */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/50 p-5 col-span-1">
          <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100 mb-1">Heat Map Nasabah Bermasalah per Wilayah</h3>
          <p className="text-[10px] text-gray-500 mb-4">Semakin merah warna, semakin tinggi jumlah nasabah bermasalah</p>
          
          <div className="flex flex-col gap-4">
            <div className="w-full flex justify-center mb-2">
               <div className="w-1/2 aspect-[4/3]">
                 <SurakartaMap colors={WILAYAH_COLORS} />
               </div>
            </div>
            <div className="w-full">
              <table className="w-full text-left text-xs text-gray-600 dark:text-gray-400">
                <thead className="text-[10px] font-bold text-gray-500 border-b border-gray-100 dark:border-gray-800">
                  <tr>
                    <th className="pb-2">Kabupaten/Kota</th>
                    <th className="pb-2 text-center">Jumlah Nasabah<br/>Bermasalah</th>
                    <th className="pb-2 text-center">Rasio<br/>Bermasalah</th>
                    <th className="pb-2 text-right">Baki Debet<br/>Bermasalah</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
                  {[
                    { name: 'Karanganyar', n: 126, r: '18,4%', b: 'Rp 18,7 M', color: 'bg-rose-500 text-rose-500' },
                    { name: 'Sragen', n: 98, r: '14,2%', b: 'Rp 13,4 M', color: 'bg-orange-500 text-orange-500' },
                    { name: 'Sukoharjo', n: 72, r: '11,9%', b: 'Rp 10,8 M', color: 'bg-amber-400 text-amber-500' },
                    { name: 'Wonogiri', n: 48, r: '9,6%', b: 'Rp 6,7 M', color: 'bg-emerald-400 text-emerald-500' },
                    { name: 'Klaten', n: 45, r: '8,7%', b: 'Rp 5,9 M', color: 'bg-emerald-400 text-emerald-500' },
                    { name: 'Boyolali', n: 38, r: '7,3%', b: 'Rp 4,8 M', color: 'bg-emerald-400 text-emerald-500' },
                  ].map((row, i) => (
                    <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="py-2.5">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-sm ${row.color.split(' ')[0]}`}></span>
                          <span className="font-semibold text-gray-800 dark:text-gray-200">{row.name}</span>
                        </div>
                      </td>
                      <td className={`py-2.5 text-center font-bold ${row.color.split(' ')[1]}`}>{row.n}</td>
                      <td className={`py-2.5 text-center font-bold ${row.color.split(' ')[1]}`}>{row.r}</td>
                      <td className="py-2.5 text-right font-medium">{row.b}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* AO Ranking */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/50 p-5 col-span-1">
          <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100 mb-1 flex items-center gap-2">
            <DocumentTextIcon className="w-4 h-4 text-blue-500" />
            Ranking AO (Kontribusi Nasabah Bermasalah)
          </h3>
          <p className="text-[10px] text-gray-500 mb-4">&nbsp;</p>
          
          <table className="w-full text-left text-xs text-gray-600 dark:text-gray-400">
            <thead className="text-[10px] font-bold text-gray-500 border-b border-gray-100 dark:border-gray-800">
              <tr>
                <th className="pb-2">Peringkat</th>
                <th className="pb-2">AO</th>
                <th className="pb-2 text-center">Total<br/>Nasabah</th>
                <th className="pb-2 text-center">Bermasalah</th>
                <th className="pb-2 text-center">Rasio</th>
                <th className="pb-2 text-right">Baki Debet<br/>Bermasalah</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
              {[
                { p: 1, ao: 'Deddie', t: 520, b: 112, r: 21.5, bd: 'Rp 15,8 M', color: 'bg-rose-500' },
                { p: 2, ao: 'Wahid Budi S.', t: 480, b: 86, r: 17.9, bd: 'Rp 12,4 M', color: 'bg-orange-500' },
                { p: 3, ao: 'B Windra', t: 430, b: 72, r: 16.7, bd: 'Rp 9,8 M', color: 'bg-orange-400' },
                { p: 4, ao: 'Ariyanto', t: 390, b: 58, r: 14.9, bd: 'Rp 7,6 M', color: 'bg-amber-400' },
                { p: 5, ao: 'Tri Surono', t: 360, b: 49, r: 13.6, bd: 'Rp 6,2 M', color: 'bg-emerald-400' },
                { p: 6, ao: 'Lainnya', t: 1302, b: 135, r: 10.4, bd: 'Rp 16,7 M', color: 'bg-emerald-400' },
              ].map((row, i) => (
                <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="py-3 text-center">{row.p}</td>
                  <td className="py-3 font-semibold text-gray-800 dark:text-gray-200">{row.ao}</td>
                  <td className="py-3 text-center">{row.t}</td>
                  <td className="py-3 text-center font-bold">{row.b}</td>
                  <td className="py-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="w-12 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div className={`h-full ${row.color}`} style={{ width: `${row.r}%` }}></div>
                      </div>
                      <span className="text-[10px] font-bold">{row.r.toFixed(1).replace('.', ',')}%</span>
                    </div>
                  </td>
                  <td className="py-3 text-right font-medium">{row.bd}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Risk Matrix */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/50 p-5 col-span-1">
          <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100 mb-1 flex items-center gap-2">
            <ChartBarIcon className="w-4 h-4 text-blue-500" />
            Risk Matrix (Wilayah x Nominal vs Rasio)
          </h3>
          <p className="text-[10px] text-gray-500 mb-6">&nbsp;</p>
          
          <div className="relative w-full aspect-square max-w-[300px] mx-auto flex flex-col items-center justify-center p-6 border-l-2 border-b-2 border-gray-300 dark:border-gray-600 mt-4">
            {/* Axis Labels */}
            <div className="absolute -left-6 top-1/2 -translate-y-1/2 -rotate-90 text-[10px] font-bold text-gray-500">
              Rasio Bermasalah
            </div>
            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-bold text-gray-500">
              Nominal Bermasalah (Baki Debet)
            </div>
            
            {/* Axis Scales */}
            <div className="absolute -left-1 top-0 text-[9px] text-gray-400 -translate-x-full">Tinggi</div>
            <div className="absolute -left-1 bottom-0 text-[9px] text-gray-400 -translate-x-full">Rendah</div>
            <div className="absolute left-0 -bottom-1 text-[9px] text-gray-400 translate-y-full">Rendah</div>
            <div className="absolute right-0 -bottom-1 text-[9px] text-gray-400 translate-y-full">Tinggi</div>

            {/* 4 Quadrants Grid */}
            <div className="grid grid-cols-2 grid-rows-2 w-full h-full gap-1">
              {/* Q2: Waspada (High Ratio, Low Nominal) */}
              <div className="bg-orange-400/80 rounded-tl-lg flex flex-col items-center justify-center p-2 text-center hover:bg-orange-500 transition-colors cursor-pointer group relative">
                <span className="text-white font-black text-xs">Waspada</span>
                <span className="text-white/90 font-medium text-[9px] mt-1">Sragen, Sukoharjo</span>
                <div className="absolute inset-0 border-2 border-transparent group-hover:border-white rounded-tl-lg"></div>
              </div>
              
              {/* Q1: Prioritas (High Ratio, High Nominal) */}
              <div className="bg-rose-500/90 rounded-tr-lg flex flex-col items-center justify-center p-2 text-center hover:bg-rose-600 transition-colors cursor-pointer group relative">
                <span className="text-white font-black text-xs">Prioritas</span>
                <span className="text-white/90 font-medium text-[9px] mt-1">Karanganyar</span>
                <div className="absolute inset-0 border-2 border-transparent group-hover:border-white rounded-tr-lg"></div>
              </div>
              
              {/* Q3: Sehat (Low Ratio, Low Nominal) */}
              <div className="bg-emerald-400/80 rounded-bl-lg flex flex-col items-center justify-center p-2 text-center hover:bg-emerald-500 transition-colors cursor-pointer group relative">
                <span className="text-white font-black text-xs">Sehat</span>
                <span className="text-white/90 font-medium text-[9px] mt-1">Wonogiri, Klaten, Boyolali</span>
                <div className="absolute inset-0 border-2 border-transparent group-hover:border-white rounded-bl-lg"></div>
              </div>
              
              {/* Q4: Monitor (Low Ratio, High Nominal) */}
              <div className="bg-amber-400/80 rounded-br-lg flex flex-col items-center justify-center p-2 text-center hover:bg-amber-500 transition-colors cursor-pointer group relative">
                <span className="text-white font-black text-xs">Monitor</span>
                <span className="text-white/90 font-medium text-[9px] mt-1">(Portfolio besar)<br/>Surakarta</span>
                <div className="absolute inset-0 border-2 border-transparent group-hover:border-white rounded-br-lg"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detail Table Container */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/50 overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-gray-100 dark:border-gray-800 overflow-x-auto">
          {['Daftar Nasabah Bermasalah', 'Detail per Wilayah', 'Detail per AO', 'Detail per Sektor', 'Detail per Tujuan'].map((tab) => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3.5 text-xs font-bold whitespace-nowrap transition-colors border-b-2 ${activeTab === tab ? 'border-blue-600 text-blue-600 bg-blue-50/50 dark:bg-blue-900/10 dark:border-blue-500 dark:text-blue-400' : 'border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 dark:hover:text-gray-300'}`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-0 overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
            <thead className="text-[10px] font-bold text-gray-500 bg-gray-50/50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-800">
              <tr>
                <th className="py-3 px-4">No</th>
                <th className="py-3 px-4">Kabupaten</th>
                <th className="py-3 px-4">Kecamatan</th>
                <th className="py-3 px-4">AO</th>
                <th className="py-3 px-4">Nama Nasabah</th>
                <th className="py-3 px-4 text-center">Kolek</th>
                <th className="py-3 px-4 text-right">Baki Debet</th>
                <th className="py-3 px-4 text-right">Tunggakan</th>
                <th className="py-3 px-4 text-right">Jumlah Tagihan</th>
                <th className="py-3 px-4 text-right">Jumlah Angsuran</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
              {[
                { no: 1, kab: 'Karanganyar', kec: 'Karangpandan', ao: 'Deddie', nama: 'SRI MULYANI', kol: 'M', bd: 'Rp 75.000.000', tung: 'Rp 12.500.000', tgh: 'Rp 12.500.000', angs: 'Rp 2.800.000' },
                { no: 2, kab: 'Karanganyar', kec: 'Matesih', ao: 'Deddie', nama: 'AGUS SETIAWAN', kol: 'D', bd: 'Rp 120.000.000', tung: 'Rp 8.750.000', tgh: 'Rp 8.750.000', angs: 'Rp 3.200.000' },
                { no: 3, kab: 'Sragen', kec: 'Gesi', ao: 'Wahid Budi S.', nama: 'BUDI SANTOSO', kol: 'M', bd: 'Rp 95.000.000', tung: 'Rp 6.400.000', tgh: 'Rp 6.400.000', angs: 'Rp 2.100.000' },
                { no: 4, kab: 'Sukoharjo', kec: 'Grogol', ao: 'B Windra', nama: 'ENDANG LESTARI', kol: 'D', bd: 'Rp 80.000.000', tung: 'Rp 5.200.000', tgh: 'Rp 5.200.000', angs: 'Rp 1.900.000' },
                { no: 5, kab: 'Wonogiri', kec: 'Wuryantoro', ao: 'Ariyanto', nama: 'JOKO SUSILO', kol: 'L', bd: 'Rp 60.000.000', tung: 'Rp 4.800.000', tgh: 'Rp 4.800.000', angs: 'Rp 1.500.000' },
                { no: 6, kab: 'Klaten', kec: 'Delanggu', ao: 'Tri Surono', nama: 'SUTRISNO', kol: 'M', bd: 'Rp 55.000.000', tung: 'Rp 3.900.000', tgh: 'Rp 3.900.000', angs: 'Rp 1.200.000' },
                { no: 7, kab: 'Boyolali', kec: 'Simo', ao: 'Wahid Budi S.', nama: 'SUWARNO', kol: 'D', bd: 'Rp 48.000.000', tung: 'Rp 3.200.000', tgh: 'Rp 3.200.000', angs: 'Rp 1.000.000' },
                { no: 8, kab: 'Surakarta', kec: 'Jebres', ao: 'Deddie', nama: 'RINA WATI', kol: 'M', bd: 'Rp 42.000.000', tung: 'Rp 2.800.000', tgh: 'Rp 2.800.000', angs: 'Rp 900.000' },
              ].map((row, i) => (
                <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="py-3 px-4">{row.no}</td>
                  <td className="py-3 px-4">{row.kab}</td>
                  <td className="py-3 px-4">{row.kec}</td>
                  <td className="py-3 px-4">{row.ao}</td>
                  <td className="py-3 px-4 font-bold text-gray-800 dark:text-gray-200">{row.nama}</td>
                  <td className="py-3 px-4 text-center font-bold text-gray-800 dark:text-gray-200">{row.kol}</td>
                  <td className="py-3 px-4 text-right font-medium">{row.bd}</td>
                  <td className="py-3 px-4 text-right font-medium">{row.tung}</td>
                  <td className="py-3 px-4 text-right font-medium">{row.tgh}</td>
                  <td className="py-3 px-4 text-right font-medium">{row.angs}</td>
                  <td className="py-3 px-4 text-center">
                    <button className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold rounded shadow-sm transition-colors">
                      Lihat
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
