/**
 * Background Loader - load and cache compacted 5etools background data.
 * Browser-only version using fetch.
 */
// Browser-only path: relative to index.html
const BACKGROUND_DATA_PATH = './data/5etools/5e-2024/backgrounds.json';
let cachedData = null;
let loadPromise = null;
/**
 * Parse raw background data into structured format
 */
function parseRawBackground(raw) {
    return {
        name: raw.name,
        source: raw.source,
        page: raw.page,
        ability: raw.ability,
        skillProficiencies: raw.skillProficiencies,
        toolProficiencies: raw.toolProficiencies,
        languageProficiencies: raw.languageProficiencies,
        startingEquipment: raw.startingEquipment,
        feats: raw.feats,
        entries: raw.entries,
        srd52: raw.srd52,
        basicRules2024: raw.basicRules2024,
    };
}
/**
 * Load backgrounds from JSON file
 */
async function fetchBackgrounds() {
    const response = await fetch(BACKGROUND_DATA_PATH);
    if (!response.ok) {
        throw new Error(`Failed to load backgrounds: ${response.statusText}`);
    }
    const data = await response.json();
    const backgrounds = data.results ?? data.background ?? [];
    return backgrounds.map(parseRawBackground);
}
/**
 * Load backgrounds - fetch JSON data and cache.
 */
export async function loadBackgroundData() {
    if (cachedData)
        return cachedData;
    if (loadPromise)
        return loadPromise;
    loadPromise = fetchBackgrounds()
        .then((data) => {
        cachedData = data;
        return data;
    })
        .catch((error) => {
        console.error('Failed to load background data:', error);
        return [];
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
export default {
    loadBackgroundData,
    getAllBackgrounds,
    getBackground,
    getBackgroundsBySource,
    clearBackgroundCache,
};
//# sourceMappingURL=background-loader.js.map