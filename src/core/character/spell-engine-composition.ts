export {
  spellcastingMetricsForAbility,
  currentLevelRow,
  classHasSpellList,
  casterLevel,
  classSpellAbility,
  spellSlotsMaxByLevel,
} from './spell-engine-class.js';

export {
  backgroundSpellChoiceRules,
  backgroundSpellAbility,
  backgroundSpellResourceDefinitions,
} from './spell-engine-background.js';

export {
  explicitSpellRefsFromText,
  autoGrantedSpellEntries,
  spellFromKnownData,
  resolveSelectedSpellName,
  backgroundSpellResourceId as backgroundSpellResourceIdUtil,
} from './spell-engine-utilities.js';

export {
  currentKnownSpellNames,
  currentSpellEntries,
  spellAbility,
  spellAbilityForSpell,
} from './spell-engine-main.js';
