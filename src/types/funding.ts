export type KasOfficeName = 'Kantor Pusat' | 'Matesih' | 'Jumapolo' | 'Klodran' | string;

export type CategorySource = 'Pasar' | 'PKK' | 'Pedagang' | 'Komunitas' | 'Sekolah' | 'Desa / RW' | 'Lainnya';

export type ProductType = 'Tabungan' | 'Deposito';

export type UserRole = 'Admin' | 'Kepala Kantor' | 'Management';

export interface KasOffice {
  id: string;
  nama: string;
  kode?: string;
  aktif: boolean;
}

export interface FundingSource {
  id: string;
  kantorKasId: string;
  namaSumber: string;
  kategori: CategorySource;
  jadwal?: string;
  aktif: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PortfolioSnapshot {
  id: string;
  tanggal: string; // YYYY-MM-DD
  kantorKasId: string;
  sourceId: string;
  produk: ProductType;
  noa: number;
  volume: number; // raw numeric nominal in IDR
  keterangan?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DailyMovement {
  id: string;
  tanggal: string; // YYYY-MM-DD
  kantorKasId: string;
  sourceId: string;
  produk: ProductType;
  noaBaru: number;
  volumeBaru: number; // raw numeric nominal
  keterangan?: string;
  createdAt: string;
}

export interface FundingTarget {
  id: string;
  periode: string; // e.g., '2026-08'
  kantorKasId: string;
  produk: ProductType | 'Total';
  targetNoa: number;
  targetVolume: number;
}

export interface DateFilterPreset {
  label: string;
  value: 'today' | 'yesterday' | '7days' | 'this_month' | 'last_month' | 'custom';
  startDate?: string;
  endDate?: string;
}

export interface SourceGrouped {
  nama_sumber: string;
  kantor_kas: string;
  kategori: string;
  jadwal?: string;
  tabungan_noa: number;
  tabungan_volume: number;
  deposito_noa: number;
  deposito_volume: number;
  total_noa: number;
  total_volume: number;
  growth_volume: number;
  growth_percent: number;
  prev_total_volume: number;
}

export interface ChangeAnalysisItem {
  nama_sumber: string;
  kantor_kas: string;
  produk: string;
  nominal_change: number;
  percent_change: number;
  type: 'increase' | 'decrease' | 'unchanged';
  current_volume: number;
  prev_volume: number;
}

export interface SmartInsight {
  id: string;
  type: 'success' | 'warning' | 'danger' | 'info';
  kantor_kas?: string;
  title: string;
  message: string;
}
