/**
 * Summary View - legacy-compatible typed rendering for the Base tab.
 */
import type { Character, DerivedCharacterSheet } from '../../types/state.js';
import { signed } from '../character/character-engine.js';
import { titleCase, escapeHtml } from '../../lib/utils.js';

type AbilityKey = keyof DerivedCharacterSheet['abilityScores'];

const ABILITY_ORDER: AbilityKey[] = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
const ABILITY_LABELS: Record<AbilityKey, string> = {
  str: 'Strength',
  dex: 'Dexterity',
  con: 'Constitution',
  int: 'Intelligence',
  wis: 'Wisdom',
  cha: 'Charisma',
};

export function renderSummarySheet(character: Character, derived: DerivedCharacterSheet): string {
  const level = Number(character.level) || 1;
  const tempHp = Number(derived?.tempHp) || 0;
  const hitDiceUsed = Number(character.hitDiceUsed) || 0;
  const hitDiceRemaining = Math.max(0, (Number(derived.hitDiceTotal) || 0) - hitDiceUsed);
  const languages = character.notes?.match(/Languages:\s*([^\n]+)/)?.[1] || 'Common';

  return `
    <div class="pill-row">
      <div class="cream-pill">${escapeHtml(character.name || 'Nova Ficha')}</div>
      <div class="cream-pill">${escapeHtml(`${titleCase(character.class || 'fighter')} ${level}`)}</div>
    </div>

    <section class="hero-stats">
      <div class="stat-card">
        <span>Initiative</span>
        <strong>${signed(derived.initiative)}</strong>
      </div>

      <div class="hp-orb" data-open-hp-modal role="button" tabindex="0" aria-label="Abrir painel de pontos de vida">
        <span>HP</span>
        <strong>
          ${derived.currentHp}
          <small>${derived.currentHp}/${derived.maxHp}</small>
        </strong>
        <em>${tempHp} THP</em>
      </div>

      <div class="stat-card">
        <span>Speed</span>
        <strong>${character.speed || 30}</strong>
      </div>
    </section>

    <section class="small-grid">
      <div class="small-card">
        <span>Hit Dice</span>
        <strong>${hitDiceRemaining}/${derived.hitDiceTotal}d${derived.hitDie}</strong>
      </div>
      <div class="small-card">
        <span>Armor Class</span>
        <strong>${derived.armorClass}</strong>
      </div>
      <div class="small-card">
        <span>Proficiency</span>
        <strong>${signed(derived.proficiencyBonus)}</strong>
      </div>
    </section>

    <div class="rest-actions">
      <button type="button" class="cream-pill" data-rest-type="short">Short Rest</button>
      <button type="button" class="cream-pill" data-rest-type="long">Long Rest</button>
    </div>

    <section class="abilities">
      ${ABILITY_ORDER.map((ability) => renderAbilityCard(ability, character, derived)).join('')}
    </section>

    <section class="info-card">
      <p><strong>Passive Perception:</strong> ${derived.passivePerception}</p>
      <p><strong>Languages:</strong> ${escapeHtml(languages)}</p>
    </section>
  `;
}

function renderAbilityCard(ability: AbilityKey, character: Character, derived: DerivedCharacterSheet): string {
  const score = derived.abilityScores[ability];
  const modifier = derived.abilityModifiers[ability];
  const saveBonus = derived.savingThrows[ability];
  const saveClass = (character.savingThrows ?? []).includes(ability) ? ' proficient' : '';

  return `
    <article class="ability-card">
      <h3>${ABILITY_LABELS[ability]}</h3>
      <div class="ability-values">
        <div>
          <span>Score</span>
          <strong>${score}</strong>
        </div>
        <div>
          <span>Modifier</span>
          <strong>${signed(modifier)}</strong>
        </div>
        <div class="ability-save${saveClass}">
          <span>Save</span>
          <strong>${signed(saveBonus)}</strong>
        </div>
      </div>
    </article>
  `;
}
