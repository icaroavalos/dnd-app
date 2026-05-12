# Prompts Para Copiar E Enviar A Outros Agentes

Este arquivo foi feito para voce copiar um bloco por vez e mandar para outro agente.

Use assim:

1. Copie o prompt `00`.
2. Envie para o agente.
3. Espere ele responder.
4. Se ele mexeu em codigo, envie o prompt de revisao correspondente.
5. So mande o proximo prompt quando o anterior passar nos comandos pedidos.

Regra de ouro: nao pule etapas. O objetivo final e um aplicativo 100% funcional para criar e jogar fichas completas de D&D 2024 com especies/racas, classes, subclasses, backgrounds, magias, equipamentos, regras, acoes, recursos e persistencia.

## 00 - Prompt De Contexto Para Qualquer Agente

Copie este prompt antes de qualquer tarefa nova, se o agente ainda nao conhece o projeto.

```text
Voce e um agente operacional trabalhando no projeto D&D App.

Objetivo final do projeto:
Construir um aplicativo funcional de D&D 2024/5e para criar ficha completa, escolher especie/raca, classe, subclasse, background, atributos, equipamentos, magias, features, recursos, ataques e usar a ficha em jogo. O backend deve ser NestJS + Fastify e virar a fonte de verdade de regras, persistencia, projecao, acoes, recursos e inventario.

Leia obrigatoriamente antes de agir:
1. docs/Architecture_memory.md
2. docs/preferences.md
3. docs/learnings.md
4. docs/agents/README.md
5. docs/agents/task-board.md
6. docs/superpowers/plans/2026-05-08-backend-mvp-system-roadmap.md

Regras obrigatorias:
- Execute somente a tarefa que eu pedir.
- Nao faca refactor amplo.
- Nao implemente feature extra.
- Nao use dados de regra fora de data/5etools/5e-2024/.
- Nao edite 5etools-v2.28.0/ a menos que a tarefa mande corrigir o compactador.
- Nao coloque regra nova em app.js.
- Se tocar comportamento, escreva ou ajuste testes.
- Ao final, atualize docs/sessions.md com timestamp, arquivos alterados, comandos rodados e resultado.
- Se algum comando falhar, explique exatamente a falha e pare.

Antes de editar, rode:
git status --short

Ao finalizar, responda com:
- Status: DONE, DONE_WITH_CONCERNS, NEEDS_CONTEXT ou BLOCKED
- Arquivos alterados
- Comandos rodados e resultado
- Riscos ou pendencias
```

## 01 - Corrigir Typecheck Do Backend

Envie este primeiro. Nao envie prompts de feature antes deste passar.

```text
Voce e um agente operacional trabalhando no projeto D&D App.

Execute APENAS a Task 1 do plano:
docs/superpowers/plans/2026-05-08-backend-mvp-system-roadmap.md

Nome da tarefa:
Fix Backend Typecheck

Escopo permitido:
- backend/src/modules/characters/ledger/resource-projection.controller.ts
- backend/src/modules/characters/ledger/resource-projection.service.ts
- backend/test/characters.spec.ts
- backend/test/resources.spec.ts
- docs/sessions.md

Nao altere outros arquivos.
Nao implemente feature nova.
Nao refatore arquitetura.

Passos obrigatorios:
1. Em ResourceProjectionController.rebuildProjection(), remova a duplicacao de characterId no retorno.
   Use esta forma:
   const result = await this.projectionService.projectCharacterResources(characterId);
   return { ...result, projected: true };

2. Em ResourceProjectionService.getResources(), corrija a busca para usar:
   where: { characterId }

3. Em backend/test/characters.spec.ts, todo backgroundChoices que tiver backgroundId, abilityMode e abilityAssignments deve incluir:
   equipmentSelection: []

4. Em backend/test/resources.spec.ts, remova o @ts-expect-error inutil. Se o teste precisar de valor invalido em runtime, use cast somente no valor, por exemplo:
   amount: 'invalid' as unknown as number

5. Rode:
   cd backend && npm run typecheck
   cd backend && npm test

6. Atualize docs/sessions.md com timestamp, arquivos alterados e resultado dos comandos.

Resultado esperado:
- npm run typecheck passa.
- npm test passa.
- Nenhuma feature nova foi adicionada.

Ao finalizar, responda com:
- Status
- Arquivos alterados
- Comandos rodados e resultado
- Qualquer risco ou pendencia
```

