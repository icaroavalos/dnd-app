# Documentacao do Projeto

Este diretorio concentra a documentacao operacional do projeto D&D Character Builder.

## Ambiente de desenvolvimento

- Frontend: `npm run dev` → `http://localhost:3000`
- Backend: `npm run backend:dev` → `http://localhost:3100`
- Proxy Vite: `/api/*` → `http://localhost:3100/*`
- CORS: habilitado para `localhost:3000`, `localhost:4173`, `localhost:5173`

## Fonte de verdade para agentes

Para comecar a trabalhar no projeto, leia nesta ordem:

1. `AGENT_CONTEXT.md` — Documento unico de onboarding (stack, mapa de arquivos, convencoes, endpoints).
2. `preferences.md` — Regras de estilo de codigo, dados e manutencao.
3. `architecture.md` — Decisoes de arquitetura e logica de negocio (D&D 2024).

## Documentos complementares

- `design_system_spells.md` — Spec visual para cartas de magia.
- `archive/sessions.md` — Log historico de sessoes de desenvolvimento.
- `archive/learnings.md` — Aprendizados e bugs historicos.

## Documentos externos

- `superpowers/plans/` — Planos formais de implementacao.
- `superpowers/specs/` — Specs tecnicas usadas por agentes anteriores.
