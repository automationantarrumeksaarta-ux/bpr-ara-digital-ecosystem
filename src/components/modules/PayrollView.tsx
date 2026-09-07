import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calculator, User, Briefcase, Activity, Calendar, 
  ChevronRight, Download, CheckCircle, AlertTriangle, WalletCards,
  TrendingUp, Crosshair, HelpCircle, ShieldAlert,
  BarChart4,
  Building
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

// --- Types for SK Direksi 2026 ---

type MacroGradeType = 'A+' | 'A' | 'B+' | 'B' | 'C' | 'D' | 'E';

interface MacroGradeDefinition {
  grade: MacroGradeType;
  label: string;
  rrRange: string;
  nplRange: string;
  multiplier: number; // 1.20 for 120%
}

export const MACRO_GRADES: Record<MacroGradeType, MacroGradeDefinition> = {
  'A+': { grade: 'A+', label: 'Sangat Sehat', rrRange: '≥85%', nplRange: '≤10%', multiplier: 1.20 },
  'A':  { grade: 'A',  label: 'Sehat',        rrRange: '80%–0%', nplRange: '≤12%', multiplier: 1.10 },
  'B+': { grade: 'B+', label: 'Baik',         rrRange: '75%–0%', nplRange: '≤15%', multiplier: 1.00 },
  'B':  { grade: 'B',  label: 'Cukup Stabil', rrRange: '71%–0%', nplRange: '≤0%', multiplier: 0.90 },
  'C':  { grade: 'C',  label: 'Warning',      rrRange: '68%–0%', nplRange: '20-21%', multiplier: 0.75 },
  'D':  { grade: 'D',  label: 'Tidak Sehat',  rrRange: '<68%',      nplRange: '>21%', multiplier: 0.50 },
  'E':  { grade: 'E',  label: 'Krisis Risiko',rrRange: '<65%',      nplRange: '>23%', multiplier: 0.00 }, // KPI Dibekukan
};

interface PillarMetric {
  weight: number; // 0 to 1
  score: number;  // 0 to 120+ (Percentage of target achieved)
}

interface EmployeeKPI {
  id: string;
  name: string;
  role: string;
  department: string;
  baseSalary: number;
  mealAllowance: number;
  deductions: number; 
  kpiBaseNominal: number; 
  pillars: {
    profit: PillarMetric;
    risk: PillarMetric;
    growth: PillarMetric;
    digital: PillarMetric;
  };
}

const formatIDR = (value: number) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value);
};

