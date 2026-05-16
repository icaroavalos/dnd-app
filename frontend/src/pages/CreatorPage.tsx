import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { SpeciesSelect } from '../components/builder/SpeciesSelect';
import { ClassSelect } from '../components/builder/ClassSelect';
import { AbilityScores } from '../components/builder/AbilityScores';
import { BackgroundSelect } from '../components/builder/BackgroundSelect';
import { SpellSelect } from '../components/builder/SpellSelect';
import { useCharacterStore, CLASS_HIT_DIE } from '../store/useCharacterStore';
import { saveCharacter } from '../api/character-api';
import { cn } from '../lib/utils';
import { deriveResourcesFromFeatures } from '../lib/feature-resources';

export const CreatorPage: React.FC = () => {
  const { character, updateCharacter, setActiveCharacterId } = useCharacterStore();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const navigate = useNavigate();

  const isCaster = ['Wizard', 'Sorcerer', 'Warlock', 'Bard', 'Cleric', 'Druid', 'Paladin', 'Ranger'].includes(character.class);

  const STEPS = [
    { id: 1, label: 'Linhagem' },
    { id: 2, label: 'Classe' },
    ...(isCaster ? [{ id: 3, label: 'Magias' }] : []),
    { id: isCaster ? 4 : 3, label: 'Origem' },
    { id: isCaster ? 5 : 4, label: 'Atributos' }
  ];

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateCharacter({ name: e.target.value });
  };

  const slugify = (str: string) =>
    String(str ?? "").trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  const handleFinalize = async () => {
    if (!character.name) {
      alert('Por favor, dê um nome ao seu personagem.');
      setCurrentStep(1);
      return;
    }

    setIsSaving(true);
    try {
      // Calculate background assignments first for HP calculation
      const backgroundAssignments = character.backgroundChoices?.abilityAssignments || {};
      const conBonus = backgroundAssignments.con || 0;
      const baseCon = character.abilities.con || 10;
      const conMod = Math.floor((baseCon + conBonus - 10) / 2);

      const dieSize = CLASS_HIT_DIE[character.class.toLowerCase()] || 8;
      const initialHp = dieSize + conMod;
      const resources = deriveResourcesFromFeatures(character.features);

      // Mapeia para o formato esperado pelo backend (CharacterRecord)
      const record = {
        name: character.name,
        ruleset: '5e-2024',
        lineageId: slugify(character.race),
        backgroundId: slugify(character.background),
        alignment: character.alignment,
        experience: character.experience,
        classes: [{ classId: slugify(character.class), level: character.level }],
        abilities: character.abilities,
        skillProficiencies: character.skillProficiencies || [],
        savingThrowProficiencies: character.savingThrows || [],
        inventory: (character.inventory || []).map((item: any) => typeof item === 'string' ? { baseItemId: item, quantity: 1, status: 'backpack' } : normalizeInventoryStatus(item)),
        spells: character.spells || [],
        spellChoices: (character.spells || []).map(s => ({ spellId: s.id || s.name, spellcastingAbility: character.bgChoices?.spellcastingAbility })),
        features: character.features,
        attacks: character.attacks,
        resources,
        equippedItems: character.equippedItems,
        classFeatureChoices: character.classFeatureChoices,
        backgroundChoices: {
          backgroundId: slugify(character.background),
          abilityAssignments: backgroundAssignments
        },
        state: {
          hp: initialHp,
          maxHpOverride: initialHp,
          tempHp: 0,
          hitDiceUsed: 0,
          spellSlotsUsed: {},
          activeConditions: []
        }
      };

      const saved = await saveCharacter(record as any);
      updateCharacter({
        creationComplete: true,
        id: saved.id,
        hp: initialHp,
        maxHp: initialHp,
        resources
      });
      setActiveCharacterId(saved.id || null);
      navigate('/sheet');
    } catch (error) {
      console.error('Erro ao salvar personagem:', error);
      alert('Ocorreu um erro ao salvar o personagem. Verifique se o backend está rodando.');
    } finally {
      setIsSaving(false);
    }
  };

  const renderStep = () => {
    // We use actual labels or static IDs mapping to components
    if (currentStep === 1) return (
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
              className="w-full min-h-[42px] text-ink bg-bg border border-[#373737] rounded-lg px-2.5 py-[9px]"
            />
          </div>
        </Card>
        <Card title="Espécie e Linhagem" className="mt-4">
          <SpeciesSelect />
        </Card>
      </>
    );

    if (currentStep === 2) return (
      <Card title="Classe e Habilidades Iniciais">
        <ClassSelect />
      </Card>
    );

    const stepLabel = STEPS.find(s => s.id === currentStep)?.label;

    if (stepLabel === 'Magias') return <SpellSelect />;
    if (stepLabel === 'Origem') return (
      <div className="flex flex-col gap-4">
        <BackgroundSelect />
      </div>
    );
    if (stepLabel === 'Atributos') return <AbilityScores />;

    return null;
  };

  return (
    <div className="">
      <nav className={cn(
        "grid gap-2 mb-[18px]",
        isCaster ? "grid-cols-2 sm:grid-cols-5" : "grid-cols-1 sm:grid-cols-4"
      )}>
        {STEPS.map((step) => (
          <button
            key={step.id}
            type="button"
            className={cn(
              "min-h-[42px] border border-[#343434] rounded-lg bg-[#1c1c1c] text-muted font-bold",
              currentStep === step.id && "text-bg border-gold bg-cream"
            )}
            onClick={() => setCurrentStep(step.id)}
          >
            {step.id}. {step.label}
          </button>
        ))}
      </nav>

      <div className="grid gap-[14px]">
        {renderStep()}
      </div>

      <div className="flex justify-between mt-6">
        <button
          className="secondary-button"
          disabled={currentStep === 1 || isSaving}
          onClick={() => setCurrentStep(prev => prev - 1)}
        >
          Anterior
        </button>
        {currentStep === STEPS.length ? (
          <button
            className="primary-button"
            onClick={handleFinalize}
            disabled={isSaving}
          >
            {isSaving ? 'Salvando...' : 'Finalizar'}
          </button>
        ) : (
          <button
            className="primary-button"
            onClick={() => setCurrentStep(prev => prev + 1)}
          >
            Próximo
          </button>
        )}
      </div>
    </div>
  );
};

function normalizeInventoryStatus(item: any): any {
  if (!item || typeof item !== 'object') return item;
  if (item.status === 'carried') return { ...item, status: 'backpack' };
  return item.status ? item : { ...item, status: 'backpack' };
}
