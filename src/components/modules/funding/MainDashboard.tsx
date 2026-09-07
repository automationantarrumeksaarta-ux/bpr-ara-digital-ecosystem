import React, { useState } from 'react';
import { KpiCards } from './KpiCards';
import { ChartsSection } from './ChartsSection';
import { OfficeRankingTable } from './OfficeRankingTable';
import { TopPerformers } from './TopPerformers';
import { HistoricalComparison } from './HistoricalComparison';
import { SmartInsightsSection } from './SmartInsightsSection';
import { SourceBreakdownTable } from './SourceBreakdownTable';
import { ExecutiveBriefingCard } from './ExecutiveBriefingCard';
import { Shield, LayoutGrid, Eye } from 'lucide-react';
import { Card } from '../../ui/Card';

interface MainDashboardProps {
  onSelectOffice: (officeName: string) => void;
}

export const MainDashboard: React.FC<MainDashboardProps> = ({ onSelectOffice }) => {
  const [viewMode, setViewMode] = useState<'direksi' | 'operasional'>('direksi');

  return (
    <div className="space-y-6 pb-12">
      {/* Mode View Switcher Bar */}
      <Card className="p-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span className="text-xs font-bold text-slate-900 dark:text-white">Tampilan Dashboard:</span>
          <span className="text-[11px] text-slate-500 hidden md:inline">
            {viewMode === 'direksi' ? 'Mode Direksi (Ultra Rapi & Ringkas)' : 'Mode Operasional (Detail Data Lengkap)'}
          </span>
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
          <button
            onClick={() => setViewMode('direksi')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'direksi'
                ? 'bg-slate-900 text-white dark:bg-emerald-600 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Mode Direksi (Ringkas)</span>
          </button>

          <button
            onClick={() => setViewMode('operasional')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'operasional'
                ? 'bg-slate-900 text-white dark:bg-emerald-600 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Detail Operasional</span>
          </button>
        </div>
      </Card>

      {/* Render based on viewMode */}
      {viewMode === 'direksi' ? (
        <>
          {/* Executive Briefing Card (60 Second Executive Brief) */}
          <ExecutiveBriefingCard />

          {/* Clean 4-Core KPI Cards */}
          <KpiCards />

          {/* Clean Office Ranking Performance Table */}
          <OfficeRankingTable onSelectOffice={onSelectOffice} />

          {/* Automated Smart Insights & Alerts */}
          <SmartInsightsSection />
        </>
      ) : (
        <>
          {/* Automated Smart Insights & Alerts */}
          <SmartInsightsSection />

          {/* KPI Cards Grid */}
          <KpiCards />

          {/* Recharts Analytics Section */}
          <ChartsSection />

          {/* Historical Comparison & "Apa yang berubah?" */}
          <HistoricalComparison />

          {/* Office Ranking Performance Table */}
          <OfficeRankingTable onSelectOffice={onSelectOffice} />

          {/* Top Performers Grid */}
          <TopPerformers />

          {/* Source Breakdown Table */}
          <SourceBreakdownTable />
        </>
      )}
    </div>
  );
};

