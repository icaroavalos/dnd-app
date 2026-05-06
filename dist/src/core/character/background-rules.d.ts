/**
 * Background Rules - Generate choice rules for UI from parsed backgrounds
 */
import type { BackgroundRule } from '../../types/background';
/**
 * Generate choice rules for a specific background
 */
export declare function backgroundChoiceRules(backgroundName: string, source?: string): BackgroundRule[];
/**
 * Get all backgrounds with their rules (for UI listing)
 */
export declare function getAllBackgroundRules(): Promise<{
    name: string;
    source: string;
    rules: BackgroundRule[];
}[]>;
/**
 * Check if background has Magic Initiate feature
 */
export declare function hasMagicInitiate(backgroundName: string, source?: string): boolean;
/**
 * Get Magic Initiate class for a background
 */
export declare function getMagicInitiateClass(backgroundName: string, source?: string): string | null;
//# sourceMappingURL=background-rules.d.ts.map