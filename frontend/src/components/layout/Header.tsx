import React, { useState } from 'react';
import { useCharacterStore } from '../../store/useCharacterStore';
import { CharacterMenu } from './CharacterMenu';
import { Menu } from 'lucide-react';
import { cn } from '../../lib/utils';

export const Header: React.FC = () => {
  const { character, isSaving } = useCharacterStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  return (
    <header className="sticky top-0 z-10 flex items-center justify-between h-[60px] px-4 bg-panel border-b border-line">
      <button 
        className="w-10 h-10 inline-grid place-items-center border-0 rounded-lg bg-transparent text-ink transition-all duration-200 hover:bg-[#252525]" 
        id="characterMenuButton" 
        title="Menu de fichas" 
        aria-label="Menu de fichas"
        onClick={() => setIsMenuOpen(true)}
      >
        <Menu size={24} className="text-[#a9a9a9]" />
      </button>
      <strong id="topbarName" className="truncate flex-1 px-6 text-lg tracking-tight font-black">{character.name || 'Nova Ficha'}</strong>
      <div className="flex items-center gap-2">
        <span id="syncState" className="text-muted text-[0.75rem] font-semibold uppercase tracking-[0.5px]">
          {isSaving ? 'sincronizando...' : 'salvo'}
        </span>
        <div className={cn(
          "w-2 h-2 rounded-full transition-all duration-500 shadow-[0_0_8px]",
          isSaving ? "bg-amber-500 animate-pulse shadow-amber-500/60" : "bg-green-500 shadow-green-500/60"
        )}></div>
      </div>

      <CharacterMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
    </header>
  );
};
