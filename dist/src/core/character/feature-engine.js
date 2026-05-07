/**
 * Feature Engine - Agrega todas as características (features) do personagem
 *
 * Filtra e formata features de classe, raça, background e feats baseados nas escolhas.
 */
import { RESOURCE_META, resourceRecoveryFromBody, resourceActionKindFromBody, resourceMaxFromBody } from './resource-engine.js';
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
    // Filtra opções de features não escolhidas
    const unselectedOptionNames = new Set(classChoiceRules
        .filter((rule) => Array.isArray(rule.options))
        .flatMap((rule) => rule.options
        .filter((option) => character.classFeatureChoices?.[rule.id] !== option.value)
        .map((option) => option.label)));
    return (api.source?.classFeatures ?? [])
        .filter((f) => slugify(f.className) === character.class && Number(f.level) <= character.level)
        .filter((f) => !unselectedOptionNames.has(f.name))
        .map((f) => {
        const body = f.body || f.entries?.join('\n') || '';
        const meta = RESOURCE_META.find(m => m.match.test(f.name));
        let resource;
        if (meta) {
            const recovery = resourceRecoveryFromBody(body);
            const actionKind = resourceActionKindFromBody(body);
            const max = resourceMaxFromBody(body, api, character, Number(f.level), meta);
            if ((max > 0) || Object.keys(recovery).length > 0 || actionKind) {
                resource = {
                    id: meta.id,
                    name: meta.name,
                    className: api.classes[character.class]?.name ?? character.class,
                    body,
                    level: Number(f.level) || 1,
                    max,
                    recovery,
                    actionKind,
                    isCanonical: meta.isCanonical
                };
            }
        }
        return {
            id: `class:${slugify(f.name)}:${f.level}`,
            kind: 'class',
            name: f.name,
            meta: `${className} ${f.level} • ${f.source}`,
            body,
            resource
        };
    });
}
function deriveSpeciesTraits(character, api) {
    const race = api.races[character.race];
    if (!race)
        return [];
    return (race.traits || []).map((trait) => {
        const body = trait.entries?.join('\n') || '';
        const meta = RESOURCE_META.find(m => m.match.test(trait.name));
        let resource;
        if (meta) {
            const recovery = resourceRecoveryFromBody(body);
            const actionKind = resourceActionKindFromBody(body);
            const max = resourceMaxFromBody(body, api, character, 1, meta);
            if ((max > 0) || Object.keys(recovery).length > 0 || actionKind) {
                resource = {
                    id: meta.id,
                    name: meta.name,
                    kind: 'species',
                    sourceLabel: `${race.name} • ${race.source}`,
                    body,
                    level: 1,
                    max,
                    recovery,
                    actionKind,
                    isCanonical: meta.isCanonical
                };
            }
        }
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
    // A ser implementado quando o sistema de feats estiver no TS
    return [];
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