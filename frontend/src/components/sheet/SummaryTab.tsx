import React from 'react';
import { useCharacterStore } from '../../store/useCharacterStore';
import { useDerivedState, signed } from '../../hooks/useDerivedState';
import { cn } from '../../lib/utils';

export const SummaryTab: React.FC = () => {
  const { character } = useCharacterStore();
  const derived = useDerivedState();

  return (
    <div className="grid gap-[10px]">
      <div className="grid grid-cols-2 gap-2">
        <div className="min-w-0 min-h-[28px] grid place-items-center px-[9px] py-1 text-bg rounded-lg font-extrabold text-center leading-[1.05] overflow-hidden break-all bg-cream border-2 border-gold">{character.name || 'Nova Ficha'}</div>
        <div className="min-w-0 min-h-[28px] grid place-items-center px-[9px] py-1 text-bg rounded-lg font-extrabold text-center leading-[1.05] overflow-hidden break-all bg-cream border-2 border-gold">
          {character.class || 'Fighter'} {character.level}
        </div>
      </div>

      <section className="grid grid-cols-[minmax(0,1fr)_110px_minmax(0,1fr)] gap-[18px] items-center">
        <div className="bg-[#f5f5f5] text-[#111] rounded-lg text-center min-h-[78px] border-4 border-green grid place-items-center p-1.5">
          <span className="block font-[850] text-[0.85rem]">Iniciativa</span>
          <strong className="block text-[2.6rem] leading-none font-medium">{signed(derived.initiative)}</strong>
        </div>

        <div className="w-[110px] h-[110px] flex flex-col justify-center items-center gap-0 p-[10px_11px_11px] rounded-full text-[#1288ec] bg-[radial-gradient(circle_at_50%_34%,rgba(255,255,255,0.98),#eeeeee_54%,#e3e3e3_100%)] border-[5px] border-[#8b2531] shadow-[0_0_0_2px_rgba(255,255,255,0.75),inset_0_0_0_2px_rgba(255,255,255,0.35),inset_0_-8px_16px_rgba(0,0,0,0.08)] text-center box-border justify-self-center">
          <span className="text-[#111] text-[0.8rem] font-black leading-none uppercase tracking-[0.04em]">HP</span>
          <strong className="grid justify-items-center gap-px text-[2.7rem] leading-[0.84] tabular-nums">
            {character.hp}
            <small className="block m-0 text-[#5a616a] text-[0.62rem] leading-none">{character.hp}/{derived.maxHp}</small>
          </strong>
          <em className="block mt-1.5 px-2 py-[2px] text-[#8b2531] not-italic text-[0.55rem] font-black leading-[1.08] uppercase tracking-[0.05em] bg-[rgba(139,37,49,0.08)] border border-[rgba(139,37,49,0.22)] rounded-full">{character.tempHp} THP</em>
        </div>

        <div className="bg-[#f5f5f5] text-[#111] rounded-lg text-center min-h-[78px] border-4 border-green grid place-items-center p-1.5">
          <span className="block font-[850] text-[0.85rem]">Speed</span>
          <strong className="block text-[2.6rem] leading-none font-medium">{character.speed}</strong>
        </div>
      </section>

      <section className="grid grid-cols-3 gap-2 p-1.5 border-[3px] border-blue rounded-lg">
        <div className="bg-[#f5f5f5] text-[#111] rounded-lg text-center min-h-[78px] grid place-items-center p-1.5 border-[3px] border-[#20205e]">
          <span className="block font-[850] text-[0.85rem]">Armor Class</span>
          <strong className="text-[2.35rem] font-medium leading-none">{derived.armorClass}</strong>
        </div>
        <div className="bg-[#f5f5f5] text-[#111] rounded-lg text-center min-h-[78px] grid place-items-center p-1.5 border-[3px] border-[#20205e]">
          <span className="block font-[850] text-[0.85rem]">Proficiency</span>
          <strong className="text-[2.35rem] font-medium leading-none">{signed(derived.proficiencyBonus)}</strong>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-2 p-[7px] border-[3px] border-teal rounded-lg">
        {(Object.keys(character.abilities) as Array<keyof typeof character.abilities>).map((key) => (
          <article key={key} className="bg-[#f5f5f5] text-[#111] rounded-lg text-center min-h-[72px] p-1.5 border-2 border-mint">
            <h3 className="m-0 text-base">{key.toUpperCase()}</h3>
            <div className="grid grid-cols-3 gap-1">
              <div>
                <span className="block text-[0.63rem]">Score</span>
                <strong className="text-[1.25rem] leading-none">{character.abilities[key]}</strong>
              </div>
              <div>
                <span className="block text-[0.63rem]">Mod</span>
                <strong className="text-[1.25rem] leading-none">{signed(derived.modifiers[key])}</strong>
              </div>
              <div className={cn("flex flex-col items-center", character.savingThrows.includes(key) && "text-blue")}>
                <span className="block text-[0.63rem]">Save</span>
                <strong className="text-[1.25rem] leading-none">{signed(derived.savingThrows[key])}</strong>
              </div>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
};
