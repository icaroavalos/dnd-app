# Architecture Memory

Ultima revisao: 2026-05-12.

## Resumo executivo

O projeto esta no meio da migracao de um app estatico de ficha D&D 5e 2024 para um backend NestJS + Fastify que vira a fonte de verdade de regras, projecoes e mutacoes. O frontend ainda existe como shell local com bastante logica TypeScript, mas o backend ja implementa varios slices funcionais.

**Atualizacao 2026-05-10:** Frontend agora e backend-only para dados canonicos. Nao ha mais fallback local para personagens, recursos, inventario ou actions. O backend e obrigatorio para operacao.

**Atualizacao 2026-05-11:** Ports de desenvolvimento:
- Frontend: `npm run dev` sobe em `http://localhost:3000`
- Backend: `npm run backend:dev` sobe em `http://localhost:3100`
- Vite disponivel como dev dependency, mas `serve` e usado para production build

**Status atual 2026-05-12:** Event delegation implementado para TODOS os eventos do formulario de criacao (change, input, click). `creation-event-handlers.js` usa tres handlers com roteamento via `el.matches()`/`el.closest()` em vez de `querySelectorAll` + `addEventListener`. Selecao de classe agora reflete features corretamente. Debug hook `window.__dndState` removido de `app.js`. Backend typecheck e testes passando. Persistencia unificada em Prisma (caminho JSON removido).

## Decisoes de arquitetura atuais

- A fonte canonica de regras e `data/5etools/5e-2024/`.
- O backend nao deve ler datasets antigos, backups, Open5e, dnd5eapi ou arquivos paralelos.
- O backend e NestJS + Fastify, isolado em `backend/`.
- Os contratos canonicos atuais estao em `backend/src/shared/contracts/` e sao importados por `@shared/contracts`.
- `backend/src/domain/contracts/` nao e mais a fonte de verdade; referencias a esse caminho sao legado.
- DTOs ficam dentro de `backend/src/modules/*/dto/` quando o request/response nao e trivial.
- O banco guarda estado de usuario/personagem. Dados de regra continuam fora do banco.
- O backend atual usa SQLite via Prisma para desenvolvimento, apesar de roadmaps antigos citarem PostgreSQL.
- **Frontend nao tem fallback canonico**: dados de personagens, recursos, inventario e actions exigem backend. localStorage e usado apenas para preferencias de UI (tema, layout) e ID do ultimo personagem (sessao).
- **Erro visivel em falha de backend**: a UI exibe banner "Backend indisponivel" e o formulario permanece vazio (sem species/classes/backgrounds mockados).

## Modulos D&D 2024 implementados com sucesso

Status baseado em leitura de codigo e verificacao em 2026-05-08.

### Rules catalog

Implementado em `backend/src/modules/rules/`.

- `GET /rules/backgrounds`
- `GET /rules/classes`
- `GET /rules/spells`
- `GET /rules/class-spells`
- `GET /rules/species`
- `GET /rules/items`
- `GET /rules/features`
- `GET /rules/feats`

Le apenas o dataset compacto local e combina `class-features.json` + `subclass-features.json` para `features`.

### Character projection

Implementado em `backend/src/modules/characters/characters.service.ts`.

- Nivel total e proficiency bonus.
- Ability scores com bonus de background 2024.
- Ability modifiers.
- Saving throws.
- Skills.
- Armor Class por armadura leve, media, pesada, escudo e sem armadura.
- HP maximo basico.
- HP atual, temp HP e hit dice usados.
- Spellcasting ability, spell attack e spell save DC.
- Spell slots maximos por tabela da classe principal.
- Recursos atuais no shape de `CharacterRecord`.

Limite conhecido: multiclass spell slot progression ainda nao esta implementado.

### Actions

Implementado em `backend/src/modules/actions/`.

- Acoes basicas: Attack, Dash, Dodge, Interact, Opportunity Attack.
- Two-Weapon Fighting contextual.
- Ataques explicitos de `character.attacks`.
- Ataques derivados de armas equipadas no inventario.
- Finesse escolhe o melhor modificador entre STR e DEX.
- Versatile usa dado maior quando a mao principal esta livre.
- Ammunition mostra contagem, soma pilhas equivalentes e desabilita sem municao.
- Two-Handed e armas que precisam de mao livre sao bloqueadas quando escudo/off-hand atrapalha.
- Thrown gera variante de arremesso separada.
- Reach ajusta Opportunity Attack para 10 ft.
- Loading/Reload sao expostos como propriedades.
- Cantrips, magias de background/feat e magias de classe viram acoes quando ha dado local suficiente.
- Recursos limitados viram acoes/contadores.

