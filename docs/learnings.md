
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
