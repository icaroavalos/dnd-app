# Learnings

Ultima revisao: 2026-05-12.

## Refatoração para Vite + React + TypeScript (2026-05-12)

**Status:** 🏗️ EM ANDAMENTO - Estrutura básica criada e configurada.

**O que foi feito:**
1. Criação da pasta `frontend/` na raiz.
2. Inicialização do projeto via `npm create vite@latest frontend -- --template react-ts`.
3. Configuração do `vite.config.ts`:
   - Porta fixada em `3000`.
   - Proxy de `/api` para `http://localhost:3100`.
4. Instalação de stack base: `axios`, `zustand`, `react-router-dom`, `lucide-react`, `clsx`, `tailwind-merge`.
5. Migração do `styles.css` (legado) para `frontend/src/index.css`.
6. Criação de pasta `frontend/src/assets/`.

**Licao aprendida:**
- A estrutura do Vite em subpasta isola o frontend do restante da lógica legada, facilitando uma migração incremental.
- O uso de proxy no Vite resolve problemas de CORS durante o desenvolvimento sem precisar de configurações complexas no backend para cada ambiente.
- Manter o CSS original como `index.css` no novo projeto permite preservar a identidade visual enquanto a lógica é reescrita em React.


## Select de classe/raça não reflete seleção - Slugify comparison (2026-05-11)

**Status:** ✅ CORRIGIDO - Select de classe e raça agora marcam opção selecionada corretamente.

**Problema original:** Ao selecionar classe (ex: "Fighter") ou raça (ex: "Human") no form de lineage, a seleção não aparecia marcada no dropdown. O valor era salvo no state (`state.character.class = "Fighter"`), mas o select não exibia a opção como selecionada.

**Causa raiz:** A comparação no `selectField` (`form-controls.js:18`) usava `toLowerCase()`, mas:
- Opções são carregadas com valor slugificado como key: `["fighter", "Fighter"]`
- Valor salvo no state vem formatado: `"Fighter"`
- Comparação `"fighter" === "fighter"` funcionaria, mas a normalização não era consistente

**Solução aplicada:**
```javascript
// ANTES (falha quando slugify difere de toLowerCase)
${String(optionValue).toLowerCase() === String(value).toLowerCase() ? "selected" : ""}

// DEPOIS (slugifica ambos os lados)
const slugify = (str) => String(str ?? "").trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const normalizedValue = slugify(value);
// ...
${slugify(optionValue) === normalizedValue ? "selected" : ""}
```

**Arquivos modificados:**
- `src/app/form-controls.js` - Adiciona slugify no `selectField`
- `app.js` - Logs de debug em `renderLineageForm`

**Licao aprendida:**
- Dados de catálogo usam keys slugificadas ("fighter"), state usa valores formatados ("Fighter")
- Comparações devem sempre normalizar ambos os lados com a mesma função
- `slugify()` difere de `toLowerCase()` - remove acentos, substitui espaços por `-`

## Event Delegation e Estados Desabilitados (Disabled) no DOM

- **O Problema:** Durante a implementação do seletor de magias Magic Initiate, foi relatado que não era possível selecionar as magias, apesar dos eventos estarem corretos. Inicialmente, pensei que o erro estava no mapeamento do armazenamento (chaves redundantes ou erradas no localStorage) ou na reatividade.
- **A Causa do Bloqueio Total:** Todos os checkboxes nasciam com o atributo `disabled="disabled"`. A propriedade `locked` verificava uma variável `creationChoicesLocked` vinda do sistema principal. Ocorre que o sistema estava injetando a *referência da função* (sem invocar com `()`) e não o seu resultado (Booleano). No Javascript, avaliar uma função em um contexto condicional (`disabled = locked || ...`) resulta sempre em `true`, pois objetos e funções são avaliados como valores "truthy". Consequentemente, o renderizador considerava a ficha permanentemente "travada".
- **A Causa do Bloqueio Progressivo:** Quando o problema principal foi resolvido, outro bug foi desmascarado. O código verificava o número máximo de escolhas (ex: 2 cantrips) e, se o limite fosse alcançado, marcava as opções restantes como `disabled`. O problema é que a lógica desabilitava *todas* as opções, inclusive as *já selecionadas*, impedindo que fossem desmarcadas para corrigir escolhas.
- **As Soluções:** (1) Ajustado o uso da variável `creationChoicesLocked` checando se é função antes de usá-la `typeof fn === 'function' ? fn() : fn`. (2) Ajustada a lógica de desabilitação para usar `(!isSelected && maxReached)` em vez de apenas `(maxReached)`. Isso garante que opções selecionadas permaneçam ativas para permitir que o usuário as desmarque.

