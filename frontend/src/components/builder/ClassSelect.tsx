import React, { useEffect, useState, useMemo } from 'react';
import { useCharacterStore } from '../../store/useCharacterStore';
import { getClasses, getFeatures, getItems } from '../../api/catalog-api';
import type { CatalogEntry } from '../../api/catalog-api';
import { Select } from '../ui/Select';
import { Checkbox } from '../ui/Checkbox';
import { Card } from '../ui/Card';
import { cn } from '@/lib/utils';
import { parse5eEntry, clean5eText } from '../../lib/data-parser';

export const ClassSelect: React.FC = () => {
  const { character, updateCharacter, toggleSkillProficiency, setFeaturesByKind } = useCharacterStore();
  const [classList, setClassList] = useState<CatalogEntry[]>([]);
  const [allItems, setAllItems] = useState<CatalogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getClasses(), getItems()])
      .then(([classesData, itemsData]) => {
        setClassList(classesData.results || []);
        setAllItems(itemsData.results || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load data:', err);
        setLoading(false);
      });
  }, []);

  const selectedClass = useMemo(() => 
    classList.find(c => c.name === character.class),
    [classList, character.class]
  );

  const handleClassChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const classId = e.target.value;
    const cls = classList.find(c => c.id === classId);
    if (cls) {
      updateCharacter({ 
        class: cls.name,
        skillProficiencies: character.skillProficiencies.filter(s => 
          !character.classSkillChoices.includes(s)
        ),
        classSkillChoices: [], 
        classFeatureChoices: {},
        equipmentChoices: { ...character.equipmentChoices, class: null }
      });

      try {
        const featuresData = await getFeatures();
        const classFeatures = (featuresData.results || []).filter(f => 
          f.className?.toLowerCase() === cls.name.toLowerCase() && 
          (f.level === 1 || !f.level)
        );

        const mappedFeatures = classFeatures.map(f => {
          const name = f.name.toLowerCase();
          let resource;
          
          if (name === 'rage') {
            resource = { id: 'rage', remaining: 2, max: 2, recoveryLabel: 'Long Rest' };
          } else if (name === 'second wind') {
            resource = { id: 'second-wind', remaining: 2, max: 2, recoveryLabel: 'Short Rest' };
          }

          return {
            id: f.id || `${f.name}-class`.toLowerCase().replace(/\s+/g, '-'),
            name: f.name,
            kind: 'class' as const,
            description: parse5eEntry(f.entries || f.description),
            meta: f.source,
            resource
          };
        });

        setFeaturesByKind('class', mappedFeatures);
      } catch (err) {
        console.error('Failed to load class features:', err);
      }
    }
  };

  const handleEquipmentChange = (option: 'A' | 'B') => {
    if (!selectedClass || !selectedClass.startingEquipment) return;
    updateCharacter({
      equipmentChoices: { ...character.equipmentChoices, class: option }
    });
  };

  // Choice Detector for Level 1
  const classChoices = useMemo(() => {
    const choices: any[] = [];
    
    character.features.forEach(feat => {
      const name = feat.name.toLowerCase();
      
      if (name === "weapon mastery") {
        const options = allItems.filter(i => {
          const type = i.type?.split('|')[0] || '';
          return type === 'M' || (character.class.toLowerCase() !== 'barbarian' && type === 'R');
        }).map(i => i.name);
        
        choices.push({ 
          id: feat.id, 
          name: feat.name, 
          count: character.class.toLowerCase() === 'fighter' ? 3 : 2, 
          options: Array.from(new Set(options)).sort() 
        });
      }

      if (name === "fighting style") {
        choices.push({
          id: feat.id,
          name: "Fighting Style",
          count: 1,
          options: ["Archery", "Defense", "Dueling", "Great Weapon Fighting", "Protection", "Two-Weapon Fighting"]
        });
      }
    });
    
    return choices;
  }, [character.features, allItems, character.class]);

  const handleFeatureChoiceToggle = (featId: string, choice: string, max: number) => {
    const current = character.classFeatureChoices[featId] || [];
    let next;
    if (current.includes(choice)) {
      next = current.filter(c => c !== choice);
    } else if (current.length < max) {
      next = [...current, choice];
    } else {
      return;
    }
    updateCharacter({
      classFeatureChoices: { ...character.classFeatureChoices, [featId]: next }
    });
  };

  const skillChoiceData = selectedClass?.startingProficiencies?.skills?.[0]?.choose;
  const skillOptions = skillChoiceData?.from || [];
  const skillCount = skillChoiceData?.count || 2;
  const currentSkillChoices = character.skillProficiencies.filter(s => skillOptions.includes(s));

  return (
    <div className="flex flex-col gap-4">
      <Select
        label="Classe"
        value={selectedClass?.id || ''}
        options={classList.map(c => [c.id, c.name])}
        onChange={handleClassChange}
        disabled={loading}
        helperText={selectedClass ? clean5eText(selectedClass.description || '') : undefined}
      />

      {selectedClass && skillOptions.length > 0 && (
        <Card title={`Perícias de Classe (Escolha ${skillCount})`} className="mt-4">
          <div className="grid grid-cols-[repeat(auto-fit,minmax(170px,1fr))] gap-2 mt-2.5">
            {skillOptions.map((skill: string) => {
              const isSelected = character.skillProficiencies.includes(skill);
              const isDisabled = !isSelected && currentSkillChoices.length >= skillCount;
              return (
                <Checkbox
                  key={skill}
                  label={skill.charAt(0).toUpperCase() + skill.slice(1)}
                  checked={isSelected}
                  onChange={() => toggleSkillProficiency(skill)}
                  disabled={isDisabled}
                  className={cn(
                    "flex gap-2 items-center min-w-0 min-h-[36px] px-[9px] py-[7px] rounded-lg bg-[#080808] border border-[#2c2c2c]",
                    isDisabled && "text-[#777] bg-[#111]"
                  )}
                />
              );
            })}
          </div>
        </Card>
      )}

      {classChoices.map((choice: any) => (
        <Card key={choice.id} title={`${choice.name} (Escolha ${choice.count})`} className="mt-4 border-teal/20">
          <p className="text-[0.7rem] text-muted mb-3 italic">Defina suas escolhas de nível 1.</p>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-2 mt-2">
            {choice.options.map((opt: string) => {
              const isSelected = (character.classFeatureChoices[choice.id] || []).includes(opt);
              const isDisabled = !isSelected && (character.classFeatureChoices[choice.id] || []).length >= choice.count;
              return (
                <button
                  key={opt}
                  disabled={isDisabled}
                  onClick={() => handleFeatureChoiceToggle(choice.id, opt, choice.count)}
                  className={cn(
                    "px-3 py-2 rounded-lg border text-[0.75rem] font-bold transition-all",
                    isSelected ? "bg-teal border-teal text-bg" : "bg-bg border-line hover:border-muted",
                    isDisabled && "opacity-30 grayscale cursor-not-allowed"
                  )}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        </Card>
      ))}

      {selectedClass && selectedClass.startingEquipment && (
        <Card title="Equipamento Inicial" className="mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
            {['A', 'B'].map((option) => {
              const isSelected = character.equipmentChoices['class'] === option;
              const rawEntry = selectedClass.startingEquipment.entries?.[0] || '';
              const parts = parse5eEntry(rawEntry).split('; or (B)');
              const parsedText = option === 'A' 
                ? parts[0].replace(/Choose A or B: \(A\)/i, '').trim()
                : parts[1]?.trim() || 'Ouro inicial';

              return (
                <button
                  key={option}
                  onClick={() => handleEquipmentChange(option as 'A' | 'B')}
                  className={cn(
                    "p-4 rounded-xl border text-left transition-all duration-300 flex flex-col gap-2 min-h-[140px]",
                    isSelected ? "bg-blue/10 border-blue shadow-lg shadow-blue/5" : "bg-bg border-line hover:border-muted"
                  )}
                >
                  <div className="flex justify-between items-center">
                    <strong className="text-blue font-black text-sm uppercase tracking-widest">Opção {option}</strong>
                    {isSelected && <div className="w-3 h-3 rounded-full bg-blue shadow-[0_0_8px_rgba(120,116,255,0.5)]" />}
                  </div>
                  <div className="text-[0.75rem] text-muted leading-relaxed">
                    {parsedText}
                  </div>
                </button>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
};
