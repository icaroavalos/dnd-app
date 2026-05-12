import React, { useState } from 'react';
import { useCharacterStore } from '../../store/useCharacterStore';
import { cn } from '../../lib/utils';
import { clean5eText, parse5eEntry } from '../../lib/data-parser';

export const FeaturesTab: React.FC = () => {
  const { character, useFeatureResource } = useCharacterStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const features = character.features || [];

  // Grouping
  const grouped = features.reduce((acc, feat) => {
    const kind = feat.kind || 'other';
    if (!acc[kind]) acc[kind] = [];
    acc[kind].push(feat);
    return acc;
  }, {} as Record<string, any[]>);

  const kindLabels: Record<string, string> = {
    class: 'Class Features',
    subclass: 'Subclass Features',
    species: 'Species Traits',
    subspecies: 'Lineage / Subspecies',
    feat: 'Feats',
    background: 'Background Features',
    other: 'Other Features'
  };

  const groupOrder = ['class', 'subclass', 'species', 'subspecies', 'feat', 'background', 'other'];

  return (
    <div className="flex flex-col gap-4">
      {groupOrder.map(kind => {
        const items = grouped[kind];
        if (!items || items.length === 0) return null;

        return (
          <section key={kind} className="grid gap-2">
            <h3 className="text-gold text-[0.75rem] font-black uppercase tracking-[0.15em] border-b border-line pb-1 px-1">
              {kindLabels[kind] || kind.toUpperCase()}
            </h3>
            <div className="grid gap-2">
              {items.map((feat, idx) => {
                const id = feat.id || `${kind}-${idx}`;
                const isOpen = selectedId === id;
                const hasResource = feat.resource;

                return (
                  <article key={id} className={cn(
                    "bg-[#0a0a0a] border border-[#1d1d1d] rounded-lg overflow-hidden transition-all",
                    isOpen && "border-gold/30 shadow-lg shadow-gold/5"
                  )}>
                    <div className="flex items-stretch min-w-0">
                      {hasResource && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            useFeatureResource(id);
                          }}
                          disabled={feat.resource.remaining <= 0}
                          className={cn(
                            "w-14 flex-shrink-0 flex flex-col items-center justify-center gap-1 border-r border-[#1d1d1d] transition-colors",
                            feat.resource.remaining > 0 ? "bg-teal/10 hover:bg-teal/20 text-teal" : "bg-zinc-900 text-zinc-600 grayscale"
                          )}
                        >
                          <span className="text-[0.65rem] font-black leading-none uppercase">USE</span>
                          <strong className="text-sm font-black">{feat.resource.remaining}</strong>
                        </button>
                      )}

                      <button 
                        type="button" 
                        className={cn(
                          "flex-1 min-w-0 grid grid-cols-[1fr_auto] gap-2 items-center py-3 px-4 text-left cursor-pointer transition-colors",
                          isOpen ? "bg-white/5" : "hover:bg-white/5"
                        )}
                        onClick={() => setSelectedId(isOpen ? null : id)}
                      >
                        <div className="flex flex-col min-w-0">
                          <strong className="text-[0.9rem] font-bold text-ink leading-tight truncate">{feat.name}</strong>
                          {hasResource && (
                            <span className="text-[0.6rem] text-muted uppercase font-bold tracking-wider mt-0.5">
                              {feat.resource.max} Total • {feat.resource.recoveryLabel}
                            </span>
                          )}
                        </div>
                        <span className={cn(
                          "w-2 h-2 flex-shrink-0 border-r-2 border-b-2 border-muted rotate-45 transition-transform duration-300",
                          isOpen && "-rotate-[135deg] border-gold"
                        )}></span>
                      </button>
                    </div>

                    {isOpen && (
                      <div className="p-4 bg-black/40 border-t border-[#1d1d1d] animate-in fade-in slide-in-from-top-2 duration-300 text-left overflow-hidden">
                        <div className="text-[#d0d0d0] text-[0.82rem] leading-relaxed space-y-2 break-words">
                          {feat.description ? (
                            feat.description.split('\n').map((line: string, i: number) => (
                              <p key={i}>{clean5eText(line)}</p>
                            ))
                          ) : (
                            <p className="italic opacity-50 font-medium">No description provided by source data.</p>
                          )}
                        </div>
                        {feat.meta && (
                          <div className="mt-3 pt-3 border-t border-white/5 text-[0.65rem] text-muted uppercase font-black tracking-widest truncate">
                            Source: {clean5eText(feat.meta)}
                          </div>
                        )}
                        
                        {character.classFeatureChoices[feat.id] && character.classFeatureChoices[feat.id].length > 0 && (
                          <div className="mt-4 p-3 bg-teal/5 border border-teal/20 rounded-lg">
                            <span className="text-[0.6rem] text-teal uppercase font-black block mb-1.5 tracking-wider">Your Selections:</span>
                            <div className="flex flex-wrap gap-2">
                              {character.classFeatureChoices[feat.id].map((choice: string) => (
                                <span key={choice} className="px-2 py-0.5 bg-teal text-bg text-[0.7rem] font-black rounded uppercase">
                                  {choice}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          </section>
        );
      })}

      {features.length === 0 && (
        <div className="min-h-[120px] grid place-items-center text-muted border border-dashed border-[#343434] rounded-lg text-center p-4">
          No features or traits found for this character.
        </div>
      )}
    </div>
  );
};
