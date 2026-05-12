import React, { useState } from 'react';
import { Card } from '../components/ui/Card';
import { SpeciesSelect } from '../components/builder/SpeciesSelect';
import { ClassSelect } from '../components/builder/ClassSelect';
import { AbilityScores } from '../components/builder/AbilityScores';
import { BackgroundSelect } from '../components/builder/BackgroundSelect';
import { useCharacterStore } from '../store/useCharacterStore';
import { clsx } from 'clsx';
import styles from './CreatorPage.module.css';

const STEPS = [
  { id: 1, label: 'Linhagem' },
  { id: 2, label: 'Classe' },
  { id: 3, label: 'Origem' },
  { id: 4, label: 'Atributos' }
];

export const CreatorPage: React.FC = () => {
  const { character, updateCharacter } = useCharacterStore();
  const [currentStep, setCurrentStep] = useState(1);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateCharacter({ name: e.target.value });
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <>
            <Card title="Identidade">
              <div className="field">
                <label htmlFor="char-name">Nome da ficha</label>
                <input
                  id="char-name"
                  type="text"
                  value={character.name}
                  onChange={handleNameChange}
                  placeholder="Digite o nome..."
                />
              </div>
            </Card>
            <Card title="Espécie e Linhagem" className="mt-4">
              <SpeciesSelect />
            </Card>
          </>
        );
      case 2:
        return (
          <Card title="Classe e Habilidades Iniciais">
            <ClassSelect />
          </Card>
        );
      case 3:
        return (
          <div className="flex flex-col gap-4">
            <BackgroundSelect />
          </div>
        );
      case 4:
        return <AbilityScores />;
      default:
        return null;
    }
  };

  return (
    <div className={styles.builderContainer}>
      <nav className={styles.steps}>
        {STEPS.map((step) => (
          <button
            key={step.id}
            type="button"
            className={clsx(styles.stepButton, currentStep === step.id && styles.active)}
            onClick={() => setCurrentStep(step.id)}
          >
            {step.id}. {step.label}
          </button>
        ))}
      </nav>

      <div className={styles.builderForm}>
        {renderStep()}
      </div>

      <div className={styles.builderNavFooter}>
        <button 
          className="secondary-button" 
          disabled={currentStep === 1}
          onClick={() => setCurrentStep(prev => prev - 1)}
        >
          Anterior
        </button>
        <button 
          className="primary-button"
          disabled={currentStep === STEPS.length}
          onClick={() => setCurrentStep(prev => prev + 1)}
        >
          Próximo
        </button>
      </div>
    </div>
  );
};
