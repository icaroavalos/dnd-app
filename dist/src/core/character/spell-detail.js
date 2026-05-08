import { format5etoolsTime, format5etoolsRange, format5etoolsComponents, format5etoolsDuration, entriesToText, spellSchoolName } from '../../lib/formatter.js';
import { clean5etoolsText, titleCase } from '../../lib/utils.js';
const CLASS_TRADITIONS = {
    artificer: 'Arcane',
    bard: 'Arcane',
    cleric: 'Divine',
    druid: 'Primal',
    paladin: 'Divine',
    ranger: 'Primal',
    sorcerer: 'Arcane',
    warlock: 'Arcane',
    wizard: 'Arcane',
};
const ABILITY_ABBREVIATIONS = {
    strength: 'STR',
    dexterity: 'DEX',
    constitution: 'CON',
    intelligence: 'INT',
    wisdom: 'WIS',
    charisma: 'CHA',
};
function spellKey(name, source) {
    return `${String(name ?? '').toLowerCase()}|${String(source ?? '').toLowerCase()}`;
}
export function buildSpellClassIndex(classSpells) {
    const index = new Map();
    Object.entries(classSpells ?? {}).forEach(([className, spells]) => {
        const classLabel = titleCase(className);
        const tradition = CLASS_TRADITIONS[className.toLowerCase()];
        (spells ?? []).forEach((spell) => {
            const key = spellKey(spell.name, spell.source);
            const existing = index.get(key) ?? { classes: [], traditions: [] };
            if (!existing.classes.includes(classLabel))
                existing.classes.push(classLabel);
            if (tradition && !existing.traditions.includes(tradition))
                existing.traditions.push(tradition);
            index.set(key, existing);
        });
    });
    return index;
}
export function normalize5etoolsSpell(spell, classIndex = new Map()) {
    const levelLine = spell.level === 0
        ? `${spellSchoolName(spell.school)} cantrip`.trim()
        : `${spell.level}${ordinalSuffix(spell.level)}-level ${spellSchoolName(spell.school)}`.trim();
    const classEntry = classIndex.get(spellKey(spell.name, spell.source)) ?? classIndex.get(spellKey(spell.name)) ?? { classes: [], traditions: [] };
    const concentration = Boolean(Array.isArray(spell.duration) && spell.duration.some((entry) => entry?.concentration));
    const ritual = Boolean(spell.meta?.ritual);
    const componentFlags = [
        spell.components?.v ? 'V' : null,
        spell.components?.s ? 'S' : null,
        spell.components?.m ? 'M' : null,
    ].filter(Boolean);
    return {
        name: spell.name,
        level: spell.level,
        school: spell.school,
        levelLine,
        castingTime: format5etoolsTime(spell.time),
        range: format5etoolsRange(spell.range),
        components: format5etoolsComponents(spell.components),
        componentFlags,
        duration: format5etoolsDuration(spell.duration),
        material: typeof spell.components?.m === 'string'
            ? clean5etoolsText(spell.components.m)
            : clean5etoolsText(spell.components?.m?.text),
        description: entriesToText(spell.entries),
        higherLevel: entriesToText(spell.entriesHigherLevel),
        concentration,
        ritual,
        saveOrAttack: deriveSaveOrAttackLabel(spell),
        damageTypes: (spell.damageInflict ?? []).map((type) => titleCase(type)),
        traditions: [...(classEntry.traditions ?? [])].sort(),
        classes: [...(classEntry.classes ?? [])].sort(),
        source: spell.source,
        page: Number.isFinite(spell.page) ? spell.page : undefined,
        reference: `${spell.source}${Number.isFinite(spell.page) ? ` • p. ${spell.page}` : ''}`,
    };
}
export function resolveSpellDetail(name, api) {
    const loaded = api.spellDetails?.[name];
    if (loaded?.name)
        return loaded;
    const sourceDetail = api.source?.spellDetails?.[String(name).toLowerCase()];
    if (sourceDetail?.name)
        return sourceDetail;
    return null;
}
function deriveSaveOrAttackLabel(spell) {
    const savingThrow = Array.isArray(spell.savingThrow) ? spell.savingThrow[0] : null;
    if (savingThrow)
        return `${ABILITY_ABBREVIATIONS[String(savingThrow).toLowerCase()] ?? String(savingThrow).toUpperCase()} Save`;
    const spellAttack = Array.isArray(spell.spellAttack) ? spell.spellAttack : [];
    if (spellAttack.includes('M'))
        return 'Melee Spell Attack';
    if (spellAttack.includes('R'))
        return 'Ranged Spell Attack';
    if (spellAttack.length)
        return 'Spell Attack';
    return '-';
}
function ordinalSuffix(level) {
    if (level === 1)
        return 'st';
    if (level === 2)
        return 'nd';
    if (level === 3)
        return 'rd';
    return 'th';
}
//# sourceMappingURL=spell-detail.js.map