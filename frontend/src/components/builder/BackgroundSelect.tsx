import React, { useEffect, useState } from 'react';
import { useCharacterStore } from '../../store/useCharacterStore';
import { getBackgrounds } from '../../api/catalog-api';
import type { CatalogEntry } from '../../api/catalog-api';
import { Select } from '../ui/Select';
import { Card } from '../ui/Card';
import { MagicInitiate } from './MagicInitiate';
import styles from './BackgroundSelect.module.css';

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

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const bgId = e.target.value;
    const bg = backgrounds.find(b => b.id === bgId);
    if (bg) {
      updateCharacter({ 
        background: bg.name,
        bgSpellChoices: {} 
      });
    }
  };

  const selectedBgId = backgrounds.find(b => b.name === character.background)?.id || '';
  const selectedBg = backgrounds.find(b => b.id === selectedBgId);
  const hasMagicInitiate = selectedBg?.features?.some((f: any) => f.name === 'Magic Initiate');

  return (
    <div className={styles.backgroundStep}>
      <Card title="Segundo Plano (Background)">
        <Select
          label="Escolha seu background"
          value={selectedBgId}
          options={backgrounds.map(b => [b.id, b.name])}
          onChange={handleChange}
          disabled={loading}
          helperText={selectedBg?.description}
        />
      </Card>

      {hasMagicInitiate && (
        <div className="mt-4">
          <MagicInitiate />
        </div>
      )}
    </div>
  );
};
