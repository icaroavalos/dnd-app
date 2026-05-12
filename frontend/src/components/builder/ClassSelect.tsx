import React, { useEffect, useState } from 'react';
import { useCharacterStore } from '../../store/useCharacterStore';
import { getClasses } from '../../api/catalog-api';
import type { CatalogEntry } from '../../api/catalog-api';
import { Select } from '../ui/Select';
import { Checkbox } from '../ui/Checkbox';
import { Card } from '../ui/Card';
import { cn } from '@/lib/utils';

export const ClassSelect: React.FC = () => {
  const { character, updateCharacter, toggleSkillProficiency } = useCharacterStore();
  const [classList, setClassList] = useState<CatalogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getClasses()
      .then((data) => {
        setClassList(data.results);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load classes:', err);
        setLoading(false);
      });
  }, []);

  const handleClassChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const classId = e.target.value;
    const cls = classList.find(c => c.id === classId);
    if (cls) {
      updateCharacter({ 
        class: cls.name,
        // Reset class skills when changing class
        skillProficiencies: character.skillProficiencies.filter(s => 
          !character.classSkillChoices.includes(s)
        ),
        classSkillChoices: [], 
        features: (cls.features || []).map((f: any) => ({
          id: f.id || Math.random().toString(),
          name: f.name,
          kind: 'class',
          description: f.description || ''
        }))
      });
    }
  };

  const selectedClass = classList.find(c => c.name === character.class);
  const selectedClassId = selectedClass?.id || '';

  // Get skill choices from catalog entry
  const skillChoiceData = selectedClass?.startingProficiencies?.skills?.[0]?.choose;
  const skillOptions = skillChoiceData?.from || [];
  const skillCount = skillChoiceData?.count || 2;

  const currentSkillChoices = character.skillProficiencies.filter(s => skillOptions.includes(s));

  return (
    <div className="flex flex-col gap-4">
      <Select
        label="Classe"
        value={selectedClassId}
        options={classList.map(c => [c.id, c.name])}
        onChange={handleClassChange}
        disabled={loading}
        helperText={selectedClass?.description ? String(selectedClass.description).substring(0, 150) + '...' : undefined}
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
          <p className="m-0 text-muted leading-[1.45] mt-2">
            Selecionadas: {currentSkillChoices.length} / {skillCount}
          </p>
        </Card>
      )}

      {selectedClass && (
        <Card title="Equipamento Inicial" className="mt-4">
          <div className="field">
            <label>Opções de Equipamento</label>
            <Select
              label=""
              value={character.equipmentChoices['starting'] || ''}
              options={[
                ['A', 'Opção A (Equipamento Padrão)'],
                ['B', 'Opção B (Ouro para comprar)']
              ]}
              onChange={(e) => updateCharacter({ 
                equipmentChoices: { ...character.equipmentChoices, starting: e.target.value } 
              })}
            />
            <p className="m-0 text-muted leading-[1.45] mt-1">
              {selectedClass.startingEquipment?.entries?.[0] || 'Escolha entre o pacote de equipamentos ou ouro inicial.'}
            </p>
          </div>
        </Card>
      )}
    </div>
  );
};
