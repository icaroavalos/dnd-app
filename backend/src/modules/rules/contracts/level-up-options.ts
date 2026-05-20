export interface LevelUpChoice {
  id: string;
  type: 'selection' | 'subclass' | 'asi' | 'feat' | 'spell' | 'expertise' | 'generic';
  name: string;
  count: number;
  options: string[];
  featureId?: string;
  description?: string;
  subclassShortName?: string;
}

export interface LevelUpOptionsPayload {
  level: number;
  features: any[];
  choices: LevelUpChoice[];
}
