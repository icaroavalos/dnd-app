/**
 * API Client para derivar actions via POST /actions/derive do backend.
 *
 * Este endpoint deriva as acoes disponiveis para um personagem
 * (ataques, magicas, recursos, etc) baseado no estado atual.
 *
 * Sem fallback local: requer backend disponível.
 */

import { getBaseUrl } from './api-catalog-client.js';
import type { DerivedAction, ActionEngineCharacter } from '../core/engine/action-engine.js';

export type { DerivedAction };

export class ActionDerivationError extends Error {
  name = 'ActionDerivationError';

  constructor(message: string, public cause?: Error) {
    super(message);
  }
}

/**
 * Deriva as acoes disponiveis para um personagem.
 * Usa POST /actions/derive do backend.
 * Requer backend disponível - lança ActionDerivationError se falhar.
 */
export async function deriveActions(
  character: ActionEngineCharacter & { id?: string; name?: string }
): Promise<DerivedAction[]> {
  let response: Response;
  try {
    response = await fetch(`${getBaseUrl()}/actions/derive`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(character),
    });
  } catch (error) {
    throw new ActionDerivationError(
      `Backend indisponível para derivar ações. Certifique-se de que o backend está rodando.`,
      error instanceof Error ? error : undefined
    );
  }

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'unknown error');
    throw new ActionDerivationError(
      `Falha ao derivar ações: ${response.status} ${response.statusText} - ${errorText}`
    );
  }

  return response.json();
}
