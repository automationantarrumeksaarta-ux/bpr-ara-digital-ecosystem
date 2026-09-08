import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import {
  PortfolioSnapshot,
  DailyMovement,
  FundingTarget,
  KasOffice,
  FundingSource,
  CategorySource,
  ProductType,
  UserRole,
  DateFilterPreset,
  SourceGrouped,
  ChangeAnalysisItem,
  SmartInsight,
} from '../types/funding';
import { INITIAL_OFFICES, INITIAL_SOURCES, INITIAL_SNAPSHOTS, INITIAL_DAILY, INITIAL_TARGETS } from '../data/funding/seedData';
import { getDateOffset } from '../utils/funding/formatters';
import { storageService } from '../services/funding/storageService';
import { officeRepository } from '../services/funding/repositories/officeRepository';
import { sourceRepository } from '../services/funding/repositories/sourceRepository';
import { portfolioRepository } from '../services/funding/repositories/portfolioRepository';
import { dailyRepository } from '../services/funding/repositories/dailyRepository';
import { targetRepository } from '../services/funding/repositories/targetRepository';
import { CalculationService } from '../services/funding/calculationService';

interface DataContextType {
  // We keep some of the old structures specifically for backward compatibility with UI
  // Note: the UI used `portfolio` for what is now `snapshots`. We expose active subsets where possible.
  portfolio: any[]; // Using any to avoid breaking UI that expects old structure until UI is updated, but ideally it's the transformed view
  dailyAdditions: DailyMovement[];
  targets: FundingTarget[];
  offices: KasOffice[];
  sources: FundingSource[];
  
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  selectedPreset: DateFilterPreset['value'];
  setSelectedPreset: (preset: DateFilterPreset['value']) => void;
  startDateCustom: string;
  setStartDateCustom: (d: string) => void;
  endDateCustom: string;
  setEndDateCustom: (d: string) => void;
  selectedKasOffice: string;
  setSelectedKasOffice: (kas: string) => void;
  selectedProduct: string;
  setSelectedProduct: (prod: string) => void;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  userRole: UserRole;
  setUserRole: (role: UserRole) => void;
  userOffice: string;
  setUserOffice: (office: string) => void;
  isDarkMode: boolean;
  setIsDarkMode: (dark: boolean | ((prev: boolean) => boolean)) => void;

  getActivePortfolioForDate: (targetDate: string) => any[];
  filteredActivePortfolio: any[];
  filteredPrevPortfolio: any[];
  filteredDailyAdditions: any[];

  kpis: {
    totalNoa: number;
    totalVolume: number;
    tabunganNoa: number;
    tabunganVolume: number;
    depositoNoa: number;
    depositoVolume: number;
    penambahanNoaPeriode: number;
    penambahanVolumePeriode: number;
    prevTotalNoa: number;
    prevTotalVolume: number;
    growthTotalVolumePercent: number;
    growthTotalNoaPercent: number;
    growthTotalVolumeNominal: number;
  };

  groupedSources: SourceGrouped[];
  changeAnalysis: ChangeAnalysisItem[];
  smartInsights: SmartInsight[];

  addPortfolioItem: (item: any) => Promise<void>;
  updatePortfolioItem: (id: string, item: any) => Promise<void>;
  deletePortfolioItem: (id: string) => Promise<void>;
  
  addDailyAddition: (item: any) => Promise<void>;
  deleteDailyAddition: (id: string) => Promise<void>;

  updateTarget: (id: string, target_noa: number, target_volume: number) => Promise<void>;
  addTarget: (target: any) => Promise<void>;

  bulkImportPortfolio: (newItems: any[]) => Promise<void>;
  bulkImportDaily: (newItems: any[]) => Promise<void>;
  
  resetToSeedData: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Raw Data State
  const [snapshots, setSnapshots] = useState<PortfolioSnapshot[]>([]);
  const [movements, setMovements] = useState<DailyMovement[]>([]);
  const [targets, setTargets] = useState<FundingTarget[]>([]);
  const [offices, setOffices] = useState<KasOffice[]>([]);
  const [sources, setSources] = useState<FundingSource[]>([]);

  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    let o = await officeRepository.getAll();
    let s = await sourceRepository.getAll();
    let p = await portfolioRepository.getAll();
    let d = await dailyRepository.getAll();
    let t = await targetRepository.getAll();

