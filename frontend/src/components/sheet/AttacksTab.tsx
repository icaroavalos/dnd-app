import React, { useState } from 'react';
import { useCharacterStore } from '../../store/useCharacterStore';
import { useDerivedState, signed } from '../../hooks/useDerivedState';
import { cn } from '../../lib/utils';

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

  const gridCols = "grid-cols-[28px_minmax(88px,1fr)_48px_46px_58px_minmax(62px,0.8fr)]";

  return (
    <div className="">
      <div className="flex flex-wrap gap-1.5">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            className={cn(
              "min-h-[32px] px-[9px] text-[#6f7a80] bg-[#e9eaec] border-0 rounded-[6px] text-[0.74rem] font-[950] leading-none text-center uppercase cursor-pointer",
              filter === f.id && "text-white bg-[#cf3036]"
            )}
            onClick={() => setFilter(f.id)}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="flex items-baseline gap-1.25 mt-1.5 text-[#111] bg-white border-b border-[#e1e1e1] pt-2 pb-1.5 text-left">
        <strong className="text-[#cf3036] uppercase">Ações de Combate</strong>
        <span className="text-[0.85rem]">Ataques por Ação: 1</span>
      </div>

      <div className="grid text-[#111] bg-white text-left">
        <div className={cn("grid gap-1.5 items-center pt-2.5 pb-2 border-b border-[#e3e3e3] text-[0.6rem] font-[950] uppercase", gridCols)}>
          <span className="col-start-2">Ataque</span>
          <span>Alcance</span>
          <span>Acerto</span>
          <span>Dano</span>
          <span>Notas</span>
        </div>
        
        {character.attacks.length > 0 ? (
          character.attacks.map((attack, idx) => {
            const isOpen = selectedId === `attack-${idx}`;
            return (
              <article key={idx} className="min-w-0">
                <button 
                  type="button" 
                  className={cn(
                    "grid gap-1.5 items-center w-full py-3 bg-transparent border-0 border-b border-dotted border-[#d7d7d7] text-left cursor-pointer",
                    gridCols,
                    isOpen && "bg-[#fafafa]"
                  )}
                  onClick={() => setSelectedId(isOpen ? null : `attack-${idx}`)}
                >
                  <span className="grid place-items-center w-6 h-6 text-[#111] border border-[#c8d3dc] rounded text-[0.62rem] font-[950]">⚔️</span>
                  <span className="grid gap-0.5">
                    <strong className="text-[0.9rem] leading-[1.05] break-anywhere">{attack.name}</strong>
                    <span className="text-[#6f7a80] text-[0.72rem] font-extrabold break-anywhere">{attack.type}</span>
                  </span>
                  <span className="grid gap-0.5">
                    <strong className="text-[0.9rem] leading-[1.05] break-anywhere">{attack.range}</strong>
                  </span>
                  <span className="inline-grid place-items-center w-fit min-w-[34px] min-h-[30px] py-1 px-1.5 text-[#304050] bg-[#fbfbfb] border border-[#bccbd8] rounded-[5px] font-[850]">{signed(derived.modifiers.str + derived.proficiencyBonus)}</span>
                  <span className="grid gap-1">
                    <span className="text-[0.9rem] font-bold">{attack.damage}</span>
                  </span>
                  <span className="text-[#6f7a80] text-[0.68rem] font-extrabold leading-[1.1] break-anywhere">--</span>
                </button>
                {isOpen && (
                  <div className="pt-2.5 pb-3.5 pl-[34px] text-[#111] bg-white border-b border-dotted border-[#d7d7d7] leading-[1.28]">
                    <p className="mb-2">Detalhes do ataque com {attack.name}.</p>
                    <div className="flex items-center gap-2 mt-2.5 text-[#6f7a80] font-[850]">
                      <button type="button" className="relative min-h-[28px] grid place-items-center text-white bg-[#cf3036] border-0 rounded-[6px] text-[0.62rem] font-[950] uppercase cursor-pointer px-3">Rolar Dano</button>
                    </div>
                  </div>
                )}
              </article>
            );
          })
        ) : (
          <div className="min-h-[120px] grid place-items-center text-muted border border-dashed border-[#343434] rounded-lg text-center p-4 mt-4">Nenhum ataque configurado.</div>
        )}
      </div>
    </div>
  );
};
