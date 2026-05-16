import React, { useEffect, useState, useMemo } from 'react';
import { useCharacterStore } from '../../store/useCharacterStore';
import { getSpells, getClassSpells } from '../../api/catalog-api';
import type { CatalogEntry } from '../../api/catalog-api';
import { Card } from '../ui/Card';
import { Checkbox } from '../ui/Checkbox';
import { cn } from '@/lib/utils';
import { Search, Sparkles } from 'lucide-react';

export const SpellSelect: React.FC = () => {
  const { character, addSpell, removeSpell } = useCharacterStore();
  const [allSpells, setAllSpells] = useState<CatalogEntry[]>([]);
  const [classSpells, setClassSpells] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    Promise.all([getSpells(), getClassSpells()])
      .then(([spellsData, classSpellsData]) => {
        setAllSpells(spellsData.results || []);
        setClassSpells(classSpellsData.results || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load spells:', err);
        setLoading(false);
      });
  }, []);

  const classLimits = useMemo(() => {
    const className = character.class.toLowerCase();

    // Default 5e 2024 limits for Level 1
    const base = { cantrips: 2, level1: 2 };

    if (className === 'wizard') return { cantrips: 3, level1: 6 };
    if (className === 'sorcerer') return { cantrips: 4, level1: 2 };
    if (className === 'cleric') return { cantrips: 3, level1: 4 };
    if (className === 'bard') return { cantrips: 2, level1: 4 };
    if (className === 'druid') return { cantrips: 2, level1: 4 };
    if (className === 'warlock') return { cantrips: 2, level1: 2 };
    if (className === 'paladin') return { cantrips: 0, level1: 4 };
    if (className === 'ranger') return { cantrips: 2, level1: 2 };

    return base;
  }, [character.class]);

  const currentClassSpells = useMemo(() => {
    const classData = classSpells.find(c => c.className?.toLowerCase() === character.class.toLowerCase());
    if (!classData) return [];

    const spellNames = classData.spells.map((s: any) => s.name);
    return allSpells.filter(s => spellNames.includes(s.name));
  }, [classSpells, allSpells, character.class]);

  const filteredSpells = useMemo(() => {
    return currentClassSpells.filter(s =>
      s.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [currentClassSpells, search]);

  const cantrips = filteredSpells.filter(s => s.level === 0);
  const level1Spells = filteredSpells.filter(s => s.level === 1);

  const selectedCantrips = character.spells.filter(s => s.level === 0);
  const selectedLevel1 = character.spells.filter(s => s.level === 1);

  const handleToggle = (spell: CatalogEntry) => {
    const isSelected = character.spells.some(s => (s.id || s.name) === (spell.id || spell.name));
    if (isSelected) {
      removeSpell(spell.id || spell.name);
    } else {
      if (spell.level === 0 && selectedCantrips.length >= classLimits.cantrips) return;
      if (spell.level === 1 && selectedLevel1.length >= classLimits.level1) return;
      addSpell(spell);
    }
  };

  if (loading) return (
    <Card title="Magias">
      <div className="p-8 text-center text-muted flex flex-col items-center gap-3">
        <div className="w-6 h-6 border-2 border-teal border-t-transparent rounded-full animate-spin" />
        Carregando magias do grimório...
      </div>
    </Card>
  );

  if (currentClassSpells.length === 0) {
    return (
      <Card title="Magias">
        <p className="text-muted text-sm italic">Sua classe não possui magias iniciais no nível 1.</p>
      </Card>
    );
  }

  const level1Label = character.class === 'Wizard' ? "Livro de Magias" : "Magias Preparadas";

  return (
    <div className="space-y-6">
      <Card title={`Magias de ${character.class}`}>
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} />
          <input
            type="text"
            placeholder="Buscar magias..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-bg border border-line rounded-xl focus:border-teal outline-none transition-all"
          />
        </div>

        <div className="space-y-8">
          {/* Cantrips */}
          {classLimits.cantrips > 0 && (
            <div>
              <div className="flex justify-between items-end mb-4">
                <h3 className="text-sm font-black uppercase tracking-widest text-gold flex items-center gap-2">
                  <Sparkles size={16} /> Truques (Cantrips)
                </h3>
                <span className={cn(
                  "text-[10px] font-bold px-2 py-0.5 rounded border transition-colors",
                  selectedCantrips.length === classLimits.cantrips ? "bg-teal/20 border-teal text-teal" : "bg-bg border-line text-muted"
                )}>
                  {selectedCantrips.length} / {classLimits.cantrips}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {cantrips.map(spell => {
                  const isSelected = character.spells.some(s => (s.id || s.name) === (spell.id || spell.name));
                  return (
                    <div
                      key={spell.id || spell.name}
                      onClick={() => handleToggle(spell)}
                      className={cn(
                        "p-3 rounded-xl border cursor-pointer transition-all flex items-center gap-3",
                        isSelected ? "bg-teal/10 border-teal text-teal shadow-lg shadow-teal/5" : "bg-bg border-line hover:border-muted"
                      )}
                    >
                      <Checkbox checked={isSelected} readOnly />
                      <div className="min-w-0">
                        <div className="font-bold text-sm truncate">{spell.name}</div>
                        <div className="text-[10px] opacity-60 uppercase">{spell.school || 'Abjuration'}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Level 1 Spells */}
          <div>
            <div className="flex justify-between items-end mb-4">
              <h3 className="text-sm font-black uppercase tracking-widest text-gold flex items-center gap-2">
                <Sparkles size={16} /> Magias de Nível 1 ({level1Label})
              </h3>
              <span className={cn(
                "text-[10px] font-bold px-2 py-0.5 rounded border transition-colors",
                selectedLevel1.length === classLimits.level1 ? "bg-teal/20 border-teal text-teal" : "bg-bg border-line text-muted"
              )}>
                {selectedLevel1.length} / {classLimits.level1}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {level1Spells.map(spell => {
                const isSelected = character.spells.some(s => (s.id || s.name) === (spell.id || spell.name));
                return (
                  <div
                    key={spell.id || spell.name}
                    onClick={() => handleToggle(spell)}
                    className={cn(
                      "p-3 rounded-xl border cursor-pointer transition-all flex items-center gap-3",
                      isSelected ? "bg-teal/10 border-teal text-teal shadow-lg shadow-teal/5" : "bg-bg border-line hover:border-muted"
                    )}
                  >
                    <Checkbox checked={isSelected} readOnly />
                    <div className="min-w-0">
                      <div className="font-bold text-sm truncate">{spell.name}</div>
                      <div className="text-[10px] opacity-60 uppercase">{spell.school || 'Conjuration'}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
