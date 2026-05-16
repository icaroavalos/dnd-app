import React, { useEffect, useMemo, useState } from 'react';
import { getItems, type CatalogEntry } from '../../api/catalog-api';
import { useDerivedState } from '../../hooks/useDerivedState';
import { cn } from '../../lib/utils';
import { useCharacterStore } from '../../store/useCharacterStore';

type InventoryFilter = 'all' | 'equipped' | 'attunement' | 'other';

const FILTERS: Array<{ id: InventoryFilter; label: string }> = [
  { id: 'all', label: 'Tudo' },
  { id: 'equipped', label: 'Equipamento' },
  { id: 'attunement', label: 'Sintonização' },
  { id: 'other', label: 'Outros' },
];

const STATUS_LABELS: Record<string, string> = {
  backpack: 'Backpack',
  equipped_main_hand: 'Mão principal',
  equipped_off_hand: 'Mão secundária',
  equipped_armor: 'Armadura',
  equipped_shield: 'Escudo',
  attuned: 'Sintonizado',
};

export const InventoryTab: React.FC = () => {
  const { character, updateCharacter } = useCharacterStore();
  const derived = useDerivedState();
  const [catalog, setCatalog] = useState<CatalogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<InventoryFilter>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getItems()
      .then((res) => {
        if (!cancelled) setCatalog(res.results);
      })
      .catch((err) => console.error('Failed to load items catalog:', err))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const itemMap = useMemo(() => {
    const map: Record<string, CatalogEntry> = {};
    catalog.forEach((item) => {
      if (item.id) map[item.id.toLowerCase()] = item;
      if (item.name) map[item.name.toLowerCase()] = item;
    });
    return map;
  }, [catalog]);

  const inventory = Array.isArray(character.inventory) ? character.inventory : [];

  const inventoryWithData = useMemo(() => {
    return inventory.map((raw: any, idx) => {
      const baseItemId = String(raw?.baseItemId || raw?.id || raw?.name || raw || '');
      const instanceId = String(raw?.instanceId || raw?.id || `${baseItemId || 'item'}-${idx}`);
      const catalogItem = itemMap[baseItemId.toLowerCase()] || itemMap[String(raw?.customName || '').toLowerCase()];
      const name = raw?.customName || raw?.name || catalogItem?.name || baseItemId || `Item ${idx + 1}`;
      const quantity = Number(raw?.quantity || 1);
      const weight = Number(raw?.weight ?? catalogItem?.weight ?? 0);
      const value = Number(raw?.value ?? raw?.price ?? catalogItem?.value ?? catalogItem?.price ?? raw?.gp ?? 0);
      const status = normalizeStatus(raw, character.equippedItems);

      return {
        ...raw,
        instanceId,
        baseItemId,
        catalogItem,
        name,
        quantity,
        weight,
        value,
        status,
        source: raw?.source || catalogItem?.source || 'Manual',
        properties: raw?.properties || raw?.property || catalogItem?.properties || catalogItem?.property || [],
        notes: raw?.notes || raw?.description || catalogItem?.description || '',
      };
    });
  }, [inventory, itemMap, character.equippedItems]);

  const attunedCount = inventoryWithData.filter((item) => item.status === 'attuned').length;
  const totalCarriedWeight = inventoryWithData.reduce((acc, item) => acc + item.weight * item.quantity, 0);
  const totalValue = inventoryWithData.reduce((acc, item) => acc + item.value * item.quantity, 0);
  const capacity = derived.encumbrance?.carryingCapacity ?? 150;
  const isEncumbered = totalCarriedWeight > capacity;

  const visibleItems = inventoryWithData.filter((item) => {
    const q = search.trim().toLowerCase();
    const matchesSearch = !q || item.name.toLowerCase().includes(q) || item.baseItemId.toLowerCase().includes(q);
    if (!matchesSearch) return false;
    if (filter === 'all') return true;
    if (filter === 'equipped') return item.status.startsWith('equipped');
    if (filter === 'attunement') return item.status === 'attuned' || mayAttune(item);
    return !item.status.startsWith('equipped') && item.status !== 'attuned';
  });

  const setItemStatus = (instanceId: string, status: string) => {
    setMessage(null);
    const nextInventory = inventory.map((item: any, idx) => {
      const baseItemId = String(item?.baseItemId || item?.id || item?.name || item || '');
      const currentId = String(item?.instanceId || item?.id || `${baseItemId || 'item'}-${idx}`);
      if (currentId !== instanceId) return item;
      return { ...item, instanceId: currentId, status };
    });

    const equippedItems = nextInventory
      .filter((item: any) => String(item.status || '').startsWith('equipped'))
      .map((item: any) => item.instanceId || item.baseItemId || item.id)
      .filter(Boolean);

    updateCharacter({ inventory: nextInventory, equippedItems });
  };

  const attuneItem = (instanceId: string) => {
    if (attunedCount >= 3) {
      setMessage('Limite de sintonização atingido (3/3).');
      return;
    }
    setItemStatus(instanceId, 'attuned');
  };

  return (
    <div className="w-full">
      <div className="grid grid-cols-2 gap-2 p-3 text-[#111] bg-white border-b-[3px] border-[#cf3036] text-left rounded-t-lg shadow-sm sm:grid-cols-4">
        <SummaryTile label="Carga:" value={`${totalCarriedWeight.toFixed(1)} / ${capacity} lb.`} tone={isEncumbered ? 'bad' : 'neutral'} />
        <SummaryTile label="Estado" value={isEncumbered ? 'Sobrecarregado' : 'Normal'} tone={isEncumbered ? 'bad' : 'good'} />
        <SummaryTile label="Valor" value={`${formatNumber(totalValue)} GP`} tone="neutral" />
        <SummaryTile label="Itens / Sint." value={`${inventoryWithData.length} itens • ${attunedCount}/3`} tone={attunedCount >= 3 ? 'bad' : 'neutral'} />
      </div>

      <div className="grid gap-3 text-[#111] bg-white overflow-hidden rounded-b-lg shadow-md min-h-[240px] p-3">
        <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
          <input
            className="min-h-[36px] rounded-md border border-zinc-300 bg-white px-3 text-sm font-bold outline-none focus:border-[#cf3036]"
            placeholder="Buscar item"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            onInput={(event) => setSearch(event.currentTarget.value)}
          />
          <div className="flex flex-wrap gap-1.5">
            {FILTERS.map((entry) => (
              <button
                key={entry.id}
                type="button"
                className={cn(
                  'min-h-[32px] px-[9px] text-[#6f7a80] bg-[#e9eaec] border-0 rounded-[6px] text-[0.7rem] font-[950] uppercase cursor-pointer',
                  filter === entry.id && 'text-white bg-[#323264]'
                )}
                onClick={() => setFilter(entry.id)}
              >
                {entry.label}
              </button>
            ))}
          </div>
        </div>

        {message && <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700">{message}</div>}
        {loading && <div className="text-center text-sm font-bold text-[#68737a]">Carregando catálogo...</div>}

        {visibleItems.length > 0 ? (
          <div className="grid gap-0">
            {visibleItems.map((item) => {
              const isOpen = selectedId === item.instanceId;

              return (
                <article key={item.instanceId} className="border-b border-dotted border-[#d4d4d4] last:border-0">
                  <button
                    type="button"
                    className="grid w-full grid-cols-[1fr_72px_70px] gap-3 items-center min-h-[58px] py-2 text-left hover:bg-zinc-50 transition-colors group"
                    onClick={() => setSelectedId(isOpen ? null : item.instanceId)}
                  >
                    <span className="min-w-0">
                      <strong className="block text-[0.85rem] leading-tight font-black truncate text-zinc-800 group-hover:text-[#cf3036] transition-colors">
                        {item.name}
                      </strong>
                      <span className="block text-[#6f7a80] text-[0.6rem] font-black uppercase tracking-tighter opacity-80">
                        {STATUS_LABELS[item.status] || item.status} {item.quantity > 1 ? `(x${item.quantity})` : ''}
                      </span>
                    </span>
                    <span className="text-[#111] text-[0.7rem] font-bold text-center opacity-70">{(item.weight * item.quantity).toFixed(1)} lb.</span>
                    <span className="text-[#111] text-[0.7rem] font-bold text-right pr-1 opacity-70">{formatNumber(item.value)} gp</span>
                  </button>

                  {isOpen && (
                    <div className="grid gap-3 pb-3 text-[0.75rem] leading-snug">
                      <div className="flex flex-wrap gap-1.5">
                        <StatusButton label="Backpack" onClick={() => setItemStatus(item.instanceId, 'backpack')} active={item.status === 'backpack'} />
                        <StatusButton label="Mão principal" onClick={() => setItemStatus(item.instanceId, 'equipped_main_hand')} active={item.status === 'equipped_main_hand'} />
                        <StatusButton label="Mão secundária" onClick={() => setItemStatus(item.instanceId, 'equipped_off_hand')} active={item.status === 'equipped_off_hand'} />
                        <StatusButton label="Armadura" onClick={() => setItemStatus(item.instanceId, 'equipped_armor')} active={item.status === 'equipped_armor'} />
                        <StatusButton label="Escudo" onClick={() => setItemStatus(item.instanceId, 'equipped_shield')} active={item.status === 'equipped_shield'} />
                        <StatusButton label={item.status === 'attuned' ? 'Dessintonizar' : 'Sintonizar'} onClick={() => item.status === 'attuned' ? setItemStatus(item.instanceId, 'backpack') : attuneItem(item.instanceId)} active={item.status === 'attuned'} />
                      </div>

                      <div className="grid gap-1.5 rounded-md bg-zinc-50 p-3 text-zinc-700">
                        <Detail label="Fonte" value={item.source} />
                        <Detail label="Peso" value={`${item.weight} lb. cada`} />
                        <Detail label="Quantidade" value={String(item.quantity)} />
                        <Detail label="Valor" value={`${formatNumber(item.value)} gp`} />
                        <Detail label="Propriedades" value={formatProperties(item.properties)} />
                        <Detail label="Notas" value={item.notes || '--'} />
                        <Detail label="Status atual" value={STATUS_LABELS[item.status] || item.status} />
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center min-h-[170px] text-muted p-8 text-center">
            <p className="italic text-sm font-medium">Nenhum item encontrado.</p>
            <p className="text-[0.7rem] mt-1 opacity-60">Ajuste a busca ou escolha equipamentos no construtor.</p>
          </div>
        )}
      </div>
    </div>
  );
};

function SummaryTile({ label, value, tone }: { label: string; value: string; tone: 'neutral' | 'good' | 'bad' }) {
  return (
    <div className="min-w-0 rounded-md bg-zinc-50 px-2 py-2">
      <span className="block text-[0.58rem] font-black uppercase tracking-wider text-[#68737a]">{label}</span>
      <strong className={cn('block truncate text-sm', tone === 'good' && 'text-emerald-700', tone === 'bad' && 'text-rose-700')}>
        {value}
      </strong>
    </div>
  );
}

function StatusButton({ label, active, onClick }: { label: string; active?: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      className={cn(
        'min-h-[28px] rounded-md border border-zinc-300 bg-white px-2 text-[0.62rem] font-black uppercase text-[#304050]',
        active && 'border-[#cf3036] bg-[#cf3036] text-white'
      )}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[92px_1fr] gap-2">
      <strong className="text-[#68737a]">{label}</strong>
      <span>{value}</span>
    </div>
  );
}

function normalizeStatus(item: any, equippedItems: string[] = []): string {
  if (item?.status) {
    const status = String(item.status);
    return status === 'carried' ? 'backpack' : status;
  }
  const id = String(item?.instanceId || item?.baseItemId || item?.id || '');
  if (equippedItems.includes(id)) return 'equipped_main_hand';
  return 'backpack';
}

function mayAttune(item: any): boolean {
  const text = `${item.name} ${item.baseItemId} ${item.catalogItem?.type ?? ''} ${item.notes ?? ''}`.toLowerCase();
  return item.status === 'attuned' || /ring|amulet|cloak|wondrous|magic|sinton/.test(text);
}

function formatProperties(value: unknown): string {
  if (Array.isArray(value)) return value.length ? value.join(', ') : '--';
  if (value) return String(value);
  return '--';
}

function formatNumber(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}
