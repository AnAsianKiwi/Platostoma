import Database from '@tauri-apps/plugin-sql';
import { MediaItem, AppState } from '../types';
import { MOCK_DATA } from './mediaService';

export interface IDatabase {
  getLibrary(): Promise<MediaItem[]>;
  saveLibraryItem(item: MediaItem): Promise<void>;
  deleteLibraryItem(id: string): Promise<void>;
  bulkDeleteItems(ids: string[]): Promise<void>;
  getSettings(): Promise<AppState['settings']>;
  saveSettings(settings: AppState['settings']): Promise<void>;
}

class SqliteDB implements IDatabase {
  // We use a Promise to track initialization status
  private initPromise: Promise<Database> | null = null;

  private async getDb(): Promise<Database> {
    // If initialization has already started, return the existing promise
    // This prevents multiple calls from racing against each other
    if (this.initPromise) {
      return this.initPromise;
    }

    // Start the initialization
    this.initPromise = (async () => {
      try {
        const db = await Database.load("sqlite:osmanthus.db");

        // Create Tables safely
        await db.execute(`
          CREATE TABLE IF NOT EXISTS media (
            id TEXT PRIMARY KEY,
            data TEXT NOT NULL
          );
        `);

        await db.execute(`
          CREATE TABLE IF NOT EXISTS settings (
            id TEXT PRIMARY KEY, 
            data TEXT NOT NULL
          );
        `);

        return db;
      } catch (error) {
        // If init fails, reset the promise so we can try again next time
        this.initPromise = null;
        throw error;
      }
    })();

    return this.initPromise;
  }

  async getLibrary(): Promise<MediaItem[]> {
    const db = await this.getDb();
    
    const result = await db.select<{ data: string }[]>('SELECT data FROM media');
    
    if (result.length === 0) {
      // Seed with MOCK_DATA if empty
      await this.seedMockData(db);
      return MOCK_DATA;
    }

    return result.map(row => JSON.parse(row.data));
  }

  async saveLibraryItem(item: MediaItem): Promise<void> {
    const db = await this.getDb();
    await db.execute(
      'INSERT OR REPLACE INTO media (id, data) VALUES ($1, $2)', 
      [item.id, JSON.stringify(item)]
    );
  }

  async deleteLibraryItem(id: string): Promise<void> {
    const db = await this.getDb();
    await db.execute('DELETE FROM media WHERE id = $1', [id]);
  }

  async bulkDeleteItems(ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    const db = await this.getDb();
    const placeholders = ids.map((_, i) => `$${i + 1}`).join(',');
    await db.execute(`DELETE FROM media WHERE id IN (${placeholders})`, ids);
  }

  async getSettings(): Promise<AppState['settings']> {
    const db = await this.getDb();
    
    const defaults = { 
        apiKey: '', 
        proxyUrl: '', 
        enableAi: false,
        customTypes: [],
        customStatuses: [],
        gridColumns: 0,
        keybinds: {
          addMedia: 'Ctrl+Alt+n'
        }
    };

    const result = await db.select<{ data: string }[]>('SELECT data FROM settings WHERE id = $1', ['user_settings']);

    if (result.length > 0) {
      const settings = JSON.parse(result[0].data);
      return { 
        ...defaults, 
        ...settings, 
        keybinds: { ...defaults.keybinds, ...settings.keybinds } 
      };
    }

    return defaults;
  }

  async saveSettings(settings: AppState['settings']): Promise<void> {
    const db = await this.getDb();
    await db.execute(
      'INSERT OR REPLACE INTO settings (id, data) VALUES ($1, $2)',
      ['user_settings', JSON.stringify(settings)]
    );
  }

  private async seedMockData(db: Database) {
    for (const item of MOCK_DATA) {
      await db.execute(
        'INSERT INTO media (id, data) VALUES ($1, $2)',
        [item.id, JSON.stringify(item)]
      );
    }
  }
}

export const db = new SqliteDB();