## 01R - Revisar A Correcao Do Typecheck

Envie para outro agente, ou use voce mesmo para conferir.

```text
Revise a implementacao da Task 1: Fix Backend Typecheck.

Leia:
1. docs/superpowers/plans/2026-05-08-backend-mvp-system-roadmap.md
2. git diff

Verifique:
1. O agente alterou somente os arquivos permitidos?
2. O erro TS2783 foi corrigido sem mascarar tipo?
3. getResources() busca por characterId?
4. As fixtures de BackgroundChoiceState incluem equipmentSelection?
5. O @ts-expect-error inutil foi removido corretamente?
6. Foram rodados:
   cd backend && npm run typecheck
   cd backend && npm test
7. docs/sessions.md foi atualizado?

Responda com:
- APROVADO ou REPROVADO
- Problemas encontrados
- Correcoes necessarias
```

## 02 - Tornar O Backend Standalone

Envie somente depois do typecheck passar.

```text
Voce e um agente operacional trabalhando no projeto D&D App.

Execute APENAS a Task 2 do plano:
docs/superpowers/plans/2026-05-08-backend-mvp-system-roadmap.md

Nome da tarefa:
Make backend/package.json Standalone

Escopo permitido:
- backend/package.json
- backend/package-lock.json
- backend/README.md
- docs/sessions.md

Objetivo:
O backend deve conseguir instalar e rodar suas dependencias de NestJS + Fastify + Prisma a partir da pasta backend/, sem depender do package.json raiz.

Passos:
1. Garanta que backend/package.json tenha as dependencias necessarias para NestJS, Fastify, testes, TypeScript, tsx e Prisma.
2. Rode:
   cd backend && npm install
3. Rode:
   cd backend && npm run typecheck
   cd backend && npm test
4. Atualize backend/README.md se algum comando documentado estiver errado.
5. Atualize docs/sessions.md.

Nao altere regras de negocio.
Nao altere frontend.
Nao mexa em Prisma schema nesta tarefa.

Ao finalizar, responda com:
- Status
- Arquivos alterados
- Comandos rodados e resultado
- Riscos ou pendencias
```

## 02R - Revisar Backend Standalone

```text
Revise a Task 2: backend/package.json standalone.

Leia:
1. backend/package.json
2. backend/package-lock.json
3. backend/README.md
4. git diff

Verifique:
1. Dependencias de NestJS/Fastify estao no backend/package.json?
2. Prisma continua no backend/package.json?
3. O lockfile foi atualizado por npm install?
4. O agente nao mexeu em regra de negocio?
5. Foram rodados typecheck e tests dentro de backend/?

Responda com:
- APROVADO ou REPROVADO
- Problemas encontrados
- Correcoes necessarias
```

## 03 - Consolidar Prisma Como Persistencia Canonica

