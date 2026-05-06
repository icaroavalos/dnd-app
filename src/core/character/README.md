# Character Module - TypeScript

Este modulo contém a lógica de characters e selecao de backgrounds para a versao TypeScript do DND App.

## Background Selector

O seletor de backgrounds e um componente modular e expansivel que substitui o seletor nativo do 5etools.

### Como usar

```typescript
import {
  BackgroundSelector,
  BackgroundRegistry,
  createBackgroundSelector,
  initializeDefaultBackgrounds
} from './core/character';

// 1. Inicializa os backgrounds padao
initializeDefaultBackgrounds();

// 2. Cria um seletor
const selector = createBackgroundSelector({
  availableBackgrounds: [
    { value: 'acolyte', label: 'Acolyte', source: 'XPHB' },
    { value: 'soldier', label: 'Soldier', source: 'XPHB' }
  ],
  locked: false,
  onSelect: (background) => {
    console.log('Background selecionado:', background);
  }
});

// 3. Renderiza no DOM
const container = document.querySelector('#background-container');
selector.render(container);

// 4. Seleciona um background
selector.select('acolyte');

// Adicionar um background customizado
const registry = BackgroundRegistry.getInstance();
registry.register({
  name: 'Warrior',
  source: 'Homebrew',
  description: 'Um guerreiro experiente',
  skillProficiencies: ['Athletics', 'Intimidation']
});
```

## Adicionando novos backgrounds

Para adicionar um novo background ao sistema:

```typescript
import { BackgroundRegistry } from './background-selector';

const registry = BackgroundRegistry.getInstance();

registry.register({
  name: 'Sage',
  source: 'XPHB',
  description: 'Um estudioso dedicado ao conhecimento',
  skillProficiencies: ['Arcana', 'History'],
  languages: ['Dois idiomas'],
  equipment: ['Tinteiro', 'Pena', 'Livro de estudos']
});
```

## Estrutura de pastas

```
src/core/character/
  ├── background-selector.ts    - Componente principal do seletor
  ├── backgrounds.ts            - Backgrounds padroes (Acolyte, Soldier)
  ├── character-abilities.ts    - Calculo de ability scores
  ├── index.ts                  - Exporta modulos publicos
  └── README.md                 - Este arquivo
```

## Backgrounds disponiveis

- **Acolyte**: Lider espiritual em templo, proficiente em Insight e Religion
- **Soldier**: Ex-militar, proficiente em Athletics e Intimidation

## Expandindo o sistema

Para adicionar mais backgrounds:

1. Adicione no array `DEFAULT_BACKGROUNDS` em `backgrounds.ts`
2. Ou registre dinamicamente via `BackgroundRegistry.getInstance().register()`
3. O seletor atualiza automaticamente a lista disponivel
