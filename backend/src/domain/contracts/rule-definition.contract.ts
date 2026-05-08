import type { RulesetId } from './base.contract.js';

export type RuleDefinitionKind =
  | 'class'
  | 'species'
  | 'background'
  | 'spell'
  | 'feature'
  | 'item'
  | 'feat'
  | 'condition';

export interface RuleDefinition {
  id: string;
  kind: RuleDefinitionKind;
  name: string;
  source: string;
  ruleset: RulesetId;
  tags: string[];
}
