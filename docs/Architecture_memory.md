# Architecture Memory

Ultima revisao: 2026-05-11.

## Resumo executivo

O projeto esta no meio da migracao de um app estatico de ficha D&D 5e 2024 para um backend NestJS + Fastify que vira a fonte de verdade de regras, projecoes e mutacoes. O frontend ainda existe como shell local com bastante logica TypeScript, mas o backend ja implementa varios slices funcionais.

**Atualizacao 2026-05-10:** Frontend agora e backend-only para dados canonicos. Nao ha mais fallback local para personagens, recursos, inventario ou actions. O backend e obrigatorio para operacao.

**Atualizacao 2026-05-11:** Ports de desenvolvimento:
- Frontend: `npm run dev` sobe em `http://localhost:3000`
- Backend: `npm run backend:dev` sobe em `http://localhost:3100`
- Vite disponivel como dev dependency, mas `serve` e usado para production build

O ponto critico do MVP backend nao e adicionar outro modulo. O ponto critico agora e estabilizar contratos e persistencia: os testes de runtime passam, mas `npm run typecheck` falha. Enquanto o typecheck estiver vermelho, o backend ainda nao deve ser tratado como MVP pronto.

**Status atual 2026-05-12:** Event delegation implementado para TODOS os eventos do formulario de criacao (change, input, click). `creation-event-handlers.js` usa tres handlers com roteamento via `el.matches()`/`el.closest()` em vez de `querySelectorAll` + `addEventListener`. Selecao de classe agora reflete features corretamente. Debug hook `window.__dndState` removido de `app.js`.

**Atualizacao 2026-05-11:** Ports de desenvolvimento:

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

Implementado parcialmente.

- Prisma schema, migrations e seed existem.
- `characters-storage` usa Prisma para CRUD simples.
- `characters-persistence` usa arquivo JSON em `backend/data/characters.json`.
- Resource ledger registra eventos para HP, hit dice, spell slots, rests, resources e ammo.
- Resource projection cria read model consolidado.

Estes slices ainda nao devem ser considerados MVP-estaveis porque ha duplicacao de persistencia, divergencia de contrato e falha de typecheck.

## Inconsistencias entre plano e codigo

1. Documentos antigos dizem que contratos canonicos estao em `backend/src/domain/contracts/`, mas o codigo atual usa `backend/src/shared/contracts/`.
2. O roadmap dizia para adicionar persistencia com PostgreSQL/Prisma depois da API read-only; o codigo ja adicionou Prisma, mas usando SQLite e antes de estabilizar typecheck.
3. Existem duas APIs de persistencia concorrentes: `/characters-persistence` com arquivo JSON e `/characters-storage` com Prisma.
4. O Prisma repository usa um shape antigo (`runtimeState`, `spellChoices[].spellId`, `backgroundChoices[]`) que nao bate com `CharacterRecord` atual (`state`, `spellChoices.selectedCantrips`, `backgroundChoices` como objeto, `resources`, `skillProficiencies`, `savingThrowProficiencies`, `attacks`, `spells`).
5. `docs/archive/migration-review.md` declarou slices estaveis, mas os criterios do proprio arquivo ainda nao estao satisfeitos porque o typecheck falha.
6. `docs/agents/roadmap.md` e `docs/agents/task-board.md` substituem os antigos `melhoria.txt` e `etapas-agente-restantes.txt`, que ficavam soltos na raiz.
7. `ResourceProjectionService.getResources()` consulta `where: { id: characterId }`; pelo schema, o lookup correto deveria ser por `characterId`.
8. `ResourceProjectionController.rebuildProjection()` retorna `{ projected: true, characterId, ...result }`, duplicando `characterId` e causando erro TS2783.
9. O `backend/package.json` nao e standalone para NestJS: ele lista Prisma, mas as dependencias Nest/Fastify ficam no `package.json` raiz.
10. Os testes passam com `tsx`, mas isso nao substitui `tsc --noEmit`.

## Verificacao de 2026-05-08

Comandos executados em `backend/`:

- `npm test`: passou, `136` testes.
- `npm run typecheck`: falhou.

Falhas de typecheck observadas:

- `resource-projection.controller.ts`: `characterId` especificado duas vezes no retorno.
- `characters.spec.ts`: fixtures de `backgroundChoices` sem `equipmentSelection`.
- `resources.spec.ts`: `@ts-expect-error` sem erro correspondente.

## Next Action do MVP backend

Proxima acao imediata:

Corrigir o typecheck do backend sem adicionar feature nova.

Escopo recomendado:

1. Ajustar `ResourceProjectionController.rebuildProjection()` para nao duplicar `characterId`.
2. Corrigir `ResourceProjectionService.getResources()` para buscar por `characterId`.
3. Atualizar fixtures de `BackgroundChoiceState` com `equipmentSelection`.
4. Remover ou substituir o `@ts-expect-error` inutil em `resources.spec.ts`.
5. Rodar `npm run typecheck` e `npm test`.

Depois disso, decidir a fronteira de persistencia: manter apenas Prisma como caminho canonico ou marcar explicitamente a persistencia JSON como legado temporario.
