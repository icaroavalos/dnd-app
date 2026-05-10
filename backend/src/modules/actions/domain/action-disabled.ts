import type { DerivedAction, CharacterRecord, DerivedCharacterSheet } from '@shared/contracts';

export function isActionDisabled(
  action: Pick<DerivedAction, 'resource' | 'slotLevel' | 'source'>,
  character: CharacterRecord,
  projection: DerivedCharacterSheet
): boolean {
  if (action.resource) {
    const resource = character.resources[action.resource];
    return !resource || Number(resource.current) <= 0;
  }

  if (action.slotLevel) {
    const used = Number(character.state.spellSlotsUsed[String(action.slotLevel)] ?? 0);
    const max = Number(projection.spellSlotsMax[String(action.slotLevel)] ?? 0);
    return max <= 0 || used >= max;
  }

  if (action.source?.ammoRequired) {
    if (Number(action.source.ammoCount ?? 0) <= 0) {
      return true;
    }
  }

  if (action.source?.requiresLightWeapons) {
    return !Boolean(action.source.lightWeaponsReady);
  }

  if (action.source?.twoHandedBlocked) {
    return true;
  }

  if (action.source?.loadingBlocked) {
    return true;
  }

  return false;
}
