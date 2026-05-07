/**
 * Skills View - legacy-compatible typed rendering for the Skills tab.
 */
import type { Character, DerivedCharacterSheet } from '../../types/state.js';
import { signed } from '../character/character-engine.js';
import { escapeHtml } from '../../lib/utils.js';

type AbilityKey = keyof DerivedCharacterSheet['abilityModifiers'];

const SKILL_GROUPS: Array<{ ability: AbilityKey; label: string; skills: string[] }> = [
  { ability: 'str', label: 'Strength', skills: ['Athletics'] },
  { ability: 'dex', label: 'Dexterity', skills: ['Acrobatics', 'Sleight of Hand', 'Stealth'] },
  { ability: 'con', label: 'Constitution', skills: [] },
  { ability: 'int', label: 'Intelligence', skills: ['Arcana', 'History', 'Investigation', 'Nature', 'Religion'] },
  { ability: 'wis', label: 'Wisdom', skills: ['Animal Handling', 'Insight', 'Medicine', 'Perception', 'Survival'] },
  { ability: 'cha', label: 'Charisma', skills: ['Deception', 'Intimidation', 'Performance', 'Persuasion'] },
];

export function renderSkillsSheet(character: Character, derived: DerivedCharacterSheet): string {
  return `
    <section class="skill-columns">
      ${SKILL_GROUPS.map((group) => renderSkillCard(group, character, derived)).join('')}
    </section>
  `;
}

function renderSkillCard(
  group: { ability: AbilityKey; label: string; skills: string[] },
  character: Character,
  derived: DerivedCharacterSheet
): string {
  const modifier = derived.abilityModifiers[group.ability];
  const rows = group.skills.map((skill) => renderSkillRow(skill, character, derived)).join('');

  return `
    <article class="skill-card">
      <h3><span>${group.label}</span><strong>${signed(modifier)}</strong></h3>
      ${rows || `<div class="skill-row"><span>No linked skills</span><strong>${signed(modifier)}</strong></div>`}
    </article>
  `;
}

function renderSkillRow(skill: string, character: Character, derived: DerivedCharacterSheet): string {
  const bonus = derived.skillBonuses?.[skill] ?? 0;
  const isProficient = (character.skillProficiencies ?? []).includes(skill);

  return `
    <div class="skill-row${isProficient ? ' proficient' : ''}">
      <span>${escapeHtml(skill)}</span>
      <strong>${signed(bonus)}</strong>
    </div>
  `;
}
