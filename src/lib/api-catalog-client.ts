/**
 * API Client para consumir endpoints read-only de catálogo do backend.
 *
 * Endpoints disponíveis:
 * - /rules/backgrounds
 * - /rules/classes
 * - /rules/spells
 * - /rules/class-spells
 * - /rules/species
 * - /rules/items
 * - /rules/features
 * - /rules/feats
 */

export const getBaseUrl = (): string => {
  // Suporte a Vite e variável global
  if (typeof process !== 'undefined' && process.env?.VITE_API_URL) {
    return process.env.VITE_API_URL;
  }
  // Fallback para import.meta.env (Vite)
  try {
    // @ts-ignore - import.meta.env pode não estar definido
    const env = import.meta?.env;
    if (env?.VITE_API_URL) {
      return env.VITE_API_URL;
    }
  } catch {
    // Ignora se não tiver import.meta.env
  }
  return 'http://localhost:3000';
};

const BASE_URL = getBaseUrl();

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
  | 'feats';

/**
 * Busca catálogo pelo tipo.
 */
export async function getCatalog(type: CatalogType): Promise<CatalogResponse> {
  const response = await fetch(`${BASE_URL}/rules/${type}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch catalog ${type}: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Busca backgrounds.
 */
export async function getBackgrounds(): Promise<CatalogResponse> {
  return getCatalog('backgrounds');
}

/**
 * Busca classes.
 */
export async function getClasses(): Promise<CatalogResponse> {
  return getCatalog('classes');
}

/**
 * Busca spells.
 */
export async function getSpells(): Promise<CatalogResponse> {
  return getCatalog('spells');
}

/**
 * Busca class-spells.
 */
export async function getClassSpells(): Promise<CatalogResponse> {
  return getCatalog('class-spells');
}

/**
 * Busca species (linhagens).
 */
export async function getSpecies(): Promise<CatalogResponse> {
  return getCatalog('species');
}

/**
 * Busca items.
 */
export async function getItems(): Promise<CatalogResponse> {
  return getCatalog('items');
}

/**
 * Busca features.
 */
export async function getFeatures(): Promise<CatalogResponse> {
  return getCatalog('features');
}

/**
 * Busca feats.
 */
export async function getFeats(): Promise<CatalogResponse> {
  return getCatalog('feats');
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
