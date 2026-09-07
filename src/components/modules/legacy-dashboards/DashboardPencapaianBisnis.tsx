import React, { useState } from 'react';
import { 
 BarChart2, 
 TrendingUp, 
 Building, 
 Award, 
 DollarSign, 
 Users, 
 Plus, 
 ArrowUpRight, 
 ArrowDownRight,
 Layers,
 X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PencapaianBisnisAO } from '../../../types/legacy';

interface DashboardPencapaianBisnisProps {
 bisnisList: PencapaianBisnisAO[];
 onAddBisnis: (item: PencapaianBisnisAO) => void;
}

export default function DashboardPencapaianBisnis({ bisnisList, onAddBisnis }: DashboardPencapaianBisnisProps) {
 const [activeTab, setActiveTab] = useState<'AO' | 'CABANG'>('AO');
 const [isAddModalOpen, setIsAddModalOpen] = useState(false);

 const [newForm, setNewForm] = useState({
 aoName: '',
 branch: 'Cabang Utama Bandung',
 targetLanding: 1000000000,
 realisasiLanding: 1100000000,
 targetFunding: 1200000000,
 realisasiFunding: 1250000000
 });

 const formatIDR = (val: number) => 
 new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

 // Totals
 const totalTargetLanding = bisnisList.reduce((acc, curr) => acc + curr.targetLanding, 0);
 const totalRealisasiLanding = bisnisList.reduce((acc, curr) => acc + curr.realisasiLanding, 0);
 const landingAchieve = totalTargetLanding > 0 ? ((totalRealisasiLanding / totalTargetLanding) * 100).toFixed(1) : '0';

 const totalTargetFunding = bisnisList.reduce((acc, curr) => acc + curr.targetFunding, 0);
 const totalRealisasiFunding = bisnisList.reduce((acc, curr) => acc + curr.realisasiFunding, 0);
 const fundingAchieve = totalTargetFunding > 0 ? ((totalRealisasiFunding / totalTargetFunding) * 100).toFixed(1) : '0';

 // Group by Cabang
 const cabangMap: Record<string, { targetLanding: number; realisasiLanding: number; targetFunding: number; realisasiFunding: number; count: number }> = {};
 bisnisList.forEach(item => {
 if (!cabangMap[item.branch]) {
 cabangMap[item.branch] = { targetLanding: 0, realisasiLanding: 0, targetFunding: 0, realisasiFunding: 0, count: 0 };
 }
 cabangMap[item.branch].targetLanding += item.targetLanding;
 cabangMap[item.branch].realisasiLanding += item.realisasiLanding;
 cabangMap[item.branch].targetFunding += item.targetFunding;
 cabangMap[item.branch].realisasiFunding += item.realisasiFunding;
 cabangMap[item.branch].count += 1;
 });

 const handleSaveNew = () => {
 if (!newForm.aoName) return;
 onAddBisnis(newForm);
 setIsAddModalOpen(false);
 setNewForm({
 aoName: '',
 branch: 'Cabang Utama Bandung',
 targetLanding: 1000000000,
 realisasiLanding: 1100000000,
 targetFunding: 1200000000,
 realisasiFunding: 1250000000
 });
 };

 return (
 <div className="space-y-6">
 
 {/* Header Banner */}
 <div className="bg-surface shadow-md p-6 rounded-[24px] text-foreground shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
 <div>
 <div className="flex items-center gap-2 mb-1">
 <BarChart2 size={22} className="text-primary" />
 <h2 className="text-xl font-black tracking-tight">C. Dashboard Pencapaian Target Bisnis (Landing & Funding)</h2>
 </div>
 <p className="text-xs max-w-2xl">
 Monitoring pencapaian target bisnis yang meliputi Target vs Realisasi Landing (Plafon Penyaluran Kredit) dan Target vs Realisasi Funding (Dana Pihak Ketiga: Tabungan/Deposito) per AO & per Cabang BPR ARA.
 </p>
 </div>

 <button
 onClick={() => setIsAddModalOpen(true)}
 className="bg-surface/10 hover:bg-surface/20 text-foreground border border-primary-light/20 font-bold text-xs px-4 py-2.5 rounded-2xl flex items-center gap-2 transition-all cursor-pointer shadow-sm dark:shadow-none shrink-0"
 >
 <Plus size={16} />
 Input Target Bisnis Baru
 </button>
 </div>

 {/* Summary KPI Cards */}
 <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
 
 <div className="bg-surface shadow-md p-5 rounded-2xl flex items-center gap-4">
 <div className="p-3 rounded-2xl border">
 <TrendingUp size={22} />
 </div>
 <div>
 <span className="text-[11px] font-bold text-muted uppercase tracking-wider block">Landing (Kredit Disalurkan)</span>
 <span className="text-lg font-black text-foreground dark:text-foreground tracking-tight">{formatIDR(totalRealisasiLanding)}</span>
 <span className="text-[10px] font-extrabold block mt-0.5">Achievement: {landingAchieve}%</span>
 </div>
 </div>

 <div className="bg-surface shadow-md p-5 rounded-2xl flex items-center gap-4">
 <div className="p-3 rounded-2xl border">
 <DollarSign size={22} />
 </div>
 <div>
 <span className="text-[11px] font-bold text-muted uppercase tracking-wider block">Funding (Dana Pihak Ketiga)</span>
 <span className="text-lg font-black tracking-tight">{formatIDR(totalRealisasiFunding)}</span>
 <span className="text-[10px] font-extrabold block mt-0.5">Achievement: {fundingAchieve}%</span>
 </div>
 </div>

 <div className="bg-surface shadow-md p-5 rounded-2xl flex items-center gap-4">
 <div className="p-3 rounded-2xl border">
 <Users size={22} />
 </div>
 <div>
 <span className="text-[11px] font-bold text-muted uppercase tracking-wider block">Account Officer Aktif</span>
 <span className="text-xl font-black text-foreground dark:text-foreground tracking-tight">{bisnisList.length} AO</span>
 </div>
 </div>

 <div className="bg-surface shadow-md p-5 rounded-2xl flex items-center gap-4">
 <div className="p-3 rounded-2xl border">
 <Building size={22} />
 </div>
 <div>
 <span className="text-[11px] font-bold text-muted uppercase tracking-wider block">Jumlah Cabang</span>
 <span className="text-xl font-black tracking-tight">{Object.keys(cabangMap).length} Cabang</span>
 </div>
 </div>

 </div>

 {/* Switcher Tab between AO View and Cabang View */}
 <div className="flex items-center justify-between bg-surface shadow-md p-3 rounded-2xl">
 <div className="flex items-center gap-2">
 <button
 onClick={() => setActiveTab('AO')}
 className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'AO' ? ' text-foreground shadow-sm dark:shadow-none' : 'bg-surface-muted text-muted hover:bg-slate-200'}`}
 >
 Pencapaian per AO
 </button>
 <button
 onClick={() => setActiveTab('CABANG')}
 className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'CABANG' ? ' text-foreground shadow-sm dark:shadow-none' : 'bg-surface-muted text-muted hover:bg-slate-200'}`}
 >
 Pencapaian per Cabang
 </button>
 </div>

 <span className="text-xs font-bold text-muted hidden sm:inline-block">
 BPR ARA Business Performance Matrix
 </span>
 </div>

 {/* AO View */}
 {activeTab === 'AO' && (
 <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
 {bisnisList.map((item) => {
 const landingPct = item.targetLanding > 0 ? (item.realisasiLanding / item.targetLanding) * 100 : 0;
 const fundingPct = item.targetFunding > 0 ? (item.realisasiFunding / item.targetFunding) * 100 : 0;

 return (
 <motion.div
 key={item.aoName}
 initial={{ opacity: 0, y: 10 }}
 animate={{ opacity: 1, y: 0 }}
 className="bg-surface shadow-md p-5 rounded-2xl space-y-4"
 >
 <div className="flex items-center justify-between border-b border-border pb-3">
 <div>
 <h3 className="font-extrabold text-foreground dark:text-foreground text-sm">{item.aoName}</h3>
 <span className="text-[10px] text-muted font-bold">{item.branch}</span>
 </div>

 <div className="flex items-center gap-1.5">
 <span className={`px-2 py-0.5 rounded text-[10px] font-black border ${landingPct >= 100 ? ' ' : 'bg-surface-muted text-muted border-border'}`}>
 Landing: {landingPct.toFixed(1)}%
 </span>
 <span className={`px-2 py-0.5 rounded text-[10px] font-black border ${fundingPct >= 100 ? ' ' : 'bg-surface-muted text-muted border-border'}`}>
 Funding: {fundingPct.toFixed(1)}%
 </span>
 </div>
 </div>

 {/* Landing Section */}
 <div className="space-y-1.5 text-xs">
 <div className="flex justify-between font-bold">
 <span className="text-primary">1. Penyaluran Kredit (Landing)</span>
 <span className="text-foreground dark:text-gray-200">{formatIDR(item.realisasiLanding)} / {formatIDR(item.targetLanding)}</span>
 </div>
 <div className="w-full h-2.5 bg-surface-muted rounded-full overflow-hidden border border-border">
 <div className="h-full rounded-full" style={{ width: `${Math.min(landingPct, 100)}%` }} />
 </div>
 </div>

 {/* Funding Section */}
 <div className="space-y-1.5 text-xs pt-1">
 <div className="flex justify-between font-bold">
 <span className="text-primary">2. Penghimpunan Dana (Funding)</span>
 <span className="text-foreground dark:text-gray-200">{formatIDR(item.realisasiFunding)} / {formatIDR(item.targetFunding)}</span>
 </div>
 <div className="w-full h-2.5 bg-surface-muted rounded-full overflow-hidden border border-border">
 <div className="h-full rounded-full" style={{ width: `${Math.min(fundingPct, 100)}%` }} />
 </div>
 </div>
 </motion.div>
 );
 })}
 </div>
 )}

 {/* Cabang View */}
 {activeTab === 'CABANG' && (
 <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
 {Object.entries(cabangMap).map(([branchName, data]) => {
 const landingPct = data.targetLanding > 0 ? (data.realisasiLanding / data.targetLanding) * 100 : 0;
 const fundingPct = data.targetFunding > 0 ? (data.realisasiFunding / data.targetFunding) * 100 : 0;

 return (
 <motion.div
 key={branchName}
 initial={{ opacity: 0, y: 10 }}
 animate={{ opacity: 1, y: 0 }}
 className="bg-surface shadow-md p-5 rounded-2xl space-y-4"
 >
 <div className="flex items-center justify-between border-b border-border pb-3">
 <div>
 <h3 className="font-extrabold text-foreground dark:text-foreground text-sm flex items-center gap-1.5">
 <Building size={16} className="text-primary" />
 {branchName}
 </h3>
 <span className="text-[10px] text-muted font-bold">{data.count} Account Officer Terdaftar</span>
 </div>

 <span className="px-2.5 py-1 rounded-full text-xs font-black border">
 Cabang Unit BPR ARA
 </span>
 </div>

 {/* Landing Section */}
 <div className="space-y-1.5 text-xs">
 <div className="flex justify-between font-bold">
 <span className="text-primary">Landing (Total Penyaluran):</span>
 <strong className="text-foreground dark:text-foreground">{formatIDR(data.realisasiLanding)} ({landingPct.toFixed(1)}%)</strong>
 </div>
 <div className="w-full h-3 bg-surface-muted rounded-full overflow-hidden border border-border">
 <div className="h-full rounded-full" style={{ width: `${Math.min(landingPct, 100)}%` }} />
 </div>
 </div>

 {/* Funding Section */}
 <div className="space-y-1.5 text-xs pt-1">
 <div className="flex justify-between font-bold">
 <span className="text-primary">Funding (Total Dana Masuk):</span>
 <strong className="text-primary">{formatIDR(data.realisasiFunding)} ({fundingPct.toFixed(1)}%)</strong>
 </div>
 <div className="w-full h-3 bg-surface-muted rounded-full overflow-hidden border border-border">
 <div className="h-full rounded-full" style={{ width: `${Math.min(fundingPct, 100)}%` }} />
 </div>
 </div>
 </motion.div>
 );
 })}
 </div>
 )}

 {/* Modal Add Bisnis */}
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
 <h3 className="font-black text-foreground dark:text-foreground text-sm">Input Target Bisnis AO</h3>
 <button onClick={() => setIsAddModalOpen(false)} className="text-muted hover:text-muted">
 <X size={18} />
 </button>
 </div>

 <div className="space-y-3 text-xs">
 <div>
 <label className="block font-bold text-foreground dark:text-gray-200 mb-1">Nama Account Officer (AO)</label>
 <input
 type="text"
 value={newForm.aoName}
 onChange={(e) => setNewForm(prev => ({ ...prev, aoName: e.target.value }))}
 placeholder="Andi (AO) / Della (AO)"
 className="w-full p-2.5 bg-background dark:bg-white/5 border border-border rounded-xl"
 />
 </div>

 <div>
 <label className="block font-bold text-foreground dark:text-gray-200 mb-1">Nama Cabang</label>
 <input
 type="text"
 value={newForm.branch}
 onChange={(e) => setNewForm(prev => ({ ...prev, branch: e.target.value }))}
 className="w-full p-2.5 bg-background dark:bg-white/5 border border-border rounded-xl"
 />
 </div>

 <div>
 <label className="block font-bold text-foreground dark:text-gray-200 mb-1">Target Landing / Penyaluran Kredit (Rp)</label>
 <input
 type="number"
 value={newForm.targetLanding}
 onChange={(e) => setNewForm(prev => ({ ...prev, targetLanding: Number(e.target.value) }))}
 className="w-full p-2.5 bg-background dark:bg-white/5 border border-border rounded-xl font-bold"
 />
 </div>

 <div>
 <label className="block font-bold text-foreground dark:text-gray-200 mb-1">Realisasi Landing / Penyaluran Kredit (Rp)</label>
 <input
 type="number"
 value={newForm.realisasiLanding}
 onChange={(e) => setNewForm(prev => ({ ...prev, realisasiLanding: Number(e.target.value) }))}
 className="w-full p-2.5 bg-background dark:bg-white/5 border border-border rounded-xl font-bold"
 />
 </div>

 <div>
 <label className="block font-bold text-foreground dark:text-gray-200 mb-1">Target Funding / DPK (Rp)</label>
 <input
 type="number"
 value={newForm.targetFunding}
 onChange={(e) => setNewForm(prev => ({ ...prev, targetFunding: Number(e.target.value) }))}
 className="w-full p-2.5 bg-background dark:bg-white/5 border border-border rounded-xl font-bold"
 />
 </div>

 <div>
 <label className="block font-bold text-foreground dark:text-gray-200 mb-1">Realisasi Funding / DPK (Rp)</label>
 <input
 type="number"
 value={newForm.realisasiFunding}
 onChange={(e) => setNewForm(prev => ({ ...prev, realisasiFunding: Number(e.target.value) }))}
 className="w-full p-2.5 bg-background dark:bg-white/5 border border-border rounded-xl font-bold"
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
 Simpan Target Bisnis
 </button>
 </div>
 </motion.div>
 </div>
 )}
 </AnimatePresence>

 </div>
 );
}
