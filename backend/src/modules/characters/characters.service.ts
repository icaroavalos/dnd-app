import { BadRequestException, Inject, Injectable } from '@nestjs/common';

import type {
  AbilityKey,
  AbilityScoreMap,
  CharacterRecord,
  DerivedCharacterSheet,
  DerivedSpellcasting
} from '@shared/contracts';
import type { RulesCatalogEntry } from '../rules/contracts/rules-catalog-entry.js';
import { RulesService } from '../rules/rules.service.js';

const SKILL_TO_ABILITY: Record<string, AbilityKey> = {
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

interface ClassCatalogEntry extends RulesCatalogEntry {
  hitDie?: string | number;
  spellcastingAbility?: AbilityKey;
  classTableGroups?: Array<{
    rowsSpellProgression?: number[][];
  }>;
}

interface ItemCatalogEntry extends RulesCatalogEntry {
  type?: string;
  ac?: number;
}

@Injectable()
export class CharactersService {
  constructor(
    @Inject(RulesService)
    private readonly rulesService: RulesService
  ) {}

  async projectCharacter(character: CharacterRecord): Promise<DerivedCharacterSheet> {
    if (!character || !Array.isArray(character.classes) || character.classes.length === 0) {
      throw new BadRequestException('Character must have at least one class entry');
    }

    const [classesCatalog, itemsCatalog] = await Promise.all([
      this.rulesService.getCatalog('classes'),
      this.rulesService.getCatalog('items')
    ]);
    const totalLevel = Math.max(
      1,
      (character.classes ?? []).reduce((sum, current) => sum + Math.max(0, Number(current.level) || 0), 0)
    );
    const proficiencyBonus = Math.ceil(totalLevel / 4) + 1;
    const abilityScores = deriveAbilityScores(character);
    const abilityModifiers = deriveAbilityModifiers(abilityScores);
    const savingThrows = deriveSavingThrows(
      abilityScores,
      character.savingThrowProficiencies ?? [],
      proficiencyBonus
    );
    const skillBonuses = deriveSkillBonuses(
      abilityModifiers,
      character.skillProficiencies ?? [],
      proficiencyBonus
    );

    const classResults = (classesCatalog as any)?.results ?? [];
    const itemResults = (itemsCatalog as any)?.results ?? [];

    const primaryClass = resolvePrimaryClass(character, classResults as ClassCatalogEntry[]);
    const hitDie = normalizeHitDie(primaryClass?.hitDie);
    const state = character.state ?? { hp: 10, tempHp: 0, hitDiceUsed: 0, spellSlotsUsed: {}, activeConditions: [] };
    const maxHp =
      state.maxHpOverride ??
      Math.max(1, hitDie + abilityModifiers.con) +
        Math.max(0, totalLevel - 1) * Math.max(1, Math.floor(hitDie / 2) + 1 + abilityModifiers.con);
    const spellcasting = deriveSpellcasting(
      character,
      primaryClass,
      proficiencyBonus,
      abilityModifiers
    );
    const armorClass = deriveArmorClass(
      character,
      abilityModifiers,
      itemResults as ItemCatalogEntry[]
    );

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
      currentHp: state.hp,
      tempHp: state.tempHp,
      passivePerception: 10 + (skillBonuses.Perception ?? abilityModifiers.wis),
      spellcasting,
      spellSlotsMax: deriveSpellSlotsMax(primaryClass, totalLevel),
      resources: character.resources ?? {}
    };
  }
}

function deriveArmorClass(
  character: CharacterRecord,
  abilityModifiers: AbilityScoreMap,
  itemEntries: ItemCatalogEntry[]
): number {
  const items = itemEntries ?? [];
  const inventory = character.inventory ?? [];
  const itemLookup = new Map(items.map((entry) => [slugify(entry.name), entry]));
  const equippedArmor = inventory
    .filter((item) => item.status === 'equipped_armor')
    .map((item) => itemLookup.get(slugify(item.baseItemId)))
    .find((entry): entry is ItemCatalogEntry => Boolean(entry));
  const equippedShield = inventory
    .filter((item) => item.status === 'equipped_shield')
    .map((item) => itemLookup.get(slugify(item.baseItemId)))
    .find((entry): entry is ItemCatalogEntry => Boolean(entry));

  const baseArmorClass = resolveBaseArmorClass(equippedArmor, abilityModifiers.dex);
  const shieldBonus = Number(equippedShield?.ac ?? 0);

  return baseArmorClass + shieldBonus;
}

