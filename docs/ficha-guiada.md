# Ficha Guiada - Criador de Personagens

Ultima atualizacao: 2026-05-11

## Problemas Conhecidos e Solucoes

### Event listeners perdidos apos re-renderizacao (2026-05-11, corrigido 2026-05-12)

**Status:** ✅ CORRIGIDO - Todo o formulario usa event delegation. Nenhum listener e perdido.

**Problema:** Event listeners ligados via `querySelectorAll` + `addEventListener` em elementos filhos eram perdidos quando `els.form.innerHTML = html` recriava os elementos.

**Solucao:** Migrar TODO o binding para event delegation no elemento `form` pai, com tres handlers (change, input, click) que roteiam via `el.matches()` / `el.closest()`.

**Licao:** Nunca faca bind de eventos em elementos que serao re-renderizados. Use sempre event delegation no elemento pai. `closest()` e necessario para botoes com filhos aninhados.

---

## Visao Geral

A **ficha guiada** e o fluxo de criacao de personagens D&D 5e (2024) em formato passo-a-passo. O usuario preenche campos em sequencia, com validacao e feedback visual entre cada etapa.

## Estrutura de Steps

```
lineage → background → abilities → choices → leveling
   ↓          ↓           ↓          ↓          ↓
classe   background  abilities   skills    level up
raca     ability inc scores    equipment spells
subraca
alinhamento
```

## Arquivos Principais

| Arquivo | Responsabilidade |
|---------|------------------|
| `src/core/state/creation-flow.ts` | Gerencia navegacao e validacao entre steps |
| `src/core/state/builder-views.ts` | Renderiza formulários de cada etapa |
| `src/app/creation-event-handlers.js` | Bind de eventos do formulário |
| `src/app/app-shell.js` | Renderiza shell (steps, form, tabs) |
| `src/app/builder-renderers.js` | Renderizadores auxiliares |

## Steps Detalhados

### 1. Lineage (Origem)
- **ID:** `lineage`
- **Campos:**
  - `name` - Nome da ficha
  - `class` - Classe (obrigatório)
  - `race` - Raca/Especie (obrigatório)
  - `subrace` - Subraca (se aplicável)
  - `alignment` - Alinhamento
- **Validacao:** Nome, classe e raca sao obrigatorios
- **Acoes:** `loadClassData()`, `loadRaceData()` ao selecionar

### 2. Background (Origem de Personagem)
- **ID:** `background`
- **Campos:**
  - `background` - Background selecionado
  - `bgChoices.abilityIncrement` - Incremento de ability (+2/+1 ou +1/+1/+1)
  - `bgChoices.abilityScores[]` - Abilities selecionadas
  - `bgChoices.skillChoices[]` - Skills do background
  - `bgChoices.equipmentChoice` - Escolha de equipamento
  - `bgChoices.spellcastingAbility` - Ability para Magic Initiate
- **Validacao:** Background selecionado; escolhas de ability completas
- **Especial:** Magic Initiate aparece para backgrounds que concedem

### 3. Abilities (Atributos)
- **ID:** `abilities`
- **Campos:**
  - `abilityMethod` - Metodo: `standard`, `pointBuy`, `manual`
  - `abilities.str`, `abilities.dex`, `abilities.con`, `abilities.int`, `abilities.wis`, `abilities.cha`
  - `savingThrows[]` - Saving throws da classe (fixos)
- **Validacao:** Todos os 6 abilities devem ter valor
- **Ponto Buy:** Valida orcamento de pontos (27 pontos padrao)

### 4. Choices (Escolhas)
- **ID:** `choices`
- **Campos:**
  - `classSkillChoices[]` - Skills da classe (numero fixo por classe)
  - `equipmentChoices{}` - Escolhas de equipamento da classe
  - `attacks[]` - Ataques manuais
- **Validacao:** Skills da classe selecionadas; equipment choices completos

### 5. Leveling (Niveis)
- **ID:** `leveling`
- **Campos:**
  - `spellChoices.selectedCantrips[]` - Cantrips selecionados
  - `spellChoices.selectedSpells[]` - Magias de nivel 1+
  - `classFeatureChoices{}` - Escolhas de features
- **Validacao:** Cantrips e magias dentro do limite da classe

## Fluxo de Navegacao

