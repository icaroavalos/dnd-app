/**
 * Background Loader - Load and cache 5etools backgrounds.json
 * Browser-only version using fetch
 */

import { DEFAULT_BACKGROUNDS } from './backgrounds';
import type { RawBackground } from '../../types/background';

// Browser-only path: relative to index.html
const BACKGROUND_DATA_PATH = './5etools-v2.28.0/data/backgrounds.json';

let cachedData: RawBackground[] | null = null;
let loadPromise: Promise<RawBackground[]> | null = null;

/**
 * Load backgrounds - use hardcoded defaults initially,
 * try to load JSON data in background.
 */
export async function loadBackgroundData(): Promise<RawBackground[]> {
  if (cachedData) return cachedData;
  if (loadPromise) return loadPromise;

  // Start with hardcoded backgrounds immediately
  cachedData = DEFAULT_BACKGROUNDS as unknown as RawBackground[];
  loadPromise = Promise.resolve(cachedData);

  // Try to load JSON in background and update cache if successful
  fetch(BACKGROUND_DATA_PATH)
    .then((res: Response) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    })
    .then((data: { background?: RawBackground[] }) => {
      if (data.background && data.background.length > 0) {
        cachedData = data.background;
      }
    })
    .catch(() => {
      // Silently ignore - we already have the fallback
    });

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
    (bg: RawBackground) => bg.name.toLowerCase() === name.toLowerCase() && bg.source === source
  );
}

/**
 * Get backgrounds filtered by source (defaults to XPHB).
 */
export function getBackgroundsBySource(source: string = 'XPHB'): RawBackground[] {
  return getAllBackgrounds().filter((bg: RawBackground) => bg.source === source);
}

/**
 * Clear the cache (useful for testing).
 */
export function clearBackgroundCache(): void {
  cachedData = null;
  loadPromise = null;
}