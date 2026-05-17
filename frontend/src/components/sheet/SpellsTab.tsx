import React, { useState } from 'react';
import { useCharacterStore } from '../../store/useCharacterStore';
import { useDerivedState, signed } from '../../hooks/useDerivedState';
import { SpellCard } from './SpellCard';
import { cn } from '../../lib/utils';

export const SpellsTab: React.FC = () => {
  const { character, updateCharacter } = useCharacterStore();
  const derived = useDerivedState();
  const [selectedSpell, setSelectedSpell] = useState<string | null>(null);

  const castSpell = (spell: any, level: number) => {
    if (level === 0) return;

    // First try to use background/feat resource if available
    if (spell.source === 'bg-feat' && spell.resource?.remaining > 0) {
      const updatedSpells = character.spells.map(s => {
        if ((s.id || s.name) === (spell.id || spell.name)) {
          return {
            ...s,
            resource: { ...s.resource, remaining: s.resource.remaining - 1 }
          };
        }
        return s;
      });
      updateCharacter({ spells: updatedSpells });
      return;
    }

    // Otherwise use spell slots
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
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-2.5">
        <div className="bg-[#f5f5f5] text-[#111] rounded-lg text-center min-h-[78px] grid place-items-center p-1.5 border-[3px] border-[#20205e]">
          <span className="block font-[850] text-[0.85rem]">Spell Attack</span>
          <strong className="text-[2.35rem] font-medium leading-none">{signed(derived.spellAttack)}</strong>
        </div>
        <div className="bg-[#f5f5f5] text-[#111] rounded-lg text-center min-h-[78px] grid place-items-center p-1.5 border-[3px] border-[#20205e]">
          <span className="block font-[850] text-[0.85rem]">Spell DC</span>
          <strong className="text-[2.35rem] font-medium leading-none">{derived.spellSaveDc}</strong>
        </div>
      </div>

      {spellsByLevel.map((group) => (
        <section key={group.level} className="grid gap-2">
          <div className="min-h-[28px] grid grid-cols-[minmax(0,1fr)_auto] items-center py-1 px-[9px] rounded-lg bg-[#ffc8ef] border-2 border-purple text-left">
            <span className="text-[1.02rem] font-[950] text-[#111]">{group.level === 0 ? 'Truques' : `${group.level}º Nível`}</span>
            {group.level > 0 && character.spellSlots[group.level] && character.spellSlots[group.level].max > 0 && (
              <span className="inline-flex items-center justify-end gap-1 min-w-0">
                {Array.from({ length: character.spellSlots[group.level].max }).map((_, i) => (
                  <span 
                    key={i} 
                    className={cn(
                      "w-4 h-4 inline-block bg-white border border-[#d3d3d3] shadow-[inset_0_0_5px_rgba(0,0,0,0.18)]",
                      i < character.spellSlots[group.level].used && "bg-[#5a5a5a] shadow-[inset_0_0_0_3px_#2a2a2a]"
                    )}
                  ></span>
                ))}
                <strong className="ml-[3px] text-[0.72rem] uppercase text-[#111]">{group.level}º Slots</strong>
              </span>
            )}
          </div>

          {group.spells.map((spell, idx) => {
            const isOpen = selectedSpell === spell.name;
            const hasBgResource = spell.source === 'bg-feat' && (spell.resource?.remaining > 0);
            const hasSlots = character.spellSlots[group.level]?.used < character.spellSlots[group.level]?.max;
            const canCast = group.level === 0 || hasBgResource || hasSlots;

            return (
              <div key={idx} className="">
                <div className="grid grid-cols-[54px_minmax(0,1fr)_auto] gap-[7px] items-stretch">
                  <button 
                    type="button" 
                    className="relative min-h-[28px] grid place-items-center text-white bg-[#cf3036] border-0 rounded-[6px] text-[0.62rem] font-[950] uppercase cursor-pointer disabled:bg-[#2b2b2b] disabled:text-[#777] disabled:cursor-not-allowed"
                    disabled={!canCast}
                    onClick={() => castSpell(spell, group.level)}
                  >
                    {group.level === 0 ? 'Usar' : 'Gastar'}
                  </button>
                  <button 
                    type="button" 
                    className={cn(
                      "min-w-0 min-h-[28px] grid place-items-center px-3 rounded-lg font-extrabold text-left leading-[1.05] overflow-hidden break-anywhere bg-[#5e558b] text-[#0f0f0f] cursor-pointer w-full border-0 justify-items-start gap-0.5",
                      isOpen && "bg-[#7b70b8] text-white",
                      "hover:bg-[#7b70b8] hover:text-white"
                    )}
                    onClick={() => setSelectedSpell(isOpen ? null : spell.name)}
                  >
                    <span className="text-[0.92rem] font-[900]">{spell.name}</span>
                  </button>
                </div>
                {isOpen && (
                  <div className="mt-2 flex justify-center">
                    <SpellCard spell={spell} />
                  </div>
                )}
              </div>
            );
          })}
        </section>
      ))}

      {spellsByLevel.length === 0 && (
        <div className="min-h-[120px] grid place-items-center text-muted border border-dashed border-[#343434] rounded-lg text-center p-4">Nenhuma magia preparada.</div>
      )}
    </div>
  );
};
