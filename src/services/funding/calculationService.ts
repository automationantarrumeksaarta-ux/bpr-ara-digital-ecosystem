import {
  PortfolioSnapshot,
  DailyMovement,
  FundingTarget,
  KasOffice,
  FundingSource,
  SourceGrouped,
  ChangeAnalysisItem,
  SmartInsight,
} from '../../types/funding';
import { calculateGrowthPercent, getDateOffset } from '../../utils/funding/formatters';

interface CalculationParams {
  snapshots: PortfolioSnapshot[];
  movements: DailyMovement[];
  targets: FundingTarget[];
  offices: KasOffice[];
  sources: FundingSource[];
  selectedDate: string; // YYYY-MM-DD
  prevDate: string; // YYYY-MM-DD
  selectedKasOfficeId: string; // 'All' or office id
  selectedProductId: string; // 'All' or ProductType
  selectedCategoryId: string; // 'All' or CategorySource
  searchQuery: string;
}

export class CalculationService {
  /**
   * Helper: Get active portfolio for a specific date.
   * "Active" means the latest snapshot on or before the targetDate for each unique (office + source + product).
   */
  static getActivePortfolio(snapshots: PortfolioSnapshot[], targetDate: string): PortfolioSnapshot[] {
    const latestMap = new Map<string, PortfolioSnapshot>();

    // Sort by date ascending
    const eligibleRecords = snapshots
      .filter((item) => item.tanggal <= targetDate)
      .sort((a, b) => a.tanggal.localeCompare(b.tanggal) || a.createdAt.localeCompare(b.createdAt));

    eligibleRecords.forEach((item) => {
      const key = `${item.kantorKasId}||${item.sourceId}||${item.produk}`;
      latestMap.set(key, item);
    });

    return Array.from(latestMap.values());
  }

