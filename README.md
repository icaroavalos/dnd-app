# D&D Character App

Aplicativo web estático para criação e acompanhamento de fichas de D&D, com foco atual em regras 2024/5.5e e arquitetura orientada a TypeScript.

## Memoria do projeto

A memoria viva da arquitetura agora fica em:

- [docs/README.md](/Users/icaro/codes/dnd-app/docs/README.md)
- [docs/Architecture_memory.md](/Users/icaro/codes/dnd-app/docs/Architecture_memory.md)
- [docs/preferences.md](/Users/icaro/codes/dnd-app/docs/preferences.md)
- [docs/sessions.md](/Users/icaro/codes/dnd-app/docs/sessions.md)
- [docs/learnings.md](/Users/icaro/codes/dnd-app/docs/learnings.md)

Estado auditado em 2026-05-08: o backend passa `npm test` com 136 testes, mas ainda falha `npm run typecheck`. O proximo passo do MVP backend e corrigir typecheck antes de adicionar novas features.

## Como rodar

### Requisitos

- Node.js 18+
- npm
- Python 3 opcional, caso prefira servir os arquivos com `http.server`

### Instalação

```bash
npm install
```

### Build

O app consome os módulos compilados em `dist/`.

```bash
npm run build
```

### Servidor local

Você pode subir um servidor estático de duas formas:

```bash
npm run dev
```

ou

```bash
python3 -m http.server 5173
```

Abra em:

```text
http://localhost:5173
```

## Backend NestJS + Fastify

O backend novo vive isolado em:

- [backend](/Users/icaro/codes/dnd-app/backend)

Ele ja passou do primeiro slice de implementação e hoje expõe:

- `GET /health`
- `GET /health/ready`
- `GET /rules/backgrounds`
- `GET /rules/classes`
- `GET /rules/spells`
- `GET /rules/class-spells`
- `GET /rules/species`
- `GET /rules/items`
- `GET /rules/features`
- `GET /rules/feats`
- `POST /characters/project`
- `POST /actions/derive`
- `POST /resources/use`
- `POST /resources/recover`
- `POST /inventory/spend-ammo`
- `POST /inventory/recover-ammo`

Tambem existem slices parciais de persistencia e ledger:

- `GET/POST/PUT/DELETE /characters-persistence`
- `GET/POST /characters-storage`
- `POST/GET /characters/:characterId/resources/*`
- `GET/POST /characters/:characterId/resources/projection`

Esses slices de persistencia ainda precisam de alinhamento de contrato antes de virar caminho canonico do MVP.

### Instalação do backend

```bash
cd backend
npm install
```

### Rodar o backend em desenvolvimento

```bash
npm run backend:dev
```

ou, de dentro da pasta `backend`:

```bash
npm run dev
```

O servidor sobe por padrão em:

```text
http://localhost:3100
```

Configuração suportada hoje:

- `NODE_ENV`: `development`, `test` ou `production`
- `PORT`: porta HTTP do backend
- `HOST`: host de bind do Fastify
- `LOG_LEVEL`: `silent`, `error`, `warn`, `info` ou `debug`
- `RULES_DATA_DIR`: override opcional para o dataset compacto local

### Verificações do backend

```bash
npm run backend:typecheck
npm run backend:test
npm run backend:build
```

Observacao atual: em 2026-05-08, `npm run backend:test` passa, mas `npm run backend:typecheck` falha por inconsistencias entre testes/contratos e resource projection. Consulte [docs/Architecture_memory.md](/Users/icaro/codes/dnd-app/docs/Architecture_memory.md) antes de prosseguir no backend.

### Endpoints de domínio já implementados

#### `POST /characters/project`

Projeta uma ficha derivada tipada a partir de um `CharacterRecord`.

Retorna:

- nível total
- bônus de proficiência
- atributos finais
- modificadores
- saves
- skills
- HP
- Armor Class derivada a partir de `equipped_armor` e `equipped_shield`
- spellcasting derivado
- spell slots máximos por nível
- resources atuais

#### `POST /resources/use`

Consome um recurso limitado do personagem sem o frontend precisar reimplementar a regra.

Entrada:

- `character`
- `resourceId`
- `amount` opcional

Comportamento:

- reduz `current`
- erros agora usam um shape estável com `statusCode`, `error.code`, `error.message`, `path`, `requestId` e `timestamp`
- retorna `409` com `error.code: "RESOURCE_UNAVAILABLE"` se não houver uso suficiente
- retorna `404` com `error.code: "RESOURCE_NOT_FOUND"` se o recurso não existir

#### `POST /actions/derive`

Deriva uma lista tipada de ações a partir do `CharacterRecord` e do catálogo compacto local.

Escopo atual deste slice:

