# Migration Review - Frontend/Backend Duplicação

## Visão Geral

Este documento identifica lógica duplicada entre frontend local e backend, e define o plano para remover duplicação quando slices backend estiverem estáveis.

> Atualizacao de 2026-05-08: esta revisao historica marcou alguns slices como "estaveis", mas a auditoria atual encontrou `npm run typecheck` falhando no backend. Enquanto typecheck estiver vermelho, leia "estavel" abaixo como "runtime coberto por testes, ainda pendente de estabilizacao TypeScript".

## Status dos Slices

### ✅ Estáveis (Backend como fonte de verdade)

| Funcionalidade | Endpoint Backend | Status | Ação |
|----------------|------------------|--------|------|
| Projeção de Personagem | `POST /characters/project` | ✅ Estável | Frontend deve usar backend |
| Catálogo (backgrounds, classes, etc.) | `GET /rules/*` | ✅ Estável | Frontend deve usar backend |
| Resource Ledger (HP, descansos) | `POST /characters/:id/resources/*` | ✅ Estável | Frontend deve usar backend |
| Resource Projection | `GET /characters/:id/resources/projection` | ✅ Estável | Frontend deve usar backend |
| Character Persistence (CRUD) | `POST/GET/PUT/DELETE /characters-storage` | ✅ Estável | Frontend deve usar backend |

### ⚠️ Parciais (alguma duplicação)

| Funcionalidade | Backend | Frontend | Ação |
|----------------|---------|----------|------|
| Cálculo de proficiência | `characters.service.ts` | `character-engine.ts` | Remover frontend |
| Modificador de ability | `characters.service.ts` | `character-engine.ts` | Remover frontend |
| HP máximo | `characters.service.ts` | `character-engine.ts` | Remover frontend |
| Skill bonuses | `characters.service.ts` | `character-projection.ts` | Remover frontend |
| Saving throws | `characters.service.ts` | `character-engine.ts` | Remover frontend |

### ❌ Apenas Frontend (sem backend ainda)

| Funcionalidade | Backend | Frontend | Ação |
|----------------|---------|----------|------|
| ASI choices | - | `ability-bonuses.ts` | Implementar backend |
| Feature choices | - | `character-engine.ts` | Implementar backend |
| Spell selection | - | `spell-engine.ts` | Implementar backend |

## Arquivos do Frontend para Revisar

### 1. `src/core/character/character-engine.ts`

**Funções duplicadas no backend:**

```typescript
// REMOVER quando backend estiver estável
export function deriveProficiencyBonus(level: number): number {
  return Math.ceil(level / 4) + 1;
}

export function deriveAbilityModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}

export function deriveMaxHp(level: number, hitDie: number, constitutionModifier: number): number {
  // Duplicado no backend
}
```

**Substituir por:**
```typescript
import { projectCharacter } from '../lib/api-character-project-client.js';

const projected = await projectCharacter(character);
const proficiencyBonus = projected.proficiencyBonus;
```

### 2. `src/core/character/character-projection.ts`

**Estado atual:** Já tem fallback para backend via `enableBackendProjection()`.

**Ação:** Quando todos os usuários migrarem, remover fallback local.

### 3. `src/core/character/ability-bonuses.ts`

**Status:** Lógica de ASI/feat choices - sem duplicação no backend ainda.

**Ação:** Manter no frontend até implementação backend.

### 4. `src/lib/resource-recovery.ts`

**Status:** Lógica de parsing de features - SEM DUPLICAÇÃO no backend.

**Ação:** Manter no frontend. O backend não faz parsing de texto de features -
ele apenas registra eventos de recuperação. O frontend usa `parseRecovery()`
para determinar quanto recuperar, então envia valores calculados para o backend.

**Fluxo correto:**
```typescript
// Frontend: parse do texto da feature
const recovery = parseRecovery(featureText);
const hitDiceSpent = applyShortRestRecovery(currentHitDice, recovery.short);

// Backend: apenas registra o evento
await shortRestBackend(characterId, hitDiceSpent, hpRegained);
```

## Plano de Migração

### Fase 1: Manter ambos (atual)

- Frontend usa backend quando disponível
- Fallback para lógica local
- Feature flags: `enableBackendProjection()`, `enableBackendMutations()`

### Fase 2: Backend como padrão

- Inverter padrão: backend ligado por default
- Manter fallback local apenas para debugging
- Coletar métricas de uso do backend

### Fase 3: Remover fallback local

- Remover `character-engine.ts` (funções de cálculo)
- Remover `resource-recovery.ts` (substituir por adapter)
- Manter apenas types e interfaces

### Fase 4: Limpeza final

- Remover feature flags
- Documentar APIs backend como obrigatórias
- Atualizar README de migração

## Checklist por Slice

### ✅ Character Projection

- [x] Backend endpoint: `POST /characters/project`
- [x] Frontend client: `api-character-project-client.ts`
- [x] Fallback local implementado
- [ ] Backend como default
- [ ] Remover fallback local
- [ ] Remover `character-engine.ts`

### ✅ Resource Ledger

- [x] Backend endpoints: `POST /characters/:id/resources/*`
- [x] Frontend client: `api-resource-mutations.ts`
- [x] Adapter implementado
- [ ] Backend como default
- [ ] Remover fallback local
- [ ] ~~Remover `resource-recovery.ts`~~ (não é duplicado, manter)

### ✅ Character Storage

- [x] Backend CRUD: `/characters-storage`
- [x] Frontend client: `api-catalog-client.ts`
- [ ] Migrar persistência local
- [ ] Remover JSON file persistence

## Como Contribuir

1. **Identifique duplicação**: Se uma função frontend tem equivalente no backend, marque com `@deprecated`
2. **Adicione wrapper**: Crie função no adapter que chama backend
3. **Mantenha fallback**: Até o slice ser declarado estável
4. **Documente**: Atualize este arquivo quando um slice estabilizar

## Critérios de Estabilidade

Um slice backend é considerado **estável** quando:

- [ ] Tests passando (>95%)
- [ ] 2+ semanas sem bugs críticos
- [ ] Documentação completa
- [ ] Client frontend implementado
- [ ] Fallback local funcionando
- [ ] Métricas de uso coletadas

## Histórico

- **2026-05-08**: Criação do documento
- **2026-05-08**: Slices de Projection e Resource Ledger declarados estáveis
- **2026-05-08**: Revisão completa da duplicação frontend/backend
  - Adicionado `@deprecated` em `character-engine.ts`: deriveProficiencyBonus, deriveAbilityModifier, deriveAbilityScores, deriveSpellcastingMetrics, deriveMaxHp, deriveSavingThrowBonus
  - Esclarecido que `resource-recovery.ts` NÃO é duplicado (parsing de features é só frontend)
  - Documentado backend como fonte de verdade para projection, catalog e resource mutations

## Status Atual

**Funções do frontend marcadas como @deprecated:**
- `deriveProficiencyBonus()` → usar `projectCharacter().proficiencyBonus`
- `deriveAbilityModifier()` → usar `projectCharacter().abilityModifiers`
- `deriveAbilityScores()` → usar `projectCharacter().abilityScores`
- `deriveSpellcastingMetrics()` → usar `projectCharacter().spellcasting`
- `deriveMaxHp()` → usar `projectCharacter().maxHp`
- `deriveSavingThrowBonus()` → usar `projectCharacter().savingThrows`

**Não são duplicados (manter no frontend):**
- `resource-recovery.ts` (parseRecovery, applyShortRestRecovery) - parsing de features
- `ability-bonuses.ts` - ASI/feat choices
- `spell-engine.ts` - spell selection logic
