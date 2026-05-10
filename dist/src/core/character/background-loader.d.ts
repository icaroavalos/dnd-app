/**
 * Background Loader - load and cache compacted 5etools background data.
 * Browser-only version using fetch.
 */
import type { RawBackground } from '../../types/background';
/**
 * Load backgrounds - fetch JSON data and cache.
 */
export declare function loadBackgroundData(): Promise<RawBackground[]>;
/**
 * Get all cached backgrounds (must call loadBackgroundData first).
 */
export declare function getAllBackgrounds(): RawBackground[];
/**
 * Get a specific background by name and source.
 */
export declare function getBackground(name: string, source: string): RawBackground | undefined;
/**
 * Get backgrounds filtered by source (defaults to XPHB).
 */
export declare function getBackgroundsBySource(source?: string): RawBackground[];
/**
 * Clear the cache (useful for testing).
 */
export declare function clearBackgroundCache(): void;
declare const _default: {
    loadBackgroundData: typeof loadBackgroundData;
    getAllBackgrounds: typeof getAllBackgrounds;
    getBackground: typeof getBackground;
    getBackgroundsBySource: typeof getBackgroundsBySource;
    clearBackgroundCache: typeof clearBackgroundCache;
};
export default _default;
//# sourceMappingURL=background-loader.d.ts.map