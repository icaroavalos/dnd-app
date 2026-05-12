/**
 * Builder Renderers - Deprecated
 *
 * Este arquivo foi quebrado em modulos coesos:
 * - src/app/builder/ability-method-renderer.js
 * - src/app/builder/class-creation-renderer.js
 * - src/app/builder/level-up-renderer.js
 * - src/app/builder/background-spell-renderer.js
 *
 * Use os novos modulos diretamente.
 */

import { createAbilityMethodRenderer } from './builder/ability-method-renderer.js';
import { createClassCreationRenderer } from './builder/class-creation-renderer.js';
import { createLevelUpRenderer } from './builder/level-up-renderer.js';
import { createBackgroundSpellRenderer } from './builder/background-spell-renderer.js';

export function createBuilderRenderers({
  getState,
  abilities,
  numberField,
  buildStandardArrayCards,
  calculateCharacterAbilityBonuses,
  buildPointBuyViewModel,
  buildScoreCards,
  escapeHtml,
  selectField,
  choiceLocked,
  normalizedAsiChoice,
  isAsiChoiceComplete,
  qualifiedFeatOptions,
  asiAbilityOptions,
  titleCase,
  deriveProjectedAbilityModifier,
  calculateFixedHpGain,
  signed,
  creationChoicesLocked,
  backgroundSpellOptions,
}) {
  const abilityMethodRenderer = createAbilityMethodRenderer({
    getState,
    abilities,
    numberField,
    buildStandardArrayCards,
    calculateCharacterAbilityBonuses,
    buildPointBuyViewModel,
    buildScoreCards,
    escapeHtml,
    deriveProjectedAbilityModifier,
    calculateFixedHpGain,
    signed,
  });

  const classCreationRenderer = createClassCreationRenderer({
    getState,
    escapeHtml,
    choiceLocked,
    normalizedAsiChoice,
    isAsiChoiceComplete,
    qualifiedFeatOptions,
    asiAbilityOptions,
    selectField,
    deriveProjectedAbilityModifier,
    calculateFixedHpGain,
    signed,
  });

  const levelUpRenderer = createLevelUpRenderer({
    getState,
    titleCase,
    deriveProjectedAbilityModifier,
    calculateFixedHpGain,
    signed,
    escapeHtml,
  });

  const backgroundSpellRenderer = createBackgroundSpellRenderer({
    getState,
    escapeHtml,
    creationChoicesLocked,
    backgroundSpellOptions,
  });

  return {
    renderAbilityMethodControls: abilityMethodRenderer.renderAbilityMethodControls,
    renderStandardArrayControls: abilityMethodRenderer.renderStandardArrayControls,
    renderPointBuyControls: abilityMethodRenderer.renderPointBuyControls,
    renderAbilityScoreCalculations: abilityMethodRenderer.renderAbilityScoreCalculations,
    renderEquipmentChoice: classCreationRenderer.renderEquipmentChoice,
    renderClassCreationChoice: classCreationRenderer.renderClassCreationChoice,
    renderAsiChoice: classCreationRenderer.renderAsiChoice,
    renderLevelUpClassChoice: levelUpRenderer.renderLevelUpClassChoice,
    renderLevelUpHpControl: levelUpRenderer.renderLevelUpHpControl,
    renderLevelUpNavButtons: levelUpRenderer.renderLevelUpNavButtons,
    renderBgSpellChoice: backgroundSpellRenderer.renderBgSpellChoice,
renderBgSpellChoices: backgroundSpellRenderer.renderBgSpellChoices,
  };
}
