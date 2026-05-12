import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Header } from './Header';
import { CharacterSheet } from '../sheet/CharacterSheet';
import { useCharacterStore } from '../../store/useCharacterStore';
import { cn } from '../../lib/utils';

export const AppLayout: React.FC = () => {
  const { character } = useCharacterStore();
  const location = useLocation();
  
  // A ficha deve ser centralizada se a criação estiver completa OU se estivermos na rota /sheet
  const isSheetView = location.pathname === '/sheet' || character.creationComplete;
  const isCreatorView = location.pathname === '/creator' && !character.creationComplete;

  return (
    <div className="min-h-screen bg-bg text-ink">
      <Header />
      
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

        {/* Se estiver na sheet view, mas quisermos mostrar o Outlet (dashboard) abaixo ou em algum lugar, poderíamos. 
            Mas o usuário quer a ficha centralizada, então focamos nela. */}
      </main>
    </div>
  );
};
