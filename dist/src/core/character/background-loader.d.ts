/**
 * Background Loader - Load and cache 5etools backgrounds.json
 * Browser-only version using fetch
 */
import type { RawBackground } from '../../types/background';
/**
 * Load backgrounds - use hardcoded defaults initially,
 * try to load JSON data in background.
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
//# sourceMappingURL=background-loader.d.ts.map