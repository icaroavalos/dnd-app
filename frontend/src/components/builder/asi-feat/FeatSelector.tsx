import React, { useMemo } from 'react';
import { useCharacterStore } from '../../../store/useCharacterStore';
import { useDerivedState } from '../../../hooks/useDerivedState';
import { cn } from '../../../lib/utils';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { RuleText } from '../../ui/RuleText';

interface FeatSelectorProps {
  selectedFeatId: string | null;
  onSelect: (featId: string) => void;
  selectedAbility?: string | null;
  onSelectAbility?: (ability: string) => void;
}

export const FeatSelector: React.FC<FeatSelectorProps> = ({ 
  selectedFeatId, 
  onSelect,
  selectedAbility,
  onSelectAbility
}) => {
  const { featsCatalog, character } = useCharacterStore();
  const { finalAbilities } = useDerivedState();

  const validateFeat = (feat: any) => {
    const reasons: string[] = [];
    
    // 1. Check if already possessed
    if (character.features.some(f => f.name === feat.name) && !feat.repeatable) {
      reasons.push('Você já possui este talento.');
    }

    // 2. Check Prerequisites
    if (feat.prerequisite) {
      for (const pre of feat.prerequisite) {
        // Level
        if (pre.level && character.level < pre.level) {
          reasons.push(`Nível mínimo: ${pre.level}`);
        }
        // Ability
        if (pre.ability) {
          for (const abMap of pre.ability) {
            for (const [ab, val] of Object.entries(abMap)) {
              if ((finalAbilities as any)[ab] < (val as number)) {
                reasons.push(`${ab.toUpperCase()} mínimo: ${val}`);
              }
            }
          }
        }
        // Feature
        if (pre.feature) {
          for (const featName of pre.feature) {
            if (!character.features.some(f => f.name.toLowerCase().includes(featName.toLowerCase()))) {
              reasons.push(`Requer característica: ${featName}`);
            }
          }
        }
        // Proficiency
        if (pre.proficiency) {
          for (const p of pre.proficiency) {
            if (p.armor && !character.features.some(f => f.description.toLowerCase().includes(`${p.armor} armor`))) {
              // Note: This is a bit simplified as our character sheet doesn't have a clean 'armorProficiencies' array yet
              // but we can look into features/description.
              reasons.push(`Requer proficiência com armadura ${p.armor}`);
            }
          }
        }
      }
    }

    return { isValid: reasons.length === 0, reasons };
  };

  const sortedFeats = useMemo(() => {
    return [...featsCatalog].sort((a, b) => a.name.localeCompare(b.name));
  }, [featsCatalog]);

  const selectedFeat = featsCatalog.find(f => f.id === selectedFeatId);
  const abilityChoice = selectedFeat?.ability?.find((a: any) => a.choose);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
        {sortedFeats.map(feat => {
          const { isValid, reasons } = validateFeat(feat);
          const isSelected = selectedFeatId === feat.id;

          return (
            <button
              key={feat.id}
              disabled={!isValid && !isSelected}
              onClick={() => onSelect(feat.id)}
              className={cn(
                "p-4 rounded-2xl border-2 text-left transition-all flex flex-col gap-2 group",
                isSelected
                  ? "bg-gold border-gold text-bg"
                  : "bg-zinc-900/40 border-line hover:border-gold/30 text-muted",
                !isValid && !isSelected && "opacity-40 grayscale cursor-not-allowed"
              )}
            >
              <div className="flex justify-between items-center w-full">
                <strong className={cn("text-base font-black uppercase tracking-tight", isSelected ? "text-bg" : "text-white")}>
                  {feat.name}
                </strong>
                {isSelected ? <CheckCircle2 size={18} /> : !isValid && <AlertCircle size={16} className="text-rose" />}
              </div>

              {!isValid && !isSelected && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {reasons.map((r, i) => (
                    <span key={i} className="text-[10px] font-bold bg-rose/10 text-rose px-1.5 py-0.5 rounded border border-rose/20">
                      {r}
                    </span>
                  ))}
                </div>
              )}

              {isSelected && (
                <div className="text-xs font-medium leading-relaxed mt-1 animate-in fade-in duration-300">
                  <RuleText text={Array.isArray(feat.entries) ? feat.entries[0] : feat.entries} />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Half-Feat Ability Selector */}
      {selectedFeat && abilityChoice && (
        <div className="p-5 bg-gold/5 border border-gold/20 rounded-2xl animate-in zoom-in-95 duration-300">
          <h4 className="text-xs font-black uppercase tracking-widest text-gold mb-4 flex items-center gap-2">
            <Info size={14} />
            Bônus de Atributo (+1)
          </h4>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {abilityChoice.choose.from.map((ab: string) => (
              <button
                key={ab}
                onClick={() => onSelectAbility?.(ab)}
                className={cn(
                  "py-2 rounded-xl border-2 text-[0.7rem] font-black uppercase transition-all",
                  selectedAbility === ab
                    ? "bg-gold border-gold text-bg shadow-lg"
                    : "bg-zinc-900 border-line text-muted hover:border-gold/50"
                )}
              >
                {ab}
              </button>
            ))}
          </div>
          <p className="text-[0.65rem] text-muted mt-3 italic">
            Este talento permite aumentar um dos atributos acima em **+1**.
          </p>
        </div>
      )}
    </div>
  );
};
