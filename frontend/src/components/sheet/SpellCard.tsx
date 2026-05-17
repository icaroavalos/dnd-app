import React from 'react';
import { cn } from '../../lib/utils';
import { RuleText } from '../ui/RuleText';
import { getSpellOrigin, getSpellAbility } from '../../lib/spell-utils';
import { useCharacterStore } from '../../store/useCharacterStore';
import { useDerivedState } from '../../hooks/useDerivedState';

interface SpellCardProps {
  spell: any;
  isWide?: boolean;
}

const SCHOOL_MAP: Record<string, string> = {
  A: 'Abjuração',
  C: 'Conjuração',
  D: 'Adivinhação',
  E: 'Encantamento',
  V: 'Evocação',
  I: 'Ilusão',
  N: 'Necromancia',
  T: 'Transmutação'
};

export const SpellCard: React.FC<SpellCardProps> = ({ spell, isWide }) => {
  const { character } = useCharacterStore();
  const derived = useDerivedState();
  if (!spell) return null;

  const levelSuffix = (lvl: number) => {
    if (lvl === 0) return 'Truque';
    return `${lvl}º Nível`;
  };

  const schoolName = SCHOOL_MAP[spell.school] || spell.school;
  
  // Extração de dados do formato 5etools
  const castingTime = Array.isArray(spell.time) 
    ? `${spell.time[0].number} ${spell.time[0].unit === 'action' ? 'Ação' : spell.time[0].unit}`
    : '1 Ação';
    
  const range = typeof spell.range?.distance === 'object'
    ? `${spell.range.distance.amount} ${spell.range.distance.type === 'feet' ? 'ft' : spell.range.distance.type}`
    : spell.range?.type === 'self' ? 'Self' : '60 ft';

  const duration = Array.isArray(spell.duration)
    ? (spell.duration[0].type === 'instant' ? 'Instantânea' : `${spell.duration[0].duration?.amount || ''} ${spell.duration[0].duration?.type || ''}`)
    : 'Instantânea';

  const components = spell.components ? 
    Object.keys(spell.components).map(c => c.toUpperCase()).join(', ') : 'V, S';

  const hasConcentration = spell.duration?.[0]?.concentration || spell.concentration;
  const isRitual = spell.meta?.ritual || spell.ritual;

  const renderEntry = (entry: any): React.ReactNode => {
    if (typeof entry === 'string') {
      return <div className="mb-2 last:mb-0"><RuleText text={entry} /></div>;
    }

    if (!entry) return null;

    if (entry.type === 'entries') {
      return (
        <div className="mb-3">
          {entry.name && <h4 className="font-bold text-[0.85rem] mb-1">{entry.name}</h4>}
          <div className="pl-2 border-l border-[#8b2531]/20">
            {entry.entries?.map((sub: any, i: number) => (
              <React.Fragment key={i}>{renderEntry(sub)}</React.Fragment>
            ))}
          </div>
        </div>
      );
    }

    if (entry.type === 'list') {
      return (
        <ul className="list-disc pl-5 mb-3 space-y-1">
          {entry.items?.map((item: any, i: number) => (
            <li key={i}>{typeof item === 'string' ? <RuleText text={item} /> : renderEntry(item)}</li>
          ))}
        </ul>
      );
    }

    if (entry.type === 'table') {
      return (
        <div className="overflow-x-auto mb-3 border border-line/10 rounded">
          <table className="w-full text-[0.7rem] text-left border-collapse">
            {entry.caption && <caption className="p-1 font-bold text-[#8b2531]">{entry.caption}</caption>}
            <thead>
              <tr className="bg-[#8b2531]/5">
                {entry.colLabels?.map((label: string, i: number) => (
                  <th key={i} className="p-1 border-b border-line/10 font-black"><RuleText text={label} /></th>
                ))}
              </tr>
            </thead>
            <tbody>
              {entry.rows?.map((row: any[], i: number) => (
                <tr key={i} className="border-b border-line/5 last:border-0">
                  {row.map((cell: any, j: number) => (
                    <td key={j} className="p-1">{typeof cell === 'string' ? <RuleText text={cell} /> : renderEntry(cell)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    // Se houver uma lista de strings/objetos sem tipo definido (fallback)
    if (Array.isArray(entry)) {
      return entry.map((sub, i) => <React.Fragment key={i}>{renderEntry(sub)}</React.Fragment>);
    }

    // Se for um objeto genérico com entries
    if (entry.entries) {
      return (
        <div className="mb-2">
           {entry.name && <strong className="mr-1">{entry.name}.</strong>}
           {entry.entries.map((sub: any, i: number) => (
              <React.Fragment key={i}>{renderEntry(sub)}</React.Fragment>
           ))}
        </div>
      );
    }

    return null;
  };

  // Tenta extrair o tipo de defesa/ataque do texto
  const firstEntry = Array.isArray(spell.entries) ? spell.entries[0] : (spell.description || '');
  const firstEntryText = typeof firstEntry === 'string' ? firstEntry : (firstEntry.entries?.[0] || '');
  let defense = firstEntryText.toLowerCase().includes('saving throw') 
    ? (firstEntryText.match(/(Strength|Dexterity|Constitution|Intelligence|Wisdom|Charisma) saving throw/i)?.[1].substring(0, 3).toUpperCase() + ' Save')
    : (firstEntryText.toLowerCase().includes('spell attack') ? 'Spell Attack' : null);

  if (defense) {
    const ability = getSpellAbility(spell, character, derived.mainSpellcastingAbility).toUpperCase();
    if (defense === 'Spell Attack') {
      defense = `Spell Attack (${ability})`;
    } else {
      defense = `${defense} (DC ${ability})`;
    }
  }

  return (
    <article className={cn(
      "w-full bg-[#8b2531] border-2 border-[#8b2531] rounded-[14px] overflow-hidden shadow-xl text-white font-sans",
      isWide ? "max-w-[400px]" : "max-w-full"
    )}>
      {/* Header */}
      <div className="bg-white p-3 text-center relative border-b-4 border-[#8b2531]">
        <div className="absolute top-2 right-2 flex gap-1">
          {hasConcentration && <span className="w-5 h-5 rounded-full bg-[#8b2531] text-white text-[10px] font-black flex items-center justify-center border border-white" title="Concentração">C</span>}
          {isRitual && <span className="w-5 h-5 rounded-full bg-[#8b2531] text-white text-[10px] font-black flex items-center justify-center border border-white" title="Ritual">R</span>}
        </div>
        <h2 className="text-[#111] text-xl font-black uppercase tracking-tight leading-none mb-1">{spell.name}</h2>
        <div className="flex flex-col items-center gap-1">
          <span className="text-[#8b2531] text-[0.7rem] font-bold uppercase tracking-widest bg-[#8b2531]/10 px-2 py-0.5 rounded-full inline-block">
            {levelSuffix(spell.level)} — {schoolName}
          </span>
          <span className="text-[#8b2531] text-[0.6rem] font-bold uppercase tracking-widest opacity-80">
            Origem: {getSpellOrigin(spell, character)}
          </span>
        </div>
      </div>

      {/* Power Box */}
      <div className="grid grid-cols-2 divide-x divide-y divide-white/20 border-b border-white/20 bg-[#8b2531]">
        <div className="p-2 px-3">
          <label className="block text-[0.6rem] font-black uppercase tracking-widest opacity-70">Casting Time</label>
          <span className="text-sm font-bold">{castingTime}</span>
        </div>
        <div className="p-2 px-3">
          <label className="block text-[0.6rem] font-black uppercase tracking-widest opacity-70">Range</label>
          <span className="text-sm font-bold">{range}</span>
        </div>
        <div className="p-2 px-3">
          <label className="block text-[0.6rem] font-black uppercase tracking-widest opacity-70">Components</label>
          <span className="text-sm font-bold">{components}</span>
        </div>
        <div className="p-2 px-3">
          <label className="block text-[0.6rem] font-black uppercase tracking-widest opacity-70">Duration</label>
          <span className="text-sm font-bold">{duration}</span>
        </div>
      </div>

      {/* Defense/Attack Bar */}
      {defense && (
        <div className="bg-white/10 px-4 py-1.5 flex justify-center items-center gap-2 border-b border-white/20">
          <span className="text-[0.65rem] font-black uppercase tracking-[0.2em] opacity-80">Check:</span>
          <strong className="text-sm font-black bg-white text-[#8b2531] px-2 py-0.5 rounded leading-none">{defense}</strong>
        </div>
      )}

      {/* Body */}
      <div className="bg-white p-4 text-[#111] text-[0.82rem] leading-relaxed min-h-[160px]">
        {spell.components?.m && (
          <div className="mb-3 p-2 bg-[#8b2531]/5 border-l-2 border-[#8b2531] text-[0.7rem] italic text-[#555]">
            <strong className="text-[#8b2531] not-italic mr-1">Material:</strong>
            {typeof spell.components.m === 'string' ? spell.components.m : spell.components.m.text || 'Componentes variados'}
          </div>
        )}

        <div className="space-y-1">
          {Array.isArray(spell.entries) ? (
            spell.entries.map((entry: any, i: number) => (
              <React.Fragment key={i}>{renderEntry(entry)}</React.Fragment>
            ))
          ) : (
            <RuleText text={spell.description} />
          )}
        </div>

        {spell.entriesHigherLevel && (
          <div className="mt-4 pt-3 border-t border-line">
            <h4 className="text-[0.7rem] font-black uppercase text-[#8b2531] mb-1">Em Níveis Superiores</h4>
            {spell.entriesHigherLevel.map((entry: any, i: number) => (
              <React.Fragment key={i}>{renderEntry(entry)}</React.Fragment>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-white/5 px-4 py-2 flex justify-between items-center text-[0.6rem] font-bold uppercase tracking-widest">
        <div className="flex items-center gap-2">
          <span className="text-white/60">Lists:</span>
          <span className="text-white">Arcana</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-white/60">Ref:</span>
          <span>{spell.source} Pág. {spell.page || '---'}</span>
        </div>
      </div>
    </article>
  );
};