function resolveBaseArmorClass(
  armor: ItemCatalogEntry | undefined,
  dexModifier: number
): number {
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

function deriveAbilityScores(character: CharacterRecord): AbilityScoreMap {
  const assignments = character.backgroundChoices?.abilityAssignments;
  const abilities = character.abilities ?? { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 };
  
  // Sum ASI choices from all levels
  const asiBonuses: Record<string, number> = { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 };
  if (character.asiChoices) {
    Object.values(character.asiChoices).forEach((choice: any) => {
      if (typeof choice === 'object') {
        Object.entries(choice).forEach(([ab, val]) => {
          if (ab in asiBonuses) {
            asiBonuses[ab] += Number(val) || 0;
          }
        });
      }
    });
  }

  return {
    str: clamp(abilities.str + (assignments?.str ?? 0) + asiBonuses.str),
    dex: clamp(abilities.dex + (assignments?.dex ?? 0) + asiBonuses.dex),
    con: clamp(abilities.con + (assignments?.con ?? 0) + asiBonuses.con),
    int: clamp(abilities.int + (assignments?.int ?? 0) + asiBonuses.int),
    wis: clamp(abilities.wis + (assignments?.wis ?? 0) + asiBonuses.wis),
    cha: clamp(abilities.cha + (assignments?.cha ?? 0) + asiBonuses.cha)
  };
}

function deriveAbilityModifiers(scores: AbilityScoreMap): AbilityScoreMap {
  return {
    str: modifier(scores.str),
    dex: modifier(scores.dex),
    con: modifier(scores.con),
    int: modifier(scores.int),
    wis: modifier(scores.wis),
    cha: modifier(scores.cha)
  };
}

function deriveSavingThrows(
  scores: AbilityScoreMap,
  proficientSaves: string[],
  proficiencyBonus: number
): Record<AbilityKey, number> {
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

function deriveSkillBonuses(
  abilityModifiers: AbilityScoreMap,
  proficientSkills: string[],
  proficiencyBonus: number
): Record<string, number> {
  const skillSet = new Set(proficientSkills.map((value) => value.toLowerCase()));
  const result: Record<string, number> = {};

  for (const [skill, ability] of Object.entries(SKILL_TO_ABILITY)) {
    result[skill] =
      abilityModifiers[ability] + (skillSet.has(skill.toLowerCase()) ? proficiencyBonus : 0);
  }

  return result;
}

function resolvePrimaryClass(
  character: CharacterRecord,
  classEntries: ClassCatalogEntry[]
): ClassCatalogEntry | undefined {
  const primary = character.classes?.[0];
  if (!primary) return undefined;

  const classId = slugify(primary.classId);

  return classEntries.find((entry) => slugify(entry.name) === classId);
}

function deriveSpellcasting(
  character: CharacterRecord,
  primaryClass: ClassCatalogEntry | undefined,
  proficiencyBonus: number,
  abilityModifiers: AbilityScoreMap
): DerivedSpellcasting | null {
  const spellChoiceAbility = character.spellChoices?.[0]?.spellcastingAbility;
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

function deriveSpellSlotsMax(
  primaryClass: ClassCatalogEntry | undefined,
  level: number
): Record<string, number> {
  const rows = primaryClass?.classTableGroups?.find((group: any) => Array.isArray(group.rowsSpellProgression))
    ?.rowsSpellProgression;

  if (!Array.isArray(rows)) {
    return {};
  }

  const row = rows[Math.max(0, level - 1)];
  if (!Array.isArray(row)) {
    return {};
  }

  return Object.fromEntries(
    row
      .map((value: unknown, index: number) => [String(index + 1), Number(value) || 0] as const)
      .filter(([, value]) => value > 0)
  );
}

function normalizeHitDie(hitDie: string | number | undefined): number {
  if (typeof hitDie === 'number') return hitDie;
  if (typeof hitDie === 'string') return Number(String(hitDie).replace(/^d/i, '')) || 8;
  return 8;
}

function slugify(value: string): string {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function modifier(score: number): number {
  return Math.floor((Number(score) - 10) / 2);
}

function clamp(score: number): number {
  return Math.max(1, Math.min(30, Number(score) || 10));
}
