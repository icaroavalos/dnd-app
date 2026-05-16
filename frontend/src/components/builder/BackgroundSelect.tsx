import React, { useEffect, useState, useMemo } from 'react';
import { useCharacterStore } from '../../store/useCharacterStore';
import { getBackgrounds } from '../../api/catalog-api';
import type { CatalogEntry } from '../../api/catalog-api';
import { Select } from '../ui/Select';
import { Card } from '../ui/Card';
import { MagicInitiate } from './MagicInitiate';
import { RuleText } from '../ui/RuleText';
import { cn } from '@/lib/utils';
import { parse5eEntry, findEntryByName, parseResourceInfo } from '../../lib/data-parser';

const ABILITIES = [
  { id: 'str', label: 'FOR' },
  { id: 'dex', label: 'DES' },
  { id: 'con', label: 'CON' },
  { id: 'int', label: 'INT' },
  { id: 'wis', label: 'SAB' },
  { id: 'cha', label: 'CAR' }
];

const SKILLS = [
  "Acrobatics", "Animal Handling", "Arcana", "Athletics", "Deception", "History",
  "Insight", "Intimidation", "Investigation", "Medicine", "Nature", "Perception",
  "Performance", "Persuasion", "Religion", "Sleight of Hand", "Stealth", "Survival"
];