**Como testar:**
```bash
npm run dev      # Frontend: http://localhost:3000
npm run backend:dev  # Backend: http://localhost:3100
```
1. Abrir http://localhost:3000
2. Criar nova ficha
3. Selecionar classe "Fighter" → select deve marcar "Fighter"
4. Selecionar raça "Human" → select deve marcar "Human"

---

## Migracao completa para Event Delegation - Todos os eventos do formulario (2026-05-12)

**Status:** ✅ CORRIGIDO - Todos os eventos do formulario de criacao usam event delegation. Selecao de classe agora reflete features corretamente.

**Problema original:** Ao selecionar qualquer classe que nao fosse Fighter, as features da classe nao apareciam. Fighter funcionava porque era a classe padrao em `createStartingCharacter()` e suas features eram renderizadas na carga inicial.

**Causa raiz:** `bindCreationEvents()` usava `querySelectorAll` + `addEventListener` direto em elementos filhos. Quando `init()` executava `await hydrateApiData(); render();`, o segundo `render()` chamava `renderForm()` que fazia `els.form.innerHTML = html`, DESTRUINDO todos os elementos filhos e seus event listeners. Apos isso, nenhum evento do formulario funcionava — classe, raca, nada.

**Solucao aplicada:** Migrar TODO o binding de eventos do formulario para event delegation com tres handlers:

```javascript
function bindCreationEvents(form, els) {
  form.addEventListener('change', handleFormChange);
  form.addEventListener('input', handleFormInput);
  form.addEventListener('click', handleFormClick);
}
```

Cada handler roteia via `el.matches()` ou `el.closest()`:
```javascript
function handleFormChange(event) {
  const el = event.target;
  if (el.matches('[data-path]')) { handlePathInputChange(el); return; }
  if (el.matches('[data-class-feature-choice]')) { handleClassFeatureChoiceChange(el); return; }
  if (el.matches('[data-bg-select]')) { handleBgSelectChange(el); return; }
  if (el.matches('[data-bg-increment]')) { handleBgIncrementChange(el); return; }
  if (el.matches('[data-bg-ability]')) { handleBgAbilityChange(el); return; }
  if (el.matches('[data-bg-equipment]')) { handleBgEquipmentChange(el); return; }
  if (el.matches('[name="spellcasting-ability"]')) { handleSpellcastingAbilityChange(el); return; }
  // ... etc
}

function handleFormClick(event) {
  const moveButton = el.closest('[data-move]');
  if (moveButton) { handleMoveClick(moveButton); return; }
  if (el.matches('[data-ability-adjust]')) { handleAbilityAdjustClick(el); return; }
  // ... etc
}
```

**Arquivos modificados:**
- `src/app/creation-event-handlers.js` - Substituido `querySelectorAll` + binding direto por event delegation com tres handlers (change, input, click)
- `app.js` - Adicionado `bindFormEvents()` no init, debug hook `window.__dndState` (removido depois)

**Licao aprendida:**
- `els.form.innerHTML = html` destroi TODOS os elementos filhos e seus listeners — nao apenas botoes especificos
- Event delegation no elemento **pai** (form) com `el.matches()` / `el.closest()` preserva todos os eventos
- Tres tipos de evento cobrem todo o formulario: `change` (select/checkbox), `input` (text/number), `click` (botoes)
- `el.closest()` e necessario para elementos que podem ter filhos aninhados (ex: botoes com `<span>` dentro)

**Como testar:**
```bash
npm run dev        # Frontend: http://localhost:5173
npm run backend:dev # Backend: http://localhost:3100
```
Criar nova ficha, selecionar classe (ex: Cleric, Wizard), verificar se features da classe aparecem na pre-visualizacao da ficha.

---

---

## Correcao parcial: Background select populando, mas Magic Initiate e navegacao falham (2026-05-11)

**Status:** PARCIALMENTE CORRIGIDO - Select de background popula, mas validacao e selecao de magia falham.

**Problema original:** Ao clicar em "Continuar" apos selecionar opcoes na etapa de Origem (Fighter, Human, Neutra), a navegacao para Background nao funcionava e o select de background aparecia vazio.

**Solucao aplicada (PARCIAL):**
1. Adicionado fallback `|| []` em `backgroundSpellChoiceRules()` para evitar erro quando retorna undefined
2. Adicionada funcao `renderBgSpellChoice` (singular) em `builder/background-spell-renderer.js`
3. Exportado ambas as versoes (singular e plural) em `builder-renderers.js`
4. CORS atualizado em `main.ts` para incluir portas do Vite (5173, 4173)

**Resultado parcial:**
- ✅ Select de background agora popula com opcoes (Acolyte, Soldier, etc.)
- ✅ Formulario de background renderiza sem erros de JavaScript
- ✅ Botao "Continuar" valida e navega quando apropriado
- ❌ Selecao de Magic Initiate spells nao esta funcionando (checkboxes disabled)
- ❌ Ability points distribution nao esta salvando corretamente
- ❌ Botao "Continuar" na seletor de origem ainda nao navega para Background

