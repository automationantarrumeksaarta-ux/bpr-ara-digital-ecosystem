import React, { useState } from 'react';
import { 
 AlertTriangle, 
 ShieldAlert, 
 Search, 
 Filter, 
 Plus, 
 Edit3, 
 FileText, 
 CheckCircle2, 
 Clock, 
 DollarSign, 
 UserCheck, 
 Building,
 Calendar,
 X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { KreditBermasalahItem, Kolektibilitas, UserProfile } from '../../../types/legacy';

interface DashboardKreditBermasalahProps {
 nplList: KreditBermasalahItem[];
 onUpdateItem: (item: KreditBermasalahItem) => void;
 onAddItem: (item: KreditBermasalahItem) => void;
 currentUser: UserProfile;
}

const KOL_CONFIG: Record<Kolektibilitas, { label: string; badgeBg: string; text: string }> = {
 'KOL_1': { label: 'Kol 1 - Lancar', badgeBg: ' ', text: '' },
 'KOL_2': { label: 'Kol 2 - DPK', badgeBg: ' ', text: '' },
 'KOL_3': { label: 'Kol 3 - Kurang Lancar', badgeBg: ' ', text: '' },
 'KOL_4': { label: 'Kol 4 - Diragukan', badgeBg: ' ', text: '' },
 'KOL_5': { label: 'Kol 5 - Macet', badgeBg: ' ', text: '' },
};

export default function DashboardKreditBermasalah({
 nplList,
 onUpdateItem,
 onAddItem,
 currentUser
}: DashboardKreditBermasalahProps) {
 const [searchTerm, setSearchTerm] = useState('');
 const [kolFilter, setKolFilter] = useState<string>('ALL');
 const [selectedItem, setSelectedItem] = useState<KreditBermasalahItem | null>(null);
 const [isAddModalOpen, setIsAddModalOpen] = useState(false);

 // Form for action update
 const [actionForm, setActionForm] = useState({
 actionStatus: '',
 actionNotes: '',
 kol: 'KOL_2' as Kolektibilitas
 });

 // Form for new NPL item
 const [newItemForm, setNewItemForm] = useState({
 debtorName: '',
 aoName: currentUser.fullName || 'Andi (AO)',
 branch: 'Cabang Utama Bandung',
 kol: 'KOL_2' as Kolektibilitas,
 outstandingPrincipal: 50000000,
 interestArrears: 2000000,
 daysOverdue: 40,
 lastPaymentDate: new Date().toISOString().split('T')[0],
 actionStatus: 'Surat Peringatan (SP 1)',
 actionNotes: 'Perlu verifikasi alamat domisili dan kunjungan lapangan.',
 region: 'Kota Bandung'
 });

 const formatIDR = (val: number) => 
 new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

 // Filtered NPL list
 const filteredList = nplList.filter(item => {
 const matchesSearch = item.debtorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
 item.aoName.toLowerCase().includes(searchTerm.toLowerCase()) ||
 item.id.toLowerCase().includes(searchTerm.toLowerCase());
 const matchesKol = kolFilter === 'ALL' || item.kol === kolFilter;
 return matchesSearch && matchesKol;
 });

 // Metric summaries
 const totalNplOutstanding = nplList.reduce((acc, curr) => acc + curr.outstandingPrincipal, 0);
 const totalInterestArrears = nplList.reduce((acc, curr) => acc + curr.interestArrears, 0);
 const kolMacetCount = nplList.filter(i => i.kol === 'KOL_5').length;
 const kolDpkCount = nplList.filter(i => i.kol === 'KOL_2').length;

 const handleOpenActionModal = (item: KreditBermasalahItem) => {
 setSelectedItem(item);
 setActionForm({
 actionStatus: item.actionStatus,
 actionNotes: item.actionNotes,
 kol: item.kol
 });
 };

 const handleSaveAction = () => {
 if (!selectedItem) return;
 const updated: KreditBermasalahItem = {
 ...selectedItem,
 actionStatus: actionForm.actionStatus,
 actionNotes: actionForm.actionNotes,
 kol: actionForm.kol
 };
 onUpdateItem(updated);
 setSelectedItem(null);
 };

 const handleSaveNewItem = () => {
 if (!newItemForm.debtorName) return;
 const newItem: KreditBermasalahItem = {
 id: `NPL-${String(nplList.length + 1).padStart(3, '0')}`,
 ...newItemForm
 };
 onAddItem(newItem);
 setIsAddModalOpen(false);
 setNewItemForm({
 debtorName: '',
 aoName: currentUser.fullName || 'Andi (AO)',
 branch: 'Cabang Utama Bandung',
 kol: 'KOL_2',
 outstandingPrincipal: 50000000,
 interestArrears: 2000000,
 daysOverdue: 40,
 lastPaymentDate: new Date().toISOString().split('T')[0],
 actionStatus: 'Surat Peringatan (SP 1)',
 actionNotes: '',
 region: 'Kota Bandung'
 });
 };

 return (
 <div className="space-y-6">
 
 {/* Title & Action */}
 <div className="bg-surface shadow-md p-6 rounded-[24px] text-foreground shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
 <div>
 <div className="flex items-center gap-2 mb-1">
 <ShieldAlert size={22} className="text-primary" />
 <h2 className="text-xl font-black tracking-tight">A. Dashboard Kredit Bermasalah (NPL Supervision)</h2>
 </div>
 <p className="text-xs max-w-2xl">
 Monitoring kredit bermasalah berdasarkan status kolektibilitas (Kol 1 - Kol 5), pengawasan harian, tunggakan pokok/bunga, serta pengawasan tindakan perbaikan/remedial BPR ARA.
 </p>
 </div>
 
 <button
 onClick={() => setIsAddModalOpen(true)}
 className="bg-surface/10 hover:bg-surface/20 text-foreground border border-primary-light/20 font-bold text-xs px-4 py-2.5 rounded-2xl flex items-center gap-2 transition-all cursor-pointer shadow-sm dark:shadow-none shrink-0"
 >
 <Plus size={16} />
 Tambah Catatan NPL Baru
 </button>
 </div>

 {/* Summary KPI Cards */}
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
 
 <div className="bg-surface shadow-md p-5 rounded-2xl flex items-center gap-4">
 <div className="p-3 rounded-2xl border">
 <DollarSign size={22} />
 </div>
 <div>
 <span className="text-[11px] font-bold text-muted uppercase tracking-wider block">Total Outstanding NPL</span>
 <span className="text-lg font-black text-foreground dark:text-foreground tracking-tight">{formatIDR(totalNplOutstanding)}</span>
 </div>
 </div>

 <div className="bg-surface shadow-md p-5 rounded-2xl flex items-center gap-4">
 <div className="p-3 rounded-2xl border">
 <Clock size={22} />
 </div>
 <div>
 <span className="text-[11px] font-bold text-muted uppercase tracking-wider block">Total Tunggakan Bunga</span>
 <span className="text-lg font-black text-foreground dark:text-foreground tracking-tight">{formatIDR(totalInterestArrears)}</span>
 </div>
 </div>

 <div className="bg-surface shadow-md p-5 rounded-2xl flex items-center gap-4">
 <div className="p-3 rounded-2xl border">
 <AlertTriangle size={22} />
 </div>
 <div>
 <span className="text-[11px] font-bold text-muted uppercase tracking-wider block">Debitur Macet (Kol 5)</span>
 <span className="text-xl font-black tracking-tight">{kolMacetCount} Debitur</span>
 </div>
 </div>

 <div className="bg-surface shadow-md p-5 rounded-2xl flex items-center gap-4">
 <div className="p-3 rounded-2xl border">
 <UserCheck size={22} />
 </div>
 <div>
 <span className="text-[11px] font-bold text-muted uppercase tracking-wider block">Dalam Perhatian Khusus (Kol 2)</span>
 <span className="text-xl font-black text-foreground dark:text-foreground tracking-tight">{kolDpkCount} Debitur</span>
 </div>
 </div>

 </div>

 {/* Filter and Search Bar */}
 <div className="bg-surface shadow-md p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-3">
 
 <div className="relative w-full md:w-80">
 <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
 <input
 type="text"
 placeholder="Cari debitur, ID NPL, atau AO..."
 value={searchTerm}
 onChange={(e) => setSearchTerm(e.target.value)}
 className="w-full pl-9 pr-4 py-2 bg-background dark:bg-white/5 border border-border rounded-xl text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:"
 />
 </div>

 <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
 <span className="text-xs font-bold text-muted flex items-center gap-1">
 <Filter size={14} /> Filter Kol:
 </span>
 <select
 value={kolFilter}
 onChange={(e) => setKolFilter(e.target.value)}
 className="bg-background dark:bg-white/5 border border-border rounded-xl text-xs font-bold text-foreground px-3 py-2 outline-none cursor-pointer"
 >
 <option value="ALL">Semua Kolektibilitas</option>
 <option value="KOL_2">Kol 2 - DPK</option>
 <option value="KOL_3">Kol 3 - Kurang Lancar</option>
 <option value="KOL_4">Kol 4 - Diragukan</option>
 <option value="KOL_5">Kol 5 - Macet</option>
 </select>
 </div>

 </div>

 {/* NPL Data Table */}
 <div className="bg-surface shadow-md rounded-2xl overflow-hidden">
 <div className="overflow-x-auto">
 <table className="w-full text-left border-collapse">
 <thead>
 <tr className="bg-background dark:bg-white/5 border-b border-border text-[11px] font-extrabold text-muted uppercase tracking-wider">
 <th className="py-3.5 px-4">Debitur & ID</th>
 <th className="py-3.5 px-4">Kolektibilitas</th>
 <th className="py-3.5 px-4 text-right">Outstanding Pokok</th>
 <th className="py-3.5 px-4 text-right">Tunggakan Bunga</th>
 <th className="py-3.5 px-4 text-center">Menunggak</th>
 <th className="py-3.5 px-4">AO & Wilayah</th>
 <th className="py-3.5 px-4">Status Tindak Lanjut</th>
 <th className="py-3.5 px-4 text-center">Aksi</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100 dark:divide-white/10 text-xs">
 {filteredList.length > 0 ? (
 filteredList.map((item) => {
 const kolObj = KOL_CONFIG[item.kol] || KOL_CONFIG['KOL_2'];
 return (
 <tr key={item.id} className="hover: /20 transition-colors">
 <td className="py-3.5 px-4 font-medium text-foreground dark:text-foreground">
 <span className="font-bold text-foreground dark:text-foreground block">{item.debtorName}</span>
 <span className="text-[10px] font-mono text-muted bg-surface-muted px-1.5 py-0.5 rounded border border-border">{item.id}</span>
 </td>
 <td className="py-3.5 px-4">
 <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-extrabold border ${kolObj.badgeBg} ${kolObj.text}`}>
 {kolObj.label}
 </span>
 </td>
 <td className="py-3.5 px-4 text-right font-bold text-foreground dark:text-foreground">
 {formatIDR(item.outstandingPrincipal)}
 </td>
 <td className="py-3.5 px-4 text-right font-medium">
 {formatIDR(item.interestArrears)}
 </td>
 <td className="py-3.5 px-4 text-center">
 <span className="font-extrabold px-2 py-0.5 rounded-md border">
 {item.daysOverdue} hari
 </span>
 </td>
 <td className="py-3.5 px-4">
 <span className="font-bold text-foreground block">{item.aoName}</span>
 <span className="text-[10px] text-muted">{item.region}</span>
 </td>
 <td className="py-3.5 px-4 max-w-xs">
 <span className="font-bold block">{item.actionStatus}</span>
 <p className="text-[10px] text-muted truncate mt-0.5">{item.actionNotes}</p>
 </td>
 <td className="py-3.5 px-4 text-center">
 <button
 onClick={() => handleOpenActionModal(item)}
 className="px-3 py-1.5 bg-surface-muted hover: text-foreground dark:text-gray-200 hover: font-bold rounded-xl border border-border transition-all cursor-pointer flex items-center justify-center gap-1 mx-auto"
 >
 <Edit3 size={13} /> Update Status
 </button>
 </td>
 </tr>
 );
 })
 ) : (
 <tr>
 <td colSpan={8} className="py-8 text-center text-muted font-medium">
 Tidak ada data kredit bermasalah yang cocok.
 </td>
 </tr>
 )}
 </tbody>
 </table>
 </div>
 </div>

 {/* Modal Update Action */}
 <AnimatePresence>
 {selectedItem && (
 <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary text-white/60 backdrop-blur-xs p-4">
 <motion.div 
 initial={{ scale: 0.95, opacity: 0 }}
 animate={{ scale: 1, opacity: 1 }}
 exit={{ scale: 0.95, opacity: 0 }}
 className="bg-surface rounded-[24px] max-w-md w-full p-6 border border-border shadow-xl space-y-4"
 >
 <div className="flex items-center justify-between border-b border-border pb-3">
 <h3 className="font-black text-foreground dark:text-foreground text-sm">Update Tindak Lanjut NPL</h3>
 <button onClick={() => setSelectedItem(null)} className="text-muted hover:text-muted">
 <X size={18} />
 </button>
 </div>

 <div>
 <p className="text-xs font-bold text-foreground">{selectedItem.debtorName}</p>
 <p className="text-[11px] text-muted">ID: {selectedItem.id} • AO: {selectedItem.aoName}</p>
 </div>

 <div className="space-y-3 text-xs">
 <div>
 <label className="block font-bold text-foreground dark:text-gray-200 mb-1">Status Kolektibilitas</label>
 <select
 value={actionForm.kol}
 onChange={(e) => setActionForm(prev => ({ ...prev, kol: e.target.value as Kolektibilitas }))}
 className="w-full p-2.5 bg-background dark:bg-white/5 border border-border rounded-xl font-bold text-foreground"
 >
 <option value="KOL_1">Kol 1 - Lancar</option>
 <option value="KOL_2">Kol 2 - DPK</option>
 <option value="KOL_3">Kol 3 - Kurang Lancar</option>
 <option value="KOL_4">Kol 4 - Diragukan</option>
 <option value="KOL_5">Kol 5 - Macet</option>
 </select>
 </div>

 <div>
 <label className="block font-bold text-foreground dark:text-gray-200 mb-1">Status Tindak Lanjut (Legal / Remedial)</label>
 <input
 type="text"
 value={actionForm.actionStatus}
 onChange={(e) => setActionForm(prev => ({ ...prev, actionStatus: e.target.value }))}
 placeholder="misal: Surat Peringatan (SP 2), Restrukturisasi, Eksekusi..."
 className="w-full p-2.5 bg-background dark:bg-white/5 border border-border rounded-xl font-medium"
 />
 </div>

 <div>
 <label className="block font-bold text-foreground dark:text-gray-200 mb-1">Catatan Hasil Follow-up</label>
 <textarea
 rows={3}
 value={actionForm.actionNotes}
 onChange={(e) => setActionForm(prev => ({ ...prev, actionNotes: e.target.value }))}
 placeholder="Hasil penagihan, perjanjian pembayaran, atau langkah eksekusi..."
 className="w-full p-2.5 bg-background dark:bg-white/5 border border-border rounded-xl font-medium"
 />
 </div>
 </div>

 <div className="flex items-center justify-end gap-2 pt-2">
 <button
 onClick={() => setSelectedItem(null)}
 className="px-4 py-2 text-xs font-bold text-muted hover:bg-surface-muted rounded-xl"
 >
 Batal
 </button>
 <button
 onClick={handleSaveAction}
 className="px-4 py-2 text-xs font-bold hover: text-foreground rounded-xl shadow-sm dark:shadow-none"
 >
 Simpan Tindak Lanjut
 </button>
 </div>
 </motion.div>
 </div>
 )}
 </AnimatePresence>

 {/* Modal Add New NPL */}
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
 <h3 className="font-black text-foreground dark:text-foreground text-sm">Tambah Record NPL / Kredit Bermasalah</h3>
 <button onClick={() => setIsAddModalOpen(false)} className="text-muted hover:text-muted">
 <X size={18} />
 </button>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
 <div className="sm:col-span-2">
 <label className="block font-bold text-foreground dark:text-gray-200 mb-1">Nama Debitur / Usaha</label>
 <input
 type="text"
 value={newItemForm.debtorName}
 onChange={(e) => setNewItemForm(prev => ({ ...prev, debtorName: e.target.value }))}
 placeholder="Toko ABC / Budi Santoso"
 className="w-full p-2.5 bg-background dark:bg-white/5 border border-border rounded-xl"
 />
 </div>

 <div>
 <label className="block font-bold text-foreground dark:text-gray-200 mb-1">Nama Account Officer (AO)</label>
 <input
 type="text"
 value={newItemForm.aoName}
 onChange={(e) => setNewItemForm(prev => ({ ...prev, aoName: e.target.value }))}
 className="w-full p-2.5 bg-background dark:bg-white/5 border border-border rounded-xl"
 />
 </div>

 <div>
 <label className="block font-bold text-foreground dark:text-gray-200 mb-1">Kolektibilitas</label>
 <select
 value={newItemForm.kol}
 onChange={(e) => setNewItemForm(prev => ({ ...prev, kol: e.target.value as Kolektibilitas }))}
 className="w-full p-2.5 bg-background dark:bg-white/5 border border-border rounded-xl font-bold"
 >
 <option value="KOL_2">Kol 2 - DPK</option>
 <option value="KOL_3">Kol 3 - Kurang Lancar</option>
 <option value="KOL_4">Kol 4 - Diragukan</option>
 <option value="KOL_5">Kol 5 - Macet</option>
 </select>
 </div>

 <div>
 <label className="block font-bold text-foreground dark:text-gray-200 mb-1">Outstanding Pokok (Rp)</label>
 <input
 type="number"
 value={newItemForm.outstandingPrincipal}
 onChange={(e) => setNewItemForm(prev => ({ ...prev, outstandingPrincipal: Number(e.target.value) }))}
 className="w-full p-2.5 bg-background dark:bg-white/5 border border-border rounded-xl"
 />
 </div>

 <div>
 <label className="block font-bold text-foreground dark:text-gray-200 mb-1">Tunggakan Bunga (Rp)</label>
 <input
 type="number"
 value={newItemForm.interestArrears}
 onChange={(e) => setNewItemForm(prev => ({ ...prev, interestArrears: Number(e.target.value) }))}
 className="w-full p-2.5 bg-background dark:bg-white/5 border border-border rounded-xl"
 />
 </div>

 <div>
 <label className="block font-bold text-foreground dark:text-gray-200 mb-1">Hari Menunggak</label>
 <input
 type="number"
 value={newItemForm.daysOverdue}
 onChange={(e) => setNewItemForm(prev => ({ ...prev, daysOverdue: Number(e.target.value) }))}
 className="w-full p-2.5 bg-background dark:bg-white/5 border border-border rounded-xl"
 />
 </div>

 <div>
 <label className="block font-bold text-foreground dark:text-gray-200 mb-1">Wilayah / Daerah</label>
 <input
 type="text"
 value={newItemForm.region}
 onChange={(e) => setNewItemForm(prev => ({ ...prev, region: e.target.value }))}
 placeholder="Kota Bandung / Cimahi"
 className="w-full p-2.5 bg-background dark:bg-white/5 border border-border rounded-xl"
 />
 </div>

 <div className="sm:col-span-2">
 <label className="block font-bold text-foreground dark:text-gray-200 mb-1">Status Tindak Lanjut Awal</label>
 <input
 type="text"
 value={newItemForm.actionStatus}
 onChange={(e) => setNewItemForm(prev => ({ ...prev, actionStatus: e.target.value }))}
 placeholder="misal: SP 1, Penagihan Lapangan..."
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
 onClick={handleSaveNewItem}
 className="px-4 py-2 text-xs font-bold hover: text-foreground rounded-xl shadow-sm dark:shadow-none"
 >
 Simpan Data NPL
 </button>
 </div>
 </motion.div>
 </div>
 )}
 </AnimatePresence>

 </div>
 );
}