Limite conhecido: propriedades de combate mais profundas ainda sao parciais.

### Resources

Implementado em `backend/src/modules/resources/`.

- `POST /resources/use`
- `POST /resources/recover`
- Erros canonicos para recurso ausente ou indisponivel.
- Short rest recupera recursos `short_rest`.
- Long rest recupera recursos `short_rest` e `long_rest`, limpa slots usados e zera hit dice usados.

### Inventory ammo

Implementado em `backend/src/modules/inventory/`.

- `POST /inventory/spend-ammo`
- `POST /inventory/recover-ammo`
- Resolve grupo de municao por arma.
- Conta entradas equivalentes (`arrow` + `arrows-20`, por exemplo).
- Remove pilhas vazias ao gastar.
- Cria pilha nova ao recuperar quando nao ha item compativel.

### Health, config e erros

Implementado em `backend/src/modules/health/`, `backend/src/config/` e `backend/src/common/api-exception.filter.ts`.

- Health endpoint.
- Readiness do dataset local.
- Config explicita de env.
- Shape de erro com `statusCode`, `error.code`, `error.message`, `path`, `requestId` e `timestamp`.

### Persistencia e ledger

Implementado.

- Prisma schema, migrations e seed existem.
- CRUD canonico de personagens em `/characters` via `CharactersStorageController` (Prisma).
- Persistencia JSON legada (`characters-persistence`) foi removida do codigo e o arquivo residuo `backend/data/characters.json` foi deletado em 2026-05-12.
- Resource ledger registra eventos para HP, hit dice, spell slots, rests, resources e ammo.
- Resource projection cria read model consolidado.
- Validacao de input em `POST /characters/project` rejeita characters sem `classes` com 400.

## Inconsistencias entre plano e codigo (resolvidas)

Todas as inconsistencias originalmente listadas em 2026-05-08 foram corrigidas entre Tasks 1-6 e a limpeza de 2026-05-12:

1. ~~`domain/contracts/` vs `shared/contracts/`~~ — Resolvido: `domain/contracts/` removido, `@shared/contracts` e o alias canonico.
2. ~~Prisma adicionado antes do typecheck~~ — Resolvido: `npm run typecheck` passa limpo.
3. ~~Duas APIs de persistencia concorrentes~~ — Resolvido: persistencia JSON removida, Prisma e o unico caminho.
4. ~~Prisma repo com shape antigo~~ — Resolvido: storage usa `CharacterRecord` canonico.
5. ~~migration-review declara estaveis sem typecheck~~ — Resolvido: typecheck passa.
6. ~~roadmap/task-board substituem arquivos antigos~~ — Resolvido: arquivos antigos removidos da raiz.
7. ~~`getResources()` com `where: { id: characterId }`~~ — Resolvido: `getResources()` agora usa `where: { characterId }`.
8. ~~`rebuildProjection()` duplicando characterId~~ — Resolvido: spread `{ ...result, projected: true }` nao duplica.
9. ~~`backend/package.json` nao standalone~~ — Resolvido: lista Nest, Fastify, Prisma como dependencias proprias.
10. ~~Testes com tsx nao substituem tsc~~ — Resolvido: `npm run typecheck` roda `tsc --noEmit` e passa.

## Verificacao de 2026-05-12

Comandos executados:

- `npm test` (frontend): 300 testes, 0 falhas. (3 testes Playwright no runner errado foram removidos.)
- `npm run typecheck` (frontend): passa.
- `npm run backend:test`: 177 testes, 0 falhas.
- `npm run backend:typecheck`: passa limpo.

## Proximos passos do MVP backend

Typecheck e testes estao verdes. Persistencia esta unificada em Prisma. Proximas acoes:

1. Continuar extracao de `app.js` (~1950 linhas) para modulos menores em `src/app/*`.
2. Modularizar `styles.css` (~2750 linhas).
3. Implementar features de app pendentes (level up, exclusao com confirmacao, spell cards, etc.).

