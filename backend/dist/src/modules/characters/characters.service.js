var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
import { Inject, Injectable } from '@nestjs/common';
import { RulesService } from '../rules/rules.service.js';
const SKILL_TO_ABILITY = {
    Athletics: 'str',
    Acrobatics: 'dex',
    'Sleight of Hand': 'dex',
    Stealth: 'dex',
    Arcana: 'int',
    History: 'int',
    Investigation: 'int',
    Nature: 'int',
    Religion: 'int',
    'Animal Handling': 'wis',
    Insight: 'wis',
    Medicine: 'wis',
    Perception: 'wis',
    Survival: 'wis',
    Deception: 'cha',
    Intimidation: 'cha',
    Performance: 'cha',
    Persuasion: 'cha'
};
let CharactersService = class CharactersService {
    rulesService;
    constructor(rulesService) {
        this.rulesService = rulesService;
    }
    async projectCharacter(character) {
        const [classesCatalog, itemsCatalog] = await Promise.all([
            this.rulesService.getCatalog('classes'),
            this.rulesService.getCatalog('items')
        ]);
        const totalLevel = Math.max(1, character.classes.reduce((sum, current) => sum + Math.max(0, Number(current.level) || 0), 0));
        const proficiencyBonus = Math.ceil(totalLevel / 4) + 1;
        const abilityScores = deriveAbilityScores(character);
        const abilityModifiers = deriveAbilityModifiers(abilityScores);
        const savingThrows = deriveSavingThrows(abilityScores, character.savingThrowProficiencies, proficiencyBonus);
        const skillBonuses = deriveSkillBonuses(abilityModifiers, character.skillProficiencies, proficiencyBonus);
        const primaryClass = resolvePrimaryClass(character, classesCatalog.results);
        const hitDie = normalizeHitDie(primaryClass?.hitDie);
        const maxHp = character.state.maxHpOverride ??
            Math.max(1, hitDie + abilityModifiers.con) +
                Math.max(0, totalLevel - 1) * Math.max(1, Math.floor(hitDie / 2) + 1 + abilityModifiers.con);
        const spellcasting = deriveSpellcasting(character, primaryClass, proficiencyBonus, abilityModifiers);
        const armorClass = deriveArmorClass(character, abilityModifiers, itemsCatalog.results);
        return {
            ruleset: character.ruleset,
            level: totalLevel,
            proficiencyBonus,
            abilityScores,
            abilityModifiers,
            savingThrows,
            skillBonuses,
            armorClass,
            initiative: abilityModifiers.dex,
            speed: 30,
            maxHp,
            currentHp: character.state.hp,
            tempHp: character.state.tempHp,
            passivePerception: 10 + (skillBonuses.Perception ?? abilityModifiers.wis),
            spellcasting,
            spellSlotsMax: deriveSpellSlotsMax(primaryClass, totalLevel),
            resources: character.resources
        };
    }
};
CharactersService = __decorate([
    Injectable(),
    __param(0, Inject(RulesService)),
    __metadata("design:paramtypes", [RulesService])
], CharactersService);
export { CharactersService };
function deriveArmorClass(character, abilityModifiers, itemEntries) {
    const itemLookup = new Map(itemEntries.map((entry) => [slugify(entry.name), entry]));
    const equippedArmor = character.inventory
        .filter((item) => item.status === 'equipped_armor')
        .map((item) => itemLookup.get(slugify(item.baseItemId)))
        .find((entry) => Boolean(entry));
    const equippedShield = character.inventory
        .filter((item) => item.status === 'equipped_shield')
        .map((item) => itemLookup.get(slugify(item.baseItemId)))
        .find((entry) => Boolean(entry));
    const baseArmorClass = resolveBaseArmorClass(equippedArmor, abilityModifiers.dex);
    const shieldBonus = Number(equippedShield?.ac ?? 0);
    return baseArmorClass + shieldBonus;
}
function resolveBaseArmorClass(armor, dexModifier) {
    if (!armor) {
        return 10 + dexModifier;
    }
    const armorType = String(armor.type ?? '').split('|')[0];
    const armorBase = Number(armor.ac ?? 10);
    switch (armorType) {
        case 'LA':
            return armorBase + dexModifier;
        case 'MA':
            return armorBase + Math.min(dexModifier, 2);
        case 'HA':
            return armorBase;
        default:
            return armorBase + dexModifier;
    }
}
function deriveAbilityScores(character) {
    const assignments = character.backgroundChoices?.abilityAssignments;
    return {
        str: clamp(character.abilities.str + (assignments?.str ?? 0)),
        dex: clamp(character.abilities.dex + (assignments?.dex ?? 0)),
        con: clamp(character.abilities.con + (assignments?.con ?? 0)),
        int: clamp(character.abilities.int + (assignments?.int ?? 0)),
        wis: clamp(character.abilities.wis + (assignments?.wis ?? 0)),
        cha: clamp(character.abilities.cha + (assignments?.cha ?? 0))
    };
}
function deriveAbilityModifiers(scores) {
    return {
        str: modifier(scores.str),
        dex: modifier(scores.dex),
        con: modifier(scores.con),
        int: modifier(scores.int),
        wis: modifier(scores.wis),
        cha: modifier(scores.cha)
    };
}
function deriveSavingThrows(scores, proficientSaves, proficiencyBonus) {
    const saveSet = new Set(proficientSaves.map((value) => String(value).toLowerCase()));
    return {
        str: modifier(scores.str) + (saveSet.has('str') ? proficiencyBonus : 0),
        dex: modifier(scores.dex) + (saveSet.has('dex') ? proficiencyBonus : 0),
        con: modifier(scores.con) + (saveSet.has('con') ? proficiencyBonus : 0),
        int: modifier(scores.int) + (saveSet.has('int') ? proficiencyBonus : 0),
        wis: modifier(scores.wis) + (saveSet.has('wis') ? proficiencyBonus : 0),
        cha: modifier(scores.cha) + (saveSet.has('cha') ? proficiencyBonus : 0)
    };
}
function deriveSkillBonuses(abilityModifiers, proficientSkills, proficiencyBonus) {
    const skillSet = new Set(proficientSkills.map((value) => value.toLowerCase()));
    const result = {};
    for (const [skill, ability] of Object.entries(SKILL_TO_ABILITY)) {
        result[skill] =
            abilityModifiers[ability] + (skillSet.has(skill.toLowerCase()) ? proficiencyBonus : 0);
    }
    return result;
}
function resolvePrimaryClass(character, classEntries) {
    const primary = character.classes[0];
    if (!primary)
        return undefined;
    const classId = slugify(primary.classId);
    return classEntries.find((entry) => slugify(entry.name) === classId);
}
function deriveSpellcasting(character, primaryClass, proficiencyBonus, abilityModifiers) {
    const spellChoiceAbility = character.spellChoices[0]?.spellcastingAbility;
    const ability = spellChoiceAbility ?? primaryClass?.spellcastingAbility ?? null;
    if (!ability) {
        return null;
    }
    const modifierValue = abilityModifiers[ability];
    return {
        ability,
        attackBonus: proficiencyBonus + modifierValue,
        saveDc: 8 + proficiencyBonus + modifierValue
    };
}
function deriveSpellSlotsMax(primaryClass, level) {
    const rows = primaryClass?.classTableGroups?.find((group) => Array.isArray(group.rowsSpellProgression))
        ?.rowsSpellProgression;
    if (!Array.isArray(rows)) {
        return {};
    }
    const row = rows[Math.max(0, level - 1)];
    if (!Array.isArray(row)) {
        return {};
    }
    return Object.fromEntries(row
        .map((value, index) => [String(index + 1), Number(value) || 0])
        .filter(([, value]) => value > 0));
}
function normalizeHitDie(hitDie) {
    if (typeof hitDie === 'number')
        return hitDie;
    if (typeof hitDie === 'string')
        return Number(String(hitDie).replace(/^d/i, '')) || 8;
    return 8;
}
function slugify(value) {
    return String(value)
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
}
function modifier(score) {
    return Math.floor((Number(score) - 10) / 2);
}
function clamp(score) {
    return Math.max(1, Math.min(30, Number(score) || 10));
}
//# sourceMappingURL=characters.service.js.map