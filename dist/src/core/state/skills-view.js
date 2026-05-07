import { signed } from '../character/character-engine.js';
import { escapeHtml } from '../../lib/utils.js';
const SKILL_GROUPS = [
    { ability: 'str', label: 'Strength', skills: ['Athletics'] },
    { ability: 'dex', label: 'Dexterity', skills: ['Acrobatics', 'Sleight of Hand', 'Stealth'] },
    { ability: 'con', label: 'Constitution', skills: [] },
    { ability: 'int', label: 'Intelligence', skills: ['Arcana', 'History', 'Investigation', 'Nature', 'Religion'] },
    { ability: 'wis', label: 'Wisdom', skills: ['Animal Handling', 'Insight', 'Medicine', 'Perception', 'Survival'] },
    { ability: 'cha', label: 'Charisma', skills: ['Deception', 'Intimidation', 'Performance', 'Persuasion'] },
];
export function renderSkillsSheet(character, derived) {
    return `
    <section class="skill-columns">
      ${SKILL_GROUPS.map((group) => renderSkillCard(group, character, derived)).join('')}
    </section>
  `;
}
function renderSkillCard(group, character, derived) {
    const modifier = derived.abilityModifiers[group.ability];
    const rows = group.skills.map((skill) => renderSkillRow(skill, character, derived)).join('');
    return `
    <article class="skill-card">
      <h3><span>${group.label}</span><strong>${signed(modifier)}</strong></h3>
      ${rows || `<div class="skill-row"><span>No linked skills</span><strong>${signed(modifier)}</strong></div>`}
    </article>
  `;
}
function renderSkillRow(skill, character, derived) {
    const bonus = derived.skillBonuses?.[skill] ?? 0;
    const isProficient = (character.skillProficiencies ?? []).includes(skill);
    return `
    <div class="skill-row${isProficient ? ' proficient' : ''}">
      <span>${escapeHtml(skill)}</span>
      <strong>${signed(bonus)}</strong>
    </div>
  `;
}
//# sourceMappingURL=skills-view.js.map