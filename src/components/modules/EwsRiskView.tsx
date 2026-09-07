import React, { useState } from 'react';
import {
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  Search,
  Filter,
  User,
  ArrowRight,
  TrendingDown,
  BellRing,
  Upload,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { EwsAlert, RiskLevel } from '../../types';

export const EwsRiskView: React.FC = () => {
  const { ewsAlerts, resolveEwsAlert, openCustomer360, setActiveModule, addEwsAlerts } = useApp();

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');

  const redAlerts = ewsAlerts.filter((a) => a.severity === 'RED' && !a.isResolved);
  const yellowAlerts = ewsAlerts.filter((a) => a.severity === 'YELLOW' && !a.isResolved);
  const resolvedAlerts = ewsAlerts.filter((a) => a.isResolved);

  const filteredAlerts = ewsAlerts.filter((a) => {
    if (selectedSeverity === 'ALL') return true;
    return a.severity === selectedSeverity;
  });

  const handleResolve = (alertId: string) => {
    resolveEwsAlert(alertId, 'Resolved via Dashboard');
    alert('Tindakan Lanjutan berhasil diterapkan dan status risiko telah diperbarui!');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        let text = evt.target?.result as string;
        text = text.replace(/&#(\d+)(?!;)/g, (match, dec) => String.fromCharCode(parseInt(dec, 10)));
        
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(text, "text/xml");
        const rows = Array.from(xmlDoc.getElementsByTagName("Row"));
        
        let headerMap: Record<string, number> = {};
        const newAlerts: EwsAlert[] = [];
        
        for (const row of rows) {
          const cells = Array.from(row.getElementsByTagName("Data")).map(d => d.textContent?.trim() || '');
          if (cells.includes('Nama Peminjam') && cells.includes('Baki Debet')) {
            cells.forEach((c, i) => headerMap[c] = i);
            continue;
          }
          if (headerMap['Nama Peminjam'] !== undefined && cells.length > 5) {
            const nama = cells[headerMap['Nama Peminjam']];
            const baki = cells[headerMap['Baki Debet']];
            const tunggakanStr = cells[headerMap['Tungakan']];
            
            if (nama && tunggakanStr) {
               const tunggakan = parseInt(tunggakanStr, 10);
               if (!isNaN(tunggakan) && tunggakan > 0) {
                 let severity: 'RED' | 'YELLOW' = 'YELLOW';
                 let title = 'Potensi Turun Kolektibilitas (Lancar ➔ DPK)';
                 if (tunggakan > 20) {
                   severity = 'RED';
                   title = 'Potensi Turun Kolektibilitas (DPK ➔ KL)';
                 }
                 newAlerts.push({
                   id: `EWS-XLS-${Math.random().toString(36).substring(2, 9)}`,
                   category: 'CREDIT_QUALITY',
                   severity,
                   title,
                   description: `Baki Debet: Rp${baki}, Tunggakan: ${tunggakan} Hari.`,
                   triggeredAt: new Date().toISOString(),
                   entityId: `CUST-XLS-${Math.random().toString(36).substring(2, 9)}`,
                   entityReference: nama,
                   status: 'ACTION_REQUIRED',
                   resolvedAt: undefined,
                   resolutionAction: severity === 'RED' ? 'Kunjungan lapangan segera (SP1/SP2)' : 'Hubungi nasabah'
                 });
               }
            }
          }
        }
        
        if (newAlerts.length > 0) {
          if (addEwsAlerts) addEwsAlerts(newAlerts);
          alert(`Berhasil mengimpor ${newAlerts.length} peringatan EWS dari file Excel!`);
        } else {
          alert('Tidak ada data tunggakan baru ditemukan.');
        }
      } catch (err) {
        console.error(err);
        alert('Gagal memproses file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-5 animate-in fade-in">
      {/* Header Banner */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-red-600 uppercase tracking-wider">
              EARLY WARNING SYSTEM (EWS) RISK MATRIX
            </span>
            <span className="px-2 py-0.5 rounded-full bg-red-50 text-red-700 text-[10px] font-bold border border-red-200">
              Deteksi Dini Risiko Kredit & Likuiditas
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 mt-1">Peringatan Dini & Manajemen Risiko Terintegrasi</h1>
          <p className="text-xs text-slate-500 mt-1">
            Algoritma otomatis pemantau lonjakan DPD, janji bayar ingkar (Broken PTP), dan penarikan simpanan besar.
          </p>
        </div>
      </div>

      {/* Top 3 EWS Status Banners */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-red-50/60 border border-red-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-red-800 font-bold uppercase">Risiko Kritis (MERAH)</span>
            <AlertOctagon className="w-5 h-5 text-red-600" />
          </div>
          <div className="text-2xl font-bold text-red-700 mt-2 font-mono">{redAlerts.length} Kasus Aktif</div>
          <div className="text-[11px] text-slate-600 mt-1">Perlu tindakan mitigasi & penagihan dalam 24 Jam</div>
        </div>

        <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-amber-800 font-bold uppercase">Peringatan Waspada (KUNING)</span>
            <AlertTriangle className="w-5 h-5 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-amber-700 mt-2 font-mono">{yellowAlerts.length} Kasus Aktif</div>
          <div className="text-[11px] text-slate-600 mt-1">Penurunan mutasi tabungan & keterlambatan awal</div>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-emerald-800 font-bold uppercase">Terselesaikan (Resolved)</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-700 mt-2 font-mono">{resolvedAlerts.length} Kasus</div>
          <div className="text-[11px] text-slate-600 mt-1">Mitigasi risiko sukses dilakukan</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex gap-2">
          {['ALL', 'RED', 'YELLOW', 'GREEN'].map((sev) => (
            <button
              key={sev}
              onClick={() => setSelectedSeverity(sev)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors shadow-xs ${
                selectedSeverity === sev
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {sev === 'ALL' ? 'Semua Peringatan' : `Tingkat ${sev}`}
            </button>
          ))}
        </div>
        
        {/* Upload Excel Button */}
        <div>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            accept=".xls,.xml,.xlsx" 
            className="hidden" 
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-colors"
          >
            <Upload size={14} /> Upload Data EWS (.xls)
          </button>
        </div>
      </div>

      {/* EWS Alerts Grid */}
      <div className="space-y-3">
        {filteredAlerts.map((alert) => (
          <div
            key={alert.id}
            className={`p-4 rounded-2xl border transition-all shadow-xs ${
              alert.severity === 'RED'
                ? 'bg-red-50/40 border-red-200 hover:border-red-300'
                : alert.severity === 'YELLOW'
                ? 'bg-amber-50/40 border-amber-200 hover:border-amber-300'
                : 'bg-white border-slate-200'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                      alert.severity === 'RED'
                        ? 'bg-red-100 text-red-700 border-red-200'
                        : 'bg-amber-100 text-amber-700 border-amber-200'
                    }`}
                  >
                    {alert.category}
                  </span>
                  <span className="text-slate-500 text-xs font-mono">{alert.triggeredAt}</span>
                  {alert.status === 'RESOLVED' && (
                    <span className="flex items-center gap-1 text-emerald-600 text-[11px] font-bold">
                      <CheckCircle2 size={12} /> TERTANGANI
                    </span>
                  )}
                </div>

                <h4 className="text-sm font-bold text-slate-900">
                  {alert.title} ({alert.entityReference})
                </h4>
                <p className="text-xs text-slate-600">{alert.description}</p>
                <p className="text-[11px] font-medium text-slate-700 bg-white/60 p-2 rounded-lg border border-slate-200/60 inline-block">
                  Rekomendasi Tindakan: {alert.resolutionAction || 'Investigasi segera'}
                </p>
              </div>

              <div className="flex sm:flex-col items-center sm:items-end gap-2">
                <button
                  onClick={() => openCustomer360(alert.entityId)}
                  className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-[11px] font-semibold cursor-pointer shadow-xs w-full sm:w-auto text-center"
                >
                  Investigasi (360°)
                </button>
                {alert.status !== 'RESOLVED' ? (
                  <div className="flex items-center gap-1.5 mt-1 sm:mt-0">
                    <select className="px-2 py-1.5 rounded-xl border border-slate-200 text-[10px] text-slate-700 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-xs max-w-[150px]">
                      <option value="">-- Tindakan Lanjutan --</option>
                      <option value="SP1">Kirim SP1</option>
                      <option value="SP2">Kirim SP2</option>
                      <option value="KUNJUNGAN">Kunjungan Lapangan</option>
                      <option value="RESTRUKTURISASI">Restrukturisasi 3R</option>
                      <option value="SOMASI">Somasi / Eksekusi</option>
                    </select>
                    <button
                      onClick={() => handleResolve(alert.id)}
                      className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold flex items-center justify-center cursor-pointer shadow-xs"
                    >
                      Terapkan
                    </button>
                  </div>
                ) : (
                  <button
                    disabled
                    className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold flex items-center justify-center gap-1.5 shadow-xs w-full sm:w-auto opacity-70 cursor-not-allowed"
                  >
                    <CheckCircle2 size={14} /> Selesai
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
