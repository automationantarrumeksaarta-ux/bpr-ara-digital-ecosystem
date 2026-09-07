import React, { useState } from 'react';
import { useData } from '../../../context/FundingContext';
import { X, Plus, Check } from 'lucide-react';

interface AddDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'daily' | 'portfolio';
}

export const AddDataModal: React.FC<AddDataModalProps> = ({ isOpen, onClose, defaultTab = 'daily' }) => {
  const { addDailyAddition, addPortfolioItem, selectedDate } = useData();
  const [activeTab, setActiveTab] = useState<'daily' | 'portfolio'>(defaultTab);

  // Daily Addition Form State
  const [dailyForm, setDailyForm] = useState({
    tanggal: selectedDate,
    kantor_kas: 'Matesih',
    nama_sumber: 'Pasar Matesih',
    kategori_sumber: 'Pasar',
    produk: 'Tabungan' as 'Tabungan' | 'Deposito',
    noa_baru: 1,
    volume_baru: 500000,
    keterangan: 'Setoran rutin pedagang',
  });

  // Portfolio Form State
  const [portfolioForm, setPortfolioForm] = useState({
    tanggal: selectedDate,
    kantor_kas: 'Matesih',
    nama_sumber: 'Pasar Matesih',
    kategori_sumber: 'Pasar',
    produk: 'Tabungan' as 'Tabungan' | 'Deposito',
    noa: 1,
    volume: 10000000,
    jadwal: 'Harian',
    keterangan: '',
  });

  if (!isOpen) return null;

  const handleDailySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addDailyAddition({
      id: `d-${Date.now()}`,
      ...dailyForm,
    });
    onClose();
  };

  const handlePortfolioSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addPortfolioItem({
      id: `p-${Date.now()}`,
      ...portfolioForm,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="glass-effect rounded-2xl border border-slate-200/50 dark:border-white/10 w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-base">Input Data Funding</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200/50 dark:border-white/10 bg-slate-50 dark:bg-slate-800/50 p-1">
          <button
            onClick={() => setActiveTab('daily')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'daily'
                ? 'glass-effect text-emerald-600 dark:text-emerald-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            + Penambahan Harian (Log)
          </button>
          <button
            onClick={() => setActiveTab('portfolio')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'portfolio'
                ? 'glass-effect text-emerald-600 dark:text-emerald-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            + Snapshot Portofolio
          </button>
        </div>

        {/* Form Body */}
        {activeTab === 'daily' ? (
          <form onSubmit={handleDailySubmit} className="p-5 space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tanggal
                </label>
                <input
                  type="date"
                  value={dailyForm.tanggal}
                  onChange={(e) => setDailyForm({ ...dailyForm, tanggal: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200/50 dark:border-white/10 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Kantor Kas
                </label>
                <select
                  value={dailyForm.kantor_kas}
                  onChange={(e) => setDailyForm({ ...dailyForm, kantor_kas: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200/50 dark:border-white/10 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                >
                  <option value="Matesih">Matesih</option>
                  <option value="Klodran">Klodran</option>
                  <option value="Jumapolo">Jumapolo</option>
                  <option value="Kantor Pusat">Kantor Pusat</option>

                </select>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Nama Sumber / Pasar
              </label>
              <input
                type="text"
                value={dailyForm.nama_sumber}
                onChange={(e) => setDailyForm({ ...dailyForm, nama_sumber: e.target.value })}
                placeholder="Contoh: Pasar Matesih / PKK Desa X"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200/50 dark:border-white/10 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Kategori Sumber
                </label>
                <select
                  value={dailyForm.kategori_sumber}
                  onChange={(e) => setDailyForm({ ...dailyForm, kategori_sumber: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200/50 dark:border-white/10 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                >
                  <option value="Pasar">Pasar</option>
                  <option value="PKK">PKK</option>
                  <option value="Pedagang">Pedagang</option>
                  <option value="Komunitas">Komunitas</option>
                  <option value="Sekolah">Sekolah</option>
                  <option value="Desa / RW">Desa / RW</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Produk
                </label>
                <select
                  value={dailyForm.produk}
                  onChange={(e) => setDailyForm({ ...dailyForm, produk: e.target.value as 'Tabungan' | 'Deposito' })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200/50 dark:border-white/10 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                >
                  <option value="Tabungan">Tabungan</option>
                  <option value="Deposito">Deposito</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  NOA Baru
                </label>
                <input
                  type="number"
                  min={0}
                  value={dailyForm.noa_baru}
                  onChange={(e) => setDailyForm({ ...dailyForm, noa_baru: parseInt(e.target.value, 10) || 0 })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200/50 dark:border-white/10 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-mono"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Volume Nominal Baru (Rp)
                </label>
                <input
                  type="number"
                  min={0}
                  step={100000}
                  value={dailyForm.volume_baru}
                  onChange={(e) => setDailyForm({ ...dailyForm, volume_baru: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200/50 dark:border-white/10 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-mono"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Keterangan
              </label>
              <input
                type="text"
                value={dailyForm.keterangan}
                onChange={(e) => setDailyForm({ ...dailyForm, keterangan: e.target.value })}
                placeholder="Catatan tambahan..."
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200/50 dark:border-white/10 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-all"
              >
                Simpan Penambahan
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handlePortfolioSubmit} className="p-5 space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tanggal Snapshot
                </label>
                <input
                  type="date"
                  value={portfolioForm.tanggal}
                  onChange={(e) => setPortfolioForm({ ...portfolioForm, tanggal: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200/50 dark:border-white/10 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Kantor Kas
                </label>
                <select
                  value={portfolioForm.kantor_kas}
                  onChange={(e) => setPortfolioForm({ ...portfolioForm, kantor_kas: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200/50 dark:border-white/10 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                >
                  <option value="Matesih">Matesih</option>
                  <option value="Klodran">Klodran</option>
                  <option value="Jumapolo">Jumapolo</option>
                  <option value="Kantor Pusat">Kantor Pusat</option>

                </select>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Nama Sumber / Entitas
              </label>
              <input
                type="text"
                value={portfolioForm.nama_sumber}
                onChange={(e) => setPortfolioForm({ ...portfolioForm, nama_sumber: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200/50 dark:border-white/10 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Kategori Sumber
                </label>
                <select
                  value={portfolioForm.kategori_sumber}
                  onChange={(e) => setPortfolioForm({ ...portfolioForm, kategori_sumber: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200/50 dark:border-white/10 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                >
                  <option value="Pasar">Pasar</option>
                  <option value="PKK">PKK</option>
                  <option value="Pedagang">Pedagang</option>
                  <option value="Komunitas">Komunitas</option>
                  <option value="Sekolah">Sekolah</option>
                  <option value="Desa / RW">Desa / RW</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Produk
                </label>
                <select
                  value={portfolioForm.produk}
                  onChange={(e) => setPortfolioForm({ ...portfolioForm, produk: e.target.value as 'Tabungan' | 'Deposito' })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200/50 dark:border-white/10 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                >
                  <option value="Tabungan">Tabungan</option>
                  <option value="Deposito">Deposito</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Total NOA Aktif
                </label>
                <input
                  type="number"
                  value={portfolioForm.noa}
                  onChange={(e) => setPortfolioForm({ ...portfolioForm, noa: parseInt(e.target.value, 10) || 0 })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200/50 dark:border-white/10 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-mono"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Total Volume Nominal (Rp)
                </label>
                <input
                  type="number"
                  value={portfolioForm.volume}
                  onChange={(e) => setPortfolioForm({ ...portfolioForm, volume: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200/50 dark:border-white/10 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-mono"
                  required
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-all"
              >
                Simpan Snapshot
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
