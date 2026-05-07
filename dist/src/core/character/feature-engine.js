/**
 * Feature Engine - Agrega todas as características (features) do personagem
 *
 * Filtra e formata features de classe, raça, background e feats baseados nas escolhas.
 */
import { RESOURCE_META, resourceRecoveryFromBody, resourceActionKindFromBody, resourceMaxFromBody } from './resource-engine.js';
import { getSubclassFeaturesByLevel } from '../../lib/subclass-features.js';
/**
 * Retorna todas as características ativas do personagem
 */
export function deriveActiveFeatures(character, api, classChoiceRules = []) {
    return [
        ...deriveClassFeatures(character, api, classChoiceRules),
        ...deriveSpeciesTraits(character, api),
        ...deriveFeatFeatures(character, api)
    ];
}
function deriveClassFeatures(character, api, classChoiceRules) {
    const className = api.classes[character.class]?.name ?? character.class;
    const selectedSubclass = resolveSelectedSubclass(character, api);
    // Filtra opções de features não escolhidas
    const unselectedOptionNames = new Set(classChoiceRules
        .filter((rule) => Array.isArray(rule.options))
        .flatMap((rule) => rule.options
        .filter((option) => character.classFeatureChoices?.[rule.id] !== option.value)
        .map((option) => option.label)));
    return (api.source?.classFeatures ?? [])
        .filter((f) => slugify(f.className) === character.class && Number(f.level) <= character.level)
        .filter((f) => !unselectedOptionNames.has(f.name))
        .flatMap((f) => mapClassFeature(f, character, api, className, selectedSubclass));
}
function deriveSpeciesTraits(character, api) {
    const race = api.races[character.race];
    if (!race)
        return [];
    return (race.traits || []).map((trait) => {
        const body = trait.entries?.join('\n') || '';
        const resource = deriveTraitResource(trait.name, body, `${race.name} • ${race.source}`, api, character);
        return {
            id: `species:${slugify(trait.name)}`,
            kind: 'species',
            name: trait.name,
            meta: `${race.name} • ${race.source}`,
            body,
            resource
        };
    });
}
function deriveFeatFeatures(character, api) {
    const features = [];
    const featDetails = api.source?.featDetails ?? {};
    // 1. Feats from ASI choices
    Object.entries(character.asiChoices ?? {}).forEach(([ruleId, choice]) => {
        if (choice?.mode === 'feat' && choice.feat) {
            const feat = featDetails[choice.feat];
            if (feat) {
                features.push(mapFeatToFeature(feat));
            }
        }
    });
    // 2. Feats from other choices (e.g. background, specific class features)
    Object.entries(character.classFeatureChoices ?? {}).forEach(([choiceId, featName]) => {
        if (choiceId.includes('feat') || choiceId.includes('magic-initiate')) {
            const feat = featDetails[featName] || featDetails[slugify(featName)];
            if (feat) {
                features.push(mapFeatToFeature(feat));
            }
        }
    });
    return features;
}
function mapFeatToFeature(feat) {
    const body = feat.body || feat.entries?.join('\n') || '';
    return {
        id: `feat:${slugify(feat.name)}`,
        kind: 'feat',
        name: feat.name,
        meta: `Feat • ${feat.source}`,
        body
    };
}
function mapClassFeature(feature, character, api, className, selectedSubclass) {
    const subclassFeatures = isSubclassPlaceholder(feature)
        ? resolveSubclassFeaturesForLevel(selectedSubclass, Number(feature.level), api)
        : [];
    const resolvedFeatures = subclassFeatures.length ? subclassFeatures : [feature];
    return resolvedFeatures.map((resolvedFeature) => {
        const resolvedName = resolvedFeature.name;
        const body = resolvedFeature.body || resolvedFeature.entries?.join('\n') || '';
        const resource = deriveFeatureResource(resolvedFeature, body, api, character);
        const meta = subclassFeatures.length
            ? `${selectedSubclass?.name} • ${resolvedFeature.source}`
            : `${className} ${feature.level} • ${feature.source}`;
        return {
            id: `class:${slugify(resolvedName)}:${feature.level}`,
            kind: 'class',
            name: resolvedName,
            meta,
            body,
            resource
        };
    });
}
function deriveFeatureResource(feature, body, api, character) {
    const meta = RESOURCE_META.find((entry) => entry.match.test(feature.name));
    const recovery = resourceRecoveryFromBody(body);
    const actionKind = resourceActionKindFromBody(body);
    const max = resourceMaxFromBody(body, api, character, Number(feature.level), meta);
    if ((max <= 0 || !Number.isFinite(max)) && Object.keys(recovery).length === 0)
        return undefined;
    return {
        id: meta?.id ?? slugify(feature.name),
        name: meta?.name ?? feature.name,
        className: api.classes[character.class]?.name ?? character.class,
        body,
        level: Number(feature.level) || 1,
        max,
        recovery,
        actionKind,
        isCanonical: meta?.isCanonical
    };
}
function deriveTraitResource(traitName, body, sourceLabel, api, character) {
    const meta = RESOURCE_META.find((entry) => entry.match.test(traitName));
    const recovery = resourceRecoveryFromBody(body);
    const actionKind = resourceActionKindFromBody(body);
    const max = resourceMaxFromBody(body, api, character, 1, meta);
    if ((max <= 0 || !Number.isFinite(max)) && Object.keys(recovery).length === 0)
        return undefined;
    return {
        id: meta?.id ?? slugify(traitName),
        name: meta?.name ?? traitName,
        kind: 'species',
        sourceLabel,
        body,
        level: 1,
        max,
        recovery,
        actionKind,
        isCanonical: meta?.isCanonical
    };
}
function resolveSelectedSubclass(character, api) {
    const subclassChoice = character.classFeatureChoices?.subclass;
    if (!subclassChoice)
        return null;
    const className = api.classes[character.class]?.name ?? character.class;
    const candidates = (api.source?.subclasses ?? []).filter((subclass) => subclass.className === className &&
        slugify(subclass.name) === subclassChoice);
    if (!candidates.length)
        return null;
    return [...candidates].sort(compareSubclassCandidates)[0] ?? null;
}
function compareSubclassCandidates(a, b) {
    return scoreSubclassCandidate(b) - scoreSubclassCandidate(a);
}
function scoreSubclassCandidate(subclass) {
    let score = 0;
    if (Array.isArray(subclass.subclassFeatures) && subclass.subclassFeatures.length)
        score += 100;
    if (subclass.source === 'XPHB')
        score += 10;
    if (subclass.classSource === 'XPHB')
        score += 5;
    return score;
}
function isPresentString(value) {
    return Boolean(value);
}
function resolveSubclassFeaturesForLevel(selectedSubclass, level, api) {
    if (!selectedSubclass)
        return [];
    const refs = getSubclassFeaturesByLevel(selectedSubclass.subclassFeatures, level);
    const detailedFrom5etools = refs
        .map((ref) => (api.source?.subclassFeatures ?? []).find((feature) => feature.name === ref.name &&
        feature.className === ref.className &&
        feature.source === ref.source &&
        feature.subclassShortName === ref.subclassName &&
        feature.subclassSource === ref.subclassSource &&
        Number(feature.level) === ref.level))
        .filter((feature) => Boolean(feature));
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
        body: `You gain ${fallback.name} from ${selectedSubclass.name}.`
    }));
}
function expandReferencedSubclassFeatures(features, api) {
    return features.flatMap((feature) => {
        const refs = extractSubclassFeatureRefs(feature.entries);
        if (!refs.length)
            return [feature];
        const referenced = refs
            .map((ref) => findSubclassFeatureByRef(ref, api.source?.subclassFeatures ?? []))
            .filter((item) => Boolean(item));
        return referenced.length ? referenced : [feature];
    });
}
function extractSubclassFeatureRefs(entries = []) {
    return entries
        .filter((entry) => typeof entry === 'object' && entry !== null)
        .filter((entry) => entry.type === 'refSubclassFeature' && typeof entry.subclassFeature === 'string')
        .map((entry) => entry.subclassFeature)
        .filter(isPresentString);
}
function findSubclassFeatureByRef(ref, features) {
    const [name = '', className = '', source = '', subclassShortName = '', subclassSource = '', level = ''] = String(ref).split('|');
    return features.find((feature) => feature.name === name &&
        feature.className === className &&
        feature.source === source &&
        feature.subclassShortName === subclassShortName &&
        feature.subclassSource === subclassSource &&
        Number(feature.level) === Number(level));
}
function isSubclassPlaceholder(feature) {
    return /subclass/i.test(feature.name);
}
function slugify(value) {
    return String(value ?? "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
}
//# sourceMappingURL=feature-engine.js.map