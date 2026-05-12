import React, { useState } from 'react';
import { useCharacterStore } from '../../store/useCharacterStore';
import styles from './FeaturesTab.module.css';
import { clsx } from 'clsx';

export const FeaturesTab: React.FC = () => {
  const { character } = useCharacterStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const features = character.features || [];

  const grouped = features.reduce((acc, feat) => {
    const kind = feat.kind || 'Outros';
    if (!acc[kind]) acc[kind] = [];
    acc[kind].push(feat);
    return acc;
  }, {} as Record<string, any[]>);

  const kindLabels: Record<string, string> = {
    class: 'Habilidades de Classe',
    species: 'Traços de Espécie',
    subspecies: 'Linhagem / Subespécie',
    feat: 'Talentos',
    background: 'Habilidades de Antecedente',
    Outros: 'Outras Habilidades'
  };

  return (
    <div className={styles.featuresTabContainer}>
      {Object.entries(grouped).map(([kind, items]) => (
        <section key={kind} className={styles.featureSection}>
          <h3>{kindLabels[kind] || kind.toUpperCase()}</h3>
          <div className={styles.featureGroupList}>
            {items.map((feat, idx) => {
              const id = feat.id || `${kind}-${idx}`;
              const isOpen = selectedId === id;
              return (
                <article key={id} className={clsx(styles.featureCard, isOpen && styles.expanded)}>
                  <button 
                    type="button" 
                    className={clsx(styles.featureCardHeader, isOpen && styles.active)}
                    onClick={() => setSelectedId(isOpen ? null : id)}
                  >
                    <div className={styles.featureCardTitle}>
                      <strong>{feat.name}</strong>
                    </div>
                    <span className={styles.chevron}></span>
                  </button>
                  {isOpen && (
                    <div className={styles.featureCardBody}>
                      {feat.resource && (
                        <div className={styles.resourceUse}>
                          <button type="button" className={styles.castButton}>Usar</button>
                          <span>{feat.resource.remaining}/{feat.resource.max} usos - recupera em {feat.resource.recoveryLabel}</span>
                        </div>
                      )}
                      <p>{feat.description || 'Nenhuma descrição disponível.'}</p>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </section>
      ))}

      {features.length === 0 && (
        <div className={styles.emptyState}>Nenhuma habilidade listada para esta ficha.</div>
      )}
    </div>
  );
};
