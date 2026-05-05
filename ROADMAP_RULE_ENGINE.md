# Roadmap: Rule Engine & Character Assistant

Este guia registra um caminho incremental para evoluir o app de ficha atual para um motor de regras modular para D&D 2024/5.5e, sem exigir uma reescrita completa logo no inicio.

## Fase 1: Rule Engine minimo

Objetivo: separar as regras calculaveis da interface atual.

- Criar modulos puros de engine, ainda que o app continue estatico.
- Criar um `RuleRepository` para carregar e indexar os JSONs de regras.
- Criar um modelo de `CharacterState` para representar a ficha salva.
- Criar uma funcao de projecao, como `deriveCharacterSheet(character, rules)`, para calcular a ficha final.
- Implementar um avaliador de formulas para expressoes como `8 + @prof + @str_mod`.
- Adicionar validacao basica dos contratos JSON de regras.

Resultado esperado: a UI deixa de conhecer parte das regras e passa a renderizar dados derivados pelo core.

## Fase 2: Inventario e modificadores

Objetivo: transformar itens equipados, attuned e condicoes em modificadores ativos.

- Modelar modificadores em JSON, por exemplo bonus em AC, saves, ataques ou skills.
- Fazer equipamentos emitirem modificadores quando estiverem no status correto.
- Recalcular AC, ataques, saves e skills a partir de uma camada de modificadores ativos.
- Preparar suporte a itens magicos, armaduras, escudos, armas e condicoes.
- Substituir gradualmente logicas especificas por uma regra geral de modificadores.

Resultado esperado: equipar ou desequipar um item altera automaticamente a ficha projetada.

## Fase 3: Action Engine

Objetivo: gerar a lista de acoes disponiveis a partir das regras e do estado do personagem.

- Criar uma funcao como `deriveAvailableActions(character, rules)`.
- Combinar armas, magias, features, condicoes e recursos em uma lista unica de acoes.
- Cada acao deve informar custo, alcance, ataque/DC, dano, recurso consumido e efeitos possiveis.
- A UI deve apenas renderizar os botoes e estados retornados pela engine.
- Desabilitar acoes automaticamente quando faltarem slots, charges, usos ou economia de acao.

Resultado esperado: a aba de acoes vira um console de combate derivado do motor de regras.

## Fase 4: Event Sourcing gradual

Objetivo: registrar mudancas importantes como eventos para permitir historico, undo e combate mais confiavel.

- Comecar pelos eventos de combate: dano, cura, temporary HP, uso de recurso, descanso e condicoes.
- Manter a ficha atual como estado salvo inicialmente, usando eventos para projetar partes dinamicas.
- Adicionar suporte a undo para eventos recentes de combate.
- Evoluir depois para eventos de inventario, ouro, level up e escolhas permanentes.
- Recalcular HP atual, recursos usados e condicoes temporarias a partir do ledger quando fizer sentido.

Resultado esperado: o app passa a saber nao so o estado atual, mas tambem como ele chegou la.

## Observacao de arquitetura

O caminho recomendado e incremental. Primeiro cria-se um core derivado pequeno, depois os modificadores, em seguida o action engine, e so entao o event sourcing completo. Isso evita transformar uma melhoria de arquitetura em uma reescrita grande demais antes de gerar valor na ficha atual.
