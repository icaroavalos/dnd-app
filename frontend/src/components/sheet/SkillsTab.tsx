import React from 'react';
import { useCharacterStore } from '../../store/useCharacterStore';
import { useDerivedState, signed } from '../../hooks/useDerivedState';
import styles from './SkillsTab.module.css';
import { clsx } from 'clsx';

const SKILL_GROUPS = [
  { ability: 'str', label: 'Força', skills: ['Athletics'] },
  { ability: 'dex', label: 'Destreza', skills: ['Acrobatics', 'Sleight of Hand', 'Stealth'] },
  { ability: 'int', label: 'Inteligência', skills: ['Arcana', 'History', 'Investigation', 'Nature', 'Religion'] },
  { ability: 'wis', label: 'Sabedoria', skills: ['Animal Handling', 'Insight', 'Medicine', 'Perception', 'Survival'] },
  { ability: 'cha', label: 'Carisma', skills: ['Deception', 'Intimidation', 'Performance', 'Persuasion'] },
];

export const SkillsTab: React.FC = () => {
  const { character } = useCharacterStore();
  const derived = useDerivedState();

  return (
    <section className={styles.skillColumns}>
      {SKILL_GROUPS.map((group) => (
        <article key={group.ability} className={styles.skillCard}>
          <h3>
            <span>{group.label}</span>
            <strong>{signed(derived.modifiers[group.ability as keyof typeof derived.modifiers])}</strong>
          </h3>
          {group.skills.map((skill) => {
            const bonus = derived.skillBonuses[skill] ?? 0;
            const isProficient = character.skillProficiencies.includes(skill);
            
            return (
              <div key={skill} className={clsx(styles.skillRow, isProficient && styles.proficient)}>
                <span>{skill}</span>
                <strong>{signed(bonus)}</strong>
              </div>
            );
          })}
        </article>
      ))}
    </section>
  );
};
