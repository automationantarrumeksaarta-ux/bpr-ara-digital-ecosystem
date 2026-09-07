export interface RawFundingData {
  tanggal: string;
  kantor_kas: string;
  portofolio: string;
  jenis: string;
  noa: number | null;
  volume: number | null;
  jadwal?: string;
}

export interface RawDailyMovementData {
  tanggal: string;
  kantor_kas: string;
  noa_baru: number;
  volume_baru: number;
}

export const RAW_FUNDING_DATA: RawFundingData[] = [];

export const RAW_DAILY_MOVEMENT_DATA: RawDailyMovementData[] = [];
