export type RulesCatalogKind =
  | 'backgrounds'
  | 'classes'
  | 'spells'
  | 'class-spells'
  | 'species'
  | 'items'
  | 'features'
  | 'feats'
  | 'subraces';

export interface RulesCatalogEntry {
  name: string;
  source: string;
  edition?: string;
  level?: number;
  className?: string;
  classSource?: string;
  subclassShortName?: string;
  spells?: Array<{ name: string; source: string }>;
}

export interface RulesCatalogResponse {
  ruleset: '5.5e-2024';
  results: RulesCatalogEntry[];
}
