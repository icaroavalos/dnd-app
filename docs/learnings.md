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

## Frontend-backend integration: endpoints obrigatorios

O frontend consome os seguintes endpoints do backend. Todos sao **obrigatorios** - nao ha fallback local.

### Endpoints de catalogo (leitura)

- `GET /rules/classes` - Classes e recursos de classe
- `GET /rules/species` - Species (racas/linhagens)
- `GET /rules/backgrounds` - Backgrounds
- `GET /rules/spells` - Lista de magias
- `GET /rules/class-spells` - Magias por classe
- `GET /rules/items` - Equipamentos e itens
- `GET /rules/features` - Features de classes e subclasses
- `GET /rules/feats` - Feats

### Endpoints de acao (escrita/leitura)

- `POST /characters/project` - Projeta ficha derivada (nivel, abilities, saves, skills, HP, AC, spellcasting)
- `POST /actions/derive` - Deriva acoes disponiveis (ataques, magias, recursos)
- `POST /resources/use` - Usa recurso (Ki, Second Wind, etc.)
- `POST /resources/recover` - Recupera recursos (short/long rest)
- `POST /inventory/spend-ammo` - Gasta municao
- `POST /inventory/recover-ammo` - Recupera municao

### Endpoints de persistencia (CRUD)

- `GET /characters` - Lista personagens
- `GET /characters/:id` - Busca personagem por ID
- `POST /characters` - Cria novo personagem
- `PUT /characters/:id` - Atualiza personagem
- `DELETE /characters/:id` - Exclui personagem

### Diagnostico de falha de backend

Quando o backend esta indisponivel:

1. UI exibe banner vermelho "Backend indisponivel" no topo
2. Status bar mostra "erro ao carregar do backend" (nao "local")
3. Formulário de criacao permanece vazio (sem species/classes/backgrounds)
4. Acoes dependentes (projection, actions, resources) sao bloqueadas
5. Mensagem de erro inclui: "Certifique-se de que o backend esta rodando em http://localhost:3100"

### Comandos de validacao

Fluxo recomendado antes de fechar mudanca:

```bash
# Frontend
npm run build
npm run typecheck
node --check app.js
for f in src/app/*.js src/app/builder/*.js; do node --check "$f" || exit 1; done
node --test tests/*.test.js tests/contract/*.test.js

# Backend
npm --prefix backend run test
npm --prefix backend run typecheck
```

### Como rodar localmente

```bash
# 1. Build do frontend
npm run build

# 2. Iniciar backend (porta 3100)
npm run backend:dev
# ou: cd backend && npm run dev

# 3. Iniciar frontend (porta 4173 ou 5173)
npm run dev
# ou: python3 -m http.server 4173

# 4. Acessar http://localhost:4173
```

### Configuracao suportada

Backend:
- `NODE_ENV`: development, test ou production
- `PORT`: porta HTTP (default: 3100)
- `HOST`: host de bind (default: 0.0.0.0)
- `LOG_LEVEL`: silent, error, warn, info ou debug
- `RULES_DATA_DIR`: override opcional para dataset compacto

Frontend:
- Backend URL: http://localhost:3100 (fixo em development)
- CORS habilitado para: http://localhost:4173, http://127.0.0.1:4173

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