```text
Voce e um agente operacional trabalhando no projeto D&D App.

Execute APENAS a Task 3 do plano:
docs/superpowers/plans/2026-05-08-backend-mvp-system-roadmap.md

Nome da tarefa:
Choose Prisma As Canonical Persistence

Objetivo:
Remover o caminho de persistencia JSON como caminho de producao e deixar Prisma/SQLite como persistencia canonica do backend.

Escopo permitido:
- backend/src/app.module.ts
- backend/src/modules/characters/characters-persistence.controller.ts
- backend/src/modules/characters/characters-persistence.module.ts
- backend/src/modules/characters/characters-persistence.service.ts
- backend/src/modules/characters/persistence/character-persistence.service.ts
- backend/src/modules/README.md
- backend/docs/architecture.md
- backend/test/characters-persistence.spec.ts
- docs/sessions.md

Passos:
1. Remova CharactersPersistenceModule de backend/src/app.module.ts.
2. Remova os arquivos do modulo characters-persistence baseado em JSON.
3. Remova ou substitua o teste backend/test/characters-persistence.spec.ts. Nao deixe teste quebrado para rota removida.
4. Atualize docs do backend dizendo que Prisma e o caminho canonico.
5. Rode:
   cd backend && npm run typecheck
   cd backend && npm test
6. Rode:
   rg -n "characters-persistence|CharacterPersistenceService|backend/data/characters" backend/src backend/test docs README.md
   Resultado esperado: sem matches em backend/src.
7. Atualize docs/sessions.md.

Nao altere CRUD ainda nesta tarefa alem de remover o caminho JSON.

Ao finalizar, responda com:
- Status
- Arquivos alterados/removidos
- Comandos rodados e resultado
- Riscos ou pendencias
```

## 04 - Persistir CharacterRecord Canonico No Prisma

```text
Voce e um agente operacional trabalhando no projeto D&D App.

Execute APENAS a Task 4 do plano:
docs/superpowers/plans/2026-05-08-backend-mvp-system-roadmap.md

Nome da tarefa:
Persist Full CharacterRecord Snapshot In Prisma

Objetivo:
O Prisma deve salvar e devolver o CharacterRecord canonico usado pelo backend, sem perder campos importantes da ficha.

Escopo permitido:
- backend/prisma/schema.prisma
- backend/prisma/migrations/
- backend/prisma/seed.ts
- backend/src/modules/characters/persistence/prisma-character-repository.ts
- backend/test/characters-prisma-repository.spec.ts
- docs/sessions.md

Passos:
1. Adicione em model Character:
   recordJson String @default("{}")

2. Crie migration:
   cd backend && npx prisma migrate dev --name add_character_record_snapshot

3. Atualize PrismaCharacterRepository para aceitar e retornar CharacterRecord de @shared/contracts.

4. Ao criar ou atualizar personagem, salve recordJson com JSON.stringify(character).

5. Ao buscar personagem, se recordJson existir e nao for "{}", retorne JSON.parse(recordJson) como CharacterRecord.

6. Mantenha campos simples como name, ruleset, lineageId, backgroundId, alignment e experience sincronizados para listagem.

7. Ajuste testes de repository para garantir que um CharacterRecord completo volta igual, incluindo:
   - resources
   - state
   - spellChoices
   - backgroundChoices
   - skillProficiencies
   - savingThrowProficiencies
   - inventory

8. Rode:
   cd backend && npm run typecheck
   cd backend && npm test -- test/characters-prisma-repository.spec.ts
   cd backend && npm test

9. Atualize docs/sessions.md.

Ao finalizar, responda com:
- Status
- Arquivos alterados
- Migration criada
- Comandos rodados e resultado
- Riscos ou pendencias
```

## 05 - Publicar CRUD Canonico Em /characters

```text
Voce e um agente operacional trabalhando no projeto D&D App.

Execute APENAS a Task 5 do plano:
docs/superpowers/plans/2026-05-08-backend-mvp-system-roadmap.md

Nome da tarefa:
Expose Canonical CRUD Under /characters

Objetivo:
O backend deve criar, listar, buscar, atualizar e deletar fichas canonicas em /characters usando Prisma, mantendo POST /characters/project para projecao.

Escopo permitido:
- backend/src/modules/characters/storages/characters-storage.controller.ts
- backend/src/modules/characters/storages/characters-storage.service.ts
- backend/src/modules/characters/storages/characters-storage.module.ts
- backend/src/modules/characters/dto/create-character.dto.ts
- backend/src/modules/characters/dto/update-character.dto.ts
- backend/test/characters-storage.spec.ts
- backend/docs/architecture.md
- docs/sessions.md

Passos:
1. Mude a rota do storage controller de characters-storage para characters.
2. Mantenha POST /characters/project funcionando no controller de projecao existente.
3. Implemente rotas:
   GET /characters
   GET /characters/:id
   POST /characters
   PUT /characters/:id
   DELETE /characters/:id
4. Todas devem usar PrismaCharacterRepository via service.
5. Ajuste testes para cobrir CRUD completo.
6. Rode:
   cd backend && npm run typecheck
   cd backend && npm test -- test/characters-storage.spec.ts
   cd backend && npm test
7. Atualize docs/sessions.md.

Nao mexa no frontend nesta tarefa.

Ao finalizar, responda com:
- Status
- Endpoints implementados
- Arquivos alterados
- Comandos rodados e resultado
- Riscos ou pendencias
```

