
## Confirmação de Descansos (2026-05-15)

**Status:** ✅ CONCLUÍDO - Adicionada camada de segurança para Short e Long Rest.

**O que foi feito:**
1. Implementada interface de confirmação para os botões de descanso na aba 'Resumo'.
2. **Lógica de Estado Único:** Apenas um diálogo de confirmação (Level Up, Short Rest ou Long Rest) pode estar aberto por vez. Abrir um fecha automaticamente o outro.
3. **Identidade Visual:** Os botões de confirmação mantêm as cores originais da ação (Teal para Curto, Rose para Longo), enquanto o botão de cancelamento é neutro, seguindo o padrão do sistema.

**Lição aprendida:**
- **Prevenção de Erros:** Ações destrutivas ou de reset total de recursos (como descansos) devem sempre ter uma etapa de confirmação para evitar cliques acidentais que prejudiquem o fluxo do jogo.

## Correção do Reset de Nível (2026-05-15)

**Status:** ✅ CORRIGIDO - Personagem não volta mais para o nível 1 ao recarregar a ficha.

**Problema:**
Ao realizar o Level Up, o nível geral da ficha (`character.level`) era incrementado corretamente, mas o array interno de classes (`character.classes`) continuava travado no nível 1. Como a API de salvamento (`saveCharacter`) e o processo de hidratação do backend priorizam o array de classes para reconstruir o personagem, o frontend acabava recarregando a ficha no nível base.

**O que foi feito:**
1. Atualizada a função `finalizeLevelUp` em `useCharacterStore.ts` para mapear e incrementar o nível da classe principal dentro do array `classes`.
2. Essa mudança não apenas corrige o bug atual de persistência, mas também prepara o terreno (data structure) para uma futura implementação de Multiclasse, onde cada objeto no array terá seu próprio nível independente.

**Lição aprendida:**
- **Fontes de Verdade Duplas:** Evite ter o mesmo dado (nível) representado em dois lugares diferentes (`level` global vs `level` no array de classes) sem uma rotina estrita de sincronização. Sempre que possível, o dado global deve ser um estado derivado (soma dos níveis das classes).

## Requisitos da Funcionalidade de Level Up (2026-05-15)

**Status:** 📋 PLANEJADO - Definição de escopo concluída via entrevista com o usuário.

**Diretrizes de Implementação:**
1. **Arquitetura de Multiclasse:** O sistema deve manter o array `classes` sempre sincronizado, permitindo que novas classes sejam adicionadas no futuro, embora o foco atual seja progressão linear.
2. **Automatização de ASI/Feats:** Níveis que concedem Aumento de Atributo ou Talentos (4, 8, 12, etc.) devem obrigatoriamente incluir uma etapa de seleção no fluxo de Level Up.
3. **Incremento de HP Guiado:** Ao subir de nível, o usuário deve poder escolher entre a média fixa ou rolar o dado. O sistema deve validar e travar o valor máximo permitido (Dado de Vida + Mod. de Constituição).
4. **Gestão de Magias Conhecidas:** Classes conjuradoras devem ter uma etapa dedicada para escolher novas magias, filtrando pelo nível de slot recém-desbloqueado.
5. **Estética Consistente:** A ficha deve manter sua identidade visual padrão (neutra), independente da subclasse escolhida no nível 3.

**Ações Imediatas:**
- Iniciar o desenvolvimento da UI para a etapa de HP Guiado.
- Criar o seletor de magias específico para o contexto de Level Up.

## Controle Interativo de Magias e Slots (2026-05-17)

**Status:** ✅ CONCLUÍDO - Interface estilo D&D Beyond implementada.

**Problema:**
A interface de slots de magia dependia exclusivamente da projeção do backend. Personagens recém-criados no frontend ficavam com os slots "zerados" visualmente até que uma sincronização completa ocorresse, resultando em uma UI vazia para novos Magos e clérigos.

**O que foi feito:**
1. **Cálculo Derivado no Frontend:** Implementado `spell-utils.ts` com as tabelas de progressão de magias (Full, Half e Pact Magic). O hook `useDerivedState.ts` agora calcula o máximo de slots em tempo real.
2. **UI Interativa:** Adicionados quadrados clicáveis no cabeçalho de cada nível de magia. Clicar em um quadrado marca o uso sequencial (esquerda para direita).
3. **Resiliência a Erros de Sintaxe:** Corrigido erro de parênteses/chaves extras no `useCharacterStore.ts` que travava o build do Vite. Identificada a importância de verificar o fechamento de objetos em stores complexos antes de salvar.

**Lição aprendida:**
- **Derivação Local vs Remota:** Dados de regras que afetam a visibilidade imediata da UI (como slots de magia) devem ser calculados localmente via "Derived State". O backend deve servir apenas como autoridade de persistência e validação final, não como única fonte de renderização.
- **Atomicidade no Store:** Ao editar arquivos grandes como `useCharacterStore.ts`, realizar mudanças cirúrgicas e garantir que os blocos de exportação e inicialização (Zustand/Window exposure) permaneçam íntegros para evitar quebras silenciosas no HMR.

## Evolução de Personagem: ASI e Talentos (2026-05-17)

**Status:** ✅ CONCLUÍDO - Implementado sistema de escolhas para Nível 4+.

**O que foi feito:**
1. **Lógica de Escolha Dual:** Implementado seletor de "Caminho de Evolução" (ASI vs Talentos) com exclusão mútua.
2. **Cálculo de Atributos Histórico:** Em vez de somar bônus diretamente no valor base, as escolhas são armazenadas em `character.asiChoices[level]`. Isso permite reconstruir a ficha fielmente e evita erros de "double counting".
3. **Validação de Requisitos (Feats):** Implementado validador estrito que verifica Nível, Atributos Mínimos e Características Prévias antes de permitir a seleção de um talento.
4. **Descoberta de Bug de Referência:** Identificado que o `finalizeLevelUp` falhava silenciosamente porque a variável `choices` não estava sendo desestruturada corretamente do `pendingLevelUp`, interrompendo o ciclo de vida do modal.

