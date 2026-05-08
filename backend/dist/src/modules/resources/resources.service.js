var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
let ResourcesService = class ResourcesService {
    useResource(request) {
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
    recoverResources(request) {
        const resources = Object.fromEntries(Object.entries(request.character.resources).map(([resourceId, resourceState]) => [
            resourceId,
            recoverResourceState(resourceState, request.recovery)
        ]));
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
};
ResourcesService = __decorate([
    Injectable()
], ResourcesService);
export { ResourcesService };
function recoverResourceState(resourceState, recovery) {
    if (resourceState.recovery === 'none') {
        return resourceState;
    }
    if (recovery === 'short_rest' && resourceState.recovery !== 'short_rest') {
        return resourceState;
    }
    return {
        ...resourceState,
        current: resourceState.max
    };
}
//# sourceMappingURL=resources.service.js.map