import React, { useState } from 'react';
import { 
 ShieldCheck, 
 ShieldAlert, 
 AlertTriangle, 
 CheckCircle2, 
 XCircle, 
 FileCheck2, 
 Search, 
 Filter, 
 Bell, 
 Sparkles, 
 Activity, 
 FileText, 
 Scale, 
 Lock, 
 Info, 
 ChevronRight, 
 Sliders, 
 Users, 
 AlertCircle,
 Clock,
 Building,
 ArrowUpRight,
 TrendingUp,
 Award
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { KreditBermasalahItem } from '../../../types/legacy';
import { useApp } from '../../../context/AppContext';

interface DashboardPeKepatuhanProps {
 nplList?: KreditBermasalahItem[];
}

const CustomSlider = ({ 
  value, min, max, step, onChange, colorClass 
}: { 
  value: number; min: number; max: number; step: number; onChange: (val: number) => void; colorClass: string 
}) => {
  const percent = ((value - min) / (max - min)) * 100;
  // Default to a fallback color if colorClass doesn't map directly to a hex, but using Tailwind classes is tricky with inline gradients.
  // Instead, we can use a wrapper div with a colored absolute bar.
  return (
    <div className="relative w-full h-5 flex items-center group">
      <div className="absolute w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
        <div 
          className={`h-full ${colorClass} transition-all duration-150`} 
          style={{ width: `${percent}%` }}
        />
      </div>
      <input 
        type="range" 
        min={min} 
        max={max} 
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="absolute w-full h-full appearance-none bg-transparent outline-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-[3px] [&::-webkit-slider-thumb]:shadow-md hover:[&::-webkit-slider-thumb]:scale-110 [&::-webkit-slider-thumb]:transition-transform z-10"
        style={{
          // Apply border color dynamically based on theme/color
          '--tw-thumb-color': 'currentColor'
        } as React.CSSProperties}
      />
      {/* Custom thumb to match color exactly */}
      <div 
        className={`absolute w-4 h-4 rounded-full bg-white border-4 ${colorClass.replace('bg-', 'border-')} shadow-sm pointer-events-none transition-all duration-150 z-0 group-hover:scale-110`}
        style={{ left: `calc(${percent}% - 8px)` }}
      />
    </div>
  );
};

interface RatioThreshold {
 id: string;
 name: string;
 category: string;
 currentValue: number;
 thresholdWarning: number;
 thresholdCritical: number;
 unit: string;
 comparison: 'GREATER' | 'LESS'; // GREATER means alert if currentValue > threshold
 status: 'SAFE' | 'WARNING' | 'CRITICAL';
 description: string;
}

export default function DashboardPeKepatuhan({ nplList = [] }: DashboardPeKepatuhanProps) {
 // Threshold Settings State for Auto Alerts
 const [nplGrossVal, setNplGrossVal] = useState<number>(2.15);
 const [ldrVal, setLdrVal] = useState<number>(91.5);
 const [carVal, setCarVal] = useState<number>(14.2);
 const [unresolvedAuditVal, setUnresolvedAuditVal] = useState<number>(4);
 const [sopNonComplianceVal, setSopNonComplianceVal] = useState<number>(1.2);

 // Active Filter / Tab State
 const [selectedRiskCategory, setSelectedRiskCategory] = useState<string>('ALL');

 // Automated Ratios Array based on state
 const thresholdList: RatioThreshold[] = [
 {
 id: 'TH-01',
 name: 'Rasio NPL Gross (Kredit Bermasalah)',
 category: 'NPL & Kredit',
 currentValue: nplGrossVal,
 thresholdWarning: 3.00,
 thresholdCritical: 5.00,
 unit: '%',
 comparison: 'GREATER',
 status: nplGrossVal >= 5.00 ? 'CRITICAL' : nplGrossVal >= 3.00 ? 'WARNING' : 'SAFE',
 description: 'Batas maksimum OJK adalah 0%. Peringatan dini dipicu jika NPL Gross melebihi 0%.'
 },
 {
 id: 'TH-02',
 name: 'Rasio LDR (Loan to Deposit Ratio)',
 category: 'Likuiditas',
 currentValue: ldrVal,
 thresholdWarning: 90.00,
 thresholdCritical: 94.00,
 unit: '%',
 comparison: 'GREATER',
 status: ldrVal >= 94.00 ? 'CRITICAL' : ldrVal >= 90.00 ? 'WARNING' : 'SAFE',
 description: 'Optimum LDR BPR adalah 75% - 90%. Jika >90% likuiditas mengetat.'
 },
 {
 id: 'TH-03',
 name: 'Rasio CAR (Kecukupan Modal)',
 category: 'Permodalan',
 currentValue: carVal,
 thresholdWarning: 12.00,
 thresholdCritical: 8.00,
 unit: '%',
 comparison: 'LESS',
 status: carVal <= 8.00 ? 'CRITICAL' : carVal <= 12.00 ? 'WARNING' : 'SAFE',
 description: 'Rasio Kewajiban Penyediaan Modal Minimum (KPMM/CAR) OJK min 0%.'
 },
 {
 id: 'TH-04',
 name: 'Temuan Audit Belum Selesai',
 category: 'Audit & Temuan',
 currentValue: unresolvedAuditVal,
 thresholdWarning: 3,
 thresholdCritical: 6,
 unit: 'Temuan',
 comparison: 'GREATER',
 status: unresolvedAuditVal >= 6 ? 'CRITICAL' : unresolvedAuditVal >= 3 ? 'WARNING' : 'SAFE',
 description: 'Jumlah temuan audit internal/eksternal yang melebihi target SLA perbaikan.'
 },
 {
 id: 'TH-05',
 name: 'Tingkat Deviasi SOP Kredit',
 category: 'Kepatuhan SOP',
 currentValue: sopNonComplianceVal,
 thresholdWarning: 2.00,
 thresholdCritical: 4.00,
 unit: '%',
 comparison: 'GREATER',
 status: sopNonComplianceVal >= 4.00 ? 'CRITICAL' : sopNonComplianceVal >= 2.00 ? 'WARNING' : 'SAFE',
 description: 'Persentase penyimpangan kelengkapan dokumen / alur komite kredit.'
 }
 ];

 // Audit Findings List (Temuan Audit)
 const auditTemuanList: any[] = [];

 // Anti-Fraud Early Warning List
 const fraudIndicators: any[] = [];

 // Risk Profile Matrix Overall Rating
 const riskProfileMatrix: any[] = [];

 // Computed Triggered Alerts Count
 const { ewsAlerts } = useApp();
 const complianceEwsAlerts = ewsAlerts.filter(a => a.module === 'EWS' && a.status === 'ACTION_REQUIRED');
 const triggeredAlerts = thresholdList.filter(t => t.status !== 'SAFE');

 return (
 <div className="space-y-6 pb-12">
 {/* Header Banner - PE Kepatuhan & Risk Management */}
 <div className="bg-surface shadow-md text-foreground rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
 <div className="absolute top-0 right-0 -mt-10 -mr-10 w-96 h-96 /10 rounded-full pointer-events-none" />
 <div className="absolute bottom-0 left-1/3 -mb-10 w-64 h-64 /10 rounded-full pointer-events-none" />

 <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
 <div className="space-y-2">
 <div className="flex items-center gap-3 flex-wrap">
 <span className="px-3 py-1 bg-primary-light border border-primary/20 text-primary rounded-full text-xs font-black tracking-widest uppercase flex items-center gap-1.5">
 <ShieldCheck size={14} className="text-primary" /> Executive Compliance Portal
 </span>
 <span className="px-3 py-1 bg-primary-light border border-primary/20 text-primary rounded-full text-xs font-bold flex items-center gap-1.5">
 <Users size={13} className="text-primary" /> PE Kepatuhan & Manrisk: Huda Asrori
 </span>
 </div>
 <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground flex items-center gap-2.5">
 Dashboard Kepatuhan, Manajemen Risiko & Anti Fraud
 </h1>
 <p className="text-slate-300 text-xs sm:text-sm font-medium max-w-3xl leading-relaxed">
 Pusat Pengawasan PE Kepatuhan BPR ARA: Monitoring NPL, Kredit Bermasalah, Audit Intern, Anti Fraud, Kepatuhan SOP, Temuan Audit, dan Sistem Peringatan Otomatis Ambang Batas Rasio (Threshold EWS).
 </p>
 </div>

 <div className="flex items-center gap-3 flex-wrap shrink-0">
 <div className={`px-4 py-2.5 rounded-2xl border text-xs font-black flex items-center gap-2.5 shadow-sm dark:shadow-none ${
 (triggeredAlerts.length + complianceEwsAlerts.length) > 0 
 ? ' /20 ring-2 animate-pulse' 
 : ' /20 '
 }`}>
 <Bell size={16} className={(triggeredAlerts.length + complianceEwsAlerts.length) > 0 ? '' : ''} />
 <span>Peringatan Ambang Batas: <strong>{triggeredAlerts.length + complianceEwsAlerts.length} Active Alert</strong></span>
 </div>
 </div>
 </div>
 </div>

 {/* AUTOMATED THRESHOLD ALERT BANNERS (User Requirement:"dapat memberi peringatan otomatis jika rasio melewati ambang tertentu") */}
 <AnimatePresence>
 {(triggeredAlerts.length > 0 || complianceEwsAlerts.length > 0) && (
 <motion.div 
 initial={{ opacity: 0, y: -10 }}
 animate={{ opacity: 1, y: 0 }}
 exit={{ opacity: 0, y: -10 }}
 className="bg-warning/10 border-warning/30 text-foreground p-5 rounded-3xl border shadow-lg space-y-4 relative overflow-hidden"
 >
 <div className="absolute top-0 right-0 w-32 h-32 bg-warning/5 rounded-full -mt-10 -mr-10 blur-2xl pointer-events-none"></div>
 <div className="flex items-center justify-between border-b border-warning/20 pb-3 relative z-10">
 <div className="flex items-center gap-2.5">
 <ShieldAlert size={22} className="animate-bounce text-warning" />
 <h3 className="text-sm font-black tracking-tight uppercase text-warning-700 dark:text-warning">
 ⚠️ Peringatan Otomatis Ambang Batas Rasio (EWS System Active)
 </h3>
 </div>
 <span className="text-[10px] text-white bg-warning font-black px-3 py-1 rounded-full shadow-sm">
 Terdeteksi {triggeredAlerts.length + complianceEwsAlerts.length} Pengawasan Khusus
 </span>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
 {triggeredAlerts.map((t) => (
 <div key={t.id} className="p-4 rounded-2xl bg-surface border border-warning/30 shadow-sm space-y-2">
 <div className="flex items-center justify-between">
 <span className="text-xs font-black text-foreground">{t.name}</span>
 <span className={`text-[9px] font-black px-2 py-1 rounded-md text-white shadow-sm ${
 t.status === 'CRITICAL' ? 'bg-danger' : 'bg-warning'
 }`}>
 {t.status === 'CRITICAL' ? 'CRITICAL BREACH' : 'WARNING THRESHOLD'}
 </span>
 </div>
 <div className="flex items-baseline gap-2">
 <span className={`text-2xl font-black ${t.status === 'CRITICAL' ? 'text-danger' : 'text-warning'}`}>
 {t.currentValue}{t.unit}
 </span>
 <span className="text-[10px] font-bold text-muted bg-surface-muted px-2 py-1 rounded-lg">
 Ambang Batas: {t.thresholdWarning}{t.unit} (Kritis: {t.thresholdCritical}{t.unit})
 </span>
 </div>
 <p className="text-[10px] font-medium leading-relaxed text-muted mt-2 border-t border-border pt-2">
 {t.description}
 </p>
 </div>
 ))}
 {complianceEwsAlerts.map((a) => (
 <div key={a.id} className="p-4 rounded-2xl bg-surface border border-danger/30 shadow-sm space-y-2">
 <div className="flex items-center justify-between">
 <span className="text-xs font-black text-foreground">{a.title}</span>
 <span className={`text-[9px] font-black px-2 py-1 rounded-md text-white shadow-sm ${a.severity === 'RED' ? 'bg-danger' : 'bg-warning'}`}>
 {a.severity === 'RED' ? 'CRITICAL RISK' : 'WARNING RISK'}
 </span>
 </div>
 <div className="flex items-baseline gap-2">
 <span className={`text-xl font-black ${a.severity === 'RED' ? 'text-danger' : 'text-warning'}`}>
 {a.entityReference}
 </span>
 </div>
 <p className="text-[10px] font-medium leading-relaxed text-muted mt-2 border-t border-border pt-2">
 {a.description}
 </p>
 </div>
 ))}
 </div>
 </motion.div>
 )}
 </AnimatePresence>

 {/* THRESHOLD CONTROLLER & SIMULATION ENGINE */}
 <div className="bg-surface shadow-md p-5 rounded-2xl space-y-4">
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
 <div className="flex items-center gap-2.5">
 <div className="p-2 rounded-xl">
 <Sliders size={20} />
 </div>
 <div>
 <h3 className="text-sm font-black text-foreground dark:text-foreground">Simulasi & Pengaturan Ambang Batas Rasio (Threshold)</h3>
 <p className="text-xs text-muted font-medium">Uji skenario rasio keuangan dan kepatuhan secara otomatis</p>
 </div>
 </div>
 <button 
 onClick={() => {
 setNplGrossVal(2.15);
 setLdrVal(91.5);
 setCarVal(14.2);
 setUnresolvedAuditVal(4);
 setSopNonComplianceVal(1.2);
 }}
 className="text-xs font-bold hover:underline cursor-pointer self-start sm:self-auto"
 >
 Reset Parameter Default
 </button>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
 {/* Slider 1: NPL Gross */}
 <div className="bg-background dark:bg-white/5 p-3.5 rounded-2xl border border-border/80 space-y-2">
 <div className="flex items-center justify-between text-xs">
 <span className="font-extrabold text-foreground dark:text-gray-200">NPL Gross</span>
 <span className={`font-black ${nplGrossVal >= 3.0 ? 'text-primary' : 'text-muted'}`}>
 {nplGrossVal}%
 </span>
 </div>
 <CustomSlider 
  min={1.00} 
  max={6.00} 
  step={0.05}
  value={nplGrossVal}
  onChange={setNplGrossVal}
  colorClass="bg-slate-800 dark:bg-slate-400"
 />
 <div className="flex items-center justify-between text-[10px] font-bold text-muted">
 <span>Ambang: 3%</span>
 <span>OJK Max: 5%</span>
 </div>
 </div>

 {/* Slider 2: LDR */}
 <div className="bg-background dark:bg-white/5 p-3.5 rounded-2xl border border-border/80 space-y-2">
 <div className="flex items-center justify-between text-xs">
 <span className="font-extrabold text-foreground dark:text-gray-200">LDR Likuiditas</span>
 <span className={`font-black ${ldrVal >= 90.0 ? 'text-primary' : 'text-muted'}`}>
 {ldrVal}%
 </span>
 </div>
 <CustomSlider 
  min={75.0} 
  max={98.0} 
  step={0.5}
  value={ldrVal}
  onChange={setLdrVal}
  colorClass="bg-blue-600 dark:bg-blue-500"
 />
 <div className="flex items-center justify-between text-[10px] font-bold text-muted">
 <span>Optimum: 90%</span>
 <span>Kritis: 94%</span>
 </div>
 </div>

 {/* Slider 3: CAR */}
 <div className="bg-background dark:bg-white/5 p-3.5 rounded-2xl border border-border/80 space-y-2">
 <div className="flex items-center justify-between text-xs">
 <span className="font-extrabold text-foreground dark:text-gray-200">CAR Permodalan</span>
 <span className={`font-black ${carVal <= 12.0 ? 'text-primary' : 'text-muted'}`}>
 {carVal}%
 </span>
 </div>
 <CustomSlider 
  min={7.0} 
  max={20.0} 
  step={0.2}
  value={carVal}
  onChange={setCarVal}
  colorClass="bg-emerald-600 dark:bg-emerald-500"
 />
 <div className="flex items-center justify-between text-[10px] font-bold text-muted">
 <span>Min OJK: 12%</span>
 <span>Bahaya: &lt;8%</span>
 </div>
 </div>

 {/* Slider 4: Temuan Audit */}
 <div className="bg-background dark:bg-white/5 p-3.5 rounded-2xl border border-border/80 space-y-2">
 <div className="flex items-center justify-between text-xs">
 <span className="font-extrabold text-foreground dark:text-gray-200">Temuan Open</span>
 <span className={`font-black ${unresolvedAuditVal >= 3 ? 'text-primary' : 'text-muted'}`}>
 {unresolvedAuditVal} Item
 </span>
 </div>
 <CustomSlider 
  min={0} 
  max={10} 
  step={1}
  value={unresolvedAuditVal}
  onChange={setUnresolvedAuditVal}
  colorClass="bg-amber-500 dark:bg-amber-400"
 />
 <div className="flex items-center justify-between text-[10px] font-bold text-muted">
 <span>Batas Warn: 3</span>
 <span>Max: 6</span>
 </div>
 </div>

 {/* Slider 5: Deviasi SOP */}
 <div className="bg-background dark:bg-white/5 p-3.5 rounded-2xl border border-border/80 space-y-2">
 <div className="flex items-center justify-between text-xs">
 <span className="font-extrabold text-foreground dark:text-gray-200">Deviasi SOP</span>
 <span className={`font-black ${sopNonComplianceVal >= 2.0 ? 'text-primary' : 'text-muted'}`}>
 {sopNonComplianceVal}%
 </span>
 </div>
 <CustomSlider 
  min={0.0} 
  max={5.0} 
  step={0.1}
  value={sopNonComplianceVal}
  onChange={setSopNonComplianceVal}
  colorClass="bg-rose-600 dark:bg-rose-500"
 />
 <div className="flex items-center justify-between text-[10px] font-bold text-muted">
 <span>Batas Warn: 2%</span>
 <span>Kritis: 5%</span>
 </div>
 </div>
 </div>
 </div>

 {/* 7 MAIN REQUIRED SECTIONS MATRIX */}
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
 {/* Section 1: NPL & Kredit Bermasalah */}
 <div className="bg-surface shadow-md p-5 rounded-2xl space-y-3">
 <div className="flex items-center justify-between">
 <span className="text-xs font-bold text-muted uppercase tracking-wider">1. NPL & Kredit Bermasalah</span>
 <div className="p-2 rounded-xl">
 <AlertTriangle size={18} />
 </div>
 </div>
 <div>
 <h3 className="text-2xl font-black text-foreground dark:text-foreground">{nplGrossVal}%</h3>
 <p className="text-xs font-semibold mt-0.5">NPL Net: 0% (Sehat)</p>
 </div>
 <div className="pt-2 border-t border-border space-y-1 text-[11px] font-semibold text-muted">
 <div className="flex justify-between"><span>Kol 2 (Dalam Perhatian):</span> <strong className="text-primary">Rp 0</strong></div>
 <div className="flex justify-between"><span>Kol 3 (Kurang Lancar):</span> <strong className="text-primary">Rp 0</strong></div>
 <div className="flex justify-between"><span>Kol 4 & 5 (Macet):</span> <strong className="text-primary">Rp 0</strong></div>
 </div>
 </div>

 {/* Section 2: Audit Intern Status */}
 <div className="bg-surface shadow-md p-5 rounded-2xl space-y-3">
 <div className="flex items-center justify-between">
 <span className="text-xs font-bold text-muted uppercase tracking-wider">2. Status Audit Intern</span>
 <div className="p-2 rounded-xl">
 <FileCheck2 size={18} />
 </div>
 </div>
 <div>
 <h3 className="text-2xl font-black text-foreground dark:text-foreground">0%</h3>
 <p className="text-xs font-semibold mt-0.5">Skor Kepatuhan Audit</p>
 </div>
 <div className="pt-2 border-t border-border space-y-1 text-[11px] font-semibold text-muted">
 <div className="flex justify-between"><span>Cabang Diaudit YTD:</span> <strong className="text-foreground dark:text-foreground">0 / 4 Cabang</strong></div>
 <div className="flex justify-between"><span>Audit Mendatang:</span> <strong className="text-primary">Kantor Kas Matesih</strong></div>
 <div className="flex justify-between"><span>Tim PE Audit:</span> <strong className="text-foreground dark:text-foreground">Agus Santoso</strong></div>
 </div>
 </div>

 {/* Section 3: Anti Fraud Early Warning */}
 <div className="bg-surface shadow-md p-5 rounded-2xl space-y-3">
 <div className="flex items-center justify-between">
 <span className="text-xs font-bold text-muted uppercase tracking-wider">3. Anti-Fraud Monitor</span>
 <div className="p-2 rounded-xl">
 <Lock size={18} />
 </div>
 </div>
 <div>
 <h3 className="text-2xl font-black text-foreground dark:text-foreground">0 Incident</h3>
 <p className="text-xs font-semibold mt-0.5">Zero Tolerance Fraud</p>
 </div>
 <div className="pt-2 border-t border-border space-y-1 text-[11px] font-semibold text-muted">
 <div className="flex justify-between"><span>Suspicious Alert:</span> <strong className="text-primary">{fraudIndicators.length} Warning</strong></div>
 <div className="flex justify-between"><span>Verifikasi Agunan:</span> <strong className="text-foreground dark:text-foreground">0% Validated</strong></div>
 <div className="flex justify-between"><span>Whistleblowing System:</span> <strong className="text-primary">Aktif & Aman</strong></div>
 </div>
 </div>

 {/* Section 4: Kepatuhan SOP Kredit */}
 <div className="bg-surface shadow-md p-5 rounded-2xl space-y-3">
 <div className="flex items-center justify-between">
 <span className="text-xs font-bold text-muted uppercase tracking-wider">4. Kepatuhan SOP</span>
 <div className="p-2 rounded-xl">
 <Scale size={18} />
 </div>
 </div>
 <div>
 <h3 className="text-2xl font-black text-foreground dark:text-foreground">0%</h3>
 <p className="text-xs font-semibold mt-0.5">Kepatuhan Berkas SOP</p>
 </div>
 <div className="pt-2 border-t border-border space-y-1 text-[11px] font-semibold text-muted">
 <div className="flex justify-between"><span>Persetujuan Komite:</span> <strong className="text-foreground dark:text-foreground">0% Sesuai Limit</strong></div>
 <div className="flex justify-between"><span>Cek Legal & SLIK:</span> <strong className="text-foreground dark:text-foreground">Mandatori OK</strong></div>
 <div className="flex justify-between"><span>Pengikatan Notaris:</span> <strong className="text-foreground dark:text-foreground">Sesuai Jangka Waktu</strong></div>
 </div>
 </div>
 </div>

 {/* TEMUAN AUDIT MATRIX & RISK LEVEL PROFILES */}
 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
 {/* Section 5 & 6: Temuan Audit & Action Plan Matrix */}
 <div className="lg:col-span-2 bg-surface shadow-md p-6 rounded-2xl space-y-4">
 <div className="flex items-center justify-between border-b border-border pb-3">
 <div className="flex items-center gap-2.5">
 <div className="p-2 rounded-xl">
 <FileText size={20} />
 </div>
 <div>
 <h3 className="text-base font-black text-foreground dark:text-foreground">5 & 6. Matrix Temuan Audit & Action Plan</h3>
 <p className="text-xs text-muted font-medium">Monitoring Tindak Lanjut Rekomendasi Audit oleh Cabang</p>
 </div>
 </div>
 <span className="text-xs font-bold border px-2.5 py-1 rounded-lg">
 {auditTemuanList.length} Total Temuan
 </span>
 </div>

 <div className="space-y-3">
 {auditTemuanList.map((t) => (
 <div key={t.id} className="p-4 rounded-2xl border border-border/90 bg-background hover:border-slate-300 dark:border-primary-light/20 transition-all space-y-2.5">
 <div className="flex items-start justify-between gap-2">
 <div className="space-y-0.5">
 <span className="text-[10px] font-black uppercase tracking-wider">{t.category}</span>
 <h4 className="text-xs font-black text-foreground dark:text-foreground">{t.title}</h4>
 <p className="text-[10px] text-muted font-bold">{t.branch} • Auditor: {t.auditor}</p>
 </div>
 <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border ${
 t.riskLevel === 'HIGH' ? ' ' :
 t.riskLevel === 'MEDIUM' ? ' ' :
 'bg-surface-muted text-foreground border-border'
 }`}>
 Risk: {t.riskLevel}
 </span>
 </div>

 <p className="text-[11px] text-foreground dark:text-gray-200 font-medium bg-surface p-2.5 rounded-xl border border-border">
 💡 <strong>Rekomendasi Action Plan:</strong> {t.recommendation}
 </p>

 <div className="flex items-center justify-between text-[10px] pt-1">
 <span className="font-extrabold text-muted">Target Selesai: {t.dueDate}</span>
 <span className={`font-black px-2 py-0.5 rounded ${
 t.status === 'RESOLVED' ? ' ' :
 t.status === 'IN_PROGRESS' ? ' ' :
 ' '
 }`}>
 Status: {t.status}
 </span>
 </div>
 </div>
 ))}
 </div>
 </div>

 {/* Section 7: Risk Level (Matriks Profil Risiko Bank) */}
 <div className="bg-surface shadow-md p-6 rounded-2xl space-y-4">
 <div className="flex items-center justify-between border-b border-border pb-3">
 <div className="flex items-center gap-2.5">
 <div className="p-2 rounded-xl">
 <ShieldCheck size={20} />
 </div>
 <div>
 <h3 className="text-base font-black text-foreground dark:text-foreground">7. Risk Level & Risk Profile</h3>
 <p className="text-xs text-muted font-medium">Profil Risiko Terpadu BPR ARA</p>
 </div>
 </div>
 </div>

 <div className="space-y-3">
 {riskProfileMatrix.map((r, idx) => (
 <div key={idx} className="p-3 rounded-2xl border border-border bg-background dark:bg-white/5/60 space-y-1.5">
 <div className="flex items-center justify-between text-xs">
 <span className="font-extrabold text-foreground dark:text-foreground">{r.name}</span>
 <span className="font-black px-2 py-0.5 rounded-md border">
 {r.level} ({r.score})
 </span>
 </div>
 <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
 <div 
 className={`h-full rounded-full ${
 r.score >= 3.0 ? ' ' : r.score >= 2.0 ? ' ' : ' '
 }`} 
 style={{ width: `${(r.score / 5) * 100}%` }}
 />
 </div>
 <p className="text-[10px] text-muted font-semibold">{r.note}</p>
 </div>
 ))}
 </div>
 </div>
 </div>
 </div>
 );
}
