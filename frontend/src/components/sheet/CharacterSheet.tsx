import React, { useState } from 'react';
import { SummaryTab } from './SummaryTab';
import { SkillsTab } from './SkillsTab';
import { InventoryTab } from './InventoryTab';
import { AttacksTab } from './AttacksTab';
import { SpellsTab } from './SpellsTab';
import { FeaturesTab } from './FeaturesTab';
import { cn } from '../../lib/utils';

type TabId = 'summary' | 'skills' | 'inventory' | 'attacks' | 'spells' | 'features';

export const CharacterSheet: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('summary');

  const tabClass = (id: TabId) => cn(
    "min-w-0 min-h-[34px] grid place-items-center py-1 px-0.5 text-[#111] border-2 border-gold rounded-lg bg-cream text-[0.58rem] font-black leading-none text-center overflow-wrap-anywhere whitespace-normal",
    activeTab === id && "text-white bg-[#323264] border-blue"
  );

  return (
    <div>
      <div className="grid grid-cols-6 gap-1 mb-2.5">
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
