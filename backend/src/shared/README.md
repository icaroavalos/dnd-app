# Shared Module

Módulos compartilháveis do backend que podem ser usados por outros projetos.

## Estrutura

- `contracts/` - Tipos e interfaces estáveis (CharacterRecord, DerivedAction, etc.)
- `index.ts` - Ponto de entrada principal
- `CONTRACTS.md` - Fronteira backend/frontend (o que pode/não pode vazar)

## Uso

```typescript
import type { CharacterRecord, DerivedAction } from '@shared/contracts';
```

## Critérios para compartilhamento

1. **Estabilidade**: API estável, sem breaking changes frequentes
2. **Neutralidade**: Sem dependências de framework (NestJS, Fastify)
3. **Serialização**: Tipos JSON-serializables
4. **Backend Pureza**: Sem conceitos de UI (React hooks, DOM, estado visual)

## Fronteira Backend/Frontend

Veja [CONTRACTS.md](./CONTRACTS.md) para diretrizes sobre o que pode ser compartilhado.

Resumo:
- ✅ Sim: Tipos que descrevem dados de domínio
- ❌ Não: ViewModels, estado de UI, handlers de eventos

## Histórico

- **v1.0** (2026-05): Extração inicial dos contratos do domínio
- **v1.1** (2026-05): Adicionada fronteira explícita backend/frontend
