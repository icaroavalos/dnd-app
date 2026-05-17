import { apiClient } from './api-client';

export interface CatalogEntry {
  id: string;
  name: string;
  source: string;
  page?: number;
  rules?: any;
  [key: string]: any;
}

export interface CatalogResponse {
  results: CatalogEntry[];
  total: number;
  source: string;
}

export type CatalogType =
  | 'backgrounds'
  | 'classes'
  | 'spells'
  | 'class-spells'
  | 'species'
  | 'items'
  | 'features'
  | 'subraces'
  | 'feats'
  | 'actions'
  | 'conditions';

export class CatalogError extends Error {
  constructor(public type: CatalogType, message: string, public cause?: any) {
    super(message);
    this.name = 'CatalogError';
  }
}

/**
 * Busca catálogo pelo tipo.
 */
export async function getCatalog(type: CatalogType): Promise<CatalogResponse> {
  try {
    const response = await apiClient.get<CatalogResponse>(`/rules/${type}`);
    // Adiciona IDs estáveis se não existirem
    response.data.results = response.data.results.map((entry) => ({
      ...entry,
      id: entry.id || `${entry.name}|${entry.source}`.toLowerCase().replace(/\s+/g, '-')
    }));
    return response.data;
  } catch (error: any) {
    throw new CatalogError(
      type,
      `Erro ao buscar catálogo de ${type}: ${error.message}`,
      error
    );
  }
}

export const getBackgrounds = () => getCatalog('backgrounds');
export const getClasses = () => getCatalog('classes');
export const getSpells = () => getCatalog('spells');
export const getClassSpells = () => getCatalog('class-spells');
export const getSpecies = () => getCatalog('species');
export const getItems = () => getCatalog('items');
export const getFeatures = () => getCatalog('features');
export const getFeats = () => getCatalog('feats');
export const getSubraces = () => getCatalog('subraces');
export const getActions = () => getCatalog('actions');
export const getConditions = () => getCatalog('conditions');

export async function getLevelUpOptions(className: string, level: number): Promise<any> {
  const response = await apiClient.get(`/rules/level-up-options`, {
    params: { className, level }
  });
  return response.data;
}

/**
 * Busca um item específico do catálogo.
 */
export function getCatalogEntry(catalog: CatalogResponse, id: string): CatalogEntry | undefined {
  return catalog.results.find(entry => entry.id === id);
}

/**
 * Filtra entradas do catálogo por nome (case-insensitive).
 */
export function filterCatalogByName(catalog: CatalogResponse, search: string): CatalogEntry[] {
  const lowerSearch = search.toLowerCase();
  return catalog.results.filter(entry =>
    entry.name?.toLowerCase().includes(lowerSearch)
  );
}
