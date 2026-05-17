import React from 'react';
import { cn } from '../../../lib/utils';
import { CheckCircle2 } from 'lucide-react';

interface ASISelectorProps {
  selections: string[];
  onToggle: (ability: string) => void;
  finalAbilities: Record<string, number>;
}

const ABILITIES = [
  { id: 'str', name: 'Força' },
  { id: 'dex', name: 'Destreza' },
  { id: 'con', name: 'Constituição' },
  { id: 'int', name: 'Inteligência' },
  { id: 'wis', name: 'Sabedoria' },
  { id: 'cha', name: 'Carisma' }
];

export const ASISelector: React.FC<ASISelectorProps> = ({ selections, onToggle, finalAbilities }) => {
  const isComplete = selections.length === 1 || selections.length === 2;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {ABILITIES.map((ability) => {
          const isSelected = selections.includes(ability.id);
          const isFull = selections.length >= 2;
          const isDisabled = !isSelected && isFull;
          const currentValue = finalAbilities[ability.id] || 10;
          
          // Logic: 
          // 1 selection = +2
          // 2 selections = +1 each
          let bonus = 0;
          if (isSelected) {
            bonus = selections.length === 1 ? 2 : 1;
          }

          const isAtMax = currentValue >= 20;

          return (
            <button
              key={ability.id}
              disabled={isDisabled || (isAtMax && !isSelected)}
              onClick={() => onToggle(ability.id)}
              className={cn(
                "relative flex flex-col items-center p-4 rounded-2xl border-2 transition-all active:scale-95 group overflow-hidden",
                isSelected 
                  ? "bg-gold border-gold text-bg shadow-lg shadow-gold/20" 
                  : "bg-zinc-900/40 border-line hover:border-gold/50 text-muted",
                (isDisabled || (isAtMax && !isSelected)) && "opacity-30 grayscale cursor-not-allowed"
              )}
            >
              <span className="text-[0.65rem] font-black uppercase tracking-widest mb-1 opacity-70">
                {ability.name}
              </span>
              <div className="flex items-baseline gap-1">
                <strong className="text-2xl font-black">
                  {currentValue}
                </strong>
                {isSelected && (
                  <span className="text-sm font-black animate-in slide-in-from-bottom-2 duration-300">
                    +{bonus}
                  </span>
                )}
              </div>
              
              {isSelected && (
                <div className="absolute top-1 right-1">
                  <CheckCircle2 size={14} className="text-bg" />
                </div>
              )}

              {isAtMax && !isSelected && (
                <span className="text-[0.55rem] font-bold text-rose uppercase mt-1">Limite (20)</span>
              )}
            </button>
          );
        })}
      </div>
      
      <p className="text-[0.7rem] text-muted italic leading-relaxed text-center px-4">
        Selecione um atributo para ganhar **+2**, ou dois atributos para ganhar **+1 em cada**.
        Atributos não podem ultrapassar 20 através deste talento.
      </p>
    </div>
  );
};
