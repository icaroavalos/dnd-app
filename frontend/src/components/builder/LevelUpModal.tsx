import React from 'react';
import { useCharacterStore } from '../../store/useCharacterStore';
import { cn } from '../../lib/utils';
import { Zap, Shield, Heart, CheckCircle2, X } from 'lucide-react';
import { ChoiceSelector } from '../ui/ChoiceSelector';
import { RuleText } from '../ui/RuleText';

export const LevelUpModal: React.FC = () => {
  const { character, pendingLevelUp, updateLevelUpSelection, finalizeLevelUp, cancelLevelUp } = useCharacterStore();

  if (!pendingLevelUp) return null;

  const { nextLevel, hpGain, newFeatures, choices = [], selections = {} } = pendingLevelUp;

  const isChoiceComplete = (choice: any) => {
    if (!choice) return false;
    const selection = selections[choice.id] || [];
    return selection.length === (choice.count || 0);
  };

  const getSelectedSubclass = () => {
    const subclassChoice = choices.find(c => c.type === 'subclass');
    if (!subclassChoice) return null;
    const selected = selections[subclassChoice.id]?.[0];
    if (!selected) return null;
    
    return selected
      .replace(/Path of the /i, '')
      .replace(/Circle of the /i, '')
      .replace(/College of /i, '')
      .replace(/Oath of /i, '')
      .replace(/Domain/i, '')
      .trim();
  };

  const selectedSubclassName = getSelectedSubclass();

  // Logic for mutual exclusion (ASI vs Feat)
  const asiChoice = choices.find(c => c.type === 'asi');
  const featChoice = choices.find(c => c.type === 'feat');

  // Filter choices based on selected subclass
  const visibleChoices = choices.filter(choice => {
    if (choice.type === 'subclass') return true;
    const feat = newFeatures.find(f => f.id === choice.featureId);
    if (!feat || !feat.subclassShortName) return true;
    return feat.subclassShortName.toLowerCase() === selectedSubclassName?.toLowerCase();
  });

  // Filter features: show if they don't have a subclass, or if they match the selected subclass
  const visibleFeatures = (newFeatures || []).filter(feat => {
    if (!feat.subclassShortName) return true;
    // Case-insensitive comparison of short names
    return feat.subclassShortName.toLowerCase() === selectedSubclassName?.toLowerCase();
  });

  const allChoicesMade = visibleChoices.every(choice => {
    if (!choice) return true;
    if (choice.type === 'asi' || choice.type === 'feat') {
      const other = choice.type === 'asi' ? featChoice : asiChoice;
      if (!other) return isChoiceComplete(choice);
      return isChoiceComplete(choice) || isChoiceComplete(other);
    }
    return isChoiceComplete(choice);
  });

  const handleToggle = (choiceId: string, option: string) => {
    const choice = choices.find(c => c.id === choiceId);
    if (!choice) return;

    let updatedSelections = { ...selections };
    
    // Mutual exclusion: ASI vs Feat
    if (choice.type === 'asi' && featChoice) updatedSelections[featChoice.id] = [];
    if (choice.type === 'feat' && asiChoice) updatedSelections[asiChoice.id] = [];

    const current = updatedSelections[choiceId] || [];
    let next;
    if (current.includes(option)) {
      next = current.filter(o => o !== option);
    } else if (current.length < choice.count) {
      next = [...current, option];
    } else {
      if (choice.count === 1) next = [option];
      else return;
    }
    
    updateLevelUpSelection(choiceId, next);
    
    // Clean up the other side of mutual exclusion in store
    if (choice.type === 'asi' && featChoice) updateLevelUpSelection(featChoice.id, []);
    if (choice.type === 'feat' && asiChoice) updateLevelUpSelection(asiChoice.id, []);
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

          {/* Decisions Section - Moved up to prioritize choice */}
          {visibleChoices.length > 0 && (
            <section className="pt-4 border-t border-line">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-teal mb-5 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-teal animate-pulse" />
                Decisões do Novo Nível
              </h3>
              <div className="grid gap-6">
                {visibleChoices.map(choice => (
                  <ChoiceSelector
                    key={choice.id}
                    choice={choice}
                    selections={selections[choice.id] || []}
                    onToggle={(opt) => handleToggle(choice.id, opt)}
                    disabledOptions={
                      choice.type === 'generic' && (choice.name.toLowerCase().includes('skill') || choice.name.toLowerCase().includes('perícia'))
                        ? character.skillProficiencies
                        : []
                    }
                  />
                ))}
              </div>
            </section>
          )}

          {/* New Features Section */}
          <section className="pt-4 border-t border-line">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gold mb-4 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
              Habilidades do Nível
            </h3>
            <div className="grid gap-3">
              {visibleFeatures.map(feat => (
                <div key={feat.id} className="p-4 bg-zinc-900/40 border border-line rounded-xl">
                  <div className="flex items-center gap-2 mb-1">
                    <strong className="text-ink text-sm">{feat.name}</strong>
                    {feat.subclassShortName && (
                      <span className="text-[10px] bg-gold/10 text-gold px-1.5 py-0.5 rounded border border-gold/20 font-black uppercase">
                        {feat.subclassShortName}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted leading-relaxed line-clamp-3 hover:line-clamp-none transition-all cursor-default">
                    <RuleText text={feat.description} />
                  </div>
                </div>
              ))}
              {visibleFeatures.length === 0 && (
                <p className="text-xs text-muted italic p-4 border border-dashed border-line rounded-xl text-center">
                  Habilidades de classe automáticas aplicadas.
                </p>
              )}
            </div>
          </section>
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
