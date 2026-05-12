import React, { useEffect, useState, useMemo } from 'react';
import { useCharacterStore } from '../../store/useCharacterStore';
import { getBackgrounds } from '../../api/catalog-api';
import type { CatalogEntry } from '../../api/catalog-api';
import { Select } from '../ui/Select';
import { Card } from '../ui/Card';
import { MagicInitiate } from './MagicInitiate';
import { cn } from '@/lib/utils';

const ABILITIES = [
  { id: 'str', label: 'FOR' },
  { id: 'dex', label: 'DES' },
  { id: 'con', label: 'CON' },
  { id: 'int', label: 'INT' },
  { id: 'wis', label: 'SAB' },
  { id: 'cha', label: 'CAR' }
];

export const BackgroundSelect: React.FC = () => {
  const { character, updateCharacter } = useCharacterStore();
  const [backgrounds, setBackgrounds] = useState<CatalogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getBackgrounds()
      .then((data) => {
        setBackgrounds(data.results);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load backgrounds:', err);
        setLoading(false);
      });
  }, []);

  const selectedBg = useMemo(() => 
    backgrounds.find(b => b.name === character.background),
    [backgrounds, character.background]
  );

  const bgChoices = character.bgChoices || {
    abilityIncrement: null,
    abilityScores: [],
    spellcastingAbility: null,
  };

  const allowedAbilities = useMemo(() => {
    if (!selectedBg?.ability) return [];
    const from = selectedBg.ability[0]?.choose?.weighted?.from || [];
    return from;
  }, [selectedBg]);

  const skillProficiencies = useMemo(() => {
    if (!selectedBg?.skillProficiencies?.[0]) return [];
    return Object.keys(selectedBg.skillProficiencies[0]);
  }, [selectedBg]);

  const toolProficiencies = useMemo(() => {
    if (!selectedBg?.toolProficiencies?.[0]) return [];
    return Object.keys(selectedBg.toolProficiencies[0]);
  }, [selectedBg]);

  const handleBgChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const bgId = e.target.value;
    const bg = backgrounds.find(b => b.id === bgId);
    if (bg) {
      updateCharacter({ 
        background: bg.name,
        bgSpellChoices: {},
        bgChoices: {
          background: bg.name,
          source: bg.source,
          abilityIncrement: null,
          abilityScores: [],
          spellcastingAbility: null,
          skillChoices: [],
          toolChoices: [],
          equipmentChoice: 'A'
        }
      });
    }
  };

  const handlePatternChange = (pattern: '2_1' | '1_1_1') => {
    updateCharacter({
      bgChoices: {
        ...bgChoices,
        abilityIncrement: pattern,
        abilityScores: []
      }
    });
  };

  const handleAbilityToggle = (ability: string) => {
    const current = bgChoices.abilityScores || [];
    const max = bgChoices.abilityIncrement === '2_1' ? 2 : 3;
    
    let next;
    if (current.includes(ability)) {
      next = current.filter((a: string) => a !== ability);
    } else if (current.length < max) {
      next = [...current, ability];
    } else {
      return;
    }

    updateCharacter({
      bgChoices: {
        ...bgChoices,
        abilityScores: next
      }
    });
  };

  const handleSpellcastingChange = (ability: string) => {
    updateCharacter({
      bgChoices: {
        ...bgChoices,
        spellcastingAbility: ability
      }
    });
  };

  const featName = selectedBg?.feats?.[0] ? Object.keys(selectedBg.feats[0])[0].split('|')[0] : null;
  const hasMagicInitiate = featName?.toLowerCase().includes('magic initiate');

  return (
    <div className="flex flex-col gap-4">
      <Card title="Segundo Plano (Background)">
        <Select
          label="Escolha seu background"
          value={selectedBg?.id || ''}
          options={backgrounds.map(b => [b.id, b.name])}
          onChange={handleBgChange}
          disabled={loading}
          helperText={selectedBg?.description}
        />

        {selectedBg && (
          <div className="grid gap-6 py-2">
            {/* Ability Increments */}
            <div className="grid gap-3">
              <h3 className="text-[0.95rem] font-bold text-gold uppercase tracking-[0.5px] border-b border-line pb-1">Aumento de Atributos</h3>
              <p className="text-[0.8rem] text-muted mt-[-0.25rem]">Escolha como distribuir seus bônus de atributo (+2/+1 ou +1/+1/+1).</p>
              
              <div className="grid grid-cols-2 gap-3">
                <button
                  className={cn(
                    "p-3 bg-bg border border-line rounded-lg cursor-pointer text-center transition-all duration-200 hover:border-teal",
                    bgChoices.abilityIncrement === '2_1' && "border-teal bg-teal/10"
                  )}
                  onClick={() => handlePatternChange('2_1')}
                >
                  <strong className="block text-[1.1rem]">+2 / +1</strong>
                  <span className="text-[0.75rem] text-muted">Dois atributos diferentes</span>
                </button>
                <button
                  className={cn(
                    "p-3 bg-bg border border-line rounded-lg cursor-pointer text-center transition-all duration-200 hover:border-teal",
                    bgChoices.abilityIncrement === '1_1_1' && "border-teal bg-teal/10"
                  )}
                  onClick={() => handlePatternChange('1_1_1')}
                >
                  <strong className="block text-[1.1rem]">+1 / +1 / +1</strong>
                  <span className="text-[0.75rem] text-muted">Três atributos diferentes</span>
                </button>
              </div>

              {bgChoices.abilityIncrement && (
                <div className="flex flex-wrap gap-2">
                  {ABILITIES.map(ability => {
                    const isAllowed = allowedAbilities.includes(ability.id);
                    const isSelected = bgChoices.abilityScores.includes(ability.id);
                    return (
                      <button
                        key={ability.id}
                        disabled={!isAllowed}
                        className={cn(
                          "px-[0.8rem] py-[0.4rem] bg-bg border border-line rounded-md cursor-pointer font-bold text-[0.85rem] uppercase transition-all duration-200",
                          isSelected && "bg-teal border-teal text-panel",
                          !isAllowed && "opacity-40 cursor-not-allowed"
                        )}
                        onClick={() => handleAbilityToggle(ability.id)}
                      >
                        {ability.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Proficiencies */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-3">
                <h3 className="text-[0.95rem] font-bold text-gold uppercase tracking-[0.5px] border-b border-line pb-1">Perícias</h3>
                <div className="flex flex-wrap gap-2">
                  {skillProficiencies.map(skill => (
                    <span key={skill} className="px-[0.8rem] py-[0.4rem] bg-bg border border-line rounded-md cursor-pointer font-bold text-[0.85rem] uppercase transition-all duration-200 bg-teal border-teal text-panel opacity-40 cursor-not-allowed">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
              
              <div className="grid gap-3">
                <h3 className="text-[0.95rem] font-bold text-gold uppercase tracking-[0.5px] border-b border-line pb-1">Ferramentas</h3>
                <div className="flex flex-wrap gap-2">
                  {toolProficiencies.map(tool => (
                    <span key={tool} className="px-[0.8rem] py-[0.4rem] bg-bg border border-line rounded-md cursor-pointer font-bold text-[0.85rem] uppercase transition-all duration-200 bg-teal border-teal text-panel opacity-40 cursor-not-allowed">
                      {tool}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Feat Display */}
            <div className="grid gap-3">
              <h3 className="text-[0.95rem] font-bold text-gold uppercase tracking-[0.5px] border-b border-line pb-1">Talento de Origem</h3>
              <div className="p-4 bg-bg border border-teal border-l-4 rounded-md">
                <strong className="block text-teal mb-1">{featName || 'Nenhum talento detectado'}</strong>
                <p className="text-[0.85rem] text-muted m-0 leading-[1.4]">Este talento é concedido automaticamente pela sua origem.</p>
              </div>
            </div>

            {/* Spellcasting Ability if Magic Initiate */}
            {hasMagicInitiate && (
              <div className="grid gap-3">
                <h3 className="text-[0.95rem] font-bold text-gold uppercase tracking-[0.5px] border-b border-line pb-1">Atributo de Conjuração</h3>
                <p className="text-[0.8rem] text-muted mt-[-0.25rem]">Escolha o atributo usado para as magias do talento Magic Initiate.</p>
                <div className="flex gap-2">
                  {['int', 'wis', 'cha'].map(abilityId => {
                    const ability = ABILITIES.find(a => a.id === abilityId);
                    return (
                      <button
                        key={abilityId}
                        className={cn(
                          "px-[0.8rem] py-[0.4rem] bg-bg border border-line rounded-md cursor-pointer font-bold text-[0.85rem] uppercase transition-all duration-200",
                          bgChoices.spellcastingAbility === abilityId && "bg-teal border-teal text-panel"
                        )}
                        onClick={() => handleSpellcastingChange(abilityId)}
                      >
                        {ability?.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </Card>

      {hasMagicInitiate && bgChoices.spellcastingAbility && (
        <div className="mt-4">
          <MagicInitiate />
        </div>
      )}
    </div>
  );
};
