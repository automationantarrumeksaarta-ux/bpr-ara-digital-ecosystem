import React, { useState } from 'react';
import { 
 CalendarCheck, 
 Clock, 
 CheckCircle, 
 XCircle, 
 AlertCircle, 
 Plus, 
 Search, 
 Filter, 
 PhoneCall, 
 User, 
 Building,
 Edit3,
 X,
 Send
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { JanjiBayarItem, UserProfile } from '../../../types/legacy';

interface DashboardJanjiBayarProps {
 janjiList: JanjiBayarItem[];
 onUpdateJanji: (item: JanjiBayarItem) => void;
 onAddJanji: (item: JanjiBayarItem) => void;
 currentUser: UserProfile;
}

export default function DashboardJanjiBayar({
 janjiList,
 onUpdateJanji,
 onAddJanji,
 currentUser
}: DashboardJanjiBayarProps) {
 const [searchTerm, setSearchTerm] = useState('');
 const [statusFilter, setStatusFilter] = useState<string>('ALL');
 const [aoFilter, setAoFilter] = useState<string>('ALL');
 const [isAddModalOpen, setIsAddModalOpen] = useState(false);
 const [editingItem, setEditingItem] = useState<JanjiBayarItem | null>(null);

 const [newForm, setNewForm] = useState({
 debtorName: '',
 aoName: currentUser.fullName || 'Andi (AO)',
 branch: 'Cabang Utama Bandung',
 promiseDate: new Date().toISOString().split('T')[0],
 promisedAmount: 5000000,
 status: 'MENUNGGU' as 'TEREALISASI' | 'INGKAR_JANJI' | 'MENUNGGU',
 notes: '',
 contactWa: '081234567890'
 });

 const formatIDR = (val: number) => 
 new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

 // AO list for filter
 const uniqueAOs = Array.from(new Set(janjiList.map(j => j.aoName)));

 // Filtered List
 const filteredList = janjiList.filter(item => {
 const matchesSearch = item.debtorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
 item.aoName.toLowerCase().includes(searchTerm.toLowerCase());
 const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;
 const matchesAo = aoFilter === 'ALL' || item.aoName === aoFilter;
 return matchesSearch && matchesStatus && matchesAo;
 });

 // KPI Metrics
 const totalCount = janjiList.length;
 const totalAmount = janjiList.reduce((acc, curr) => acc + curr.promisedAmount, 0);
 const terealisasiList = janjiList.filter(j => j.status === 'TEREALISASI');
 const ingkarList = janjiList.filter(j => j.status === 'INGKAR_JANJI');
 const menungguList = janjiList.filter(j => j.status === 'MENUNGGU');

 const totalTerealisasiVal = terealisasiList.reduce((acc, curr) => acc + curr.promisedAmount, 0);
 const totalIngkarVal = ingkarList.reduce((acc, curr) => acc + curr.promisedAmount, 0);

 const handleSaveNew = () => {
 if (!newForm.debtorName) return;
 const newItem: JanjiBayarItem = {
 id: `JB-${String(janjiList.length + 1).padStart(3, '0')}`,
 ...newForm
 };
 onAddJanji(newItem);
 setIsAddModalOpen(false);
 setNewForm({
 debtorName: '',
 aoName: currentUser.fullName || 'Andi (AO)',
 branch: 'Cabang Utama Bandung',
 promiseDate: new Date().toISOString().split('T')[0],
 promisedAmount: 5000000,
 status: 'MENUNGGU',
 notes: '',
 contactWa: '081234567890'
 });
 };

 const handleUpdateStatus = (status: 'TEREALISASI' | 'INGKAR_JANJI' | 'MENUNGGU') => {
 if (!editingItem) return;
 onUpdateJanji({ ...editingItem, status });
 setEditingItem(null);
 };

 const sendWaReminder = (wa: string, name: string, date: string, amount: number) => {
 const cleanWa = wa.replace(/[^0-9]/g, '');
 const message = encodeURIComponent(`Halo Bpk/Ibu ${name}, mengingatkan janji pembayaran angsuran BPR ARA sebesar ${formatIDR(amount)} pada tanggal ${date}. Terima kasih.`);
 window.open(`https://wa.me/${cleanWa}?text=${message}`, '_blank');
 };

 return (
 <div className="space-y-6">
 
 {/* Header Banner */}
 <div className="bg-surface shadow-md p-6 rounded-[24px] text-foreground shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
 <div>
 <div className="flex items-center gap-2 mb-1">
 <CalendarCheck size={22} className="text-primary" />
 <h2 className="text-xl font-black tracking-tight">A. Dashboard Monitoring Janji Bayar Debitur</h2>
 </div>
 <p className="text-xs max-w-2xl">
 Monitoring komitmen janji bayar debitur, status realisasi penagihan (Lunas, Ingkar Janji, Pending), daftar debitur menunggak, dan kinerja pengawalan per Account Officer (AO).
 </p>
 </div>

 <button
 onClick={() => setIsAddModalOpen(true)}
 className="bg-surface/10 hover:bg-surface/20 text-foreground border border-primary-light/20 font-bold text-xs px-4 py-2.5 rounded-2xl flex items-center gap-2 transition-all cursor-pointer shadow-sm dark:shadow-none shrink-0"
 >
 <Plus size={16} />
 Catat Janji Bayar Baru
 </button>
 </div>

 {/* KPI Cards */}
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
 
 <div className="bg-surface shadow-md p-5 rounded-2xl flex items-center gap-4">
 <div className="p-3 rounded-2xl border">
 <CalendarCheck size={22} />
 </div>
 <div>
 <span className="text-[11px] font-bold text-muted uppercase tracking-wider block">Total Commit Janji</span>
 <span className="text-lg font-black text-foreground dark:text-foreground tracking-tight">{totalCount} Debitur ({formatIDR(totalAmount)})</span>
 </div>
 </div>

 <div className="bg-surface shadow-md p-5 rounded-2xl flex items-center gap-4">
 <div className="p-3 rounded-2xl border">
 <CheckCircle size={22} />
 </div>
 <div>
 <span className="text-[11px] font-bold text-muted uppercase tracking-wider block">Realisasi (Terealisasi)</span>
 <span className="text-lg font-black tracking-tight">{terealisasiList.length} Debitur ({formatIDR(totalTerealisasiVal)})</span>
 </div>
 </div>

 <div className="bg-surface shadow-md p-5 rounded-2xl flex items-center gap-4">
 <div className="p-3 rounded-2xl border">
 <XCircle size={22} />
 </div>
 <div>
 <span className="text-[11px] font-bold text-muted uppercase tracking-wider block">Ingkar Janji (Overdue)</span>
 <span className="text-lg font-black tracking-tight">{ingkarList.length} Debitur ({formatIDR(totalIngkarVal)})</span>
 </div>
 </div>

 <div className="bg-surface shadow-md p-5 rounded-2xl flex items-center gap-4">
 <div className="p-3 rounded-2xl border">
 <Clock size={22} />
 </div>
 <div>
 <span className="text-[11px] font-bold text-muted uppercase tracking-wider block">Menunggu Jatuh Tempo</span>
 <span className="text-lg font-black text-foreground dark:text-foreground tracking-tight">{menungguList.length} Debitur</span>
 </div>
 </div>

 </div>

 {/* Filter & Search Bar */}
 <div className="bg-surface shadow-md p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-3">
 
 <div className="relative w-full md:w-80">
 <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
 <input
 type="text"
 placeholder="Cari debitur atau AO..."
 value={searchTerm}
 onChange={(e) => setSearchTerm(e.target.value)}
 className="w-full pl-9 pr-4 py-2 bg-background dark:bg-white/5 border border-border rounded-xl text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:"
 />
 </div>

 <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
 <span className="text-xs font-bold text-muted flex items-center gap-1">
 <Filter size={14} /> Status:
 </span>
 <select
 value={statusFilter}
 onChange={(e) => setStatusFilter(e.target.value)}
 className="bg-background dark:bg-white/5 border border-border rounded-xl text-xs font-bold text-foreground px-3 py-2 outline-none cursor-pointer"
 >
 <option value="ALL">Semua Status</option>
 <option value="MENUNGGU">Menunggu</option>
 <option value="TEREALISASI">Terealisasi (Lunas)</option>
 <option value="INGKAR_JANJI">Ingkar Janji</option>
 </select>

 <span className="text-xs font-bold text-muted flex items-center gap-1 ml-2">
 AO:
 </span>
 <select
 value={aoFilter}
 onChange={(e) => setAoFilter(e.target.value)}
 className="bg-background dark:bg-white/5 border border-border rounded-xl text-xs font-bold text-foreground px-3 py-2 outline-none cursor-pointer"
 >
 <option value="ALL">Semua AO</option>
 {uniqueAOs.map(ao => (
 <option key={ao} value={ao}>{ao}</option>
 ))}
 </select>
 </div>

 </div>

 {/* Overdue Alert Banner if any */}
 {ingkarList.length > 0 && (
 <div className="border rounded-[22px] p-4 flex items-start justify-between gap-3">
 <div className="flex items-start gap-3">
 <AlertCircle size={20} className="shrink-0 mt-0.5" />
 <div className="text-xs">
 <p className="font-extrabold mb-0.5">Perhatian: {ingkarList.length} Debitur Belum Memenuhi Janji Bayar!</p>
 <p className="text-primary">
 Harap AO terkait (Andi, Della, Budi) segera melakukan penagihan ulang atau kunjungan lapangan (On-site Visit).
 </p>
 </div>
 </div>
 </div>
 )}

 {/* Janji Bayar Table */}
 <div className="bg-surface shadow-md rounded-2xl overflow-hidden">
 <div className="overflow-x-auto">
 <table className="w-full text-left border-collapse">
 <thead>
 <tr className="bg-background dark:bg-white/5 border-b border-border text-[11px] font-extrabold text-muted uppercase tracking-wider">
 <th className="py-3.5 px-4">Debitur & ID</th>
 <th className="py-3.5 px-4">Account Officer (AO)</th>
 <th className="py-3.5 px-4">Tanggal Janji</th>
 <th className="py-3.5 px-4 text-right">Nominal Janji</th>
 <th className="py-3.5 px-4 text-center">Status Realisasi</th>
 <th className="py-3.5 px-4">Catatan Penagihan</th>
 <th className="py-3.5 px-4 text-center">Aksi & Follow-up</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100 dark:divide-white/10 text-xs">
 {filteredList.length > 0 ? (
 filteredList.map((item) => (
 <tr key={item.id} className="hover: /20 transition-colors">
 <td className="py-3.5 px-4 font-medium text-foreground dark:text-foreground">
 <span className="font-bold text-foreground dark:text-foreground block">{item.debtorName}</span>
 <span className="text-[10px] font-mono text-muted">{item.id}</span>
 </td>
 <td className="py-3.5 px-4">
 <span className="font-bold text-foreground block">{item.aoName}</span>
 <span className="text-[10px] text-muted">{item.branch}</span>
 </td>
 <td className="py-3.5 px-4 font-bold">
 {item.promiseDate}
 </td>
 <td className="py-3.5 px-4 text-right font-black text-foreground dark:text-foreground">
 {formatIDR(item.promisedAmount)}
 </td>
 <td className="py-3.5 px-4 text-center">
 {item.status === 'TEREALISASI' && (
 <span className="inline-flex items-center gap-1 border px-2.5 py-1 rounded-full text-[10px] font-extrabold">
 <CheckCircle size={12} /> Terealisasi
 </span>
 )}
 {item.status === 'INGKAR_JANJI' && (
 <span className="inline-flex items-center gap-1 border px-2.5 py-1 rounded-full text-[10px] font-extrabold animate-pulse">
 <XCircle size={12} /> Ingkar Janji
 </span>
 )}
 {item.status === 'MENUNGGU' && (
 <span className="inline-flex items-center gap-1 border px-2.5 py-1 rounded-full text-[10px] font-extrabold">
 <Clock size={12} /> Menunggu
 </span>
 )}
 </td>
 <td className="py-3.5 px-4 max-w-xs text-muted text-[11px]">
 {item.notes}
 </td>
 <td className="py-3.5 px-4 text-center">
 <div className="flex items-center justify-center gap-1.5">
 <button
 onClick={() => setEditingItem(item)}
 className="px-2.5 py-1 bg-surface-muted hover:bg-slate-200 text-foreground dark:text-gray-200 font-bold rounded-lg transition-all cursor-pointer text-[11px]"
 title="Ubah Status Realisasi"
 >
 Status
 </button>
 <button
 onClick={() => sendWaReminder(item.contactWa, item.debtorName, item.promiseDate, item.promisedAmount)}
 className="px-2.5 py-1 hover: font-bold rounded-lg border transition-all cursor-pointer flex items-center gap-1 text-[11px]"
 title="Kirim Pesan Pengingat WhatsApp"
 >
 <Send size={11} /> WA
 </button>
 </div>
 </td>
 </tr>
 ))
 ) : (
 <tr>
 <td colSpan={7} className="py-8 text-center text-muted font-medium">
 Tidak ada komitmen janji bayar yang ditemukan.
 </td>
 </tr>
 )}
 </tbody>
 </table>
 </div>
 </div>

 {/* Modal Status Update */}
 <AnimatePresence>
 {editingItem && (
 <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary text-white/60 backdrop-blur-xs p-4">
 <motion.div 
 initial={{ scale: 0.95, opacity: 0 }}
 animate={{ scale: 1, opacity: 1 }}
 exit={{ scale: 0.95, opacity: 0 }}
 className="bg-surface rounded-[24px] max-w-sm w-full p-6 border border-border shadow-xl space-y-4 text-center"
 >
 <h3 className="font-black text-foreground dark:text-foreground text-sm">Update Status Janji Bayar</h3>
 <p className="text-xs text-muted">{editingItem.debtorName} ({formatIDR(editingItem.promisedAmount)})</p>

 <div className="space-y-2 pt-2">
 <button
 onClick={() => handleUpdateStatus('TEREALISASI')}
 className="w-full py-2.5 hover: font-bold rounded-xl border text-xs flex items-center justify-center gap-2 cursor-pointer"
 >
 <CheckCircle size={16} className="text-primary" /> Mark as Terealisasi (Lunas)
 </button>

 <button
 onClick={() => handleUpdateStatus('INGKAR_JANJI')}
 className="w-full py-2.5 hover: font-bold rounded-xl border text-xs flex items-center justify-center gap-2 cursor-pointer"
 >
 <XCircle size={16} className="text-primary" /> Mark as Ingkar Janji
 </button>

 <button
 onClick={() => handleUpdateStatus('MENUNGGU')}
 className="w-full py-2.5 hover: font-bold rounded-xl border text-xs flex items-center justify-center gap-2 cursor-pointer"
 >
 <Clock size={16} className="text-primary" /> Reset ke Menunggu
 </button>
 </div>

 <button
 onClick={() => setEditingItem(null)}
 className="text-xs text-muted hover:text-muted font-medium pt-2"
 >
 Tutup
 </button>
 </motion.div>
 </div>
 )}
 </AnimatePresence>

 {/* Modal Add Janji Bayar */}
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
 <h3 className="font-black text-foreground dark:text-foreground text-sm">Catat Komitmen Janji Bayar</h3>
 <button onClick={() => setIsAddModalOpen(false)} className="text-muted hover:text-muted">
 <X size={18} />
 </button>
 </div>

 <div className="space-y-3 text-xs">
 <div>
 <label className="block font-bold text-foreground dark:text-gray-200 mb-1">Nama Debitur</label>
 <input
 type="text"
 value={newForm.debtorName}
 onChange={(e) => setNewForm(prev => ({ ...prev, debtorName: e.target.value }))}
 placeholder="Toko ABC / Hendrik"
 className="w-full p-2.5 bg-background dark:bg-white/5 border border-border rounded-xl"
 />
 </div>

 <div>
 <label className="block font-bold text-foreground dark:text-gray-200 mb-1">Account Officer (AO)</label>
 <input
 type="text"
 value={newForm.aoName}
 onChange={(e) => setNewForm(prev => ({ ...prev, aoName: e.target.value }))}
 className="w-full p-2.5 bg-background dark:bg-white/5 border border-border rounded-xl"
 />
 </div>

 <div>
 <label className="block font-bold text-foreground dark:text-gray-200 mb-1">Tanggal Komitmen Janji</label>
 <input
 type="date"
 value={newForm.promiseDate}
 onChange={(e) => setNewForm(prev => ({ ...prev, promiseDate: e.target.value }))}
 className="w-full p-2.5 bg-background dark:bg-white/5 border border-border rounded-xl font-bold"
 />
 </div>

 <div>
 <label className="block font-bold text-foreground dark:text-gray-200 mb-1">Nominal Janji Setor (Rp)</label>
 <input
 type="number"
 value={newForm.promisedAmount}
 onChange={(e) => setNewForm(prev => ({ ...prev, promisedAmount: Number(e.target.value) }))}
 className="w-full p-2.5 bg-background dark:bg-white/5 border border-border rounded-xl font-bold"
 />
 </div>

 <div>
 <label className="block font-bold text-foreground dark:text-gray-200 mb-1">No. WhatsApp Debitur</label>
 <input
 type="text"
 value={newForm.contactWa}
 onChange={(e) => setNewForm(prev => ({ ...prev, contactWa: e.target.value }))}
 className="w-full p-2.5 bg-background dark:bg-white/5 border border-border rounded-xl"
 />
 </div>

 <div>
 <label className="block font-bold text-foreground dark:text-gray-200 mb-1">Catatan Kesepakatan</label>
 <textarea
 rows={2}
 value={newForm.notes}
 onChange={(e) => setNewForm(prev => ({ ...prev, notes: e.target.value }))}
 placeholder="misal: Setor via teller Cabang Bandung sebelum jam 15.00..."
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
 Simpan Janji Bayar
 </button>
 </div>
 </motion.div>
 </div>
 )}
 </AnimatePresence>

 </div>
 );
}
