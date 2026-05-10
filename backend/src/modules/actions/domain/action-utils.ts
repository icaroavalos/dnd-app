import type { CharacterRecord } from '@shared/contracts';
import { slugify } from './utils.js';

interface ClassSpellListEntry {
  className?: string;
  classSource?: string;
  spells?: Array<{ name: string; source: string }>;
}

export function resolveClassSpellNames(
  character: CharacterRecord,
  classSpellEntries: ClassSpellListEntry[]
): Set<string> {
  const primaryClass = slugify(character.classes[0]?.classId ?? '');
  const entry = classSpellEntries.find((candidate) => slugify(candidate.className ?? '') === primaryClass);
  return new Set((entry?.spells ?? []).map((spell) => slugify(spell.name)));
}
