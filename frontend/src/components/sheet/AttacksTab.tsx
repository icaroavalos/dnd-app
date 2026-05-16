import React, { useEffect, useMemo, useState } from 'react';
import { deriveActions, type DerivedAction, type DerivedActionKind } from '../../api/actions-api';
import { spendAmmo, useResource } from '../../api/action-mutations-api';
import { useCharacterStore } from '../../store/useCharacterStore';
import { cn } from '../../lib/utils';

type FilterId = 'all' | DerivedActionKind;

const FILTERS: Array<{ id: FilterId; label: string }> = [
  { id: 'all', label: 'Tudo' },
  { id: 'attack', label: 'Ataques' },
  { id: 'action', label: 'Ações' },
  { id: 'bonus', label: 'Bônus' },
  { id: 'reaction', label: 'Reações' },
  { id: 'other', label: 'Outros' },
  { id: 'limited', label: 'Uso Limitado' },
];

const SECTIONS: Array<{ id: DerivedActionKind; label: string }> = [
  { id: 'attack', label: 'Attacks' },
  { id: 'action', label: 'Actions in Combat' },
  { id: 'bonus', label: 'Bonus Actions' },
  { id: 'reaction', label: 'Reactions' },
  { id: 'other', label: 'Other' },
  { id: 'limited', label: 'Limited Use' },
];

const RECOVERY_LABELS: Record<string, string> = {
  short_rest: 'Short Rest',
  long_rest: 'Long Rest',
  none: 'Limited Use',
};

