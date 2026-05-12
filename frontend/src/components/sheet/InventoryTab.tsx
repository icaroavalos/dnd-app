import React from 'react';
import { useCharacterStore } from '../../store/useCharacterStore';
import { useDerivedState } from '../../hooks/useDerivedState';
import { cn } from '../../lib/utils';

export const InventoryTab: React.FC = () => {
  const { character, updateCharacter } = useCharacterStore();
  const derived = useDerivedState();

  const toggleEquip = (itemId: string) => {
    const current = [...character.equippedItems];
    if (current.includes(itemId)) {
      updateCharacter({ equippedItems: current.filter(id => id !== itemId) });
    } else {
      updateCharacter({ equippedItems: [...current, itemId] });
    }
  };

  return (
    <div className="">
      <div className="flex justify-between gap-2.5 p-2.5 text-[#111] bg-white border-b-[3px] border-[#cf3036] text-left">
        <div>
          <strong className="block">Carga: {derived.encumbrance.carriedWeight.toFixed(1)} lb. / {derived.encumbrance.carryingCapacity} lb.</strong>
          <span className="block text-[#68737a] text-[0.76rem] font-[850] uppercase">{derived.encumbrance.encumbered ? 'Sobrecarregado' : 'Inventário Pessoal'}</span>
        </div>
        <strong className="flex items-center">0 GP</strong>
      </div>

      <div className="grid gap-0 text-[#111] bg-white">
        {character.inventory.length > 0 ? (
          character.inventory.map((item, idx) => {
            const isEquipped = character.equippedItems.includes(item);
            return (
              <div key={idx} className="grid grid-cols-[28px_1fr_52px_52px_minmax(80px,1fr)] gap-2 items-center min-h-[54px] py-[7px] px-2 border-b border-dotted border-[#d4d4d4] text-left">
                <button 
                  type="button" 
                  className={cn(
                    "w-[22px] h-[22px] border-2 border-[#ddd] bg-[#f7f7f7] shadow-[inset_0_0_6px_rgba(0,0,0,0.12)] cursor-pointer",
                    isEquipped && "bg-[#cf3036] border-white shadow-[inset_0_0_0_3px_#cf3036,0_0_0_1px_#ddd]"
                  )}
                  onClick={() => toggleEquip(item)}
                  title={isEquipped ? 'Desequipar' : 'Equipar'}
                ></button>
                <div>
                  <strong className="block text-[0.9rem] leading-tight">{item}</strong>
                  <span className="block text-[#6f7a80] text-[0.72rem] font-extrabold">Item</span>
                </div>
                <span className="text-[#111] text-[0.78rem]">-- lb.</span>
                <span className="text-[#111] text-[0.78rem]">-- GP</span>
                <span></span>
              </div>
            );
          })
        ) : (
          <div className="min-h-[120px] grid place-items-center text-muted border border-dashed border-[#343434] rounded-lg text-center p-4 m-4">O inventário está vazio.</div>
        )}
      </div>
    </div>
  );
};
