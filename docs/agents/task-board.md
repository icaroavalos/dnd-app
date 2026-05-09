# Task Board Para Agentes Operarios

Atualizado em 2026-05-08.

## Regras gerais

- Fonte canonica de regras: `data/5etools/5e-2024/`.
- Backend alvo: NestJS + Fastify.
- Uma tarefa por agente.
- Escrever teste primeiro quando tocar comportamento.
- Nao declarar pronto sem rodar os comandos do plano.
- Registrar resultado em `docs/sessions.md`.

## Backend MVP

- [ ] B0. Corrigir typecheck do backend.
- [ ] B1. Tornar `backend/package.json` standalone para NestJS/Fastify/Prisma.
- [ ] B2. Unificar persistencia: remover caminho JSON de producao e deixar Prisma como canonico.
- [ ] B3. Persistir `CharacterRecord` canonico via Prisma.
- [ ] B4. Publicar CRUD canonico em `/characters`.
- [ ] B5. Integrar ledger/read model ao CRUD canonico.
- [ ] B6. Garantir shape de erro e DTOs para os endpoints canonicos.
- [ ] B7. Atualizar docs do backend depois da estabilizacao.

## Frontend/Core

- [ ] F0. Ligar cliente de catalogos ao backend com fallback local.
- [ ] F1. Ligar projection client ao `POST /characters/project` por default.
- [ ] F2. Ligar actions client ao `POST /actions/derive`.
- [ ] F3. Ligar mutations de resources/inventory ao backend.
- [ ] F4. Migrar persistencia de ficha para CRUD backend.
- [ ] F5. Remover duplicacoes locais quando cada slice estiver estavel.

## Features do app

- [ ] U0. Level up mostra novas features e abilities.
- [ ] U1. Aba de magia nao abre descricao automaticamente.
- [ ] U2. Background mostra equipamentos completos.
- [ ] U3. Exclusao de ficha pede confirmacao.
- [ ] U4. Selecao de magia tem card por icone de informacao.
- [ ] U5. Secao de features ganha layout revisado.
- [ ] U6. Barbarian level 19 mostra texto completo.

## Plano de execucao

Cada item acima deve ser executado pelo plano formal em:

- `docs/superpowers/plans/2026-05-08-backend-mvp-system-roadmap.md`
