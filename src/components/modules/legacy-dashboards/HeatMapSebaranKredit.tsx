import React, { useState } from 'react';
import { 
 Map, 
 MapPin, 
 TrendingUp, 
 TrendingDown, 
 Minus, 
 AlertTriangle, 
 Building2, 
 PieChart, 
 Layers, 
 Compass, 
 Info,
 CheckCircle2
} from 'lucide-react';
import { motion } from 'motion/react';
import { SebaranWilayah } from '../../../types/legacy';

interface HeatMapSebaranKreditProps {
 sebaranList: SebaranWilayah[];
}

export default function HeatMapSebaranKredit({ sebaranList }: HeatMapSebaranKreditProps) {
 const [selectedRegion, setSelectedRegion] = useState<SebaranWilayah | null>(sebaranList[0] || null);
 const [filterTrend, setFilterTrend] = useState<string>('ALL');

 const formatIDR = (val: number) => 
 new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

 const filteredRegions = sebaranList.filter(r => {
 if (filterTrend === 'ALL') return true;
 return r.marketTrend === filterTrend;
 });

 const totalDebiturGlobal = sebaranList.reduce((acc, r) => acc + r.debtorCount, 0);
 const totalPlafonGlobal = sebaranList.reduce((acc, r) => acc + r.totalPlafon, 0);
 const totalNplAvg = (sebaranList.reduce((acc, r) => acc + r.nplPercentage, 0) / sebaranList.length).toFixed(1);

 return (
 <div className="space-y-6">
 
 {/* Header Banner */}
 <div className="glass-effect p-6 rounded-[24px] text-gray-900 dark:text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
 <div>
 <div className="flex items-center gap-2 mb-1">
 <Map size={22} className="" />
 <h2 className="text-xl font-black tracking-tight">B. Heat Map Sebaran Kredit & Analisis Tren Wilayah</h2>
 </div>
 <p className="text-xs max-w-2xl">
 Persebaran debitur dalam bentuk peta (Heat Map) untuk memantau konsentrasi penyaluran kredit BPR ARA, tingkat NPL regional, dan proyeksi harga pasar per kawasan.
 </p>
 </div>

 <div className="bg-white dark:bg-[#111111]/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/20 text-xs font-bold flex items-center gap-3 shrink-0">
 <Compass size={18} className="" />
 <span>Wilayah Aktif: {sebaranList.length} Kabupaten/Kota</span>
 </div>
 </div>

 {/* Global Regional Stats */}
 <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
 <div className="glass-effect p-5 rounded-2xl flex items-center gap-4">
 <div className="p-3 rounded-2xl border">
 <Building2 size={22} />
 </div>
 <div>
 <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Penyaluran Kredit</span>
 <span className="text-lg font-black text-slate-900 dark:text-gray-900 dark:text-white tracking-tight">{formatIDR(totalPlafonGlobal)}</span>
 </div>
 </div>

 <div className="glass-effect p-5 rounded-2xl flex items-center gap-4">
 <div className="p-3 rounded-2xl border">
 <PieChart size={22} />
 </div>
 <div>
 <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Debitur Tersebar</span>
 <span className="text-xl font-black text-slate-900 dark:text-gray-900 dark:text-white tracking-tight">{totalDebiturGlobal} Debitur</span>
 </div>
 </div>

 <div className="glass-effect p-5 rounded-2xl flex items-center gap-4">
 <div className="p-3 rounded-2xl border">
 <TrendingUp size={22} />
 </div>
 <div>
 <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Rata-rata NPL Wilayah</span>
 <span className="text-xl font-black tracking-tight">{totalNplAvg}%</span>
 </div>
 </div>
 </div>

 {/* Regional Risk Warning Banner */}
 <div className="border rounded-[22px] p-4 flex items-start gap-3">
 <AlertTriangle size={20} className="shrink-0 mt-0.5" />
 <div className="text-xs">
 <p className="font-extrabold mb-0.5">Catatan Penting Analisis Wilayah & Taksasi Agunan:</p>
 <p className="leading-relaxed">
 Analisis nilai agunan perlu mempertimbangkan kondisi wilayah. <strong>Hindari menjadikan daerah yang memiliki tren penurunan harga (seperti kawasan rawan genangan banjir berkala) sebagai acuan utama</strong> dalam penentuan Loan to Value (LTV) atau acuan plafon maksimal.
 </p>
 </div>
 </div>

 {/* Main Heat Map Interactive Container */}
 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
 
 {/* Visual Map Canvas / Node Grid */}
 <div className="lg:col-span-2 bg-slate-900 dark:bg-slate-100 rounded-[24px] p-6 text-white dark:text-gray-900 border border-slate-800 shadow-xl flex flex-col justify-between relative overflow-hidden min-h-[420px]">
 
 {/* Map Grid Decorative Background */}
 <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-40" />

 {/* Map Control Bar */}
 <div className="relative z-10 flex items-center justify-between gap-2 mb-4 border-b border-slate-800 pb-3">
 <div className="flex items-center gap-2">
 <Layers size={18} className="" />
 <span className="text-xs font-black tracking-wide uppercase text-slate-300">Peta Sebaran Konsentrasi Kredit (Jawa Barat)</span>
 </div>

 <div className="flex items-center gap-1.5 text-[10px] font-bold">
 <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full animate-pulse" /> Tren Naik</span>
 <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" /> Stabil</span>
 <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" /> Tren Turun</span>
 </div>
 </div>

 {/* Interactive Heat Map Nodes Canvas */}
 <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 my-auto py-4">
 {filteredRegions.map((region) => {
 const isSelected = selectedRegion?.regionId === region.regionId;
 const isTrendDown = region.marketTrend === 'TURUN';
 const isTrendUp = region.marketTrend === 'NAIK';

 const glowColor = isTrendDown 
 ? ' hover:' 
 : isTrendUp 
 ? ' hover:' 
 : ' hover:';

 return (
 <motion.button
 key={region.regionId}
 whileHover={{ scale: 1.02 }}
 whileTap={{ scale: 0.98 }}
 onClick={() => setSelectedRegion(region)}
 className={`p-4 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden backdrop-blur-xs ${glowColor} ${isSelected ? 'ring-2 border-white shadow-lg ' : ''}`}
 >
 {/* Heat indicator pulse */}
 <div className="flex items-center justify-between mb-2">
 <span className="text-xs font-black text-white dark:text-gray-900 flex items-center gap-1.5">
 <MapPin size={14} className={isTrendDown ? '' : isTrendUp ? '' : ''} />
 {region.regionName}
 </span>
 {isTrendUp && <TrendingUp size={14} className="" />}
 {isTrendDown && <TrendingDown size={14} className="" />}
 {region.marketTrend === 'STABIL' && <Minus size={14} className="" />}
 </div>

 <div className="space-y-1 text-[11px]">
 <div className="flex justify-between text-slate-300">
 <span>Plafon:</span>
 <strong className="text-white dark:text-gray-900">{formatIDR(region.totalPlafon)}</strong>
 </div>
 <div className="flex justify-between text-slate-300">
 <span>Debitur:</span>
 <strong className="text-white dark:text-gray-900">{region.debtorCount} Org</strong>
 </div>
 <div className="flex justify-between text-slate-300">
 <span>NPL Regional:</span>
 <strong className={region.nplPercentage > 3.5 ? ' font-extrabold' : ' font-extrabold'}>
 {region.nplPercentage}%
 </strong>
 </div>
 </div>

 {isTrendDown && (
 <div className="mt-2 text-[9px] font-bold /20 px-2 py-0.5 rounded border flex items-center gap-1">
 <AlertTriangle size={10} /> Riski Agunan (Pasar Tertekan)
 </div>
 )}
 </motion.button>
 );
 })}
 </div>

 <div className="relative z-10 text-[10px] text-slate-400 border-t border-slate-800 pt-3 flex items-center justify-between">
 <span>Klik pada kotak wilayah untuk melihat rincian evaluasi kredit.</span>
 <span>Update Real-time BPR ARA GIS</span>
 </div>
 </div>

 {/* Selected Region Detailed Card */}
 <div className="bg-white dark:bg-[#111111] rounded-[24px] p-6 border border-slate-200 dark:border-white/10/80 shadow-sm dark:shadow-none flex flex-col justify-between">
 {selectedRegion ? (
 <div className="space-y-5">
 <div className="border-b border-slate-100 pb-3">
 <span className="text-[10px] font-bold uppercase tracking-wider block">Detail Evaluasi Wilayah</span>
 <h3 className="text-lg font-black text-slate-900 dark:text-gray-900 dark:text-white flex items-center gap-2">
 <MapPin size={18} className="" />
 {selectedRegion.regionName}
 </h3>
 </div>

 <div className="space-y-3 text-xs">
 <div className="flex justify-between p-2.5 bg-slate-50 dark:bg-white/5 rounded-xl">
 <span className="text-slate-500 dark:text-gray-400 font-medium">Total Debitur Active:</span>
 <strong className="text-slate-900 dark:text-gray-900 dark:text-white font-bold">{selectedRegion.debtorCount} Debitur</strong>
 </div>

 <div className="flex justify-between p-2.5 bg-slate-50 dark:bg-white/5 rounded-xl">
 <span className="text-slate-500 dark:text-gray-400 font-medium">Total Portofolio Penyaluran:</span>
 <strong className="text-slate-900 dark:text-gray-900 dark:text-white font-bold">{formatIDR(selectedRegion.totalPlafon)}</strong>
 </div>

 <div className="flex justify-between p-2.5 bg-slate-50 dark:bg-white/5 rounded-xl">
 <span className="text-slate-500 dark:text-gray-400 font-medium">Rasio NPL Wilayah:</span>
 <strong className={`font-extrabold ${selectedRegion.nplPercentage > 3.5 ? '' : ''}`}>
 {selectedRegion.nplPercentage}%
 </strong>
 </div>

 <div className="flex justify-between p-2.5 bg-slate-50 dark:bg-white/5 rounded-xl items-center">
 <span className="text-slate-500 dark:text-gray-400 font-medium">Tren Nilai Properti / Pasar:</span>
 <span className={`font-bold px-2 py-0.5 rounded text-[10px] ${selectedRegion.marketTrend === 'NAIK' ? ' border ' : selectedRegion.marketTrend === 'TURUN' ? ' border ' : ' border '}`}>
 {selectedRegion.marketTrend === 'NAIK' ? 'Tren Naik (Positif)' : selectedRegion.marketTrend === 'TURUN' ? 'Tren Penurunan Harga' : 'Harga Stabil'}
 </span>
 </div>
 </div>

 <div className="p-3.5 rounded-2xl /70 border text-xs space-y-1">
 <span className="font-extrabold block flex items-center gap-1">
 <Info size={14} className="" /> Analisis Pasar Regional:
 </span>
 <p className="leading-relaxed text-slate-700 dark:text-gray-200 text-[11px]">
 {selectedRegion.marketTrendDescription}
 </p>
 </div>

 {selectedRegion.marketTrend === 'TURUN' && (
 <div className="p-3.5 rounded-2xl border text-xs space-y-1">
 <span className="font-extrabold block flex items-center gap-1">
 <AlertTriangle size={14} className="" /> Rekomendasi Komite Kredit:
 </span>
 <p className="leading-relaxed text-[11px]">
 Hindari menggunakan harga tertinggi di kawasan ini sebagai acuan utama appraisal. Disarankan pemotongan Safety Margin minimal 20-30% pada nilai taksasi likuidasi agunan.
 </p>
 </div>
 )}
 </div>
 ) : (
 <div className="text-center py-12 text-slate-400">
 Pilih wilayah dari peta di sebelah kiri untuk melihat rincian.
 </div>
 )}
 </div>

 </div>

 </div>
 );
}
