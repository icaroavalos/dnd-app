import React from 'react';
import { useCharacterStore } from '../../store/useCharacterStore';
import { useDerivedState, signed } from '../../hooks/useDerivedState';
import styles from './SummaryTab.module.css';
import { clsx } from 'clsx';

export const SummaryTab: React.FC = () => {
  const { character } = useCharacterStore();
  const derived = useDerivedState();

  return (
    <div className={styles.sheetView}>
      <div className={styles.pillRow}>
        <div className={styles.creamPill}>{character.name || 'Nova Ficha'}</div>
        <div className={styles.creamPill}>
          {character.class || 'Fighter'} {character.level}
        </div>
      </div>

      <section className={styles.heroStats}>
        <div className={styles.statCard}>
          <span>Iniciativa</span>
          <strong>{signed(derived.initiative)}</strong>
        </div>

        <div className={styles.hpOrb}>
          <span>HP</span>
          <strong>
            {character.hp}
            <small>{character.hp}/{derived.maxHp}</small>
          </strong>
          <em>{character.tempHp} THP</em>
        </div>

        <div className={styles.statCard}>
          <span>Speed</span>
          <strong>{character.speed}</strong>
        </div>
      </section>

      <section className={styles.smallGrid}>
        <div className={styles.smallCard}>
          <span>Armor Class</span>
          <strong>{derived.armorClass}</strong>
        </div>
        <div className={styles.smallCard}>
          <span>Proficiency</span>
          <strong>{signed(derived.proficiencyBonus)}</strong>
        </div>
      </section>

      <section className={styles.abilities}>
        {(Object.keys(character.abilities) as Array<keyof typeof character.abilities>).map((key) => (
          <article key={key} className={styles.abilityCard}>
            <h3>{key.toUpperCase()}</h3>
            <div className={styles.abilityValues}>
              <div>
                <span>Score</span>
                <strong>{character.abilities[key]}</strong>
              </div>
              <div>
                <span>Mod</span>
                <strong>{signed(derived.modifiers[key])}</strong>
              </div>
              <div className={clsx(styles.abilitySave, character.savingThrows.includes(key) && styles.proficient)}>
                <span>Save</span>
                <strong>{signed(derived.savingThrows[key])}</strong>
              </div>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
};
