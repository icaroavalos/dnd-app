# Contexto do Projeto — D&D Character Builder (2024)

Ultima revisao: 2026-05-16.

## O que e

Aplicacao web para criacao e gestao de fichas de D&D 5e usando as regras do **Player's Handbook 2024 (XPHB)**. Suporta criacao passo-a-passo, level up, combate, descansos, inventario e magias.

## Stack

| Camada | Tecnologia |
|--------|-----------|
| **Frontend** | Vite + React 19 + TypeScript + Zustand + Tailwind CSS 3 |
| **Backend** | NestJS 11 + Fastify 5 + Prisma (SQLite) |
| **Dados canonicos** | `data/5etools/5e-2024/` (lidos pelo backend, nunca pelo frontend) |
| **Estilos** | Tailwind CSS exclusivo — helper `cn()` (clsx + tailwind-merge) em `src/lib/utils.ts` |
| **Icones** | Lucide React (emojis sao proibidos na UI e codigo) |
| **Testes backend** | `node --test` + `tsx` + `supertest` |
| **Testes frontend** | Playwright (E2E) |

## Como rodar

```bash
npm run dev            # Frontend em http://localhost:3000
npm run backend:dev    # Backend em http://localhost:3100
```

O Vite faz proxy de `/api/*` para `localhost:3100`.

---

## Mapa de Arquivos — Frontend (`frontend/src/`)

### Nucleo

| Arquivo | Responsabilidade |
|---------|-----------------|
| `store/useCharacterStore.ts` | Estado global (Zustand) — personagem ativo, mutacoes, persistencia |
| `hooks/useDerivedState.ts` | Calculos derivados (HP, CA, modificadores, saves, skills, spell DC) |
| `types/character.ts` | Tipos TypeScript: `Character`, `Feature`, `Choice`, `BackgroundChoices`, `AbilityScores` |

### Comunicacao com Backend

| Arquivo | Responsabilidade |
|---------|-----------------|
| `api/api-client.ts` | Instancia Axios com base URL e interceptors |
| `api/catalog-api.ts` | GET endpoints de catalogo (`/rules/*`) |
| `api/character-api.ts` | CRUD de personagens (`/characters/*`) + `saveCharacter` (upsert) |
| `api/actions-api.ts` | POST `/actions/derive` — derivacao de acoes de combate |
| `api/action-mutations-api.ts` | POST `/resources/use`, `/resources/recover` |

### Utilitarios

| Arquivo | Responsabilidade |
|---------|-----------------|
| `lib/data-parser.ts` | Parser de dados 5etools: `clean5eText`, `parse5eEntry`, `parseResourceInfo`, `extractSpells` |
| `lib/feature-resources.ts` | Extracao de recursos (usos, recuperacao) de habilidades |
| `lib/utils.ts` | Helper `cn()` para classes Tailwind condicionais |

### Paginas

| Arquivo | Responsabilidade |
|---------|-----------------|
| `pages/CreatorPage.tsx` | Fluxo de criacao de personagem (steps: Linhagem → Classe → Origem → Atributos) |
| `pages/SheetPage.tsx` | Visualizacao da ficha (abas: Resumo, Pericias, Itens, Acoes, Magias, Habilidades) |

### Componentes

| Diretorio | Componentes |
|-----------|-------------|
| `components/builder/` | `SpeciesSelect`, `ClassSelect`, `BackgroundSelect`, `AbilityScores`, `MagicInitiate`, `SpellSelect`, `LevelUpModal` |
| `components/sheet/` | `CharacterSheet`, `SummaryTab`, `SkillsTab`, `InventoryTab`, `AttacksTab`, `SpellsTab`, `SpellCard`, `FeaturesTab` |
| `components/ui/` | `Card`, `Checkbox`, `ChoiceSelector`, `NumberInput`, `RuleText`, `Select` |
| `components/layout/` | `AppLayout`, `Header`, `CharacterMenu` |

---

## Mapa de Arquivos — Backend (`backend/src/`)

### Modulos

| Modulo | Responsabilidade |
|--------|-----------------|
| `modules/rules/` | Catalogo de regras 5etools (classes, species, spells, items, features, feats, backgrounds, class-spells, subraces, actions, conditions) |
| `modules/characters/` | Projecao de ficha derivada (POST `/characters/project`) + persistencia via Prisma |
| `modules/actions/` | Derivacao de acoes de combate (POST `/actions/derive`) |
| `modules/resources/` | Uso e recuperacao de recursos — Ki, Rage, Second Wind, etc. |
| `modules/inventory/` | Gerenciamento de municao (spend/recover ammo) |
| `modules/health/` | Health check |

### Infraestrutura

| Arquivo | Responsabilidade |
|---------|-----------------|
| `common/api-exception.filter.ts` | Filtro global de erros (shape padrao de resposta) |
| `shared/contracts/` | Tipos compartilhados (`CharacterRecord`, `DerivedCharacterSheet`, `DerivedAction`) |
| `config/` | Configuracoes do app |
| `prisma/schema.prisma` | Schema do banco SQLite |

---

## Endpoints da API

### Catalogo (GET — leitura de regras)

