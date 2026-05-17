import React, { useEffect, useState, useMemo } from 'react';
import { useCharacterStore } from '../../store/useCharacterStore';
import { getSpecies, getSubraces } from '../../api/catalog-api';
import type { CatalogEntry } from '../../api/catalog-api';
import { Select } from '../ui/Select';
import { parse5eEntry, parseResourceInfo } from '../../lib/data-parser';

export const SpeciesSelect: React.FC = () => {
  const { character, updateCharacter, setFeaturesByKind } = useCharacterStore();
  const [speciesList, setSpeciesList] = useState<CatalogEntry[]>([]);
  const [subraceList, setSubraceList] = useState<CatalogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const mapTraitsToFeatures = (traits: any[], kind: 'species' | 'subspecies', source: string) => {
    return traits.map((t: any) => {
      const desc = parse5eEntry(t);
      const resource = parseResourceInfo(desc, character, { proficiencyBonus: 2, modifiers: { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 } });
      if (resource) resource.id = t.id || `${t.name}-${kind}-${source}`.toLowerCase().replace(/\s+/g, '-');

      return {
        id: t.id || `${t.name}-${kind}-${source}`.toLowerCase().replace(/\s+/g, '-'),
        name: t.name,
        kind,
        description: desc,
        meta: source,
        resource
      };
    });
  };

  useEffect(() => {
    getSpecies()
      .then((speciesData) => {
        const results = speciesData.results || [];
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
        getSubraces()
          .then((subraceData) => {
            setSubraceList(subraceData.results || []);
          })
          .catch((err) => console.warn('Failed to load subraces (optional):', err))
          .finally(() => setLoading(false));
      });
  }, []);

  const selectedSpecies = useMemo(() => 
    speciesList.find(s => s.name === character.race),
    [speciesList, character.race]
  );

  const derivedSubraces = useMemo(() => {
    if (!selectedSpecies) return [];
    
    // 1. Dynamic parsing for D&D 2024 "Lineages", "Ancestors", "Legacies" which are in tables
    const tables: any[] = [];
    const findTables = (entries: any[]) => {
      entries.forEach(e => {
        if (e.type === 'table') tables.push(e);
        if (e.entries && Array.isArray(e.entries)) findTables(e.entries);
      });
    };
    findTables(selectedSpecies.entries || []);

    const lineageTable = tables.find((t: any) => 
      t.caption && (
        t.caption.toLowerCase().includes('lineage') || 
        t.caption.toLowerCase().includes('ancestor') || 
        t.caption.toLowerCase().includes('legacy') ||
        t.caption.toLowerCase().includes('origin')
      )
    );

    if (lineageTable && lineageTable.rows) {
      return lineageTable.rows.map((row: any[]) => {
        const name = typeof row[0] === 'string' ? row[0] : (row[0].roll?.exact || 'Unknown');
        // Handle complex row cells
        const desc = parse5eEntry(row[1]);
        return {
          id: `${selectedSpecies.id}-${name}`.toLowerCase().replace(/\s+/g, '-'),
          name,
          raceName: selectedSpecies.name,
          description: desc,
          source: selectedSpecies.source,
          entries: [{ type: 'entries', name, entries: [desc] }]
        };
      });
    }

    // 2. Fallback to standard subraces.json catalog
    return subraceList.filter(s => 
      s.raceName?.toLowerCase() === character.race?.toLowerCase()
    );
  }, [selectedSpecies, subraceList, character.race]);

  const handleSpeciesChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const speciesId = e.target.value;
    const species = speciesList.find(s => s.id === speciesId);
    if (species) {
      // Extract skills from species data if available
      const normalize = (s: string) => s.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
      
      let speciesSkills: string[] = [];
      const skillData = species.skillProficiencies?.[0] || (species as any).skillProficiencies;
      
      if (skillData) {
        if (Array.isArray(skillData)) {
          speciesSkills = skillData.flatMap(obj => Object.keys(obj)).map(normalize);
        } else if (skillData.choose) {
          // 2024 style: { choose: { from: [...] } }
          // For now, we take the recommended or first ones to automate
          speciesSkills = (skillData.choose.from || []).slice(0, skillData.choose.count || 1).map(normalize);
        } else if (typeof skillData === 'object') {
          speciesSkills = Object.keys(skillData).map(normalize);
        }
      }

      updateCharacter({ 
        race: species.name,
        subrace: '',
        skillProficiencies: [
          ...character.skillProficiencies.filter(s => !character.classSkillChoices.includes(s)),
          ...speciesSkills
        ]
      });

      const traits = (species.entries || []).filter((e: any) => e.type === 'entries' || e.name);
      setFeaturesByKind('species', mapTraitsToFeatures(traits, 'species', species.source));
      setFeaturesByKind('subspecies', []);
    }
  };

  const handleSubraceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const subId = e.target.value;
    const sub = derivedSubraces.find((s: any) => s.id === subId);
    if (sub) {
      updateCharacter({ 
        subrace: sub.name,
      });
      const traits = (sub.entries || []).filter((e: any) => e.type === 'entries' || e.name);
      setFeaturesByKind('subspecies', mapTraitsToFeatures(traits, 'subspecies', sub.source));
    }
  };

  const selectedSpeciesId = selectedSpecies?.id || '';

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

      {derivedSubraces.length > 0 && (
        <Select
          label="Linhagem / Subespécie"
          value={derivedSubraces.find((s: any) => s.name === character.subrace)?.id || ''}
          options={derivedSubraces.map((s: any) => [s.id || s.name, s.name])}
          onChange={handleSubraceChange}
          helperText={`A espécie ${character.race} possui sub-divisões disponíveis.`}
        />
      )}
    </div>
  );
};
