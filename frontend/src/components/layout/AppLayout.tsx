import React, { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Header } from './Header';
import { CharacterSheet } from '../sheet/CharacterSheet';
import { LevelUpModal } from '../builder/LevelUpModal';
import { useCharacterStore } from '../../store/useCharacterStore';
import { cn } from '../../lib/utils';
import { saveCharacter } from '../../api/character-api';

export const AppLayout: React.FC = () => {
  const { character, activeCharacterId, pendingLevelUp, setIsSaving } = useCharacterStore();
  const location = useLocation();

  useEffect(() => {
    if (activeCharacterId && character.creationComplete) {
      setIsSaving(true);
      const timer = setTimeout(async () => {
        try {
          const slugify = (str: string) => String(str ?? "").trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
          
          const record = {
            ...character,
            ruleset: '5e-2024',
            lineageId: slugify(character.race),
            backgroundId: slugify(character.background),
            asiChoices: character.asiChoices,
            classFeatureChoices: character.classFeatureChoices,
            classes: (character.classes && character.classes.length > 0) 
              ? character.classes 
              : [{ classId: slugify(character.class), level: character.level }],
            state: {
              hp: character.hp,
              maxHpOverride: character.maxHp,
              tempHp: character.tempHp,
              hitDiceUsed: character.hitDiceUsed,
              spellSlotsUsed: Object.fromEntries(
                Object.entries(character.spellSlots || {}).map(([level, slot]: [string, any]) => [level, slot?.used || 0])
              ),
              activeConditions: []
            }
          };
          
          await saveCharacter(record as any);
        } catch (err) {
          console.error('Auto-save failed:', err);
        } finally {
          setIsSaving(false);
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [character, activeCharacterId, setIsSaving]);
  
  // A ficha deve ser centralizada se a criação estiver completa OU se estivermos na rota /sheet
  const isSheetView = location.pathname === '/sheet' || character.creationComplete;

  return (
    <div className="min-h-screen bg-bg text-ink">
      <Header />
      
      {pendingLevelUp && <LevelUpModal />}
      
      <main className={cn(
        "w-full mx-auto p-4 sm:p-6 transition-all duration-500 ease-in-out",
        isSheetView 
          ? "max-w-[800px] flex flex-col items-center" 
          : "max-w-[1260px] grid grid-cols-1 lg:grid-cols-[minmax(360px,1fr)_390px] gap-7 items-start"
      )}>
        {/* Sidebar do Construtor - só aparece se NÃO estiver na visualização de ficha finalizada */}
        {!isSheetView && (
          <aside className="min-w-0 bg-[#111111]/90 border border-[#262626] rounded-lg p-[18px] shadow-[0_18px_70px_rgba(0,0,0,0.34)]">
            <div className="builder-header">
              <h1 className="text-mint text-[0.74rem] tracking-normal uppercase mb-[3px] font-black">Construtor de Personagem</h1>
            </div>
            
            <div className="builder-content mt-4">
              <Outlet />
            </div>
          </aside>
        )}
        
        {/* Ficha de Personagem */}
        <section className={cn(
          "w-full transition-all duration-500 bg-black border border-[#1d1d1d] rounded-xl shadow-[0_26px_80px_rgba(0,0,0,0.42)]",
          isSheetView 
            ? "max-w-[500px] p-6 sm:p-8" 
            : "max-w-[390px] p-2.5 min-h-[760px] sticky top-20"
        )}>
          <div className="grid gap-2.5">
            <CharacterSheet isWide={isSheetView} />
          </div>
        </section>
      </main>
    </div>
  );
};
