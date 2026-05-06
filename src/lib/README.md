# src/lib/ - TypeScript Utilities

Módulos TypeScript para lógica de negócio da aplicação D&D 5e.

## Estrutura

```
src/
├── types/           # Definições de tipos
│   └── character.ts # Types para Character, SpellDetail, etc.
└── lib/             # Funções e utilitários
    ├── background-spell-fix.ts      # Validação robusta de Magic Initiate
    ├── background-spell-validation.ts # Funções de validação de spells
    ├── magic-initiate-debug.ts      # Debug utilities
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

## Magic Initiate Fix

Veja `background-spell-fix.ts` para a solução do bug onde a mensagem
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
