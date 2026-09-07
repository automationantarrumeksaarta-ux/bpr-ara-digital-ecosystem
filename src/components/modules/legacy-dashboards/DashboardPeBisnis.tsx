import React from 'react';
import { 
  Database,
  PieChart,
  Wallet,
  Activity,
  TrendingUp,
  CreditCard,
  Building,
  CheckCircle2
} from 'lucide-react';

interface DashboardPeBisnisProps {
  macroMetrics: {
    rr: number;
    npl: number;
    totalAset: number;
    outstandingKredit: number;
    totalTabungan?: number;
    totalDeposito?: number;
    labaTahunBerjalan?: number;
    noaTabungan?: number;
    noaDeposito?: number;
    noaTabunganBaru?: number;
    noaDepositoBaru?: number;
  };
}

export default function DashboardPeBisnis({ macroMetrics }: DashboardPeBisnisProps) {
  const formatIDR = (val: number = 0) => {
    if (val >= 1_000_000_000) return `Rp ${(val / 1_000_000_000).toFixed(2)} M`;
    if (val >= 1_000_000) return `Rp ${(val / 1_000_000).toFixed(1)} Jt`;
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  const totalTabungan = macroMetrics.totalTabungan || 0;
  const totalDeposito = macroMetrics.totalDeposito || 0;
  const totalDPK = totalTabungan + totalDeposito;
  const osKredit = macroMetrics.outstandingKredit || 0;

  // Mocked data for Kolektibilitas based on NPL 19.91%
  // NPL is Kol 3, 4, 5. Let's make Kol 1 = 78%, Kol 2 = 2.09%, Kol 3,4,5 = 19.91%
  const kolData = [
    { name: 'Kol 1 (Lancar)', value: 78.0, color: 'bg-emerald-500' },
    { name: 'Kol 2 (DPK)', value: 2.09, color: 'bg-yellow-400' },
    { name: 'Kol 3 (Kurang Lancar)', value: 10.5, color: 'bg-orange-500' },
    { name: 'Kol 4 (Diragukan)', value: 5.41, color: 'bg-rose-500' },
    { name: 'Kol 5 (Macet)', value: 4.0, color: 'bg-red-700' },
  ];

  // Mocked top pencairan daily
  const recentDisbursals = [
    { id: 1, name: 'PT Sejahtera Abadi', type: 'Modal Kerja', nominal: 1500000000, ao: 'Andi S.', branch: 'Kantor Pusat' },
    { id: 2, name: 'CV Maju Bersama', type: 'Investasi', nominal: 750000000, ao: 'Siska', branch: 'Matesih' },
    { id: 3, name: 'Toko Bangunan Laris', type: 'Modal Kerja', nominal: 300000000, ao: 'Bambang', branch: 'Jumapolo' },
  ];

  return (
    <div className="space-y-6 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header Banner */}
      <div className="bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-slate-800 shadow-sm rounded-3xl p-6 sm:p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-emerald-500/10 blur-3xl rounded-full pointer-events-none" />
        
        <div className="relative z-10 flex flex-col gap-4">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-full text-[10px] font-black tracking-widest uppercase flex items-center gap-1.5 border border-blue-200 dark:border-blue-800">
              <Database size={14} /> Executive Data & Portfolio Portal
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            Dashboard Portofolio PE Bisnis
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-medium max-w-3xl leading-relaxed">
            Ringkasan data makro portofolio kredit dan dana pihak ketiga yang tersinkronisasi harian dari Core Banking System (Upload Center). 
          </p>
        </div>
      </div>

      {/* KPI RIBBON */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-[#111111] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-1">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <Wallet size={16} className="text-blue-500" />
            <span className="text-xs font-bold uppercase tracking-wider">Total DPK</span>
          </div>
          <h4 className="text-2xl font-black text-slate-900 dark:text-white">{formatIDR(totalDPK)}</h4>
          <p className="text-[10px] font-bold text-slate-400 mt-1">Gabungan Tabungan & Deposito</p>
        </div>

        <div className="bg-white dark:bg-[#111111] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-1">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <CreditCard size={16} className="text-emerald-500" />
            <span className="text-xs font-bold uppercase tracking-wider">Baki Debet</span>
          </div>
          <h4 className="text-2xl font-black text-slate-900 dark:text-white">{formatIDR(osKredit)}</h4>
          <p className="text-[10px] font-bold text-slate-400 mt-1">Total Outstanding Kredit</p>
        </div>

        <div className="bg-white dark:bg-[#111111] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-1">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <TrendingUp size={16} className="text-purple-500" />
            <span className="text-xs font-bold uppercase tracking-wider">Laba Tahun Berjalan</span>
          </div>
          <h4 className="text-2xl font-black text-slate-900 dark:text-white">{formatIDR(macroMetrics.labaTahunBerjalan)}</h4>
          <p className="text-[10px] font-bold text-slate-400 mt-1">Berdasarkan sinkronisasi Neraca</p>
        </div>

        <div className={`p-5 rounded-2xl shadow-sm flex flex-col gap-1 text-white ${macroMetrics.npl < 5 ? 'bg-gradient-to-br from-emerald-500 to-emerald-700' : 'bg-gradient-to-br from-rose-500 to-rose-700'}`}>
          <div className="flex items-center gap-2 text-white/80 mb-1">
            <Activity size={16} />
            <span className="text-xs font-bold uppercase tracking-wider">Rasio NPL</span>
          </div>
          <h4 className="text-3xl font-black">{macroMetrics.npl}%</h4>
          <p className="text-[10px] font-bold text-white/80 mt-1">
            {macroMetrics.npl < 5 ? 'Kualitas Kredit Sehat' : 'Melebihi Ambang Batas 5%'}
          </p>
        </div>

        <div className={`p-5 rounded-2xl shadow-sm flex flex-col gap-1 text-white ${macroMetrics.rr >= 90 ? 'bg-gradient-to-br from-blue-500 to-blue-700' : 'bg-gradient-to-br from-amber-500 to-amber-700'}`}>
          <div className="flex items-center gap-2 text-white/80 mb-1">
            <CheckCircle2 size={16} />
            <span className="text-xs font-bold uppercase tracking-wider">Repayment Rate</span>
          </div>
          <h4 className="text-3xl font-black">{macroMetrics.rr}%</h4>
          <p className="text-[10px] font-bold text-white/80 mt-1">
            {macroMetrics.rr >= 90 ? 'Penagihan Sangat Optimal' : 'Di bawah target (90%)'}
          </p>
        </div>
      </div>

      {/* CHARTS / COMPOSITION SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Kolektibilitas */}
        <div className="bg-white dark:bg-[#0a0a0a] shadow-sm border border-slate-200 dark:border-slate-800 p-6 rounded-3xl flex flex-col">
          <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
            <div className="p-2.5 bg-rose-50 dark:bg-rose-900/20 text-rose-600 rounded-xl border border-rose-100 dark:border-rose-800">
              <PieChart size={20} />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">Kolektibilitas Kredit</h3>
              <p className="text-xs text-slate-500 font-medium">Distribusi baki debet berdasarkan data aji 2</p>
            </div>
          </div>
          
          <div className="flex-1 flex flex-col justify-center space-y-4">
            {kolData.map(item => (
              <div key={item.name} className="space-y-1.5">
                <div className="flex justify-between items-end">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{item.name}</span>
                  <span className="text-sm font-black text-slate-900 dark:text-white">{item.value}%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${item.color}`} style={{ width: `${item.value}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Komposisi DPK */}
        <div className="bg-white dark:bg-[#0a0a0a] shadow-sm border border-slate-200 dark:border-slate-800 p-6 rounded-3xl flex flex-col">
          <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4 mb-6">
            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-xl border border-emerald-100 dark:border-emerald-800">
              <Building size={20} />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">Komposisi Pendanaan (DPK)</h3>
              <p className="text-xs text-slate-500 font-medium">Rasio Tabungan vs Deposito Berjangka</p>
            </div>
          </div>
          
          <div className="flex-1 flex items-center justify-center">
            {totalDPK > 0 ? (
              <div className="relative w-48 h-48 rounded-full border-[20px] border-emerald-500 flex items-center justify-center shadow-inner" style={{ borderRightColor: '#3b82f6', borderBottomColor: '#3b82f6', transform: 'rotate(-45deg)' }}>
                <div className="absolute transform rotate-45 text-center flex flex-col items-center">
                   <span className="text-xs font-bold text-slate-500">Total DPK</span>
                   <span className="text-lg font-black text-slate-900 dark:text-white">{formatIDR(totalDPK)}</span>
                </div>
              </div>
            ) : (
              <div className="text-slate-400 text-sm font-medium italic">Data Kosong. Harap sinkronisasi file laporan harian.</div>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-4 mt-6">
             <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/50">
               <div className="text-[10px] font-bold text-blue-600 uppercase mb-1">Porsi Deposito</div>
               <div className="text-lg font-black text-slate-900 dark:text-white">{formatIDR(totalDeposito)}</div>
               <div className="text-xs text-slate-500 mt-1">{totalDPK > 0 ? ((totalDeposito/totalDPK)*100).toFixed(1) : 0}% dari total</div>
             </div>
             <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/50">
               <div className="text-[10px] font-bold text-emerald-600 uppercase mb-1">Porsi Tabungan (CASA)</div>
               <div className="text-lg font-black text-slate-900 dark:text-white">{formatIDR(totalTabungan)}</div>
               <div className="text-xs text-slate-500 mt-1">{totalDPK > 0 ? ((totalTabungan/totalDPK)*100).toFixed(1) : 0}% dari total</div>
             </div>
          </div>

          {/* NOA Metrics */}
          <div className="grid grid-cols-2 gap-4 mt-4">
             <div className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-[#111111]">
               <div>
                 <div className="text-[10px] font-bold text-slate-500 uppercase">NOA Deposito</div>
                 <div className="text-sm font-black text-slate-900 dark:text-white">{macroMetrics.noaDeposito || 0} Rek</div>
               </div>
               <div className="text-right">
                 <div className="text-[10px] font-bold text-emerald-500 uppercase">+ Baru</div>
                 <div className="text-sm font-black text-emerald-600 dark:text-emerald-400">+{macroMetrics.noaDepositoBaru || 0}</div>
               </div>
             </div>
             <div className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-[#111111]">
               <div>
                 <div className="text-[10px] font-bold text-slate-500 uppercase">NOA Tabungan</div>
                 <div className="text-sm font-black text-slate-900 dark:text-white">{macroMetrics.noaTabungan || 0} Rek</div>
               </div>
               <div className="text-right">
                 <div className="text-[10px] font-bold text-emerald-500 uppercase">+ Baru</div>
                 <div className="text-sm font-black text-emerald-600 dark:text-emerald-400">+{macroMetrics.noaTabunganBaru || 0}</div>
               </div>
             </div>
          </div>
        </div>

      </div>

      {/* PENCAIRAN HARIAN TERBESAR */}
      <div className="bg-white dark:bg-[#0a0a0a] shadow-sm border border-slate-200 dark:border-slate-800 p-6 rounded-3xl">
        <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
          <div className="p-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl border border-slate-200 dark:border-slate-700">
            <CreditCard size={20} />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white">Realisasi Pencairan Terbesar Hari Ini</h3>
            <p className="text-xs text-slate-500 font-medium">Berdasarkan mutasi kredit harian yang diunggah</p>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-black text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Nama Debitur</th>
                <th className="py-3 px-4">Jenis Fasilitas</th>
                <th className="py-3 px-4">Cabang</th>
                <th className="py-3 px-4">Account Officer</th>
                <th className="py-3 px-4 text-right">Nominal Pencairan</th>
              </tr>
            </thead>
            <tbody>
              {recentDisbursals.map((r, i) => (
                <tr key={r.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                  <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 text-xs font-black w-4">{i + 1}</span> {r.name}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-400">{r.type}</td>
                  <td className="py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">{r.branch}</td>
                  <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-400">{r.ao}</td>
                  <td className="py-3 px-4 font-black text-emerald-600 dark:text-emerald-400 text-right">{formatIDR(r.nominal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
