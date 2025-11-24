import { BaseDirectory, exists, mkdir, writeFile } from '@tauri-apps/plugin-fs';
import { fetch } from '@tauri-apps/plugin-http';
import { appDataDir, join } from '@tauri-apps/api/path';
import { convertFileSrc } from '@tauri-apps/api/core';

const COVERS_DIR = 'covers';

// Helper: Check if we are running in Tauri or Browser
const isTauri = () => typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

/**
 * Downloads an image from a URL and saves it to AppData/covers/
 * Returns the local path (asset protocol) or the original URL if failed.
 */
export const cacheImage = async (url: string, id: string): Promise<string> => {
  // 1. Skip if not in Tauri (Browser Mode) or if URL is already local
  if (!isTauri() || !url || !url.startsWith('http')) {
    return url;
  }

  try {
    // 2. Ensure 'covers' directory exists
    const existsDir = await exists(COVERS_DIR, { baseDir: BaseDirectory.AppData });
    if (!existsDir) {
      await mkdir(COVERS_DIR, { baseDir: BaseDirectory.AppData, recursive: true });
    }

    // 3. Determine filename (sanitize ID)
    const extension = url.split('.').pop()?.split('?')[0] || 'jpg';
    const filename = `${COVERS_DIR}/${id}.${extension}`;

    // 4. Download Image
    // We use Tauri's fetch to bypass CORS restrictions
    const response = await fetch(url);
    if (!response.ok) throw new Error('Download failed');
    
    const buffer = await response.arrayBuffer();
    const data = new Uint8Array(buffer);

    // 5. Save to Disk
    await writeFile(filename, data, { baseDir: BaseDirectory.AppData });

    // 6. Return the specific Tauri Asset URL for this file
    // This converts "C:/Users/.../covers/1.jpg" to "asset://localhost/..."
    // We need to reconstruct the full path first for convertFileSrc
    const appData = await appDataDir();
    const fullPath = await join(appData, filename);
    
    return convertFileSrc(fullPath);

  } catch (error) {
    console.error(`Failed to cache image for ${id}:`, error);
    return url; // Fallback to remote URL
  }
};

/**
 * Helper to resolve an image path for <img> tags
 * Handles both remote URLs (https://) and local Asset URLs (asset://)
 */
export const resolveCover = (url?: string) => {
  if (!url) return undefined;
  return url;
};