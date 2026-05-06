/**
 * Background Parser - Parse raw 5etools background data into structured format
 */
import type { RawBackground, ParsedBackground } from '../../types/background';
/**
 * Parse a raw 5etools background into a structured ParsedBackground.
 */
export declare function parseBackground(raw: RawBackground): ParsedBackground;
/**
 * Parse all backgrounds from raw data.
 */
export declare function parseAllBackgrounds(rawData: RawBackground[]): ParsedBackground[];
//# sourceMappingURL=background-parser.d.ts.map