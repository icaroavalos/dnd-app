import React, { useEffect, useMemo, useState } from 'react';
import { getItems, type CatalogEntry } from '../../api/catalog-api';
import { useDerivedState } from '../../hooks/useDerivedState';
import { cn } from '../../lib/utils';
import { useCharacterStore } from '../../store/useCharacterStore';
import { parseItemValue } from '../../lib/data-parser';
import { Search, Plus, Trash2, Shield, Sword, Package, Coins, X, ChevronDown, ChevronUp, Zap } from 'lucide-react';

type InventoryFilter = 'all' | 'equipped' | 'attunement' | 'consumable' | 'other';

const FILTERS: Array<{ id: InventoryFilter; label: string }> = [
  { id: 'all', label: 'Tudo' },
  { id: 'equipped', label: 'Equipado' },
  { id: 'attunement', label: 'Sint.' },
  { id: 'consumable', label: 'Consum.' },
  { id: 'other', label: 'Outros' },
];

const STATUS_LABELS: Record<string, string> = {
  backpack: 'Mochila',
  equipped_main_hand: 'Mão principal',
  equipped_off_hand: 'Mão secundária',
  equipped_armor: 'Armadura',
  equipped_shield: 'Escudo',
  attuned: 'Sintonizado',
};

export const InventoryTab: React.FC = () => {
  const { character, updateCharacter, addItem, removeItem, updateItemQuantity, updateCurrency } = useCharacterStore();
  const derived = useDerivedState();
  const [catalog, setCatalog] = useState<CatalogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<InventoryFilter>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [catalogSearch, setCatalogSearch] = useState('');
  const [catalogCategory, setCatalogCategory] = useState<string>('all');
  const [pendingItem, setPendingItem] = useState<CatalogEntry | null>(null);
  const [initialQuantity, setInitialQuantity] = useState(1);

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
  const currency = character.currency || { gp: 0, sp: 0, cp: 0, pp: 0, ep: 0 };

  const inventoryWithData = useMemo(() => {
    return inventory
      .filter((raw: any) => {
        const baseId = String(raw?.baseItemId || raw?.id || raw?.name || '').toLowerCase();
        // Filter out currency items if we have them in the dedicated currency object
        return baseId !== 'gp' && baseId !== 'sp' && baseId !== 'cp' && baseId !== 'pp' && baseId !== 'ep';
      })
      .map((raw: any, idx) => {
        const baseItemId = String(raw?.baseItemId || raw?.id || raw?.name || raw || '');
        const instanceId = String(raw?.instanceId || raw?.id || `${baseItemId || 'item'}-${idx}`);
        const catalogItem = itemMap[baseItemId.toLowerCase()] || itemMap[String(raw?.customName || '').toLowerCase()];
        const name = raw?.customName || raw?.name || catalogItem?.name || baseItemId || `Item ${idx + 1}`;
        const quantity = Number(raw?.quantity || 1);
        const weight = Number(raw?.weight ?? catalogItem?.weight ?? 0);
        const value = parseItemValue(raw?.value ?? raw?.price ?? catalogItem?.value ?? catalogItem?.price ?? 0);
        
        const status = normalizeStatus(raw, character.equippedItems);
        const type = raw?.type || catalogItem?.type || '';
        const ac = Number(raw?.ac || raw?.armorClass || catalogItem?.ac || 0);

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
          type,
          ac,
          source: raw?.source || catalogItem?.source || 'Manual',
          properties: raw?.properties || raw?.property || catalogItem?.properties || catalogItem?.property || [],
          notes: raw?.notes || raw?.description || catalogItem?.description || '',
        };
      });
  }, [inventory, itemMap, character.equippedItems]);

  const attunedCount = inventoryWithData.filter((item) => item.status === 'attuned').length;
  const totalCarriedWeight = inventoryWithData.reduce((acc, item) => acc + item.weight * item.quantity, 0);
  const capacity = derived.encumbrance?.carryingCapacity ?? 150;
  const isEncumbered = totalCarriedWeight > capacity;

  const catalogCategories = useMemo(() => {
    const types = new Set<string>();
    catalog.forEach(item => {
      if (item.type) {
        const rawType = String(item.type).split('|')[0];
        if (rawType) types.add(rawType);
      }
    });
    return Array.from(types).sort();
  }, [catalog]);

  const filteredCatalog = useMemo(() => {
    let results = catalog;
    
    if (catalogCategory !== 'all') {
      results = results.filter(item => {
        const rawType = String(item.type || '').split('|')[0];
        return rawType === catalogCategory;
      });
    }

    if (catalogSearch.trim()) {
      const q = catalogSearch.toLowerCase();
      results = results.filter(item => 
        item.name.toLowerCase().includes(q) || 
        (item.type && item.type.toLowerCase().includes(q))
      );
    }
    
    return results.slice(0, 20);
  }, [catalog, catalogSearch, catalogCategory]);

  const visibleItems = inventoryWithData.filter((item) => {
    const q = search.trim().toLowerCase();
    const matchesSearch = !q || item.name.toLowerCase().includes(q);
    if (!matchesSearch) return false;
    
    if (filter === 'all') return true;
    if (filter === 'equipped') return item.status.startsWith('equipped');
    if (filter === 'attunement') return item.status === 'attuned' || mayAttune(item);
    if (filter === 'consumable') return ['P', 'SC', 'G', 'FD'].includes(String(item.type).split('|')[0]);
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

  const toggleEquip = (item: any) => {
    if (item.status.startsWith('equipped')) {
      setItemStatus(item.instanceId, 'backpack');
    } else {
      const type = String(item.type || '').split('|')[0];
      if (type === 'S') { // Shield
        setItemStatus(item.instanceId, 'equipped_shield');
      } else if (['LA', 'MA', 'HA'].includes(type)) { // Armor
        setItemStatus(item.instanceId, 'equipped_armor');
      } else if (item.dmg1 || type === 'M' || type === 'R') { // Weapon
        setItemStatus(item.instanceId, 'equipped_main_hand');
      } else {
        setItemStatus(item.instanceId, 'equipped_main_hand');
      }
    }
  };

  const attuneItem = (instanceId: string) => {
    if (attunedCount >= 3) {
      setMessage('Limite de sintonização atingido (3/3).');
      return;
    }
    setItemStatus(instanceId, 'attuned');
  };

  const handleAddItem = () => {
    if (pendingItem) {
      addItem(pendingItem, initialQuantity);
      setPendingItem(null);
      setInitialQuantity(1);
      setShowAddModal(false);
      setCatalogSearch('');
    }
  };

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Currency & Summary Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Currency Panel */}
        <div className="bg-[#111] border border-line rounded-xl p-3 shadow-lg">
          <div className="flex items-center gap-2 mb-3">
            <Coins className="text-gold" size={16} />
            <h3 className="text-[0.7rem] font-black uppercase tracking-widest text-muted">Moedas</h3>
          </div>
          <div className="grid grid-cols-5 gap-1.5">
            <CurrencyInput label="CP" value={currency.cp} onChange={(v) => updateCurrency({ cp: v })} color="text-orange-700" />
            <CurrencyInput label="SP" value={currency.sp} onChange={(v) => updateCurrency({ sp: v })} color="text-zinc-400" />
            <CurrencyInput label="EP" value={currency.ep} onChange={(v) => updateCurrency({ ep: v })} color="text-blue-400" />
            <CurrencyInput label="GP" value={currency.gp} onChange={(v) => updateCurrency({ gp: v })} color="text-gold" />
            <CurrencyInput label="PP" value={currency.pp} onChange={(v) => updateCurrency({ pp: v })} color="text-emerald-300" />
          </div>
        </div>

        {/* Stats Panel */}
        <div className="bg-[#111] border border-line rounded-xl p-3 shadow-lg grid grid-cols-2 gap-3">
          <SummaryTile 
            label="Carga" 
            value={`${totalCarriedWeight.toFixed(1)} / ${capacity} lb.`} 
            subValue={isEncumbered ? 'Sobrecarregado' : 'Normal'}
            tone={isEncumbered ? 'bad' : 'good'} 
          />
          <SummaryTile 
            label="Sintonização" 
            value={`${attunedCount} / 3`} 
            subValue="Itens Mágicos"
            tone={attunedCount >= 3 ? 'bad' : 'neutral'} 
          />
        </div>
      </div>

      {/* Inventory List Section */}
      <div className="bg-white rounded-xl shadow-xl overflow-hidden border border-zinc-200">
        <div className="p-4 border-b border-zinc-100 bg-zinc-50/50 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
              <input
                className="w-full h-10 pl-10 pr-4 rounded-lg border border-zinc-200 bg-white text-sm font-bold outline-none focus:border-[#cf3036] focus:ring-1 focus:ring-[#cf3036]/20 transition-all"
                placeholder="Buscar no inventário..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="h-10 px-4 bg-[#cf3036] text-white rounded-lg flex items-center gap-2 font-black text-[0.7rem] uppercase tracking-wider hover:bg-[#b2292f] transition-all shadow-md active:scale-95"
            >
              <Plus size={18} />
              Adicionar
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {FILTERS.map((entry) => (
              <button
                key={entry.id}
                type="button"
                className={cn(
                  'h-8 px-3 rounded-full text-[0.65rem] font-black uppercase tracking-wider transition-all border',
                  filter === entry.id 
                    ? 'bg-[#323264] border-[#323264] text-white shadow-sm' 
                    : 'bg-white border-zinc-200 text-zinc-500 hover:border-zinc-300 hover:bg-zinc-50'
                )}
                onClick={() => setFilter(entry.id)}
              >
                {entry.label}
              </button>
            ))}
          </div>
        </div>

        {message && (
          <div className="mx-4 mt-4 p-3 rounded-lg border border-rose-200 bg-rose-50 text-[0.7rem] font-bold text-rose-700 animate-in slide-in-from-top-2">
            {message}
          </div>
        )}

        <div className="p-2 min-h-[400px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="w-8 h-8 border-4 border-zinc-200 border-t-[#cf3036] rounded-full animate-spin" />
              <span className="text-sm font-bold text-zinc-400">Carregando itens...</span>
            </div>
          ) : visibleItems.length > 0 ? (
            <div className="grid gap-1">
              {visibleItems.map((item) => {
                const isOpen = selectedId === item.instanceId;
                const isEquippable = isItemEquippable(item);
                const isEquipped = item.status.startsWith('equipped');
                const Icon = getItemIcon(item);

                return (
                  <div key={item.instanceId} className={cn(
                    "group rounded-xl border transition-all",
                    isOpen ? "border-[#cf3036] bg-zinc-50 shadow-sm" : "border-transparent hover:bg-zinc-50"
                  )}>
                    <div className="flex items-center gap-3 p-3 cursor-pointer" onClick={() => setSelectedId(isOpen ? null : item.instanceId)}>
                      <div className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center transition-colors",
                        isEquipped ? "bg-[#323264] text-white" : "bg-zinc-100 text-zinc-400 group-hover:bg-zinc-200"
                      )}>
                        <Icon size={20} />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-black text-zinc-800 truncate">{item.name}</h4>
                          {item.quantity > 1 && <span className="px-1.5 py-0.5 rounded bg-zinc-200 text-[0.6rem] font-black text-zinc-600">x{item.quantity}</span>}
                        </div>
                        <p className="text-[0.65rem] font-bold text-zinc-400 uppercase tracking-tighter">
                          {STATUS_LABELS[item.status] || item.status} • {item.type || 'Item'}
                        </p>
                      </div>

                      <div className="text-right pr-2">
                        <span className="block text-xs font-black text-zinc-700">{(item.weight * item.quantity).toFixed(1)} <small className="text-[0.6rem] opacity-50 uppercase">lb</small></span>
                        <span className="block text-[0.65rem] font-bold text-gold uppercase">{formatNumber(item.value)} gp</span>
                      </div>

                      {isEquippable && (
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleEquip(item); }}
                          className={cn(
                            "h-8 px-3 rounded-lg text-[0.6rem] font-black uppercase tracking-wider border-2 transition-all",
                            isEquipped 
                              ? "bg-[#323264] border-[#323264] text-white shadow-md" 
                              : "bg-white border-zinc-200 text-zinc-400 hover:border-[#323264] hover:text-[#323264]"
                          )}
                        >
                          {isEquipped ? 'VESTIDO' : 'EQUIPAR'}
                        </button>
                      )}

                      <div className="text-zinc-300 group-hover:text-zinc-400 transition-colors">
                        {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      </div>
                    </div>

                    {isOpen && (
                      <div className="px-3 pb-3 pt-1 border-t border-zinc-100 animate-in slide-in-from-top-1 duration-200">
                        <div className="flex flex-wrap gap-2 mb-4 mt-2">
                          <StatusBtn label="Mochila" active={item.status === 'backpack'} onClick={() => setItemStatus(item.instanceId, 'backpack')} />
                          {isItemWeapon(item) && (
                            <>
                              <StatusBtn label="Principal" active={item.status === 'equipped_main_hand'} onClick={() => setItemStatus(item.instanceId, 'equipped_main_hand')} />
                              <StatusBtn label="Secundária" active={item.status === 'equipped_off_hand'} onClick={() => setItemStatus(item.instanceId, 'equipped_off_hand')} />
                            </>
                          )}
                          {isItemArmor(item) && <StatusBtn label="Vestim." active={item.status === 'equipped_armor'} onClick={() => setItemStatus(item.instanceId, 'equipped_armor')} />}
                          {isItemShield(item) && <StatusBtn label="Escudo" active={item.status === 'equipped_shield'} onClick={() => setItemStatus(item.instanceId, 'equipped_shield')} />}
                          <StatusBtn 
                            label={item.status === 'attuned' ? 'Dessintonizar' : 'Sintonizar'} 
                            active={item.status === 'attuned'} 
                            onClick={() => item.status === 'attuned' ? setItemStatus(item.instanceId, 'backpack') : attuneItem(item.instanceId)} 
                          />
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="space-y-3">
                            <div className="bg-white p-3 rounded-lg border border-zinc-200 space-y-2">
                              <Detail label="Peso" value={`${item.weight} lb. cada`} />
                              <div className="flex items-center justify-between">
                                <strong className="text-[0.65rem] font-black uppercase text-zinc-400">Quantidade</strong>
                                <div className="flex items-center gap-2">
                                  <button onClick={() => updateItemQuantity(item.instanceId, item.quantity - 1)} className="w-6 h-6 rounded bg-zinc-100 flex items-center justify-center text-zinc-600 hover:bg-zinc-200"><Minus size={12} /></button>
                                  <span className="text-sm font-black w-6 text-center">{item.quantity}</span>
                                  <button onClick={() => updateItemQuantity(item.instanceId, item.quantity + 1)} className="w-6 h-6 rounded bg-zinc-100 flex items-center justify-center text-zinc-600 hover:bg-zinc-200"><Plus size={12} /></button>
                                </div>
                              </div>
                              <Detail label="Valor" value={`${formatNumber(item.value)} gp`} />
                              <Detail label="Propriedades" value={formatProperties(item.properties)} />
                            </div>
                            
                            <button 
                              onClick={() => removeItem(item.instanceId)}
                              className="w-full h-10 rounded-lg border-2 border-rose-100 text-rose-600 flex items-center justify-center gap-2 text-[0.7rem] font-black uppercase hover:bg-rose-50 transition-colors"
                            >
                              <Trash2 size={16} />
                              Excluir Item
                            </button>
                          </div>

                          <div className="bg-zinc-800 text-zinc-300 p-4 rounded-lg text-[0.75rem] leading-relaxed italic">
                            {item.notes || 'Nenhuma descrição disponível.'}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center px-10">
              <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center mb-4">
                <Package className="text-zinc-200" size={32} />
              </div>
              <h3 className="text-sm font-black text-zinc-400 uppercase tracking-wider">Mochila Vazia</h3>
              <p className="text-[0.7rem] font-medium text-zinc-400 mt-1">Sua busca não retornou resultados ou você ainda não possui itens.</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50">
              <h3 className="text-sm font-black uppercase tracking-widest text-zinc-800">
                {pendingItem ? 'Confirmar Quantidade' : 'Adicionar Item'}
              </h3>
              <button onClick={() => { setShowAddModal(false); setPendingItem(null); }} className="w-8 h-8 rounded-full hover:bg-zinc-200 flex items-center justify-center text-zinc-400 transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              {!pendingItem ? (
                <>
                  <div className="flex flex-col gap-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                      <input
                        autoFocus
                        className="w-full h-12 pl-10 pr-4 rounded-xl border-2 border-zinc-100 bg-white text-sm font-bold outline-none focus:border-[#cf3036] transition-all"
                        placeholder="Pesquisar no catálogo..."
                        value={catalogSearch}
                        onChange={(e) => setCatalogSearch(e.target.value)}
                      />
                    </div>

                    <div className="flex flex-wrap gap-1.5 overflow-x-auto pb-2 custom-scrollbar">
                      <button
                        onClick={() => setCatalogCategory('all')}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-[0.6rem] font-black uppercase tracking-wider transition-all border whitespace-nowrap",
                          catalogCategory === 'all' ? "bg-[#323264] border-[#323264] text-white" : "bg-zinc-50 border-zinc-200 text-zinc-500 hover:bg-zinc-100"
                        )}
                      >
                        Todas
                      </button>
                      {catalogCategories.map(cat => (
                        <button
                          key={cat}
                          onClick={() => setCatalogCategory(cat)}
                          className={cn(
                            "px-3 py-1.5 rounded-lg text-[0.6rem] font-black uppercase tracking-wider transition-all border whitespace-nowrap",
                            catalogCategory === cat ? "bg-[#323264] border-[#323264] text-white" : "bg-zinc-50 border-zinc-200 text-zinc-500 hover:bg-zinc-100"
                          )}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="max-h-[300px] overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                    {filteredCatalog.length > 0 ? (
                      filteredCatalog.map(item => {
                        const ItemIcon = getItemIcon(item, true);
                        return (
                          <button
                            key={item.id}
                            onClick={() => setPendingItem(item)}
                            className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-zinc-50 text-left transition-colors border border-transparent hover:border-zinc-200"
                          >
                            <div className="w-8 h-8 rounded bg-zinc-100 flex items-center justify-center text-zinc-400">
                              <ItemIcon size={18} />
                            </div>
                            <div className="flex-1">
                              <div className="text-sm font-black text-zinc-800">{item.name}</div>
                              <div className="text-[0.6rem] font-bold text-zinc-400 uppercase tracking-tighter">
                                {item.type || 'Item'} • {item.source}
                              </div>
                            </div>
                            <div className="text-right pr-2">
                              <span className="block text-[0.65rem] font-black text-zinc-500">{Number(item.weight || 0)} lb.</span>
                              <span className="block text-[0.65rem] font-bold text-gold uppercase">{formatNumber(parseItemValue(item.value || item.price || 0))} gp</span>
                            </div>
                            <Plus className="text-[#cf3036]" size={18} />
                          </button>
                        );
                      })
                    ) : (
                      <div className="py-10 text-center text-zinc-400 italic text-sm">
                        {catalogSearch.length >= 2 ? `Nenhum item encontrado para "${catalogSearch}"` : 'Digite pelo menos 2 letras para pesquisar...'}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex flex-col gap-6 py-4 items-center text-center">
                  <div className="w-16 h-16 rounded-2xl bg-zinc-50 flex items-center justify-center text-zinc-400 mb-2">
                    {React.createElement(getItemIcon(pendingItem, true), { size: 32 })}
                  </div>
                  <div>
                    <h4 className="text-lg font-black text-zinc-800">{pendingItem.name}</h4>
                    <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">{pendingItem.type || 'Item'} • {pendingItem.source}</p>
                  </div>

                  <div className="flex flex-col gap-2 w-full max-w-[200px]">
                    <span className="text-[0.6rem] font-black uppercase text-zinc-400 tracking-widest">Quantidade Inicial</span>
                    <div className="flex items-center gap-4 p-2 bg-zinc-50 rounded-2xl border-2 border-zinc-100">
                      <button onClick={() => setInitialQuantity(q => Math.max(1, q - 1))} className="w-10 h-10 rounded-xl bg-white border border-zinc-200 flex items-center justify-center text-zinc-600 hover:bg-zinc-100"><Minus size={16} /></button>
                      <input 
                        type="number" 
                        value={initialQuantity} 
                        onChange={(e) => setInitialQuantity(parseInt(e.target.value) || 1)}
                        className="flex-1 bg-transparent text-center text-xl font-black text-zinc-800 outline-none w-12"
                      />
                      <button onClick={() => setInitialQuantity(q => q + 1)} className="w-10 h-10 rounded-xl bg-white border border-zinc-200 flex items-center justify-center text-zinc-600 hover:bg-zinc-100"><Plus size={16} /></button>
                    </div>
                  </div>

                  <div className="flex gap-3 w-full">
                    <button 
                      onClick={() => setPendingItem(null)}
                      className="flex-1 h-12 rounded-xl bg-zinc-100 text-zinc-600 font-black text-[0.7rem] uppercase tracking-widest hover:bg-zinc-200 transition-all"
                    >
                      Voltar
                    </button>
                    <button 
                      onClick={handleAddItem}
                      className="flex-[2] h-12 rounded-xl bg-[#cf3036] text-white font-black text-[0.7rem] uppercase tracking-widest hover:bg-[#b2292f] transition-all shadow-lg shadow-rose-900/10"
                    >
                      Adicionar ao Inventário
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

function CurrencyInput({ label, value, color, onChange }: { label: string; value: number; color: string; onChange: (v: number) => void }) {
  return (
    <div className="flex flex-col gap-1">
      <span className={cn("text-[0.6rem] font-black text-center uppercase", color)}>{label}</span>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value) || 0)}
        className="w-full h-8 bg-[#222] border border-line rounded-lg text-white text-center text-xs font-black outline-none focus:border-gold transition-all"
      />
    </div>
  );
}

function SummaryTile({ label, value, subValue, tone }: { label: string; value: string; subValue: string; tone: 'neutral' | 'good' | 'bad' }) {
  return (
    <div className="min-w-0">
      <span className="block text-[0.6rem] font-black uppercase tracking-wider text-muted mb-1">{label}</span>
      <strong className={cn('block text-sm leading-tight', tone === 'good' && 'text-emerald-500', tone === 'bad' && 'text-rose-500', tone === 'neutral' && 'text-white')}>
        {value}
      </strong>
      <span className="block text-[0.6rem] font-bold text-zinc-500">{subValue}</span>
    </div>
  );
}

function StatusBtn({ label, active, onClick }: { label: string; active?: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      className={cn(
        'h-7 px-2.5 rounded-md border text-[0.62rem] font-black uppercase tracking-wider transition-all',
        active 
          ? 'bg-[#cf3036] border-[#cf3036] text-white' 
          : 'bg-white border-zinc-200 text-zinc-500 hover:border-zinc-300'
      )}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-[0.65rem]">
      <strong className="text-zinc-400 uppercase font-black">{label}</strong>
      <span className="text-zinc-700 font-bold">{value}</span>
    </div>
  );
}

function getItemIcon(item: any, isCatalog = false) {
  const type = String(item.type || '').split('|')[0];
  if (['LA', 'MA', 'HA'].includes(type)) return Shield;
  if (type === 'S') return Shield;
  if (['M', 'R'].includes(type) || item.dmg1) return Sword;
  if (['P', 'SC', 'G', 'FD'].includes(type)) return Zap;
  return Package;
}

function isItemEquippable(item: any): boolean {
  const type = String(item.type || '').split('|')[0];
  return ['LA', 'MA', 'HA', 'S', 'M', 'R'].includes(type) || !!item.dmg1;
}

function isItemWeapon(item: any): boolean {
  const type = String(item.type || '').split('|')[0];
  return ['M', 'R'].includes(type) || !!item.dmg1;
}

function isItemArmor(item: any): boolean {
  const type = String(item.type || '').split('|')[0];
  return ['LA', 'MA', 'HA'].includes(type);
}

function isItemShield(item: any): boolean {
  const type = String(item.type || '').split('|')[0];
  return type === 'S';
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

function Minus({ size }: { size: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line></svg>;
}