export const AttacksTab: React.FC = () => {
  const { character, setCharacter } = useCharacterStore();
  const [filter, setFilter] = useState<FilterId>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [actions, setActions] = useState<DerivedAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mutationMessage, setMutationMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    deriveActions(character)
      .then((result) => {
        if (!cancelled) setActions(Array.isArray(result) ? result : []);
      })
      .catch((err) => {
        if (!cancelled) {
          setActions([]);
          setError(err instanceof Error ? err.message : 'Backend indisponível para derivar ações.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [character]);

  const visibleSections = useMemo(() => {
    return SECTIONS.map((section) => ({
      ...section,
      actions: actions.filter((action) => action.kind === section.id && (filter === 'all' || filter === action.kind)),
    })).filter((section) => section.actions.length > 0);
  }, [actions, filter]);

  const handleUse = async (action: DerivedAction) => {
    const resourceId = action.cost?.resource ?? action.resource;
    setMutationMessage(null);

    if (action.disabled) {
      setMutationMessage(disabledReason(action));
      return;
    }

    if (resourceId) {
      const resource = resourceState(character.resources?.[resourceId]);
      if (resource && resource.current <= 0) {
        setMutationMessage('Recurso indisponível.');
        return;
      }

      try {
        const updated = await useResource(character, resourceId);
        setCharacter(updated);
      } catch (err: any) {
        setMutationMessage(err?.code === 'RESOURCE_UNAVAILABLE' ? 'Recurso indisponível.' : 'Não foi possível usar este recurso.');
      }
      return;
    }

    if (action.source?.ammoRequired && typeof action.source?.itemId === 'string') {
      try {
        const updated = await spendAmmo(character, action.source.itemId);
        setCharacter(updated);
      } catch {
        setMutationMessage('Não foi possível gastar munição.');
      }
      return;
    }

    // TODO: conectar rolagem real de dados quando o app tiver fluxo persistente de rolls.
    setMutationMessage('Ação pronta para rolagem.');
  };

  return (
    <div className="w-full">
      <div className="flex flex-wrap gap-1.5">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            className={cn(
              'min-h-[32px] px-[9px] text-[#6f7a80] bg-[#e9eaec] border-0 rounded-[6px] text-[0.74rem] font-[950] leading-none text-center uppercase cursor-pointer',
              filter === f.id && 'text-white bg-[#cf3036]'
            )}
            onClick={() => setFilter(f.id)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {mutationMessage && (
        <div className="mt-3 rounded-md border border-[#ead0a1] bg-[#fff8e6] px-3 py-2 text-xs font-bold text-[#7a4d00]">
          {mutationMessage}
        </div>
      )}

      {loading && (
        <div className="mt-4 min-h-[180px] rounded-lg border border-zinc-200 bg-white p-6 text-center text-sm font-bold text-[#68737a]">
          Carregando ações do backend...
        </div>
      )}

      {!loading && error && (
        <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-700">
          {error || 'Backend indisponível para derivar ações.'}
        </div>
      )}

      {!loading && !error && actions.length === 0 && (
        <div className="mt-4 min-h-[180px] rounded-lg border border-zinc-200 bg-white p-6 text-center text-sm font-bold text-[#68737a]">
          Nenhuma ação disponível para esta ficha.
        </div>
      )}

      {!loading && !error && actions.length > 0 && visibleSections.length === 0 && (
        <div className="mt-4 rounded-lg border border-zinc-200 bg-white p-6 text-center text-sm font-bold text-[#68737a]">
          Nenhuma ação neste filtro.
        </div>
      )}

      {!loading && !error && visibleSections.length > 0 && (
        <div className="grid text-[#111] bg-white text-left mt-4">
          {visibleSections.map((section) => (
            <section key={section.id} className="mb-6">
              <div className="flex items-baseline gap-1.25 mb-2 text-[#111] border-b-2 border-[#cf3036] pb-1">
                <strong className="text-[#cf3036] uppercase text-xs tracking-wider">{section.label}</strong>
              </div>

              <div className="grid grid-cols-[1fr_56px_54px_74px_minmax(72px,1fr)] gap-1.5 items-center py-1.5 text-[0.6rem] font-[950] uppercase text-muted">
                <span>Ação</span>
                <span>Alcance</span>
                <span>Acerto</span>
                <span>Dano</span>
                <span>Notas</span>
              </div>

              {section.actions.map((action) => {
                const isOpen = selectedId === action.id;
                const resource = resourceState(character.resources?.[action.cost?.resource ?? action.resource ?? '']);
                const recovery = resource ? RECOVERY_LABELS[resource.recovery] ?? 'Limited Use' : '';
                const disabled = Boolean(action.disabled || (resource && resource.current <= 0));

                return (
                  <article key={action.id} className={cn('min-w-0', disabled && 'opacity-65')}>
                    <button
                      type="button"
                      className={cn(
                        'grid grid-cols-[1fr_56px_54px_74px_minmax(72px,1fr)] gap-1.5 items-center w-full py-2.5 bg-transparent border-0 border-b border-dotted border-[#d7d7d7] text-left cursor-pointer transition-colors',
                        isOpen && 'bg-[#fafafa]'
                      )}
                      onClick={() => setSelectedId(isOpen ? null : action.id)}
                    >
                      <span className="grid gap-0.5">
                        <strong className="text-[0.85rem] leading-[1.05] break-anywhere">{action.name}</strong>
                        <span className="text-[#6f7a80] text-[0.65rem] font-extrabold break-anywhere">
                          {action.subtitle || kindLabel(action.kind)}
                          {resource ? ` • ${resource.current}/${resource.max}` : ''}
                        </span>
                      </span>
                      <span className="text-[0.78rem] font-bold text-muted">{action.range || action.rangeLabel || '--'}</span>
                      <span className="inline-grid place-items-center w-fit min-w-[34px] min-h-[28px] py-1 px-1.5 text-[#304050] bg-[#fbfbfb] border border-[#bccbd8] rounded-[5px] font-[850] text-xs">
                        {action.hit || '--'}
                      </span>
                      <span className="text-[0.8rem] font-bold leading-tight">{formatDamage(action.damage)}</span>
                      <span className="text-[#6f7a80] text-[0.65rem] font-extrabold leading-[1.1] truncate">
                        {disabled ? `Desabilitada: ${disabledReason(action)}` : [action.notes, recovery].filter(Boolean).join(' • ') || '--'}
                      </span>
                    </button>

                    {isOpen && (
                      <div className="pt-2.5 pb-3.5 pl-2 pr-2 text-[#111] bg-white border-b border-dotted border-[#d7d7d7] leading-[1.28] text-[0.75rem]">
                        <p className="mb-2 text-zinc-700">{action.detail || action.notes || action.name}</p>
                        <div className="flex flex-wrap gap-1.5 text-[0.67rem] font-black uppercase text-[#68737a]">
                          {action.rangeLabel && <span className="rounded bg-zinc-100 px-2 py-1">{action.rangeLabel}</span>}
                          {Boolean(action.source?.ammoRequired) && (
                            <span className="rounded bg-zinc-100 px-2 py-1">
                              Munição: {Number(action.source?.ammoAvailable ?? 0)}
                            </span>
                          )}
                          {resource && <span className="rounded bg-zinc-100 px-2 py-1">{recovery}</span>}
                          {disabled && <span className="rounded bg-rose-50 px-2 py-1 text-rose-700">{disabledReason(action)}</span>}
                        </div>
                        {(action.cost?.resource || action.resource || action.kind === 'attack') && (
                          <div className="flex items-center gap-2 mt-2.5">
                            <button
                              type="button"
                              className="relative min-h-[28px] grid place-items-center text-white bg-[#cf3036] border-0 rounded-[6px] text-[0.62rem] font-[950] uppercase cursor-pointer px-3 disabled:cursor-not-allowed disabled:bg-zinc-400"
                              disabled={disabled}
                              onClick={() => void handleUse(action)}
                            >
                              {action.cost?.resource || action.resource ? 'Usar' : 'Rolar'}
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </article>
                );
              })}
            </section>
          ))}
        </div>
      )}
    </div>
  );
};

function kindLabel(kind: DerivedActionKind): string {
  const labels: Record<DerivedActionKind, string> = {
    attack: 'Attack',
    action: 'Action',
    bonus: 'Bonus Action',
    reaction: 'Reaction',
    other: 'Other',
    limited: 'Limited Use',
  };
  return labels[kind];
}

function formatDamage(damage?: string[]): string {
  if (!damage?.length) return '--';
  return damage.join(', ');
}

function disabledReason(action: DerivedAction): string {
  const text = `${action.notes ?? ''} ${action.detail ?? ''}`.trim();
  if (text) return text;
  if (action.source?.ammoRequired) return 'sem munição';
  if (action.disabled) return 'indisponível';
  return 'recurso indisponível';
}

function resourceState(value: any): { current: number; max: number; recovery: string } | null {
  if (!value) return null;
  if (typeof value.current === 'number') {
    return { current: value.current, max: Number(value.max ?? value.current), recovery: String(value.recovery ?? 'none') };
  }
  if (typeof value.used === 'number') {
    const max = Number(value.max ?? 0);
    return { current: Math.max(0, max - value.used), max, recovery: String(value.recovery ?? 'none') };
  }
  return null;
}
