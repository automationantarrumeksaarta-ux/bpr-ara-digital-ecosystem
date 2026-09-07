import React, { useState, useRef } from 'react';
import { UploadCloud, FileSpreadsheet, CheckCircle2, AlertCircle, TrendingUp, BarChart3, Database, ShieldCheck, ArrowRight } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { CollectionCase } from '../../types';

export const CBSDataCenterView: React.FC = () => {
  const { setMacroMetrics, setCollectionCases } = useApp();
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Parsed Results
  const [results, setResults] = useState<{
    totalNasabah: number;
    totalBakiDebet: number;
    nplBakiDebet: number;
    totalTagihan: number;
    totalAngsuran: number;
    nplPercentage: number;
    rrPercentage: number;
    extractedCases: CollectionCase[];
  } | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = async (selectedFile: File) => {
    setFile(selectedFile);
    setIsProcessing(true);
    setError(null);
    
    try {
      const text = await selectedFile.text();
      
      // Basic validation if it's an XML Spreadsheet
      if (!text.includes('<?xml') && !text.includes('<Workbook')) {
        throw new Error('Format file tidak dikenali. Harap unggah file XML Spreadsheet (.xls) dari sistem Core Banking Anda.');
      }

      const rows = text.split(/<Row[^>]*>/i);
      
      if (rows.length < 2) {
        throw new Error('Tidak ada data baris ditemukan dalam file.');
      }

      let totalNasabah = 0;
      let totalBakiDebet = 0;
      let nplBakiDebet = 0;
      let totalTagihan = 0;
      let totalAngsuran = 0;
      
      const extractedCases: CollectionCase[] = [];

      for (let i = 1; i < rows.length; i++) {
        const rowStr = rows[i].split('</Row>')[0];
        
        // Extract cells
        const cellStrs = rowStr.split(/<Cell/i).slice(1);
        
        // Create an array mapping index to value
        const cellData: Record<number, string> = {};
        
        let currentIndex = 1;
        
        for (const cellStr of cellStrs) {
          // Check if it has ss:Index
          const indexMatch = cellStr.match(/ss:Index="(\d+)"/i);
          if (indexMatch) {
            currentIndex = parseInt(indexMatch[1], 10);
          }
          
          const dataMatch = cellStr.match(/<Data[^>]*>([\s\S]*?)<\/Data>/i);
          if (dataMatch) {
            // Decode basic HTML entities like &#49
            let val = dataMatch[1].trim();
            // simple decoding for numeric entities
            val = val.replace(/&#(\d+);?/g, (_, dec) => String.fromCharCode(dec));
            cellData[currentIndex] = val;
          }
          currentIndex++;
        }

        const strNo = cellData[2];
        if (!strNo || isNaN(Number(strNo))) continue;
        
        const parseCurrency = (str: string) => {
          if (!str) return 0;
          return Number(str.replace(/[^0-9,-]+/g, '').replace(',', '.'));
        };

        // Based on precise analysis of FastReport headers:
        // FastReport XML mapping with ss:Index
        const noRek = cellData[4] || '';
        const debtorName = cellData[5] || 'Unknown';
        const bakiDebet = parseCurrency(cellData[16] || '0');
        const tunggakanTotal = parseCurrency(cellData[21] || '0');
        const tagihan = parseCurrency(cellData[25] || '0');
        const angsuran = parseCurrency(cellData[28] || '0');
        const hariTunggakan = parseInt(cellData[18] || cellData[20] || '0', 10);
        
        const kolek = (cellData[29] || cellData[30] || cellData[28] || '').toUpperCase().trim();

        if (bakiDebet > 0) {
          totalNasabah++;
          totalBakiDebet += bakiDebet;
          totalTagihan += tagihan;
          totalAngsuran += angsuran;
          
          if (['DPK', '2', 'KL', 'D', 'M', '3', '4', '5', 'KURANG LANCAR', 'DIRAGUKAN', 'MACET'].includes(kolek)) {
            nplBakiDebet += bakiDebet;
          }
          
          // Extract collection cases for DPK and above
          if (['DPK', 'KL', 'D', 'M', '2', '3', '4', '5'].some(k => kolek.includes(k))) {
            const phone = cellData[10] || '-';
            const address = `${cellData[6] || ''} ${cellData[7] || ''} ${cellData[8] || ''} ${cellData[9] || ''}`.trim();
            const overdueAmount = tunggakanTotal;
            const collectorName = cellData[30] || cellData[31] || cellData[29] || 'Internal';
            
            let dpdDays = isNaN(hariTunggakan) ? 0 : hariTunggakan;
            
            let collEnum: any = 'LANCAR';
            if (['DPK', '2'].some(k => kolek === k)) collEnum = 'DPK';
            if (['KL', '3'].some(k => kolek === k)) collEnum = 'KURANG_LANCAR';
            if (['D', '4'].some(k => kolek === k)) collEnum = 'DIRAGUKAN';
            if (['M', '5'].some(k => kolek === k)) collEnum = 'MACET';

            extractedCases.push({
              id: `CASE-${noRek.replace(/[^a-zA-Z0-9]/g, '')}`,
              facilityId: `FAC-${noRek.replace(/[^a-zA-Z0-9]/g, '')}`,
              facilityNumber: noRek,
              cif: `CIF-${noRek.substring(0, 6)}`,
              debtorName,
              phone,
              address,
              branchId: 'KC_PUSAT',
              outstandingBalance: bakiDebet,
              overdueAmount: overdueAmount > 0 ? overdueAmount : tagihan,
              dpdDays,
              collectibility: collEnum,
              collectorId: 'COL-AUTO',
              collectorName,
              ptpRecords: [],
              visitHistory: []
            });
          }
        }
      }

      if (totalNasabah === 0) {
        throw new Error('Gagal mengekstrak baris data. Pastikan file berisi format Jadwal Tagihan Kredit yang valid.');
      }

      const nplPercentage = totalBakiDebet > 0 ? (nplBakiDebet / totalBakiDebet) * 100 : 0;
      const rrPercentage = totalTagihan > 0 ? (totalAngsuran / totalTagihan) * 100 : 0;

      setResults({
        totalNasabah,
        totalBakiDebet,
        nplBakiDebet,
        totalTagihan,
        totalAngsuran,
        nplPercentage,
        rrPercentage,
        extractedCases
      });

    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat memproses file.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await processFile(e.target.files[0]);
    }
  };

  const formatIDR = (value: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value);
  };

  const syncToGlobal = () => {
    if (results) {
      setMacroMetrics(prev => ({
        ...prev,
        rr: Number(results.rrPercentage.toFixed(2)),
        npl: Number(results.nplPercentage.toFixed(2))
      }));
      
      if (results.extractedCases.length > 0) {
        setCollectionCases(results.extractedCases);
      }
      
      alert(`Data berhasil disinkronisasi! NPL & RR ter-update, dan ${results.extractedCases.length} nasabah menunggak ditambahkan ke Manajemen Penagihan.`);
    }
  };

  return (
    <div className="w-full min-h-full p-4 sm:p-6 lg:p-8 animate-in fade-in bg-slate-50 dark:bg-[#0a0a0a]">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center shadow-inner">
              <Database size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Data Center & Sinkronisasi CBS</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Unggah laporan XML/XLS dari Core Banking System untuk mengekstrak metrik NPL dan RR secara otomatis.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg border border-emerald-100 dark:border-emerald-500/20 text-xs font-bold">
            <ShieldCheck size={16} />
            Privasi Data Lokal Dijamin
          </div>
        </div>

        {/* Upload Area */}
        <div 
          className={`relative w-full rounded-2xl border-2 border-dashed transition-all duration-300 ${
            isDragging 
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/10 shadow-lg shadow-blue-500/10' 
              : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-slate-50 dark:hover:bg-slate-800/50'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input 
            type="file" 
            accept=".xls,.xml" 
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            onChange={handleFileInput}
            ref={fileInputRef}
          />
          
          <div className="flex flex-col items-center justify-center p-12 text-center pointer-events-none">
            <div className={`w-20 h-20 mb-6 rounded-full flex items-center justify-center transition-colors ${isDragging ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500'}`}>
              <UploadCloud size={40} className={isDragging ? 'animate-bounce' : ''} />
            </div>
            <h3 className="text-xl font-bold text-slate-700 dark:text-slate-200 mb-2">
              Tarik & Lepas File CBS ke Sini
            </h3>
            <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-md mx-auto">
              Mendukung file <strong className="text-slate-700 dark:text-slate-300">.xls (FastReport XML Spreadsheet)</strong> "Jadwal Tagihan Kredit". Data diproses sepenuhnya secara lokal di browser Anda.
            </p>
            
            <button className="px-6 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-xl shadow-lg pointer-events-auto hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors">
              Pilih File Dokumen
            </button>
          </div>
        </div>

        {/* Status / Error */}
        {isProcessing && (
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-xl border border-blue-200 dark:border-blue-800 flex items-center justify-center gap-3 font-bold">
            <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            Mengekstrak dan memproses struktur XML Core Banking...
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-xl border border-red-200 dark:border-red-800 flex items-start gap-3">
            <AlertCircle className="shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold mb-1">Gagal Memproses File</h4>
              <p className="text-sm opacity-90">{error}</p>
            </div>
          </div>
        )}

        {/* Results Area */}
        {results && !isProcessing && !error && (
          <div className="space-y-6 animate-in slide-in-from-bottom-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <FileSpreadsheet size={64} />
                </div>
                <h4 className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-1">Total Rekening</h4>
                <div className="text-3xl font-black text-slate-800 dark:text-slate-100">{results.totalNasabah.toLocaleString('id-ID')} <span className="text-sm text-slate-400 font-medium">NOA</span></div>
              </div>

              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <h4 className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-1">Total Baki Debet</h4>
                <div className="text-xl font-bold text-slate-800 dark:text-slate-100">{formatIDR(results.totalBakiDebet)}</div>
                <div className="text-xs text-slate-400 mt-1">Keseluruhan Portofolio</div>
              </div>

              <div className="bg-rose-50 dark:bg-rose-900/10 p-5 rounded-2xl border border-rose-200 dark:border-rose-900/30 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10 text-rose-500">
                  <AlertCircle size={64} />
                </div>
                <h4 className="text-sm font-bold text-rose-700 dark:text-rose-400 mb-1">NPL (Baki Debet Macet)</h4>
                <div className="text-3xl font-black text-rose-700 dark:text-rose-400 mb-1">
                  {results.nplPercentage.toFixed(2)}%
                </div>
                <div className="text-xs font-bold text-rose-600/70 dark:text-rose-400/70">
                  {formatIDR(results.nplBakiDebet)}
                </div>
              </div>

              <div className="bg-emerald-50 dark:bg-emerald-900/10 p-5 rounded-2xl border border-emerald-200 dark:border-emerald-900/30 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10 text-emerald-500">
                  <TrendingUp size={64} />
                </div>
                <h4 className="text-sm font-bold text-emerald-700 dark:text-emerald-400 mb-1">Repayment Rate (RR)</h4>
                <div className="text-3xl font-black text-emerald-700 dark:text-emerald-400 mb-1">
                  {results.rrPercentage.toFixed(2)}%
                </div>
                <div className="text-xs font-bold text-emerald-600/70 dark:text-emerald-400/70">
                  {formatIDR(results.totalAngsuran)} / {formatIDR(results.totalTagihan)}
                </div>
              </div>
            </div>

            <div className="bg-slate-900 dark:bg-slate-800 p-6 rounded-2xl text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl shadow-slate-900/10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center shrink-0">
                  <CheckCircle2 size={28} className="text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Ekstraksi Selesai!</h3>
                  <p className="text-slate-400 text-sm">Metrik siap digunakan untuk perhitungan KPI dan Penggajian seluruh ekosistem.</p>
                </div>
              </div>
              <button 
                onClick={syncToGlobal}
                className="w-full md:w-auto px-6 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
              >
                Terapkan ke Dasbor Global <ArrowRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
