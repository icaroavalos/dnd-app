import React from 'react';
import { useCharacterStore } from '../../store/useCharacterStore';
import { cn } from '../../lib/utils';
import { Card } from '../ui/Card';
import { Zap, Shield, Heart, CheckCircle2, X } from 'lucide-react';
import { clean5eText } from '../../lib/data-parser';

export const LevelUpModal: React.FC = () => {
  const { character, pendingLevelUp, updateLevelUpSelection, finalizeLevelUp, cancelLevelUp } = useCharacterStore();

  if (!pendingLevelUp) return null;

  const { nextLevel, hpGain, newFeatures, choices, selections } = pendingLevelUp;

  const isChoiceComplete = (choice: any) => {
    const selection = selections[choice.id] || [];
    return selection.length === choice.count;
  };

  const allChoicesMade = choices.every(isChoiceComplete);

  const handleToggle = (choiceId: string, option: string, max: number) => {
    const current = selections[choiceId] || [];
    let next;
    if (current.includes(option)) {
      next = current.filter(o => o !== option);
    } else if (current.length < max) {
      next = [...current, option];
    } else {
      // If max 1, swap
      if (max === 1) next = [option];
      else return;
    }
    updateLevelUpSelection(choiceId, next);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-bg/90 backdrop-blur-md animate-in fade-in duration-300">
      <div className="w-full max-w-[800px] max-h-[90vh] bg-panel border border-gold/30 rounded-3xl shadow-[0_30px_90px_rgba(0,0,0,0.6)] flex flex-col overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-8 duration-500">
        
        {/* Header */}
        <header className="p-6 border-b border-gold/20 bg-gold/5 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gold flex items-center justify-center text-bg shadow-xl">
              <Zap size={32} />
            </div>
            <div>
              <h2 className="text-2xl font-black uppercase tracking-tight text-white leading-none">Level Up!</h2>
              <p className="text-gold font-bold uppercase text-[0.7rem] tracking-widest mt-1.5 opacity-80">
                Você alcançou o Nível {nextLevel}
              </p>
            </div>
          </div>
          <button 
            onClick={cancelLevelUp}
            className="p-2 text-muted hover:text-rose hover:bg-rose/10 rounded-xl transition-all"
          >
            <X size={24} />
          </button>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
          
          {/* Summary Section */}
          <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-5 bg-bg/50 border border-line rounded-2xl flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-rose/20 flex items-center justify-center text-rose border border-rose/30">
                <Heart size={20} />
              </div>
              <div>
                <span className="block text-[0.65rem] font-black text-muted uppercase tracking-widest">Aumento de HP</span>
                <strong className="text-xl font-black text-white">+{hpGain} Pontos de Vida</strong>
              </div>
            </div>
            <div className="p-5 bg-bg/50 border border-line rounded-2xl flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-blue/20 flex items-center justify-center text-blue border border-blue/30">
                <Shield size={20} />
              </div>
              <div>
                <span className="block text-[0.65rem] font-black text-muted uppercase tracking-widest">Nível Atual</span>
                <strong className="text-xl font-black text-white">{character.level} ➔ {nextLevel}</strong>
              </div>
            </div>
          </section>

          {/* New Features Section */}
          <section>
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gold mb-4 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
              Novas Habilidades Ganhadas
            </h3>
            <div className="grid gap-3">
              {newFeatures.map(feat => (
                <div key={feat.id} className="p-4 bg-zinc-900/40 border border-line rounded-xl">
                  <strong className="block text-ink text-sm mb-1">{feat.name}</strong>
                  <p className="text-xs text-muted leading-relaxed line-clamp-3 hover:line-clamp-none transition-all cursor-default">
                    {clean5eText(feat.description)}
                  </p>
                </div>
              ))}
              {newFeatures.length === 0 && (
                <p className="text-xs text-muted italic p-4 border border-dashed border-line rounded-xl text-center">
                  Habilidades de classe automáticas aplicadas.
                </p>
              )}
            </div>
          </section>

          {/* Decisions Section */}
          {choices.length > 0 && (
            <section className="pt-4 border-t border-line">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-teal mb-5 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-teal animate-pulse" />
                Decisões do Novo Nível
              </h3>
              <div className="grid gap-6">
                {choices.map(choice => (
                  <div key={choice.id} className="bg-bg border border-teal/20 rounded-2xl p-5 shadow-2xl">
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <strong className="text-white text-[1rem] tracking-tight">{choice.name}</strong>
                        <p className="text-[0.65rem] text-muted font-bold uppercase mt-1">
                          Selecione {choice.count} {choice.count > 1 ? 'opções' : 'opção'}
                        </p>
                      </div>
                      <div className={cn(
                        "px-3 py-1 rounded-full text-[0.6rem] font-black uppercase tracking-widest border-2",
                        isChoiceComplete(choice) ? "bg-teal/20 border-teal text-teal" : "bg-zinc-800 border-zinc-700 text-zinc-500"
                      )}>
                        {isChoiceComplete(choice) ? 'Completo' : 'Pendente'}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                      {choice.options.map(opt => {
                        const isSelected = (selections[choice.id] || []).includes(opt);
                        return (
                          <button
                            key={opt}
                            onClick={() => handleToggle(choice.id, opt, choice.count)}
                            className={cn(
                              "px-4 py-3 rounded-xl border-2 text-[0.8rem] font-black text-left transition-all flex items-center justify-between group",
                              isSelected 
                                ? "bg-teal border-teal text-bg shadow-lg scale-[0.98]" 
                                : "bg-panel border-line hover:border-teal/50 hover:bg-teal/5 text-muted hover:text-white"
                            )}
                          >
                            <span className="truncate pr-2">{opt}</span>
                            {isSelected ? (
                              <CheckCircle2 size={18} />
                            ) : (
                              <div className="w-4 h-4 rounded-full border-2 border-muted/30 group-hover:border-teal/50 transition-colors" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Footer */}
        <footer className="p-6 border-t border-line bg-panel/80 backdrop-blur-md flex gap-3">
          <button 
            onClick={cancelLevelUp}
            className="flex-1 py-4 px-6 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 font-black rounded-2xl uppercase text-xs tracking-widest transition-all"
          >
            Cancelar
          </button>
          <button 
            onClick={finalizeLevelUp}
            disabled={!allChoicesMade}
            className={cn(
              "flex-[2] py-4 px-6 font-black rounded-2xl uppercase text-xs tracking-widest transition-all shadow-xl flex items-center justify-center gap-2",
              allChoicesMade 
                ? "bg-gold text-bg hover:bg-gold/90 shadow-gold/10" 
                : "bg-zinc-800 text-zinc-600 grayscale cursor-not-allowed shadow-none"
            )}
          >
            {allChoicesMade ? <CheckCircle2 size={18} /> : <Shield size={18} />}
            Finalizar Evolução
          </button>
        </footer>
      </div>
    </div>
  );
};
