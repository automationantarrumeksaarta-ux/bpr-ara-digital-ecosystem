import React from 'react';
import { Target } from 'lucide-react';
import { Card } from '../ui/Card';

export const CrmFunnel: React.FC = () => {
  return (
    <Card className="p-6 space-y-4">
      <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2 mb-4">
        <Target size={18} /> Funnel Konversi Prospek CRM (Sales Pipeline)
      </h3>
      
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
        <div className="bg-slate-50 dark:bg-slate-900/50 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 text-center space-y-1 hover:border-blue-500/50 transition-colors cursor-default">
          <span className="text-[10px] font-black text-slate-500 dark:text-slate-400">1. PROSPEK BARU</span>
          <h4 className="text-lg font-black text-slate-900 dark:text-white">0 Lead</h4>
          <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mt-2">
            <div className="h-full w-[0%] bg-blue-400" />
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-900/50 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 text-center space-y-1 hover:border-blue-500/50 transition-colors cursor-default">
          <span className="text-[10px] font-black text-slate-500 dark:text-slate-400">2. TERHUBUNG</span>
          <h4 className="text-lg font-black text-slate-900 dark:text-white">0 Lead</h4>
          <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mt-2">
            <div className="h-full w-[0%] bg-blue-500" />
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-900/50 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 text-center space-y-1 hover:border-blue-500/50 transition-colors cursor-default">
          <span className="text-[10px] font-black text-slate-500 dark:text-slate-400">3. FOLLOW UP</span>
          <h4 className="text-lg font-black text-slate-900 dark:text-white">0 Lead</h4>
          <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mt-2">
            <div className="h-full w-[0%] bg-blue-600" />
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-900/50 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 text-center space-y-1 hover:border-blue-500/50 transition-colors cursor-default">
          <span className="text-[10px] font-black text-slate-500 dark:text-slate-400">4. BERKAS MASUK</span>
          <h4 className="text-lg font-black text-slate-900 dark:text-white">0 Lead</h4>
          <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mt-2">
            <div className="h-full w-[0%] bg-emerald-500" />
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-900/50 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 text-center space-y-1 hover:border-blue-500/50 transition-colors cursor-default">
          <span className="text-[10px] font-black text-slate-500 dark:text-slate-400">5. DEAL / AKAD</span>
          <h4 className="text-lg font-black text-slate-900 dark:text-white">0 Lead</h4>
          <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mt-2">
            <div className="h-full w-[0%] bg-emerald-600" />
          </div>
        </div>
      </div>
    </Card>
  );
};
