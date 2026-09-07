import { DailyMovement } from '../../../types/funding';
import { storageService, STORAGE_KEYS } from '../storageService';

export interface DailyRepository {
  getAll(): Promise<DailyMovement[]>;
  getByDate(date: string): Promise<DailyMovement[]>;
  getById(id: string): Promise<DailyMovement | null>;
  create(data: DailyMovement): Promise<DailyMovement>;
  update(id: string, data: Partial<DailyMovement>): Promise<DailyMovement>;
  delete(id: string): Promise<void>;
  setAll(data: DailyMovement[]): Promise<void>;
}

class LocalDailyRepository implements DailyRepository {
  private get data(): DailyMovement[] {
    return storageService.getItem<DailyMovement[]>(STORAGE_KEYS.DAILY) ?? [];
  }

  private save(data: DailyMovement[]): void {
    storageService.setItem(STORAGE_KEYS.DAILY, data);
  }

  async getAll(): Promise<DailyMovement[]> {
    return this.data;
  }

  async getByDate(date: string): Promise<DailyMovement[]> {
    return this.data.filter((x) => x.tanggal === date);
  }

  async getById(id: string): Promise<DailyMovement | null> {
    const item = this.data.find((x) => x.id === id);
    return item ?? null;
  }

  async create(data: DailyMovement): Promise<DailyMovement> {
    const list = this.data;
    list.push(data);
    this.save(list);
    return data;
  }

  async update(id: string, data: Partial<DailyMovement>): Promise<DailyMovement> {
    const list = this.data;
    const index = list.findIndex((x) => x.id === id);
    if (index === -1) throw new Error(`Daily movement not found: ${id}`);
    
    list[index] = { ...list[index], ...data };
    this.save(list);
    return list[index];
  }

  async delete(id: string): Promise<void> {
    const list = this.data.filter((x) => x.id !== id);
    this.save(list);
  }

  async setAll(data: DailyMovement[]): Promise<void> {
    this.save(data);
  }
}

export const dailyRepository = new LocalDailyRepository();
