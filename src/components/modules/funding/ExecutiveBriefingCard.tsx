import React from 'react';
import { useData } from '../../../context/FundingContext';
import { formatRupiah, formatCompactRupiah } from '../../../utils/funding/formatters';
import { ShieldCheck, TrendingUp, PiggyBank, Building2, CheckCircle2, AlertCircle, ArrowUpRight } from 'lucide-react';

export const ExecutiveBriefingCard: React.FC = () => {
  const { kpis, targets } = useData();

  const totalTarget = targets
    .filter((t) => t.produk === 'Total')
    .reduce((sum, t) => sum + t.target_volume, 0);

  const targetAchievedPct = totalTarget > 0 ? (kpis.totalVolume / totalTarget) * 100 : 0;
  const tabunganPct = kpis.totalVolume > 0 ? (kpis.tabunganVolume / kpis.totalVolume) * 100 : 0;
  const depositoPct = kpis.totalVolume > 0 ? (kpis.depositoVolume / kpis.totalVolume) * 100 : 0;

  return (
    <div className="bg-surface text-foreground rounded-2xl p-5 md:p-6 shadow-md border border-border space-y-5">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-primary-light/50 text-primary border border-primary/20">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold tracking-tight text-foreground">
                Briefing Eksekutif Direksi
              </h2>
              <span className="px-2 py-0.5 bg-primary-light text-primary border border-primary/30 text-[10px] font-mono font-bold rounded-full">
                Sangat Rapi & Ringkas
              </span>
            </div>
            <p className="text-xs text-muted">
              Ringkasan 60 detik kinerja DPK BPR Antar Rumeksa Arta
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-muted">
          <span className="w-2 h-2 rounded-full bg-success animate-pulse"></span>
          <span>Status BPR: <strong className="text-success font-bold">Sehat & Tumbuh</strong></span>
        </div>
      </div>

      {/* 3 Executive Takeaways */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Point 1 */}
        <div className="p-4 rounded-xl bg-background border border-border shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs text-muted font-medium">
            <span className="flex items-center gap-1.5 font-bold text-foreground">
              <TrendingUp className="w-3.5 h-3.5 text-success" />
              1. Total DPK & Pertumbuhan
            </span>
            <span className="text-[10px] text-success font-bold bg-success/10 px-1.5 py-0.5 rounded border border-success/20">
              +{kpis.growthTotalVolumePercent.toFixed(1)}%
            </span>
          </div>
          <div className="text-xl font-black text-foreground">
            {formatRupiah(kpis.totalVolume)}
          </div>
          <p className="text-[11px] text-muted leading-snug">
            Tercatat <strong className="text-foreground">0 NOA</strong> aktif. Tumbuh bersih <strong className="text-success">+{formatCompactRupiah(kpis.growthTotalVolumeNominal)}</strong> dari posisi sebelumnya.
          </p>
        </div>

        {/* Point 2 */}
        <div className="p-4 rounded-xl bg-background border border-border shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs text-muted font-medium">
            <span className="flex items-center gap-1.5 font-bold text-foreground">
              <PiggyBank className="w-3.5 h-3.5 text-primary" />
              2. Kualitas Dana (CoF)
            </span>
            <span className="text-[10px] text-primary font-bold bg-primary-light px-1.5 py-0.5 rounded border border-primary/20">
              {tabunganPct.toFixed(0)}% CASA
            </span>
          </div>
          <div className="text-xl font-black text-primary">
            {formatCompactRupiah(kpis.tabunganVolume)} <span className="text-xs text-muted font-normal">Tabungan</span>
          </div>
          <p className="text-[11px] text-muted leading-snug">
            Dominasi Dana Murah (<strong className="text-primary">{tabunganPct.toFixed(1)}%</strong> Tabungan vs <strong className="text-muted">{depositoPct.toFixed(1)}%</strong> Deposito) efektif menekan Beban Bunga BPR.
          </p>
        </div>

        {/* Point 3 */}
        <div className="p-4 rounded-xl bg-background border border-border shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs text-muted font-medium">
            <span className="flex items-center gap-1.5 font-bold text-foreground">
              <Building2 className="w-3.5 h-3.5 text-warning" />
              3. Cabang Pemimpin & Target
            </span>
            <span className="text-[10px] text-warning font-bold bg-warning/10 px-1.5 py-0.5 rounded border border-warning/20">
              {targetAchievedPct.toFixed(1)}% Target
            </span>
          </div>
          <div className="text-xl font-black text-warning">
            KK Matesih <span className="text-xs text-muted font-normal">(100% Porsi)</span>
          </div>
          <p className="text-[11px] text-muted leading-snug">
            Matesih capai <strong className="text-warning">75,8%</strong> target bulanan. 3 KK lainnya (Klodran, Jumapolo, Pusat) perlu percepatan aktivitas.
          </p>
        </div>
      </div>

      {/* CASA vs Deposito Visual Ratio Bar */}
      <div className="pt-3 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-muted font-medium">Rasio DPK BPR:</span>
          <span className="font-bold text-primary">Tabungan ({tabunganPct.toFixed(1)}%)</span>
          <span className="text-slate-300">•</span>
          <span className="font-bold text-slate-500">Deposito ({depositoPct.toFixed(1)}%)</span>
        </div>

        <div className="w-full sm:w-64 h-2.5 bg-surface-muted rounded-full overflow-hidden flex shadow-inner">
          <div className="h-full bg-primary" style={{ width: `${tabunganPct}%` }} title="Tabungan" />
          <div className="h-full bg-slate-400" style={{ width: `${depositoPct}%` }} title="Deposito" />
        </div>
      </div>
    </div>
  );
};
