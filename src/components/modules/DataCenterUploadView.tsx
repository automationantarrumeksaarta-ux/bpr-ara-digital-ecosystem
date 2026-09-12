import React, { useState } from 'react';
import { UploadCloud, CheckCircle2, AlertTriangle, FileSpreadsheet, RefreshCw, BarChart2, Server } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { headerAuth } from '../../utils/api';

export const DataCenterUploadView: React.FC = () => {
  const { setMacroMetrics, macroMetrics } = useApp();

  const [isSyncing, setIsSyncing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [syncComplete, setSyncComplete] = useState(false);

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [files, setFiles] = useState([
    { id: 'f1', name: 'Belum ada file', status: 'pending', desc: 'Silakan pilih file BPR' }
  ]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const fileList = Array.from(e.target.files);
      setSelectedFiles(fileList);
      setFiles(fileList.map((f, i) => ({
        id: `f${i}`,
        name: f.name,
        status: 'pending',
        desc: 'Menunggu Sinkronisasi'
      })));
    }
  };

  const handleSimulateSync = async () => {
    if (selectedFiles.length === 0) {
      alert("Pilih file laporan Excel terlebih dahulu!");
      return;
    }

    setIsSyncing(true);
    setProgress(20);
    setSyncComplete(false);

    try {
      const formData = new FormData();
      selectedFiles.forEach(f => formData.append('files', f));

      // /api/upload dipakai untuk lampiran tugas (single file); laporan Excel
      // punya rute sendiri agar tidak saling menutupi.
      const res = await fetch('/api/reports/upload', {
        method: 'POST',
        /* Tanpa Content-Type: peramban yang menuliskannya lengkap dengan pembatas. */
        headers: headerAuth(),
        body: formData
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Upload failed: ${res.status} ${errorText}`);
      }
      
      const data = await res.json();
      console.log('Upload success:', data);

      setProgress(100);
      setFiles(f => f.map((x) => ({ ...x, status: 'done' })));
      setIsSyncing(false);
      setSyncComplete(true);
      
      // Fetch latest metrics from DB
      try {
        const metricsRes = await fetch('/api/metrics', { headers: headerAuth() });
        if (metricsRes.ok) {
          const metrics = await metricsRes.json();
          if (metrics) {
            setMacroMetrics(prev => ({ ...prev, ...metrics }));
          }
        }
      } catch (e) {
        console.error("Failed to fetch metrics", e);
      }
      
    } catch (err: any) {
      console.error(err);
      alert("Gagal melakukan sinkronisasi:\n" + err.message);
      setIsSyncing(false);
    }
  };

  const handleReset = () => {
    setFiles([{ id: 'f1', name: 'Belum ada file', status: 'pending', desc: 'Silakan pilih file BPR' }]);
    setSelectedFiles([]);
    setSyncComplete(false);
    setProgress(0);
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-white border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full blur-3xl opacity-50 -mr-20 -mt-20 pointer-events-none"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider bg-blue-50 px-2 py-1 rounded-full border border-blue-100">
              CBS Data Center
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Upload Center (PE Bisnis)</h1>
          <p className="text-sm text-slate-500 mt-1 max-w-2xl">
            Unggah file laporan nominatif harian untuk disinkronisasi ke Dashboard Executive, EWS, dan CRM. Data akan diproses melalui engine analitik BPR ARA.
          </p>
        </div>
        
        <div className="relative z-10">
          {!syncComplete && !isSyncing && (
             <div className="flex gap-2">
               <input 
                 type="file" 
                 multiple 
                 accept=".xls,.xlsx" 
                 className="hidden" 
                 ref={fileInputRef} 
                 onChange={handleFileChange}
               />
               <button
                 onClick={() => fileInputRef.current?.click()}
                 className="px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold border border-slate-200 transition-all flex items-center gap-2 cursor-pointer"
               >
                 Pilih File
               </button>
               <button
                 onClick={handleSimulateSync}
                 className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-600/20 transition-all flex items-center gap-2 cursor-pointer"
               >
                 <UploadCloud className="w-5 h-5" />
                 Ekstrak & Sinkronisasi
               </button>
             </div>
          )}
          {isSyncing && (
             <div className="px-6 py-3 rounded-xl bg-slate-100 text-slate-500 font-bold border border-slate-200 flex items-center gap-2">
               <RefreshCw className="w-5 h-5 animate-spin" />
               Mengunggah ke API Backend...
             </div>
          )}
          {syncComplete && (
             <button
               onClick={handleReset}
               className="px-6 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold border border-slate-200 transition-all flex items-center gap-2 cursor-pointer"
             >
               Upload Ulang
             </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: File Drop Zone */}
        <div className="col-span-2 space-y-4">
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Server className="w-4 h-4 text-blue-600" />
              Antrean File Sinkronisasi
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {files.map((f, i) => (
                <div key={f.id} className={`p-4 rounded-xl border ${f.status === 'done' ? 'bg-emerald-50/50 border-emerald-200' : 'bg-slate-50 border-slate-200'} flex items-start gap-3 transition-colors`}>
                  <div className={`p-2 rounded-lg ${f.status === 'done' ? 'bg-emerald-100 text-emerald-600' : 'bg-white text-slate-400 border border-slate-200'}`}>
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-bold text-slate-900 truncate" title={f.name}>{f.name}</div>
                    <div className="text-[10px] text-slate-500">{f.desc}</div>
                  </div>
                  {f.status === 'done' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                  {f.status === 'pending' && <ClockIcon className="w-4 h-4 text-slate-300" />}
                </div>
              ))}
            </div>

            {isSyncing && (
              <div className="mt-6 space-y-2">
                <div className="flex justify-between text-xs font-medium text-slate-600">
                  <span>Progres Ekstraksi OCR & Mapping</span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div 
                    className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Sync Results */}
        <div className="space-y-4">
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm h-full flex flex-col">
            <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-blue-600" />
              Dampak Sinkronisasi
            </h3>

            {!syncComplete ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
                <Server className="w-8 h-8 text-slate-300 mb-3" />
                <div className="text-sm font-medium text-slate-600">Menunggu Sinkronisasi</div>
                <div className="text-xs text-slate-400 mt-1">Data terbaru akan menimpa dashboard saat proses selesai.</div>
              </div>
            ) : (
              <div className="flex-1 space-y-4 animate-in slide-in-from-bottom-4">
                <div className="p-4 rounded-xl bg-blue-50 border border-blue-100">
                  <div className="text-[10px] font-bold text-blue-600 uppercase mb-1">NPL & RR Terkini</div>
                  <div className="flex items-end justify-between">
                    <div>
                      <div className="text-2xl font-bold text-slate-900">{macroMetrics.npl}%</div>
                      <div className="text-xs text-slate-500">Non-Performing Loan</div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-slate-900">{macroMetrics.rr}%</div>
                      <div className="text-xs text-slate-500">Repayment Rate</div>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100">
                  <div className="text-[10px] font-bold text-emerald-700 uppercase mb-1">Laba & Outstanding</div>
                  <div className="space-y-2">
                     <div className="flex justify-between items-center border-b border-emerald-200/50 pb-2">
                       <span className="text-xs text-slate-600">Laba Thn Berjalan</span>
                       <span className="text-sm font-bold text-slate-900">Rp {(macroMetrics.labaTahunBerjalan || 0).toLocaleString('id-ID')}</span>
                     </div>
                     <div className="flex justify-between items-center">
                       <span className="text-xs text-slate-600">Baki Debet</span>
                       <span className="text-sm font-bold text-slate-900">Rp {(macroMetrics.outstandingKredit).toLocaleString('id-ID')}</span>
                     </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-orange-50 border border-orange-100">
                   <div className="flex items-center gap-2 mb-2">
                     <AlertTriangle className="w-4 h-4 text-orange-600" />
                     <div className="text-[10px] font-bold text-orange-700 uppercase">EWS Terdeteksi</div>
                   </div>
                   <div className="text-xs text-slate-700">
                     Sistem menemukan <strong>3 debitur</strong> yang terindikasi turun kolektibilitas dari file <code>data aji 2.xls</code>. Data telah diteruskan ke Dashboard Kepatuhan & CRM.
                   </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const ClockIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);
