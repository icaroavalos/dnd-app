import React from 'react';
import { useCharacterStore } from '../../store/useCharacterStore';
import { useDerivedState, signed } from '../../hooks/useDerivedState';
import { cn } from '../../lib/utils';

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
    <section className="columns-2 gap-3">
      {SKILL_GROUPS.map((group) => (
        <article key={group.ability} className="bg-[#f5f5f5] text-[#111] rounded-lg text-center break-inside-avoid mb-2.5 p-1 border-2 border-teal">
          <h3 className="flex justify-between mb-1 py-0.5 px-[7px] text-[1.05rem]">
            <span>{group.label}</span>
            <strong>{signed(derived.modifiers[group.ability as keyof typeof derived.modifiers])}</strong>
          </h3>
          {group.skills.map((skill) => {
            const bonus = derived.skillBonuses[skill] ?? 0;
            const isProficient = character.skillProficiencies.includes(skill);
            
            return (
              <div key={skill} className={cn("flex justify-between gap-2 mt-[3px] py-0.5 px-1.25 rounded bg-[#dff4ef] text-left", isProficient && "font-bold")}>
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
