# src/lib/ - TypeScript Utilities

Módulos TypeScript para lógica de negócio da aplicação D&D 5e.

## Estrutura

```
src/
├── types/           # Definições de tipos
│   └── character.ts # Types para Character, SpellDetail, etc.
└── lib/             # Funções e utilitários
    ├── api-catalog-client.ts        # Cliente API para catálogos do backend
    ├── magic-initiate-validator.ts  # Validação de Magic Initiate
    └── resource-recovery.ts         # Recuperação de recursos (Rage, etc.)
```

## Stack

- **TypeScript** para type safety
- **ES Modules** (sem bundler)
- **Node.js** para build e testes

## Comandos

```bash
npm run build      # Compila TypeScript para dist/
npm run test       # Roda testes
npm run typecheck  # Apenas type check
```

## Magic Initiate

Veja `magic-initiate-validator.ts` para a solução do bug onde a mensagem
"Ainda falta: Magic Initiate (cleric): 2 cantrips..." aparecia mesmo
após o usuário selecionar as magias corretamente.

**Causa raiz:** A validação usava `spellDetails[s.toLowerCase()]?.level`
que falha quando:
- `spellDetails` está vazio
- O formato do nome não bate (case sensitivity)
- A chave de lookup difere do esperado

**Solução:** Usar `classSpells` (a mesma fonte que a UI) ao invés de
`spellDetails`.

## Resource Recovery

Veja `resource-recovery.ts` para o fix do Rage que recuperava todos
os usos ao invés de apenas 1 no Short Rest.

## API Catalog Client

Módulo `api-catalog-client.ts` para consumir endpoints read-only de catálogo
do backend.

### Endpoints disponíveis

- `/rules/backgrounds` - Backgrounds
- `/rules/classes` - Classes
- `/rules/spells` - Spells
- `/rules/class-spells` - Class spells
- `/rules/species` - Species/Linhagens
- `/rules/items` - Itens
- `/rules/features` - Features
- `/rules/feats` - Feats

## API Resource Mutations

Módulo `api-resource-mutations.ts` para mutações de recursos e descansos via backend.

### Endpoints

- `POST /characters/:id/resources/damage` - Aplica dano
- `POST /characters/:id/resources/heal` - Aplica cura
- `POST /characters/:id/resources/short-rest` - Short Rest
- `POST /characters/:id/resources/long-rest` - Long Rest
- `POST /characters/:id/resources/hit-die` - Gasta Hit Die
- `POST /characters/:id/resources/spell-slot` - Gasta slot de magia
- `POST /characters/:id/resources/use-resource` - Gasta recurso (Ki, Rage, etc.)
- `POST /characters/:id/resources/ammo/spend` - Gasta munição
- `POST /characters/:id/resources/ammo/recover` - Recupera munição

### Uso

```typescript
import { shortRest, longRest, useResource } from './api-resource-mutations.js';

// Short Rest
const result = await shortRest(characterId, {
  hitDiceSpent: 1,
  hpRegained: 8,
  description: 'Short rest after combat',
});

// Long Rest
await longRest(characterId, {
  hpRegained: 12,
  description: 'Long rest at inn',
});

// Usar recurso (ex: Rage, Ki)
await useResource(characterId, {
  resourceType: 'ki',
  amount: 2,
  source: 'flurry_of_blows',
  description: 'Flurry of Blows',
});
```

## API Character Project Client

Módulo `api-character-project-client.ts` para projetar personagem (calcular derivados).

### Endpoints

- `POST /characters/project` - Projeta personagem (calcula bônus, perícias, etc.)

### Uso

```typescript
import { projectCharacter, createDebouncedProjector } from './api-character-project-client.js';

// Projeção direta
const projection = await projectCharacter(characterData);
console.log(projection.skillBonuses);
console.log(projection.armorClass);

// Com debounce (para digitação)
const debouncedProject = createDebouncedProjector(300);
debouncedProject(characterData, (result) => {
  console.log('Projected:', result);
});

// Cancelar projeção pendente
debouncedProject.cancel();
```

### Configuração

```typescript
import { getBackgrounds, getClasses, getSpecies } from './api-catalog-client.js';

const backgrounds = await getBackgrounds();
const classes = await getClasses();
const species = await getSpecies();
```

### Configuração

Defina `VITE_API_URL` no `.env` ou use o padrão `http://localhost:3000`.
