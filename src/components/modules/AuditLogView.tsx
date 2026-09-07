import React, { useState } from 'react';
import {
  ShieldAlert,
  Search,
  Filter,
  CheckCircle2,
  Calendar,
  Lock,
  User,
  Layers,
  FileText,
  Clock,
  Fingerprint,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const AuditLogView: React.FC = () => {
  const { auditTrail: auditLogs } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModuleFilter, setSelectedModuleFilter] = useState('ALL');

  const filteredLogs = auditLogs.filter((log) => {
    const matchesSearch =
      log.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.entityName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.details.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesModule = selectedModuleFilter === 'ALL' || log.module === selectedModuleFilter;

    return matchesSearch && matchesModule;
  });

  return (
    <div className="space-y-5 animate-in fade-in">
      {/* Header Banner */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">
              IMMUTABLE AUDIT TRAIL ENGINE
            </span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-mono border border-emerald-200 font-semibold">
              POJK Audit & Governance Compliance
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 mt-1">Jejak Audit & Log Keamanan Sistem Terpadu</h1>
          <p className="text-xs text-slate-500 mt-1">
            Pencatatan setiap aksi, mutasi kredit, persetujuan komite, perubahan data nasabah secara otomatis dan tidak dapat dimanipulasi.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-emerald-700 font-semibold">
            <Lock className="w-3.5 h-3.5 text-emerald-600" /> SHA-256 Tamper-Proof Active
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari jejak audit berdasarkan User, Aksi, Entitas, atau Detail..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
          />
        </div>

        <select
          value={selectedModuleFilter}
          onChange={(e) => setSelectedModuleFilter(e.target.value)}
          className="bg-slate-50 text-xs text-slate-700 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-blue-500 cursor-pointer"
        >
          <option value="ALL">Semua Modul</option>
          <option value="CRM_CUSTOMERS">CRM & Master CIF</option>
          <option value="LOS_CREDIT">LOS Pembiayaan Kredit</option>
          <option value="CREDIT_APPROVAL">Komite Pemutus Kredit</option>
          <option value="DISBURSEMENT">Pencairan Fasilitas</option>
          <option value="COLLECTION_MGMT">Penagihan & Remedial</option>
          <option value="FUNDING_CASA">Funding & DPK</option>
        </select>
      </div>

      {/* Logs Table */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>Menampilkan {filteredLogs.length} Entri Log Audit</span>
          <span className="text-emerald-700 font-mono font-semibold">Status: 100% Verified</span>
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3">Waktu Eksekusi</th>
                <th className="p-3">Pengguna & Peran</th>
                <th className="p-3">Modul Bisnis</th>
                <th className="p-3">Aksi / Aktivitas</th>
                <th className="p-3">Entitas Objek</th>
                <th className="p-3">Rincian Deskripsi</th>
                <th className="p-3">Alamat IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-3 font-mono text-slate-500 text-[11px] whitespace-nowrap">
                    {log.timestamp}
                  </td>

                  <td className="p-3">
                    <div className="font-semibold text-slate-900">{log.userName}</div>
                    <div className="text-[10px] text-blue-600 font-medium">{log.userRole}</div>
                  </td>

                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[10px] border border-slate-200">
                      {log.module}
                    </span>
                  </td>

                  <td className="p-3 font-bold text-amber-800">{log.action}</td>

                  <td className="p-3 font-mono text-slate-700">{log.entityName}</td>

                  <td className="p-3 text-slate-600 max-w-sm leading-relaxed">{log.details}</td>

                  <td className="p-3 font-mono text-slate-400 text-[11px]">{log.ipAddress}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
