import React, { useState } from 'react';
import { useCharacterStore } from '../../store/useCharacterStore';
import { cn } from '../../lib/utils';
import { Dice5, Calculator, AlertCircle } from 'lucide-react';

export const HPGainSelector: React.FC = () => {
  const { pendingLevelUp, updateLevelUpHP } = useCharacterStore();
  const [mode, setMode] = useState<'fixed' | 'roll'>('fixed');

  if (!pendingLevelUp) return null;

  const { hitDie, conMod, hpGain } = pendingLevelUp;
  const fixedValue = Math.floor(hitDie / 2) + 1;
  const fixedTotal = Math.max(1, fixedValue + conMod);

  const handleModeChange = (newMode: 'fixed' | 'roll') => {
    setMode(newMode);
    if (newMode === 'fixed') {
      updateLevelUpHP(fixedTotal);
    }
  };

  const handleRollChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value);
    if (isNaN(val)) return;
    
    // We store the TOTAL gain (roll + conMod)
    // The input is for the ROLL result
    const total = Math.max(1, val + conMod);
    updateLevelUpHP(total);
  };

  const currentRoll = hpGain - conMod;
  const isInvalid = currentRoll < 1 || currentRoll > hitDie;

  return (
    <div className="space-y-4">
      <div className="flex gap-2 p-1 bg-zinc-950 border border-line rounded-xl">
        <button
          onClick={() => handleModeChange('fixed')}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[0.7rem] font-black uppercase transition-all",
            mode === 'fixed' ? "bg-gold text-bg shadow-lg" : "text-muted hover:text-white hover:bg-zinc-900"
          )}
        >
          <Calculator size={14} />
          Média Fixa ({fixedValue})
        </button>
        <button
          onClick={() => handleModeChange('roll')}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[0.7rem] font-black uppercase transition-all",
            mode === 'roll' ? "bg-gold text-bg shadow-lg" : "text-muted hover:text-white hover:bg-zinc-900"
          )}
        >
          <Dice5 size={14} />
          Rolar Dado (d{hitDie})
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-4 bg-zinc-900/40 border border-line rounded-2xl flex flex-col gap-1">
          <label className="text-[0.6rem] font-black text-muted uppercase tracking-widest">
            {mode === 'fixed' ? 'Valor Médio' : 'Resultado do Dado'}
          </label>
          {mode === 'fixed' ? (
            <div className="text-2xl font-black text-white">{fixedValue}</div>
          ) : (
            <div className="relative">
              <input
                type="number"
                min="1"
                max={hitDie}
                value={currentRoll}
                onChange={handleRollChange}
                className={cn(
                  "w-full bg-transparent text-2xl font-black text-white focus:outline-none",
                  isInvalid && "text-rose"
                )}
              />
              <span className="absolute right-0 bottom-1 text-xs text-muted font-bold">/ d{hitDie}</span>
            </div>
          )}
        </div>

        <div className="p-4 bg-bg border border-line rounded-2xl flex flex-col gap-1">
          <label className="text-[0.6rem] font-black text-muted uppercase tracking-widest">Ganhos Totais</label>
          <div className="flex items-baseline gap-2">
            <div className="text-2xl font-black text-gold">+{hpGain}</div>
            <span className="text-[0.7rem] text-muted font-bold">
              ({mode === 'fixed' ? fixedValue : currentRoll} dado + {conMod} con)
            </span>
          </div>
        </div>
      </div>

      {mode === 'roll' && isInvalid && (
        <div className="flex items-center gap-2 text-rose text-[0.65rem] font-bold uppercase tracking-wide bg-rose/10 p-2 rounded-lg border border-rose/20">
          <AlertCircle size={14} />
          O valor do dado deve estar entre 1 e {hitDie}.
        </div>
      )}
    </div>
  );
};
