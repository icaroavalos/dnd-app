import React from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { CharacterSheet } from '../sheet/CharacterSheet';
import { cn } from '@/lib/utils';

export const AppLayout: React.FC = () => {
  return (
    <div className="min-h-screen">
      <Header />
      
      <main className="w-full max-w-[1260px] mx-auto p-6 grid grid-cols-[minmax(360px,1fr)_390px] gap-7 items-start">
        <aside className="min-w-0 bg-[#111111]/90 border border-[#262626] rounded-lg p-[18px] shadow-[0_18px_70px_rgba(0,0,0,0.34)]">
          <div className="builder-header">
            <h1 className="text-mint text-[0.74rem] tracking-normal uppercase mb-[3px]">Construtor de Personagem</h1>
          </div>
          
          <div className="builder-content">
            <Outlet />
          </div>
        </aside>
        
        <section className="w-full max-w-[390px] min-h-[760px] p-2.5 bg-black border border-[#1d1d1d] rounded-lg shadow-[0_26px_80px_rgba(0,0,0,0.42)]">
          <div className="grid gap-2.5">
            <CharacterSheet />
          </div>
        </section>
      </main>
    </div>
  );
};