## 06 - Integrar Ledger E Read Model De Recursos

```text
Voce e um agente operacional trabalhando no projeto D&D App.

Execute APENAS a Task 6 do plano:
docs/superpowers/plans/2026-05-08-backend-mvp-system-roadmap.md

Nome da tarefa:
Connect Ledger To Canonical Character Runtime State

Objetivo:
Garantir que eventos de HP, descanso, spell slot, recursos e municao funcionem via ledger e possam ser lidos pelo read model de recursos.

Escopo permitido:
- backend/src/modules/characters/ledger/resource-ledger.service.ts
- backend/src/modules/characters/ledger/resource-projection.service.ts
- backend/src/modules/characters/ledger/resource-ledger.controller.ts
- backend/src/modules/characters/ledger/resource-projection.controller.ts
- backend/test/characters-resource-ledger.spec.ts
- backend/test/characters-resource-projection.spec.ts
- docs/sessions.md

Passos:
1. Adicione teste que cria personagem, aplica dano via ledger, rebuilda projection e le projection.
2. Confirme que GET /characters/:characterId/resources/projection busca por characterId.
3. Para MVP, ledger nao precisa regravar CharacterRecord.recordJson diretamente; ele atualiza ResourceReadModel.
4. Cubra eventos:
   HP_CHANGE
   HIT_DIE
   SPELL_SLOT
   RESOURCE_USED
   REST_APPLIED
   AMMO_SPENT
   AMMO_RECOVERED
5. Rode:
   cd backend && npm run typecheck
   cd backend && npm test -- test/characters-resource-ledger.spec.ts test/characters-resource-projection.spec.ts
   cd backend && npm test
6. Atualize docs/sessions.md.

Ao finalizar, responda com:
- Status
- Eventos cobertos
- Arquivos alterados
- Comandos rodados e resultado
- Riscos ou pendencias
```

## 07 - Auditar Dados D&D 2024 Compactados

Use este prompt para garantir que o app consegue oferecer todas as opcoes do dataset local.

```text
Voce e um agente operacional trabalhando no projeto D&D App.

Tarefa:
Auditar a cobertura dos dados compactados de D&D 2024 em data/5etools/5e-2024.

Objetivo:
Garantir que o app tem catalogos suficientes para criar fichas completas com especies/racas, classes, subclasses, backgrounds, feats, equipamentos, magias, class-spells, class-features e subclass-features.

Escopo permitido:
- scripts/build-5etools-data.mjs
- data/5etools/5e-2024/*.json
- data/5etools/manifest.json
- tests/test-real-data.js
- tests/rules-constants.test.js
- docs/sessions.md

Nao altere backend nesta tarefa, exceto se precisar ajustar teste que le catalogo.
Nao edite arquivos brutos dentro de 5etools-v2.28.0.

Passos:
1. Liste contagens atuais dos arquivos:
   classes.json
   subclasses.json
   class-features.json
   subclass-features.json
   races.json
   subraces.json
   backgrounds.json
   feats.json
   equipment.json
   spells.json
   class-spells.json

2. Compare se algum arquivo esta vazio ou claramente incompleto.

3. Se houver dado compacto incompleto, corrija scripts/build-5etools-data.mjs e regenere:
   node scripts/build-5etools-data.mjs ./5etools-v2.28.0

4. Adicione/ajuste teste para falhar se algum catalogo essencial estiver vazio.

5. Rode:
   npm run build
   npm run typecheck
   node --test tests/test-real-data.js tests/rules-constants.test.js

6. Atualize docs/sessions.md com as contagens encontradas.

Ao finalizar, responda com:
- Status
- Contagens por catalogo
- Arquivos alterados
- Comandos rodados e resultado
- Riscos ou pendencias
```

