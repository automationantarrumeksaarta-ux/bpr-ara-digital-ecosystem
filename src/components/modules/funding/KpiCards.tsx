import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Users,
  PiggyBank,
  Vault,
  PlusCircle,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from 'lucide-react';
import { useData } from '../../../context/FundingContext';
import { formatRupiah, formatCompactRupiah, formatDateIndo } from '../../../utils/funding/formatters';

import { MetricCard } from '../../ui/MetricCard';

export const KpiCards: React.FC = () => {
  const { kpis, selectedDate } = useData();

  const cards = [
    {
      id: 'kpi-total-volume',
      title: 'Total Volume',
      subtitle: 'Tabungan + Deposito',
      value: formatRupiah(kpis.totalVolume),
      icon: Wallet,
      trendPercent: kpis.growthTotalVolumePercent,
      prevComparison: `Dibanding posisi sebelumnya (${formatCompactRupiah(kpis.prevTotalVolume)})`,
      isPrimary: true,
    },
    {
      id: 'kpi-total-noa',
      title: 'Total NOA',
      subtitle: 'Rekening Aktif',
      value: `${kpis.totalNoa.toLocaleString('id-ID')} NOA`,
      icon: Users,
      trendPercent: kpis.growthTotalNoaPercent,
      prevComparison: `Dibanding posisi sebelumnya (${kpis.prevTotalNoa} NOA)`,
    },
    {
      id: 'kpi-volume-tabungan',
      title: 'Volume Tabungan (CASA)',
      subtitle: 'Tabungan Pasar & PKK',
      value: formatRupiah(kpis.tabunganVolume),
      icon: PiggyBank,
      trendPercent: kpis.growthTotalVolumePercent,
      prevComparison: 'Total Tabungan Berjalan',
    },
    {
      id: 'kpi-noa-tabungan',
      title: 'NOA Tabungan',
      subtitle: 'Jumlah Rekening Tabungan',
      value: `${kpis.tabunganNoa.toLocaleString('id-ID')} NOA`,
      icon: Users,
      trendPercent: 0,
      prevComparison: 'Porsi terbesar dari pasar',
    },
    {
      id: 'kpi-volume-deposito',
      title: 'Volume Deposito',
      subtitle: 'Simpanan Berjangka',
      value: formatRupiah(kpis.depositoVolume),
      icon: Vault,
      trendPercent: 0,
      prevComparison: 'Stabil pada periode berjalan',
    },
    {
      id: 'kpi-noa-deposito',
      title: 'NOA Deposito',
      subtitle: 'Bilyet Deposito',
      value: `${kpis.depositoNoa.toLocaleString('id-ID')} NOA`,
      icon: Vault,
      trendPercent: 0,
      prevComparison: 'Akun Deposito',
    },
    {
      id: 'kpi-penambahan-volume',
      title: 'Penambahan Volume Periode',
      subtitle: `Catatan Harian ${formatDateIndo(selectedDate)}`,
      value: formatRupiah(kpis.penambahanVolumePeriode),
      icon: PlusCircle,
      trendPercent: kpis.penambahanVolumePeriode > 0 ? 100 : 0,
      prevComparison: kpis.penambahanVolumePeriode > 0 ? 'Tercatat pertumbuhan baru' : 'Belum ada input baru',
    },
    {
      id: 'kpi-penambahan-noa',
      title: 'Penambahan NOA Periode',
      subtitle: `Rekening Baru ${formatDateIndo(selectedDate)}`,
      value: `+${kpis.penambahanNoaPeriode} NOA`,
      icon: PlusCircle,
      trendPercent: kpis.penambahanNoaPeriode > 0 ? 100 : 0,
      prevComparison: 'Penambahan NOA Baru',
    },
  ];

  const getTrendDirection = (percent: number) => {
    if (percent > 0) return 'up';
    if (percent < 0) return 'down';
    return 'neutral';
  };

  const getTrendText = (percent: number) => {
    if (percent > 0) return `+${percent.toFixed(1)}%`;
    if (percent < 0) return `${percent.toFixed(1)}%`;
    return '0%';
  };

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
          Ringkasan Indikator Kinerja Utama (KPI)
        </h2>
        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
          Dihitung otomatis dari database
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {cards.map((card) => (
          <MetricCard
            key={card.id}
            id={card.id}
            label={card.title}
            value={card.value}
            icon={card.icon}
            trend={card.trendPercent !== 0 ? getTrendText(card.trendPercent) : undefined}
            trendDirection={getTrendDirection(card.trendPercent)}
            description={card.prevComparison}
            variant={card.isPrimary ? 'primary' : 'default'}
          />
        ))}
      </div>
    </section>
  );
};