**Licao aprendida:** O erro "undefined is not a function at Array.map" era sintoma de que `state.api.source.backgroundDetails` nao estava populado quando `renderBgSpellChoices` era chamado. A solucao foi adicionar fallbacks de seguranca, mas a causa raiz (carregamento assincrono de dados) ainda precisa ser tratada.

**Arquivos modificados:**
- `app.js:750` - fallback `|| []` em `backgroundSpellChoiceRules()`
- `app.js:1829` - fallback `|| []` em `createMagicInitiateSpellRules()`
- `src/app/builder-renderers.js` - export `renderBgSpellChoice` e `renderBgSpellChoices`
- `src/app/builder/background-spell-renderer.js` - adicionada funcao `renderBgSpellChoice`
- `backend/src/main.ts` - CORS para localhost:5173

**Proximos passos:**
1. Investigar por que ability points nao estao salvos no state
2. Verificar se `handleMoveClick` em `creation-event-handlers.js` esta correto
3. Validar se `state.api.source` esta populado antes da renderizacao
4. Testar fluxo completo: Origem → Background → Abilities → Choices → Leveling

---

## Bug de renderizacao do formulario de criacao de personagem

**Data:** 2026-05-11

**Problema:** A tela de "Criador de Ficha" (origem, background, etc.) aparecia em branco, mesmo com o backend carregando dados corretamente.

**Causa raiz:** A funcao `renderForm()` em `src/app/app-shell.js` chamava as funcoes de renderizacao (`renderLineageForm()`, `renderAbilitiesForm()`, etc.) mas **nao inseria o HTML retornado no DOM**. O retorno das funcoes era descartado.

**Solucao:** Modificar `renderForm()` para capturar o HTML retornado e inserir via `els.form.innerHTML`:

```javascript
function renderForm() {
 const state = getState();
 if (state.builderVisible === false) return;
 let html = '';
 if (state.step === 'lineage') html = renderLineageForm();
 else if (state.step === 'abilities') html = renderAbilitiesForm();
 else if (state.step === 'choices') html = renderChoicesForm();
 else if (state.step === 'background') html = renderBackgroundForm();
 else if (state.step === 'leveling') html = renderLevelingForm();
 if (html) els.form.innerHTML = html;
}
```

**Arquivos envolvidos:**
- `src/app/app-shell.js` - funcao `renderForm()`
- `src/core/state/builder-views.ts` - funcoes de render (`renderLineageForm`, `renderAbilitiesForm`, etc.)
- `app.js` - elemento `els.form = document.querySelector("#builderForm")`

**Licao:** Funcoes de render que retornam HTML devem ter seu retorno explicitamente inserido no DOM. Sempre verificar se o valor retornado por funcoes de renderizacao esta sendo usado.

**Como diagnosticar no futuro:**
1. Se a tela de criacao estiver em branco, verificar se `els.form.innerHTML` esta sendo atribuido
2. Inspecionar o retorno das funcoes `render*Form()` no console
3. Verificar se `state.step` corresponde ao esperado ('lineage', 'abilities', 'choices', 'background', 'leveling')
4. Verificar se `state.builderVisible` nao esta `false`

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

## Migração para CSS Modules (2026-05-12)

**Status:** ✅ CONCLUÍDO - Todos os componentes do frontend migrados para CSS Modules.

**O que foi feito:**
1. Conversão do arquivo global `index.css` (~2700 linhas) em múltiplos arquivos `.module.css`.
2. Adoção da convenção **camelCase** para classes CSS (ex: `.builderPanel` em vez de `.builder-panel`).
3. Refatoração de todos os componentes em `src/components` (UI, Layout, Builder, Sheet) e `src/pages`.
4. Utilização da biblioteca `clsx` para gerenciamento de classes condicionais integradas aos módulos.
5. Limpeza do `index.css`, mantendo apenas variáveis `:root`, resets globais e utilitários compartilhados (`.primary-button`, `.field`, etc.).

**Lição aprendida:**
- **Encapsulamento:** CSS Modules eliminam conflitos de nomes de classes entre componentes, permitindo usar nomes genéricos como `.container` ou `.wrapper` sem medo de efeitos colaterais.
- **CamelCase no JS:** Usar camelCase nas classes CSS torna o acesso no React muito mais natural (`styles.myClass`) e limpo do que a sintaxe de colchetes (`styles['my-class']`).
- **Migração em Massa:** O uso de subagentes para processar grandes volumes de CSS e componentes é extremamente eficiente, mas exige uma revisão cuidadosa em componentes que compartilham classes globais intencionalmente.
- **Preparação para Tailwind:** Organizar o CSS em módulos facilita uma futura migração para Tailwind ou outras ferramentas de utilitários, pois o escopo de cada componente já está bem definido.
