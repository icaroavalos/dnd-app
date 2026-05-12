# Architecture Memory

Ultima revisao: 2026-05-12.

## Resumo executivo

O projeto concluiu a migração integral do frontend de uma arquitetura Vanilla JS legada para um ecossistema moderno baseado em **Vite + React + TypeScript**. O backend NestJS + Fastify permanece como a fonte de verdade para regras e persistência via Prisma.

**Atualização 2026-05-12:** 
- **Frontend React concluído**: O código legado em Vanilla JS (`app.js`, `index.html`, `src/app/`) foi removido.
- **Vite + TS**: O novo frontend reside em `frontend/` e é iniciado nativamente via root `npm run dev`.
- **Zustand**: Gerenciamento de estado global implementado para o personagem e UI.
- **Axios**: Camada de API tipada e centralizada.

## Decisoes de arquitetura atuais

- **Frontend**: Vite + React + TypeScript + Zustand.
- **Backend**: NestJS + Fastify + Prisma (SQLite).
- **Contratos**: Shared contracts em `backend/src/shared/contracts/`.
- **Estilos**: Migração para **CSS Modules** concluída.
    - Escopo local para componentes utilizando padrão `camelCase`.
    - `index.css` reduzido a variáveis globais, resets e utilitários básicos.
    - Facilita futura adoção de TailwindCSS.
- **Build**: Unificado no root `package.json` usando `--prefix frontend`.
- **Datasets**: A fonte canonica de regras e `data/5etools/5e-2024/`.

## Modulos D&D 2024 implementados com sucesso

Status baseado em migração concluída em 2026-05-12.

### Frontend Moderno

Implementado em `frontend/src/`.

- **UI Components**: `Card`, `Select`, `NumberInput`, `Checkbox` reutilizáveis.
- **Builder**: Seleção de Classe, Espécie, Atributos (Point Buy/Standard Array) e Background (Magic Initiate).
- **Sheet**: Abas de Resumo, Perícias, Inventário, Ações, Magias e Habilidades reativas.
- **State**: Mutadores granulares no Zustand para evitar inconsistências.

### Rules catalog (Backend)

Implementado em `backend/src/modules/rules/`.

- `GET /rules/backgrounds`
- `GET /rules/classes`
- `GET /rules/spells`
- `GET /rules/class-spells`
- `GET /rules/species`
- `GET /rules/items`
- `GET /rules/features`
- `GET /rules/feats`

### Character projection (Backend)

Implementado em `backend/src/modules/characters/characters.service.ts`.

- Nivel total e proficiency bonus.
- Ability scores com bonus de background 2024.
- Ability modifiers, Saving throws, Skills.
- Armor Class e HP maximo.
- Spellcasting ability, spell attack e spell save DC.
- Spell slots maximos.

### Actions & Resources (Backend)

- Ataques derivados de armas e magias.
- Consumo de munição e recursos limitados.
- Recuperação via Short/Long Rest.

## Verificacao de 2026-05-12

Comandos executados:

- `npm run dev` (root): Inicia o frontend Vite na porta 3000.
- `npm run backend:dev` (root): Inicia o backend na porta 3100.
- `npm run typecheck` (frontend): Passa limpo via Vite/TSC.
- `npm run backend:typecheck`: Passa limpo.

## Proximos passos

1. Implementar sistema de "Level Up" reativo no frontend.
2. Adicionar validações de regras complexas (Multiclassing) no backend.
