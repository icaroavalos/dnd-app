export type RulesCatalogKind =
  | 'backgrounds'
  | 'classes'
  | 'spells'
  | 'class-spells'
  | 'species'
  | 'items'
  | 'features'
  | 'feats'
  | 'subclasses'
  | 'subraces'
  | 'actions'
  | 'conditions';

export interface RulesCatalogEntry {
  id?: string;
  name: string;
  source: string;
  edition?: string;
  level?: number | string;
  className?: string;
  classSource?: string;
  subclassShortName?: string;
  entries?: any[];
  category?: string;
  type?: string;
  spells?: Array<{ name: string; source: string }>;
}

export interface RulesCatalogResponse {
  ruleset: '5.5e-2024';
  results: RulesCatalogEntry[];
}
