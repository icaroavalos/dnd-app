import React, { useState } from 'react';
import { useCharacterStore } from '../../store/useCharacterStore';
import { useDerivedState, signed } from '../../hooks/useDerivedState';
import styles from './SpellsTab.module.css';
import { clsx } from 'clsx';

export const SpellsTab: React.FC = () => {
  const { character, updateCharacter } = useCharacterStore();
  const derived = useDerivedState();
  const [selectedSpell, setSelectedSpell] = useState<string | null>(null);

  const castSpell = (level: number) => {
    if (level === 0) return;
    const current = { ...character.spellSlots };
    const levelSlots = current[level] || { max: 0, used: 0 };
    if (levelSlots.used < levelSlots.max) {
      updateCharacter({
        spellSlots: {
          ...current,
          [level]: { ...levelSlots, used: levelSlots.used + 1 }
        }
      });
    }
  };

  const spellLevels = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  const spellsByLevel = spellLevels.map(level => ({
    level,
    spells: character.spells.filter(s => (s.level === level))
  })).filter(group => group.spells.length > 0 || (group.level > 0 && (character.spellSlots[group.level]?.max || 0) > 0));

  return (
    <div className={styles.spellTabContent}>
      <div className={styles.metricRow}>
        <div className={styles.smallCard}>
          <span>Spell Attack</span>
          <strong>{signed(derived.spellAttack)}</strong>
        </div>
        <div className={styles.smallCard}>
          <span>Spell DC</span>
          <strong>{derived.spellSaveDc}</strong>
        </div>
      </div>

      {spellsByLevel.map((group) => (
        <section key={group.level} className={styles.spellSheetGroup}>
          <div className={styles.spellStrip}>
            <span>{group.level === 0 ? 'Truques' : `${group.level}º Nível`}</span>
            {group.level > 0 && character.spellSlots[group.level] && character.spellSlots[group.level].max > 0 && (
              <span className={styles.spellSlots}>
                {Array.from({ length: character.spellSlots[group.level].max }).map((_, i) => (
                  <span 
                    key={i} 
                    className={clsx(styles.slotBox, i < character.spellSlots[group.level].used && styles.used)}
                  ></span>
                ))}
                <strong>{group.level}º Slots</strong>
              </span>
            )}
          </div>

          {group.spells.map((spell, idx) => {
            const isOpen = selectedSpell === spell.name;
            const canCast = group.level === 0 || (character.spellSlots[group.level]?.used < character.spellSlots[group.level]?.max);

            return (
              <div key={idx} className={styles.spellItemContainer}>
                <div className={styles.spellRow}>
                  <button 
                    type="button" 
                    className={styles.castButton}
                    disabled={!canCast}
                    onClick={() => castSpell(group.level)}
                  >
                    {group.level === 0 ? 'Usar' : 'Gastar'}
                  </button>
                  <button 
                    type="button" 
                    className={clsx(styles.purpleStrip, styles.spellButton, isOpen && styles.active)}
                    onClick={() => setSelectedSpell(isOpen ? null : spell.name)}
                  >
                    <span className={styles.spellButtonName}>{spell.name}</span>
                  </button>
                </div>
                {isOpen && (
                  <article className={clsx(styles.spellCard, styles.mt2)}>
                    <div className={styles.spellCardBody}>
                      <p>{spell.description || 'Descrição não disponível.'}</p>
                    </div>
                  </article>
                )}
              </div>
            );
          })}
        </section>
      ))}

      {spellsByLevel.length === 0 && (
        <div className={styles.emptyState}>Nenhuma magia preparada.</div>
      )}
    </div>
  );
};