**Lições aprendidas:**
- **Imutabilidade do Histórico:** Armazenar escolhas por nível (`asiChoices: { "4": { "str": 2 } }`) é superior a modificar atributos base, pois mantém a rastreabilidade da ficha.
- **Ambivalência de IDs:** IDs de escolhas vindos do backend (ex: `asi-undefined`) devem ser tratados com cautela no frontend; preferir IDs semânticos gerados ou mapeados quando possível.
- **Timing de Teste E2E:** Em SPAs sem persistência automática no reload (stateless), testes Playwright que realizam `page.reload()` devem sempre re-selecionar o registro ativo para restaurar o estado da aplicação.

## Arquitetura de Persistência e Ciclo de Vida (2026-05-17)

**Status:** ✅ RESOLVIDO - Persistência movida para o Layout Global.

**Problema:**
A lógica de auto-save estava vinculada ao componente `SheetPage.tsx`. Quando o usuário realizava uma ação (como Level Up) e navegava rapidamente para outra página (ou trocava de personagem), o componente era desmontado antes que o temporizador de debounce (2s) disparasse, cancelando o salvamento e causando perda de dados (o personagem voltava ao nível anterior).

**O que foi feito:**
1. **Centralização da Persistência:** Movi o `useEffect` de auto-save de `SheetPage.tsx` para `AppLayout.tsx`. Como o Layout envolve todas as rotas, ele permanece montado durante toda a sessão, garantindo que o ciclo de salvamento nunca seja interrompido por navegação.
2. **Redução de Latência:** O debounce foi reduzido de 2000ms para 1000ms para aumentar a responsividade do salvamento.
3. **Feedback Imediato:** O estado `isSaving` agora é definido como `true` no momento em que a mudança é detectada, e não apenas quando o cronômetro dispara. Isso fornece um sinal confiável para testes E2E e para a UI (bloqueando ações destrutivas enquanto salva).

**Lição aprendida:**
- **Lógica Transversal em Componentes Persistentes:** Funcionalidades que afetam a integridade dos dados (como sincronização com backend) nunca devem residir em componentes de "página" que podem ser desmontados. Elas pertencem a Layouts globais ou Provedores de Contexto.
- **Velocidade de Teste vs Usuário:** Testes automatizados (Playwright) expõem race conditions que humanos raramente notariam, pois operam em velocidades de milissegundos. Se um teste falha intermitentemente, a causa provável é uma dependência temporal ou de montagem de componente.

## Padronização da Estrutura de Classes e Nível (2026-05-15)

**Status:** ✅ CONCLUÍDO - Estrutura de dados unificada para garantir persistência.

**Problema:**
Mesmo após correções parciais, o nível do personagem continuava sendo resetado. Descobriu-se que a estrutura `classes` (um array de objetos) era a fonte da verdade para o backend, mas ela não existia formalmente na interface `Character` do frontend nem era inicializada corretamente no store. Isso fazia com que o array fosse enviado vazio ou inconsistente durante o auto-save.

**O que foi feito:**
1. **Tipagem Oficial:** Adicionado o campo `classes` à interface `Character` em `character.ts`.
2. **Inicialização:** O store agora garante que `classes` comece como um array vazio e seja populado imediatamente ao escolher a classe no Builder (`ClassSelect.tsx`).
3. **Mapeamento de Carga:** A ação `setCharacter` foi blindada para priorizar o nível e o array de classes vindos do `recordJson`, garantindo que personagens de nível alto sejam restaurados com precisão.
4. **Sincronização no Level Up:** A função `finalizeLevelUp` agora atualiza obrigatoriamente tanto o nível global quanto o nível dentro do array de classes.

**Lição aprendida:**
- **Contratos de Dados:** Quando o backend e o frontend compartilham a responsabilidade de reconstruir um objeto complexo, a estrutura desse objeto deve ser idêntica e obrigatória em ambos os lados. Campos opcionais ou omitidos em um lado são a causa número 1 de bugs de persistência.

## Prevenção de Corrupção de Arquivos (2026-05-17)

**Status:** ⚠️ ALERTA - Corrupção de sintaxe em `SpellsTab.tsx` por concorrência de edição.

**Problema:**
O agente tentou realizar múltiplas edições (`replace`) no mesmo arquivo (`SpellsTab.tsx`) dentro do mesmo turno de processamento. Isso gerou uma race condition na ferramenta de edição, resultando em um arquivo corrompido com blocos de código duplicados e texto "sujo" ao final do arquivo, o que travou o servidor de desenvolvimento do Vite.

**O que foi feito:**
1. **Recuperação Manual:** O arquivo `SpellsTab.tsx` foi sobrescrito com a versão correta e higienizada.
2. **Auditoria de Importações:** Verificado se o `getSpellOrigin` e outras dependências foram mantidas.

**Lição aprendida:**
- **Atomicidade de Edição:** NUNCA realize múltiplos `replace` no mesmo arquivo em um único turno. As edições devem ser sequenciais, esperando o sucesso da primeira antes de iniciar a segunda em um novo turno, ou consolidadas em um único `write_file` caso o arquivo seja pequeno o suficiente. Race conditions em ferramentas de edição são destrutivas para a integridade do código.
- **Validação Pós-Edição:** Sempre rodar `npm run typecheck` ou observar o log do `npm run dev` após edições complexas para garantir que a árvore sintática (AST) não foi quebrada.

