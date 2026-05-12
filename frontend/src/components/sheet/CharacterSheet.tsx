import React, { useState } from 'react';
import { SummaryTab } from './SummaryTab';
import { SkillsTab } from './SkillsTab';
import { InventoryTab } from './InventoryTab';
import { AttacksTab } from './AttacksTab';
import { SpellsTab } from './SpellsTab';
import { FeaturesTab } from './FeaturesTab';
import { clsx } from 'clsx';
import styles from './CharacterSheet.module.css';

type TabId = 'summary' | 'skills' | 'inventory' | 'attacks' | 'spells' | 'features';

export const CharacterSheet: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('summary');

  return (
    <div className={styles.sheetInner}>
      <div className={styles.sheetTabs}>
        <button 
          onClick={() => setActiveTab('summary')}
          className={clsx(styles.tabButton, activeTab === 'summary' && styles.active)}
        >
          Resumo
        </button>
        <button 
          onClick={() => setActiveTab('skills')}
          className={clsx(styles.tabButton, activeTab === 'skills' && styles.active)}
        >
          Perícias
        </button>
        <button 
          onClick={() => setActiveTab('inventory')}
          className={clsx(styles.tabButton, activeTab === 'inventory' && styles.active)}
        >
          Itens
        </button>
        <button 
          onClick={() => setActiveTab('attacks')}
          className={clsx(styles.tabButton, activeTab === 'attacks' && styles.active)}
        >
          Ações
        </button>
        <button 
          onClick={() => setActiveTab('spells')}
          className={clsx(styles.tabButton, activeTab === 'spells' && styles.active)}
        >
          Magias
        </button>
        <button 
          onClick={() => setActiveTab('features')}
          className={clsx(styles.tabButton, activeTab === 'features' && styles.active)}
        >
          Habilidades
        </button>
      </div>

      <div className={styles.sheetContent}>
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
