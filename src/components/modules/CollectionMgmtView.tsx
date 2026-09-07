import React, { useState } from 'react';
import {
  Phone,
  MapPin,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  FileText,
  MessageSquare,
  Activity,
  AlertOctagon,
  ShieldAlert,
  AlertCircle,
  Clock
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const CollectionMgmtView: React.FC = () => {
  const {
    collectionCases,
    ptpRecords,
    recordPromiseToPay,
    openCustomer360,
    setActiveModule,
    macroMetrics,
  } = useApp();

  const [selectedCaseId, setSelectedCaseId] = useState<string>(
    collectionCases.length > 0 ? collectionCases[0].id : ''
  );
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'DPK' | 'KL' | 'D' | 'M'>('ALL');

  const activeCase = collectionCases.find((c) => c.id === selectedCaseId);
  const activeCasePtp = activeCase ? ptpRecords.filter(p => p.caseId === activeCase.id) : [];
  const latestPtp = activeCasePtp.length > 0 ? activeCasePtp[activeCasePtp.length - 1] : null;

  // SP Generation States
  const [spStatus, setSpStatus] = useState<Record<string, string>>({});

  // New PTP Form Modal
  const [isPtpModalOpen, setIsPtpModalOpen] = useState(false);
  const [ptpForm, setPtpForm] = useState({
    promiseDate: new Date().toISOString().split('T')[0],
    promisedAmount: activeCase ? activeCase.overdueAmount : 0,
    notes: '',
  });

  const handleCreatePtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCase) return;

    recordPromiseToPay({
      caseId: activeCase.id,
      facilityId: activeCase.facilityId,
      cif: activeCase.cif,
      debtorName: activeCase.debtorName,
      promiseDate: ptpForm.promiseDate,
      promisedAmount: ptpForm.promisedAmount,
      notes: ptpForm.notes,
    });

    setIsPtpModalOpen(false);
    alert('Janji Bayar (PTP) Berhasil Dicatat! Pengingat otomatis terjadwal di kalender.');
  };

  const handleIssueSP = (level: string) => {
    if (!activeCase) return;
    const confirmMsg = `Konfirmasi penerbitan Surat Peringatan ${level} untuk ${activeCase.debtorName}?`;
    if (confirm(confirmMsg)) {
      setSpStatus(prev => ({ ...prev, [activeCase.id]: level }));
    }
  };

  const formatIDR = (val: number) => {
    if (val >= 1_000_000_000) return `Rp ${(val / 1_000_000_000).toFixed(2)} M`;
    if (val >= 1_000_000) return `Rp ${(val / 1_000_000).toFixed(1)} Jt`;
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  // 1. Calculate Bucket Summaries based on Kolektibilitas string
  const getColLabel = (colEnum: string) => {
    if (colEnum === 'DPK') return 'DPK';
    if (colEnum === 'KURANG_LANCAR') return 'KL';
    if (colEnum === 'DIRAGUKAN') return 'D';
    if (colEnum === 'MACET') return 'M';
    return 'L';
  };

  const buckets = {
    DPK: { count: 0, nominal: 0 },
    KL: { count: 0, nominal: 0 },
    D: { count: 0, nominal: 0 },
    M: { count: 0, nominal: 0 },
  };

  collectionCases.forEach(c => {
    const label = getColLabel(c.collectibility);
    if (buckets[label as keyof typeof buckets]) {
      buckets[label as keyof typeof buckets].count += 1;
      buckets[label as keyof typeof buckets].nominal += c.outstandingBalance; // Using Baki Debet for portfolio view
    }
  });

  return (
    <div className="space-y-5 animate-in fade-in">
      {/* Context Breadcrumb */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 flex items-center gap-2">
        <span className="text-[10px] font-black text-slate-400 tracking-widest uppercase">
          COLLECTION & RECOVERY / MANAGEMENT
        </span>
      </div>
      {/* Header Banner */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-red-600 uppercase tracking-wider">
              FIELD COLLECTION WORKSPACE
            </span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
              Sinkronisasi CBS Aktif
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 mt-1">Manajemen Penagihan & Janji Bayar</h1>
          <p className="text-xs text-slate-500 mt-1">
            Pantau DPK, KL, D, M, catat aktivitas lapangan, validasi Surat Peringatan (SP), dan komitmen bayar.
          </p>
        </div>
        <div className="flex flex-col text-right">
          <span className="text-xs text-slate-500 font-bold">NPL (Kredit Bermasalah)</span>
          <span className="text-2xl font-black text-rose-600">{macroMetrics.npl}%</span>
        </div>
      </div>

      {/* DPD Bucket Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div 
          onClick={() => setActiveFilter('ALL')}
          className={`p-4 rounded-2xl border shadow-sm flex flex-col justify-center items-center hover:shadow-md transition-all cursor-pointer ${
            activeFilter === 'ALL' ? 'bg-slate-800 border-slate-900 text-white ring-2 ring-slate-800 ring-offset-2' : 'bg-white border-slate-200 text-slate-800'
          }`}
        >
          <div className="text-sm font-black uppercase tracking-widest mb-1">Semua</div>
          <div className={`text-[11px] font-semibold ${activeFilter === 'ALL' ? 'text-slate-300' : 'text-slate-500'}`}>{collectionCases.length} Nasabah</div>
        </div>

        <div 
          onClick={() => setActiveFilter('DPK')}
          className={`p-4 rounded-2xl border shadow-sm flex flex-col justify-between hover:shadow-md transition-all cursor-pointer ${
            activeFilter === 'DPK' ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-400 ring-offset-2' : 'bg-white border-amber-200'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-black text-amber-600 bg-amber-100 px-2 py-1 rounded uppercase">DPK</span>
            <span className="text-[10px] text-amber-600 font-bold flex items-center gap-1"><AlertCircle size={12}/> Dalam Perhatian</span>
          </div>
          <div className="text-xl font-black text-slate-800 tracking-tight">{formatIDR(buckets.DPK.nominal)}</div>
          <div className="text-[10px] text-slate-500 mt-1 font-semibold">{buckets.DPK.count} Nasabah</div>
        </div>

        <div 
          onClick={() => setActiveFilter('KL')}
          className={`p-4 rounded-2xl border shadow-sm flex flex-col justify-between hover:shadow-md transition-all cursor-pointer ${
            activeFilter === 'KL' ? 'bg-orange-50 border-orange-400 ring-2 ring-orange-400 ring-offset-2' : 'bg-white border-orange-200'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-black text-orange-600 bg-orange-100 px-2 py-1 rounded uppercase">KL</span>
            <span className="text-[10px] text-orange-600 font-bold flex items-center gap-1"><AlertTriangle size={12}/> Kurang Lancar</span>
          </div>
          <div className="text-xl font-black text-slate-800 tracking-tight">{formatIDR(buckets.KL.nominal)}</div>
          <div className="text-[10px] text-slate-500 mt-1 font-semibold">{buckets.KL.count} Nasabah</div>
        </div>

        <div 
          onClick={() => setActiveFilter('D')}
          className={`p-4 rounded-2xl border shadow-sm flex flex-col justify-between hover:shadow-md transition-all cursor-pointer ${
            activeFilter === 'D' ? 'bg-rose-50 border-rose-400 ring-2 ring-rose-400 ring-offset-2' : 'bg-white border-rose-200'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-black text-rose-600 bg-rose-100 px-2 py-1 rounded uppercase">D</span>
            <span className="text-[10px] text-rose-600 font-bold flex items-center gap-1"><Clock size={12}/> Diragukan</span>
          </div>
          <div className="text-xl font-black text-slate-800 tracking-tight">{formatIDR(buckets.D.nominal)}</div>
          <div className="text-[10px] text-slate-500 mt-1 font-semibold">{buckets.D.count} Nasabah</div>
        </div>

        <div 
          onClick={() => setActiveFilter('M')}
          className={`p-4 rounded-2xl border shadow-sm flex flex-col justify-between hover:shadow-md transition-all cursor-pointer ${
            activeFilter === 'M' ? 'bg-red-50 border-red-500 ring-2 ring-red-500 ring-offset-2' : 'bg-white border-red-300 bg-gradient-to-br from-white to-red-50/30'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-black text-red-700 bg-red-100 px-2 py-1 rounded uppercase shadow-xs">M</span>
            <span className="text-[10px] text-red-600 font-bold flex items-center gap-1"><ShieldAlert size={12}/> Macet</span>
          </div>
          <div className="text-xl font-black text-red-700 tracking-tight">{formatIDR(buckets.M.nominal)}</div>
          <div className="text-[10px] text-slate-500 mt-1 font-semibold">{buckets.M.count} Nasabah</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Left Side: Active Cases (Compact List) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between bg-slate-50 p-2 rounded-lg border border-slate-200">
            <h3 className="text-[11px] font-black text-slate-700 uppercase">Daftar Penagihan {activeFilter !== 'ALL' && `(${activeFilter})`}</h3>
            <span className="text-[10px] font-bold text-slate-500">
              {collectionCases.filter(c => activeFilter === 'ALL' || getColLabel(c.collectibility) === activeFilter).length} Nasabah
            </span>
          </div>
          
          <div className="space-y-1.5 max-h-[600px] overflow-y-auto pr-1 pb-4">
            {collectionCases
              .filter(c => activeFilter === 'ALL' || getColLabel(c.collectibility) === activeFilter)
              .map((c) => {
              const hasPtp = ptpRecords.some(p => p.caseId === c.id && p.status === 'PENDING');
              const colLabel = getColLabel(c.collectibility);
              
              return (
                <div
                  key={c.id}
                  onClick={() => {
                    setSelectedCaseId(c.id);
                    setPtpForm({ ...ptpForm, promisedAmount: c.overdueAmount });
                  }}
                  className={`p-2.5 rounded-lg border cursor-pointer transition-all ${
                    selectedCaseId === c.id
                      ? 'bg-blue-50 border-blue-300 shadow-sm ring-1 ring-blue-400/30'
                      : 'bg-white border-slate-200 hover:bg-slate-50 shadow-xs'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <span className={`font-bold text-xs truncate pr-2 ${selectedCaseId === c.id ? 'text-blue-900' : 'text-slate-800'}`}>
                      {c.debtorName}
                    </span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-black border whitespace-nowrap ${
                      colLabel === 'M' ? 'bg-red-100 text-red-700 border-red-200' : 
                      colLabel === 'D' ? 'bg-rose-100 text-rose-700 border-rose-200' :
                      colLabel === 'KL' ? 'bg-orange-100 text-orange-700 border-orange-200' :
                      'bg-amber-100 text-amber-700 border-amber-200'
                    }`}>
                      {colLabel} - DPD {c.dpdDays}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-1.5">
                    <span className="text-[11px] font-bold text-slate-600">
                      Tunggakan: {formatIDR(c.overdueAmount)}
                    </span>
                    {hasPtp && (
                      <span className="text-[8px] bg-emerald-100 text-emerald-700 px-1 py-0.5 rounded font-black flex items-center gap-0.5">
                        <CheckCircle2 size={8} /> PTP AKTIF
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
            
            {collectionCases.filter(c => activeFilter === 'ALL' || getColLabel(c.collectibility) === activeFilter).length === 0 && (
              <div className="text-center p-8 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-slate-500 text-xs">
                Tidak ada data penagihan di kategori ini.
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Case Action & Control Center */}
        <div className="lg:col-span-2">
          {activeCase ? (
            <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
              
              {/* Header Profile */}
              <div className="p-5 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-lg font-black text-slate-900">{activeCase.debtorName}</h2>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-black ${
                      getColLabel(activeCase.collectibility) === 'M' ? 'bg-red-600 text-white' : 
                      getColLabel(activeCase.collectibility) === 'D' ? 'bg-rose-600 text-white' :
                      getColLabel(activeCase.collectibility) === 'KL' ? 'bg-orange-500 text-white' :
                      'bg-amber-500 text-white'
                    }`}>
                      KOL: {getColLabel(activeCase.collectibility)}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-slate-600 font-medium">
                    <span className="flex items-center gap-1.5"><Phone size={12} className="text-slate-400"/> {activeCase.phone}</span>
                    <span className="flex items-center gap-1.5"><MapPin size={12} className="text-slate-400"/> {activeCase.address}</span>
                  </div>
                </div>
                <button
                  onClick={() => openCustomer360(activeCase.cif)}
                  className="shrink-0 px-4 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold shadow-sm transition-colors"
                >
                  Buka Profil 360°
                </button>
              </div>

              <div className="p-5 space-y-6 flex-1 bg-white">
                
                {/* 1. Tunggakan & Tindakan SP */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  
                  {/* Card Tunggakan */}
                  <div className="sm:col-span-2 flex gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 shadow-xs">
                    <div className="flex-1 border-r border-slate-200 pr-4">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Total Tunggakan</span>
                      <p className="font-black text-slate-800 text-xl">{formatIDR(activeCase.overdueAmount)}</p>
                      <p className="text-[10px] text-slate-400 mt-1">Baki Debet: {formatIDR(activeCase.outstandingBalance)}</p>
                    </div>
                    <div className="shrink-0 flex flex-col justify-center text-center">
                      <span className="text-[10px] text-red-500 font-bold uppercase tracking-wider block mb-1">Lama Nunggak</span>
                      <p className="font-black text-red-600 text-2xl leading-none">{activeCase.dpdDays}</p>
                      <p className="text-[10px] text-red-400 mt-1 font-bold">Hari (DPD)</p>
                    </div>
                  </div>

                  {/* Card Tindakan SP */}
                  <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1 mb-1">
                        <AlertTriangle size={12} className="text-amber-500"/> Tindakan SP
                      </span>
                      <p className="font-bold text-slate-900 text-sm mt-2">
                        {spStatus[activeCase.id] ? `Telah Diterbitkan: ${spStatus[activeCase.id]}` : 'Belum Ada SP Terbit'}
                      </p>
                    </div>
                    <div className="mt-3">
                      {!spStatus[activeCase.id] && activeCase.dpdDays > 15 && (
                        <button onClick={() => handleIssueSP('SP-1')} className="w-full py-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-700 text-[10px] font-bold rounded-lg transition-colors">
                          Konfirmasi Terbit SP-1
                        </button>
                      )}
                      {spStatus[activeCase.id] === 'SP-1' && activeCase.dpdDays > 45 && (
                        <button onClick={() => handleIssueSP('SP-2')} className="w-full py-1.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 text-[10px] font-bold rounded-lg transition-colors">
                          Konfirmasi Terbit SP-2
                        </button>
                      )}
                      {!spStatus[activeCase.id] && activeCase.dpdDays <= 15 && (
                        <p className="text-[10px] text-slate-400 font-medium italic">Belum memenuhi syarat DPD untuk SP.</p>
                      )}
                    </div>
                  </div>

                </div>

                <hr className="border-slate-100" />

                {/* 2. PTP Status */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Calendar size={14} className="text-blue-500"/> Komitmen Janji Bayar (PTP)
                    </h3>
                    <button
                      onClick={() => setIsPtpModalOpen(true)}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold shadow-sm transition-colors"
                    >
                      + Buat Janji Baru
                    </button>
                  </div>
                  
                  {latestPtp ? (
                    <div className={`p-4 rounded-xl border ${
                      latestPtp.status === 'PENDING' ? 'bg-blue-50/50 border-blue-200' :
                      latestPtp.status === 'COMPLETED' ? 'bg-emerald-50/50 border-emerald-200' :
                      'bg-rose-50/50 border-rose-200'
                    }`}>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-black text-slate-900 text-base">{formatIDR(latestPtp.promisedAmount)}</span>
                            <span className={`text-[9px] px-2 py-0.5 rounded font-black uppercase ${
                              latestPtp.status === 'PENDING' ? 'bg-blue-200 text-blue-800' :
                              latestPtp.status === 'COMPLETED' ? 'bg-emerald-200 text-emerald-800' :
                              'bg-rose-200 text-rose-800'
                            }`}>
                              {latestPtp.status}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600">Tenggat Waktu: <strong className="text-slate-900">{latestPtp.promiseDate}</strong></p>
                          {latestPtp.notes && <p className="text-[11px] text-slate-500 mt-1 italic border-l-2 border-slate-300 pl-2">"{latestPtp.notes}"</p>}
                        </div>
                        {latestPtp.status === 'PENDING' && (
                          <button 
                            onClick={() => setActiveModule('PTP_TRACKER')}
                            className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-[10px] font-bold text-slate-700 hover:bg-slate-50 shadow-xs"
                          >
                            Kelola di Tracker &rarr;
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 text-center text-xs text-slate-500 font-medium">
                      Belum ada komitmen bayar aktif.
                    </div>
                  )}
                </div>

                {/* 3. Activity History */}
                <div>
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                    <MessageSquare size={14} className="text-emerald-500"/> Riwayat Aktivitas & Kontak
                  </h3>
                  {activeCase.visitHistory.length > 0 ? (
                    <div className="space-y-4 pl-1">
                      {activeCase.visitHistory.map((v, i) => (
                        <div key={v.id} className="relative pl-5 border-l-2 border-slate-100 pb-2">
                          <div className="absolute w-2.5 h-2.5 bg-emerald-400 rounded-full -left-[5px] top-1 shadow-xs ring-4 ring-white"></div>
                          <div className="flex items-center justify-between text-[10px] mb-1">
                            <span className="font-bold text-slate-500">{v.date}</span>
                            <span className="font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                              Oleh: {v.collectorName}
                            </span>
                          </div>
                          <p className="text-xs text-slate-800 font-medium leading-relaxed mt-1">
                            "{v.nextAction}"
                          </p>
                          <div className="text-[10px] text-slate-500 mt-1.5 flex items-center gap-1">
                            <Activity size={10}/> Hasil Kunjungan: <strong className="text-slate-700">{v.outcome}</strong>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-center text-xs text-slate-500 font-medium">
                      Belum ada catatan aktivitas kunjungan.
                    </div>
                  )}
                </div>

              </div>
            </div>
          ) : (
            <div className="p-12 h-full flex flex-col items-center justify-center text-center text-slate-400 bg-slate-50 border border-slate-200 border-dashed rounded-2xl">
              <FileText size={48} className="mb-4 opacity-30" />
              <h3 className="text-lg font-bold text-slate-600 mb-1">Tidak Ada Nasabah Dipilih</h3>
              <p className="text-xs max-w-sm">Pilih nama nasabah di panel sebelah kiri untuk melihat detail tunggakan, menerbitkan SP, dan mencatat PTP.</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal Add PTP */}
      {isPtpModalOpen && activeCase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 space-y-5 text-slate-800 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-black text-slate-900">Catat Janji Bayar (PTP)</h3>
              <button onClick={() => setIsPtpModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            
            <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-800 mb-2 font-medium">
              Buat komitmen bayar untuk <strong className="text-blue-900">{activeCase.debtorName}</strong>. Total tagihan saat ini adalah <strong className="text-blue-900">{formatIDR(activeCase.overdueAmount)}</strong>.
            </div>

            <form onSubmit={handleCreatePtp} className="space-y-4 text-sm">
              <div>
                <label className="text-slate-700 font-bold text-[11px] uppercase tracking-wider">Tanggal Janji Bayar *</label>
                <input
                  type="date"
                  required
                  value={ptpForm.promiseDate}
                  onChange={(e) => setPtpForm({ ...ptpForm, promiseDate: e.target.value })}
                  className="w-full mt-1.5 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all font-medium"
                />
              </div>

              <div>
                <label className="text-slate-700 font-bold text-[11px] uppercase tracking-wider">Nominal Komitmen (Rp) *</label>
                <input
                  type="number"
                  required
                  value={ptpForm.promisedAmount}
                  onChange={(e) => setPtpForm({ ...ptpForm, promisedAmount: Number(e.target.value) })}
                  className="w-full mt-1.5 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono text-base font-black focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                />
              </div>

              <div>
                <label className="text-slate-700 font-bold text-[11px] uppercase tracking-wider">Catatan Tambahan (Opsional)</label>
                <textarea
                  rows={3}
                  value={ptpForm.notes}
                  onChange={(e) => setPtpForm({ ...ptpForm, notes: e.target.value })}
                  placeholder="Keterangan dari nasabah..."
                  className="w-full mt-1.5 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-xs font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsPtpModalOpen(false)}
                  className="px-4 py-2.5 text-slate-600 font-bold text-xs rounded-xl hover:bg-slate-100 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20 transition-all"
                >
                  Simpan PTP
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
