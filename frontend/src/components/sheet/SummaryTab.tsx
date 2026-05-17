import React, { useState } from 'react';
import { useCharacterStore, CLASS_HIT_DIE } from '../../store/useCharacterStore';
import { useDerivedState, signed } from '../../hooks/useDerivedState';
import { cn } from '../../lib/utils';
import { Heart, Zap, Plus, Minus, CheckCircle2, ArrowUp } from 'lucide-react';

export const SummaryTab: React.FC = () => {
  const { character, applyShortRest, applyLongRest, applyDamage, applyHealing, applyTempHp, spendHitDie, initiateLevelUp } = useCharacterStore();
  const derived = useDerivedState();
  const [val, setVal] = useState(0);
  const [isLeveling, setIsLeveling] = useState(false);
  const [showConfirmLevel, setShowConfirmLevel] = useState(false);

  const maxHp = derived.maxHp || 10;
  const currentHp = character.hp ?? maxHp;
  const tempHp = character.tempHp ?? 0;
  const isBloodied = currentHp <= maxHp / 2;

  const handleApply = (type: 'damage' | 'heal' | 'temp') => {
    if (val <= 0) return;
    if (type === 'damage') applyDamage(val);
    else if (type === 'heal') applyHealing(val);
    else if (type === 'temp') applyTempHp(val);
    setVal(0);
  };

  const handleSpendHitDie = () => {
    const dieSize = CLASS_HIT_DIE[character.class.toLowerCase()] || 8;
    const roll = Math.floor(Math.random() * dieSize) + 1 + (derived.modifiers.con || 0);
    spendHitDie(Math.max(1, roll));
  };

  const handleLevelUp = async () => {
    if (character.level >= 20) return;
    setIsLeveling(true);
    try {
      await initiateLevelUp();
      setShowConfirmLevel(false);
    } catch (err) {
      console.error('Level up failed:', err);
      alert('Falha ao iniciar level up. Verifique a conexão com o servidor.');
    } finally {
      setIsLeveling(false);
    }
  };

  return (
    <div className="grid gap-4">
      {/* Level Up & Rest Controls */}
      <div className="flex flex-col gap-2">
        {showConfirmLevel ? (
          <div className="flex gap-2 animate-in fade-in zoom-in-95 duration-200">
            <button 
              onClick={() => setShowConfirmLevel(false)}
              className="flex-1 py-3 px-4 bg-zinc-800 border border-line text-muted font-bold rounded-xl hover:bg-zinc-700 transition-all"
            >
              CANCELAR
            </button>
            <button 
              onClick={handleLevelUp}
              disabled={isLeveling}
              className="flex-[2] py-3 px-4 bg-gold text-bg font-black rounded-xl hover:bg-gold/90 transition-all shadow-lg shadow-gold/10 flex items-center justify-center gap-2"
            >
              {isLeveling ? <Zap className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
              CONFIRMAR SUBIDA
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowConfirmLevel(true)}
            disabled={isLeveling || character.level >= 20}
            className={cn(
              "w-full py-3 px-4 text-bg font-black rounded-xl transition-all active:scale-[0.98] shadow-lg flex items-center justify-center gap-2 group disabled:opacity-50 disabled:grayscale",
              character.level >= 20 ? "bg-zinc-800 text-zinc-500 cursor-not-allowed shadow-none" : "bg-gold hover:bg-gold/90 shadow-gold/10"
            )}
          >
            {isLeveling ? (
              <Zap className="animate-spin" size={18} />
            ) : (
              <ArrowUp className={cn("transition-transform", character.level < 20 && "group-hover:-translate-y-1")} size={18} />
            )}
            {character.level >= 20 ? 'MAX LEVEL' : 'LEVEL UP'}
          </button>
        )}

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={applyShortRest}
            className="flex items-center justify-center gap-2 py-2.5 px-3 bg-teal/10 hover:bg-teal/20 text-teal border border-teal/30 rounded-xl text-[0.7rem] font-black uppercase tracking-wider transition-all active:scale-95"
          >
            <Zap size={14} />
            Short Rest
          </button>
          <button
            onClick={() => applyLongRest(maxHp)}
            className="flex items-center justify-center gap-2 py-2.5 px-3 bg-rose/10 hover:bg-rose/20 text-rose border border-rose/30 rounded-xl text-[0.7rem] font-black uppercase tracking-wider transition-all active:scale-95"
          >
            <Heart size={14} />
            Long Rest
          </button>
        </div>
      </div>

      {/* Identity Bar */}
      <div className="grid grid-cols-2 gap-2">
        <div className="min-w-0 min-h-[32px] grid place-items-center px-[9px] py-1 text-bg rounded-lg font-extrabold text-center leading-[1.05] overflow-hidden break-all bg-cream border-2 border-gold uppercase tracking-tighter truncate">
          {character.name || 'Nova Ficha'}
        </div>
        <div className="min-w-0 min-h-[32px] grid place-items-center px-[9px] py-1 text-bg rounded-lg font-extrabold text-center leading-[1.05] overflow-hidden break-all bg-cream border-2 border-gold uppercase tracking-tighter">
          {character.class || 'Fighter'} {character.level}
        </div>
      </div>

      {/* Vitality Panel */}
      <section className="bg-black/40 border border-line rounded-2xl p-4 shadow-inner">
        <div className="grid grid-cols-[minmax(0,1fr)_120px_minmax(0,1fr)] gap-4 items-center mb-6">
          <div className="text-center">
            <span className="block font-black text-[0.7rem] text-muted uppercase tracking-widest mb-1">Iniciativa</span>
            <div className="bg-[#111] border-2 border-green text-green rounded-xl py-2 shadow-lg shadow-green/5">
              <strong className="text-2xl font-medium">{signed(derived.initiative)}</strong>
            </div>
          </div>

          <div className={cn(
            "w-[120px] h-[120px] flex flex-col justify-center items-center gap-0 p-[10px] rounded-full text-[#1288ec] bg-[radial-gradient(circle_at_50%_34%,rgba(255,255,255,0.98),#eeeeee_54%,#e3e3e3_100%)] border-[6px] transition-colors duration-500 shadow-[0_0_25px_rgba(0,0,0,0.2)] relative",
            isBloodied ? "border-rose animate-pulse" : "border-[#8b2531]"
          )}>
            <span className="text-[#111] text-[0.7rem] font-black leading-none uppercase tracking-[0.05em] mb-1">HP</span>
            <strong className="grid justify-items-center gap-px text-[2.8rem] leading-[0.8] tabular-nums font-medium">
              {currentHp}
              <small className="block m-0 text-[#5a616a] text-[0.65rem] leading-none font-bold">{currentHp}/{maxHp}</small>
            </strong>
            {tempHp > 0 && (
              <em className="absolute -bottom-2 px-2.5 py-[3px] text-white not-italic text-[0.6rem] font-black leading-none uppercase tracking-[0.05em] bg-blue border-2 border-white rounded-full shadow-md animate-in zoom-in-75">
                +{tempHp} THP
              </em>
            )}
            {isBloodied && <span className="absolute -top-1 right-2 text-[10px] font-black text-rose uppercase tracking-tighter">Bloodied</span>}
          </div>

          <div className="text-center">
            <span className="block font-black text-[0.7rem] text-muted uppercase tracking-widest mb-1">Speed</span>
            <div className="bg-[#111] border-2 border-green text-green rounded-xl py-2 shadow-lg shadow-green/5">
              <strong className="text-2xl font-medium">{character.speed}</strong>
            </div>
          </div>
        </div>

        {/* Damage/Heal Controls */}
        <div className="grid gap-3 p-3 bg-[#0a0a0a] rounded-xl border border-line/50">
          <div className="flex items-center gap-2">
            <button onClick={() => setVal(v => Math.max(0, v - 1))} className="w-8 h-8 rounded-lg bg-line flex items-center justify-center text-muted hover:text-white transition-colors"><Minus size={16} /></button>
            <input 
              type="number" 
              value={val === 0 ? '' : val} 
              onChange={e => setVal(parseInt(e.target.value) || 0)}
              className="flex-1 bg-transparent text-center text-xl font-black text-white outline-none"
              placeholder="0"
            />
            <button onClick={() => setVal(v => v + 1)} className="w-8 h-8 rounded-lg bg-line flex items-center justify-center text-muted hover:text-white transition-colors"><Plus size={16} /></button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button onClick={() => handleApply('damage')} className="py-2 bg-rose/20 text-rose border border-rose/30 rounded-lg text-[0.65rem] font-black uppercase hover:bg-rose/30 transition-all">Damage</button>
            <button onClick={() => handleApply('heal')} className="py-2 bg-green/20 text-green border border-green/30 rounded-lg text-[0.65rem] font-black uppercase hover:bg-green/30 transition-all">Heal</button>
            <button onClick={() => handleApply('temp')} className="py-2 bg-blue/20 text-blue border border-blue/30 rounded-lg text-[0.65rem] font-black uppercase hover:bg-blue/30 transition-all">Temp HP</button>
          </div>
        </div>

        {/* Hit Dice Status */}
        <div className="mt-4 flex items-center justify-between px-2">
          <div className="flex flex-col">
            <span className="text-[0.6rem] font-black text-muted uppercase tracking-widest">Hit Dice</span>
            <div className="flex gap-1 mt-1">
              {Array.from({ length: character.level || 1 }).map((_, i) => (
                <div 
                  key={i} 
                  className={cn(
                    "w-3 h-3 border rounded-sm",
                    i < (character.hitDiceUsed || 0) ? "bg-zinc-800 border-zinc-700" : "bg-gold/40 border-gold/60 shadow-[0_0_5px_rgba(213,166,51,0.2)]"
                  )}
                />
              ))}
            </div>
          </div>
          <button 
            onClick={handleSpendHitDie}
            disabled={(character.hitDiceUsed || 0) >= (character.level || 1)}
            className="px-3 py-1.5 bg-gold/10 text-gold border border-gold/30 rounded-lg text-[0.65rem] font-black uppercase hover:bg-gold/20 disabled:opacity-30 disabled:grayscale transition-all"
          >
            Spend Hit Die
          </button>
        </div>
      </section>

      {/* Defenses & Proficiency */}
      <section className="grid grid-cols-3 gap-2 p-1.5 border-[3px] border-blue rounded-xl bg-black/20">
        <div className="bg-[#f5f5f5] text-[#111] rounded-lg text-center min-h-[78px] grid place-items-center p-1.5 border-[3px] border-[#20205e] shadow-md">
          <span className="block font-[850] text-[0.85rem]">Armor Class</span>
          <strong className="text-2xl font-medium leading-none">{derived.armorClass}</strong>
        </div>
        <div className="bg-[#f5f5f5] text-[#111] rounded-lg text-center min-h-[78px] grid place-items-center p-1.5 border-[3px] border-[#20205e] shadow-md">
          <span className="block font-[850] text-[0.85rem]">Proficiency</span>
          <strong className="text-2xl font-medium leading-none">{signed(derived.proficiencyBonus)}</strong>
        </div>
        <div className="bg-[#f5f5f5] text-[#111] rounded-lg text-center min-h-[78px] grid place-items-center p-1.5 border-[3px] border-[#20205e] shadow-md">
          <span className="block font-[850] text-[0.85rem]">Save DC</span>
          <strong className="text-2xl font-medium leading-none">{derived.spellSaveDc}</strong>
        </div>
      </section>

      {/* Ability Scores Grid */}
      <section className="grid grid-cols-2 gap-2 p-2 border-[3px] border-teal rounded-xl bg-black/20">
        {(Object.keys(character.abilities) as Array<keyof typeof character.abilities>).map((key) => (
          <article key={key} className="bg-[#f5f5f5] text-[#111] rounded-lg text-center min-h-[72px] p-1.5 border-2 border-mint shadow-sm hover:border-teal transition-colors group">
            <h3 className="m-0 text-sm font-black uppercase tracking-tight mb-1 group-hover:text-teal">{key.toUpperCase()}</h3>
            <div className="grid grid-cols-3 gap-1">
              <div>
                <span className="block text-[0.6rem] font-bold opacity-60">Score</span>
                <strong className="text-[1.2rem] leading-none">{(derived as any).finalAbilities[key]}</strong>
              </div>
              <div>
                <span className="block text-[0.6rem] font-bold opacity-60">Mod</span>
                <strong className="text-[1.2rem] leading-none">{signed(derived.modifiers[key])}</strong>
              </div>
              <div className={cn("flex flex-col items-center", character.savingThrows.includes(key) && "text-blue")}>
                <span className="block text-[0.6rem] font-bold opacity-60">Save</span>
                <strong className="text-[1.2rem] leading-none">{signed(derived.savingThrows[key])}</strong>
              </div>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
};
