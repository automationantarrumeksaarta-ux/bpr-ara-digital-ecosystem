import { FundingTarget } from '../../../types/funding';
import { storageService, STORAGE_KEYS } from '../storageService';

export interface TargetRepository {
  getAll(): Promise<FundingTarget[]>;
  getById(id: string): Promise<FundingTarget | null>;
  create(data: FundingTarget): Promise<FundingTarget>;
  update(id: string, data: Partial<FundingTarget>): Promise<FundingTarget>;
  delete(id: string): Promise<void>;
  setAll(data: FundingTarget[]): Promise<void>;
}

class LocalTargetRepository implements TargetRepository {
  private get data(): FundingTarget[] {
    return storageService.getItem<FundingTarget[]>(STORAGE_KEYS.TARGETS) ?? [];
  }

  private save(data: FundingTarget[]): void {
    storageService.setItem(STORAGE_KEYS.TARGETS, data);
  }

  async getAll(): Promise<FundingTarget[]> {
    return this.data;
  }

  async getById(id: string): Promise<FundingTarget | null> {
    const item = this.data.find((x) => x.id === id);
    return item ?? null;
  }

  async create(data: FundingTarget): Promise<FundingTarget> {
    const list = this.data;
    list.push(data);
    this.save(list);
    return data;
  }

  async update(id: string, data: Partial<FundingTarget>): Promise<FundingTarget> {
    const list = this.data;
    const index = list.findIndex((x) => x.id === id);
    if (index === -1) throw new Error(`Target not found: ${id}`);
    
    list[index] = { ...list[index], ...data };
    this.save(list);
    return list[index];
  }

  async delete(id: string): Promise<void> {
    const list = this.data.filter((x) => x.id !== id);
    this.save(list);
  }

  async setAll(data: FundingTarget[]): Promise<void> {
    this.save(data);
  }
}

export const targetRepository = new LocalTargetRepository();
