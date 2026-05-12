import React, { useEffect, useState } from 'react';
import { useCharacterStore } from '../../store/useCharacterStore';
import { getSpells } from '../../api/catalog-api';
import type { CatalogEntry } from '../../api/catalog-api';
import { Card } from '../ui/Card';
import { Checkbox } from '../ui/Checkbox';
import styles from './MagicInitiate.module.css';

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
      <div className={styles.container}>
        <div>
          <h3 className={styles.sectionTitle}>
            Truques (Escolha 2) - {selectedCantrips.length}/2
          </h3>
          <div className={styles.choiceList}>
            {cantrips.map(spell => (
              <Checkbox
                key={spell.id}
                label={spell.name}
                checked={selectedCantrips.includes(spell.id)}
                onChange={() => handleToggle(spell.id, 0)}
                disabled={!selectedCantrips.includes(spell.id) && selectedCantrips.length >= 2}
              />
            ))}
          </div>
        </div>

        <div>
          <h3 className={styles.sectionTitle}>
            1º Nível (Escolha 1) - {selectedLevel1.length}/1
          </h3>
          <div className={styles.choiceList}>
            {level1.map(spell => (
              <Checkbox
                key={spell.id}
                label={spell.name}
                checked={selectedLevel1.includes(spell.id)}
                onChange={() => handleToggle(spell.id, 1)}
                disabled={!selectedLevel1.includes(spell.id) && selectedLevel1.length >= 1}
              />
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
};
