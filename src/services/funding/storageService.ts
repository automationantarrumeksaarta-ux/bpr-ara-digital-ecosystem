export const STORAGE_KEYS = {
  OFFICES: 'ara_funding_offices',
  SOURCES: 'ara_funding_sources',
  PORTFOLIO: 'ara_funding_portfolio',
  DAILY: 'ara_funding_daily',
  TARGETS: 'ara_funding_targets',
  VERSION: 'ara_funding_schema_version',
};

const CURRENT_VERSION = '2';

class StorageService {
  constructor() {
    this.checkVersion();
  }

  private checkVersion() {
    const version = localStorage.getItem(STORAGE_KEYS.VERSION);
    if (version !== CURRENT_VERSION) {
      // Version mismatch, wipe old data
      this.resetAppStorage();
      localStorage.setItem(STORAGE_KEYS.VERSION, CURRENT_VERSION);
    }
  }

  getItem<T>(key: string): T | null {
    try {
      const data = localStorage.getItem(key);
      if (data) {
        return JSON.parse(data) as T;
      }
    } catch (error) {
      console.error(`Error reading ${key} from localStorage`, error);
    }
    return null;
  }

  setItem<T>(key: string, data: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error(`Error writing ${key} to localStorage`, error);
    }
  }

  removeItem(key: string): void {
    localStorage.removeItem(key);
  }

  resetAppStorage(): void {
    // Only reset app-specific keys, leave other localStorage data intact
    Object.values(STORAGE_KEYS).forEach((key) => {
      this.removeItem(key);
    });
  }
}

export const storageService = new StorageService();
