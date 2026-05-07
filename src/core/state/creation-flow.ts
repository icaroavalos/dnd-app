import type { BuilderStepId } from '../../types/state';

export const CREATION_STEPS: [BuilderStepId, string][] = [
  ['lineage', 'Origem'],
  ['background', 'Background'],
  ['abilities', 'Atributos'],
  ['choices', 'Escolhas'],
  ['leveling', 'Niveis'],
];

type AbilityKey = 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha';

export interface CreationFlowCharacter {
  name?: string;
  class?: string;
  race?: string;
  subrace?: string;
  background?: string;
  abilityMethod?: 'standard' | 'pointBuy' | 'manual' | string;
  abilities: Record<AbilityKey, number>;
  classSkillChoices?: string[];
  classFeatureChoices?: Record<string, unknown>;
  equipmentChoices?: Record<string, string>;
  bgChoices?: any;
  bgSpellChoices?: any;
  creationComplete?: boolean;
}

export interface ActiveChoiceRuleStatus {
  name: string;
  type: string;
  complete: boolean;
}

export interface BackgroundSpellSelectionStatus {
  name: string;
  selectedCantrips: number;
  requiredCantrips: number;
  selectedLevel1: number;
  requiredLevel1Spells: number;
}

export interface SpellChoiceStatus {
  selectedCantrips: number;
  requiredCantrips: number;
  selectedLeveled: number;
  requiredLeveled: number;
}

export interface CreationFlowState {
  character: CreationFlowCharacter;
  levelUpMode: boolean;
  creationChoicesLocked: boolean;
  pointBuyBudget: number;
  pointBuySpent: number;
  subraceRequired: boolean;
  backgroundStepMissing: string[];
  classSkillSelectedCount: number;
  classSkillRequiredCount: number;
  activeChoiceRules: ActiveChoiceRuleStatus[];
  backgroundSpellSelections: BackgroundSpellSelectionStatus[];
  equipmentChoiceNames: string[];
  missingLevelUpChoices: string[];
  spellChoiceStatus: SpellChoiceStatus | null;
}

export interface StepValidationResult {
  valid: boolean;
  missing: string[];
  message: string;
}

const ABILITY_LABELS: [AbilityKey, string][] = [
  ['str', 'Strength'],
  ['dex', 'Dexterity'],
  ['con', 'Constitution'],
  ['int', 'Intelligence'],
  ['wis', 'Wisdom'],
  ['cha', 'Charisma'],
];

export function validateCreationStep(step: BuilderStepId, state: CreationFlowState): StepValidationResult {
  const missing = getMissingChoicesForStep(step, state);
  return {
    valid: missing.length === 0,
    missing,
    message: missing.length ? `Ainda falta: ${missing.join(', ')}.` : '',
  };
}

export function getMissingChoicesForStep(step: BuilderStepId, state: CreationFlowState): string[] {
  if (step === 'lineage') {
    const missing: string[] = [];
    if (!state.character.name?.trim()) missing.push('nome da ficha');
    if (!state.character.class) missing.push('classe');
    if (!state.character.race) missing.push('raca/especie');
    if (state.subraceRequired && !state.character.subrace) missing.push('subraca/linhagem');
    return missing;
  }

  if (step === 'background') {
    if (!state.character.background) return ['background'];
    return state.backgroundStepMissing;
  }

  if (step === 'abilities') {
    const missing = ABILITY_LABELS
      .filter(([key]) => !Number.isFinite(Number(state.character.abilities?.[key])))
      .map(([, label]) => label);

    if ((state.character.abilityMethod ?? 'standard') === 'pointBuy' && state.pointBuySpent !== state.pointBuyBudget) {
      missing.push(`${state.pointBuyBudget - state.pointBuySpent} pontos de Point Buy`);
    }

    return missing;
  }

  if (step === 'choices') return getMissingCreationChoices(state);
  if (step === 'leveling') return [...state.missingLevelUpChoices, ...getMissingCreationChoices(state), ...getMissingSpellChoices(state)];
  return [];
}

export function getMissingCreationChoices(state: CreationFlowState): string[] {
  if (!state.levelUpMode && state.creationChoicesLocked) return [];

  const missing: string[] = [];

  if (!state.levelUpMode && !state.character.creationComplete && state.classSkillSelectedCount !== state.classSkillRequiredCount) {
    missing.push(`${state.classSkillRequiredCount} skill(s) da classe`);
  }

  state.activeChoiceRules.forEach((rule) => {
    if (!rule.complete) missing.push(rule.name);
  });

  if (!state.levelUpMode && !state.character.creationComplete) {
    state.equipmentChoiceNames.forEach((name) => missing.push(name));
  }

  return missing;
}

export function getMissingSpellChoices(state: CreationFlowState): string[] {
  if (!state.spellChoiceStatus) return [];

  const missing: string[] = [];
  if (state.spellChoiceStatus.selectedCantrips !== state.spellChoiceStatus.requiredCantrips) {
    missing.push(`${state.spellChoiceStatus.requiredCantrips} cantrip(s)`);
  }
  if (state.spellChoiceStatus.selectedLeveled !== state.spellChoiceStatus.requiredLeveled) {
    missing.push(`${state.spellChoiceStatus.requiredLeveled} magia(s) de nivel 1+`);
  }
  return missing;
}