| Endpoint | Descricao |
|----------|-----------|
| `GET /rules/classes` | Classes e recursos |
| `GET /rules/species` | Species (racas/linhagens) |
| `GET /rules/backgrounds` | Backgrounds |
| `GET /rules/spells` | Lista de magias |
| `GET /rules/class-spells` | Magias indexadas por classe |
| `GET /rules/items` | Equipamentos e itens |
| `GET /rules/features` | Features de classes e subclasses |
| `GET /rules/feats` | Feats |
| `GET /rules/subraces` | Subraces |
| `GET /rules/actions` | Acoes base (Dash, Dodge, etc.) |
| `GET /rules/conditions` | Condicoes (Poisoned, Stunned, etc.) |
| `GET /rules/level-up-options?className=X&level=N` | Opcoes de level up por classe/nivel |

### Projecao e Acoes (POST)

| Endpoint | Descricao |
|----------|-----------|
| `POST /characters/project` | Projeta ficha derivada (nivel, HP, CA, saves, skills, spellcasting) |
| `POST /actions/derive` | Deriva acoes disponiveis (ataques, magias, recursos) |

### Recursos e Inventario (POST)

| Endpoint | Descricao |
|----------|-----------|
| `POST /resources/use` | Gasta recurso (Ki, Second Wind, etc.) |
| `POST /resources/recover` | Recupera recursos (short/long rest) |
| `POST /inventory/spend-ammo` | Gasta municao |
| `POST /inventory/recover-ammo` | Recupera municao |

### Persistencia (CRUD via frontend — `character-api.ts`)

| Endpoint | Descricao |
|----------|-----------|
| `GET /characters` | Lista personagens (resumo) |
| `GET /characters/:id` | Busca personagem por ID |
| `POST /characters` | Cria novo personagem |
| `PUT /characters/:id` | Atualiza personagem |
| `DELETE /characters/:id` | Exclui personagem |

### Contrato de Erro Padrao

```json
{
  "statusCode": 400,
  "error": { "code": "VALIDATION_ERROR", "message": "..." },
  "path": "/characters/project",
  "requestId": "uuid",
  "timestamp": "ISO-8601"
}
```

---

## Convencoes Obrigatorias

1. **Estilos**: Tailwind CSS exclusivamente. Helper `cn()` de `src/lib/utils.ts`. CSS Modules nao sao utilizados.
2. **Dados**: Somente `data/5etools/5e-2024/` via API backend. Sem fallback local para dados canonicos. localStorage permitido apenas para preferencias UI (tema, ultimo ID).
3. **Sem emojis** na UI ou codigo. Usar icones Lucide.
4. **TypeScript strict**. Sem casts amplos (`as any`).
5. **Controllers finos**; services concentram logica de negocio.
6. **DTOs** ficam em `backend/src/modules/*/dto/`.
7. **Contratos compartilhados** ficam em `backend/src/shared/contracts/`.

---

## Logica de Negocio — D&D 2024

### Sistema de Escolhas Genericas
O sistema analisa o texto bruto das habilidades em busca de padroes como "choose X kinds of Y" e gera a UI dinamicamente. Escolhas armazenadas em `character.classFeatureChoices`, mapeadas pelo ID da habilidade.

### Tratamento de Dados 5etools
`data-parser.ts` resolve artefatos JSON (`{@item...}`, `{@spell...}`) do 5etools:
- `clean5eText`: Remove tags tecnicas.
- `parse5eEntry`: Processa estruturas recursivas (listas, tabelas).
- `parseResourceInfo`: Extrai limites de uso e regras de recuperacao das descricoes.
- `extractSpells`: Identifica magias referenciadas em textos via `{@spell Name}`.

### Atributos e Talentos
- **Cálculo Projetado**: `useDerivedState.ts` (frontend) e `characters.service.ts` (backend) somam bônus de Background e ASIs históricos.
- **Talentos Automatizados**: O sistema detecta bônus fixos e sub-habilidades de talentos (ex: Ator).

### HP, Vitalidade e Descansos
- **Ordem de Dano**: Subtrai de `Temporary HP` antes do HP real (PHB 2024).
- **Death Saves**: Interface automática ao chegar a 0 HP. Cura limpa os testes.
- **Descansos**: `applyShortRest` recupera +1 uso de habilidades incrementais (ex: Rage).

### Inventário e Moedas
- **Moedas**: Objeto `currency` gerencia CP, SP, EP, GP, PP de forma centralizada.
- **Instanciação**: Cada item possui `instanceId` para rastreamento individual.
- **Gestão**: Suporte a adição manual via catálogo e remoção de itens.

### Level Up
- Subclasse no Nivel 3 detectada por nivel + categoria, nao por nome.
- Magias automatizadas por limites de Truques e Magias Preparadas.
- Deteccao de escolhas via texto (ex: "gain proficiency with X skills").

### Persistencia
- `recordJson` no backend armazena estado completo das features (incluindo cargas atuais).
- Campos criticos no `setCharacter`: `bgSpellChoices`, `spellSlots`, `features`, `spells` — todos devem ser mapeados explicitamente.

---

## Documentacao Complementar

- `docs/preferences.md` — Regras detalhadas de estilo de codigo e dados.
- `docs/architecture.md` — Decisoes de arquitetura expandidas.
- `docs/design_system_spells.md` — Spec visual para cartas de magia.
- `docs/archive/sessions.md` — Log historico de sessoes.
- `docs/archive/learnings.md` — Aprendizados e bugs historicos.
