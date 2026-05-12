import React, { useState } from 'react';
import { useCharacterStore } from '../../store/useCharacterStore';
import { useDerivedState, signed } from '../../hooks/useDerivedState';
import styles from './AttacksTab.module.css';
import { clsx } from 'clsx';

const FILTERS = [
  { id: 'all', label: 'Tudo' },
  { id: 'attack', label: 'Ataques' },
  { id: 'action', label: 'Ações' },
  { id: 'bonus', label: 'Bônus' },
  { id: 'reaction', label: 'Reação' },
];

export const AttacksTab: React.FC = () => {
  const { character } = useCharacterStore();
  const derived = useDerivedState();
  const [filter, setFilter] = useState('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <div className={styles.attacksTab}>
      <div className={styles.actionFilterRow}>
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            className={clsx(styles.actionFilter, filter === f.id && styles.active)}
            onClick={() => setFilter(f.id)}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className={styles.actionsHeading}>
        <strong>Ações de Combate</strong>
        <span>Ataques por Ação: 1</span>
      </div>

      <div className={styles.actionsTable}>
        <div className={styles.actionsTableHead}>
          <span>Ataque</span>
          <span>Alcance</span>
          <span>Acerto</span>
          <span>Dano</span>
          <span>Notas</span>
        </div>
        
        {character.attacks.length > 0 ? (
          character.attacks.map((attack, idx) => {
            const isOpen = selectedId === `attack-${idx}`;
            return (
              <article key={idx} className={styles.actionEntry}>
                <button 
                  type="button" 
                  className={clsx(styles.actionRow, isOpen && styles.active)}
                  onClick={() => setSelectedId(isOpen ? null : `attack-${idx}`)}
                >
                  <span className={styles.actionIcon}>⚔️</span>
                  <span className={styles.actionName}>
                    <strong>{attack.name}</strong>
                    <span>{attack.type}</span>
                  </span>
                  <span className={styles.actionRange}>
                    <strong>{attack.range}</strong>
                  </span>
                  <span className={styles.actionHit}>{signed(derived.modifiers.str + derived.proficiencyBonus)}</span>
                  <span className={styles.actionDamage}>
                    <span>{attack.damage}</span>
                  </span>
                  <span className={styles.actionNotes}>--</span>
                </button>
                {isOpen && (
                  <div className={styles.actionDetail}>
                    <p>Detalhes do ataque com {attack.name}.</p>
                    <div className={styles.resourceUse}>
                      <button type="button" className={styles.castButton}>Rolar Dano</button>
                    </div>
                  </div>
                )}
              </article>
            );
          })
        ) : (
          <div className={styles.emptyState}>Nenhum ataque configurado.</div>
        )}
      </div>
    </div>
  );
};
