import React from 'react';
import { useData } from '../../../context/FundingContext';
import { AlertCircle, CheckCircle2, AlertTriangle, Lightbulb, Info } from 'lucide-react';

export const SmartInsightsSection: React.FC = () => {
  const { smartInsights } = useData();

  if (!smartInsights || smartInsights.length === 0) return null;

  return (
    <section className="glass-effect rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-xs">
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100 dark:border-slate-800">
        <Lightbulb className="w-4 h-4 text-amber-500" />
        <h3 className="font-bold text-slate-900 dark:text-white text-sm">
          Sistem Insight & Alert Otomatis
        </h3>
        <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
          Real-time Data Rule Engine
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {smartInsights.map((insight) => {
          let bg = 'bg-blue-50/80 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900/50 text-blue-900 dark:text-blue-200';
          let icon = <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />;
          let badge = '🟢';

          if (insight.type === 'success') {
            bg = 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/50 text-emerald-900 dark:text-emerald-200';
            icon = <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />;
            badge = '🟢';
          } else if (insight.type === 'warning') {
            bg = 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/50 text-amber-900 dark:text-amber-200';
            icon = <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />;
            badge = '🟡';
          } else if (insight.type === 'danger') {
            bg = 'bg-rose-50/80 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/50 text-rose-900 dark:text-rose-200';
            icon = <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 flex-shrink-0" />;
            badge = '🔴';
          }

          return (
            <div
              key={insight.id}
              className={`p-3 rounded-xl border flex items-start gap-2.5 transition-all ${bg}`}
            >
              <span className="text-base leading-none">{badge}</span>
              <div className="text-xs">
                <h4 className="font-bold leading-tight mb-0.5">{insight.title}</h4>
                <p className="opacity-90 leading-relaxed text-[11px]">{insight.message}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
