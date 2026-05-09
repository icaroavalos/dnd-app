# Roadmap Operacional

Atualizado em 2026-05-08.

## Fase 0: Higiene e estabilidade

Objetivo: deixar o backend compilando e a documentacao confiavel.

- Corrigir `npm run typecheck` em `backend/`.
- Confirmar `npm test` em `backend/`.
- Manter a documentacao viva em `docs/`.
- Manter artefatos locais fora do Git.

## Fase 1: MVP backend NestJS + Fastify

Objetivo: backend ser a fonte de verdade minima para ficha D&D 2024.

- Rules catalog via `GET /rules/*`.
- Projecao de personagem via `POST /characters/project`.
- Derivacao de acoes via `POST /actions/derive`.
- Resources via `POST /resources/use` e `POST /resources/recover`.
- Inventory ammo via `POST /inventory/spend-ammo` e `POST /inventory/recover-ammo`.
- CRUD canonico de personagem via Prisma.
- Persistencia canonica de `CharacterRecord`.
- Ledger de recursos integrado ao read model.

## Fase 2: Migracao gradual do frontend

Objetivo: frontend consumir backend sem reescrita grande.

- Catalogos read-only primeiro.
- Projecao de ficha depois.
- Actions e recursos em seguida.
- Persistencia por ultimo.
- Fallback local so enquanto a API estiver estabilizando.

## Fase 3: Completar fluxos do app

Objetivo: fechar criacao/level-up/ficha jogavel.

- Level up mostrando novas features e abilities.
- Aba de magia sem abrir descricao automaticamente.
- Equipamentos de background completos.
- Confirmacao de exclusao de ficha.
- Cards de spell na selecao.
- Design melhor de features.
- Corrigir Barbarian level 19.

## Plano detalhado

Use o plano formal:

- `docs/superpowers/plans/2026-05-08-backend-mvp-system-roadmap.md`
