import React, { useEffect, useState } from 'react';
import { useCharacterStore } from '../../store/useCharacterStore';
import { getSpells } from '../../api/catalog-api';
import type { CatalogEntry } from '../../api/catalog-api';
import { Card } from '../ui/Card';
import { Checkbox } from '../ui/Checkbox';
import { cn } from '@/lib/utils';

export const MagicInitiate: React.FC = () => {
  const { character, updateCharacter } = useCharacterStore();
  const [allSpells, setAllSpells] = useState<CatalogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSpells()
      .then((data) => {
        setAllSpells(data.results);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load spells:', err);
        setLoading(false);
      });
  }, []);

  const choices = character.bgSpellChoices || {};
  const selectedCantrips = choices.cantrips || [];
  const selectedLevel1 = choices.level1 || [];

  const handleToggle = (spellId: string, level: number) => {
    const key = level === 0 ? 'cantrips' : 'level1';
    const limit = level === 0 ? 2 : 1;
    const current = choices[key] || [];

    let next: string[];
    if (current.includes(spellId)) {
      next = current.filter(id => id !== spellId);
    } else if (current.length < limit) {
      next = [...current, spellId];
    } else {
      return; // Limit reached
    }

    updateCharacter({
      bgSpellChoices: {
        ...choices,
        [key]: next
      }
    });
  };

  const cantrips = allSpells.filter(s => s.level === 0);
  const level1 = allSpells.filter(s => s.level === 1);

  if (loading) return <Card title="Magic Initiate">Carregando magias...</Card>;

  return (
    <Card title="Talento: Magic Initiate">
      <div className="flex flex-col gap-6">
        <div>
          <h3 className="text-[0.875rem] font-bold uppercase text-gold mb-3">
            Truques (Escolha 2) - {selectedCantrips.length}/2
          </h3>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(170px,1fr))] gap-2 mt-2.5">
            {cantrips.map(spell => {
              const isSelected = selectedCantrips.includes(spell.id);
              const isDisabled = !isSelected && selectedCantrips.length >= 2;
              return (
                <Checkbox
                  key={spell.id}
                  label={spell.name}
                  checked={isSelected}
                  onChange={() => handleToggle(spell.id, 0)}
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
              const isSelected = selectedLevel1.includes(spell.id);
              const isDisabled = !isSelected && selectedLevel1.length >= 1;
              return (
                <Checkbox
                  key={spell.id}
                  label={spell.name}
                  checked={isSelected}
                  onChange={() => handleToggle(spell.id, 1)}
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
