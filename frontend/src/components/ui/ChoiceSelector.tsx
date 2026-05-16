import React from 'react';
import { cn } from '../../lib/utils';
import { CheckCircle2 } from 'lucide-react';

export interface Choice {
  id: string;
  type: string;
  name: string;
  count: number;
  options: string[];
  description?: string;
}

interface ChoiceSelectorProps {
  choice: Choice;
  selections: string[];
  onToggle: (option: string) => void;
  disabledOptions?: string[];
}

export const ChoiceSelector: React.FC<ChoiceSelectorProps> = ({
  choice,
  selections,
  onToggle,
  disabledOptions = []
}) => {
  const isComplete = selections.length === choice.count;

  if (!choice.options || choice.options.length === 0) {
    return (
      <div className="bg-rose/10 border border-rose/30 rounded-2xl p-5 text-rose text-xs font-bold">
        Aviso: Nenhuma opção disponível para "{choice.name}".
        {choice.type === 'expertise' ? ' (Você precisa ter proficiências para escolher Especialização)' : ''}
      </div>
    );
  }

  return (
    <div className="bg-bg border border-teal/20 rounded-2xl p-5 shadow-2xl">
      <div className="flex justify-between items-center mb-4">
        <div>
          <strong className="text-white text-[1rem] tracking-tight">{choice.name}</strong>
          <p className="text-[0.65rem] text-muted font-bold uppercase mt-1">
            Selecione {choice.count} {choice.count > 1 ? 'opções' : 'opção'}
          </p>
        </div>
        <div className={cn(
          "px-3 py-1 rounded-full text-[0.6rem] font-black uppercase tracking-widest border-2",
          isComplete ? "bg-teal/20 border-teal text-teal" : "bg-zinc-800 border-zinc-700 text-zinc-500"
        )}>
          {isComplete ? 'Completo' : 'Pendente'}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
        {choice.options.map(opt => {
          const isSelected = selections.includes(opt);
          const isDisabled = !isSelected && (selections.length >= choice.count || disabledOptions.includes(opt));

          return (
            <button
              key={opt}
              disabled={isDisabled}
              onClick={() => onToggle(opt)}
              className={cn(
                "px-4 py-3 rounded-xl border-2 text-[0.8rem] font-black text-left transition-all flex items-center justify-between group relative overflow-hidden",
                isSelected
                  ? "bg-teal border-teal text-bg shadow-lg scale-[0.98]"
                  : "bg-panel border-line hover:border-teal/50 hover:bg-teal/5 text-muted hover:text-white",
                isDisabled && !isSelected && "opacity-40 grayscale cursor-not-allowed border-line/50"
              )}
            >
              <span className="truncate pr-2">{opt}</span>
              <div className="flex items-center gap-2">
                {disabledOptions.includes(opt) && !isSelected && (
                  <span className="text-[0.6rem] bg-zinc-800 text-muted px-1.5 py-0.5 rounded border border-line">
                    Indisponível
                  </span>
                )}
                {isSelected ? (
                  <CheckCircle2 size={18} />
                ) : (
                  <div className="w-4 h-4 rounded-full border-2 border-muted/30 group-hover:border-teal/50 transition-colors" />
                )}
              </div>
            </button>
          );
        })}
      </div>
      {choice.description && (
        <p className="mt-4 text-[0.7rem] text-muted italic leading-relaxed">
          {choice.description}
        </p>
      )}
    </div>
  );
};
