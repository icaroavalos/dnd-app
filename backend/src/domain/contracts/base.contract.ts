export const RULESET_ID = '5.5e-2024' as const;

export const ABILITY_KEYS = ['str', 'dex', 'con', 'int', 'wis', 'cha'] as const;

export type RulesetId = typeof RULESET_ID;
export type AbilityKey = (typeof ABILITY_KEYS)[number];

export type AbilityScoreMap = Record<AbilityKey, number>;
