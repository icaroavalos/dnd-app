/**
 * Guided Background Builder - Re-exports
 *
 * Modulo principal que re-exporta funcoes dos modulos quebrados:
 * - constants
 * - state
 * - view-model
 * - parsing
 */

// Re-export constants and types
export {
  SUPPORTED_GUIDED_BACKGROUNDS,
  type GuidedBackgroundOption,
  type GuidedAbilityOption,
  type GuidedBackgroundViewModel,
  type GuidedBackgroundSource,
} from './guided-background-constants.js';

// Re-export state functions
export {
  createGuidedBackgroundChoiceState,
  ensureGuidedBackgroundChoiceState,
  normalizeGuidedBackground,
  applyGuidedBackgroundIncrement,
  toggleGuidedBackgroundAbility,
  applyGuidedBackgroundEquipmentChoice,
  applyGuidedBackgroundSpellcastingAbility,
} from './guided-background-state.js';

// Re-export view model functions
export {
  buildGuidedBackgroundViewModel,
} from './guided-background-view-model.js';

// Re-export parsing utilities
export {
  calculateGuidedBackgroundAbilityBonuses,
  uniqueAbilities,
  formatChoiceLabel,
  formatEquipmentOption,
  cleanItemName,
} from './guided-background-parsing.js';
