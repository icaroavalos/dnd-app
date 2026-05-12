import React from 'react';
import { useCharacterStore } from '../../store/useCharacterStore';
import { Card } from '../ui/Card';
import { Select } from '../ui/Select';
import type { AbilityScores as AbilityScoresType } from '../../types/character';
import styles from './AbilityScores.module.css';
import { clsx } from 'clsx';

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
    const method = e.target.value as any;
    updateCharacter({ 
      abilityMethod: method,
      abilities: method === 'pointBuy' 
        ? { str: 8, dex: 8, con: 8, int: 8, wis: 8, cha: 8 }
        : { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 }
    });
  };

  const calculateModifier = (score: number) => Math.floor((score - 10) / 2);
  const formatModifier = (mod: number) => (mod >= 0 ? `+${mod}` : mod);

  const calculatePointBuySpent = () => {
    return Object.values(character.abilities).reduce((acc, score) => acc + (POINT_BUY_COSTS[score] || 0), 0);
  };

  const renderManual = () => (
    <div className={styles.abilityGrid}>
      {(Object.keys(ABILITY_LABELS) as Array<keyof AbilityScoresType>).map((key) => (
        <div key={key} className={styles.pointBuyRow}>
          <div className="flex flex-col">
            <strong>{ABILITY_LABELS[key]}</strong>
            <span>Mod: {formatModifier(calculateModifier(character.abilities[key]))}</span>
          </div>
          <div className={styles.scoreStepper}>
            <input 
              type="number" 
              value={character.abilities[key]} 
              onChange={(e) => updateAbility(key, parseInt(e.target.value) || 0)}
              className="w-16 text-center"
            />
          </div>
        </div>
      ))}
    </div>
  );

  const renderPointBuy = () => {
    const spent = calculatePointBuySpent();
    const budget = 27;
    
    return (
      <div className="flex flex-col gap-4">
        <div className={styles.pointBuyHead}>
          <span>Pontos: {spent} / {budget}</span>
          <span>{budget - spent} restantes</span>
        </div>
        <div className={styles.pointBuyGrid}>
          {(Object.keys(ABILITY_LABELS) as Array<keyof AbilityScoresType>).map((key) => {
            const score = character.abilities[key];
            const cost = POINT_BUY_COSTS[score];
            const nextCost = POINT_BUY_COSTS[score + 1] - cost;
            
            return (
              <div key={key} className={styles.pointBuyRow}>
                <div className="flex flex-col">
                  <strong>{ABILITY_LABELS[key]}</strong>
                  <span>Mod: {formatModifier(calculateModifier(score))}</span>
                </div>
                <div className={styles.scoreStepper}>
                  <button 
                    onClick={() => updateAbility(key, score - 1)} 
                    disabled={score <= 8}
                    className="mini-button"
                  >-</button>
                  <output>{score}</output>
                  <button 
                    onClick={() => updateAbility(key, score + 1)} 
                    disabled={score >= 15 || (spent + nextCost > budget)}
                    className="mini-button"
                  >+</button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderStandardArray = () => (
    <div className="flex flex-col gap-4">
      <p className="hint">Valores disponíveis: {STANDARD_ARRAY.join(', ')}</p>
      <div className={styles.abilityGrid}>
        {(Object.keys(ABILITY_LABELS) as Array<keyof AbilityScoresType>).map((key) => (
          <div key={key} className={styles.pointBuyRow}>
            <div className="flex flex-col">
              <strong>{ABILITY_LABELS[key]}</strong>
              <span>Mod: {formatModifier(calculateModifier(character.abilities[key]))}</span>
            </div>
            <div className={styles.scoreStepper}>
              <select 
                value={character.abilities[key]} 
                onChange={(e) => updateAbility(key, parseInt(e.target.value))}
                className="bg-black text-white border border-gray-700 rounded p-1"
              >
                <option value="0">--</option>
                {STANDARD_ARRAY.map(val => (
                  <option key={val} value={val}>{val}</option>
                ))}
              </select>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <Card title="Atributos (Ability Scores)">
      <div className="mb-6">
        <Select
          label="Método de geração"
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

      <div className="mt-6 p-4 bg-gold/10 border border-gold/30 rounded-lg">
        <h3 className="text-sm font-bold uppercase tracking-wider text-gold mb-3">Resumo dos Modificadores</h3>
        <div className="grid grid-cols-3 gap-4">
          {(Object.keys(ABILITY_LABELS) as Array<keyof AbilityScoresType>).map((key) => (
            <div key={key} className="text-center">
              <div className="text-xs text-muted uppercase">{key}</div>
              <div className="text-xl font-black">{formatModifier(calculateModifier(character.abilities[key]))}</div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};
