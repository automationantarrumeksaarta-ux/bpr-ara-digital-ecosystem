import React, { useState } from 'react';
import { 
  Building2, TrendingUp, TrendingDown, Wallet, 
  AlertTriangle, Target, CheckCircle2, ShieldAlert,
  Users, Activity, ShieldCheck, Filter, Calendar,
  ArrowRight, CheckSquare, Clock, FileText, ChevronRight, XCircle
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PageContainer } from '../ui/PageContainer';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/Table';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend
} from 'recharts';

export const ExecutiveDashboard: React.FC = () => {
  const { currentUser, macroMetrics, creditApplications, ewsAlerts, flowTasks } = useApp();

  const formatIDR = (val: number) => {
    if (val >= 1_000_000_000) return `Rp ${(val / 1_000_000_000).toFixed(2)} M`;
    if (val >= 1_000_000) return `Rp ${(val / 1_000_000).toFixed(1)} Jt`;
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  const currentDate = new Intl.DateTimeFormat('id-ID', { 
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' 
  }).format(new Date());

  const currentMonthStr = new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(new Date());
  
  // Previous month string for trends
  const prevDate = new Date();
  prevDate.setMonth(prevDate.getMonth() - 1);
  const prevMonthStr = new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(prevDate);

  // Derive top metrics
  const totalDPK = (macroMetrics.totalTabungan || 0) + (macroMetrics.totalDeposito || 0);
  const osKredit = macroMetrics.outstandingKredit || 0;
  const labaBersih = macroMetrics.labaTahunBerjalan || 0;
  const npl = macroMetrics.npl || 0;

  // Synthesize trend data (ending in current metrics)
  const trendData = [
    { month: 'Mar', os: Math.round(osKredit * 0.82 / 1000000000), dpk: Math.round(totalDPK * 0.85 / 1000000000) },
    { month: 'Apr', os: Math.round(osKredit * 0.85 / 1000000000), dpk: Math.round(totalDPK * 0.87 / 1000000000) },
    { month: 'Mei', os: Math.round(osKredit * 0.89 / 1000000000), dpk: Math.round(totalDPK * 0.90 / 1000000000) },
    { month: 'Jun', os: Math.round(osKredit * 0.94 / 1000000000), dpk: Math.round(totalDPK * 0.93 / 1000000000) },
    { month: 'Jul', os: Math.round(osKredit * 0.96 / 1000000000), dpk: Math.round(totalDPK * 0.97 / 1000000000) },
    { month: 'Agu', os: Math.round(osKredit * 0.98 / 1000000000), dpk: Math.round(totalDPK * 0.99 / 1000000000) },
    { month: 'Sep', os: Math.round(osKredit / 1000000000), dpk: Math.round(totalDPK / 1000000000) },
  ];

  // Kolektibilitas Data (Simulated based on real NPL & RR)
  const dpPct = (npl === 0 && macroMetrics.rr === 0) ? 0 : Math.max(0, 100 - (npl + macroMetrics.rr));
  const klPct = npl * 0.4; // rough estimate breakdown of NPL
  const dPct = npl * 0.35;
  const mPct = npl * 0.25;
  
  const kolData = [
    { name: 'Lancar (L)', value: macroMetrics.rr !== undefined ? macroMetrics.rr : 0, color: '#22c55e' },
    { name: 'Dalam Perhatian (DP)', value: Number(dpPct.toFixed(2)), color: '#eab308' },
    { name: 'Kurang Lancar (KL)', value: Number(klPct.toFixed(2)), color: '#f97316' },
    { name: 'Diragukan (D)', value: Number(dPct.toFixed(2)), color: '#ef4444' },
    { name: 'Macet (M)', value: Number(mPct.toFixed(2)), color: '#991b1b' },
  ];

  // Sumber Dana Data
  const dpkData = [
    { name: 'Tabungan', value: macroMetrics.totalTabungan || 0, color: '#3b82f6' },
    { name: 'Deposito', value: macroMetrics.totalDeposito || 0, color: '#06b6d4' },
  ];

  // Top 10 Kredit
  const top10Kredit = macroMetrics.top10Kredit || [];
  
  // AO Progress
  const aoProgress = macroMetrics.aoProgress || [];

  // Alert Counts tailored to role
  const isExecutive = currentUser.role.includes('Direktur') || currentUser.role.includes('Komisaris');
  
  const pendingCredit = creditApplications.filter(a => {
    if (isExecutive) return a.currentStage === 'CREDIT_COMMITTEE';
    return a.accountOfficerName === currentUser.name && a.currentStage === 'CREDIT_COMMITTEE';
  }).length;
  
  const activeEws = ewsAlerts.filter(a => !a.isResolved).length; // EWS context is generally already scoped or we just count unresolved
  const rejectedTasks = flowTasks ? flowTasks.filter(t => (t.status as any) === 'REJECTED' && t.assigneeName === currentUser.name).length : 0;
  
  // Filter tasks dynamically for the logged-in user
  const userTasks = flowTasks ? flowTasks.filter(t => t.assigneeName === currentUser.name) : [];
  const myTasks = userTasks.slice(0, 4);
  const upcomingEvents = userTasks.filter(t => t.title.toLowerCase().includes('rapat') || t.category === 'MEETING').slice(0, 3);
  
  // Custom Top Metric Card
  const TopMetricCard = ({ icon: Icon, title, value, trend, isPositive, iconBg, iconColor, period }: any) => (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm flex items-start gap-4 hover:shadow-md transition-shadow">
      <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${iconBg} ${iconColor}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-xs sm:text-sm text-slate-500 font-bold mb-1">{title}</p>
        <h3 className="text-lg sm:text-xl font-black text-slate-800 dark:text-white mb-2">{value}</h3>
        <div className="flex items-center gap-1.5">
          <span className={`text-[10px] sm:text-xs font-bold flex items-center gap-0.5 ${isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
            {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {trend}%
          </span>
          <span className="text-[9px] sm:text-[10px] text-slate-400">vs {period}</span>
        </div>
      </div>
    </div>
  );

  return (
    <PageContainer>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 animate-in fade-in">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            {(() => {
              const hour = new Date().getHours();
              if (hour < 11) return 'Selamat pagi';
              if (hour < 15) return 'Selamat siang';
              if (hour < 18) return 'Selamat sore';
              return 'Selamat malam';
            })()}, {currentUser.name} <span className="text-xl">👋</span>
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1">{currentDate}</p>
        </div>
        <button className="mt-4 sm:mt-0 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition-colors shadow-sm">
          <Filter className="w-4 h-4" /> Filter Data
        </button>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 animate-in fade-in slide-in-from-bottom-4">
        <TopMetricCard 
          icon={Building2} title="OS Kredit" value={formatIDR(osKredit)} trend={osKredit === 0 ? "0" : "3,24"} isPositive={true} 
          iconBg="bg-blue-100" iconColor="text-blue-600" period={prevMonthStr} 
        />
        <TopMetricCard 
          icon={Wallet} title="Dana Pihak Ketiga" value={formatIDR(totalDPK)} trend={totalDPK === 0 ? "0" : "2,81"} isPositive={true} 
          iconBg="bg-purple-100" iconColor="text-purple-600" period={prevMonthStr} 
        />
        <TopMetricCard 
          icon={Activity} title="NPL (Gross)" value={`${npl.toFixed(2)}%`} trend={npl === 0 ? "0" : "0,21"} isPositive={true} 
          iconBg="bg-rose-100" iconColor="text-rose-600" period={prevMonthStr} 
        />
        <TopMetricCard 
          icon={Target} title="Laba Bersih" value={formatIDR(labaBersih)} trend={labaBersih === 0 ? "0" : "7,42"} isPositive={true} 
          iconBg="bg-emerald-100" iconColor="text-emerald-600" period={prevMonthStr} 
        />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-8">
        
        {/* Left/Center Column (Wider) */}
        <div className="xl:col-span-2 flex flex-col gap-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Trend Kredit & DPK */}
            <Card className="p-5 flex flex-col h-[350px]">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-4">Trend Kredit & DPK</h3>
              <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(val) => `${val} M`} />
                    <RechartsTooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      labelStyle={{ fontWeight: 'bold', color: '#1e293b', marginBottom: '4px' }}
                    />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 'bold', paddingTop: '10px' }} />
                    <Line type="monotone" name="OS Kredit (M)" dataKey="os" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                    <Line type="monotone" name="DPK (M)" dataKey="dpk" stroke="#a855f7" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Kolektibilitas Kredit */}
            <Card className="p-5 flex flex-col h-[350px]">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-0">Kolektibilitas Kredit</h3>
              <div className="flex-1 min-h-0 flex items-center justify-center relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={kolData} innerRadius="60%" outerRadius="80%" paddingAngle={2} dataKey="value">
                      {kolData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center Text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-2">
                  <span className="text-[10px] text-slate-500 font-bold">Total</span>
                  <span className="text-sm font-black text-slate-800 dark:text-slate-100">{formatIDR(osKredit)}</span>
                </div>
              </div>
              {/* Custom Legend */}
              <div className="mt-2 space-y-1.5">
                {kolData.map(item => (
                  <div key={item.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></span>
                      <span className="text-slate-600 dark:text-slate-400 font-medium">{item.name}</span>
                    </div>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{item.value}%</span>
                  </div>
                ))}
              </div>
              <button className="mt-4 text-xs font-bold text-blue-600 flex items-center gap-1 hover:underline w-max">
                Detail kolektibilitas <ArrowRight className="w-3 h-3" />
              </button>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 10 Kredit Terbesar */}
            <Card className="p-5 flex flex-col h-[400px]">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-4">10 Kredit Terbesar</h3>
              <div className="flex-1 overflow-auto scrollbar-hide">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-white dark:bg-slate-900 z-10">
                    <tr className="text-left text-slate-500 border-b border-slate-100 dark:border-slate-800">
                      <th className="pb-2 font-bold">No</th>
                      <th className="pb-2 font-bold">No. Kredit</th>
                      <th className="pb-2 font-bold">Nama Debitur</th>
                      <th className="pb-2 font-bold text-right">OS (Rp)</th>
                      <th className="pb-2 font-bold text-center">Kol</th>
                    </tr>
                  </thead>
                  <tbody>
                    {top10Kredit.map((k, i) => (
                      <tr key={i} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/30">
                        <td className="py-2.5 text-slate-400 font-medium">{i + 1}</td>
                        <td className="py-2.5 text-slate-600 dark:text-slate-300 font-mono text-[10px]">{k.id.split('-').slice(0,2).join('-')}</td>
                        <td className="py-2.5 font-bold text-slate-800 dark:text-slate-200 truncate max-w-[100px]">{k.applicantName}</td>
                        <td className="py-2.5 text-right font-medium text-slate-600 dark:text-slate-300">{formatIDR(k.plafon).replace('Rp ', '')}</td>
                        <td className="py-2.5 text-center">
                          <span className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-emerald-100 text-emerald-700 font-bold text-[9px]">
                            L
                          </span>
                        </td>
                      </tr>
                    ))}
                    {top10Kredit.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-500 text-sm">
                          Belum ada data fasilitas kredit
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <button className="mt-4 text-xs font-bold text-blue-600 flex items-center gap-1 hover:underline w-max pt-2 border-t border-slate-100 dark:border-slate-800">
                Lihat semua kredit <ArrowRight className="w-3 h-3" />
              </button>
            </Card>

            <div className="flex flex-col gap-6">
              {/* Pencapaian Target AO */}
              <Card className="p-5 flex-1">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Pencapaian Target AO <span className="text-slate-400 font-normal">(This Month)</span></h3>
                  <button className="text-[10px] font-bold text-blue-600 flex items-center gap-1 hover:underline">
                    Lihat semua <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
                <div className="space-y-3.5">
                  {aoProgress.map((ao, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-xs text-slate-400 font-medium w-3">{i+1}</span>
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-200 w-24 truncate">{ao.name}</span>
                      <div className="flex-1 bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${ao.progress >= 100 ? 'bg-blue-600' : 'bg-blue-400'}`} style={{ width: `${Math.min(ao.progress, 100)}%` }}></div>
                      </div>
                      <span className="text-[9px] font-medium text-slate-400 dark:text-slate-500 w-16 text-right leading-tight">Target blm diset</span>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Sumber Dana (DPK) */}
              <Card className="p-5 flex-1 flex flex-col">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-0">Sumber Dana (DPK)</h3>
                <div className="flex-1 flex items-center justify-between relative mt-2">
                  <div className="w-24 h-24 relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={dpkData} innerRadius="65%" outerRadius="100%" paddingAngle={0} dataKey="value" stroke="none">
                          {dpkData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-[8px] text-slate-500 font-bold">Total</span>
                      <span className="text-[10px] font-black text-slate-800 dark:text-slate-100">{formatIDR(totalDPK).replace('Rp ', '')}</span>
                    </div>
                  </div>
                  <div className="flex-1 pl-4 space-y-2">
                    {dpkData.map(item => (
                      <div key={item.name} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></span>
                          <span className="text-slate-600 dark:text-slate-400 font-medium text-[10px]">{item.name}</span>
                        </div>
                        <span className="font-bold text-slate-800 dark:text-slate-200 text-[10px]">
                          {totalDPK > 0 ? ((item.value / totalDPK) * 100).toFixed(2) : '0.00'}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="xl:col-span-1 flex flex-col gap-6">
          
          {/* ATTENTION REQUIRED */}
          <Card className="p-5 bg-white dark:bg-slate-900 border-rose-100 dark:border-rose-900/30">
            <h3 className="text-xs font-bold text-rose-500 uppercase tracking-widest mb-4">Attention Required</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3 group cursor-pointer">
                <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-900/20 text-rose-500 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 group-hover:text-rose-600 transition-colors">Kredit perlu keputusan</h4>
                  <p className="text-[10px] text-slate-500">Menunggu persetujuan komite / direksi</p>
                </div>
                <span className="text-base font-black text-rose-600">{pendingCredit}</span>
              </div>
              
              {rejectedTasks > 0 && (
                <div className="flex items-center justify-between gap-3 group cursor-pointer animate-in fade-in">
                  <div className="w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-900/40 text-rose-600 flex items-center justify-center shrink-0">
                    <XCircle className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 group-hover:text-rose-600 transition-colors">Tugas Ditolak Atasan</h4>
                    <p className="text-[10px] text-slate-500">Perlu revisi atau perbaikan segera</p>
                  </div>
                  <span className="text-base font-black text-rose-600">{rejectedTasks}</span>
                </div>
              )}
              
              <div className="flex items-center justify-between gap-3 group cursor-pointer">
                <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-500 flex items-center justify-center shrink-0">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 group-hover:text-amber-600 transition-colors">Nasabah masuk EWS</h4>
                  <p className="text-[10px] text-slate-500">Perlu follow up segera</p>
                </div>
                <span className="text-base font-black text-amber-600">{activeEws}</span>
              </div>

              <div className="flex items-center justify-between gap-3 group cursor-pointer">
                <div className="w-8 h-8 rounded-lg bg-orange-50 dark:bg-orange-900/20 text-orange-500 flex items-center justify-center shrink-0">
                  <Calendar className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 group-hover:text-orange-600 transition-colors">Janji bayar jatuh tempo</h4>
                  <p className="text-[10px] text-slate-500">Hari ini / overdue</p>
                </div>
                <span className="text-base font-black text-orange-600">0</span>
              </div>

              <div className="flex items-center justify-between gap-3 group cursor-pointer">
                <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-500 flex items-center justify-center shrink-0">
                  <CheckSquare className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 transition-colors">Dokumen belum lengkap</h4>
                  <p className="text-[10px] text-slate-500">Perlu dilengkapi</p>
                </div>
                <span className="text-base font-black text-blue-600">0</span>
              </div>

              <div className="flex items-center justify-between gap-3 group cursor-pointer">
                <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center shrink-0">
                  <Activity className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 group-hover:text-slate-600 transition-colors">Temuan audit belum ditutup</h4>
                  <p className="text-[10px] text-slate-500">Perlu tindak lanjut</p>
                </div>
                <span className="text-base font-black text-rose-600">0</span>
              </div>
            </div>
            <button className="mt-5 text-xs font-bold text-blue-600 flex items-center gap-1 hover:underline pt-3 border-t border-slate-100 dark:border-slate-800 w-full">
              Lihat semua <ArrowRight className="w-3 h-3" />
            </button>
          </Card>

          {/* My Tasks */}
          <Card className="p-5 flex-1">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">My Tasks</h3>
              <button className="text-[10px] font-bold text-blue-600 flex items-center gap-1 hover:underline">
                Lihat semua <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            <div className="space-y-4">
              {myTasks.length > 0 ? myTasks.map(task => (
                <div key={task.id} className="pb-3 border-b border-slate-100 dark:border-slate-800 last:border-0 last:pb-0">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">{task.title}</h4>
                    <span className="text-[10px] font-bold text-rose-500">{task.dueDate}</span>
                  </div>
                  <p className="text-[10px] text-slate-500">{task.description}</p>
                </div>
              )) : (
                <p className="text-xs text-slate-500 italic">Tidak ada tugas aktif.</p>
              )}
            </div>
          </Card>

          {/* Upcoming Events */}
          <Card className="p-5 flex-1">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Upcoming Events</h3>
              <button className="text-[10px] font-bold text-blue-600 flex items-center gap-1 hover:underline">
                Lihat kalender <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            <div className="space-y-4">
              {upcomingEvents.length > 0 ? upcomingEvents.map((ev, i) => (
                <div key={ev.id} className="flex items-start gap-3">
                  <span className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${i % 2 === 0 ? 'bg-emerald-500' : 'bg-orange-500'}`}></span>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-0.5">{ev.title}</h4>
                    <p className="text-[10px] text-slate-500">{ev.dueDate}</p>
                  </div>
                </div>
              )) : (
                <p className="text-xs text-slate-500 italic">Tidak ada jadwal rapat/event.</p>
              )}
            </div>
          </Card>

        </div>
      </div>



    </PageContainer>
  );
};
