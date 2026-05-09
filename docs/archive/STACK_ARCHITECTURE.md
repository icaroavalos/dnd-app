# Arquitetura e Stacks Utilizadas

> Nota de 2026-05-08: este arquivo e um snapshot historico da fase inicial. A memoria atual da arquitetura fica em `docs/Architecture_memory.md`. O backend escolhido hoje e NestJS + Fastify, nao FastAPI/Go.

## Visão Geral do Projeto

**Projeto:** Ficha de Personagem D&D 5e  
**Objetivo:** Character builder + character sheet interativa com dados do 5etools  
**Plataformas:** Navegador (principal) + Mobile (futuro)

---

## Stack Atual (Refatoração)

### 1. **Frontend**

| Camada | Tecnologia | Versão | Por quê? |
|--------|-----------|--------|----------|
| **Linguagem** | TypeScript | 5.0+ | Type safety, detecta bugs em compile-time |
| **Runtime** | ES Modules | Native | Sem build step complexo |
| **HTML** | Vanilla | HTML5 | Simples, funciona, sem complexidade |
| **CSS** | Custom CSS | CSS3 | controle total, sem overhead |
| **Estado** | Vanilla JS | N/A | State management simplificado |

### 2. **Build & Tooling**

| Ferramenta | Uso | Config |
|------------|-----|--------|
| `tsc` | Compilar TypeScript | `tsconfig.json` |
| `npm scripts` | Rodar testes/build | `package.json` |
| `Node.js` | Runtime dos testes | v24+ |

### 3. **Estrutura de Código**

```
dnd-app/
├── src/                    # Código fonte TypeScript
│   ├── types/             # Definições de tipos (.ts)
│   │   └── recovery.ts    # Tipos de Recovery
│   └── lib/               # Lógica de negócio
│       └── resource-recovery.ts
├── tests/                  # Testes
│   └── test-recovery.js   # Testes automatizados
├── dist/                   # Output compilado (auto-gerado)
├── data/                   # Dados do 5etools (JSON)
└── docs/                   # Documentação
```

---

## Por Que Esta Stack?

### 1. TypeScript Puro (Sem Framework)

```typescript
// Em vez de JavaScript solto:
function parseRecovery(body) {
  const recovery = {};
  recovery.short = 1;  // Bug: number vs string
}

// TypeScript previne o erro:
type RecoveryValue = 'all' | '1' | number;
interface RecoveryResult {
  short?: RecoveryValue;
  long?: RecoveryValue;
}
```

**Vantagens:**
- ✅ Type safety sem complexidade
- ✅ IntelliSense melhora productivity
- ✅ Refactoring seguro
- ✅ Bug do Rage pego em compile-time

### 2. ES Modules (Sem Bundler)

```javascript
// Importação simples e moderna
import { parseRecovery } from './lib/resource-recovery.js';

// Sem webpack, sem vite, sem complexidade
```

**Vantagens:**
- ✅ Carregamento nativo no browser
- ✅ Tree-shaking natural
- ✅ Debugging mais fácil (source maps diretos)

### 3. Testes em JavaScript Puro

```javascript
// tests/test-recovery.js
import { parseRecovery } from '../dist/src/lib/resource-recovery.js';

// Sem Jest, sem Vitest, sem overhead
import { test, assert } from 'node:assert';
```

**Vantagens:**
- ✅ Zero configuração extra
- ✅ Roda em qualquer lugar com Node
- ✅ Fácil de entender e manter

---

## Arquitetura Proposta (Fase 2)

Se o projeto evoluir, esta é a arquitetura sugerida:

### Frontend (Web + Mobile)

```
┌─────────────────────────────────────────────┐
│  SvelteKit (ou React) + TypeScript          │
│  - UI Components                            │
│  - State Management (Svelte Stores/Redux)   │
│  - Offline First (IndexedDB)                │
└─────────────────────────────────────────────┘
```

