export type DerivedActionKind =
  | 'action'
  | 'bonus'
  | 'reaction'
  | 'other'
  | 'limited'
  | 'attack';

export interface DerivedActionCost {
  economy?: DerivedActionKind | 'free';
  resource?: string;
  slotLevel?: number | null;
}

export interface DerivedAction {
  id: string;
  kind: DerivedActionKind;
  icon: string;
  name: string;
  subtitle: string;
  range: string;
  rangeLabel: string;
  hit: string;
  damage: string[];
  notes: string;
  detail: string;
  cost?: DerivedActionCost;
  resource?: string;
  slotLevel?: number | null;
  source?: Record<string, unknown>;
  disabled?: boolean;
}
