import React, { useState } from 'react';
import { useData } from '../../../context/FundingContext';
import { Settings, Shield, RotateCcw, Check, UserCheck, Moon, Sun, Database } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { userRole, setUserRole, resetToSeedData, portfolio, dailyAdditions } = useData();
  const [resetSuccess, setResetSuccess] = useState(false);

  const handleReset = () => {
    if (window.confirm('Apakah Anda yakin ingin mengembalikan seluruh data ke baseline awal (Matesih 11-Aug-2026)? Data input tambahan Anda akan tereset.')) {
      resetToSeedData();
      setResetSuccess(true);
      setTimeout(() => setResetSuccess(false), 3000);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="glass-effect rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs">
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Pengaturan Aplikasi & Peran Pengguna
          </h2>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Atur hak akses aplikasi, manajemen database lokal, serta pemulihan data baseline awal.
        </p>
      </div>

      {/* Role Switching Section */}
      <div className="glass-effect rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <Shield className="w-4 h-4 text-emerald-600" />
          <h3 className="font-bold text-slate-900 dark:text-white text-sm">
            Mode Akses / Role Management
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <button
            onClick={() => setUserRole('Management')}
            className={`p-4 rounded-xl border text-left transition-all ${
              userRole === 'Management'
                ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200'
                : 'border-slate-200/50 dark:border-white/10 glass-effect text-slate-700 dark:text-slate-300'
            }`}
          >
            <div className="font-bold text-sm flex items-center justify-between">
              <span>Management / Direksi</span>
              {userRole === 'Management' && <UserCheck className="w-4 h-4 text-emerald-600" />}
            </div>
            <p className="text-[11px] opacity-80 mt-1">
              Akses penuh ke seluruh Kantor Kas, Executive Board, pengaturan target, dan laporan konsolidasi.
            </p>
          </button>

          <button
            onClick={() => setUserRole('Kasir')}
            className={`p-4 rounded-xl border text-left transition-all ${
              userRole === 'Kasir'
                ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200'
                : 'border-slate-200/50 dark:border-white/10 glass-effect text-slate-700 dark:text-slate-300'
            }`}
          >
            <div className="font-bold text-sm flex items-center justify-between">
              <span>Staff / Petugas Kas</span>
              {userRole === 'Kasir' && <UserCheck className="w-4 h-4 text-emerald-600" />}
            </div>
            <p className="text-[11px] opacity-80 mt-1">
              Fokus pada input penambahan harian dan perbarui snapshot portofolio per kantor kas.
            </p>
          </button>
        </div>
      </div>

      {/* Database Status & Reset */}
      <div className="glass-effect rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-emerald-600" />
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">
              Status Data & Pemulihan Baseline
            </h3>
          </div>
          <span className="text-xs font-mono font-bold text-slate-500">
            {portfolio.length} Items Portofolio | {dailyAdditions.length} Logs Harian
          </span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
          <div>
            <h4 className="font-bold text-slate-800 dark:text-slate-200 text-xs">
              Reset Data ke Baseline Matesih (11-Aug-2026)
            </h4>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Mengembalikan total volume Rp 0 NOA, serta log transaksi penambahan harian asli.
            </p>
          </div>

          <button
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset Database</span>
          </button>
        </div>

        {resetSuccess && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-bold rounded-xl flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            Data berhasil dikembalikan ke posisi baseline awal!
          </div>
        )}
      </div>
    </div>
  );
};
