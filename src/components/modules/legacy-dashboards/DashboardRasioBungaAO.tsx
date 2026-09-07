import React, { useState } from 'react';
import { 
 Percent, 
 TrendingUp, 
 Award, 
 DollarSign, 
 UserCheck, 
 BarChart3, 
 ArrowUpRight, 
 ArrowDownRight,
 Plus,
 X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AOPendapatanBunga } from '../../../types/legacy';

interface DashboardRasioBungaAOProps {
 bungaList: AOPendapatanBunga[];
 onAddBunga: (item: AOPendapatanBunga) => void;
}

export default function DashboardRasioBungaAO({ bungaList, onAddBunga }: DashboardRasioBungaAOProps) {
 const [isAddModalOpen, setIsAddModalOpen] = useState(false);
 const [newForm, setNewForm] = useState({
 aoName: '',
 branch: 'Cabang Utama Bandung',
 targetBunga: 40000000,
 realisasiBunga: 38000000,
 month: 'Juli 2026'
 });

 const formatIDR = (val: number) => 
 new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

 const totalTarget = bungaList.reduce((acc, curr) => acc + curr.targetBunga, 0);
 const totalRealisasi = bungaList.reduce((acc, curr) => acc + curr.realisasiBunga, 0);
 const avgAchieve = totalTarget > 0 ? ((totalRealisasi / totalTarget) * 100).toFixed(1) : '0';

 const sortedList = [...bungaList].sort((a, b) => {
 const achA = (a.realisasiBunga / a.targetBunga) * 100;
 const achB = (b.realisasiBunga / b.targetBunga) * 100;
 return achB - achA;
 });

 const topAO = sortedList[0];

 const handleSaveNew = () => {
 if (!newForm.aoName) return;
 onAddBunga(newForm);
 setIsAddModalOpen(false);
 setNewForm({
 aoName: '',
 branch: 'Cabang Utama Bandung',
 targetBunga: 40000000,
 realisasiBunga: 38000000,
 month: 'Juli 2026'
 });
 };

 return (
 <div className="space-y-6">
 
 {/* Header Banner */}
 <div className="bg-surface shadow-md p-6 rounded-[24px] text-foreground shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
 <div>
 <div className="flex items-center gap-2 mb-1">
 <Percent size={22} className="text-primary" />
 <h2 className="text-xl font-black tracking-tight">B. Rasio Target Bunga per AO (Interest Income KPI)</h2>
 </div>
 <p className="text-xs max-w-2xl">
 Menampilkan perbandingan target dan realisasi pendapatan bunga untuk masing-masing Account Officer (AO) BPR ARA sebagai indikator pencapaian kinerja bulanan.
 </p>
 </div>

 <button
 onClick={() => setIsAddModalOpen(true)}
 className="bg-surface/10 hover:bg-surface/20 text-foreground border border-primary-light/20 font-bold text-xs px-4 py-2.5 rounded-2xl flex items-center gap-2 transition-all cursor-pointer shadow-sm dark:shadow-none shrink-0"
 >
 <Plus size={16} />
 Input Target Bunga AO
 </button>
 </div>

 {/* Summary KPI Cards */}
 <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
 
 <div className="bg-surface shadow-md p-5 rounded-2xl flex items-center gap-4">
 <div className="p-3 rounded-2xl border">
 <DollarSign size={22} />
 </div>
 <div>
 <span className="text-[11px] font-bold text-muted uppercase tracking-wider block">Total Target Bunga</span>
 <span className="text-lg font-black text-foreground dark:text-foreground tracking-tight">{formatIDR(totalTarget)}</span>
 </div>
 </div>

 <div className="bg-surface shadow-md p-5 rounded-2xl flex items-center gap-4">
 <div className="p-3 rounded-2xl border">
 <TrendingUp size={22} />
 </div>
 <div>
 <span className="text-[11px] font-bold text-muted uppercase tracking-wider block">Total Realisasi Bunga</span>
 <span className="text-lg font-black tracking-tight">{formatIDR(totalRealisasi)}</span>
 </div>
 </div>

 <div className="bg-surface shadow-md p-5 rounded-2xl flex items-center gap-4">
 <div className="p-3 rounded-2xl border">
 <Percent size={22} />
 </div>
 <div>
 <span className="text-[11px] font-bold text-muted uppercase tracking-wider block">Pencapaian Rata-Rata</span>
 <span className="text-xl font-black tracking-tight">{avgAchieve}%</span>
 </div>
 </div>

 <div className="bg-surface shadow-md p-5 rounded-2xl flex items-center gap-4">
 <div className="p-3 rounded-2xl border">
 <Award size={22} />
 </div>
 <div>
 <span className="text-[11px] font-bold text-muted uppercase tracking-wider block">Top AO Bunga</span>
 <span className="text-sm font-black text-foreground dark:text-foreground tracking-tight block truncate">{topAO?.aoName || '-'}</span>
 </div>
 </div>

 </div>

 {/* Main AO Bunga Grid */}
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 {sortedList.map((item, idx) => {
 const achPercentage = item.targetBunga > 0 ? (item.realisasiBunga / item.targetBunga) * 100 : 0;
 const isSurplus = item.realisasiBunga >= item.targetBunga;
 const diff = item.realisasiBunga - item.targetBunga;

 return (
 <motion.div
 key={item.aoName}
 initial={{ opacity: 0, y: 10 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: idx * 0.05 }}
 className="bg-surface shadow-md p-5 rounded-2xl space-y-4 hover:shadow-md transition-all"
 >
 <div className="flex items-center justify-between border-b border-border pb-3">
 <div className="flex items-center gap-3">
 <div className={`w-9 h-9 rounded-2xl flex items-center justify-center font-black text-xs text-foreground ${idx === 0 ? ' ' : 'bg-slate-700'}`}>
 #{idx + 1}
 </div>
 <div>
 <h3 className="font-extrabold text-foreground dark:text-foreground text-sm leading-tight">{item.aoName}</h3>
 <span className="text-[10px] text-muted">{item.branch} • {item.month}</span>
 </div>
 </div>

 <span className={`px-2.5 py-1 rounded-full text-xs font-black border flex items-center gap-1 ${isSurplus ? ' ' : ' '}`}>
 {isSurplus ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
 {achPercentage.toFixed(1)}%
 </span>
 </div>

 {/* Numerical details */}
 <div className="grid grid-cols-2 gap-3 text-xs">
 <div className="bg-background dark:bg-white/5 p-2.5 rounded-xl border border-border">
 <span className="text-[10px] text-muted font-bold block uppercase">Target Bunga</span>
 <strong className="text-foreground font-extrabold">{formatIDR(item.targetBunga)}</strong>
 </div>

 <div className="bg-background dark:bg-white/5 p-2.5 rounded-xl border border-border">
 <span className="text-[10px] text-muted font-bold block uppercase">Realisasi Bunga</span>
 <strong className={`font-extrabold ${isSurplus ? 'text-primary' : 'text-muted'}`}>
 {formatIDR(item.realisasiBunga)}
 </strong>
 </div>
 </div>

 {/* Progress Bar */}
 <div className="space-y-1.5">
 <div className="flex justify-between text-[11px] font-bold">
 <span className="text-muted">Progress Pencapaian Target Bunga:</span>
 <span className={isSurplus ? '' : ''}>
 {diff >= 0 ? `Surplus ${formatIDR(diff)}` : `Shortfall ${formatIDR(Math.abs(diff))}`}
 </span>
 </div>

 <div className="w-full h-3 bg-surface-muted rounded-full overflow-hidden p-0.5 border border-border">
 <div
 className={`h-full rounded-full transition-all duration-500 ${isSurplus ? 'bg-surface shadow-md' : 'bg-surface shadow-md'}`}
 style={{ width: `${Math.min(achPercentage, 100)}%` }}
 />
 </div>
 </div>

 </motion.div>
 );
 })}
 </div>

 {/* Modal Add Bunga Target */}
 <AnimatePresence>
 {isAddModalOpen && (
 <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary text-white/60 backdrop-blur-xs p-4">
 <motion.div 
 initial={{ scale: 0.95, opacity: 0 }}
 animate={{ scale: 1, opacity: 1 }}
 exit={{ scale: 0.95, opacity: 0 }}
 className="bg-surface rounded-[24px] max-w-md w-full p-6 border border-border shadow-xl space-y-4"
 >
 <div className="flex items-center justify-between border-b border-border pb-3">
 <h3 className="font-black text-foreground dark:text-foreground text-sm">Input Target & Realisasi Bunga AO</h3>
 <button onClick={() => setIsAddModalOpen(false)} className="text-muted hover:text-muted">
 <X size={18} />
 </button>
 </div>

 <div className="space-y-3 text-xs">
 <div>
 <label className="block font-bold text-foreground dark:text-gray-200 mb-1">Nama AO</label>
 <input
 type="text"
 value={newForm.aoName}
 onChange={(e) => setNewForm(prev => ({ ...prev, aoName: e.target.value }))}
 placeholder="Andi (AO) / Della (AO)"
 className="w-full p-2.5 bg-background dark:bg-white/5 border border-border rounded-xl"
 />
 </div>

 <div>
 <label className="block font-bold text-foreground dark:text-gray-200 mb-1">Cabang BPR ARA</label>
 <input
 type="text"
 value={newForm.branch}
 onChange={(e) => setNewForm(prev => ({ ...prev, branch: e.target.value }))}
 className="w-full p-2.5 bg-background dark:bg-white/5 border border-border rounded-xl"
 />
 </div>

 <div>
 <label className="block font-bold text-foreground dark:text-gray-200 mb-1">Target Bunga (Rp)</label>
 <input
 type="number"
 value={newForm.targetBunga}
 onChange={(e) => setNewForm(prev => ({ ...prev, targetBunga: Number(e.target.value) }))}
 className="w-full p-2.5 bg-background dark:bg-white/5 border border-border rounded-xl font-bold"
 />
 </div>

 <div>
 <label className="block font-bold text-foreground dark:text-gray-200 mb-1">Realisasi Bunga (Rp)</label>
 <input
 type="number"
 value={newForm.realisasiBunga}
 onChange={(e) => setNewForm(prev => ({ ...prev, realisasiBunga: Number(e.target.value) }))}
 className="w-full p-2.5 bg-background dark:bg-white/5 border border-border rounded-xl font-bold"
 />
 </div>

 <div>
 <label className="block font-bold text-foreground dark:text-gray-200 mb-1">Bulan Periode</label>
 <input
 type="text"
 value={newForm.month}
 onChange={(e) => setNewForm(prev => ({ ...prev, month: e.target.value }))}
 className="w-full p-2.5 bg-background dark:bg-white/5 border border-border rounded-xl"
 />
 </div>
 </div>

 <div className="flex items-center justify-end gap-2 pt-2">
 <button
 onClick={() => setIsAddModalOpen(false)}
 className="px-4 py-2 text-xs font-bold text-muted hover:bg-surface-muted rounded-xl"
 >
 Batal
 </button>
 <button
 onClick={handleSaveNew}
 className="px-4 py-2 text-xs font-bold hover: text-foreground rounded-xl shadow-sm dark:shadow-none"
 >
 Simpan Target Bunga
 </button>
 </div>
 </motion.div>
 </div>
 )}
 </AnimatePresence>

 </div>
 );
}
