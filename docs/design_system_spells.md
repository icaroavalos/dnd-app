# Design System: Spell Cards (D&D 2024)

Este documento define o padrão visual e funcional para a exibição de magias no aplicativo, seguindo o briefing de Design 2024.

## 1. Estrutura Visual (Anatomia da Carta)

A carta é dividida em seções modulares para garantir densidade de informação sem poluição visual.

### A. Cabeçalho (Header)
- **Nome**: Fonte em negrito (Display), destaque total.
- **Subtítulo**: Nível e Escola (ex: "3º Nível - Evocação").
- **Tags Rápidas**: Ícones no topo para Concentração (C) e Ritual (R).

### B. Power Box (Stats Rápidos)
Grade 2x2 contendo:
- **Casting Time**: 1 Ação, Bônus, Reação, etc.
- **Range**: Alcance ou área de efeito.
- **Components**: V, S, M (com ícones ou abreviações claras).
- **Duration**: Tempo de duração da magia.

### C. Bloco de Defesa/Ataque
Campo de destaque imediato indicando:
- **Ataque de Magia** (Spell Attack)
- **Teste de Resistência** (ex: "DEX Save")

### D. Descrição e Materiais
- **Material Box**: Texto pequeno descrevendo componentes M, se houver.
- **Corpo do Texto**: Descrição da magia com números de dados (ex: **8d6**) em negrito.
- **At Higher Levels**: Divisor visual para escalonamento.

### E. Rodapé (Footer)
- **Lists**: Arcana, Divina ou Primal.
- **Reference**: Fonte oficial (ex: PHB 2024) e página.

## 2. Cores e Identidade
- **Primária**: Tons de vermelho escuro/vinho para magias (ou cores por escola se preferível).
- **Contraste**: Fundo branco ou creme para o corpo do texto para garantir legibilidade máxima.

## 3. Implementação Técnica
- **Componente**: `SpellCard.tsx`
- **Stack**: React + Tailwind CSS.
- **Dados**: Mapeamento direto do formato `5etools` (entries, school, time, range, components).