```javascript
// Em creation-event-handlers.js
function handleMoveClick(button) {
  const moveIndex = button.dataset.move;
  if (moveStep(moveIndex)) {
    persist();
    render();
  } else {
    render(); // Re-renderiza para mostrar erro de validacao
  }
}
```

## Validacao por Step

```javascript
// Em creation-flow.ts
function getMissingChoicesForStep(step, state): string[] {
  if (step === 'lineage') {
    if (!state.character.name) missing.push('nome');
    if (!state.character.class) missing.push('classe');
    if (!state.character.race) missing.push('raca');
  }
  if (step === 'background') {
    if (!state.character.background) missing.push('background');
    // Valida escolhas de ability para guided backgrounds
  }
  if (step === 'abilities') {
    // Valida 6 abilities preenchidas
    // Valida orcamento Point Buy
  }
  if (step === 'choices') {
    // Valida skills da classe
    // Valida equipment choices
  }
  return missing;
}
```

## Renderizacao

Cada step tem uma funcao `render*Form()` em `builder-views.ts`:

```typescript
renderLineageForm()    // Step 1: lineage
renderBackgroundForm() // Step 2: background
renderAbilitiesForm()  // Step 3: abilities
renderChoicesForm()    // Step 4: choices
renderLevelingForm()   // Step 5: leveling
```

O shell insere o HTML no DOM:

```javascript
// Em app-shell.js:renderForm()
function renderForm() {
  if (state.step === 'lineage') html = renderLineageForm();
  else if (state.step === 'background') html = renderBackgroundForm();
  else if (state.step === 'abilities') html = renderAbilitiesForm();
  else if (state.step === 'choices') html = renderChoicesForm();
  else if (state.step === 'leveling') html = renderLevelingForm();
  if (html) els.form.innerHTML = html;
}
```

## Eventos e Handlers

Todos os eventos do formulario usam **event delegation** no elemento `form` pai, em vez de binding direto em filhos. Isso e necessario porque `renderForm()` faz `els.form.innerHTML = html`, que destroi elementos filhos e seus listeners.

Tres handlers cobrem todo o formulario:

```javascript
function bindCreationEvents(form, els) {
  form.addEventListener('change', handleFormChange);
  form.addEventListener('input', handleFormInput);
  form.addEventListener('click', handleFormClick);
}
```

Cada handler roteia via `el.matches()` ou `el.closest()`:

```javascript
function handleFormChange(event) {
  const el = event.target;
  if (el.matches('[data-path]')) handlePathInputChange(el);
  else if (el.matches('[data-bg-select]')) handleBgSelectChange(el);
  else if (el.matches('[data-bg-increment]')) handleBgIncrementChange(el);
  else if (el.matches('[data-bg-ability]')) handleBgAbilityChange(el);
  else if (el.matches('[data-bg-equipment]')) handleBgEquipmentChange(el);
  else if (el.matches('[data-class-feature-choice]')) handleClassFeatureChoiceChange(el);
  else if (el.matches('[data-equipment-choice]')) handleEquipmentChoiceChange(el);
  else if (el.matches('[data-bg-spell]')) handleBgSpellChange(el);
  else if (el.matches('[name="spelling-ability"]')) handleSpellcastingAbilityChange(el);
}
```

```javascript
function handleFormClick(event) {
  const moveButton = event.target.closest('[data-move]');
  if (moveButton) { handleMoveClick(moveButton); return; }
  if (el.matches('[data-ability-adjust]')) handleAbilityAdjustClick(el);
  else if (el.matches('[data-hp-preset]')) handleHpPresetClick(el);
  // ...
}
```