## 08 - Migrar Catalogos Do Frontend Para O Backend

```text
Voce e um agente operacional trabalhando no projeto D&D App.

Execute APENAS a Task 7 do plano:
docs/superpowers/plans/2026-05-08-backend-mvp-system-roadmap.md

Nome da tarefa:
Catalog API Client Default

Objetivo:
O frontend deve conseguir buscar catalogos no backend NestJS como fonte obrigatoria; quando o backend estiver desligado, a UI deve exibir erro claro em vez de carregar fallback local.

Escopo permitido:
- src/lib/api-catalog-client.ts
- src/core/rules/rule-repository.ts
- tests/rules-constants.test.js
- docs/sessions.md

Passos:
1. Garanta que api-catalog-client use http://localhost:3100 como backend local default.
2. Garanta erro tipado e visivel se fetch do backend falhar.
3. Remova carregamento local do caminho canonico de runtime.
4. Teste backgrounds, classes, species/races, spells, class-spells, items, features e feats.
5. Rode:
   npm run build
   npm run typecheck
   node --test tests/rules-constants.test.js
6. Atualize docs/sessions.md.

Ao finalizar, responda com:
- Status
- Arquivos alterados
- Catalogos testados
- Comandos rodados e resultado
- Riscos ou pendencias
```

## 09 - Migrar Projection, Actions, Resources E Inventory Para Backend

```text
Voce e um agente operacional trabalhando no projeto D&D App.

Execute APENAS a Task 8 do plano:
docs/superpowers/plans/2026-05-08-backend-mvp-system-roadmap.md

Nome da tarefa:
Projection, Actions, Resources, Inventory Clients

Objetivo:
O frontend deve aproveitar os endpoints backend ja implementados para projecao de ficha, derivacao de acoes, uso/recuperacao de recursos e gasto/recuperacao de municao, sem fallback local canonico.

Escopo permitido:
- src/lib/api-character-project-client.ts
- src/lib/api-resource-mutations.ts
- src/lib/api-resource-adapter.ts
- src/core/character/character-projection.ts
- tests/character-projection-helpers.test.js
- tests/action-engine.test.js
- tests/test-all-recovery.js
- docs/sessions.md

Passos:
1. character-projection.ts deve usar POST /characters/project no caminho canonico.
2. Resource mutations devem usar POST /resources/use e POST /resources/recover no caminho canonico.
3. Inventory ammo deve usar POST /inventory/spend-ammo e POST /inventory/recover-ammo no caminho canonico.
4. Se backend falhar, propague erro tipado e mostre falha clara na UI.
5. Rode:
   npm run build
   npm run typecheck
   node --check app.js
   node --test tests/character-projection-helpers.test.js tests/action-engine.test.js tests/test-all-recovery.js
6. Atualize docs/sessions.md.

Ao finalizar, responda com:
- Status
- Endpoints usados
- Arquivos alterados
- Comandos rodados e resultado
- Riscos ou pendencias
```

## 10 - Migrar Persistencia De Fichas Do Frontend Para O Backend

