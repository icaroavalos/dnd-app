import React, { useState } from 'react';
import { useCharacterStore } from '../../store/useCharacterStore';
import { cn } from '../../lib/utils';

export const FeaturesTab: React.FC = () => {
  const { character } = useCharacterStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const features = character.features || [];

  const grouped = features.reduce((acc, feat) => {
    const kind = feat.kind || 'Outros';
    if (!acc[kind]) acc[kind] = [];
    acc[kind].push(feat);
    return acc;
  }, {} as Record<string, any[]>);

  const kindLabels: Record<string, string> = {
    class: 'Habilidades de Classe',
    species: 'Traços de Espécie',
    subspecies: 'Linhagem / Subespécie',
    feat: 'Talentos',
    background: 'Habilidades de Antecedente',
    Outros: 'Outras Habilidades'
  };

  return (
    <div className="">
      {Object.entries(grouped).map(([kind, items]) => (
        <section key={kind} className="grid gap-2 mb-4">
          <h3 className="mt-2 text-[#cf3036] text-[0.9rem] uppercase border-b border-[#d8d8d8] pb-1">{kindLabels[kind] || kind.toUpperCase()}</h3>
          <div className="grid gap-3">
            {items.map((feat, idx) => {
              const id = feat.id || `${kind}-${idx}`;
              const isOpen = selectedId === id;
              return (
                <article key={id} className={cn("bg-[#1a1a1a] border border-[#333] rounded-lg overflow-hidden", isOpen && "border-[#cf3036]")}>
                  <button 
                    type="button" 
                    className={cn("grid grid-cols-[1fr_auto_auto] gap-2 items-center w-full py-2.5 px-3 bg-transparent border-none text-[#f0f0f0] text-left cursor-pointer hover:bg-[#222]", isOpen && "bg-[#222]")}
                    onClick={() => setSelectedId(isOpen ? null : id)}
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <strong className="text-[0.95rem] font-bold text-[#f0f0f0]">{feat.name}</strong>
                    </div>
                    <span className={cn("w-4 h-4 border-r-2 border-b-2 border-[#888] rotate-[135deg] transition-transform duration-200", isOpen && "-rotate-45 border-[#cf3036]")}></span>
                  </button>
                  {isOpen && (
                    <div className="p-3 bg-[#151515] border-t border-[#333] text-[#d0d0d0] text-[0.88rem] leading-normal">
                      {feat.resource && (
                        <div className="flex items-center gap-2 mt-2.5 mb-2.5 text-[#6f7a80] font-[850]">
                          <button type="button" className="relative min-h-[28px] grid place-items-center text-white bg-[#cf3036] border-0 rounded-[6px] text-[0.62rem] font-[950] uppercase cursor-pointer px-3">Usar</button>
                          <span>{feat.resource.remaining}/{feat.resource.max} usos - recupera em {feat.resource.recoveryLabel}</span>
                        </div>
                      )}
                      <p className="mb-2">{feat.description || 'Nenhuma descrição disponível.'}</p>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </section>
      ))}

      {features.length === 0 && (
        <div className="min-h-[120px] grid place-items-center text-muted border border-dashed border-[#343434] rounded-lg text-center p-4">Nenhuma habilidade listada para esta ficha.</div>
      )}
    </div>
  );
};
