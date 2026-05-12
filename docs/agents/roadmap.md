# Roadmap Operacional

Atualizado em 2026-05-10.

## Fase 0: Higiene e estabilidade

Objetivo: deixar o backend compilando e a documentacao confiavel.

- Corrigir `npm run typecheck` em `backend/`. Concluido em 2026-05-10.
- Confirmar `npm test` em `backend/`. Concluido em 2026-05-10 com 153 testes.
- Manter a documentacao viva em `docs/`. Auditoria final registrada em 2026-05-10.
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

- Catalogos read-only concluidos com backend obrigatorio.
- Projecao de ficha concluida via `POST /characters/project` sem fallback local canonico.
- Actions e recursos concluidos via backend sem mutacao local silenciosa.
- Persistencia concluida via CRUD `/characters`.
- Falha de backend deve aparecer claramente na UI; o frontend nao deve inventar dados canonicos.

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

## Marco de auditoria 2026-05-10

- Escopo de contagem: repositorio sem `node_modules`, `dist`, `backend/dist`, `backend/generated` e `5etools-v2.28.0`.
- LoC antes dos docs finais: 210.789.
- Arquivos grandes restantes sao dados canonicos ou artefatos legados/testes: `data/5etools/*`, `backend/data/characters.json`, `styles.css`, `app.js`, lockfiles e alguns testes.
- Nenhum arquivo de dominio em `src/` ou `backend/src/` passa de 500 linhas; nao ha plano adicional obrigatorio para dominio alem da reducao continua de `app.js`.
- `app.js` permanece acima do alvo ideal de 300 linhas por conter o shell legado; o plano e continuar extraindo renderizacao/eventos para modulos pequenos ja iniciados.
- Smells nao corrigidos nesta auditoria: massa de dados 5etools versionada em JSON grande, `backend/data/characters.json` como residuo de persistencia JSON, `styles.css` ainda monolitico e duplicacoes de fixture/setup em testes.