```text
Voce e um agente operacional trabalhando no projeto D&D App.

Tarefa:
Migrar a persistencia de fichas do frontend para o CRUD canonico do backend em /characters.

Pre-requisitos:
- Task 1 passou.
- Task 5 passou.
- GET/POST/PUT/DELETE /characters funcionam.

Objetivo:
O usuario deve conseguir criar, salvar, listar, abrir, atualizar e deletar fichas usando backend; se o backend estiver desligado, a UI deve mostrar erro claro sem salvar dados canonicos no localStorage.

Escopo permitido:
- src/core/state/persistence.ts
- src/lib/api-character-project-client.ts
- src/lib/api-catalog-client.ts
- src/core/state/state-manager.ts
- tests/creation-flow.test.js
- tests/creation-form-controller.test.js
- tests/builder-step-order.test.js
- docs/sessions.md

Passos:
1. Crie ou reutilize cliente para:
   GET /characters
   GET /characters/:id
   POST /characters
   PUT /characters/:id
   DELETE /characters/:id
2. Nao mantenha fallback local para dados canonicos de personagem.
3. Garanta que salvar ficha nao perca resources, spellChoices, backgroundChoices, inventory, attacks, spells e state.
4. Adicione teste para roundtrip de uma ficha completa.
5. Rode:
   npm run build
   npm run typecheck
   node --check app.js
   node --test tests/creation-flow.test.js tests/creation-form-controller.test.js tests/builder-step-order.test.js
6. Atualize docs/sessions.md.

Ao finalizar, responda com:
- Status
- Fluxos testados
- Arquivos alterados
- Comandos rodados e resultado
- Riscos ou pendencias
```

## 11 - Completar Fluxo De Criacao De Ficha

Use este prompt depois de backend e dados estarem estaveis.

```text
Voce e um agente operacional trabalhando no projeto D&D App.

Tarefa:
Garantir que o fluxo de criacao de ficha permite montar uma ficha completa com dados D&D 2024 locais.

Objetivo:
O usuario deve conseguir escolher especie/raca, classe, subclasse quando aplicavel, background, atributos, proficiencias, equipamentos, feat/background feat quando aplicavel e magias quando a classe/background permitir.

Escopo permitido:
- src/core/state/creation-flow.ts
- src/core/state/creation-form-controller.ts
- src/core/state/builder-views.ts
- src/core/state/guided-background-builder.ts
- src/core/character/background-choices.ts
- src/core/character/background-rules.ts
- src/core/character/spell-engine.ts
- tests/creation-flow.test.js
- tests/creation-form-controller.test.js
- tests/guided-background-builder.test.js
- tests/background-choices.test.ts
- docs/sessions.md

Passos:
1. Escreva testes para criar uma ficha completa de:
   - Fighter sem magia
   - Wizard com cantrips e magias
   - Cleric ou Druid com spellcasting
   - personagem com background que concede feat/magia
2. Garanta que cada ficha gerada tem CharacterRecord completo.
3. Garanta que nao existem campos undefined importantes.
4. Rode:
   npm run build
   npm run typecheck
   node --test tests/creation-flow.test.js tests/creation-form-controller.test.js tests/guided-background-builder.test.js
5. Atualize docs/sessions.md.

Ao finalizar, responda com:
- Status
- Classes/backgrounds testados
- Arquivos alterados
- Comandos rodados e resultado
- Riscos ou pendencias
```

## 12 - Corrigir Level Up E Features

```text
Voce e um agente operacional trabalhando no projeto D&D App.

Execute a Task 9 do plano e inclua a correcao do Barbarian level 19.

Objetivo:
No level up, o usuario deve ver features e abilities novas do nivel escolhido. Barbarian level 19 nao pode mostrar apenas "You gain the following benefits."

Escopo permitido:
- src/core/state/builder-views.ts
- src/core/character/feature-engine.ts
- tests/builder-views.test.js
- tests/feature-engine.test.js
- docs/sessions.md

Passos:
1. Adicione teste para Barbarian level 19 mostrando texto concreto.
2. Adicione teste para level up exibindo novas features do nivel escolhido.
3. Corrija resolucao de feature detail usando data/5etools/5e-2024/class-features.json e subclass-features.json.
4. Rode:
   npm run build
   npm run typecheck
   node --test tests/builder-views.test.js tests/feature-engine.test.js
5. Atualize docs/sessions.md.

Ao finalizar, responda com:
- Status
- Casos testados
- Arquivos alterados
- Comandos rodados e resultado
- Riscos ou pendencias
```

