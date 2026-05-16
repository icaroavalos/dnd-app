# Learnings

Ultima revisao: 2026-05-13.

## Correção de Estabilidade no Level Up e Magias de Background (2026-05-13)

**Status:** ✅ CORRIGIDO - Sistema de evolução e talentos de origem estabilizados.

**Problemas corrigidos:**
1. **Crash (Tela Preta) no Level Up:** O `LevelUpModal` estava falhando ao renderizar porque o componente `RuleText` não estava importado e não havia verificações de segurança (`null checks`) para as listas de escolhas e features.
2. **Perda de Magias no Magic Initiate:** O componente `MagicInitiate` estava falhando ao adicionar a magia de nível 1 à ficha porque o filtro de tipos (0 vs '0') era inconsistente com os dados da API e faltavam IDs estáveis para as magias selecionadas.
3. **Mapeamento de Subclasses:** Refinado o sistema de extração de nomes curtos de subclasses (ex: "Path of the Berserker" -> "Berserker") para garantir que apenas as habilidades da subclasse escolhida apareçam na lista de evolução.

**Lições aprendidas:**
- **Import Vigilance:** Sempre verifique se componentes utilitários (como `RuleText`) estão importados ao refatorar telas complexas.
- **Defensive Rendering:** Use valores default (`choices = []`, `selections = {}`) ao desestruturar objetos vindos de stores assíncronos para evitar crashes de "undefined".
- **Data Type Consistency:** APIs de dados externos (como 5etools) podem misturar números e strings para níveis (ex: `0` e `"0"`). Os filtros devem tratar ambos os casos.
- **Stable IDs:** Use sempre IDs únicos ou normalize nomes para gerar chaves estáveis ao adicionar itens dinâmicos (como magias de talentos) para evitar problemas de reconciliação no React.

---

## Falhas na Refatoração do Construtor e Tratamento de Dados (2026-05-12)

**Status:** ❌ REGRESSÕES DETECTADAS - Corrigindo múltiplos problemas de integridade de dados e UX.

**Problemas detectados:**
1. **Filtro de Magias Quebrado:** A filtragem por classe no talento *Magic Initiate* falhou porque a API de `/rules/spells` não contém o campo `classes`. É necessário cruzar com `/rules/class-spells`.
2. **Equipamento sem Detalhes:** A interface comparativa de equipamentos mostrou "Equipamento padrão" em vez do conteúdo real, devido a falhas no parser de strings complexas do 5etools (ex: split por `;` falhando em formatos aninhados).
3. **Atributos de Background não somados:** Os bônus de background (+2/+1) foram salvos mas não refletidos no cálculo de modificadores da ficha lateral devido a caminhos de estado inconsistentes no store.
4. **Habilidades sem Descrição:** Algumas habilidades exibiram "No description available" porque o parser não lidou corretamente com o campo `entries` em todos os níveis de aninhamento.
5. **Weapon Mastery não detectado:** A lógica de detecção automática de escolhas via regex foi muito frágil para capturar variações no texto das habilidades de nível 1.
6. **Overflow de Texto:** Descrições longas na aba de Habilidades "estouraram" o container visual.

**Soluções planejadas:**
- Implementar cruzamento de dados para filtros de classe.
- Refinar `parse5eEntry` para lidar com fallbacks e recursão profunda.
- Unificar o estado de atributos no store para garantir reatividade total.
- Adicionar `break-words` e scrollbars em containers de texto longo.
- Tornar a detecção de escolhas mais robusta (fallback para keywords).

---

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
---

## Integridade de HP e Regras de Atributos (2026-05-12)

**Status:** ✅ CORRIGIDO - Lógica de HP e unicidade de atributos estabilizada.

**Problemas corrigidos:**
1. **Bug do HP "5/5":** Ao tomar dano, a vida máxima da ficha lateral "encolhia" junto com a vida atual. Isso ocorria porque o hook `useDerivedState.ts` estava derivando `maxHp` a partir de `character.hp` (atual) em vez de `character.maxHp`.
2. **Standard Array Duplicado:** O sistema permitia selecionar o mesmo valor (ex: 15) para múltiplos atributos, violando a regra de "um valor por atributo".
3. **Hit Dice Inconsistente:** Algumas classes não inicializavam com o dado de vida correto ou falhavam no lookup por diferença de maiúsculas/minúsculas (ex: "barbarian" vs "Barbarian").

