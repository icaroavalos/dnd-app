/**
 * Background Loader - Load and cache 5etools backgrounds.json
 * Works in both browser (via fetch) and Node.js environments
 */
import { readFileSync } from 'fs';
import { resolve } from 'path';
let cachedData = null;
let loadPromise = null;
/**
 * Determine if we're running in Node.js or browser
 */
function isNodeEnvironment() {
    return typeof process !== 'undefined' &&
        typeof process.versions !== 'undefined' &&
        typeof process.versions.node !== 'undefined';
}
/**
 * Load backgrounds from 5etools data file.
 * Caches result after first load.
 */
export async function loadBackgroundData(customPath) {
    if (cachedData)
        return cachedData;
    if (loadPromise)
        return loadPromise;
    loadPromise = (async () => {
        let data;
        if (isNodeEnvironment()) {
            // Node.js: use fs
            const filePath = customPath || resolve(process.cwd(), '5etools-v2.28.0/data/backgrounds.json');
            const content = readFileSync(filePath, 'utf-8');
            data = JSON.parse(content);
        }
        else {
            // Browser: use fetch
            const url = customPath || './5etools-v2.28.0/data/backgrounds.json';
            const res = await fetch(url);
            if (!res.ok)
                throw new Error(`Failed to load backgrounds: ${res.status}`);
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