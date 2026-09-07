import React, { useState } from 'react';
import {
  ShoppingBag,
  MapPin,
  Users,
  CreditCard,
  PiggyBank,
  TrendingUp,
  Plus,
  CheckCircle2,
  Calendar,
  Layers,
  Sparkles,
  Bot,
  FileText,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const GrebekPasarView: React.FC = () => {
  const { grebekPasarCampaigns, branches } = useApp();
  const [isSmartInputOpen, setIsSmartInputOpen] = useState(false);
  const [smartInputText, setSmartInputText] = useState('');
  const [parsedResult, setParsedResult] = useState<{ totalNoa: number, totalVolume: number } | null>(null);

  const handleParseData = () => {
    let totalNoa = 0;
    let totalVolume = 0;

    // Match NOA pattern: "Jml Noa : X NOA", "Jml Noa tabungan: X NOA", "Jml noa: X NOA"
    const noaMatches = [...smartInputText.matchAll(/Jml\s*(?:noa|Noa)(?:\s*tabungan|\s*deposito)?\s*:\s*(\d+)/ig)];
    noaMatches.forEach(m => totalNoa += parseInt(m[1]));

    // Match Volume pattern: "Volume : 41.140.206", "Volume: 50.000.000"
    const volumeRegex = /Volume\s*:\s*([0-9\.]+)/ig;
    let match;
    while ((match = volumeRegex.exec(smartInputText)) !== null) {
      const volStr = match[1].replace(/\./g, '');
      totalVolume += parseInt(volStr);
    }

    setParsedResult({ totalNoa, totalVolume });
  };

  return (
    <div className="space-y-5 animate-in fade-in">
      {/* Header Banner */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">
              COMMUNITY & MARKET CANVASSING
            </span>
            <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 text-[10px] font-bold border border-amber-200">
              Akuisisi Massal Pedagang Pasar
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 mt-1">Program Grebek Pasar Tradisional</h1>
          <p className="text-xs text-slate-500 mt-1">
            Ekspansi inklusi keuangan terpadu, jemput bola tabungan harian, dan pembiayaan modal kerja pedagang pasar.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <span className="text-xs text-slate-500 font-medium">Total 3 Kampanye Berjalan Aktif</span>
          <button 
            onClick={() => setIsSmartInputOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors"
          >
            <Bot size={14} className="text-amber-400" /> Smart Input Laporan
          </button>
        </div>
      </div>

      {/* SMART INPUT MODAL */}
      {isSmartInputOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-amber-400">
                  <Bot size={20} />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-lg tracking-tight">Otomatisasi Input Laporan (AI)</h3>
                  <p className="text-[11px] text-slate-500 font-medium">Copy-Paste laporan format WhatsApp, sistem akan mengekstrak data otomatis.</p>
                </div>
              </div>
              <button onClick={() => { setIsSmartInputOpen(false); setParsedResult(null); setSmartInputText(''); }} className="p-2 text-slate-400 hover:text-rose-500 bg-white rounded-full transition-colors">
                <Plus className="w-5 h-5 rotate-45" />
              </button>
            </div>
            
            <div className="p-5 flex-1 overflow-y-auto space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Paste Teks Laporan Di Sini:</label>
                <textarea
                  value={smartInputText}
                  onChange={(e) => setSmartInputText(e.target.value)}
                  placeholder="Contoh:&#10;Tanggal : Jumat, 28/08/26&#10;Kantor Kas mateseh&#10;...&#10;Pasar mateseh&#10;Jml Noa tabungan: 25 NOA&#10;Volume : 41.140.206"
                  className="w-full h-48 p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-slate-900 resize-none"
                />
              </div>

              {parsedResult ? (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl animate-in slide-in-from-bottom-4">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle2 size={16} className="text-emerald-600" />
                    <span className="text-sm font-bold text-emerald-900">Data Berhasil Diekstrak</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-white rounded-xl border border-emerald-100 shadow-sm">
                      <p className="text-[10px] uppercase font-bold text-slate-400">Total Penambahan NOA</p>
                      <p className="text-xl font-black text-slate-900">{parsedResult.totalNoa} <span className="text-xs text-slate-500 font-medium">Rekening Baru</span></p>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-emerald-100 shadow-sm">
                      <p className="text-[10px] uppercase font-bold text-slate-400">Total Volume Terhimpun</p>
                      <p className="text-xl font-black text-emerald-600">Rp {parsedResult.totalVolume.toLocaleString('id-ID')}</p>
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-emerald-200/50 flex justify-end gap-2">
                    <button onClick={() => setParsedResult(null)} className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800">Edit Ulang</button>
                    <button onClick={() => { alert('Data berhasil disimpan ke sistem pusat!'); setIsSmartInputOpen(false); }} className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 shadow-sm flex items-center gap-2">
                      <CheckCircle2 size={14} /> Simpan ke Database
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex justify-end">
                  <button 
                    onClick={handleParseData}
                    disabled={!smartInputText.trim()}
                    className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm flex items-center gap-2"
                  >
                    <Sparkles size={16} className="text-amber-400" /> Ekstrak Data
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Campaign Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {grebekPasarCampaigns.map((camp) => (
          <div
            key={camp.id}
            className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between space-y-4 hover:border-slate-300 transition-colors"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 flex items-center justify-center">
                    <ShoppingBag className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{camp.campaignName}</h3>
                    <div className="text-[11px] text-slate-500 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-red-500" /> {camp.marketLocation}
                    </div>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                  {camp.status}
                </span>
              </div>

              <div className="text-xs text-slate-600">
                <span>Koordinator: {camp.coordinatorName}</span>
                <div className="text-[11px] text-slate-500">
                  Jadwal: {camp.startDate} s/d {camp.endDate}
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-slate-500 text-[10px]">Merchant Terdaftar</span>
                  <p className="font-bold text-slate-900 text-sm">{camp.acquiredMerchantsCount} Pedagang</p>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-slate-500 text-[10px]">Prospek Terjaring</span>
                  <p className="font-bold text-amber-800 text-sm">{camp.leadsGeneratedCount} Leads</p>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-slate-500 text-[10px]">Realisasi Funding</span>
                  <p className="font-bold text-blue-700 font-mono text-[11px]">
                    Rp {(camp.realizedFunding / 1000000).toLocaleString('id-ID')} Jt
                  </p>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-slate-500 text-[10px]">Realisasi Kredit</span>
                  <p className="font-bold text-emerald-700 font-mono text-[11px]">
                    Rp {(camp.realizedLending / 1000000).toLocaleString('id-ID')} Jt
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
              <span>{camp.officersAssigned.length} Tim Lapangan</span>
              <span className="text-blue-600 hover:text-blue-700 font-semibold cursor-pointer">Buka Peta Pasar &rarr;</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
