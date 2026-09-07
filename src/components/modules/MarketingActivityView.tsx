import React, { useState } from 'react';
import {
  Target,
  MapPin,
  Calendar,
  User,
  Plus,
  CheckCircle2,
  Clock,
  Camera,
  Layers,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const MarketingActivityView: React.FC = () => {
  const { currentUser, customers, openCustomer360, createFlowTask, recordAuditLog } = useApp();

  const [activities] = useState<any[]>([]);

  return (
    <div className="space-y-5 animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 flex items-center gap-2">
        <span className="text-[10px] font-black text-slate-400 tracking-widest uppercase">
          CUSTOMER & MARKETING / FIELD ACTIVITY
        </span>
      </div>
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">
              FIELD MARKETING & SALESFORCE
            </span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
              GPS Geotagging Aktif
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 mt-1">Aktivitas & Log Kunjungan Marketing</h1>
          <p className="text-xs text-slate-500 mt-1">
            Pencatatan kunjungan prospek, kanvasing harian, dan tindak lanjut nasabah dengan bukti foto dan koordinat GPS.
          </p>
        </div>

        <div className="flex flex-col items-end gap-1">
          <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-lg text-[10px] font-bold uppercase tracking-wider border border-slate-200">
            Sumber Data: Mobile App
          </span>
          <span className="text-[10px] text-slate-400">Sinkronisasi Real-time</span>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">Total Kunjungan Bulan Ini</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">0 Kunjungan</div>
          <div className="text-[11px] text-emerald-700 font-medium mt-1 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" /> 0% dari Target Harian
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">Konversi Prospek ke Aplikasi</div>
          <div className="text-2xl font-bold text-emerald-700 mt-1">0%</div>
          <div className="text-[11px] text-slate-500 mt-1">54 Pengajuan Kredit & CASA Baru</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">Validasi Koordinat GPS</div>
          <div className="text-2xl font-bold text-blue-700 mt-1">100% Terverifikasi</div>
          <div className="text-[11px] text-slate-500 mt-1">Anti-Fraud Radius Compliance</div>
        </div>
      </div>

      {/* Activity Timeline List */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900">Logbook Aktivitas Terverifikasi Hari Ini</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {activities.length === 0 && (
            <div className="col-span-1 md:col-span-2 py-8 text-center text-slate-500 text-sm border border-dashed border-slate-200 rounded-xl">
              Belum ada logbook aktivitas
            </div>
          )}
          {activities.map((act) => (
            <div
              key={act.id}
              className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 shadow-xs"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{act.customerName}</h4>
                  <span className="text-[10px] text-blue-700 font-mono bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 font-medium">
                    {act.cif}
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                  {act.status}
                </span>
              </div>

              <div className="text-xs text-slate-700 space-y-1">
                <div className="flex items-center gap-1.5 text-slate-600">
                  <MapPin className="w-3.5 h-3.5 text-red-500" /> {act.location}
                </div>
                <div className="text-[11px] text-slate-500 font-mono">GPS: {act.gpsTag}</div>
                <p className="p-2.5 rounded-lg bg-white border border-slate-200 mt-2 text-slate-800 text-xs shadow-2xs">
                  "{act.notes}"
                </p>
              </div>

              <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
                <span>AO: {act.officerName}</span>
                <button
                  onClick={() => openCustomer360(act.cif)}
                  className="text-blue-600 hover:text-blue-700 font-semibold cursor-pointer"
                >
                  Buka Profil 360° &rarr;
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
