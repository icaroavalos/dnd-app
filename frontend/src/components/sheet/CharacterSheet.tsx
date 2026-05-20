import React, { useState } from 'react';
import { SummaryTab } from './SummaryTab';
import { SkillsTab } from './SkillsTab';
import { InventoryTab } from './InventoryTab';
import { AttacksTab } from './AttacksTab';
import { SpellsTab } from './SpellsTab';
import { FeaturesTab } from './FeaturesTab';
import { SpellManagementModal } from './SpellManagementModal';
import { useCharacterStore } from '../../store/useCharacterStore';
import { cn } from '../../lib/utils';

type TabId = 'summary' | 'skills' | 'inventory' | 'attacks' | 'spells' | 'features';

interface CharacterSheetProps {
  isWide?: boolean;
}

export const CharacterSheet: React.FC<CharacterSheetProps> = ({ isWide = false }) => {
  const { character, finalizePreparation } = useCharacterStore();
  const [activeTab, setActiveTab] = useState<TabId>('summary');

  const tabClass = (id: TabId) => cn(
    "flex-1 min-w-fit whitespace-nowrap min-h-[38px] grid place-items-center py-2 px-3 text-[#111] border-2 border-gold rounded-lg bg-cream font-black leading-none text-center transition-all",
    isWide ? "text-[0.65rem] sm:text-[0.7rem]" : "text-[0.6rem] tracking-tighter",
    activeTab === id && "text-white bg-[#323264] border-blue scale-[1.02] z-10"
  );

  return (
    <div className="w-full">
      <div className="flex flex-nowrap overflow-x-auto no-scrollbar gap-1.5 mb-4 pb-2">
        <button 
          onClick={() => setActiveTab('summary')}
          className={tabClass('summary')}
        >
          Resumo
        </button>
        <button 
          onClick={() => setActiveTab('skills')}
          className={tabClass('skills')}
        >
          Perícias
        </button>
        <button 
          onClick={() => setActiveTab('inventory')}
          className={tabClass('inventory')}
        >
          Itens
        </button>
        <button 
          onClick={() => setActiveTab('attacks')}
          className={tabClass('attacks')}
        >
          Ações
        </button>
        <button 
          onClick={() => setActiveTab('spells')}
          className={tabClass('spells')}
        >
          Magias
        </button>
        <button
         onClick={() => setActiveTab('features')}
         className={tabClass('features')}
        >
         Habilidades
        </button>
      </div>

      <div className="mt-2">
        {activeTab === 'summary' && <SummaryTab />}
        {activeTab === 'skills' && <SkillsTab isWide={isWide} />}
        {activeTab === 'inventory' && <InventoryTab />}
        {activeTab === 'attacks' && <AttacksTab />}
        {activeTab === 'spells' && <SpellsTab />}
        {activeTab === 'features' && <FeaturesTab />}
      </div>
      
      {character._needsPreparation && (
        <SpellManagementModal onClose={finalizePreparation} />
      )}
    </div>
  );
};
