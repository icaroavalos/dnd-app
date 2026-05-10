import type { Character, ApiState } from '../../types/state.js';
import type { SubclassData, FeatureData } from '../../types/character.js';
import { getSubclassFeaturesByLevel } from '../../lib/subclass-features.js';

export function resolveSelectedSubclass(character: Character, api: ApiState): SubclassData | null {
  const subclassChoice = character.classFeatureChoices?.subclass;
  if (!subclassChoice) return null;

  const className = api.classes[character.class]?.name ?? character.class;
  const candidates = (api.source?.subclasses ?? []).filter(
    (subclass) => subclass.className === className && slugify(subclass.name) === subclassChoice
  );
  if (!candidates.length) return null;

  return [...candidates].sort(compareSubclassCandidates)[0] ?? null;
}

function compareSubclassCandidates(a: SubclassData, b: SubclassData): number {
  return scoreSubclassCandidate(b) - scoreSubclassCandidate(a);
}

function scoreSubclassCandidate(subclass: SubclassData): number {
  let score = 0;
  if (Array.isArray(subclass.subclassFeatures) && subclass.subclassFeatures.length) score += 100;
  if (subclass.source === 'XPHB') score += 10;
  if (subclass.classSource === 'XPHB') score += 5;
  return score;
}

export function resolveSubclassFeaturesForLevel(
  selectedSubclass: SubclassData | null,
  level: number,
  api: ApiState
): FeatureData[] {
  if (!selectedSubclass) return [];

  const refs = getSubclassFeaturesByLevel(selectedSubclass.subclassFeatures, level);
  const detailedFrom5etools = refs
    .map(
      (ref) =>
        (api.source?.subclassFeatures ?? []).find(
          (feature) =>
            feature.name === ref.name &&
            feature.className === ref.className &&
            feature.source === ref.source &&
            feature.subclassShortName === ref.subclassName &&
            feature.subclassSource === ref.subclassSource &&
            Number(feature.level) === ref.level
        )
    )
    .filter((feature): feature is FeatureData => Boolean(feature));

  if (detailedFrom5etools.length) {
    return expandReferencedSubclassFeatures(detailedFrom5etools, api);
  }

  return refs.map((fallback) => ({
    name: fallback.name,
    source: fallback.source,
    className: fallback.className,
    classSource: fallback.source,
    subclassShortName: fallback.subclassName,
    subclassSource: fallback.subclassSource,
    level: fallback.level,
    category: 'subclass',
    ability: [],
    prerequisite: null,
    type: 'subclass-auto',
    entries: [`You gain ${fallback.name} from ${selectedSubclass.name}.`],
    body: `You gain ${fallback.name} from ${selectedSubclass.name}.`,
  }));
}

function expandReferencedSubclassFeatures(features: FeatureData[], api: ApiState): FeatureData[] {
  return features.flatMap((feature) => {
    const refs = extractSubclassFeatureRefs(feature.entries);
    if (!refs.length) return [feature];

    const referenced = refs
      .map((ref) => findSubclassFeatureByRef(ref, api.source?.subclassFeatures ?? []))
      .filter((item): item is FeatureData => Boolean(item));

    return referenced.length ? referenced : [feature];
  });
}

function extractSubclassFeatureRefs(entries: unknown[] = []): string[] {
  return entries
    .filter(
      (entry): entry is { type?: string; subclassFeature?: string } =>
        typeof entry === 'object' && entry !== null
    )
    .filter((entry) => entry.type === 'refSubclassFeature' && typeof entry.subclassFeature === 'string')
    .map((entry) => entry.subclassFeature)
    .filter(isPresentString);
}

function findSubclassFeatureByRef(ref: string, features: FeatureData[]): FeatureData | undefined {
  const [name = '', className = '', source = '', subclassShortName = '', subclassSource = '', level = ''] =
    String(ref).split('|');
  return features.find(
    (feature) =>
      feature.name === name &&
      feature.className === className &&
      feature.source === source &&
      feature.subclassShortName === subclassShortName &&
      feature.subclassSource === subclassSource &&
      Number(feature.level) === Number(level)
  );
}

function isPresentString(value: string | undefined): value is string {
  return Boolean(value);
}

function slugify(value: string): string {
  return String(value ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}