    // If completely empty, we assume first run and seed
    if (o.length === 0 && s.length === 0 && p.length === 0) {
      await officeRepository.setAll(INITIAL_OFFICES);
      await sourceRepository.setAll(INITIAL_SOURCES);
      await portfolioRepository.setAll(INITIAL_SNAPSHOTS);
      await dailyRepository.setAll(INITIAL_DAILY);
      await targetRepository.setAll(INITIAL_TARGETS);
      
      o = INITIAL_OFFICES;
      s = INITIAL_SOURCES;
      p = INITIAL_SNAPSHOTS;
      d = INITIAL_DAILY;
      t = INITIAL_TARGETS;
    }

    setOffices(o);
    setSources(s);
    setSnapshots(p);
    setMovements(d);
    setTargets(t);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filters default to 11 Agustus 2026 to showcase full seed growth immediately
  const [selectedDate, setSelectedDate] = useState<string>('2026-08-11');
  const [selectedPreset, setSelectedPreset] = useState<DateFilterPreset['value']>('today');
  const [startDateCustom, setStartDateCustom] = useState<string>('2026-08-01');
  const [endDateCustom, setEndDateCustom] = useState<string>('2026-08-11');

  // We have a mismatch: UI uses office names for filtering "Matesih", but relational uses IDs. 
  // We'll convert "Matesih" to its ID when filtering.
  const [selectedKasOffice, setSelectedKasOffice] = useState<string>('All');
  const [selectedProduct, setSelectedProduct] = useState<string>('All');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [userRole, setUserRole] = useState<UserRole>('Admin');
  const [userOffice, setUserOffice] = useState<string>('Matesih');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);

  // Dark mode disabled - always use light mode
  useEffect(() => {
    document.documentElement.classList.remove('dark');
  }, []);

  // Translate UI names to IDs for calculation service
  const selectedKasOfficeId = useMemo(() => {
    if (selectedKasOffice === 'All') return 'All';
    const o = offices.find(x => x.nama === selectedKasOffice);
    return o ? o.id : 'All';
  }, [selectedKasOffice, offices]);

  const prevDate = useMemo(() => getDateOffset(selectedDate, -1), [selectedDate]);

  // --- CALCULATION DELEGATION (PURE) ---
  const calculated = useMemo(() => {
    if (isLoading) return null;
    return CalculationService.calculateDashboard({
      snapshots,
      movements,
      targets,
      offices,
      sources,
      selectedDate,
      prevDate,
      selectedKasOfficeId,
      selectedProductId: selectedProduct,
      selectedCategoryId: selectedCategory,
      searchQuery,
    });
  }, [isLoading, snapshots, movements, targets, offices, sources, selectedDate, prevDate, selectedKasOfficeId, selectedProduct, selectedCategory, searchQuery]);

  // --- TRANSFORMATION TO OLD UI FORMAT ---
  // The UI expects `item.kantor_kas`, `item.nama_sumber`, `item.kategori_sumber` on Portfolio items.
  const formatForUI = (items: PortfolioSnapshot[]) => {
    return items.map(s => {
      const office = offices.find(o => o.id === s.kantorKasId);
      const source = sources.find(src => src.id === s.sourceId);
      return {
        ...s,
        kantor_kas: office ? office.nama : 'Unknown',
        nama_sumber: source ? source.namaSumber : 'Unknown',
        kategori_sumber: source ? source.kategori : 'Lainnya',
        jadwal: source ? source.jadwal : '-',
      };
    });
  };

  const getActivePortfolioForDate = useCallback((targetDate: string) => {
    const act = CalculationService.getActivePortfolio(snapshots, targetDate);
    return formatForUI(act);
  }, [snapshots, offices, sources]);

  const filteredActivePortfolio = useMemo(() => calculated ? formatForUI(calculated.currentActive) : [], [calculated, offices, sources]);
  const filteredPrevPortfolio = useMemo(() => calculated ? formatForUI(calculated.prevActive) : [], [calculated, offices, sources]);
  
  // Format daily additions for UI
  const filteredDailyAdditions = useMemo(() => {
    // Note: old logic applied full date range filters here depending on preset.
    // For simplicity, we implement a basic date filter matching the old logic.
    let filtered = movements;
    
    if (selectedPreset === 'today') {
      filtered = filtered.filter(item => item.tanggal === selectedDate);
    } else if (selectedPreset === 'yesterday') {
      filtered = filtered.filter(item => item.tanggal === prevDate);
    } else if (selectedPreset === '7days') {
      const minDate = getDateOffset(selectedDate, -6);
      filtered = filtered.filter(item => item.tanggal >= minDate && item.tanggal <= selectedDate);
    } else if (selectedPreset === 'this_month') {
      const currentMonth = selectedDate.substring(0, 7);
      filtered = filtered.filter(item => item.tanggal.startsWith(currentMonth));
    } else if (selectedPreset === 'custom') {
      filtered = filtered.filter(item => item.tanggal >= startDateCustom && item.tanggal <= endDateCustom);
    }

    if (selectedKasOfficeId !== 'All') {
      filtered = filtered.filter(item => item.kantorKasId === selectedKasOfficeId);
    }
    if (selectedProduct !== 'All') {
      filtered = filtered.filter(item => item.produk === selectedProduct);
    }
    
    return filtered.map(m => {
      const office = offices.find(o => o.id === m.kantorKasId);
      const source = sources.find(src => src.id === m.sourceId);
      return {
        ...m,
        kantor_kas: office ? office.nama : 'Unknown',
        nama_sumber: source ? source.namaSumber : 'Unknown',
        noa_baru: m.noaBaru,
        volume_baru: m.volumeBaru,
      };
    });
  }, [movements, selectedPreset, selectedDate, prevDate, startDateCustom, endDateCustom, selectedKasOfficeId, selectedProduct, offices, sources]);

  const resetToSeedData = async () => {
    if (window.confirm("Apakah Anda yakin ingin menghapus seluruh perubahan lokal dan mengembalikan data ke seed awal?")) {
      storageService.resetAppStorage();
      await loadData();
      setSelectedDate('2026-08-11');
      setSelectedKasOffice('All');
      setSelectedProduct('All');
      setSelectedCategory('All');
      setSearchQuery('');
    }
  };

  // CRUD Implementations pointing to Repositories
  const resolveOfficeAndSource = async (kantor_kas: string, nama_sumber: string, kategori: CategorySource) => {
    let office = offices.find(o => o.nama === kantor_kas);
    if (!office) {
      office = await officeRepository.create({ id: `off-${Date.now()}`, nama: kantor_kas, aktif: true });
      setOffices(await officeRepository.getAll());
    }

    let source = sources.find(s => s.namaSumber === nama_sumber && s.kantorKasId === office!.id);
    if (!source) {
      source = await sourceRepository.create({
        id: `src-${Date.now()}`,
        kantorKasId: office.id,
        namaSumber: nama_sumber,
        kategori: kategori,
        aktif: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      setSources(await sourceRepository.getAll());
    }
    return { office, source };
  };

  const addPortfolioItem = async (item: any) => {
    const { office, source } = await resolveOfficeAndSource(item.kantor_kas, item.nama_sumber, item.kategori_sumber || 'Lainnya');
    
    // Check duplicate
    const existing = await portfolioRepository.findByUniqueKey(item.tanggal, office.id, source.id, item.produk);
    
    if (existing) {
      const confirmUpdate = window.confirm("Data snapshot sudah tersedia pada tanggal, kantor, sumber, dan produk ini. Apakah ingin memperbarui data tersebut?");
      if (confirmUpdate) {
        await portfolioRepository.update(existing.id, {
          noa: item.noa,
          volume: item.volume,
          keterangan: item.keterangan
        });
      }
    } else {
      await portfolioRepository.create({
        id: `snp-${Date.now()}`,
        tanggal: item.tanggal,
        kantorKasId: office.id,
        sourceId: source.id,
        produk: item.produk,
        noa: item.noa,
        volume: item.volume,
        keterangan: item.keterangan,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
    setSnapshots(await portfolioRepository.getAll());
  };

  const updatePortfolioItem = async (id: string, item: any) => {
    await portfolioRepository.update(id, item);
    setSnapshots(await portfolioRepository.getAll());
  };

  const deletePortfolioItem = async (id: string) => {
    await portfolioRepository.delete(id);
    setSnapshots(await portfolioRepository.getAll());
  };

  const addDailyAddition = async (item: any) => {
    const { office, source } = await resolveOfficeAndSource(item.kantor_kas, item.nama_sumber, 'Lainnya');
    
    await dailyRepository.create({
      id: `mov-${Date.now()}`,
      tanggal: item.tanggal,
      kantorKasId: office.id,
      sourceId: source.id,
      produk: item.produk,
      noaBaru: item.noa_baru,
      volumeBaru: item.volume_baru,
      keterangan: item.keterangan,
      createdAt: new Date().toISOString()
    });
    
    // PER ATURAN: JANGAN otomatis menambah portfolio snapshot. Daily movement terpisah.
    
    setMovements(await dailyRepository.getAll());
  };

  const deleteDailyAddition = async (id: string) => {
    await dailyRepository.delete(id);
    setMovements(await dailyRepository.getAll());
  };

  const updateTarget = async (id: string, target_noa: number, target_volume: number) => {
    await targetRepository.update(id, { targetNoa: target_noa, targetVolume: target_volume });
    setTargets(await targetRepository.getAll());
  };

  const addTarget = async (target: any) => {
    let office = offices.find(o => o.nama === target.kantor_kas);
    if (office) {
      await targetRepository.create({
        id: `tgt-${Date.now()}`,
        periode: target.periode,
        kantorKasId: office.id,
        produk: target.produk,
        targetNoa: target.target_noa,
        targetVolume: target.target_volume
      });
      setTargets(await targetRepository.getAll());
    }
  };

  const bulkImportPortfolio = async (newItems: any[]) => {
    for (const item of newItems) {
      await addPortfolioItem(item);
    }
  };

  const bulkImportDaily = async (newItems: any[]) => {
    for (const item of newItems) {
      await addDailyAddition(item);
    }
  };

  // Provide fallback empty objects while loading to avoid UI crashes
  const fallbackKpis = {
    totalNoa: 0, totalVolume: 0, tabunganNoa: 0, tabunganVolume: 0, depositoNoa: 0, depositoVolume: 0,
    penambahanNoaPeriode: 0, penambahanVolumePeriode: 0, prevTotalNoa: 0, prevTotalVolume: 0,
    growthTotalVolumePercent: 0, growthTotalNoaPercent: 0, growthTotalVolumeNominal: 0,
  };

  return (
    <DataContext.Provider
      value={{
        portfolio: formatForUI(snapshots),
        dailyAdditions: filteredDailyAdditions as any, // satisfy UI types
        targets,
        offices,
        sources,
        selectedDate,
        setSelectedDate,
        selectedPreset,
        setSelectedPreset,
        startDateCustom,
        setStartDateCustom,
        endDateCustom,
        setEndDateCustom,
        selectedKasOffice,
        setSelectedKasOffice,
        selectedProduct,
        setSelectedProduct,
        selectedCategory,
        setSelectedCategory,
        searchQuery,
        setSearchQuery,
        userRole,
        setUserRole,
        userOffice,
        setUserOffice,
        isDarkMode,
        setIsDarkMode,
        getActivePortfolioForDate,
        filteredActivePortfolio,
        filteredPrevPortfolio,
        filteredDailyAdditions,
        kpis: calculated?.kpis || fallbackKpis,
        groupedSources: calculated?.groupedSources || [],
        changeAnalysis: calculated?.changeAnalysis || [],
        smartInsights: calculated?.smartInsights || [],
        addPortfolioItem,
        updatePortfolioItem,
        deletePortfolioItem,
        addDailyAddition,
        deleteDailyAddition,
        updateTarget,
        addTarget,
        bulkImportPortfolio,
        bulkImportDaily,
        resetToSeedData,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
