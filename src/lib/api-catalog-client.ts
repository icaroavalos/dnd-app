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
 *
 * Fallback: Se o backend estiver indisponível, usa dados locais de data/5etools/5e-2024.
 */

export const getBaseUrl = (): string => {
  // Suporte a Vite e variável global
  if (typeof process !== 'undefined' && process.env?.VITE_API_URL) {
    return process.env.VITE_API_URL;
  }
  // Suporte a import.meta.env (Vite)
  try {
    // @ts-ignore - import.meta.env pode não estar definido
    const env = import.meta?.env;
    if (env?.VITE_API_URL) {
      return env.VITE_API_URL;
    }
  } catch {
    // Ignora se não tiver import.meta.env
  }
  // Default: backend local NestJS na porta 3100
  return 'http://localhost:3100';
};

const BASE_URL = getBaseUrl();

// Dados locais em fallback (carregados sob demanda)
let localDataCache: Record<string, any> | null = null;

async function loadLocalData(): Promise<Record<string, any>> {
  if (localDataCache) {
    return localDataCache;
  }

  try {
    // Tenta carregar do módulo de dados locais
    const modules = {
      backgrounds: () => import('../../data/5etools/5e-2024/backgrounds.json'),
      classes: () => import('../../data/5etools/5e-2024/classes.json'),
      spells: () => import('../../data/5etools/5e-2024/spells.json'),
      'class-spells': () => import('../../data/5etools/5e-2024/class-spells.json'),
      species: () => import('../../data/5etools/5e-2024/races.json'),
      items: () => import('../../data/5etools/5e-2024/equipment.json'),
      features: () => import('../../data/5etools/5e-2024/class-features.json'),
      feats: () => import('../../data/5etools/5e-2024/feats.json'),
    };

    const results: Record<string, any> = {};
    for (const [key, loader] of Object.entries(modules)) {
      try {
        const data = await loader();
        results[key] = data.default || data;
      } catch {
        // Dados locais não disponíveis para este catálogo
        results[key] = { results: [] };
      }
    }
    localDataCache = results;
    return results;
  } catch {
    return {};
  }
}

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
 * Busca catálogo pelo tipo com fallback para dados locais.
 */
export async function getCatalog(type: CatalogType): Promise<CatalogResponse> {
  // Tenta buscar do backend
  try {
    const response = await fetch(`${BASE_URL}/rules/${type}`, {
      // Timeout de 5 segundos
      signal: AbortSignal.timeout(5000),
    });

    if (response.ok) {
      return response.json();
    }
  } catch (error) {
    // Backend indisponível, usa fallback local
    console.warn(`Backend indisponível para ${type}, usando fallback local:`, error);
  }

  // Fallback: dados locais
  const localData = await loadLocalData();
  const data = localData[type];

  if (data?.results) {
    return {
      results: data.results,
      total: data.results.length,
      source: 'local-fallback',
    };
  }

  // Sem dados locais disponíveis
  return {
    results: [],
    total: 0,
    source: 'none',
  };
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
