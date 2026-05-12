import React, { useEffect, useState } from 'react';
import { useCharacterStore } from '../../store/useCharacterStore';
import { getSpecies, getSubraces } from '../../api/catalog-api';
import type { CatalogEntry } from '../../api/catalog-api';
import { Select } from '../ui/Select';

export const SpeciesSelect: React.FC = () => {
  const { character, updateCharacter, setFeaturesByKind } = useCharacterStore();
  const [speciesList, setSpeciesList] = useState<CatalogEntry[]>([]);
  const [subraceList, setSubraceList] = useState<CatalogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const mapTraitsToFeatures = (traits: any[], kind: 'species' | 'subspecies', source: string) => {
    return traits.map((t: any) => ({
      id: t.id || `${t.name}-${kind}-${source}`.toLowerCase().replace(/\s+/g, '-'),
      name: t.name,
      kind,
      description: Array.isArray(t.entries) ? t.entries.map((e: any) => typeof e === 'string' ? e : JSON.stringify(e)).join('\n') : (t.description || ''),
      meta: source
    }));
  };

  useEffect(() => {
    // We use individual then/catch to ensure that if subraces fail, species still load
    getSpecies()
      .then((speciesData) => {
        const results = speciesData.results || [];
        // Filter out old versions if new ones exist (prioritize XPHB)
        const uniqueSpecies = results.reduce((acc: CatalogEntry[], curr: CatalogEntry) => {
          const existing = acc.find(s => s.name === curr.name);
          if (!existing || (curr.source === 'XPHB' || curr.edition === 'one')) {
            return [...acc.filter(s => s.name !== curr.name), curr];
          }
          return acc;
        }, []);

        setSpeciesList(uniqueSpecies.sort((a, b) => a.name.localeCompare(b.name)));
      })
      .catch((err) => console.error('Failed to load species:', err))
      .finally(() => {
        // Try loading subraces separately
        getSubraces()
          .then((subraceData) => {
            setSubraceList(subraceData.results || []);
          })
          .catch((err) => console.warn('Failed to load subraces (optional):', err))
          .finally(() => setLoading(false));
      });
  }, []);

  const handleSpeciesChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const speciesId = e.target.value;
    const species = speciesList.find(s => s.id === speciesId);
    if (species) {
      updateCharacter({ 
        race: species.name,
        subrace: '',
      });
      // Traits are in 'entries' for species in 5etools
      const traits = (species.entries || []).filter((e: any) => e.type === 'entries' || e.name);
      setFeaturesByKind('species', mapTraitsToFeatures(traits, 'species', species.source));
      setFeaturesByKind('subspecies', []);
    }
  };

  const handleSubraceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const subId = e.target.value;
    const sub = subraceList.find(s => s.id === subId);
    if (sub) {
      updateCharacter({ 
        subrace: sub.name,
      });
      const traits = (sub.entries || []).filter((e: any) => e.type === 'entries' || e.name);
      setFeaturesByKind('subspecies', mapTraitsToFeatures(traits, 'subspecies', sub.source));
    }
  };

  const selectedSpecies = speciesList.find(s => s.name === character.race);
  const selectedSpeciesId = selectedSpecies?.id || '';

  const availableSubraces = subraceList.filter(s => s.raceName === character.race);

  return (
    <div className="flex flex-col gap-4">
      <Select
        label="Espécie (Species)"
        value={selectedSpeciesId}
        options={speciesList.map(s => [s.id || s.name, s.name])}
        onChange={handleSpeciesChange}
        disabled={loading}
        helperText={selectedSpecies?.description}
      />

      {availableSubraces.length > 0 && (
        <Select
          label="Linhagem / Subespécie"
          value={subraceList.find(s => s.name === character.subrace)?.id || ''}
          options={availableSubraces.map(s => [s.id || s.name, s.name])}
          onChange={handleSubraceChange}
          helperText={`A espécie ${character.race} possui sub-divisões disponíveis.`}
        />
      )}
    </div>
  );
};
