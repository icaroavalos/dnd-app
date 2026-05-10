/**
 * @deprecated Use backend projection via `projectCharacter()`.
 * Backend: POST /characters/project
 */
export function deriveProficiencyBonus(level) {
    return Math.ceil((Number(level) || 1) / 4) + 1;
}
const ABILITY_KEYS = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
/**
 * @deprecated Use backend projection via `projectCharacter()`.
 * Backend: POST /characters/project
 */
export function deriveAbilityScores(baseScores, bonuses = {}) {
    return {
        str: clamp((Number(baseScores.str) || 10) + (Number(bonuses.str) || 0), 1, 30),
        dex: clamp((Number(baseScores.dex) || 10) + (Number(bonuses.dex) || 0), 1, 30),
        con: clamp((Number(baseScores.con) || 10) + (Number(bonuses.con) || 0), 1, 30),
        int: clamp((Number(baseScores.int) || 10) + (Number(bonuses.int) || 0), 1, 30),
        wis: clamp((Number(baseScores.wis) || 10) + (Number(bonuses.wis) || 0), 1, 30),
        cha: clamp((Number(baseScores.cha) || 10) + (Number(bonuses.cha) || 0), 1, 30),
    };
}
/**
 * @deprecated Use backend projection via `projectCharacter()`.
 * Backend: POST /characters/project
 */
export function deriveAbilityModifier(score) {
    return Math.floor(((Number(score) || 10) - 10) / 2);
}
/**
 * @deprecated Use backend projection via `projectCharacter()`.
 * Backend: POST /characters/project
 */
export function deriveSpellcastingMetrics(ability, abilityScores, proficiencyBonus) {
    const normalizedAbility = normalizeAbility(ability);
    const score = clamp(Number(abilityScores[normalizedAbility]) || 10, 1, 30);
    const modifier = deriveAbilityModifier(score);
    return {
        ability: normalizedAbility,
        score,
        modifier,
        attackBonus: proficiencyBonus + modifier,
        saveDc: 8 + proficiencyBonus + modifier,
    };
}
export function deriveLevelOneMaxHp(hitDie, constitutionScore) {
    return Math.max(1, (Number(hitDie) || 8) + deriveAbilityModifier(constitutionScore));
}
/**
 * @deprecated Use backend projection via `projectCharacter()`.
 * Backend: POST /characters/project
 */
export function deriveMaxHp(level, hitDie, constitutionModifier) {
    const first = Math.max(1, hitDie + constitutionModifier);
    const later = Math.max(1, Math.floor(hitDie / 2) + 1 + constitutionModifier);
    return first + Math.max(0, level - 1) * later;
}
export function calculateFixedHpGain(hitDie, constitutionModifier) {
    return Math.max(1, Math.floor(hitDie / 2) + 1 + constitutionModifier);
}
export function calculateMaxHpGain(hitDie, constitutionModifier) {
    return Math.max(1, hitDie + constitutionModifier);
}
/**
 * @deprecated Use backend projection via `projectCharacter()`.
 * Backend: POST /characters/project
 */
export function deriveSavingThrowBonus(abilityScore, proficient, proficiencyBonus) {
    return deriveAbilityModifier(abilityScore) + (proficient ? proficiencyBonus : 0);
}
export function signed(value) {
    return value >= 0 ? `+${value}` : `${value}`;
}
function normalizeAbility(value) {
    return ABILITY_KEYS.includes(value) ? value : 'int';
}
function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}
/**
 * Verifica se as regras foram carregadas
 */
export function hasLoadedRulesCore(api) {
    return Boolean(api.source?.classFeatures?.length && Object.keys(api.classes ?? {}).length);
}
/**
 * Obtém a linha do nível atual
 */
export function getCurrentLevelRow(levels, className, level) {
    const classLevels = levels[className];
    if (!Array.isArray(classLevels))
        return undefined;
    return classLevels.find((l) => l.level === level);
}
/**
 * Obtém o rule de class skill
 */
