export interface SpellcastingMetrics {
  ability: string;
  modifier: number;
  attackBonus: number;
  saveDc: number;
}

export interface SpellChoiceStatus {
  cantrips: number;
  spellsMax: number;
  totalMax: number;
  label: string;
  hint: string;
}

export interface SpellEntry {
  name: string;
  level: number;
  origin: 'class' | 'background' | 'auto';
  castMode: 'at-will' | 'slots' | 'resource';
  slotLevel: number | null;
  resourceId?: string;
  sourceLabel?: string;
}

export interface SpellResourceDefinition {
  id: string;
  name: string;
  kind: 'spell';
  sourceLabel: string;
  body: string;
  level: number;
  max: number;
  recovery: { long: 'all' };
  actionKind: 'action' | 'bonus' | 'reaction' | 'other';
}

interface BackgroundSelectedSpell {
  name: string;
  level: number;
  ruleName: string;
}
