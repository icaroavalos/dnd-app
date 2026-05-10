/**
 * Backgrounds - Data-driven loading from 5etools JSON
 *
 * Loads all XPHB backgrounds from data/5etools/5e-2024/backgrounds.json
 * Excludes MPMM backgrounds as per requirements.
 */
/**
 * Path to background data - relative to project root for Node.js tests
 */
const BACKGROUND_DATA_PATH = './data/5etools/5e-2024/backgrounds.json';
/**
 * Cache for loaded backgrounds
 */
let cachedBackgrounds = null;
let loadPromise = null;
/**
 * Parse skill proficiencies from raw background
 */
function parseSkillProficiencies(raw) {
    if (!raw || !Array.isArray(raw))
        return [];
    return raw.flatMap((group) => {
        if (typeof group === 'object' && group !== null) {
            return Object.keys(group).filter((key) => group[key] === true);
        }
        return [];
    });
}
/**
 * Parse equipment into a simple description string for initial display
 */
function parseEquipmentDescription(raw) {
    if (!raw || !Array.isArray(raw))
        return [];
    const equipment = [];
    for (const group of raw) {
        if ('A' in group && Array.isArray(group.A)) {
            for (const item of group.A) {
                if (typeof item === 'string') {
                    const [name] = item.split('|');
                    if (name)
                        equipment.push(name.trim());
                }
                else if (typeof item === 'object' && item !== null && 'item' in item) {
                    const itemEntry = item;
                    if (itemEntry.item) {
                        const [name] = itemEntry.item.split('|');
                        if (name)
                            equipment.push(name.trim());
                    }
                }
            }
        }
    }
    return equipment;
}
/**
 * Parse raw background into BackgroundData format
 */
function parseBackground(raw) {
    const skillProficiencies = parseSkillProficiencies(raw.skillProficiencies);
    const equipment = parseEquipmentDescription(raw.startingEquipment);
    // Extract feat name if present
    let feature;
    if (raw.feats && Array.isArray(raw.feats) && raw.feats.length > 0) {
        const featName = raw.feats
            .flatMap((g) => Object.keys(g))
            .join(', ');
        if (featName) {
            feature = {
                name: featName,
                entries: [featName],
            };
        }
    }
    return {
        name: raw.name,
        source: raw.source,
        description: `${raw.name} background from ${raw.source}`,
        skillProficiencies,
        toolProficiencies: [],
        languages: [],
        equipment,
        feature,
    };
}
/**
 * Load backgrounds from JSON file (Node.js environment)
 */
async function loadBackgroundsFromJson() {
    try {
        // Try Node.js require first (for tests and SSR)
        const fs = await import('fs');
        const path = await import('path');
        const fullPath = path.resolve(process.cwd(), BACKGROUND_DATA_PATH);
        const jsonData = JSON.parse(fs.readFileSync(fullPath, 'utf-8'));
        const backgrounds = jsonData.results || jsonData.background || [];
        // Filter to only XPHB backgrounds (exclude MPMM and other sources)
        const xphbBackgrounds = backgrounds.filter((bg) => bg.source === 'XPHB');
        return xphbBackgrounds.map(parseBackground);
    }
    catch (error) {
        console.warn('Failed to load backgrounds from JSON, using empty defaults:', error);
        return [];
    }
}
/**
 * Load all backgrounds from JSON data
 */
export async function loadBackgroundData() {
    if (cachedBackgrounds)
        return cachedBackgrounds;
    if (loadPromise)
        return loadPromise;
    loadPromise = loadBackgroundsFromJson()
        .then((backgrounds) => {
        cachedBackgrounds = backgrounds;
        return backgrounds;
    })
        .catch((error) => {
        console.error('Failed to load backgrounds:', error);
        return [];
    });
    return loadPromise;
}
/**
 * Get all cached backgrounds (must call loadBackgroundData first)
 */
export function getAllBackgrounds() {
    if (!cachedBackgrounds) {
        console.warn('Background data not loaded. Call loadBackgroundData() first.');
        return [];
    }
    return cachedBackgrounds;
}
/**
 * Get a specific background by name and source
 */
export function getBackground(name, source) {
    const backgrounds = getAllBackgrounds();
    return backgrounds.find((bg) => bg.name.toLowerCase() === name.toLowerCase() && bg.source === source);
}
/**
 * Get backgrounds filtered by source (defaults to XPHB)
 */
export function getBackgroundsBySource(source = 'XPHB') {
    return getAllBackgrounds().filter((bg) => bg.source === source);
}
/**
 * Clear the cache (useful for testing)
 */
export function clearBackgroundCache() {
    cachedBackgrounds = null;
    loadPromise = null;
}
/**
 * Initialize default backgrounds by loading from JSON
 */
export function initializeDefaultBackgrounds() {
    loadBackgroundData().catch((error) => {
        console.error('Failed to initialize default backgrounds:', error);
    });
}
/**
 * Get initial backgrounds - loads from JSON if not already loaded
 */
export function getInitialBackgrounds() {
    if (!cachedBackgrounds) {
        // Synchronous fallback - return empty array, caller should use loadBackgroundData
        return [];
    }
    return cachedBackgrounds;
}
// Auto-load backgrounds on module import
loadBackgroundData().catch((error) => {
    console.warn('Auto-load backgrounds failed:', error);
});
export default {
    loadBackgroundData,
    getAllBackgrounds,
    getBackground,
    getBackgroundsBySource,
    clearBackgroundCache,
    initializeDefaultBackgrounds,
    getInitialBackgrounds,
};
//# sourceMappingURL=backgrounds.js.map