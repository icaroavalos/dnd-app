import React from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { CharacterSheet } from '../sheet/CharacterSheet';
import styles from './AppLayout.module.css';

export const AppLayout: React.FC = () => {
  return (
    <div className={styles.appShell}>
      <Header />
      
      <main className={styles.workspace}>
        <aside className={styles.builderPanel}>
          <div className="builder-header">
            <h1 className={styles.eyebrow}>Construtor de Personagem</h1>
          </div>
          
          <div className="builder-content">
            <Outlet />
          </div>
        </aside>
        
        <section className={styles.sheetPhone}>
          <div className={styles.sheetView}>
            <CharacterSheet />
          </div>
        </section>
      </main>
    </div>
  );
};
