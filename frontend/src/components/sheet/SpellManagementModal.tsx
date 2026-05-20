import React, { useState, useMemo, useEffect } from 'react';
import { useCharacterStore } from '../../store/useCharacterStore';
import { useDerivedState } from '../../hooks/useDerivedState';
import { cn } from '../../lib/utils';
import { X, Book, CheckCircle2, AlertCircle, RefreshCw, Search, ChevronRight, ArrowLeftRight } from 'lucide-react';
import { 
  getSpellManagementPolicy, 
  isGrantedSpell, 
  doesSpellCountAgainstPreparation,
  getPreparedSpellLimit,
  isSpellRemovable
} from '../../lib/spell-management-rules';
import { RuleText } from '../ui/RuleText';
import { getClasses } from '../../api/catalog-api';

interface SpellManagementModalProps {
  onClose: () => void;
}

export const SpellManagementModal: React.FC<SpellManagementModalProps> = ({ onClose }) => {
  const { character, spellsCatalog, classSpellsCatalog, updatePreparedSpells, replaceSpell, addClassSpell } = useCharacterStore();
  const policy = getSpellManagementPolicy(character);
  const [searchTerm, setSearchTerm] = useState('');
  const [classEntry, setClassEntry] = useState<any>(null);
  
  // Replace Mode State
  const [step, setStep] = useState<'select-old' | 'select-new'>('select-old');
  const [spellToReplace, setSpellToReplace] = useState<any>(null);

  useEffect(() => {
    getClasses().then(res => {
      const entry = res.results.find(c => c.name.toLowerCase() === character.class.toLowerCase());
      setClassEntry(entry);
    });
  }, [character.class]);

  const limit = getPreparedSpellLimit(character, classEntry) || 0;
  const preparedIds = character.preparedSpells || [];

  // 1. Spells already "known" by the character
  const knownSpells = character.spells || [];

  // 2. Separate Granted vs Normal Class Spells
  const grantedSpells = knownSpells.filter(isGrantedSpell);
  const normalClassSpells = knownSpells.filter(s => s.level > 0 && !isGrantedSpell(s));

  // 3. For Prepare Mode: Wizard uses knownSpells, others use Class List
  const preparableSpells = useMemo(() => {
    if (policy.mode === 'prepare-spellbook') {
      return normalClassSpells.sort((a, b) => {
        if (a.level !== b.level) return a.level - b.level;
        return a.name.localeCompare(b.name);
      });
    }

    if (policy.mode === 'prepare-full-list') {
      const maxSlotLevel = Object.keys(character.spellSlots || {}).reduce((max, lvl) => Math.max(max, parseInt(lvl)), 0);
      
      const classKey = `${character.class.toLowerCase()}|xphb`;
      const classSpellNames = classSpellsCatalog[classKey] || [];
      
      return spellsCatalog.filter(s => 
        s.level > 0 && 
        s.level <= maxSlotLevel &&
        classSpellNames.includes(s.name)
      ).sort((a, b) => {
        if (a.level !== b.level) return a.level - b.level;
        return a.name.localeCompare(b.name);
      });
    }

    return [];
  }, [policy.mode, normalClassSpells, spellsCatalog, classSpellsCatalog, character.class, character.spellSlots]);

  const filteredPreparable = preparableSpells.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleSpell = (spell: any) => {
    const spellId = spell.id || spell.name;
    if (preparedIds.includes(spellId)) {
      updatePreparedSpells(preparedIds.filter(id => id !== spellId));
    } else {
      if (preparedIds.length < limit) {
        updatePreparedSpells([...preparedIds, spellId]);
      }
    }
  };

  const handleReplace = (newSpell: any) => {
    if (!spellToReplace) return;
    replaceSpell(spellToReplace.id || spellToReplace.name, newSpell);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-bg/90 backdrop-blur-md animate-in fade-in duration-300">
      <div className="w-full max-w-2xl max-h-[90vh] bg-panel border border-gold/30 rounded-3xl shadow-[0_30px_90px_rgba(0,0,0,0.6)] flex flex-col overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-8 duration-500">
        
        {/* Header */}
        <header className="p-6 border-b border-gold/20 bg-gold/5 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gold flex items-center justify-center text-bg shadow-xl">
              {policy.mode === 'replace-one' ? <RefreshCw size={32} /> : <Book size={32} />}
            </div>
            <div>
              <h2 className="text-2xl font-black uppercase tracking-tight text-white leading-none">
                {policy.mode === 'replace-one' ? 'Trocar Magia' : 'Preparar Magias'}
              </h2>
              <p className="text-gold font-bold uppercase text-[0.7rem] tracking-widest mt-1.5 opacity-80">
                {character.class} • Nível {character.level}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-muted hover:text-white">
            <X size={24} />
          </button>
        </header>

        {/* Mode-specific content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          
          {/* SEARCH BAR (for full list or select-new) */}
          {(policy.mode === 'prepare-full-list' || step === 'select-new') && (
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={18} />
              <input 
                type="text"
                placeholder="Buscar magia..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-zinc-900 border border-line rounded-2xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-gold/50 transition-all"
              />
            </div>
          )}

          {policy.mode !== 'replace-one' ? (
            /* PREPARE MODE */
            <div className="space-y-6">
              {/* Stats Bar */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-zinc-900/40 border border-line rounded-2xl flex flex-col items-center">
                   <span className="text-[0.6rem] font-black uppercase text-muted tracking-widest mb-1">Capacidade</span>
                   <strong className="text-2xl font-black text-white">{preparedIds.length} / {limit}</strong>
                </div>
                <div className="p-4 bg-zinc-900/40 border border-line rounded-2xl flex flex-col items-center">
                   <span className="text-[0.6rem] font-black uppercase text-muted tracking-widest mb-1">Fixas</span>
                   <strong className="text-2xl font-black text-teal">{grantedSpells.length}</strong>
                </div>
              </div>

              {/* Always Prepared Section */}
              {grantedSpells.length > 0 && (
                <section>
                  <h3 className="text-[0.7rem] font-black uppercase text-teal tracking-widest mb-3 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-teal" />
                    Sempre Preparadas
                  </h3>
                  <div className="grid gap-2">
                    {grantedSpells.map(spell => (
                      <div key={spell.id || spell.name} className="flex items-center gap-4 p-4 rounded-2xl bg-teal/5 border border-teal/20 opacity-80">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-teal text-bg font-black text-sm">
                          {spell.level}
                        </div>
                        <div className="flex-1">
                          <strong className="text-sm font-black uppercase tracking-tight text-teal-100">{spell.name}</strong>
                          <p className="text-[0.6rem] font-bold uppercase text-teal/60">{spell.originName || 'Concedida'}</p>
                        </div>
                        <CheckCircle2 size={20} className="text-teal" />
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Preparable Section */}
              <section>
                <h3 className="text-[0.7rem] font-black uppercase text-gold tracking-widest mb-3 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-gold" />
                  {policy.mode === 'prepare-spellbook' ? 'Do Grimório' : 'Lista da Classe'}
                </h3>
                <div className="grid gap-2">
                  {filteredPreparable.map((spell) => {
                    const isPrepared = preparedIds.includes(spell.id || spell.name);
                    const isLocked = !isPrepared && preparedIds.length >= limit;

                    return (
                      <button
                        key={spell.id || spell.name}
                        disabled={isLocked}
                        onClick={() => toggleSpell(spell)}
                        className={cn(
                          "w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all group",
                          isPrepared 
                            ? "bg-gold border-gold text-bg" 
                            : "bg-zinc-900/40 border-line hover:border-gold/30 text-muted",
                          isLocked && "opacity-40 grayscale cursor-not-allowed"
                        )}
                      >
                        <div className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm",
                          isPrepared ? "bg-bg text-gold" : "bg-zinc-800 text-zinc-500 group-hover:text-gold"
                        )}>
                          {spell.level}
                        </div>
                        <div className="flex-1">
                          <strong className={cn("text-sm font-black uppercase tracking-tight", isPrepared ? "text-bg" : "text-white")}>
                            {spell.name}
                          </strong>
                          <p className={cn("text-[0.6rem] font-bold uppercase opacity-60", isPrepared ? "text-bg" : "text-zinc-500")}>
                            Círculo {spell.level}
                          </p>
                        </div>
                        {isPrepared && <CheckCircle2 size={20} />}
                      </button>
                    );
                  })}
                </div>
              </section>
            </div>
          ) : (
            /* REPLACE MODE */
            <div className="space-y-6">
              {step === 'select-old' ? (
                <section>
                  <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-start gap-3 mb-6">
                    <AlertCircle size={18} className="text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-100/80 leading-relaxed font-medium">
                      Você pode trocar uma magia de classe conhecida por outra da lista de {character.class} de um nível que você possua espaços de magia.
                    </p>
                  </div>
                  
                  <h3 className="text-[0.7rem] font-black uppercase text-muted tracking-widest mb-3">Qual magia deseja remover?</h3>
                  <div className="grid gap-2">
                    {normalClassSpells.map(spell => (
                      <button
                        key={spell.id || spell.name}
                        onClick={() => { setSpellToReplace(spell); setStep('select-new'); }}
                        className="w-full flex items-center gap-4 p-4 rounded-2xl bg-zinc-900/40 border border-line hover:border-rose/50 hover:bg-rose/5 text-left transition-all group"
                      >
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-zinc-800 text-zinc-500 font-black text-sm group-hover:bg-rose group-hover:text-white transition-colors">
                          {spell.level}
                        </div>
                        <div className="flex-1">
                          <strong className="text-sm font-black uppercase tracking-tight text-white group-hover:text-rose-100">{spell.name}</strong>
                          <p className="text-[0.6rem] font-bold uppercase text-muted">Círculo {spell.level}</p>
                        </div>
                        <ChevronRight size={18} className="text-muted group-hover:text-rose" />
                      </button>
                    ))}
                  </div>
                </section>
              ) : (
                <section>
                   <button 
                    onClick={() => { setStep('select-old'); setSpellToReplace(null); }}
                    className="mb-4 flex items-center gap-2 text-[0.6rem] font-black uppercase text-gold hover:text-gold/80 transition-colors"
                   >
                     <ArrowLeftRight size={12} />
                     Trocar outra magia
                   </button>

                   <div className="p-4 bg-zinc-900 border border-line rounded-2xl flex items-center gap-4 mb-6">
                      <div className="w-10 h-10 rounded-xl bg-rose/10 flex items-center justify-center text-rose border border-rose/20">
                        {spellToReplace.level}
                      </div>
                      <div className="flex-1">
                        <span className="text-[0.55rem] font-black uppercase text-rose/60 tracking-widest">Removendo</span>
                        <h4 className="text-sm font-black uppercase text-white leading-tight">{spellToReplace.name}</h4>
                      </div>
                   </div>

                   <h3 className="text-[0.7rem] font-black uppercase text-muted tracking-widest mb-3">Escolha a nova magia</h3>
                   <div className="grid gap-2">
                     {spellsCatalog
                      .filter(s => 
                        s.level > 0 && 
                        s.level <= Object.keys(character.spellSlots || {}).length && // Rough slot check
                        !knownSpells.some(ks => ks.name === s.name) &&
                        s.name.toLowerCase().includes(searchTerm.toLowerCase())
                      )
                      .slice(0, 50) // Limit for performance
                      .map(spell => (
                        <button
                          key={spell.id || spell.name}
                          onClick={() => handleReplace(spell)}
                          className="w-full flex items-center gap-4 p-4 rounded-2xl bg-zinc-900/40 border border-line hover:border-teal/50 hover:bg-teal/5 text-left transition-all group"
                        >
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-zinc-800 text-zinc-500 font-black text-sm group-hover:bg-teal group-hover:text-bg transition-colors">
                            {spell.level}
                          </div>
                          <div className="flex-1">
                            <strong className="text-sm font-black uppercase tracking-tight text-white group-hover:text-teal-100">{spell.name}</strong>
                            <p className="text-[0.6rem] font-bold uppercase text-muted">Círculo {spell.level}</p>
                          </div>
                          <Plus size={18} className="text-muted group-hover:text-teal" />
                        </button>
                      ))}
                   </div>
                </section>
              )}
            </div>
          )}

        </div>

        {/* Footer */}
        <footer className="p-6 border-t border-line bg-panel/80 backdrop-blur-md">
          {policy.mode !== 'replace-one' ? (
            <button 
              onClick={onClose}
              className="w-full py-4 px-6 bg-gold text-bg font-black rounded-2xl uppercase text-xs tracking-widest transition-all shadow-xl hover:bg-gold/90 shadow-gold/10 flex items-center justify-center gap-2"
            >
              <CheckCircle2 size={18} />
              Salvar Preparação
            </button>
          ) : (
            <button 
              onClick={onClose}
              className="w-full py-4 px-6 bg-zinc-800 text-zinc-400 font-black rounded-2xl uppercase text-xs tracking-widest transition-all"
            >
              Cancelar
            </button>
          )}
        </footer>
      </div>
    </div>
  );
};

const Plus = ({ size, className }: { size: number, className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M5 12h14"/><path d="M12 5v14"/></svg>
);
