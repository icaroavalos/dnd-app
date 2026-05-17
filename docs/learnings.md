
## Confirmação de Descansos (2026-05-15)

**Status:** ✅ CONCLUÍDO - Adicionada camada de segurança para Short e Long Rest.

**O que foi feito:**
1. Implementada interface de confirmação para os botões de descanso na aba 'Resumo'.
2. **Lógica de Estado Único:** Apenas um diálogo de confirmação (Level Up, Short Rest ou Long Rest) pode estar aberto por vez. Abrir um fecha automaticamente o outro.
3. **Identidade Visual:** Os botões de confirmação mantêm as cores originais da ação (Teal para Curto, Rose para Longo), enquanto o botão de cancelamento é neutro, seguindo o padrão do sistema.

**Lição aprendida:**
- **Prevenção de Erros:** Ações destrutivas ou de reset total de recursos (como descansos) devem sempre ter uma etapa de confirmação para evitar cliques acidentais que prejudiquem o fluxo do jogo.