  /**
   * Filter items based on UI filters.
   */
  static applyFilters(
    activePortfolio: PortfolioSnapshot[],
    sources: FundingSource[],
    offices: KasOffice[],
    params: CalculationParams
  ): PortfolioSnapshot[] {
    const { selectedKasOfficeId, selectedProductId, selectedCategoryId, searchQuery } = params;
    return activePortfolio.filter((item) => {
      const source = sources.find((s) => s.id === item.sourceId);
      const office = offices.find((o) => o.id === item.kantorKasId);

      if (!source || !office) return false;

      if (selectedKasOfficeId !== 'All' && item.kantorKasId !== selectedKasOfficeId) return false;
      if (selectedProductId !== 'All' && item.produk !== selectedProductId) return false;
      if (selectedCategoryId !== 'All' && source.kategori !== selectedCategoryId) return false;

      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const matchSource = source.namaSumber.toLowerCase().includes(q);
        const matchOffice = office.nama.toLowerCase().includes(q);
        const matchCat = source.kategori.toLowerCase().includes(q);
        if (!matchSource && !matchOffice && !matchCat) return false;
      }

      return true;
    });
  }

  static calculateDashboard(params: CalculationParams) {
    const { snapshots, movements, targets, sources, offices, selectedDate, prevDate } = params;

    const currentActive = this.getActivePortfolio(snapshots, selectedDate);
    const prevActive = this.getActivePortfolio(snapshots, prevDate);

    const filteredCurrent = this.applyFilters(currentActive, sources, offices, params);
    const filteredPrev = this.applyFilters(prevActive, sources, offices, params);

    // Calculate KPIs
    let tabunganNoa = 0;
    let tabunganVolume = 0;
    let depositoNoa = 0;
    let depositoVolume = 0;

    filteredCurrent.forEach((item) => {
      if (item.produk === 'Tabungan') {
        tabunganNoa += item.noa;
        tabunganVolume += item.volume;
      } else if (item.produk === 'Deposito') {
        depositoNoa += item.noa;
        depositoVolume += item.volume;
      }
    });

    const totalNoa = tabunganNoa + depositoNoa;
    const totalVolume = tabunganVolume + depositoVolume;

    let prevTotalNoa = 0;
    let prevTotalVolume = 0;
    filteredPrev.forEach((item) => {
      prevTotalNoa += item.noa;
      prevTotalVolume += item.volume;
    });

    const growthTotalVolumeNominal = totalVolume - prevTotalVolume;
    const growthTotalVolumePercent = calculateGrowthPercent(totalVolume, prevTotalVolume);
    const growthTotalNoaPercent = calculateGrowthPercent(totalNoa, prevTotalNoa);

    // Calculate Daily Addition for selected date
    let penambahanNoaPeriode = 0;
    let penambahanVolumePeriode = 0;
    
    // We filter movements just by the selectedDate (or whatever logic was used before)
    // To match the prompt's request, we just sum up the movements on selectedDate that match filters.
    movements
      .filter((m) => m.tanggal === selectedDate)
      .filter((m) => {
        if (params.selectedKasOfficeId !== 'All' && m.kantorKasId !== params.selectedKasOfficeId) return false;
        if (params.selectedProductId !== 'All' && m.produk !== params.selectedProductId) return false;
        return true;
      })
      .forEach((m) => {
        penambahanNoaPeriode += m.noaBaru;
        penambahanVolumePeriode += m.volumeBaru;
      });

    // Calculate Grouped Sources
    const map = new Map<string, SourceGrouped>();

    filteredCurrent.forEach((item) => {
      const source = sources.find((s) => s.id === item.sourceId);
      const office = offices.find((o) => o.id === item.kantorKasId);
      if (!source || !office) return;

      const key = `${item.kantorKasId}||${item.sourceId}`;
      let entry = map.get(key);
      if (!entry) {
        entry = {
          nama_sumber: source.namaSumber,
          kantor_kas: office.nama, // using nama to map back to UI format
          kategori: source.kategori,
          jadwal: source.jadwal || '-',
          tabungan_noa: 0,
          tabungan_volume: 0,
          deposito_noa: 0,
          deposito_volume: 0,
          total_noa: 0,
          total_volume: 0,
          growth_volume: 0,
          growth_percent: 0,
          prev_total_volume: 0,
        };
        map.set(key, entry);
      }

      if (item.produk === 'Tabungan') {
        entry.tabungan_noa += item.noa;
        entry.tabungan_volume += item.volume;
      } else {
        entry.deposito_noa += item.noa;
        entry.deposito_volume += item.volume;
      }
      entry.total_noa = entry.tabungan_noa + entry.deposito_noa;
      entry.total_volume = entry.tabungan_volume + entry.deposito_volume;
    });

    filteredPrev.forEach((item) => {
      const key = `${item.kantorKasId}||${item.sourceId}`;
      const entry = map.get(key);
      if (entry) {
        entry.prev_total_volume += item.volume;
      }
    });

    map.forEach((entry) => {
      entry.growth_volume = entry.total_volume - entry.prev_total_volume;
      entry.growth_percent = calculateGrowthPercent(entry.total_volume, entry.prev_total_volume);
    });

    const groupedSources = Array.from(map.values()).sort((a, b) => b.total_volume - a.total_volume);

    // Calculate Change Analysis
    const changeAnalysis: ChangeAnalysisItem[] = [];
    const currentMap = new Map<string, PortfolioSnapshot>();
    filteredCurrent.forEach((item) => currentMap.set(`${item.kantorKasId}||${item.sourceId}||${item.produk}`, item));
    const prevMap = new Map<string, PortfolioSnapshot>();
    filteredPrev.forEach((item) => prevMap.set(`${item.kantorKasId}||${item.sourceId}||${item.produk}`, item));

    const allKeys = new Set([...currentMap.keys(), ...prevMap.keys()]);
    allKeys.forEach((key) => {
      const curr = currentMap.get(key);
      const prev = prevMap.get(key);
      const currVol = curr ? curr.volume : 0;
      const prevVol = prev ? prev.volume : 0;
      const diff = currVol - prevVol;

      if (diff !== 0) {
        const itemInfo = curr || prev!;
        const source = sources.find((s) => s.id === itemInfo.sourceId);
        const office = offices.find((o) => o.id === itemInfo.kantorKasId);

        if (source && office) {
          changeAnalysis.push({
            nama_sumber: source.namaSumber,
            kantor_kas: office.nama,
            produk: itemInfo.produk,
            nominal_change: diff,
            percent_change: calculateGrowthPercent(currVol, prevVol),
            type: diff > 0 ? 'increase' : 'decrease',
            current_volume: currVol,
            prev_volume: prevVol,
          });
        }
      }
    });
    changeAnalysis.sort((a, b) => Math.abs(b.nominal_change) - Math.abs(a.nominal_change));

    // Smart Insights
    const smartInsights: SmartInsight[] = [];
    // Just map a basic insight logic based on raw volumes for the target
    targets.forEach((tgt) => {
      if (tgt.produk === 'Total') {
        const currVol = currentActive
          .filter((i) => i.kantorKasId === tgt.kantorKasId)
          .reduce((sum, i) => sum + i.volume, 0);

        const achievePct = (currVol / tgt.targetVolume) * 100;
        const office = offices.find(o => o.id === tgt.kantorKasId);
        if (achievePct < 50 && office) {
          smartInsights.push({
            id: `ins-tgt-${tgt.kantorKasId}`,
            type: 'danger',
            kantor_kas: office.nama,
            title: `Capaian Target Low - ${office.nama}`,
            message: `Pencapaian target volume Kantor Kas ${office.nama} baru mencapai ${achievePct.toFixed(1)}% dari target Rp ${(tgt.targetVolume / 1000000).toFixed(0)} Jt.`,
          });
        }
      }
    });

    return {
      kpis: {
        totalNoa,
        totalVolume,
        tabunganNoa,
        tabunganVolume,
        depositoNoa,
        depositoVolume,
        penambahanNoaPeriode,
        penambahanVolumePeriode,
        prevTotalNoa,
        prevTotalVolume,
        growthTotalVolumePercent,
        growthTotalNoaPercent,
        growthTotalVolumeNominal,
      },
      groupedSources,
      changeAnalysis,
      smartInsights,
      currentActive, // Exported to map back into components if needed
      prevActive,
    };
  }
}
