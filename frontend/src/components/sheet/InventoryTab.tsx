import React from 'react';
import { useCharacterStore } from '../../store/useCharacterStore';
import { useDerivedState } from '../../hooks/useDerivedState';
import styles from './InventoryTab.module.css';
import { clsx } from 'clsx';

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
    <div className={styles.inventoryTab}>
      <div className={styles.inventoryHead}>
        <div>
          <strong>Carga: {derived.encumbrance.carriedWeight.toFixed(1)} lb. / {derived.encumbrance.carryingCapacity} lb.</strong>
          <span>{derived.encumbrance.encumbered ? 'Sobrecarregado' : 'Inventário Pessoal'}</span>
        </div>
        <strong>0 GP</strong>
      </div>

      <div className={styles.inventoryList}>
        {character.inventory.length > 0 ? (
          character.inventory.map((item, idx) => {
            const isEquipped = character.equippedItems.includes(item);
            return (
              <div key={idx} className={styles.inventoryRow}>
                <button 
                  type="button" 
                  className={clsx(styles.equipBox, isEquipped && styles.equipped)}
                  onClick={() => toggleEquip(item)}
                  title={isEquipped ? 'Desequipar' : 'Equipar'}
                ></button>
                <div>
                  <strong>{item}</strong>
                  <span>Item</span>
                </div>
                <span>-- lb.</span>
                <span>-- GP</span>
              </div>
            );
          })
        ) : (
          <div className={styles.emptyState}>O inventário está vazio.</div>
        )}
      </div>
    </div>
  );
};