export function getClassSkillRule(className, api_classes, skills) {
    const skillChoice = api_classes[className]?.startingProficiencies?.skills?.find((entry) => entry.choose?.from);
    if (skillChoice) {
        return {
            choose: skillChoice.choose.count ?? 1,
            options: skillChoice.choose.from.map((skill) => skillNameFromSlug(skill, skills)),
        };
    }
    const apiChoice = api_classes[className]?.proficiency_choices?.find((choice) => choice.type === "proficiencies" && optionNames(choice).some((name) => name.startsWith("Skill:")));
    if (apiChoice) {
        return {
            choose: apiChoice.choose,
            options: optionNames(apiChoice)
                .filter((name) => name.startsWith("Skill:"))
                .map((name) => name.replace("Skill: ", "")),
        };
    }
    return { choose: 0, options: [] };
}
/**
 * Obtém as skill proficiencies de um background
 */
export function getBackgroundSkillProficiencies(backgroundName, backgroundDetails, skills) {
    const name = String(backgroundName || "").toLowerCase();
    const background = backgroundDetails[name];
    if (!background)
        return [];
    const profs = [];
    const skillGroups = background.skillProficiencies ?? [];
    for (const group of skillGroups) {
        if (!group || typeof group !== "object")
            continue;
        for (const [slug, enabled] of Object.entries(group)) {
            if (enabled === true) {
                profs.push(skillNameFromSlug(slug, skills));
            }
        }
    }
    return [...new Set(profs)];
}
/**
 * @deprecated Use backend projection via `projectCharacter()`.
 * Backend: POST /characters/project
 */
export function optionNames(choice) {
    const from = choice?.from;
    if (!from || from.option_set_type !== 'options_array')
        return [];
    return (from.options ?? []).map((option) => {
        if (option.option_type === 'reference')
            return option.item?.name;
        if (option.option_type === 'counted_reference')
            return option.of?.name;
        return option.item?.name ?? option.choice?.desc ?? option.string;
    }).filter(Boolean);
}
/**
 * Default saving throws por classe
 * @deprecated Use backend projection via `projectCharacter()`.
 * Backend: POST /characters/project
 */
export function getDefaultSaves(className) {
    const saves = {
        barbarian: ['str', 'con'],
        bard: ['dex', 'cha'],
        cleric: ['wis', 'cha'],
        druid: ['int', 'wis'],
        fighter: ['str', 'con'],
        monk: ['str', 'dex'],
        paladin: ['wis', 'cha'],
        ranger: ['str', 'dex'],
        rogue: ['dex', 'int'],
        sorcerer: ['con', 'cha'],
        warlock: ['wis', 'cha'],
        wizard: ['int', 'wis'],
    };
    return saves[className] ?? ['str', 'dex'];
}
/**
 * @deprecated Use backend projection via `projectCharacter()`.
 * Backend: POST /characters/project
 */
export function isStandardArrayPermutation(abilities, standardArray) {
    const current = Object.values(abilities).map(Number).sort((a, b) => a - b);
    const expected = [...standardArray].sort((a, b) => a - b);
    return current.join(',') === expected.join(',');
}
/**
 * Normaliza nome de skill a partir de slug
 * @deprecated Use backend projection via `projectCharacter()`.
 * Backend: POST /characters/project
 */
export function skillNameFromSlug(value, skills) {
    const normalized = String(value).toLowerCase();
    return skills.find(([name]) => slugifyName(name) === slugifyName(normalized))?.[0] ?? titleCase(normalized);
}
export function getSubracesFor(raceName, races) {
    const key = slugifyName(raceName);
    const raceData = races[key];
    if (!raceData)
        return [];
    return raceData.subraces?.map((s) => s.name) ?? [];
}
export function getDefaultSubrace(raceName, races) {
    const subraces = getSubracesFor(raceName, races);
    return subraces[0] ?? '';
}
/**
 * Calcula bônus de cantrip de class features
 * @deprecated Use backend projection via `projectCharacter()`.
 * Backend: POST /characters/project
 */
export function getClassFeatureCantripBonus(className, classFeatureChoices) {
    let bonus = 0;
    if (className === 'druid' && classFeatureChoices['primal-order'] === 'magician')
        bonus += 1;
    if (className === 'cleric' && classFeatureChoices['divine-order'] === 'thaumaturge')
        bonus += 1;
    return bonus;
}
/**
 * Slugify helper
 */
function slugifyName(value) {
    return String(value || '')
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');
}
/**
 * Title case helper
 */
function titleCase(value) {
    if (!value)
        return '';
    return value.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
}
//# sourceMappingURL=character-engine.js.map