**Lições aprendidas:**
- **Estado Derivado vs Persistido:** Nunca use um estado volátil (como HP atual) para derivar um limite máximo. Mantenha `hp` e `maxHp` como campos distintos e independentes no store.
- **Normalização de Chaves:** Ao fazer lookups em mapas (ex: `CLASS_HIT_DIE`), sempre normalize a chave para lowercase para evitar falhas silenciosas de dados vindos da API ou input do usuário.
- **Unicidade na UI:** Para seleções exclusivas (Standard Array), a UI deve refletir o estado global. Desabilitar opções `isUsed` nos dropdowns é mais claro para o usuário do que validações de erro após a escolha.
- **Cálculo de HP de Nível 1:** O HP inicial deve ser explicitamente calculado na finalização (`CreatorPage.tsx`) somando o valor máximo do dado da classe + modificador de CON (incluindo bônus de background).

### Escalabilidade de Regras e Level Up (2026-05-12)

**Problemas corrigidos:**
1. **Falha na Subclasse de Guerreiro:** O sistema não oferecia escolha de subclasse para Fighter no Nível 3, pois o parser dependia de nomes específicos (ex: "Path") e ignorou o nome genérico "Fighter Subclass".
2. **Expertise e Fighting Styles:** Habilidades que exigem seleções complexas (como Expertise de Ladino ou Estilos de Luta) estavam sendo tratadas como habilidades passivas simples.

**Lições aprendidas:**
- **Generalização Total:** Nunca confie apenas em strings de nomes para decisões de regras. Use o nível (`level === 3`) e categorias estruturais do catálogo como gatilhos primários para escolhas universais (como Subclasse).
- **Mapeamento de Metadados via Backend:** Em sistemas "Data-Driven", o backend deve traduzir as inconsistências do dataset (ex: "Fighter Subclass" vs "Martial Archetype") em tipos de escolhas padronizados (`subclass`, `expertise`, `feat`) para o frontend.
- **Validação Cruzada:** Ao implementar uma feature "universal", valide-a em classes com nomenclaturas e progressões diferentes (ex: Fighter vs Rogue vs Wizard) para garantir que o parser cubra todas as variações semânticas.
- **Tratamento de Já Possuídos:** Perícias ganhas via Level Up devem ser validadas contra o estado atual da ficha para evitar duplicidade, marcando-as como "Já possui" na UI.

**Mapeamento de Dados de Vida (Hit Die):**
- **D12:** Barbarian
- **D10:** Fighter, Paladin, Ranger
- **D8:** Bard, Cleric, Druid, Monk, Rogue, Warlock
- **D6:** Sorcerer, Wizard

---

## Unificação Total para Tailwind CSS (2026-05-12)
**Status:** ✅ CONCLUÍDO - 100% do app migrado para Tailwind.

**O que foi feito:**
1. Refatoração de todos os componentes (UI, Layout, Builder, Sheet) e Páginas, removendo o uso de CSS Modules.
2. Exclusão definitiva de todos os arquivos `.module.css`.
3. Implementação do helper `cn` (utilizando `clsx` e `tailwind-merge`) em `src/lib/utils.ts` para gerenciamento robusto de classes dinâmicas.
4. Refatoração do `index.css` utilizando `@layer base` para resets e `@layer components` para componentes globais reutilizáveis (`.primary-button`, `.field`, etc.).

**Lição aprendida:**
- **Single Source of Truth:** Ter um único sistema de estilos (Tailwind) elimina o overhead mental de decidir onde colocar um estilo e evita conflitos entre diferentes metodologias (CSS Modules vs Global).
- **Manutenibilidade:** A unificação permite mudanças visuais globais muito mais rápidas e garante que novos desenvolvedores (ou agentes) tenham um padrão claro a seguir.
- **Desenvolvimento Component-First:** Tailwind incentiva a criação de componentes pequenos e bem definidos, o que combina perfeitamente com a filosofia do React.
- **Helper `cn`:** O uso do helper `cn` é indispensável em projetos React com Tailwind para evitar problemas de especificidade ao sobrescrever classes utilitárias.

## Integração de Tailwind CSS (2026-05-12)

**Status:** ✅ CONCLUÍDO - Tailwind configurado e validado no CharacterMenu.

**O que foi feito:**
1. Configuração do ecossistema Tailwind no frontend (`postcss`, `autoprefixer`).
2. Implementação do `CharacterMenu` utilizando exclusivamente classes utilitárias.
3. Integração das diretivas Tailwind no `index.css` existente.

**Lição aprendida:**
- **Coexistência:** Tailwind pode coexistir perfeitamente com CSS Modules. Para componentes estruturais ou de layout global (como menus), o Tailwind oferece uma agilidade muito superior para prototipação e design responsivo.
- **Transição Suave:** Iniciar o uso do Tailwind em novos componentes enquanto se mantém CSS Modules para componentes estáveis é uma estratégia de migração segura que evita o custo de refatoração massiva imediata.