- ações básicas do sistema (`Attack`, `Dash`, `Dodge`, etc.)
- ataques explícitos vindos de `character.attacks`
- ataques de arma derivados de itens equipados em `character.inventory`
- cantrips e magias de nível 1 vindas de `spellChoices`
- magias de classe vindas de `character.spells`, validadas contra `GET /rules/class-spells`
- ações e contadores de recursos limitados já presentes em `character.resources`

Limitação atual intencional:

- o backend já consegue derivar ataques de armas simples/ranged a partir de itens equipados, incluindo uso de dano versátil quando a arma principal está livre para duas mãos
- notas de ataque também já expõem propriedades relevantes como `Ammunition`, `Heavy`, `Versatile`, `Reach`, `Loading` e `Reload`, além da munição restante quando a arma depende dela
- ataques de armas com `Ammunition` já ficam desabilitados quando o inventário não tem quantidade compatível do tipo correto
- ataques com arma `Two-Handed` já ficam desabilitados quando um escudo ou item na outra mão impede empunhá-las corretamente
- armas de munição de uma mão já ficam desabilitadas quando a ficha não tem mão livre para carregar a arma
- armas corpo a corpo com a propriedade `Thrown` agora geram duas ações derivadas: uma versão corpo a corpo e outra de arremesso usando o alcance do item
- para esse slice, `character.inventory[].quantity` é o campo canônico usado para contar munição, tanto em pilhas (`arrows-20`) quanto em entradas unitárias equivalentes (`arrow`)
- a partir deste ponto, o backend também já possui comandos de inventário para gastar e recuperar munição com base na arma equipada
- `Opportunity Attack` agora usa o alcance real da arma corpo a corpo equipada, incluindo `Reach`
- `Two-Weapon Fighting` agora é derivado como ação básica contextual e fica desabilitado quando a ficha não tem duas armas `Light` equipadas
- ainda faltam partes mais profundas de combate de equipamento, como escolhas mais detalhadas por propriedade e interações mais amplas de armadura/escudo no mesmo slice de ação

#### `POST /inventory/spend-ammo`

Gasta munição a partir de uma arma equipada, sem obrigar o frontend a descobrir manualmente qual item de munição deve ser decrementado.

Entrada:

- `character`
- `weaponItemId`
- `amount` opcional

Comportamento atual:

- identifica o grupo de munição correto pela arma equipada (`bow`, `crossbow`, `sling`)
- soma entradas equivalentes do inventário, como `arrow` + `arrows-20`
- consome a quantidade solicitada nas entradas compatíveis
- retorna `409` com `error.code: "AMMO_UNAVAILABLE"` se a munição total for insuficiente

#### `POST /inventory/recover-ammo`

Recupera munição de volta ao inventário com base na arma equipada.

Entrada:

- `character`
- `weaponItemId`
- `amount` opcional

Comportamento atual:

- prefere acrescentar em uma pilha compatível já existente
- se não houver pilha compatível, cria uma nova entrada `backpack` com o `baseItemId` preferido para aquele tipo de munição

#### `GET /rules/class-spells`

Expõe a lista compactada de magias por classe a partir do dataset local do 5etools.

Uso atual:

- validação de magias de classe na derivação de ações
- base para futuros fluxos de seleção/preparação de magias pelo backend

#### `POST /resources/recover`

Aplica recuperação por descanso com base no `recovery` já salvo em cada recurso.

Entrada:

- `character`
- `recovery`: `short_rest` ou `long_rest`

Comportamento atual:

- `short_rest` recupera recursos marcados como `short_rest`
- `long_rest` recupera recursos marcados como `short_rest` e `long_rest`
- `long_rest` também limpa `spellSlotsUsed` e zera `hitDiceUsed`

## Verificações úteis

TypeScript:

```bash
npm run typecheck
```

Sintaxe do shell principal:

```bash
node --check app.js
```

Testes:

```bash
npm test
node --test tests/*.test.js
```

Fluxo recomendado antes de fechar uma mudança:

```bash
npm run build
npm run typecheck
node --check app.js
node --test tests/*.test.js
```

## Visão rápida do repositório

### Entrada da aplicação

- [index.html](/Users/icaro/codes/dnd-app/index.html): carrega o app no navegador
- [app.js](/Users/icaro/codes/dnd-app/app.js): shell de renderização, eventos e hidratação inicial
- [styles.css](/Users/icaro/codes/dnd-app/styles.css): estilo da interface

### Código-fonte TypeScript

