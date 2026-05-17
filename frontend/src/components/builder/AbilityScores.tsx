import React from 'react';
import { useCharacterStore } from '../../store/useCharacterStore';
import { signed } from '../../hooks/useDerivedState';
import { Card } from '../ui/Card';
import { Select } from '../ui/Select';
import type { AbilityScores as AbilityScoresType } from '../../types/character';
import { cn } from '@/lib/utils';

const ABILITY_LABELS: Record<keyof AbilityScoresType, string> = {
  str: 'Força',
  dex: 'Destreza',
  con: 'Constituição',
  int: 'Inteligência',
  wis: 'Sabedoria',
  cha: 'Carisma',
};

const POINT_BUY_COSTS: Record<number, number> = {
  8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9
};

const STANDARD_ARRAY = [15, 14, 13, 12, 10, 8];

export const AbilityScores: React.FC = () => {
  const { character, updateCharacter, updateAbility } = useCharacterStore();

  const handleMethodChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const method = e.target.value as 'standard' | 'pointBuy' | 'manual';
    let initialAbilities: AbilityScoresType = { str: null, dex: null, con: null, int: null, wis: null, cha: null };
    
    if (method === 'pointBuy') {
      initialAbilities = { str: 8, dex: 8, con: 8, int: 8, wis: 8, cha: 8 };
    }

    updateCharacter({ 
      abilityMethod: method,
      abilities: initialAbilities
    });
  };

  const calculatePointBuySpent = () => {
    return Object.values(character.abilities).reduce((acc, score) => acc + (POINT_BUY_COSTS[score || 0] || 0), 0);
  };

  const renderAbilityControl = (key: keyof AbilityScoresType, control: React.ReactNode) => {
    const baseScore = character.abilities[key];
    const bonus = character.backgroundChoices?.abilityAssignments?.[key] || 0;
    const total = (baseScore || 0) + bonus;
    const displayTotal = baseScore === null ? '-' : total;
    const modifier = Math.floor(((baseScore || 10) + bonus - 10) / 2);

    return (
      <div key={key} className="flex flex-col gap-2 p-3 bg-[#080808] border border-[#303030] rounded-xl transition-all hover:border-gold/30 group">
        <div className="flex items-center justify-between">
          <strong className="text-sm font-bold uppercase tracking-wider text-muted group-hover:text-gold transition-colors">{ABILITY_LABELS[key]}</strong>
          <div className="flex items-center gap-1.5">
            <span className="text-[0.65rem] font-black bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-400">MOD</span>
            <strong className="text-lg font-black text-white leading-none">{baseScore === null ? '-' : signed(modifier)}</strong>
          </div>
        </div>
        
        <div className="grid grid-cols-[1fr_auto] gap-3 items-center mt-1">
          {control}
          
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-1 text-[0.6rem] font-bold text-muted uppercase">
              Base {baseScore === null ? '-' : baseScore}
              {bonus > 0 && <span className="text-teal">+{bonus} BG</span>}
            </div>
            <div className="text-xl font-black text-gold leading-none mt-0.5">
              {displayTotal}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderManual = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {(Object.keys(ABILITY_LABELS) as Array<keyof AbilityScoresType>).map((key) => 
        renderAbilityControl(key, (
          <input 
            type="number" 
            value={character.abilities[key] === null ? '' : character.abilities[key]!} 
            onChange={(e) => {
              const val = e.target.value === '' ? null : parseInt(e.target.value);
              updateAbility(key, val as any);
            }}
            placeholder="-"
            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2 text-center font-bold focus:border-gold outline-none"
          />
        ))
      )}
    </div>
  );

  const renderPointBuy = () => {
    const spent = calculatePointBuySpent();
    const budget = 27;
    
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between p-3 bg-gold/10 border border-gold/30 rounded-xl">
          <span className="text-xs font-black uppercase tracking-widest text-gold">Pontos Restantes</span>
          <strong className={cn("text-2xl font-black", budget - spent < 0 ? "text-rose" : "text-white")}>
            {budget - spent}
          </strong>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {(Object.keys(ABILITY_LABELS) as Array<keyof AbilityScoresType>).map((key) => {
            const score = character.abilities[key];
            const cost = POINT_BUY_COSTS[score];
            const nextCost = (POINT_BUY_COSTS[score + 1] || 999) - cost;
            
            return renderAbilityControl(key, (
              <div className="flex items-center gap-1 bg-zinc-900 rounded-lg p-1 border border-zinc-800">
                <button 
                  onClick={() => updateAbility(key, score - 1)} 
                  disabled={score <= 8}
                  className="w-8 h-8 grid place-items-center bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 rounded-md font-bold transition-colors"
                >-</button>
                <div className="flex-1 text-center font-black text-white">{score}</div>
                <button 
                  onClick={() => updateAbility(key, score + 1)} 
                  disabled={score >= 15 || (spent + nextCost > budget)}
                  className="w-8 h-8 grid place-items-center bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 rounded-md font-bold transition-colors"
                >+</button>
              </div>
            ));
          })}
        </div>
      </div>
    );
  };

  const renderStandardArray = () => {
    const abilities = Object.keys(ABILITY_LABELS) as Array<keyof AbilityScoresType>;
    const usedScores = abilities.map(key => character.abilities[key]).filter(v => v !== null);

    return (
      <div className="flex flex-col gap-4">
        <div className="p-3 bg-zinc-900/50 border border-zinc-800 rounded-xl italic text-xs text-muted">
          Distribua os valores: {STANDARD_ARRAY.join(', ')}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {abilities.map((key) => {
            const currentVal = character.abilities[key];
            return renderAbilityControl(key, (
              <select 
                value={currentVal || "0"} 
                onChange={(e) => updateAbility(key, e.target.value === "0" ? null : parseInt(e.target.value) as any)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2 font-bold focus:border-gold outline-none text-sm appearance-none"
              >
                <option value="0">Escolher...</option>
                {/* Restrict each value to be used only once (Standard Array rule) */}
                {STANDARD_ARRAY.map(val => {
                  const isUsed = usedScores.includes(val) && val !== currentVal;
                  return (
                    <option key={val} value={val} disabled={isUsed} className={isUsed ? "text-zinc-600" : ""}>
                      {val} {isUsed ? '(Em uso)' : ''}
                    </option>
                  );
                })}
              </select>
            ));
          })}
        </div>
      </div>
    );
  };

  return (
    <Card title="Atributos (Ability Scores)">
      <div className="mb-6">
        <Select
          label="Método de Geração"
          value={character.abilityMethod}
          options={[
            ['standard', 'Standard Array'],
            ['pointBuy', 'Point Buy'],
            ['manual', 'Manual']
          ]}
          onChange={handleMethodChange}
        />
      </div>

      {character.abilityMethod === 'standard' && renderStandardArray()}
      {character.abilityMethod === 'pointBuy' && renderPointBuy()}
      {character.abilityMethod === 'manual' && renderManual()}

      <div className="mt-8 pt-6 border-t border-line">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1.5 h-4 bg-gold rounded-full" />
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gold">Visão Geral da Ficha</h3>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {(Object.keys(ABILITY_LABELS) as Array<keyof AbilityScoresType>).map((key) => {
            const base = character.abilities[key];
            const bonus = character.backgroundChoices?.abilityAssignments?.[key] || 0;
            const total = base + bonus;
            const mod = Math.floor((total - 10) / 2);
            
            return (
              <div key={key} className="text-center p-2 bg-[#111] border border-line rounded-lg flex flex-col gap-1">
                <div className="text-[10px] text-muted font-bold uppercase">{key}</div>
                <div className="text-lg font-black text-white leading-none">{total}</div>
                <div className="text-[10px] font-black text-gold">{signed(mod)}</div>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
};
