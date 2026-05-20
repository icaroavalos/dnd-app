import React, { useEffect, useState, useMemo } from 'react';
import { useCharacterStore } from '../../store/useCharacterStore';
import { getSpells, getClassSpells } from '../../api/catalog-api';
import type { CatalogEntry } from '../../api/catalog-api';
import { Card } from '../ui/Card';
import { Checkbox } from '../ui/Checkbox';
import { cn } from '@/lib/utils';
import { parse5eEntry } from '../../lib/data-parser';

interface MagicInitiateProps {
  constraintClass?: string | null;
}

export const MagicInitiate: React.FC<MagicInitiateProps> = ({ constraintClass }) => {
  const { character, updateCharacter, addSpell, removeSpell } = useCharacterStore();
  const [allSpells, setAllSpells] = useState<CatalogEntry[]>([]);
  const [classSpellsMap, setClassSpellsMap] = useState<Record<string, Set<string>>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getSpells(), getClassSpells()])
      .then(([spellsData, classSpellsData]) => {
        setAllSpells(spellsData.results || []);
        
        const map: Record<string, Set<string>> = {};
        (classSpellsData.results || []).forEach((cs: any) => {
          const className = cs.className.toLowerCase();
          const spellSet = new Set(
            cs.spells.map((s: any) => s.name.toLowerCase())
          );
          map[className] = spellSet;
        });
        setClassSpellsMap(map);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load spells data:', err);
        setLoading(false);
      });
  }, []);

  const choices = character.bgSpellChoices || {};
  const selectedCantrips = choices.cantrips || [];
  const selectedLevel1 = choices.level1 || [];

  const filteredSpells = useMemo(() => {
    if (!constraintClass) return allSpells;
    const lowerConstraint = constraintClass.toLowerCase();
    const allowedSet = classSpellsMap[lowerConstraint];
    
    if (!allowedSet) return [];

    return allSpells.filter(spell => {
      return allowedSet.has(spell.name.toLowerCase());
    });
  }, [allSpells, classSpellsMap, constraintClass]);

  const handleToggle = (spellId: string, level: number) => {
    const key = level === 0 ? 'cantrips' : 'level1';
    const limit = level === 0 ? 2 : 1;
    const currentIds = choices[key] || [];

    const isSelected = currentIds.includes(spellId);
    
    if (isSelected) {
      const nextIds = currentIds.filter(id => id !== spellId);
      updateCharacter({
        bgSpellChoices: {
          ...choices,
          [key]: nextIds
        }
      });
      removeSpell(spellId);
    } else if (currentIds.length < limit) {
      const spell = filteredSpells.find(s => s.id === spellId);
      if (spell) {
        updateCharacter({
          bgSpellChoices: {
            ...choices,
            [key]: [...currentIds, spellId]
          }
        });
        // We ensure the spell is added to the character spells list regardless of level
        addSpell({
          ...spell,
          id: spell.id || spell.name.toLowerCase().replace(/\s+/g, '-'),
          description: parse5eEntry(spell),
          originKind: 'background',
          originName: constraintClass || '',
          ...(level === 1 ? {
            resource: {
              id: `bgSpell:${spell.name.toLowerCase().replace(/\s+/g, '-')}`,
              remaining: 1,
              max: 1,
              recoveryLabel: 'Long Rest'
            }
          } : {}),
          spellcastingAbility: character.bgChoices?.spellcastingAbility || undefined
        });
      }
    }
  };

  const cantrips = filteredSpells.filter(s => s.level === 0 || s.level === '0');
  const level1 = filteredSpells.filter(s => s.level === 1 || s.level === '1');

  if (loading) return <Card title="Magic Initiate">Carregando magias...</Card>;

  return (
    <Card title={`Talento: Magic Initiate ${constraintClass ? `(${constraintClass})` : ''}`}>
      <div className="flex flex-col gap-6">
        {filteredSpells.length === 0 && !loading && (
          <p className="text-rose text-sm italic">Nenhuma magia encontrada para a lista de {constraintClass}.</p>
        )}
        
        <div>
          <h3 className="text-[0.875rem] font-bold uppercase text-gold mb-3">
            Truques (Escolha 2) - {selectedCantrips.length}/2
          </h3>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(170px,1fr))] gap-2 mt-2.5">
            {cantrips.map(spell => {
              const spellId = spell.id || spell.name.toLowerCase().replace(/\s+/g, '-');
              const isSelected = selectedCantrips.includes(spellId);
              const isDisabled = !isSelected && selectedCantrips.length >= 2;
              return (
                <Checkbox
                  key={spellId}
                  label={spell.name}
                  checked={isSelected}
                  onChange={() => handleToggle(spellId, 0)}
                  disabled={isDisabled}
                  className={cn(
                    "flex gap-2 items-center min-w-0 min-h-[36px] px-[9px] py-[7px] rounded-lg bg-[#080808] border border-[#2c2c2c]",
                    isDisabled && "text-[#777] bg-[#111]"
                  )}
                />
              );
            })}
          </div>
        </div>

        <div>
          <h3 className="text-[0.875rem] font-bold uppercase text-gold mb-3">
            1º Nível (Escolha 1) - {selectedLevel1.length}/1
          </h3>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(170px,1fr))] gap-2 mt-2.5">
            {level1.map(spell => {
              const spellId = spell.id || spell.name.toLowerCase().replace(/\s+/g, '-');
              const isSelected = selectedLevel1.includes(spellId);
              const isDisabled = !isSelected && selectedLevel1.length >= 1;
              return (
                <Checkbox
                  key={spellId}
                  label={spell.name}
                  checked={isSelected}
                  onChange={() => handleToggle(spellId, 1)}
                  disabled={isDisabled}
                  className={cn(
                    "flex gap-2 items-center min-w-0 min-h-[36px] px-[9px] py-[7px] rounded-lg bg-[#080808] border border-[#2c2c2c]",
                    isDisabled && "text-[#777] bg-[#111]"
                  )}
                />
              );
            })}
          </div>
        </div>
      </div>
    </Card>
  );
};
