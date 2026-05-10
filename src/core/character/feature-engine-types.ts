import type { ResourceDefinition } from './resource-engine.js';

export interface CharacterFeature {
  id: string;
  kind: 'class' | 'species' | 'background' | 'feat';
  name: string;
  meta: string;
  body: string;
  resource?: ResourceDefinition;
}

export type { ResourceDefinition };