export const PayrollView: React.FC = () => {
  // Cut-off settings based on user request
  const kpiCutoffDate = 1;
  const payrollCutoffDate = 25;
  const { macroMetrics, setMacroMetrics } = useApp();

  const currentRR = macroMetrics.rr;
  const currentNPL = macroMetrics.npl;

  const getRRGrade = (rr: number): MacroGradeDefinition => {
    if (rr >= 85) return MACRO_GRADES['A+'];
    if (rr >= 80) return MACRO_GRADES['A'];
    if (rr >= 75) return MACRO_GRADES['B+'];
    if (rr >= 71) return MACRO_GRADES['B'];
    if (rr >= 68) return MACRO_GRADES['C'];
    if (rr >= 65) return MACRO_GRADES['D'];
    return MACRO_GRADES['E'];
  };

  const getNPLGrade = (npl: number): MacroGradeDefinition => {
    if (npl <= 10) return MACRO_GRADES['A+'];
    if (npl <= 12) return MACRO_GRADES['A'];
    if (npl <= 15) return MACRO_GRADES['B+'];
    if (npl <= 19.99) return MACRO_GRADES['B'];
    if (npl <= 21) return MACRO_GRADES['C'];
    if (npl <= 23) return MACRO_GRADES['D'];
    return MACRO_GRADES['E'];
  };

  const activeMacroGrade = useMemo(() => {
    const rrGrade = getRRGrade(currentRR);
    const nplGrade = getNPLGrade(currentNPL);
    // Return the grade with the HIGHER multiplier
    return rrGrade.multiplier >= nplGrade.multiplier ? rrGrade : nplGrade;
  }, [currentRR, currentNPL]);

  // Dummy ecosystem data mapped to SK Direksi Roles
  const employees: EmployeeKPI[] = useMemo(() => [], []);

  const [selectedEmp, setSelectedEmp] = useState<EmployeeKPI | null>(null);
  const [payrollStatus, setPayrollStatus] = useState<Record<string, 'DRAFT' | 'APPROVED'>>({});

  // Core Calculator Functions
  const calculateTotalKpiScore = (emp: EmployeeKPI) => {
    return Math.round(
      (emp.pillars.profit.weight * emp.pillars.profit.score) +
      (emp.pillars.risk.weight * emp.pillars.risk.score) +
      (emp.pillars.growth.weight * emp.pillars.growth.score) +
      (emp.pillars.digital.weight * emp.pillars.digital.score)
    );
  };

  const calculateBaseIncentive = (kpiScore: number, baseNominal: number) => {
    if (kpiScore >= 120) return baseNominal * 2.0; // 200%
    if (kpiScore >= 100) return baseNominal * 1.2; // 120%
    if (kpiScore >= 90) return baseNominal * 1.0;  // 100%
    return 0; // <90 gets 0
  };

  const calculateFinalIncentive = (emp: EmployeeKPI, macroMultiplier: number) => {
    const kpiScore = calculateTotalKpiScore(emp);
    const baseIncentive = calculateBaseIncentive(kpiScore, emp.kpiBaseNominal);
    return baseIncentive * macroMultiplier;
  };

  const approvePayroll = (empId: string) => {
    setPayrollStatus(prev => ({ ...prev, [empId]: 'APPROVED' }));
    setSelectedEmp(null);
  };

  const currentMacro = activeMacroGrade;

  return (
    <div className="w-full h-full flex flex-col relative z-0 animate-in fade-in bg-slate-50/50 dark:bg-[#0a0a0a]">
      <div className="p-4 sm:p-6 pt-2 flex-1 flex flex-col max-w-[1600px] mx-auto w-full">
        
        {/* Header Module with Macro Toggle */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 glass-effect p-5 sm:p-6 rounded-2xl flex flex-col lg:flex-row justify-between gap-6 border border-slate-200/60 dark:border-white/10 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-500/10 via-emerald-500/10 to-purple-500/10 blur-3xl -z-10 rounded-full" />
          
          {/* Title Area */}
          <div className="flex items-center gap-4">
            <div className="p-3.5 bg-gradient-to-br from-slate-800 to-slate-900 dark:from-white dark:to-slate-200 text-white dark:text-slate-900 rounded-xl shadow-lg">
              <WalletCards size={24} />
            </div>
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">Penggajian & KPI</h1>
                <span className="px-2.5 py-0.5 bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 text-[10px] font-bold rounded-full uppercase tracking-wider border border-blue-200 dark:border-blue-500/30">
                  SK Direksi 2026
                </span>

              </div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-xl leading-relaxed">
                Tgl 25: Pencairan Take Home Pay Gaji. <br/>Tgl 1: Pencairan Bonus KPI (diukur dengan Pilar Individu & Faktor Makro BPR).
              </p>
            </div>
          </div>
          
          {/* Macro Grading Simulator (Auto Detect) */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm shrink-0">
            <div className="flex flex-col gap-3 min-w-[200px]">
              <div className="flex items-center justify-between gap-1.5 mb-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1.5"><Building size={12} /> Auto-Detect Grading Makro</span>
                <span className="text-[9px] bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-bold px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800 cursor-not-allowed">Di-update PE Bisnis</span>
              </div>
              
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 w-8">RR</label>
                <div className="bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm font-bold rounded-lg px-2 py-1 w-20 text-center text-slate-500 cursor-not-allowed select-none">
                  {currentRR}
                </div>
                <span className="text-xs text-slate-500">%</span>
              </div>
              
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 w-8">NPL</label>
                <div className="bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm font-bold rounded-lg px-2 py-1 w-20 text-center text-slate-500 cursor-not-allowed select-none">
                  {currentNPL}
                </div>
                <span className="text-xs text-slate-500">%</span>
              </div>
            </div>
            
            <div className="hidden sm:block w-px h-16 bg-slate-200 dark:bg-slate-800" />
            
            <div className="flex flex-col justify-center items-center px-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase mb-1">Grade Aktif</span>
              <div className="flex items-center justify-center w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full border border-slate-200 dark:border-slate-700 shadow-inner">
                <span className={`text-xl font-black ${currentMacro.multiplier >= 1 ? 'text-emerald-600' : 'text-red-500'}`}>
                  {currentMacro.grade}
                </span>
              </div>
              <span className="text-[9px] font-bold text-slate-500 mt-1 uppercase text-center">{currentMacro.label}</span>
            </div>

            <div className="hidden sm:block w-px h-16 bg-slate-200 dark:bg-slate-800" />
            
            <div className="flex flex-col gap-1 justify-center min-w-[140px]">
              <div className="flex justify-between items-center text-xs gap-4">
                <span className="text-slate-500">Target RR</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{currentMacro.rrRange}</span>
              </div>
              <div className="flex justify-between items-center text-xs gap-4">
                <span className="text-slate-500">Target NPL</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{currentMacro.nplRange}</span>
              </div>
              <div className="flex justify-between items-center text-xs gap-4 mt-1 pt-1 border-t border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 font-bold">Multiplier (Max)</span>
                <span className={`font-black ${currentMacro.multiplier >= 1 ? 'text-emerald-600' : 'text-red-500'}`}>
                  {currentMacro.multiplier * 100}%
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Analytics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="glass-effect p-5 rounded-2xl border border-slate-200/60 dark:border-white/10 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><WalletCards size={48} /></div>
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Total Gaji (Cair Tgl 25)</h3>
            <p className="text-2xl font-black text-slate-900 dark:text-white relative z-10">
              {formatIDR(employees.reduce((acc, emp) => acc + emp.baseSalary + emp.mealAllowance - emp.deductions, 0))}
            </p>
          </div>
          
          <div className="glass-effect p-5 rounded-2xl border border-emerald-200/60 dark:border-emerald-500/20 shadow-sm bg-emerald-50/50 dark:bg-emerald-900/10 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 text-emerald-500 opacity-10 group-hover:opacity-20 transition-opacity"><TrendingUp size={48} /></div>
            <h3 className="text-xs font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider mb-2">Total Bonus KPI (Cair Tgl 1)</h3>
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 relative z-10">
              {formatIDR(employees.reduce((acc, emp) => acc + calculateFinalIncentive(emp, currentMacro.multiplier), 0))}
            </p>
            {currentMacro.multiplier < 1 && (
              <p className="text-[10px] text-red-500 font-bold mt-1 animate-pulse flex items-center gap-1">
                <ShieldAlert size={10} /> Terdampak Grade {currentMacro.grade} (Penurunan Makro)
              </p>
            )}
          </div>
          
          <div className="glass-effect p-5 rounded-2xl border border-slate-200/60 dark:border-white/10 shadow-sm">
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Total Karyawan</h3>
            <p className="text-2xl font-black text-slate-900 dark:text-white">{employees.length} <span className="text-sm font-medium text-slate-500">Orang</span></p>
          </div>
          
          <div className="glass-effect p-5 rounded-2xl border border-slate-200/60 dark:border-white/10 shadow-sm bg-gradient-to-br from-slate-100 to-white dark:from-slate-800 dark:to-slate-900">
            <h3 className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5"><Calendar size={14}/> Periode Payroll</h3>
            <p className="text-lg font-black text-slate-900 dark:text-white">
              September 2026
            </p>
          </div>
        </div>

        {/* Data Table */}
        <div className="glass-effect rounded-2xl border border-slate-200/60 dark:border-white/10 overflow-hidden flex-1 flex flex-col shadow-sm">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 flex flex-wrap gap-4 justify-between items-center">
            <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm flex items-center gap-2">
              <BarChart4 size={18} className="text-slate-400" />
              Daftar Kalkulasi Gaji & 4-Pillar KPI
            </h3>
            <button className="text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors">
              <Download size={14} /> Ekspor Laporan
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-slate-50/80 dark:bg-[#111111]">
                  <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 whitespace-nowrap">Karyawan</th>
                  <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 whitespace-nowrap">4-Pilar Score</th>
                  <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 whitespace-nowrap">Bonus Makro (Tgl 1)</th>
                  <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 whitespace-nowrap">THP Gaji (Tgl 25)</th>
                  <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 whitespace-nowrap">Status</th>
                  <th className="p-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {employees.map(emp => {
                  const score = calculateTotalKpiScore(emp);
                  const thpGaji = emp.baseSalary + emp.mealAllowance - emp.deductions;
                  const bonusFinal = calculateFinalIncentive(emp, currentMacro.multiplier);
                  const status = payrollStatus[emp.id] || 'DRAFT';
                  
                  return (
                    <tr key={emp.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors group cursor-pointer" onClick={() => setSelectedEmp(emp)}>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300 font-bold shrink-0 border border-slate-200 dark:border-slate-700">
                            {emp.name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900 dark:text-white whitespace-nowrap">{emp.name}</p>
                            <p className="text-[11px] text-slate-500 font-medium whitespace-nowrap">{emp.role}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col gap-1.5 w-full max-w-[160px]">
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-[10px] text-slate-500 uppercase font-bold">Total Individu</span>
                            <span className={`text-sm font-black ${score >= 100 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                              {score}%
                            </span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${score >= 100 ? 'bg-emerald-500' : 'bg-amber-500'}`} 
                              style={{ width: `${Math.min(score, 100)}%` }} 
                            />
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col gap-0.5">
                          <p className={`text-sm font-bold ${bonusFinal > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                            +{formatIDR(bonusFinal)}
                          </p>
                          <span className="text-[10px] text-slate-500 font-medium">Setelah dikali {currentMacro.multiplier * 100}%</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col gap-0.5">
                          <p className="text-sm font-black text-slate-900 dark:text-white">{formatIDR(thpGaji)}</p>
                          <span className="text-[10px] text-slate-500">Tetap (Fix)</span>
                        </div>
                      </td>
                      <td className="p-4">
                        {status === 'APPROVED' ? (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-500/20 w-fit whitespace-nowrap">
                            <CheckCircle size={12} /> APPROVED
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-slate-600 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-700 w-fit whitespace-nowrap">
                            <AlertTriangle size={12} /> DRAFT
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <div className="p-2 text-slate-400 group-hover:text-blue-600 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/30 rounded-xl transition-colors inline-flex">
                          <ChevronRight size={18} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Slip Gaji & 4-Pillar Modal (HR Review) */}
      <AnimatePresence>
        {selectedEmp && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-start sm:items-center justify-center p-0 sm:p-6 overflow-y-auto pt-10 pb-10">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 20 }} 
              className="bg-white dark:bg-[#0a0a0a] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl mx-auto overflow-hidden relative"
            >
              <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-start bg-slate-50 dark:bg-[#111111]">
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white mb-1">SK Direksi 2026: Rincian 4-Pilar & Gaji</h3>
                  <p className="text-xs text-slate-500">Review slip & perhitungan transparan sebelum persetujuan akhir.</p>
                </div>
                <button onClick={() => setSelectedEmp(null)} className="text-slate-400 hover:text-slate-900 dark:hover:text-white font-bold px-2 py-1 bg-slate-200 dark:bg-slate-800 rounded-lg text-sm cursor-pointer transition-colors">Tutup</button>
              </div>

              <div className="p-5 sm:p-6 space-y-6 text-sm dark:text-slate-300">
                {/* Employee Info */}
                <div className="flex gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
                  <div className="w-14 h-14 rounded-full bg-slate-800 flex items-center justify-center text-white font-black text-2xl shrink-0">
                    {selectedEmp.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-lg">{selectedEmp.name}</h4>
                    <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5"><Briefcase size={12}/> {selectedEmp.role} • {selectedEmp.department}</p>
                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold mt-1 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded w-fit">
                      Nominal Dasar KPI: {formatIDR(selectedEmp.kpiBaseNominal)}
                    </p>
                  </div>
                </div>

                {/* 4-Pillar Breakdown */}
                <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                  <div className="bg-slate-100 dark:bg-slate-800/50 px-4 py-2 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
                    <Activity size={14} className="text-slate-600 dark:text-slate-400" />
                    <h5 className="font-bold text-slate-800 dark:text-slate-300 text-[11px] uppercase tracking-wider">Ekstraksi 4 Pilar KPI Individu</h5>
                  </div>
                  
                  <div className="grid grid-cols-4 divide-x divide-slate-200 dark:divide-slate-800 text-center">
                    <div className="p-3 bg-blue-50/50 dark:bg-blue-900/5">
                      <span className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Profit ({selectedEmp.pillars.profit.weight * 100}%)</span>
                      <strong className={`text-base ${selectedEmp.pillars.profit.score >= 100 ? 'text-blue-600' : 'text-slate-700 dark:text-slate-300'}`}>{selectedEmp.pillars.profit.score}%</strong>
                    </div>
                    <div className="p-3 bg-red-50/50 dark:bg-red-900/5">
                      <span className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Risk ({selectedEmp.pillars.risk.weight * 100}%)</span>
                      <strong className={`text-base ${selectedEmp.pillars.risk.score >= 100 ? 'text-red-600' : 'text-slate-700 dark:text-slate-300'}`}>{selectedEmp.pillars.risk.score}%</strong>
                    </div>
                    <div className="p-3 bg-emerald-50/50 dark:bg-emerald-900/5">
                      <span className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Growth ({selectedEmp.pillars.growth.weight * 100}%)</span>
                      <strong className={`text-base ${selectedEmp.pillars.growth.score >= 100 ? 'text-emerald-600' : 'text-slate-700 dark:text-slate-300'}`}>{selectedEmp.pillars.growth.score}%</strong>
                    </div>
                    <div className="p-3 bg-purple-50/50 dark:bg-purple-900/5">
                      <span className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Digital ({selectedEmp.pillars.digital.weight * 100}%)</span>
                      <strong className={`text-base ${selectedEmp.pillars.digital.score >= 100 ? 'text-purple-600' : 'text-slate-700 dark:text-slate-300'}`}>{selectedEmp.pillars.digital.score}%</strong>
                    </div>
                  </div>

                  <div className="px-4 py-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
                    <div>
                      <span className="text-[11px] font-bold text-slate-500 uppercase">Total Bobot Tertimbang</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] text-slate-400">Aturan: 120% &rarr; 2x, 100% &rarr; 1.2x, 90% &rarr; 1x</span>
                      <span className="text-lg font-black text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-3 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                        {calculateTotalKpiScore(selectedEmp)}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Calculation Path */}
                <div className="flex items-stretch gap-2 my-2">
                  <div className="flex-1 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-200 dark:border-slate-800 text-center flex flex-col justify-center">
                    <span className="text-[10px] text-slate-500 font-bold uppercase">Base Incentive</span>
                    <strong className="text-sm">{formatIDR(calculateBaseIncentive(calculateTotalKpiScore(selectedEmp), selectedEmp.kpiBaseNominal))}</strong>
                  </div>
                  <div className="flex flex-col justify-center text-slate-400">x</div>
                  <div className="flex-1 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-200 dark:border-slate-800 text-center flex flex-col justify-center">
                    <span className="text-[10px] text-slate-500 font-bold uppercase">Macro ({currentMacro.grade})</span>
                    <strong className={`text-sm ${currentMacro.multiplier < 1 ? 'text-red-500' : 'text-emerald-600'}`}>{currentMacro.multiplier * 100}%</strong>
                  </div>
                  <div className="flex flex-col justify-center text-slate-400">=</div>
                  <div className="flex-1 bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-lg border border-emerald-200 dark:border-emerald-800 text-center flex flex-col justify-center">
                    <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold uppercase">Final KPI Bonus</span>
                    <strong className="text-sm font-black text-emerald-700 dark:text-emerald-400">{formatIDR(calculateFinalIncentive(selectedEmp, currentMacro.multiplier))}</strong>
                  </div>
                </div>

              </div>

              {/* Total THP & Actions */}
              <div className="p-5 sm:p-6 bg-slate-50 dark:bg-[#111111] border-t border-slate-200 dark:border-slate-800">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  {/* TGL 25 PAYOUT */}
                  <div className="flex justify-between items-center p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div>
                      <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider block mb-1">
                        Gaji Fix (Tgl 25)
                      </span>
                      <p className="text-[10px] text-slate-500">Pokok + Makan - Potongan</p>
                    </div>
                    <strong className="text-xl font-black text-slate-900 dark:text-white">
                      {formatIDR(selectedEmp.baseSalary + selectedEmp.mealAllowance - selectedEmp.deductions)}
                    </strong>
                  </div>

                  {/* TGL 1 PAYOUT */}
                  <div className="flex justify-between items-center p-4 rounded-xl bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-900/10 border border-emerald-200 dark:border-emerald-500/20 shadow-sm relative overflow-hidden">
                    <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-4 translate-y-4"><TrendingUp size={64}/></div>
                    <div className="relative z-10">
                      <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider block mb-1">
                        Bonus KPI (Tgl 1)
                      </span>
                      <p className="text-[10px] text-emerald-600/80 font-medium">Extraksi 4-Pilar + Makro</p>
                    </div>
                    <strong className="text-xl font-black text-emerald-700 dark:text-emerald-400 relative z-10">
                      {formatIDR(calculateFinalIncentive(selectedEmp, currentMacro.multiplier))}
                    </strong>
                  </div>
                </div>

                {payrollStatus[selectedEmp.id] !== 'APPROVED' ? (
                  <div className="flex flex-col-reverse sm:grid sm:grid-cols-2 gap-3">
                    <button onClick={() => setSelectedEmp(null)} className="w-full px-4 py-3.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition-colors cursor-pointer">
                      Tutup / Revisi Nanti
                    </button>
                    <button onClick={() => approvePayroll(selectedEmp.id)} className="w-full px-4 py-3.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-lg shadow-slate-900/20 dark:shadow-white/20">
                      <CheckCircle size={18} /> Kunci & Approve Slip
                    </button>
                  </div>
                ) : (
                  <div className="w-full px-4 py-3.5 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 rounded-xl text-sm font-bold flex items-center justify-center gap-2">
                    <CheckCircle size={18} /> Slip Gaji Telah Disetujui
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