- [src/core/character](/Users/icaro/codes/dnd-app/src/core/character): cálculo de ficha, features, magias, recursos, inventário
- [src/core/engine](/Users/icaro/codes/dnd-app/src/core/engine): engines de ações, modificadores e expressões
- [src/core/state](/Users/icaro/codes/dnd-app/src/core/state): estado da UI, fluxo de criação, view-models e renderizadores tipados
- [src/core/rules](/Users/icaro/codes/dnd-app/src/core/rules): constantes, repositório de regras e contratos centrais
- [src/lib](/Users/icaro/codes/dnd-app/src/lib): helpers compartilhados de formatação, texto e parsing
- [src/types](/Users/icaro/codes/dnd-app/src/types): tipos centrais do app

### Backend TypeScript

- [backend/src/shared/contracts](/Users/icaro/codes/dnd-app/backend/src/shared/contracts): contratos canônicos do backend para personagem, escolhas, regras e projeção derivada
- [backend/src/modules/characters](/Users/icaro/codes/dnd-app/backend/src/modules/characters): projeção tipada de ficha
- [backend/src/config](/Users/icaro/codes/dnd-app/backend/src/config): carregamento e validação explícita de ambiente para o backend
- [backend/src/modules/health](/Users/icaro/codes/dnd-app/backend/src/modules/health): health endpoint e readiness check do dataset compacto local
- [backend/src/modules/actions](/Users/icaro/codes/dnd-app/backend/src/modules/actions): derivação tipada de ações usando o contrato canônico do backend
- [backend/src/modules/resources](/Users/icaro/codes/dnd-app/backend/src/modules/resources): uso e recuperação de recursos por descanso
- [backend/src/modules/rules](/Users/icaro/codes/dnd-app/backend/src/modules/rules): catálogos read-only vindos do dataset compacto local, incluindo `class-spells`

### Saída compilada

- [dist](/Users/icaro/codes/dnd-app/dist): JavaScript gerado pelo TypeScript; é isso que o `app.js` importa

### Testes

- [tests](/Users/icaro/codes/dnd-app/tests): suites principais em `node --test`

### Scripts

- [scripts/build-5etools-data.mjs](/Users/icaro/codes/dnd-app/scripts/build-5etools-data.mjs): compacta a base bruta do 5etools para o formato que o app consome

### Documentação de projeto

- [docs](/Users/icaro/codes/dnd-app/docs): memoria viva, planos e historico do projeto
- [docs/agents](/Users/icaro/codes/dnd-app/docs/agents): handoff para agentes operacionais
- [docs/archive/project](/Users/icaro/codes/dnd-app/docs/archive/project): notas históricas de implementação e migração
- [docs/superpowers/plans/2026-05-08-backend-mvp-system-roadmap.md](/Users/icaro/codes/dnd-app/docs/superpowers/plans/2026-05-08-backend-mvp-system-roadmap.md): plano mestre atual de backend MVP e sistema

## Fonte de dados oficial

Hoje o repositório usa **uma única origem canônica de regras**:

- [5etools-v2.28.0](/Users/icaro/codes/dnd-app/5etools-v2.28.0)

Essa pasta é a cópia local bruta do 5etools. Ela **não é lida diretamente pelo app em runtime**.

O navegador consome apenas os arquivos compactados gerados em:

- [data/5etools](/Users/icaro/codes/dnd-app/data/5etools)

## Como os dados são compactados

O compactador oficial é:

- [scripts/build-5etools-data.mjs](/Users/icaro/codes/dnd-app/scripts/build-5etools-data.mjs)

Ele lê o 5etools bruto principalmente destas áreas:

- `5etools-v2.28.0/data/class/*.json`
- `5etools-v2.28.0/data/spells/*.json`
- `5etools-v2.28.0/data/races.json`
- `5etools-v2.28.0/data/backgrounds.json`
- `5etools-v2.28.0/data/items-base.json`
- `5etools-v2.28.0/data/feats.json`

E gera um dataset compacto em:

- [data/5etools/5e-2024](/Users/icaro/codes/dnd-app/data/5etools/5e-2024)
- [data/5etools/5e-2014](/Users/icaro/codes/dnd-app/data/5etools/5e-2014)
- [data/5etools/manifest.json](/Users/icaro/codes/dnd-app/data/5etools/manifest.json)

### O que entra no dataset compacto

Por regraset, o compactador extrai apenas o que o app precisa para ficha:

- `classes.json`
- `subclasses.json`
- `class-features.json`
- `subclass-features.json`
- `races.json`
- `subraces.json`
- `backgrounds.json`
- `equipment.json`
- `feats.json`
- `spells.json`
- `class-spells.json`

### Como o app usa isso

Em runtime, o app hoje aponta para:

- [src/core/rules/constants.ts](/Users/icaro/codes/dnd-app/src/core/rules/constants.ts:89)

Lá, `DATA_SOURCE` está configurado para:

```text
data/5etools/5e-2024
```

