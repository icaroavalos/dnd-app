import React, { useState } from 'react';
import { useCharacterStore } from '../../store/useCharacterStore';
import { useDerivedState, signed } from '../../hooks/useDerivedState';
import { SpellCard } from './SpellCard';
import { cn } from '../../lib/utils';
import { getSpellOrigin, getSpellAbility } from '../../lib/spell-utils';

export const SpellsTab: React.FC = () => {
  const { character, updateCharacter } = useCharacterStore();
  const derived = useDerivedState();
  const [selectedSpell, setSelectedSpell] = useState<string | null>(null);

  const castSpell = (spell: any, level: number) => {
    if (level === 0) return;

    // First try to use background/feat resource if available
    if ((spell.originKind === 'background' || spell.source === 'bg-feat') && spell.resource) {
      if (spell.resource.remaining <= 0) return;

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
    const max = derived.spellSlotsMax[level] || 0;
    const used = current[level]?.used || 0;

    if (used < max) {
      updateCharacter({
        spellSlots: {
          ...current,
          [level]: { max, used: used + 1 }
        }
      });
    }
  };

  const toggleSlot = (level: number, index: number) => {
    const current = { ...character.spellSlots };
    const max = derived.spellSlotsMax[level] || 0;
    const used = current[level]?.used || 0;
    
    const newUsed = index < used ? index : index + 1;

    updateCharacter({
      spellSlots: {
        ...current,
        [level]: { max, used: newUsed }
      }
    });
  };

  const spellLevels = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  const spellsByLevel = spellLevels.map(level => ({
    level,
    spells: character.spells.filter(s => (s.level === level))
  })).filter(group => 
    group.spells.length > 0 || 
    (group.level > 0 && (derived.spellSlotsMax[group.level] || 0) > 0)
  );

  const usedAbilities = new Set<'int' | 'wis' | 'cha'>();
  usedAbilities.add(derived.mainSpellcastingAbility); // Always include main
  character.spells.forEach(spell => {
    usedAbilities.add(getSpellAbility(spell, character, derived.mainSpellcastingAbility));
  });
  const activeAbilities = Array.from(usedAbilities);

  return (
    <div className="flex flex-col gap-4">
      {activeAbilities.map(ability => {
        const metrics = derived.spellcastingMetrics[ability];
        if (!metrics) return null;
        return (
          <div key={ability} className="flex flex-col gap-1.5">
            {activeAbilities.length > 1 && (
              <h4 className="text-[0.65rem] font-black uppercase text-gold/80 tracking-widest pl-1">
                Conjuração: {ability.toUpperCase()}
              </h4>
            )}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="bg-[#f5f5f5] text-[#111] rounded-lg text-center min-h-[78px] grid place-items-center p-1.5 border-[3px] border-[#20205e]">
                <span className="block font-[850] text-[0.85rem]">Ataque Mágico</span>
                <strong className="text-[2.35rem] font-medium leading-none">{signed(metrics.attack)}</strong>
              </div>
              <div className="bg-[#f5f5f5] text-[#111] rounded-lg text-center min-h-[78px] grid place-items-center p-1.5 border-[3px] border-[#20205e]">
                <span className="block font-[850] text-[0.85rem]">CD de Magia</span>
                <strong className="text-[2.35rem] font-medium leading-none">{metrics.dc}</strong>
              </div>
            </div>
          </div>
        );
      })}

      {spellsByLevel.map((group) => (
        <section key={group.level} className="grid gap-2">
          <div className="min-h-[32px] flex items-center justify-between py-1 px-3 rounded-lg bg-zinc-900 border border-line text-left group">
            <span className="text-[0.85rem] font-black uppercase tracking-[0.1em] text-gold/80">
              {group.level === 0 ? 'Truques' : `${group.level}º Nível`}
            </span>
            
            {group.level > 0 && derived.spellSlotsMax[group.level] > 0 && (
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5">
                  {Array.from({ length: derived.spellSlotsMax[group.level] }).map((_, i) => {
                    const isUsed = i < (character.spellSlots[group.level]?.used || 0);
                    return (
                      <button 
                        key={i}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSlot(group.level, i);
                        }}
                        className={cn(
                          "w-4 h-4 rounded-sm border-2 transition-all duration-200 active:scale-90",
                          isUsed 
                            ? "bg-gold border-gold shadow-[0_0_8px_rgba(212,175,55,0.3)]" 
                            : "bg-zinc-800 border-zinc-700 hover:border-gold/50"
                        )}
                        aria-label={`Slot ${i+1} de nível ${group.level}`}
                      />
                    );
                  })}
                </div>
                <span className="text-[0.6rem] font-black uppercase tracking-widest text-muted-foreground/60">Slots</span>
              </div>
            )}
          </div>

          {group.spells.map((spell, idx) => {
            const isOpen = selectedSpell === spell.name;
            const isBgSpell = spell.originKind === 'background' || spell.source === 'bg-feat';
            const hasBgResource = isBgSpell && (spell.resource ? spell.resource.remaining > 0 : false);
            const max = derived.spellSlotsMax[group.level] || 0;
            const used = character.spellSlots[group.level]?.used || 0;
            const hasSlots = used < max;
            const canCast = group.level === 0 || (isBgSpell ? hasBgResource : hasSlots);

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
                      "min-w-0 min-h-[32px] flex flex-col items-start justify-center px-3 py-1 rounded-lg text-left leading-[1.05] overflow-hidden break-anywhere bg-[#5e558b] text-[#0f0f0f] cursor-pointer w-full border-0 gap-0.5 transition-colors",
                      isOpen && "bg-[#7b70b8] text-white",
                      "hover:bg-[#7b70b8] hover:text-white"
                    )}
                    onClick={() => setSelectedSpell(isOpen ? null : spell.name)}
                  >
                    <span className="text-[0.92rem] font-[900]">{spell.name}</span>
                    <span className="text-[0.55rem] font-bold opacity-80 uppercase tracking-widest mt-0.5 flex items-center gap-1.5">
                      {getSpellOrigin(spell, character)}
                      {getSpellAbility(spell, character, derived.mainSpellcastingAbility) !== derived.mainSpellcastingAbility && (
                        <span className="bg-black/30 px-1 py-0.5 rounded text-[0.45rem]">
                          {getSpellAbility(spell, character, derived.mainSpellcastingAbility).toUpperCase()}
                        </span>
                      )}
                    </span>
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
