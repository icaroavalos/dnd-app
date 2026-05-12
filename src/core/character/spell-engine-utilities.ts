import type { Character, ApiState } from '../../types/state.js';

export function explicitSpellRefsFromText(text: string): string[] {
  return [...String(text ?? "").matchAll(/\{@spell ([^|}]+)(?:\|[^}]*)?\}/gi)]
    .map((match) => clean5etoolsText(match[1]).trim())
    .filter(Boolean);
}

export function clean5etoolsText(value: string): string {
  return String(value ?? "")
    .replace(/\{@(?:spell|item|condition|skill|sense|variantrule|filter|hazard|scaledamage|damage|feat|action|book)\s+([^|}]+)(?:\|[^}]*)?}/g, "$1")
    .replace(/\{@(?:dice|hit|d20|chance)\s+([^|}]+)(?:\|[^}]*)?}/g, "$1")
    .replace(/\{@i\s+([^}]+)}/g, "$1")
    .replace(/\{@b\s+([^}]+)}/g, "$1")
    .replace(/\{@[^}]+\}/g, "")
    .trim();
}

export function autoGrantedSpellEntries(character: Character, api: ApiState, activeFeatures: any[]) {
  if (!api) return [];
  const grants = new Map();
  const choicePattern = /(choose|choice|of your choice|of your choosing)/i;

  activeFeatures.forEach((feature) => {
    const body = String(feature.body ?? "");
    const refs = explicitSpellRefsFromText(body);
    if (!refs.length) return;
    if (choicePattern.test(body) && !/(you know|always have|prepared)/i.test(body)) return;

    const spellDetails = api.source?.spellDetails ?? {};
    refs.forEach((spellName) => {
      const spell = spellDetails[spellName.toLowerCase()];
      if (!spell?.name) return;
      grants.set(spell.name, {
        name: spell.name,
        level: Number(spell.level) || 0,
        origin: feature.name,
        sourceLabel: feature.meta,
      });
    });
  });

  return [...grants.values()].sort((a, b) => a.level - b.level || a.name.localeCompare(b.name));
}

export function spellFromKnownData(name: string, api: ApiState) {
  if (!api) return { name, level: 0 };
  const detail = api.spellDetails?.[name];
  if (detail && Number.isFinite(detail.level)) return { name, level: detail.level };

  const sourceDetail = api.source?.spellDetails?.[String(name).toLowerCase()];
  if (sourceDetail && Number.isFinite(sourceDetail.level)) {
    return { name: sourceDetail.name, level: sourceDetail.level };
  }

  return { name, level: Infinity };
}

export function resolveSelectedSpellName(selectedSpell: string, spellNames: string[]): string {
  if (selectedSpell && spellNames.includes(selectedSpell)) return selectedSpell;
  return spellNames[0] ?? '';
}

export function backgroundSpellResourceId(spellName: string): string {
  return `bgSpell:${slugify(spellName)}`;
}

function slugify(value: string): string {
  return String(value ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '')
    .trim();
}
