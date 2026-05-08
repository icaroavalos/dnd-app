# D&D Character App

Aplicativo web estático para criação e acompanhamento de fichas de D&D, com foco atual em regras 2024/5.5e e arquitetura orientada a TypeScript.

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

### Saída compilada

- [dist](/Users/icaro/codes/dnd-app/dist): JavaScript gerado pelo TypeScript; é isso que o `app.js` importa

### Testes

- [tests](/Users/icaro/codes/dnd-app/tests): suites principais em `node --test`

### Scripts

- [scripts/build-5etools-data.mjs](/Users/icaro/codes/dnd-app/scripts/build-5etools-data.mjs): compacta a base bruta do 5etools para o formato que o app consome

### Documentação de projeto

- [docs/project](/Users/icaro/codes/dnd-app/docs/project): notas históricas de implementação e migração
- [melhoria.txt](/Users/icaro/codes/dnd-app/melhoria.txt): roadmap incremental do app

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