## Implementação de Backgrounds D&D 2024 (2026-05-12)

**Status:** ✅ CONCLUÍDO - Lógica de escolhas originárias integrada ao Builder.

**O que foi feito:**
1. Mapeamento das regras de Aumento de Atributo (ASI) dos novos backgrounds (padrões +2/+1 e +1/+1/+1).
2. Renderização dinâmica de bônus permitidos baseada nos dados do `5etools` (ex: Acolyte permite apenas INT, SAB, CAR).
3. Detecção de Talentos de Origem (Feats) e vinculação com a escolha de atributo de conjuração (*Spellcasting Ability*).
4. Persistência de escolhas complexas no store do Zustand (`bgChoices`).

**Lição aprendida:**
- **Flexibilidade de Dados:** O formato de dados de 2024 é mais granular que o anterior. Ter um tipo de dado `bgChoices` genérico no início facilitou a expansão para incluir o padrão de incremento (`abilityIncrement`) sem quebrar a interface do store.
- **UX em Etapas:** Bloquear a seleção de magias do talento *Magic Initiate* até que o atributo de conjuração seja escolhido evita estados inválidos na ficha e melhora a clareza para o usuário.
- **Isolamento de Estilos:** O uso de CSS Modules permitiu criar uma interface de seleção de atributos ("badges" clicáveis) específica para o background sem afetar outros seletores de atributos no app.

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

## Persistência de Dados ao Trocar de Personagem (2026-05-15)

**Status:** ✅ CONCLUÍDO - Corrigida a perda de magias e escolhas de background ao carregar fichas.

**Problema:**
Ao trocar de personagem através do `CharacterMenu`, campos específicos como `bgSpellChoices` (escolhas de magias do background) e `spellSlots` (estado atual dos slots) eram perdidos. Isso ocorria porque a ação `setCharacter` no store do Zustand não mapeava explicitamente esses campos do registro vindo do backend para o estado local, resultando em valores resetados para o padrão vazio.

**O que foi feito:**
1. Atualizada a ação `setCharacter` em `useCharacterStore.ts` para incluir o mapeamento de `bgSpellChoices` e `spellSlots`.
2. **Correção Crítica no Backend:** Refatorado o método `update` (e `create`) em `CharactersStorageService.service.ts` para utilizar o operador *spread* (`...dto`), garantindo que campos como `spells`, `features` e outros dados dinâmicos não sejam descartados durante o salvamento.
3. Adicionado um botão "SALVAR FICHA ATUAL" no `CharacterMenu.tsx` para permitir que o usuário persista mudanças feitas na ficha antes de trocar de personagem.
4. Validada a persistência total através de testes automatizados E2E com Playwright.

**Lição aprendida:**
- **Mapeamento Explícito:** Ao trabalhar com uma estrutura de dados complexa como a ficha de personagem, qualquer novo campo adicionado ao tipo `Character` deve ser revisado em três lugares: tipagem (`character.ts`), mapeamento de carga (`setCharacter`) e mapeamento de salvamento (`CreatorPage.tsx` ou similar).
- **Feedback de Sincronização:** Prover um botão de salvamento explícito no menu de navegação melhora a confiança do usuário de que suas alterações não serão perdidas ao navegar entre múltiplas fichas.

## Detecção de Recursos e Multiplicadores (2026-05-15)

**Status:** ✅ CORRIGIDO - Sistema de detecção de usos de habilidades refinado.

**Problema:**
Habilidades como 'Healing Hands' do Aasimar exibiam 2 usos em vez de 1. A causa era um falso positivo na detecção de 'proficiency' no texto descritivo. O parser identificava a palavra 'proficiency' (usada para descrever o efeito, ex: 'd4s iguais ao bônus de proficiência') e assumia que o *número de usos* era igual à proficiência, em vez de respeitar a cláusula 'Once you use this trait' (uma vez).

**O que foi feito:**
1. Atualizada a lógica em `data-parser.ts` (`parseResourceInfo`) para priorizar a detecção de 'once' (uma vez) e 'twice' (duas vezes) antes de checar por escalonamento de proficiência.
2. Invertida a ordem de precedência: se o texto contém 'once you use this', o limite é fixado em 1 uso, mesmo que o termo 'proficiency' apareça no restante da descrição.

