import { PortfolioSnapshot, ProductType } from '../../../types/funding';
import { storageService, STORAGE_KEYS } from '../storageService';

export interface PortfolioRepository {
  getAll(): Promise<PortfolioSnapshot[]>;
  getByDate(date: string): Promise<PortfolioSnapshot[]>;
  getById(id: string): Promise<PortfolioSnapshot | null>;
  findByUniqueKey(tanggal: string, kantorKasId: string, sourceId: string, produk: ProductType): Promise<PortfolioSnapshot | null>;
  create(data: PortfolioSnapshot): Promise<PortfolioSnapshot>;
  update(id: string, data: Partial<PortfolioSnapshot>): Promise<PortfolioSnapshot>;
  delete(id: string): Promise<void>;
  setAll(data: PortfolioSnapshot[]): Promise<void>;
}

class LocalPortfolioRepository implements PortfolioRepository {
  private get data(): PortfolioSnapshot[] {
    return storageService.getItem<PortfolioSnapshot[]>(STORAGE_KEYS.PORTFOLIO) ?? [];
  }

  private save(data: PortfolioSnapshot[]): void {
    storageService.setItem(STORAGE_KEYS.PORTFOLIO, data);
  }

  async getAll(): Promise<PortfolioSnapshot[]> {
    return this.data;
  }

  async getByDate(date: string): Promise<PortfolioSnapshot[]> {
    return this.data.filter((x) => x.tanggal === date);
  }

  async getById(id: string): Promise<PortfolioSnapshot | null> {
    const item = this.data.find((x) => x.id === id);
    return item ?? null;
  }

  async findByUniqueKey(tanggal: string, kantorKasId: string, sourceId: string, produk: ProductType): Promise<PortfolioSnapshot | null> {
    const item = this.data.find(
      (x) => x.tanggal === tanggal && x.kantorKasId === kantorKasId && x.sourceId === sourceId && x.produk === produk
    );
    return item ?? null;
  }

  async create(data: PortfolioSnapshot): Promise<PortfolioSnapshot> {
    const list = this.data;
    // Ensure uniqueness based on business key
    const existing = list.find(
      (x) => x.tanggal === data.tanggal && x.kantorKasId === data.kantorKasId && x.sourceId === data.sourceId && x.produk === data.produk
    );
    if (existing) {
      throw new Error(`Duplicate snapshot for ${data.tanggal}, source: ${data.sourceId}, product: ${data.produk}`);
    }

    list.push(data);
    this.save(list);
    return data;
  }

  async update(id: string, data: Partial<PortfolioSnapshot>): Promise<PortfolioSnapshot> {
    const list = this.data;
    const index = list.findIndex((x) => x.id === id);
    if (index === -1) throw new Error(`Snapshot not found: ${id}`);
    
    list[index] = { ...list[index], ...data, updatedAt: new Date().toISOString() };
    this.save(list);
    return list[index];
  }

  async delete(id: string): Promise<void> {
    const list = this.data.filter((x) => x.id !== id);
    this.save(list);
  }

  async setAll(data: PortfolioSnapshot[]): Promise<void> {
    this.save(data);
  }
}

export const portfolioRepository = new LocalPortfolioRepository();