| Tecnologia | Por quê? |
|-----------|----------|
| **SvelteKit** | Menor bundle, performance, DX excelente |
| **TypeScript** | Type safety em toda UI |
| **IndexedDB** | Dados offline robustos |

### Backend (Opcional)

```
┌─────────────────────────────────────────────┐
│  FastAPI (Python) ou Go + Gin               │
│  - Validação de dados 5etools               │
│  - API REST para sync                       │
│  - Export PDF                               │
└─────────────────────────────────────────────┘
```

| Tecnologia | Por quê? |
|-----------|----------|
| **FastAPI** | Rápido de prototipar, Pydantic valida schemas |
| **Go** | Performance, binário único, concurrency |

### Banco de Dados

```
┌─────────────────────────────────────────────┐
│  SQLite (local) / Supabase (cloud)          │
│  - Personagens                              │
│  - Configurações                            │
│  - Histórico de Sessões                     │
└─────────────────────────────────────────────┘
```

| Tecnologia | Por quê? |
|-----------|----------|
| **SQLite** | Local, zero config, file-based |
| **Supabase** | PostgreSQL + Auth + Sync pronto |

---

## Matriz de Decisão

### Stack Atual vs. Futura

| Critério | Atual (TS Vanilla) | Futuro (SvelteKit + FastAPI) |
|----------|-------------------|-----------------------------|
| **Complexidade** | Baixa | Média |
| **Setup Time** | 10 min | 1-2 dias |
| **Mobile Ready** | PWA limitado | Capacitor/Nativo |
| **Sync Entre Dispositivos** | ❌ | ✅ |
| **Offline First** | localStorage | IndexedDB + Sync |
| **Type Safety** | ✅ | ✅ |
| **Deploy** | Static files | Backend + DB |

---

## Comandos Úteis

```bash
# Desenvolvimento
npm run dev           # Rodar servidor local
npm run typecheck     # Validar TypeScript
npm run test          # Rodar testes

# Build e Deploy
npm run build         # Compilar TypeScript
npm run test:watch    # Testes em watch mode
```

---

## Dependências

### Produção
```json
{
  "typescript": "^5.0.0"
}
```

### Desenvolvimento
```json
{
  "bun-types": "^1.3.13"  // Opcional, pra types do Bun
}
```

---

## Roadmap de Evolução

### Fase 1 (✅ Concluída)
- [x] TypeScript base configurado
- [x] Types para Recovery
- [x] Testes automatizados
- [x] Bug do Rage corrigido

### Fase 2 (Sugerida)
- [ ] Migrar types de `character`
- [ ] Migrar `action-engine`
- [ ] Adicionar Zod para validação runtime
- [ ] Adicionar TypeScript ESLint

### Fase 3 (Opcional)
- [ ] Migrar UI para SvelteKit
- [ ] Adicionar backend FastAPI (se precisar de sync)
- [ ] Capacitor para mobile
- [ ] PWA com offline robusto

---

## Quando Mudar de Stack?

| Situação | Mudar Para | Gatilho |
|----------|-----------|---------|
| Precisa de UI reativa complexa | React/Vue/Svelte | UI travando |
| Precisa de sync multi-device | Backend + DB | Usuários pedindo |
| App mobile nativo | Capacitor/React Native | Demanda mobile |
| Performance de build lenta | Vite/Turbopack | Build > 5s |

---

## Referências

- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [SvelteKit Docs](https://kit.svelte.dev/docs)
- [FastAPI Docs](https://fastapi.tiangolo.com/)
- [Supabase Docs](https://supabase.com/docs)

---

## Conclusão

**Stack Atual:** TypeScript Vanilla + ES Modules  
**Foco:** Type safety, tests, simplicidade  
**Próximo Passo:** Migrar mais código para TS conforme necessidade

> "Escolhemos esta stack porque ela resolve nosso problema **hoje** sem criar dívida técnica **amanhã**."
