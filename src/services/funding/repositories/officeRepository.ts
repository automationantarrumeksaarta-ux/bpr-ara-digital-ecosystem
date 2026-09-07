import { KasOffice } from '../../../types/funding';
import { storageService, STORAGE_KEYS } from '../storageService';

export interface OfficeRepository {
  getAll(): Promise<KasOffice[]>;
  getById(id: string): Promise<KasOffice | null>;
  create(data: KasOffice): Promise<KasOffice>;
  update(id: string, data: Partial<KasOffice>): Promise<KasOffice>;
  delete(id: string): Promise<void>;
  setAll(data: KasOffice[]): Promise<void>;
}

class LocalOfficeRepository implements OfficeRepository {
  private get data(): KasOffice[] {
    return storageService.getItem<KasOffice[]>(STORAGE_KEYS.OFFICES) ?? [];
  }

  private save(data: KasOffice[]): void {
    storageService.setItem(STORAGE_KEYS.OFFICES, data);
  }

  async getAll(): Promise<KasOffice[]> {
    return this.data;
  }

  async getById(id: string): Promise<KasOffice | null> {
    const item = this.data.find((x) => x.id === id);
    return item ?? null;
  }

  async create(data: KasOffice): Promise<KasOffice> {
    const list = this.data;
    list.push(data);
    this.save(list);
    return data;
  }

  async update(id: string, data: Partial<KasOffice>): Promise<KasOffice> {
    const list = this.data;
    const index = list.findIndex((x) => x.id === id);
    if (index === -1) throw new Error(`Office not found: ${id}`);
    
    list[index] = { ...list[index], ...data };
    this.save(list);
    return list[index];
  }

  async delete(id: string): Promise<void> {
    const list = this.data.filter((x) => x.id !== id);
    this.save(list);
  }

  async setAll(data: KasOffice[]): Promise<void> {
    this.save(data);
  }
}

export const officeRepository = new LocalOfficeRepository();
