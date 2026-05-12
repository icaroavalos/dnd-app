import React from 'react';
import { useCharacterStore } from '../../store/useCharacterStore';
import { useDerivedState } from '../../hooks/useDerivedState';
import { cn } from '../../lib/utils';

export const InventoryTab: React.FC = () => {
  const { character, updateCharacter } = useCharacterStore();
  const derived = useDerivedState();

  const inventory = Array.isArray(character.inventory) ? character.inventory : [];

  const toggleEquip = (itemId: string) => {
    const current = Array.isArray(character.equippedItems) ? [...character.equippedItems] : [];
    if (current.includes(itemId)) {
      updateCharacter({ equippedItems: current.filter(id => id !== itemId) });
    } else {
      updateCharacter({ equippedItems: [...current, itemId] });
    }
  };

  const carriedWeight = derived.encumbrance?.carriedWeight ?? 0;
  const capacity = derived.encumbrance?.carryingCapacity ?? 150;
  const isEncumbered = derived.encumbrance?.encumbered ?? false;

  return (
    <div className="w-full">
      <div className="flex justify-between gap-2.5 p-3 text-[#111] bg-white border-b-[3px] border-[#cf3036] text-left rounded-t-lg shadow-sm">
        <div className="min-w-0">
          <strong className="block text-sm truncate">
            Carga: {carriedWeight.toFixed(1)} lb. / {capacity} lb.
          </strong>
          <span className={cn(
            "block text-[0.7rem] font-black uppercase tracking-wider",
            isEncumbered ? "text-rose" : "text-[#68737a]"
          )}>
            {isEncumbered ? 'Sobrecarregado' : 'Inventário Pessoal'}
          </span>
        </div>
        <div className="flex-shrink-0 flex items-center">
          <strong className="text-sm bg-zinc-100 px-2 py-1 rounded border border-zinc-200">0 GP</strong>
        </div>
      </div>

      <div className="grid gap-0 text-[#111] bg-white overflow-hidden rounded-b-lg shadow-md min-h-[240px]">
        {inventory.length > 0 ? (
          inventory.map((item: any, idx) => {
            if (!item) return null;
            
            const itemId = typeof item === 'string' ? item : (item.baseItemId || `Item ${idx + 1}`);
            const source = typeof item === 'string' ? 'Manual' : (item.source || 'Standard');
            const isEquipped = Array.isArray(character.equippedItems) && character.equippedItems.includes(itemId);
            
            return (
              <div key={`${itemId}-${idx}`} className="grid grid-cols-[32px_1fr_60px_60px] gap-3 items-center min-h-[58px] py-2 px-3 border-b border-dotted border-[#d4d4d4] text-left last:border-0 hover:bg-zinc-50 transition-colors group">
                <button 
                  type="button" 
                  className={cn(
                    "w-5 h-5 border-2 border-[#ddd] bg-[#f7f7f7] shadow-sm cursor-pointer rounded transition-all",
                    isEquipped && "bg-[#cf3036] border-[#cf3036] ring-2 ring-[#cf3036]/20"
                  )}
                  onClick={() => toggleEquip(itemId)}
                  title={isEquipped ? 'Desequipar' : 'Equipar'}
                ></button>
                <div className="min-w-0">
                  <strong className="block text-[0.85rem] leading-tight font-black truncate text-zinc-800 group-hover:text-[#cf3036] transition-colors">{itemId}</strong>
                  <span className="block text-[#6f7a80] text-[0.6rem] font-black uppercase tracking-tighter opacity-70">
                    {source}
                  </span>
                </div>
                <span className="text-[#111] text-[0.7rem] font-bold text-center opacity-60">-- lb.</span>
                <span className="text-[#111] text-[0.7rem] font-bold text-right pr-2 opacity-60">-- GP</span>
              </div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center min-h-[200px] text-muted p-8 text-center">
            <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center mb-3">📦</div>
            <p className="italic text-sm font-medium">Seu inventário está vazio.</p>
            <p className="text-[0.7rem] mt-1 opacity-60">Escolha equipamentos no construtor para populá-lo.</p>
          </div>
        )}
      </div>
    </div>
  );
};