| Evento | Seletor | Handler | Arquivo |
|--------|---------|---------|---------|
| change | `[data-path]` | `handlePathInputChange()` | creation-event-handlers.js |
| change | `[data-bg-select]` | `handleBgSelectChange()` | creation-event-handlers.js |
| change | `[data-bg-increment]` | `handleBgIncrementChange()` | creation-event-handlers.js |
| change | `[data-bg-ability]` | `handleBgAbilityChange()` | creation-event-handlers.js |
| change | `[data-bg-equipment]` | `handleBgEquipmentChange()` | creation-event-handlers.js |
| change | `[data-class-feature-choice]` | `handleClassFeatureChoiceChange()` | creation-event-handlers.js |
| change | `[data-equipment-choice]` | `handleEquipmentChoiceChange()` | creation-event-handlers.js |
| change | `[data-bg-spell]` | `handleBgSpellChange()` | creation-event-handlers.js |
| change | `[name="spellcasting-ability"]` | `handleSpellcastingAbilityChange()` | creation-event-handlers.js |
| change | `[data-asi-mode]` | `handleAsiModeChange()` | creation-event-handlers.js |
| change | `[data-list]` | `handleListChange()` | creation-event-handlers.js |
| input | `[data-path]` | `handlePathInputChange()` | creation-event-handlers.js |
| input | `[data-level-hp-gain]` | `handleLevelUpHpGainInput()` | creation-event-handlers.js |
| click | `[data-move]` (closest) | `handleMoveClick()` | creation-event-handlers.js |
| click | `[data-ability-adjust]` | `handleAbilityAdjustClick()` | creation-event-handlers.js |
| click | `[data-hp-preset]` | `handleHpPresetClick()` | creation-event-handlers.js |
| click | `[data-remove-attack]` | `handleRemoveAttackClick()` | creation-event-handlers.js |
| click | `#addAttackButton` | `handleAddAttackClick()` | creation-event-handlers.js |
| click | `#suggestAttacksButton` | `handleSuggestAttacksClick()` | creation-event-handlers.js |

### Por que event delegation?

```javascript
// ERRADO: binding direto (perde-se quando form e re-renderizado)
form.querySelectorAll('[data-move]').forEach((button) => {
  button.addEventListener('click', handleMoveClick.bind(null, button));
});

// CORRETO: event delegation no form pai (sobrevive a re-renderizacoes)
form.addEventListener('click', (event) => {
  const moveButton = event.target.closest('[data-move]');
  if (moveButton) handleMoveClick(moveButton);
});
```

- `els.form.innerHTML = html` destroi TODOS os elementos filhos e seus listeners
- O elemento `form` nao e recriado — event delegation nele preserva todos os eventos
- Use `el.closest()` para elementos que podem ter filhos aninhados (botoes com `<span>`)
- Use `el.matches()` para elementos folha (inputs, selects, checkboxes) |

## Estado (State)

```typescript
interface CreationFlowState {
  character: {
    name: string;
    class: string;
    race: string;
    subrace?: string;
    background: string;
    abilityMethod: 'standard' | 'pointBuy' | 'manual';
    abilities: { str: number; dex: number; con: number; int: number; wis: number; cha: number };
    classSkillChoices: string[];
    equipmentChoices: Record<string, string>;
    bgChoices: BackgroundChoiceState;
    bgSpellChoices: Record<string, string[]>;
    creationComplete: boolean;
  };
  levelUpMode: boolean;
  creationChoicesLocked: boolean;
  pointBuyBudget: number;
  pointBuySpent: number;
  subraceRequired: boolean;
  backgroundStepMissing: string[];
  classSkillSelectedCount: number;
  classSkillRequiredCount: number;
  activeChoiceRules: ActiveChoiceRuleStatus[];
  backgroundSpellSelections: BackgroundSpellSelectionStatus[];
  equipmentChoiceNames: string[];
  missingLevelUpChoices: string[];
  spellChoiceStatus: SpellChoiceStatus | null;
}
```

## Problemas Conhecidos

1. **Magic Initiate checkboxes disabled** - Estado de `creationChoicesLocked` pode estar travando a selecao de magias de background
2. **Ability points point-buy** - Validacao de orcamento pode nao estar funcionando corretamente

## Debug

```javascript
// No console do browser
getState().step // Step atual
getState().character // Estado do personagem
getState().character.bgChoices // Escolhas de background
```

## Fluxo Completo

```
1. Usuario clica "Nova Ficha"
   ↓
2. `state.builderVisible = true`
   `state.step = 'lineage'`
   `state.character = {}`
   ↓
3. `render()` → `renderForm()` → `renderLineageForm()`
   ↓
4. Usuario preenche nome, classe, raca
   ↓
5. Clica "Continuar" → `handleMoveClick()` → `moveStep()`
   ↓
6. Valida lineage → OK → `state.step = 'background'`
   ↓
7. `renderForm()` → `renderBackgroundForm()`
   ↓
8. ... (repete ate 'leveling')
   ↓
9. Step 'leveling' → `state.creationComplete = true`
   ↓
10. `state.builderVisible = false`
    `state.sheetVisible = true`
    ↓
11. `renderSheet()` → Ficha completa
```