export const BackgroundSelect: React.FC = () => {
  const { character, updateCharacter, setFeaturesByKind } = useCharacterStore();
  const [backgrounds, setBackgrounds] = useState<CatalogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const bgChoices = character.bgChoices;

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

  const allowedAbilities = useMemo(() => {
    if (!selectedBg?.ability) return [];
    // Handle complex choose structures in 2024 data
    const from = selectedBg.ability[0]?.choose?.weighted?.from ||
                 selectedBg.ability[0]?.choose?.from ||
                 ['str', 'dex', 'con', 'int', 'wis', 'cha'];
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
      // Normalize skill names to Title Case for consistency (capitalizing each word)
      const normalize = (s: string) => s.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
      const bgSkills = bg.skillProficiencies?.[0]
        ? Object.keys(bg.skillProficiencies[0]).map(normalize)
        : [];

      // Check for collisions with existing skills (e.g. from Species)
      const existingSkills = character.skillProficiencies.filter(s => !bgSkills.includes(s));
      const collisions = bgSkills.filter(s => existingSkills.includes(s));

      updateCharacter({
        background: bg.name,
        skillProficiencies: [
          ...existingSkills,
          ...bgSkills
        ],
        bgSpellChoices: {},
        spells: character.spells.filter(s => s.source !== 'bg-feat'),
        bgChoices: {
          background: bg.name,
          source: bg.source,
          abilityIncrement: null,
          abilityScores: [],
          spellcastingAbility: null,
          skillChoices: [],
          toolChoices: [],
          equipmentChoice: null,
          skillCollisions: collisions
        },
        backgroundChoices: {
          backgroundId: bg.name.toLowerCase().replace(/\s+/g, '-'),
          abilityAssignments: {}
        }
      });

      const traits = (bg.entries || []).filter((e: any) => e.type === 'entries' || e.name);
      const mappedFeatures = traits.map((t: any) => {
        const desc = parse5eEntry(t);
        const resource = parseResourceInfo(desc, character, { proficiencyBonus: 2, modifiers: { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 } });
        if (resource) resource.id = t.id || `${t.name}-bg-${bg.source}`.toLowerCase().replace(/\s+/g, '-');

        return {
          id: t.id || `${t.name}-bg-${bg.source}`.toLowerCase().replace(/\s+/g, '-'),
          name: t.name,
          kind: t.name?.toLowerCase().includes('feat') ? 'feat' as const : 'background' as const,
          description: desc,
          meta: bg.source,
          resource
        };
      });

      // Explicitly add Origin Feat if present in the 'feats' property of the background
      const originFeatName = bg.feats?.[0] ? Object.keys(bg.feats[0])[0].split('|')[0] : null;
      if (originFeatName && !mappedFeatures.some((f: any) => f.name === originFeatName)) {
        mappedFeatures.push({
          id: `origin-feat-${originFeatName.toLowerCase().replace(/\s+/g, '-')}`,
          name: originFeatName,
          kind: 'feat' as const,
          description: `Origin Feat: ${originFeatName}. Concedido pelo background ${bg.name}.`,
          meta: bg.source
        });
      }

      setFeaturesByKind('background', mappedFeatures);
    }
  };

  const handlePatternChange = (pattern: '2_1' | '1_1_1') => {
    updateCharacter({
      bgChoices: {
        ...bgChoices,
        abilityIncrement: pattern,
        abilityScores: []
      },
      backgroundChoices: {
        ...character.backgroundChoices,
        abilityAssignments: {}
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

    const assignments: Record<string, number> = {};
    next.forEach((abilityId, index) => {
      if (bgChoices.abilityIncrement === '2_1') {
        assignments[abilityId] = index === 0 ? 2 : 1;
      } else {
        assignments[abilityId] = 1;
      }
    });

    updateCharacter({
      bgChoices: {
        ...bgChoices,
        abilityScores: next
      },
      backgroundChoices: {
        backgroundId: character.background.toLowerCase().replace(/\s+/g, '-'),
        abilityAssignments: assignments
      }
    });
  };

  const handleGenericSkillToggle = (skill: string) => {
    const currentChoices = bgChoices.skillChoices || [];
    const max = bgChoices.skillCollisions?.length || 0;

    let next;
    if (currentChoices.includes(skill)) {
      next = currentChoices.filter((s: string) => s !== skill);
    } else if (currentChoices.length < max) {
      next = [...currentChoices, skill];
    } else {
      if (max === 1) next = [skill];
      else return;
    }

    updateCharacter({
      bgChoices: { ...bgChoices, skillChoices: next },
      skillProficiencies: [
        ...character.skillProficiencies.filter(s => !currentChoices.includes(s)),
        ...next
      ]
    });
  };

  const handleEquipmentChange = (option: 'A' | 'B') => {
    const bg = selectedBg;
    if (!bg || !bg.startingEquipment) return;

    const bgEq = bg.startingEquipment[0] || {};
    // Handle both uppercase and lowercase keys in the data
    const itemsData = bgEq[option] || bgEq[option.toLowerCase()] || [];

    const newInventory = itemsData.map((entry: any) => {
      if (typeof entry === 'string') return { baseItemId: entry.split('|')[0], quantity: 1, status: 'backpack' };
      if (entry.item) return { baseItemId: entry.item.split('|')[0], quantity: entry.quantity || 1, status: 'backpack' };
      if (entry.value) return { baseItemId: 'gp', quantity: entry.value / 100, status: 'backpack' };
      return null;
    }).filter(Boolean);

    updateCharacter({
      bgChoices: {
        ...character.bgChoices,
        equipmentChoice: option
      },
      inventory: [
        ...character.inventory.filter((i: any) => i.source !== 'background'),
        ...newInventory.map((i: any) => ({ ...i, source: 'background' }))
      ]
    });
  };

  const handleSpellcastingChange = (ability: string) => {
    updateCharacter({
      bgChoices: {
        ...character.bgChoices,
        spellcastingAbility: ability
      }
    });
  };

  const featNameRaw = selectedBg?.feats?.[0] ? Object.keys(selectedBg.feats[0])[0] : null;
  const featName = featNameRaw?.split('|')[0];
  const spellListConstraint = featNameRaw?.includes(';') ? featNameRaw.split(';')[1].split('|')[0].trim() : null;
  const hasMagicInitiate = featName?.toLowerCase().includes('magic initiate');

  const equipmentDescription = useMemo(() => {
    if (!selectedBg) return null;
    const eqEntry = findEntryByName(selectedBg.entries, "Equipment");
    return eqEntry ? parse5eEntry(eqEntry.entry) : null;
  }, [selectedBg]);

  return (
    <div className="flex flex-col gap-4">
      <Card title="Segundo Plano (Background)">
        <Select
          label="Escolha seu background"
          value={selectedBg?.id || ''}
          options={backgrounds.map(b => [b.id, b.name])}
          onChange={handleBgChange}
          disabled={loading}
          helperText={selectedBg ? parse5eEntry(selectedBg.description || '') : undefined}
        />

        {selectedBg && (
          <div className="grid gap-6 py-2">
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
                    const selectedIndex = bgChoices.abilityScores.indexOf(ability.id);
                    const isSelected = selectedIndex !== -1;

                    let bonusLabel = '';
                    if (isSelected) {
                      if (bgChoices.abilityIncrement === '2_1') {
                        bonusLabel = selectedIndex === 0 ? '+2' : '+1';
                      } else {
                        bonusLabel = '+1';
                      }
                    }

                    return (
                      <button
                        key={ability.id}
                        disabled={!isAllowed}
                        className={cn(
                          "relative px-[0.8rem] py-[0.4rem] bg-bg border border-line rounded-md cursor-pointer font-bold text-[0.85rem] uppercase transition-all duration-200 min-w-[70px]",
                          isSelected && "bg-teal border-teal text-panel",
                          !isAllowed && "opacity-40 cursor-not-allowed"
                        )}
                        onClick={() => handleAbilityToggle(ability.id)}
                      >
                        {ability.label}
                        {isSelected && (
                          <span className="absolute -top-2 -right-2 bg-gold text-bg text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-bg shadow-sm">
                            {bonusLabel}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-3">
                <h3 className="text-[0.95rem] font-bold text-gold uppercase tracking-[0.5px] border-b border-line pb-1">Perícias</h3>
                <div className="flex flex-wrap gap-2">
                  {skillProficiencies.map(skill => (
                    <span key={skill} className="px-[0.8rem] py-[0.4rem] bg-teal/10 border border-teal/40 rounded-md font-bold text-[0.85rem] uppercase text-teal">
                      {skill}
                    </span>
                  ))}
                </div>
                {bgChoices.skillCollisions?.length > 0 && (
                  <div className="mt-2 p-3 bg-gold/10 border border-gold/30 rounded-lg col-span-2">
                    <p className="text-[0.75rem] text-gold font-bold mb-2 leading-tight">
                      Você já possui {bgChoices.skillCollisions.join(' e ')} via sua Linhagem. Escolha {bgChoices.skillCollisions.length} perícia(s) substituta(s):
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {SKILLS.map(skill => {
                        const isOriginal = skillProficiencies.includes(skill);
                        const isSelected = bgChoices.skillChoices?.includes(skill);
                        const isDisabled = isOriginal || (!isSelected && (bgChoices.skillChoices?.length || 0) >= bgChoices.skillCollisions.length);

                        return (
                          <button
                            key={skill}
                            disabled={isDisabled}
                            onClick={() => handleGenericSkillToggle(skill)}
                            className={cn(
                              "text-[0.65rem] px-2 py-1 rounded border font-bold uppercase transition-all",
                              isSelected ? "bg-gold border-gold text-bg" : "bg-bg border-line text-muted",
                              isDisabled && !isSelected && "opacity-30 cursor-not-allowed"
                            )}
                          >
                            {skill}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div className="grid gap-3">
                <h3 className="text-[0.95rem] font-bold text-gold uppercase tracking-[0.5px] border-b border-line pb-1">Ferramentas</h3>
                <div className="flex flex-wrap gap-2">
                  {toolProficiencies.map(tool => (
                    <span key={tool} className="px-[0.8rem] py-[0.4rem] bg-teal/10 border border-teal/40 rounded-md font-bold text-[0.85rem] uppercase text-teal">
                      {tool}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {selectedBg.startingEquipment && (
              <div className="grid gap-3">
                <h3 className="text-[0.95rem] font-bold text-gold uppercase tracking-[0.5px] border-b border-line pb-1">Equipamento Inicial</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
                  {['A', 'B'].map((option: any) => {
                    const isSelected = bgChoices.equipmentChoice === option;
                    const parts = (equipmentDescription || '').split('; or (B)');
                    const parsedText = option === 'A'
                      ? parts[0].replace(/Choose A or B: \(A\)/i, '').trim()
                      : parts[1]?.trim() || '50 GP';

                    return (
                      <div
                        key={option}
                        data-testid={`equipment-option-${option}`}
                        data-selected={isSelected}
                        onClick={() => handleEquipmentChange(option as 'A' | 'B')}
                        className={cn(
                          "p-4 rounded-xl border text-left transition-all duration-300 flex flex-col gap-2 min-h-[140px] cursor-pointer",
                          isSelected ? "bg-teal/10 border-teal shadow-lg shadow-teal/5" : "bg-bg border-line hover:border-muted"
                        )}
                      >
                        <div className="flex justify-between items-center pointer-events-none">
                          <strong className="text-teal font-black text-sm uppercase tracking-widest">Opção {option}</strong>
                          {isSelected && <div className="w-3 h-3 rounded-full bg-teal shadow-[0_0_8px_rgba(45,210,75,0.5)]" />}
                        </div>
                        <div className="pointer-events-none">
                          <RuleText text={parsedText} className="text-[0.75rem] text-muted leading-relaxed" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="grid gap-3">
              <h3 className="text-[0.95rem] font-bold text-gold uppercase tracking-[0.5px] border-b border-line pb-1">Talento de Origem</h3>
              <div className="p-4 bg-bg border border-teal border-l-4 rounded-md">
                <strong className="block text-teal mb-1 uppercase">{featName || 'Nenhum talento detectado'}</strong>
                <p className="text-[0.85rem] text-muted m-0 leading-[1.4]">Este talento é concedido automaticamente pela sua origem.</p>
              </div>
            </div>

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
          <MagicInitiate constraintClass={spellListConstraint} />
        </div>
      )}
    </div>
  );
};
