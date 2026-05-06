/**
 * Background Loader - Load and cache 5etools backgrounds.json
 * Works in both browser (via fetch) and Node.js environments
 */

import type { RawBackground } from '../../types/background';
import { readFileSync } from 'fs';
import { resolve } from 'path';

interface BackgroundsData {
  _meta?: { internalCopies?: string[] };
  background: RawBackground[];
}

let cachedData: RawBackground[] | null = null;
let loadPromise: Promise<RawBackground[]> | null = null;

/**
 * Determine if we're running in Node.js or browser
 */
function isNodeEnvironment(): boolean {
  return typeof process !== 'undefined' &&
         process.versions &&
         process.versions.node;
}

/**
 * Load backgrounds from 5etools data file.
 * Caches result after first load.
 */
export async function loadBackgroundData(customPath?: string): Promise<RawBackground[]> {
  if (cachedData) return cachedData;
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    let data: BackgroundsData;

    if (isNodeEnvironment()) {
      // Node.js: use fs
      const filePath = customPath || resolve(process.cwd(), '5etools-v2.28.0/data/backgrounds.json');
      const content = readFileSync(filePath, 'utf-8');
      data = JSON.parse(content);
    } else {
      // Browser: use fetch
      const url = customPath || './5etools-v2.28.0/data/backgrounds.json';
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Failed to load backgrounds: ${res.status}`);
      data = await res.json();
    }

    cachedData = data.background || [];
    return cachedData;
  })();

  return loadPromise;
}

/**
 * Get all cached backgrounds (must call loadBackgroundData first).
 */
export function getAllBackgrounds(): RawBackground[] {
  if (!cachedData) {
    console.warn('Background data not loaded. Call loadBackgroundData() first.');
    return [];
  }
  return cachedData;
}

/**
 * Get a specific background by name and source.
 */
export function getBackground(name: string, source: string): RawBackground | undefined {
  const backgrounds = getAllBackgrounds();
  return backgrounds.find(
    (bg) => bg.name.toLowerCase() === name.toLowerCase() && bg.source === source
  );
}

/**
 * Get backgrounds filtered by source (defaults to XPHB).
 */
export function getBackgroundsBySource(source: string = 'XPHB'): RawBackground[] {
  return getAllBackgrounds().filter((bg) => bg.source === source);
}

/**
 * Clear the cache (useful for testing).
 */
export function clearBackgroundCache(): void {
  cachedData = null;
  loadPromise = null;
}