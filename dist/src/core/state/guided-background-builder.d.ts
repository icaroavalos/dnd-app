/**
 * Guided Background Builder - Re-exports
 *
 * Modulo principal que re-exporta funcoes dos modulos quebrados:
 * - constants
 * - state
 * - view-model
 * - parsing
 */
export { SUPPORTED_GUIDED_BACKGROUNDS, type GuidedBackgroundOption, type GuidedAbilityOption, type GuidedBackgroundViewModel, type GuidedBackgroundSource, } from './guided-background-constants.js';
export { createGuidedBackgroundChoiceState, ensureGuidedBackgroundChoiceState, normalizeGuidedBackground, applyGuidedBackgroundIncrement, toggleGuidedBackgroundAbility, applyGuidedBackgroundEquipmentChoice, applyGuidedBackgroundSpellcastingAbility, } from './guided-background-state.js';
export { buildGuidedBackgroundViewModel, } from './guided-background-view-model.js';
export { calculateGuidedBackgroundAbilityBonuses, uniqueAbilities, formatChoiceLabel, formatEquipmentOption, cleanItemName, } from './guided-background-parsing.js';
//# sourceMappingURL=guided-background-builder.d.ts.map