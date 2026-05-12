import React, { useState } from 'react';
import { SummaryTab } from './SummaryTab';
import { SkillsTab } from './SkillsTab';
import { InventoryTab } from './InventoryTab';
import { AttacksTab } from './AttacksTab';
import { SpellsTab } from './SpellsTab';
import { FeaturesTab } from './FeaturesTab';
import { cn } from '../../lib/utils';

type TabId = 'summary' | 'skills' | 'inventory' | 'attacks' | 'spells' | 'features';

interface CharacterSheetProps {
  isWide?: boolean;
}

export const CharacterSheet: React.FC<CharacterSheetProps> = ({ isWide = false }) => {
  const [activeTab, setActiveTab] = useState<TabId>('summary');

  const tabClass = (id: TabId) => cn(
    "min-w-0 min-h-[36px] grid place-items-center py-1 px-0.5 text-[#111] border-2 border-gold rounded-lg bg-cream font-black leading-none text-center transition-all",
    isWide ? "text-[0.7rem] px-2" : "text-[0.62rem] tracking-tight truncate",
    activeTab === id && "text-white bg-[#323264] border-blue scale-[1.02]"
  );

  return (
    <div className="w-full">
      <div className={cn(
        "grid gap-1.5 mb-4",
        isWide ? "grid-cols-3 sm:grid-cols-6" : "grid-cols-3"
      )}>
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

      <div>
        {activeTab === 'summary' && <SummaryTab />}
        {activeTab === 'skills' && <SkillsTab />}
        {activeTab === 'inventory' && <InventoryTab />}
        {activeTab === 'attacks' && <AttacksTab />}
        {activeTab === 'spells' && <SpellsTab />}
        {activeTab === 'features' && <FeaturesTab />}
      </div>
    </div>
  );
};
