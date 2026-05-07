/**
 * Background Loader - load and cache compacted 5etools background data.
 * Browser-only version using fetch.
 */
import { DEFAULT_BACKGROUNDS } from './backgrounds.js';
// Browser-only path: relative to index.html
const BACKGROUND_DATA_PATH = './data/5etools/5e-2024/backgrounds.json';
let cachedData = null;
let loadPromise = null;
/**
 * Load backgrounds - use hardcoded defaults initially,
 * try to load JSON data in background.
 */
export async function loadBackgroundData() {
    if (cachedData)
        return cachedData;
    if (loadPromise)
        return loadPromise;
    // Start with hardcoded backgrounds immediately
    cachedData = DEFAULT_BACKGROUNDS;
    loadPromise = Promise.resolve(cachedData);
    // Try to load JSON in background and update cache if successful
    fetch(BACKGROUND_DATA_PATH)
        .then((res) => {
        if (!res.ok)
            throw new Error(`HTTP ${res.status}`);
        return res.json();
    })
        .then((data) => {
        const backgrounds = data.results ?? data.background ?? [];
        if (backgrounds.length > 0) {
            cachedData = backgrounds;
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
export function getAllBackgrounds() {
    if (!cachedData) {
        console.warn('Background data not loaded. Call loadBackgroundData() first.');
        return [];
    }
    return cachedData;
}
/**
 * Get a specific background by name and source.
 */
export function getBackground(name, source) {
    const backgrounds = getAllBackgrounds();
    return backgrounds.find((bg) => bg.name.toLowerCase() === name.toLowerCase() && bg.source === source);
}
/**
 * Get backgrounds filtered by source (defaults to XPHB).
 */
export function getBackgroundsBySource(source = 'XPHB') {
    return getAllBackgrounds().filter((bg) => bg.source === source);
}
/**
 * Clear the cache (useful for testing).
 */
export function clearBackgroundCache() {
    cachedData = null;
    loadPromise = null;
}
//# sourceMappingURL=background-loader.js.map