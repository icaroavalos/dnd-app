/**
 * Backgrounds - Data-driven loading from 5etools JSON
 *
 * Loads all XPHB backgrounds from data/5etools/5e-2024/backgrounds.json
 * Excludes MPMM backgrounds as per requirements.
 */
import type { BackgroundData } from '../../types/background';
/**
 * Load all backgrounds from JSON data
 */
export declare function loadBackgroundData(): Promise<BackgroundData[]>;
/**
 * Get all cached backgrounds (must call loadBackgroundData first)
 */
export declare function getAllBackgrounds(): BackgroundData[];
/**
 * Get a specific background by name and source
 */
export declare function getBackground(name: string, source: string): BackgroundData | undefined;
/**
 * Get backgrounds filtered by source (defaults to XPHB)
 */
export declare function getBackgroundsBySource(source?: string): BackgroundData[];
/**
 * Clear the cache (useful for testing)
 */
export declare function clearBackgroundCache(): void;
/**
 * Initialize default backgrounds by loading from JSON
 */
export declare function initializeDefaultBackgrounds(): void;
/**
 * Get initial backgrounds - loads from JSON if not already loaded
 */
export declare function getInitialBackgrounds(): BackgroundData[];
declare const _default: {
    loadBackgroundData: typeof loadBackgroundData;
    getAllBackgrounds: typeof getAllBackgrounds;
    getBackground: typeof getBackground;
    getBackgroundsBySource: typeof getBackgroundsBySource;
    clearBackgroundCache: typeof clearBackgroundCache;
    initializeDefaultBackgrounds: typeof initializeDefaultBackgrounds;
    getInitialBackgrounds: typeof getInitialBackgrounds;
};
export default _default;
//# sourceMappingURL=backgrounds.d.ts.map