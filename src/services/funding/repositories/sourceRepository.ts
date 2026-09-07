import { FundingSource } from '../../../types/funding';
import { storageService, STORAGE_KEYS } from '../storageService';

export interface SourceRepository {
  getAll(): Promise<FundingSource[]>;
  getByOfficeId(officeId: string): Promise<FundingSource[]>;
  getById(id: string): Promise<FundingSource | null>;
  create(data: FundingSource): Promise<FundingSource>;
  update(id: string, data: Partial<FundingSource>): Promise<FundingSource>;
  delete(id: string): Promise<void>;
  setAll(data: FundingSource[]): Promise<void>;
}

class LocalSourceRepository implements SourceRepository {
  private get data(): FundingSource[] {
    return storageService.getItem<FundingSource[]>(STORAGE_KEYS.SOURCES) ?? [];
  }

  private save(data: FundingSource[]): void {
    storageService.setItem(STORAGE_KEYS.SOURCES, data);
  }

  async getAll(): Promise<FundingSource[]> {
    return this.data;
  }

  async getByOfficeId(officeId: string): Promise<FundingSource[]> {
    return this.data.filter((x) => x.kantorKasId === officeId);
  }

  async getById(id: string): Promise<FundingSource | null> {
    const item = this.data.find((x) => x.id === id);
    return item ?? null;
  }

  async create(data: FundingSource): Promise<FundingSource> {
    const list = this.data;
    list.push(data);
    this.save(list);
    return data;
  }

  async update(id: string, data: Partial<FundingSource>): Promise<FundingSource> {
    const list = this.data;
    const index = list.findIndex((x) => x.id === id);
    if (index === -1) throw new Error(`Source not found: ${id}`);
    
    list[index] = { ...list[index], ...data };
    this.save(list);
    return list[index];
  }

  async delete(id: string): Promise<void> {
    const list = this.data.filter((x) => x.id !== id);
    this.save(list);
  }

  async setAll(data: FundingSource[]): Promise<void> {
    this.save(data);
  }
}

export const sourceRepository = new LocalSourceRepository();
