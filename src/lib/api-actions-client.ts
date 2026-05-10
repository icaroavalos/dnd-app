/**
 * API Client para derivar actions via POST /actions/derive do backend.
 *
 * Este endpoint deriva as acoes disponiveis para um personagem
 * (ataques, magicas, recursos, etc) baseado no estado atual.
 */

import { getBaseUrl } from './api-catalog-client.js';
import type { DerivedAction, ActionEngineCharacter } from '../core/engine/action-engine.js';

export type { DerivedAction };

/**
 * Deriva as acoes disponiveis para um personagem.
 * Usa POST /actions/derive do backend.
 */
export async function deriveActions(character: ActionEngineCharacter & { id?: string; name?: string }): Promise<DerivedAction[]> {
  const response = await fetch(`${getBaseUrl()}/actions/derive`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(character),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to derive actions: ${response.statusText} - ${error}`);
  }

  return response.json();
}
