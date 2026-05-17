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

interface SkillsTabProps {
  isWide?: boolean;
}

export const SkillsTab: React.FC<SkillsTabProps> = ({ isWide = false }) => {
  const { character } = useCharacterStore();
  const derived = useDerivedState();

  return (
    <section className={cn(
      "gap-4",
      isWide ? "columns-2" : "flex flex-col"
    )}>
      {SKILL_GROUPS.map((group) => (
        <article 
          key={group.ability} 
          className="bg-panel/40 border border-line rounded-2xl p-4 shadow-sm break-inside-avoid mb-4"
        >
          <header className="flex justify-between items-center mb-3 border-b border-line/50 pb-2">
            <h3 className="text-[0.65rem] font-black text-gold uppercase tracking-[0.2em] flex items-center gap-2">
              <div className="w-1.5 h-3 bg-gold rounded-full" />
              {group.label}
            </h3>
            <span className="text-xs font-black text-white bg-zinc-800 px-2 py-1 rounded-md border border-line/30">
              {signed(derived.modifiers[group.ability as keyof typeof derived.modifiers])}
            </span>
          </header>
          
          <div className="space-y-1.5">
            {group.skills.map((skill) => {
              const bonus = derived.skillBonuses[skill] ?? 0;
              const isProficient = character.skillProficiencies.includes(skill);
              
              return (
                <div 
                  key={skill} 
                  className={cn(
                    "flex justify-between items-center py-2 px-3 rounded-xl border transition-all",
                    isProficient 
                      ? "bg-gold/10 border-gold/30 shadow-[0_0_10px_rgba(213,166,51,0.05)]" 
                      : "bg-bg/20 border-line/30"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-3 h-3 rounded-full border-2 transition-all",
                      isProficient 
                        ? "bg-gold border-gold shadow-[0_0_8px_rgba(213,166,51,0.4)]" 
                        : "border-muted/30"
                    )} />
                    <span className={cn(
                      "text-[0.75rem] font-bold tracking-tight",
                      isProficient ? "text-white" : "text-muted"
                    )}>
                      {skill}
                    </span>
                  </div>
                  <strong className={cn(
                    "text-[0.85rem] font-black tabular-nums",
                    isProficient ? "text-gold" : "text-white"
                  )}>
                    {signed(bonus)}
                  </strong>
                </div>
              );
            })}
          </div>
        </article>
      ))}
    </section>
  );
};
