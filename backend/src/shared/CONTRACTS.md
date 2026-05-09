# Fronteira de Contratos - Backend vs Frontend

## Princípio

Os contratos em `@shared/contracts` são **exclusivamente do lado do backend**. Eles representam:

1. **Entradas (Requests)** - Dados que o frontend envia para o backend
2. **Saídas (Projections/Results)** - Dados calculados pelo backend que o frontend consome
3. **Domínio Puro** - Regras de negócio, sem UI state

## O que NÃO entra nos contratos compartilhados

### View-Models de Frontend (NÃO compartilhar)

Estes tipos são específicos do frontend e NÃO devem vazar para `@shared/contracts`:

```typescript
// ❌ NÃO - ViewModel de UI
interface CharacterViewModel {
  character: CharacterRecord;
  isEditing: boolean;
  selectedTab: 'actions' | 'inventory' | 'spells';
  expandedActionId: string | null;
  isModalOpen: boolean;
}

// ❌ NÃO - Estado de UI
interface UIConfig {
  theme: 'light' | 'dark';
  sidebarCollapsed: boolean;
  quickAccessSlots: string[];
}

// ❌ NÃO - Ações derivadas de UI
interface ActionButton {
  action: DerivedAction;
  isEnabled: boolean;  // calculado na UI
  tooltip: string;     // formatado para UI
  onClick: () => void; // handler de UI
}
```

### O que é certo manter no backend

```typescript
// ✅ SIM - Contrato de entrada
type CharacterRecord = {
  id: string;
  name: string;
  abilities: AbilityScoreMap;
  inventory: CharacterInventoryItem[];
  // ...
};

// ✅ SIM - Projeção de saída (dados calculados)
type DerivedCharacterSheet = {
  armorClass: number;
  abilityModifiers: AbilityScoreMap;
  savingThrows: Record<AbilityKey, number>;
  // ...
};

// ✅ SIM - Ação derivada (dados)
type DerivedAction = {
  id: string;
  name: string;
  hit: string;
  damage: string[];
  disabled?: boolean;  // dado calculado, não estado de UI
  source?: {
    twoHandedBlocked?: boolean;
    loadingBlocked?: boolean;
  };
};
```

## Regra Prática

**Teste do "Backend Isolado":** Se o tipo pode ser usado em um script Node.js puro (sem DOM, sem React/Vue, sem navegador), então é um contrato de backend válido.

### Exemplos

| Tipo | Backend Puro? | Pode ser compartilhado? |
|------|---------------|-------------------------|
| `CharacterRecord` | ✅ Sim | ✅ Sim |
| `DerivedAction` | ✅ Sim | ✅ Sim |
| `DerivedCharacterSheet` | ✅ Sim | ✅ Sim |
| `CharacterViewModel` | ❌ Precisa de React | ❌ Não |
| `ActionListProps` | ❌ Precisa de DOM | ❌ Não |
| `UseCharacterSheetReturn` | ❌ Hook do React | ❌ Não |

## Camadas de Arquitetura

```
┌─────────────────────────────────────────┐
│           Frontend (React)              │
│  - ViewModels                           │
│  - UI State                             │
│  - Hooks (useCharacter, useActions)     │
│  - Componentes                          │
├─────────────────────────────────────────┤
│         Shared Contracts (@shared)      │
│  - CharacterRecord ←─ Input             │
│  - DerivedAction ←─ Output              │
│  - DerivedCharacterSheet ←─ Output      │
├─────────────────────────────────────────┤
│            Backend (NestJS)             │
│  - Controllers                          │
│  - Services                             │
│  - Domain Logic                         │
│  - Rules Engine                         │
└─────────────────────────────────────────┘
```

## Diretrizes para Novos Tipos

Ao adicionar um novo tipo em `@shared/contracts`, pergunte:

1. **Este tipo é serializável em JSON?** (sem funções, sem classes complexas)
2. **Este tipo faz sentido em um teste Node.js puro?**
3. **Este tipo seria útil para um consumidor headless (CLI, API client)?**
4. **Este tipo descreve DADOS ou descreve COMPORTAMENTO DE UI?**

Se qualquer resposta for "não" ou "depende", o tipo provavelmente é um ViewModel de frontend.

## Histórico

- **2026-05**: Estabelecida fronteira inicial. Tipos movidos de `domain/contracts` para `shared/contracts`.
