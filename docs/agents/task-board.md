# Task Board Para Agentes Operarios

Atualizado em 2026-05-10.

## Regras gerais

- Fonte canonica de regras: `data/5etools/5e-2024/`.
- Backend alvo: NestJS + Fastify.
- Uma tarefa por agente.
- Escrever teste primeiro quando tocar comportamento.
- Nao declarar pronto sem rodar os comandos do plano.
- Registrar resultado em `docs/sessions.md`.
- **Frontend nao tem fallback canonico**: backend e obrigatorio para dados de personagens, resources, inventory e actions.
- **Erro visivel em falha de backend**: UI deve exibir banner de erro e nao mockar dados.

## Backend MVP

- [x] B0. Corrigir typecheck do backend.
- [x] B1. Tornar `backend/package.json` standalone para NestJS/Fastify/Prisma.
- [ ] B2. Unificar persistencia: remover caminho JSON de producao e deixar Prisma como canonico.
- [x] B3. Persistir `CharacterRecord` canonico via Prisma.
- [x] B4. Publicar CRUD canonico em `/characters`.
- [x] B5. Integrar ledger/read model ao CRUD canonico.
- [x] B6. Garantir shape de erro e DTOs para os endpoints canonicos.
- [ ] B7. Atualizar docs do backend depois da estabilizacao.

## Frontend/Core

- [x] F0. Ligar cliente de catalogos ao backend com fallback local.
- [x] F1. Ligar projection client ao `POST /characters/project` por default.
- [x] F2. Ligar actions client ao `POST /actions/derive`.
- [x] F3. Ligar mutations de resources/inventory ao backend.
- [x] F4. Migrar persistencia de ficha para CRUD backend.
- [x] F5. Remover duplicacoes locais quando cada slice estiver estavel.
- [x] F6. Frontend backend-only: sem fallback canonico, erro visivel em falha de backend.

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

## Auditoria final 2026-05-10

- Status Git inicial: limpo (`git status --short` sem saida).
- LoC auditado, ignorando `node_modules`, `dist`, `backend/dist`, `backend/generated` e `5etools-v2.28.0`: 210.789 antes da atualizacao documental.
- `app.js`: 1.923 linhas. Excecao temporaria aceita porque ainda e o shell legado de orquestracao; plano ativo e continuar extraindo fatias para `src/app/*`, `src/core/*` e clientes em `src/lib/*` ate ficar abaixo de 300.
- Arquivos de dominio em `src/` e `backend/src/`: nenhum acima de 500 linhas. Maior arquivo de dominio: `src/core/engine/action-engine.ts` com 424 linhas.
- Duplicacoes obvias >=20 linhas: nenhuma em runtime de dominio; ocorrencias detectadas ficam em setup/fixtures de testes (`tests/*`).
- Verificacao verde: `npm test`, `npm run typecheck`, `npm --prefix backend run test`, `npm --prefix backend run typecheck`.
- Frontend backend-only: erro visivel, sem mock de dados canonicos quando backend indisponivel.
