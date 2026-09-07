import { KasOffice, FundingSource, PortfolioSnapshot, DailyMovement, FundingTarget, CategorySource } from '../../types/funding';
import { RAW_FUNDING_DATA, RAW_DAILY_MOVEMENT_DATA } from './sampleRawData';

// Helper to generate a consistent ID
const generateId = (prefix: string, str: string) => {
  const hash = str.toLowerCase().replace(/[^a-z0-9]/g, '');
  return `${prefix}-${hash}`;
};

// 1. Transform Offices
const officeSet = new Set<string>();
RAW_FUNDING_DATA.forEach(d => officeSet.add(d.kantor_kas));
export const INITIAL_OFFICES: KasOffice[] = Array.from(officeSet).map(nama => ({
  id: generateId('off', nama),
  nama,
  aktif: true
}));

// 2. Transform Sources
const sourceMap = new Map<string, FundingSource>();
RAW_FUNDING_DATA.forEach(d => {
  const office = INITIAL_OFFICES.find(o => o.nama === d.kantor_kas);
  if (office) {
    const key = `${office.id}-${d.portofolio}`;
    if (!sourceMap.has(key)) {
      sourceMap.set(key, {
        id: generateId('src', `${office.nama}-${d.portofolio}`),
        kantorKasId: office.id,
        namaSumber: d.portofolio,
        kategori: (d.jenis === 'Tabungan' || d.jenis === 'Deposito' ? 'Pasar' : d.jenis) as CategorySource,
        aktif: true,
        jadwal: d.jadwal || undefined,
        createdAt: '2026-08-01T00:00:00Z',
        updatedAt: '2026-08-01T00:00:00Z'
      });
    }
  }
});
export const INITIAL_SOURCES: FundingSource[] = Array.from(sourceMap.values());

// 3. Transform Snapshots
const snapshotList: PortfolioSnapshot[] = [];
RAW_FUNDING_DATA.forEach((d, idx) => {
  const office = INITIAL_OFFICES.find(o => o.nama === d.kantor_kas);
  if (office) {
    const source = INITIAL_SOURCES.find(s => s.namaSumber === d.portofolio && s.kantorKasId === office.id);
    if (source && d.noa !== null && d.volume !== null) {
      snapshotList.push({
        id: `snp-${d.tanggal}-${idx}`,
        tanggal: d.tanggal,
        kantorKasId: office.id,
        sourceId: source.id,
        // The raw data uses Tabungan/Deposito as "jenis", but for Komunitas it uses "Komunitas". 
        // We map "Komunitas" to "Tabungan" as default product, or if it says Tabungan/Deposito we use that.
        produk: (d.jenis === 'Deposito' ? 'Deposito' : 'Tabungan') as 'Tabungan' | 'Deposito',
        noa: d.noa,
        volume: d.volume,
        createdAt: `${d.tanggal}T08:00:00Z`,
        updatedAt: `${d.tanggal}T08:00:00Z`
      });
    }
  }
});
export const INITIAL_SNAPSHOTS: PortfolioSnapshot[] = [];

// 4. Transform Daily Movements
const dailyList: DailyMovement[] = [];
RAW_DAILY_MOVEMENT_DATA.forEach((d, idx) => {
  const office = INITIAL_OFFICES.find(o => o.nama === d.kantor_kas);
  if (office) {
    dailyList.push({
      id: `mov-${d.tanggal}-${idx}`,
      tanggal: d.tanggal,
      kantorKasId: office.id,
      sourceId: INITIAL_SOURCES.find(s => s.kantorKasId === office.id)?.id || `src-unknown`,
      produk: 'Tabungan',
      noaBaru: d.noa_baru,
      volumeBaru: d.volume_baru,
      keterangan: 'Penambahan Harian',
      createdAt: `${d.tanggal}T10:00:00Z`
    });
  }
});
export const INITIAL_DAILY: DailyMovement[] = [];

// 5. Targets (Dummy defaults as no raw data for targets was provided)
export const INITIAL_TARGETS: FundingTarget[] = [];
