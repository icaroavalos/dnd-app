/**
 * State Management Module
 *
 * Exporta funçoes de gerenciamento de estado
 */

export {
  loadState,
  saveState,
  createDefaultCharacter,
  isCharacterComplete,
  createEmptyState,
} from './state-manager';

export {
  ALIGNMENT_OPTIONS,
  DEFAULT_CREATION_BACKGROUNDS,
  updateCreationField,
  applyBackgroundStepSelection,
} from './creation-form-controller';

export {
  CREATION_STEPS,
  validateCreationStep,
  getMissingChoicesForStep,
  getMissingCreationChoices,
  getMissingSpellChoices,
} from './creation-flow';
