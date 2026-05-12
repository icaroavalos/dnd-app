import React from 'react';
import { useCharacterStore } from '../../store/useCharacterStore';
import styles from './Header.module.css';

export const Header: React.FC = () => {
  const { character } = useCharacterStore();
  
  return (
    <header className={styles.topbar}>
      <button 
        className={styles.iconButton} 
        id="characterMenuButton" 
        title="Menu de fichas" 
        aria-label="Menu de fichas"
      >
        <span className={styles.hamburgerIcon}></span>
      </button>
      <strong id="topbarName">{character.name || 'Nova Ficha'}</strong>
      <span id="syncState" className={styles.syncState}>online</span>
    </header>
  );
};