## 13 - Corrigir Aba E Selecao De Magias

```text
Voce e um agente operacional trabalhando no projeto D&D App.

Execute a Task 10 do plano.

Objetivo:
A aba de magia nao deve abrir uma descricao automaticamente ao entrar. Na selecao de magias, deve existir um icone/botao de informacao para abrir o card da spell antes de escolher.

Escopo permitido:
- src/core/state/spells-view.ts
- src/core/state/builder-views.ts
- src/core/character/spell-detail.ts
- styles.css
- tests/spell-detail.test.js
- tests/builder-views.test.js
- docs/sessions.md

Passos:
1. Adicione teste garantindo que nenhuma magia fica selecionada automaticamente ao abrir a aba.
2. Adicione teste para botao/icone de informacao na selecao.
3. Implemente abertura explicita do card de spell.
4. Garanta que clicar em informacao nao seleciona/casta a magia.
5. Rode:
   npm run build
   npm run typecheck
   node --test tests/spell-detail.test.js tests/builder-views.test.js
6. Atualize docs/sessions.md.

Ao finalizar, responda com:
- Status
- Comportamentos testados
- Arquivos alterados
- Comandos rodados e resultado
- Riscos ou pendencias
```

## 14 - Mostrar Equipamentos De Background

```text
Voce e um agente operacional trabalhando no projeto D&D App.

Execute a Task 11 do plano.

Objetivo:
Ao escolher background, o app deve mostrar todos os equipamentos concedidos pelo background e preservar a selecao em CharacterRecord.

Escopo permitido:
- src/core/character/background-parser.ts
- src/core/character/background-choices.ts
- src/core/state/builder-views.ts
- tests/background-parser.test.ts
- tests/background-choices.test.ts
- docs/sessions.md

Passos:
1. Escolha pelo menos um background 2024 local com multiplos equipamentos.
2. Adicione teste garantindo que todos aparecem.
3. Corrija parser/choices/UI para renderizar todos.
4. Garanta que CharacterRecord.backgroundChoices.equipmentSelection preserva a selecao.
5. Rode:
   npm run build
   npm run typecheck
   node --test tests/background-parser.test.js tests/background-choices.test.js
6. Atualize docs/sessions.md.

Ao finalizar, responda com:
- Status
- Background testado
- Arquivos alterados
- Comandos rodados e resultado
- Riscos ou pendencias
```

## 15 - Melhorar Exclusao De Ficha

```text
Voce e um agente operacional trabalhando no projeto D&D App.

Tarefa:
Melhorar exclusao de ficha com confirmacao clara.

Objetivo:
Quando o usuario deletar uma ficha, o app deve mostrar um card/modal de confirmacao. O botao X deve ser visualmente mais claro e nao deve apagar ficha por acidente.

Escopo permitido:
- src/core/state/persistence.ts
- src/core/state/state-manager.ts
- src/core/state/builder-views.ts
- styles.css
- app.js somente se for inevitavel conectar evento existente
- tests/creation-flow.test.js
- tests/builder-views.test.js
- docs/sessions.md

Passos:
1. Adicione teste para confirmar que delete exige confirmacao.
2. Implemente estado de confirmacao.
3. Melhore o design do botao de excluir e do card/modal.
4. Garanta que cancelar nao apaga nada.
5. Garanta que confirmar apaga e atualiza lista.
6. Rode:
   npm run build
   npm run typecheck
   node --check app.js
   node --test tests/creation-flow.test.js tests/builder-views.test.js
7. Atualize docs/sessions.md.

Ao finalizar, responda com:
- Status
- Fluxos testados
- Arquivos alterados
- Comandos rodados e resultado
- Riscos ou pendencias
```

## 16 - Melhorar Design Da Secao De Features

