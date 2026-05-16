import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';

import type {
  CharacterRecord,
  CharacterResourceState,
  RecoveryType
} from '@shared/contracts';
import {
  type UseResourceRequestDto,
  type RecoverResourcesRequestDto
} from './dto/index.js';

@Injectable()
export class ResourcesService {
  useResource(request: UseResourceRequestDto): CharacterRecord {
    const amount = Math.max(1, Math.floor(request.amount ?? 1));
    const resource = request.character.resources[request.resourceId];

    if (!resource) {
      throw new NotFoundException({
        code: 'RESOURCE_NOT_FOUND',
        message: `Resource "${request.resourceId}" does not exist on this character.`
      });
    }

    if (resource.current < amount) {
      throw new ConflictException({
        code: 'RESOURCE_UNAVAILABLE',
        message: `Resource "${request.resourceId}" does not have enough uses remaining.`
      });
    }

    return {
      ...request.character,
      resources: {
        ...request.character.resources,
        [request.resourceId]: {
          ...resource,
          current: Math.max(0, resource.current - amount)
        }
      }
    };
  }

  recoverResources(request: RecoverResourcesRequestDto): CharacterRecord {
    const resources = Object.fromEntries(
      Object.entries(request.character.resources).map(([resourceId, resourceState]) => [
        resourceId,
        recoverResourceState(resourceState, request.recovery)
      ])
    );

    const shouldResetSpellSlots = request.recovery === 'long_rest';
    const shouldResetHitDice = request.recovery === 'long_rest';

    return {
      ...request.character,
      resources,
      state: {
        ...request.character.state,
        spellSlotsUsed: shouldResetSpellSlots ? {} : request.character.state.spellSlotsUsed,
        hitDiceUsed: shouldResetHitDice ? 0 : request.character.state.hitDiceUsed
      }
    };
  }
}

function recoverResourceState(
  resourceState: CharacterResourceState,
  recovery: Extract<RecoveryType, 'short_rest' | 'long_rest'>
): CharacterResourceState {
  if (resourceState.recovery === 'none') {
    return resourceState;
  }

  if (recovery === 'short_rest' && resourceState.recovery !== 'short_rest') {
    return resourceState;
  }

  const recoveryAmount = Number((resourceState as CharacterResourceState & { recoveryAmount?: number }).recoveryAmount);
  if (recovery === 'short_rest' && recoveryAmount > 0) {
    return {
      ...resourceState,
      current: Math.min(resourceState.max, resourceState.current + recoveryAmount)
    };
  }

  return {
    ...resourceState,
    current: resourceState.max
  };
}