**Lição aprendida:**
- **Precedência de Regras:** No D&D 2024, palavras de efeito (como proficiência) aparecem frequentemente em descrições de dano ou cura. A detecção de recursos deve sempre priorizar frases que definem a *quantidade de ativações* (Once, Twice, Proficiency times) de forma hierárquica, do mais específico para o mais genérico.
- **Falsos Positivos:** Evite regex gananciosas. Se uma habilidade diz 'uma vez por descanso longo', esse é o limite canônico, independentemente de qualquer escalonamento numérico mencionado no efeito da habilidade.

## Sincronização de Magias concedidas por Habilidades (2026-05-15)

**Status:** ✅ CONCLUÍDO - Magias de raça e talentos agora aparecem automaticamente na ficha.

**Problema:**
Habilidades como 'Light Bearer' do Aasimar concedem magias (ex: `Light`), mas estas não apareciam na aba de magias da ficha. O sistema esperava que magias fossem adicionadas manualmente ou via seletor de classe/talento.

**O que foi feito:**
1. Implementada a função `extractSpells` em `data-parser.ts` que identifica magias em textos descritivos usando tags do 5etools (`{@spell Name}`).
2. Atualizada a ação `setFeaturesByKind` no store para realizar o "auto-discovery" de magias sempre que novas habilidades são adicionadas à raça ou classe.
3. Adicionado suporte para detectar limites de uso nestas magias (ex: "cast once without a spell slot") usando o parser de recursos existente.
4. Integrado o catálogo completo de magias no store para permitir a hidratação correta dos dados da magia descoberta.

**Lição aprendida:**
- **Dados Relacionados:** Em sistemas de RPG, uma entidade (Habilidade) frequentemente aponta para outra (Magia). O sistema deve ser capaz de seguir essas referências automaticamente para garantir a completude da ficha.
- **Centralização de Sync:** Realizar a sincronização no momento em que as habilidades são definidas (`setFeaturesByKind`) garante que a aba de magias esteja sempre atualizada, independentemente de como a habilidade foi adquirida (Builder ou Level Up).

## Filtro de Habilidades por Nível (2026-05-15)

**Status:** ✅ CONCLUÍDO - Habilidades de raça agora respeitam o nível do personagem.

**Problema:**
Traços raciais que só são desbloqueados em níveis superiores (ex: 'Celestial Revelation' do Aasimar no nível 3) apareciam na ficha desde o nível 1. Como o JSON do 5etools embutia essa restrição no texto e não em metadados, o sistema não conseguia filtrar automaticamente.

**O que foi feito:**
1. Implementada detecção inteligente via Regex na ação `setFeaturesByKind` do store.
2. O sistema agora varre a descrição das habilidades em busca de padrões como 'reach character level X' ou 'At level X'.
3. Se uma habilidade exige um nível superior ao atual do personagem, ela é ocultada da ficha.

**Lição aprendida:**
- **Parsing de Texto como Regra:** Quando a estrutura de dados não é granular o suficiente, o texto descritivo torna-se a 'fonte da verdade'. Regex robustas são essenciais para extrair mecânicas de jogo de descrições narrativas.
- **Progressão Natural:** Ocultar recursos futuros evita confusão na UI e mantém o foco do jogador no que ele pode realmente usar no momento.

## Sistema de Equipamento e Cálculo de CA (2026-05-15)

**Status:** ✅ CONCLUÍDO - Itens agora podem ser equipados e influenciam a ficha.

**O que foi feito:**
1. **Botão Equipar Direto:** Adicionado um botão "EQUIPAR" visível diretamente na linha do item no inventário para armaduras, escudos e armas.
2. **Cálculo de Classe de Armadura (CA):** Atualizado o hook `useDerivedState.ts` para calcular dinamicamente a CA baseada na armadura e escudo equipados, seguindo as regras de D&D 2024 (ex: Limite de bônus de Destreza para armaduras médias).
3. **Integração com Ações:** Itens marcados como equipados em "Mão Principal" ou "Mão Secundária" são enviados ao backend, que agora gera automaticamente as ações de ataque correspondentes na aba de Ações.
4. **Persistência de Status:** O campo `status` de cada item no inventário é preservado, garantindo que a ficha mantenha o estado de equipamento entre sessões.

**Lição aprendida:**
- **Feedback Visual Imediato:** Mover o cálculo de CA para o frontend (replicando a lógica do backend) proporciona uma experiência muito melhor para o usuário, que vê sua CA mudar instantaneamente ao clicar em equipar.
- **Heurística de Equipamento:** Implementar uma lógica inteligente para o botão "EQUIPAR" (detectando se é arma, armadura ou escudo pelo tipo do item) reduz cliques e torna a ficha mais intuitiva.