```text
Voce e um agente operacional trabalhando no projeto D&D App.

Tarefa:
Melhorar a secao de features da ficha.

Objetivo:
A secao de features deve ficar facil de ler, agrupada por origem/nivel quando possivel, mostrando nome, fonte, nivel, resumo e detalhe sem poluir a tela.

Escopo permitido:
- src/core/state/features-view.ts
- src/core/character/feature-engine.ts
- styles.css
- tests/feature-engine.test.js
- tests/sheet-views.test.js
- docs/sessions.md

Passos:
1. Adicione/ajuste teste para features agrupadas por classe/background/subclasse.
2. Renderize cards/linhas compactas com detalhe expansivel.
3. Preserve acessibilidade basica: botoes com texto claro e estados visiveis.
4. Nao use texto explicativo longo dentro da UI.
5. Rode:
   npm run build
   npm run typecheck
   node --test tests/feature-engine.test.js tests/sheet-views.test.js
6. Atualize docs/sessions.md.

Ao finalizar, responda com:
- Status
- Comportamentos testados
- Arquivos alterados
- Comandos rodados e resultado
- Riscos ou pendencias
```

## 17 - QA Final Do MVP

Use este quando todos os prompts anteriores importantes tiverem passado.

```text
Voce e um agente de QA final do projeto D&D App.

Objetivo:
Verificar se o aplicativo esta pronto para uso como MVP funcional de criacao e uso de fichas D&D 2024.

Nao implemente feature nova nesta tarefa.
Se encontrar problema, registre de forma objetiva e sugira qual tarefa deve corrigir.

Leia:
1. docs/Architecture_memory.md
2. docs/agents/task-board.md
3. docs/superpowers/plans/2026-05-08-backend-mvp-system-roadmap.md
4. README.md

Verificacoes obrigatorias:
1. Backend:
   cd backend && npm run typecheck
   cd backend && npm test
   cd backend && npm run build

2. Frontend/core:
   npm run build
   npm run typecheck
   node --check app.js
   node --test tests/*.test.js

3. Dados:
   Verifique se data/5etools/5e-2024 contem catalogos nao vazios para classes, subclasses, races, backgrounds, feats, equipment, spells, class-spells, class-features e subclass-features.

4. Fluxos manuais a descrever:
   - Criar Fighter nivel 1 sem magia.
   - Criar Wizard nivel 1 com cantrips e magias.
   - Criar personagem com background que concede equipamento.
   - Projetar ficha.
   - Ver actions.
   - Usar recurso.
   - Gastar municao se aplicavel.
   - Salvar, abrir e deletar ficha.

Atualize docs/sessions.md com resultado.

Responda com:
- APROVADO PARA MVP ou REPROVADO
- Comandos rodados e resultado
- Fluxos manuais verificados
- Lista objetiva de bloqueadores
- Proximo prompt recomendado se reprovar
```

## Prompt Curto De Revisao Geral

Use depois de qualquer tarefa, se quiser mandar para um segundo agente revisar.

```text
Voce e um revisor tecnico do projeto D&D App.

Revise a ultima tarefa implementada.

Leia:
1. git diff
2. docs/Architecture_memory.md
3. docs/preferences.md
4. docs/agents/task-board.md

Verifique:
1. A alteracao ficou dentro do escopo?
2. Foram adicionadas features extras nao pedidas?
3. Os comandos de verificacao foram rodados?
4. Ha risco de quebrar criacao de ficha, catalogos, backend ou persistencia?
5. A documentacao de sessao foi atualizada?

Responda com:
- APROVADO ou REPROVADO
- Problemas encontrados
- Correcoes exigidas
- Riscos que podem ficar para depois
```

## Quando Parar E Me Pedir Ajuda

Se algum agente responder `BLOCKED`, nao mande o proximo prompt. Mande este:

```text
Explique o bloqueio de forma simples para uma pessoa nao tecnica.

Responda:
1. O que voce tentou fazer?
2. Qual erro apareceu?
3. Qual arquivo ou comando causou o problema?
4. O que voce precisa para continuar?
5. Qual e a opcao mais segura agora?

Nao implemente nada novo nesta resposta.
```
