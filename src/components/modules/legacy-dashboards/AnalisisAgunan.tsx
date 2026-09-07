import React, { useState } from 'react';
import { 
 Building, 
 ShieldCheck, 
 AlertTriangle, 
 Search, 
 Plus, 
 Filter, 
 FileCheck, 
 FileText, 
 DollarSign, 
 MapPin, 
 CheckCircle2,
 X,
 Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AgunanItem } from '../../../types/legacy';

interface AnalisisAgunanProps {
 agunanList: AgunanItem[];
 onAddAgunan: (item: AgunanItem) => void;
 onUpdateAgunan: (item: AgunanItem) => void;
}

export default function AnalisisAgunan({ agunanList, onAddAgunan, onUpdateAgunan }: AnalisisAgunanProps) {
 const [searchTerm, setSearchTerm] = useState('');
 const [typeFilter, setTypeFilter] = useState<string>('ALL');
 const [isAddModalOpen, setIsAddModalOpen] = useState(false);

 const [newForm, setNewForm] = useState({
 debtorName: '',
 aoName: 'Andi (AO)',
 collateralType: 'SHM' as 'SHM' | 'BPKB' | 'DEPOSITO' | 'OTHER',
 certificateNo: '',
 location: '',
 regionName: 'Kota Bandung',
 marketValue: 300000000,
 liquidationValue: 240000000,
 loanAmount: 150000000,
 isDecliningRegion: false,
 notes: ''
 });

 const formatIDR = (val: number) => 
 new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

 const filteredList = agunanList.filter(item => {
 const matchesSearch = item.debtorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
 item.certificateNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
 item.location.toLowerCase().includes(searchTerm.toLowerCase());
 const matchesType = typeFilter === 'ALL' || item.collateralType === typeFilter;
 return matchesSearch && matchesType;
 });

 const totalNilaiPasar = agunanList.reduce((acc, curr) => acc + curr.marketValue, 0);
 const totalNilaiTaksasi = agunanList.reduce((acc, curr) => acc + curr.liquidationValue, 0);
 const totalPinjaman = agunanList.reduce((acc, curr) => acc + curr.loanAmount, 0);
 const avgLtv = totalNilaiTaksasi > 0 ? ((totalPinjaman / totalNilaiTaksasi) * 100).toFixed(1) : '0';

 const handleSaveNew = () => {
 if (!newForm.debtorName || !newForm.certificateNo) return;
 const ltv = newForm.liquidationValue > 0 ? (newForm.loanAmount / newForm.liquidationValue) * 100 : 0;
 const item: AgunanItem = {
 id: `AGN-${String(agunanList.length + 1).padStart(3, '0')}`,
 ...newForm,
 ltvRatio: Number(ltv.toFixed(1))
 };
 onAddAgunan(item);
 setIsAddModalOpen(false);
 setNewForm({
 debtorName: '',
 aoName: 'Andi (AO)',
 collateralType: 'SHM',
 certificateNo: '',
 location: '',
 regionName: 'Kota Bandung',
 marketValue: 300000000,
 liquidationValue: 240000000,
 loanAmount: 150000000,
 isDecliningRegion: false,
 notes: ''
 });
 };

 return (
 <div className="space-y-6">
 
 {/* Header Banner */}
 <div className="bg-surface shadow-md p-6 rounded-[24px] text-foreground shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
 <div>
 <div className="flex items-center gap-2 mb-1">
 <Building size={22} className="text-primary" />
 <h2 className="text-xl font-black tracking-tight">C. Modul Analisis & Valuation Agunan Kredit</h2>
 </div>
 <p className="text-xs max-w-2xl">
 Informasi detail agunan (SHM, BPKB, Bilyet Deposito), rasio Loan to Value (LTV), serta evaluasi faktor risiko tren harga properti di wilayah sekitar.
 </p>
 </div>

 <button
 onClick={() => setIsAddModalOpen(true)}
 className="bg-surface/10 hover:bg-surface/20 text-foreground border border-primary-light/20 font-bold text-xs px-4 py-2.5 rounded-2xl flex items-center gap-2 transition-all cursor-pointer shadow-sm dark:shadow-none shrink-0"
 >
 <Plus size={16} />
 Input Agunan Baru
 </button>
 </div>

 {/* Critical Note for Appraisal Risk */}
 <div className="bg-gradient-to-r to-transparent border rounded-[22px] p-4 flex items-start gap-3">
 <AlertTriangle size={20} className="shrink-0 mt-0.5" />
 <div className="text-xs">
 <p className="font-extrabold mb-0.5">Ketentuan Analisis Nilai Agunan (Risk Guidance):</p>
 <p className="leading-relaxed">
 Analisis nilai agunan <strong>wajib mempertimbangkan kondisi wilayah</strong>. Sebagai contoh, <strong>hindari menjadikan daerah yang memiliki tren penurunan harga (seperti kawasan berisiko genangan atau penurunan aktivitas pasar) sebagai acuan utama</strong> dalam penetapan appraisal & limit kredit.
 </p>
 </div>
 </div>

 {/* Summary KPI Cards */}
 <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
 <div className="bg-surface shadow-md p-5 rounded-2xl flex items-center gap-4">
 <div className="p-3 rounded-2xl border">
 <Building size={22} />
 </div>
 <div>
 <span className="text-[11px] font-bold text-muted uppercase tracking-wider block">Total Nilai Pasar</span>
 <span className="text-lg font-black text-foreground dark:text-foreground tracking-tight">{formatIDR(totalNilaiPasar)}</span>
 </div>
 </div>

 <div className="bg-surface shadow-md p-5 rounded-2xl flex items-center gap-4">
 <div className="p-3 rounded-2xl border">
 <ShieldCheck size={22} />
 </div>
 <div>
 <span className="text-[11px] font-bold text-muted uppercase tracking-wider block">Nilai Taksasi (Likuidasi)</span>
 <span className="text-lg font-black text-foreground dark:text-foreground tracking-tight">{formatIDR(totalNilaiTaksasi)}</span>
 </div>
 </div>

 <div className="bg-surface shadow-md p-5 rounded-2xl flex items-center gap-4">
 <div className="p-3 rounded-2xl border">
 <DollarSign size={22} />
 </div>
 <div>
 <span className="text-[11px] font-bold text-muted uppercase tracking-wider block">Total Pinjaman Ter-Cover</span>
 <span className="text-lg font-black text-foreground dark:text-foreground tracking-tight">{formatIDR(totalPinjaman)}</span>
 </div>
 </div>

 <div className="bg-surface shadow-md p-5 rounded-2xl flex items-center gap-4">
 <div className="p-3 rounded-2xl border">
 <FileCheck size={22} />
 </div>
 <div>
 <span className="text-[11px] font-bold text-muted uppercase tracking-wider block">Rata-rata LTV Ratio</span>
 <span className="text-xl font-black tracking-tight">{avgLtv}%</span>
 </div>
 </div>
 </div>

 {/* Filter Bar */}
 <div className="bg-surface shadow-md p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-3">
 <div className="relative w-full md:w-80">
 <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
 <input
 type="text"
 placeholder="Cari debitur, sertifikat, atau lokasi..."
 value={searchTerm}
 onChange={(e) => setSearchTerm(e.target.value)}
 className="w-full pl-9 pr-4 py-2 bg-background dark:bg-white/5 border border-border rounded-xl text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:"
 />
 </div>

 <div className="flex items-center gap-2 w-full md:w-auto">
 <span className="text-xs font-bold text-muted flex items-center gap-1">
 <Filter size={14} /> Jenis Agunan:
 </span>
 <select
 value={typeFilter}
 onChange={(e) => setTypeFilter(e.target.value)}
 className="bg-background dark:bg-white/5 border border-border rounded-xl text-xs font-bold text-foreground px-3 py-2 outline-none cursor-pointer"
 >
 <option value="ALL">Semua Agunan</option>
 <option value="SHM">Sertifikat (SHM/SHGB)</option>
 <option value="BPKB">Kendaraan (BPKB)</option>
 <option value="DEPOSITO">Bilyet Deposito</option>
 </select>
 </div>
 </div>

 {/* Agunan Table */}
 <div className="bg-surface shadow-md rounded-2xl overflow-hidden">
 <div className="overflow-x-auto">
 <table className="w-full text-left border-collapse">
 <thead>
 <tr className="bg-background dark:bg-white/5 border-b border-border text-[11px] font-extrabold text-muted uppercase tracking-wider">
 <th className="py-3.5 px-4">Debitur & Bukti Agunan</th>
 <th className="py-3.5 px-4">Jenis & No. Sertifikat</th>
 <th className="py-3.5 px-4 text-right">Nilai Pasar</th>
 <th className="py-3.5 px-4 text-right">Nilai Likuidasi</th>
 <th className="py-3.5 px-4 text-right">Plafon Kredit</th>
 <th className="py-3.5 px-4 text-center">LTV %</th>
 <th className="py-3.5 px-4">Status Risk Wilayah</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100 dark:divide-white/10 text-xs">
 {filteredList.length > 0 ? (
 filteredList.map((item) => (
 <tr key={item.id} className="hover: /20 transition-colors">
 <td className="py-3.5 px-4 font-medium text-foreground dark:text-foreground">
 <span className="font-bold text-foreground dark:text-foreground block">{item.debtorName}</span>
 <span className="text-[10px] text-muted block">{item.location}</span>
 </td>
 <td className="py-3.5 px-4">
 <span className="font-extrabold px-2 py-0.5 rounded border text-[10px] inline-block mb-1">
 {item.collateralType}
 </span>
 <span className="font-mono text-xs text-foreground dark:text-gray-200 block">{item.certificateNo}</span>
 </td>
 <td className="py-3.5 px-4 text-right font-medium text-foreground dark:text-gray-200">
 {formatIDR(item.marketValue)}
 </td>
 <td className="py-3.5 px-4 text-right font-bold">
 {formatIDR(item.liquidationValue)}
 </td>
 <td className="py-3.5 px-4 text-right font-bold text-foreground dark:text-foreground">
 {formatIDR(item.loanAmount)}
 </td>
 <td className="py-3.5 px-4 text-center">
 <span className={`font-extrabold px-2 py-0.5 rounded text-[10px] border ${item.ltvRatio > 70 ? ' ' : ' '}`}>
 {item.ltvRatio}%
 </span>
 </td>
 <td className="py-3.5 px-4 max-w-xs">
 {item.isDecliningRegion ? (
 <div className="border p-2 rounded-xl text-[10px] space-y-0.5">
 <span className="font-bold flex items-center gap-1">
 <AlertTriangle size={12} className="text-primary" /> Wilayah Tren Penurunan Harga
 </span>
 <p className="text-[10px] leading-tight">{item.notes}</p>
 </div>
 ) : (
 <div className="text-[10px] text-muted">
 <span className="font-bold flex items-center gap-1">
 <CheckCircle2 size={12} className="text-primary" /> Wilayah Stabil / Aman
 </span>
 <span className="text-[10px] text-muted truncate block">{item.notes}</span>
 </div>
 )}
 </td>
 </tr>
 ))
 ) : (
 <tr>
 <td colSpan={7} className="py-8 text-center text-muted font-medium">
 Tidak ada agunan yang ditemukan.
 </td>
 </tr>
 )}
 </tbody>
 </table>
 </div>
 </div>

 {/* Modal Add Agunan */}
 <AnimatePresence>
 {isAddModalOpen && (
 <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary text-white/60 backdrop-blur-xs p-4">
 <motion.div 
 initial={{ scale: 0.95, opacity: 0 }}
 animate={{ scale: 1, opacity: 1 }}
 exit={{ scale: 0.95, opacity: 0 }}
 className="bg-surface rounded-[24px] max-w-lg w-full p-6 border border-border shadow-xl space-y-4 max-h-[90vh] overflow-y-auto"
 >
 <div className="flex items-center justify-between border-b border-border pb-3">
 <h3 className="font-black text-foreground dark:text-foreground text-sm">Input Agunan Baru</h3>
 <button onClick={() => setIsAddModalOpen(false)} className="text-muted hover:text-muted">
 <X size={18} />
 </button>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
 <div className="sm:col-span-2">
 <label className="block font-bold text-foreground dark:text-gray-200 mb-1">Nama Debitur</label>
 <input
 type="text"
 value={newForm.debtorName}
 onChange={(e) => setNewForm(prev => ({ ...prev, debtorName: e.target.value }))}
 placeholder="Budi Santoso / PT ABC"
 className="w-full p-2.5 bg-background dark:bg-white/5 border border-border rounded-xl"
 />
 </div>

 <div>
 <label className="block font-bold text-foreground dark:text-gray-200 mb-1">Jenis Agunan</label>
 <select
 value={newForm.collateralType}
 onChange={(e) => setNewForm(prev => ({ ...prev, collateralType: e.target.value as any }))}
 className="w-full p-2.5 bg-background dark:bg-white/5 border border-border rounded-xl font-bold"
 >
 <option value="SHM">Sertifikat (SHM/SHGB)</option>
 <option value="BPKB">Kendaraan (BPKB)</option>
 <option value="DEPOSITO">Bilyet Deposito</option>
 <option value="OTHER">Lainnya</option>
 </select>
 </div>

 <div>
 <label className="block font-bold text-foreground dark:text-gray-200 mb-1">Nomor Sertifikat / BPKB / Bilyet</label>
 <input
 type="text"
 value={newForm.certificateNo}
 onChange={(e) => setNewForm(prev => ({ ...prev, certificateNo: e.target.value }))}
 placeholder="SHM No. 12345 / BPKB..."
 className="w-full p-2.5 bg-background dark:bg-white/5 border border-border rounded-xl"
 />
 </div>

 <div>
 <label className="block font-bold text-foreground dark:text-gray-200 mb-1">Nilai Pasar (Rp)</label>
 <input
 type="number"
 value={newForm.marketValue}
 onChange={(e) => setNewForm(prev => ({ ...prev, marketValue: Number(e.target.value) }))}
 className="w-full p-2.5 bg-background dark:bg-white/5 border border-border rounded-xl"
 />
 </div>

 <div>
 <label className="block font-bold text-foreground dark:text-gray-200 mb-1">Nilai Likuidasi / Taksasi (Rp)</label>
 <input
 type="number"
 value={newForm.liquidationValue}
 onChange={(e) => setNewForm(prev => ({ ...prev, liquidationValue: Number(e.target.value) }))}
 className="w-full p-2.5 bg-background dark:bg-white/5 border border-border rounded-xl"
 />
 </div>

 <div>
 <label className="block font-bold text-foreground dark:text-gray-200 mb-1">Plafon Kredit (Rp)</label>
 <input
 type="number"
 value={newForm.loanAmount}
 onChange={(e) => setNewForm(prev => ({ ...prev, loanAmount: Number(e.target.value) }))}
 className="w-full p-2.5 bg-background dark:bg-white/5 border border-border rounded-xl"
 />
 </div>

 <div>
 <label className="block font-bold text-foreground dark:text-gray-200 mb-1">Lokasi / Wilayah</label>
 <input
 type="text"
 value={newForm.location}
 onChange={(e) => setNewForm(prev => ({ ...prev, location: e.target.value }))}
 placeholder="Soreang / Bandung"
 className="w-full p-2.5 bg-background dark:bg-white/5 border border-border rounded-xl"
 />
 </div>

 <div className="sm:col-span-2">
 <label className="flex items-center gap-2 font-bold p-2.5 rounded-xl border cursor-pointer">
 <input
 type="checkbox"
 checked={newForm.isDecliningRegion}
 onChange={(e) => setNewForm(prev => ({ ...prev, isDecliningRegion: e.target.checked }))}
 className="w-4 h-4 accent-amber-600 rounded"
 />
 <span>Lokasi ini merupakan daerah dengan tren penurunan harga (Perlu Perhatian Khusus)</span>
 </label>
 </div>

 <div className="sm:col-span-2">
 <label className="block font-bold text-foreground dark:text-gray-200 mb-1">Catatan Tambahan Analis</label>
 <textarea
 rows={2}
 value={newForm.notes}
 onChange={(e) => setNewForm(prev => ({ ...prev, notes: e.target.value }))}
 placeholder="Spesifikasi bangunan, kondisi fisik, pertimbangan akses jalan..."
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
 Simpan Data Agunan
 </button>
 </div>
 </motion.div>
 </div>
 )}
 </AnimatePresence>

 </div>
 );
}
