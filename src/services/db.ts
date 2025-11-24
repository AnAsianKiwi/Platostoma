import { MediaItem, AppState } from '../types';
import { MOCK_DATA } from './mediaService';

// Dynamic import wrapper
let Database: any = null;
try {
  import('@tauri-apps/plugin-sql').then(m => { Database = m.default; }).catch(() => {});
} catch (e) {}

export interface IDatabase {
  getLibrary(): Promise<MediaItem[]>;
  saveLibraryItem(item: MediaItem): Promise<void>;
  saveBulkLibraryItems(items: MediaItem[]): Promise<void>;
  deleteLibraryItem(id: string): Promise<void>;
  bulkDeleteItems(ids: string[]): Promise<void>;
  getSettings(): Promise<AppState['settings']>;
  saveSettings(settings: AppState['settings']): Promise<void>;
}

class SqliteDB implements IDatabase {
  private initPromise: Promise<any> | null = null;
  private isMockMode = false;

  private async getDb() {
    if (!Database) {
        try { const m = await import('@tauri-apps/plugin-sql'); Database = m.default; } 
        catch (e) { this.isMockMode = true; }
    }
    
    if (this.isMockMode || !Database) return null;
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      try {
        const db = await Database.load("sqlite:osmanthus.db");
        await db.execute('PRAGMA journal_mode = WAL;');
        await db.execute('PRAGMA synchronous = NORMAL;');
        await db.execute('PRAGMA busy_timeout = 5000;');
        await db.execute(`CREATE TABLE IF NOT EXISTS media (id TEXT PRIMARY KEY, data TEXT NOT NULL);`);
        await db.execute(`CREATE TABLE IF NOT EXISTS settings (id TEXT PRIMARY KEY, data TEXT NOT NULL);`);
        return db;
      } catch (error) {
        console.error("SQLite load failed, switching to mock mode:", error);
        this.isMockMode = true;
        this.initPromise = null;
        return null;
      }
    })();
    return this.initPromise;
  }

  async getLibrary(): Promise<MediaItem[]> {
    const db = await this.getDb();
    if (!db) return MOCK_DATA;
    try {
        const result = await db.select('SELECT data FROM media');
        if (result.length === 0) { await this.seedMockData(db); return MOCK_DATA; }
        return result.map((row: any) => JSON.parse(row.data));
    } catch(e) { console.error(e); return MOCK_DATA; }
  }

  async saveLibraryItem(item: MediaItem): Promise<void> {
    const db = await this.getDb();
    if (!db) return;
    await db.execute('INSERT OR REPLACE INTO media (id, data) VALUES ($1, $2)', [item.id, JSON.stringify(item)]);
  }

  async saveBulkLibraryItems(items: MediaItem[]): Promise<void> {
    const db = await this.getDb();
    if (!db) return;

    const CHUNK_SIZE = 50;
    for (let i = 0; i < items.length; i += CHUNK_SIZE) {
      const chunk = items.slice(i, i + CHUNK_SIZE);
      const placeholders = chunk.map(() => '(?, ?)').join(', ');
      const query = `INSERT OR REPLACE INTO media (id, data) VALUES ${placeholders}`;
      const params: any[] = [];
      for (const item of chunk) { params.push(item.id, JSON.stringify(item)); }

      try { await db.execute(query, params); } 
      catch (e) { console.error(`Failed to save chunk ${i}`, e); throw e; }
    }
  }

  async deleteLibraryItem(id: string): Promise<void> {
    const db = await this.getDb();
    if (!db) return;
    await db.execute('DELETE FROM media WHERE id = $1', [id]);
  }

  async bulkDeleteItems(ids: string[]): Promise<void> {
    const db = await this.getDb();
    if (!db || ids.length === 0) return;
    const placeholders = ids.map((_, i) => `$${i + 1}`).join(',');
    await db.execute(`DELETE FROM media WHERE id IN (${placeholders})`, ids);
  }

  async getSettings(): Promise<AppState['settings']> {
    const db = await this.getDb();
    const defaults = { apiKey: '', proxyUrl: '', enableAi: false, customTypes: [], customStatuses: [], gridColumns: 0, keybinds: { addMedia: 'Ctrl+Alt+n' } };
    if (!db) return defaults;
    try {
        const result: any[] = await db.select('SELECT data FROM settings WHERE id = $1', ['user_settings']);
        if (result.length > 0) {
            const settings = JSON.parse(result[0].data);
            return { ...defaults, ...settings, keybinds: { ...defaults.keybinds, ...settings.keybinds } };
        }
    } catch(e) { console.error(e); }
    return defaults;
  }

  async saveSettings(settings: AppState['settings']): Promise<void> {
    const db = await this.getDb();
    if (!db) return;
    await db.execute('INSERT OR REPLACE INTO settings (id, data) VALUES ($1, $2)', ['user_settings', JSON.stringify(settings)]);
  }

  private async seedMockData(db: any) {
    for (const item of MOCK_DATA) {
      await db.execute('INSERT INTO media (id, data) VALUES ($1, $2)', [item.id, JSON.stringify(item)]);
    }
  }
}

export const db = new SqliteDB();