E o [app.js](/Users/icaro/codes/dnd-app/app.js:373) carrega exatamente estes arquivos:

- `classes.json`
- `races.json`
- `subraces.json`
- `equipment.json`
- `spells.json`
- `class-spells.json`
- `class-features.json`
- `subclass-features.json`
- `subclasses.json`
- `feats.json`
- `backgrounds.json`

Ou seja: **classe, raça, antecedentes, magias, subclasses e features usados pela criação da ficha vêm do dataset compacto do 5etools local**.

## Atualizando o 5etools no futuro

Se a pasta [5etools-v2.28.0](/Users/icaro/codes/dnd-app/5etools-v2.28.0) for atualizada ou substituída por outra versão:

1. Atualize a pasta local do 5etools
2. Regenere o dataset compacto:

```bash
node scripts/build-5etools-data.mjs ./5etools-v2.28.0
```

3. Recompile o TypeScript:

```bash
npm run build
```

4. Rode as verificações:

```bash
npm run typecheck
node --check app.js
node --test tests/*.test.js
```

### Regra importante

Se um dado de classe, raça, background, feat, spell ou subclass estiver errado no app, a ordem correta de investigação é:

1. verificar o arquivo em `data/5etools/5e-2024`
2. se ele estiver incompleto, verificar o compactador em `scripts/build-5etools-data.mjs`
3. só então verificar o dado bruto dentro de `5etools-v2.28.0`

Isso evita reintroduzir dependências em datasets paralelos ou restos de experimentos antigos.

## O que foi limpo

Para deixar o repositório mais legível e previsível, foram removidos:

- datasets paralelos antigos em `data/5e-2014` e `data/5e-2024`
- pipeline legado de `open5e` / `dnd5eapi`
- artefatos duplicados em `src/src`
- backups e arquivos de experimento soltos na raiz

Com isso, o caminho de dados ficou simples:

```text
5etools-v2.28.0  ->  scripts/build-5etools-data.mjs  ->  data/5etools/5e-2024  ->  app.js + core TS
```

No backend novo, o primeiro slice segue esta trilha:

```text
data/5etools/5e-2024  ->  backend/src/modules/rules  ->  NestJS + Fastify endpoints
```

O módulo [backend/src/modules/rules](/Users/icaro/codes/dnd-app/backend/src/modules/rules) já aplica duas regras de manutenção importantes:

- lê apenas do dataset compacto local
- mantém cache simples em memória por catálogo, para evitar releitura de JSON a cada request durante o desenvolvimento

Os contratos em [backend/src/shared/contracts](/Users/icaro/codes/dnd-app/backend/src/shared/contracts) são a fonte de verdade atual do backend. Os módulos `characters`, `resources`, `inventory` e `actions` já dependem deles via `@shared/contracts`.

## Estado atual da arquitetura

- o `app.js` é o shell de UI e hidratação
- o core de regras, projeção e renderização de folha vive em módulos TypeScript
- o runtime do navegador consome apenas `dist/`

## Fluxo da aba Magia

Hoje a aba de magias segue uma separação explícita entre **origem da magia** e **forma de consumo**:

- magias da classe principal usam `castMode: "slots"`
- cantrips usam `castMode: "at-will"`
- magias especiais de background/feat, como `Magic Initiate`, usam `castMode: "resource"`

### Fonte de verdade

- [src/core/character/spell-engine.ts](/Users/icaro/codes/dnd-app/src/core/character/spell-engine.ts): deriva `SpellEntry`, separa origem (`class`, `background`, `auto`) e decide `at-will`, `slots` ou `resource`
- [src/core/character/spell-detail.ts](/Users/icaro/codes/dnd-app/src/core/character/spell-detail.ts): normaliza o detalhe da magia a partir do 5etools local, incluindo:
  - `levelLine`
  - `concentration`
  - `ritual`
  - `saveOrAttack`
  - `damageTypes`
  - `traditions`
  - `classes`
  - `reference`
- [src/core/state/spells-view.ts](/Users/icaro/codes/dnd-app/src/core/state/spells-view.ts): renderiza a aba `Magia` com grupos por nível e botões `At Will`, `Use` e `Cast`

### Regra importante de manutenção

Se uma magia estiver com card incompleto, classe errada, lista errada ou consumo incorreto:

1. verificar `state.api.source.spellDetails`
2. verificar `src/core/character/spell-detail.ts`
3. verificar `src/core/character/spell-engine.ts`
4. só então verificar o shell em `app.js`

Isso evita colocar parsing de spell detail ou regra de consumo diretamente no `app.js`.
- a lógica de ficha está migrando para TypeScript
- regras e cálculo devem nascer no core tipado, não no shell
- qualquer nova feature de personagem deve consumir os dados compactados do 5etools, não fontes paralelas
