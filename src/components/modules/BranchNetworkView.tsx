import React from 'react';
import { Building2, MapPin } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PageContainer, PageHeader, Card, CardContent, CardFooter, Badge, Button } from '../ui';

export const BranchNetworkView: React.FC = () => {
  const { branches, setSelectedBranchId, selectedBranchId, setActiveModule } = useApp();

  return (
    <PageContainer>
      <PageHeader
        title="Jaringan Kantor & Kinerja Cabang BPR ARA"
        description="Monitoring konsolidasi portofolio kredit, penghimpunan DPK, rasio NPL cabang, dan likuiditas kas operasional."
        badge="MULTI-BRANCH OPERATING NETWORK"
        badgeVariant="info"
        actions={
          <Badge variant="success">5 Kantor Cabang & Kas</Badge>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {branches.map((br) => {
          const isSelected = selectedBranchId === br.id;
          return (
            <Card
              key={br.id}
              variant={isSelected ? "interactive" : "default"}
              className={isSelected ? "bg-blue-50/50 dark:bg-blue-900/20 border-blue-500 ring-2 ring-blue-500/20" : ""}
            >
              <CardContent className="pt-5">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 font-mono font-semibold">
                      <Building2 className="w-4 h-4" /> {br.code}
                    </div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1">{br.name}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-red-500" /> {br.city}
                    </p>
                  </div>
                  <Badge variant={br.status === 'Aktif' ? 'success' : 'neutral'}>
                    {br.status}
                  </Badge>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Kepala Cabang</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{br.branchManager}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Penyaluran Kredit</span>
                    <span className="font-mono font-bold text-emerald-700 dark:text-emerald-500">
                      Rp {(br.totalLending / 1000000000).toFixed(1)} Miliar
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Penghimpunan DPK</span>
                    <span className="font-mono font-bold text-blue-700 dark:text-blue-500">
                      Rp {(br.totalFunding / 1000000000).toFixed(1)} Miliar
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Rasio NPL Cabang</span>
                    <span
                      className={`font-mono font-bold ${
                        br.nplPercentage <= 2.5 ? 'text-emerald-700 dark:text-emerald-500' : 'text-amber-700 dark:text-amber-500'
                      }`}
                    >
                      {br.nplPercentage}%
                    </span>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="pt-3 border-t border-slate-100 dark:border-slate-800">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold flex items-center gap-1 p-0 h-auto"
                  onClick={() => {
                    setSelectedBranchId(br.id);
                    setActiveModule('DISBURSEMENT_PORTFOLIO');
                  }}
                >
                  Filter Portofolio Cabang Ini &rarr;
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </PageContainer>
  );
};
