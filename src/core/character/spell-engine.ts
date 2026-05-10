export type {
  SpellcastingMetrics,
  SpellChoiceStatus,
  SpellEntry,
  SpellResourceDefinition,
} from './spell-engine-types.js';

export {
  currentKnownSpellNames,
  currentSpellEntries,
  resolveSelectedSpellName,
  spellSlotsMaxByLevel,
  spellAbility,
  spellAbilityForSpell,
  spellcastingMetricsForAbility,
  classHasSpellList,
  classSpellAbility,
  casterLevel,
  currentLevelRow,
  backgroundSpellChoiceRules,
  backgroundSpellAbility,
  backgroundSpellResourceDefinitions,
  explicitSpellRefsFromText,
  autoGrantedSpellEntries,
  spellFromKnownData,
} from './spell-engine-composition.js';
