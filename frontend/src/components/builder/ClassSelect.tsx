import React, { useEffect, useState, useMemo } from 'react';
import { useCharacterStore } from '../../store/useCharacterStore';
import { getClasses, getFeatures, getItems, getFeats } from '../../api/catalog-api';
import type { CatalogEntry } from '../../api/catalog-api';
import { Select } from '../ui/Select';
import { Checkbox } from '../ui/Checkbox';
import { Card } from '../ui/Card';
import { RuleText } from '../ui/RuleText';
import { cn } from '@/lib/utils';
import { parse5eEntry, clean5eText, parseResourceInfo } from '../../lib/data-parser';
import { ChoiceSelector } from '../ui/ChoiceSelector';

const SKILLS = [
  "Acrobatics", "Animal Handling", "Arcana", "Athletics", "Deception", "History",
  "Insight", "Intimidation", "Investigation", "Medicine", "Nature", "Perception",
  "Performance", "Persuasion", "Religion", "Sleight of Hand", "Stealth", "Survival"
];

export const ClassSelect: React.FC = () => {
  const { character, updateCharacter, toggleSkillProficiency, setFeaturesByKind } = useCharacterStore();
  const [classList, setClassList] = useState<CatalogEntry[]>([]);
  const [allItems, setAllItems] = useState<CatalogEntry[]>([]);
  const [allFeats, setAllFeats] = useState<CatalogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getClasses(), getItems(), getFeats()])
      .then(([classesData, itemsData, featsData]) => {
        setClassList(classesData.results || []);
        setAllItems(itemsData.results || []);
        setAllFeats(featsData.results || []);
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
      const slugify = (str: string) => String(str ?? "").trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      
      updateCharacter({
        class: cls.name,
        classes: [{ classId: slugify(cls.name), level: character.level || 1 }],
        skillProficiencies: character.skillProficiencies.filter(s =>
          !character.classSkillChoices.includes(s)
        ),
        classSkillChoices: [],
        classFeatureChoices: {},
        equipmentChoices: { ...character.equipmentChoices, class: '' }
      });

      try {
        const featuresData = await getFeatures();
        const classFeatures = (featuresData.results || []).filter(f =>
          f.className?.toLowerCase() === cls.name.toLowerCase() &&
          (f.level === 1 || !f.level)
        );

        const mappedFeatures = classFeatures.map(f => {
          const desc = parse5eEntry(f.entries || f.description);

          // Auto-detect resources
          const resource = parseResourceInfo(desc, character, { proficiencyBonus: 2, modifiers: { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 } });
          if (resource) resource.id = f.id || `${f.name}-class`.toLowerCase().replace(/\s+/g, '-');

          return {
            id: f.id || `${f.name}-class`.toLowerCase().replace(/\s+/g, '-'),
            name: f.name,
            kind: 'class' as const,
            description: desc,
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

  const handleEquipmentChange = (option: string) => {
    if (!selectedClass || !selectedClass.startingEquipment) return;
    const itemsData = selectedClass.startingEquipment.defaultData?.[0]?.[option] || [];
    const newInventory = itemsData.map((entry: any) => {
      if (typeof entry === 'string') return { baseItemId: entry.split('|')[0], quantity: 1, status: 'backpack' };
      if (entry.item) return { baseItemId: entry.item.split('|')[0], quantity: entry.quantity || 1, status: 'backpack' };
      if (entry.value) return { baseItemId: 'gp', quantity: entry.value / 100, status: 'backpack' };
      return null;
    }).filter(Boolean);

    updateCharacter({
      equipmentChoices: { ...character.equipmentChoices, class: option },
      inventory: [
        ...character.inventory.filter((i: any) => i.source !== 'class'),
        ...newInventory.map((i: any) => ({ ...i, source: 'class' }))
      ]
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
        const fsFeats = allFeats
          .filter(f => f.category === 'FS')
          .map(f => f.name)
          .sort();

        choices.push({
          id: feat.id,
          name: "Fighting Style",
          count: 1,
          options: fsFeats.length > 0
            ? fsFeats
            : ["Archery", "Defense", "Dueling", "Great Weapon Fighting", "Protection", "Two-Weapon Fighting"]
        });
      }
    });

    return choices;
  }, [character.features, allItems, allFeats, character.class]);

  const handleFeatureChoiceToggle = (featId: string, opt: string) => {
    const choice = classChoices.find(c => c.id === featId);
    if (!choice) return;

    const current = character.classFeatureChoices[featId] || [];
    let next;
    if (current.includes(opt)) {
      next = current.filter(c => c !== opt);
    } else if (current.length < choice.count) {
      next = [...current, opt];
    } else {
      if (choice.count === 1) next = [opt];
      else return;
    }
    updateCharacter({
      classFeatureChoices: { ...character.classFeatureChoices, [featId]: next }
    });
  };

  const skillChoiceData = selectedClass?.startingProficiencies?.skills?.[0];
  let skillOptions = skillChoiceData?.choose?.from || [];
  let skillCount = skillChoiceData?.choose?.count || 0;

  if (skillChoiceData?.any) {
    skillOptions = SKILLS; // Use the global list of skills
    skillCount = skillChoiceData.any;
  }

  const currentSkillChoices = character.classSkillChoices || [];

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
              const normalize = (s: string) => s.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
              const normalizedSkill = normalize(skill);

              const isClassSelected = currentSkillChoices.includes(normalizedSkill);
              const isObtainedElsewhere = character.skillProficiencies.includes(normalizedSkill) && !isClassSelected;

              const isSelected = isClassSelected || isObtainedElsewhere;
              const isDisabled = isObtainedElsewhere || (!isClassSelected && currentSkillChoices.length >= skillCount);

              return (
                <div key={skill} className={cn(
                  "relative flex items-center min-w-0 min-h-[42px] px-3 py-2 rounded-lg bg-[#080808] border border-[#2c2c2c] transition-all",
                  isObtainedElsewhere && "border-teal/30 bg-teal/5",
                  isDisabled && !isSelected && "opacity-50 grayscale"
                )}>
                  <Checkbox
                    label={normalizedSkill}
                    checked={isSelected}
                    onChange={() => toggleSkillProficiency(normalizedSkill, true)}
                    disabled={isDisabled}
                    className="flex-1"
                  />
                  {isObtainedElsewhere && (
                    <span className="absolute -top-2 -right-1 bg-teal text-bg text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter shadow-sm border border-teal/20">
                      Já possui
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {classChoices.map((choice: any) => (
        <div key={choice.id} className="mt-4">
          <ChoiceSelector
            choice={choice}
            selections={character.classFeatureChoices[choice.id] || []}
            onToggle={(opt) => handleFeatureChoiceToggle(choice.id, opt)}
          />
        </div>
      ))}

      {selectedClass && selectedClass.startingEquipment && (
        <Card title="Equipamento Inicial" className="mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
            {equipmentOptions(selectedClass.startingEquipment).map((option) => {
              const isSelected = character.equipmentChoices['class'] === option;
              const rawEntry = selectedClass.startingEquipment.entries?.[0] || '';
              const parsedText = formatEquipmentOption(selectedClass.startingEquipment, option, parse5eEntry(rawEntry));

              return (
                <div
                  key={option}
                  onClick={() => handleEquipmentChange(option)}
                  className={cn(
                    "p-4 rounded-xl border text-left transition-all duration-300 flex flex-col gap-2 min-h-[140px] cursor-pointer",
                    isSelected ? "bg-blue/10 border-blue shadow-lg shadow-blue/5" : "bg-bg border-line hover:border-muted"
                  )}
                >
                  <div className="flex justify-between items-center">
                    <strong className="text-blue font-black text-sm uppercase tracking-widest">Opção {option}</strong>
                    {isSelected && <div className="w-3 h-3 rounded-full bg-blue shadow-[0_0_8px_rgba(59,130,246,0.5)]" />}
                  </div>
                  <RuleText text={parsedText} className="text-[0.75rem] text-muted leading-relaxed" />
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
};

function equipmentOptions(startingEquipment: any): string[] {
  const data = startingEquipment?.defaultData?.[0];
  const options = data ? Object.keys(data).filter((key) => /^[A-Z]$/.test(key)) : [];
  return options.length ? options : ['A', 'B'];
}

function formatEquipmentOption(startingEquipment: any, option: string, fallbackText: string): string {
  const data = startingEquipment?.defaultData?.[0]?.[option];
  if (Array.isArray(data) && data.length > 0) {
    return data.map((entry: any) => {
      if (typeof entry === 'string') return cleanEquipmentName(entry);
      if (entry.item) {
        const name = cleanEquipmentName(entry.item);
        return entry.quantity && entry.quantity > 1 ? `${entry.quantity} ${name}` : name;
      }
      if (entry.value) return `${entry.value / 100} GP`;
      return null;
    }).filter(Boolean).join(', ');
  }

  const marker = `(${option})`;
  const nextMarker = `(${String.fromCharCode(option.charCodeAt(0) + 1)})`;
  const start = fallbackText.indexOf(marker);
  if (start === -1) return option === 'B' ? 'Ouro inicial' : fallbackText;
  const end = fallbackText.indexOf(nextMarker, start + marker.length);
  return fallbackText.slice(start + marker.length, end === -1 ? undefined : end).replace(/^[:\s]+|;\s*or\s*$/gi, '').trim();
}

function cleanEquipmentName(value: string): string {
  return String(value).split('|')[0];
}
