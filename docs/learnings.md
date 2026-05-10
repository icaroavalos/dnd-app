# Learnings

Ultima revisao: 2026-05-10.

## Fallback silencioso em dados canonicos e um padrao nao permitido

Tasks 08-10 removeram fallback localStorage de:
- Actions derivation (api-actions-client.ts)
- Resource mutations (api-resource-mutations.ts, resource-helpers.js)
- Character storage (api-character-storage-client.ts, character-storage-facade.js)
- Character projection (character-projection.ts)

Padrao:
- Dados canonicos (personagens, resources, inventory, actions, projection): backend-only, erro visivel
- Preferencias UI (tema, layout, ultimo personagem ID): localStorage permitido

Aprendizado: console.warn com fallback local em mutacoes deve ser removido; lance erro tipado (`ActionDerivationError`, `ResourceMutationError`, `CharacterStorageError`).

## Typecheck e testes medem coisas diferentes

`npm test` no backend passou com `136` testes, mas `npm run typecheck` falhou. Como os testes rodam via `tsx`, eles validam comportamento em runtime, mas nao garantem que todos os contratos TypeScript estejam coerentes.

Aprendizado: nunca declarar um slice como MVP-estavel sem `npm run typecheck` e `npm test` verdes.

## Contratos foram movidos

O caminho antigo `backend/src/domain/contracts/` foi substituido por `backend/src/shared/contracts/` e alias `@shared/contracts`.

Aprendizado: toda doc ou codigo novo deve usar `@shared/contracts`; referencias antigas sao legado.

## Persistencia duplicada cria ambiguidade

O backend tem duas abordagens:

- `characters-persistence`: arquivo JSON.
- `characters-storage`: Prisma/SQLite.

Aprendizado: antes de integrar frontend ao backend, escolher uma rota canonica e marcar a outra como legado ou remover.

## Prisma ainda nao espelha CharacterRecord

O schema e o repository Prisma usam shapes diferentes do contrato atual. Exemplos:

- `runtimeState` no Prisma repository versus `state` no `CharacterRecord`.
- `spellChoices[].spellId` versus `selectedCantrips` e `selectedLevel1Spells`.
- `backgroundChoices[]` no banco versus `backgroundChoices` como objeto no contrato.
- Campos como `resources`, `attacks`, `spells`, `skillProficiencies` e `savingThrowProficiencies` nao estao plenamente persistidos.

Aprendizado: alinhar persistencia ao contrato antes de expandir endpoints.

## Resource projection tem um detalhe perigoso

`ResourceProjectionService.getResources()` busca `where: { id: characterId }`, mas o modelo Prisma tem `characterId` como campo unico separado de `id`.

Aprendizado: read models projetados devem ser testados tanto por rebuild quanto por leitura direta.

## D&D 2024: o MVP ja cobre bastante combate basico

O backend ja deriva acoes de armas equipadas, municao, finesse, thrown, versatile, reach, two-handed, loading/free hand, two-weapon fighting, spells e recursos.

Aprendizado: o proximo ganho de valor nao e mais uma propriedade de arma; e estabilizar contratos e persistencia.
