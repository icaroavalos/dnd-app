/**
 * Character Module
 *
 * Exports all character-related functionality including backgrounds
 */

export * from './character-abilities';
export * from './background-loader';
export * from './background-parser';
export * from './background-rules';
export * from './background-choices';

// Re-export types
export type {
  RawBackground,
  ParsedBackground,
  EquipmentOption,
  EquipmentItem,
  BackgroundRule,
  BackgroundChoiceState,
} from '../../types/background';