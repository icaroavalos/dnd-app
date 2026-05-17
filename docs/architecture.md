# Architecture Memory

Ultima revisao: 2026-05-16.

> Para onboarding rapido (stack, mapa de arquivos, endpoints), leia `AGENT_CONTEXT.md` primeiro.

## Resumo executivo

O projeto concluiu a migração integral do frontend de uma arquitetura Vanilla JS legada para um ecossistema moderno baseado em **Vite + React + TypeScript**. O backend NestJS + Fastify permanece como a fonte de verdade para regras e persistência via Prisma.

**Atualização 2026-05-14:** 
- **D&D 2024 (XPHB)**: O sistema agora suporta nativamente as novas regras de criação de personagens, incluindo escolhas de nível 1 dinâmicas, escalonamento de recursos em níveis altos e detecção inteligente de magias iniciais.
- **Dynamic Resource System**: Implementado motor de detecção de usos e recuperação baseado em texto (NLP Lite).
- **Strategy Pattern para Descansos**: Refatoração da lógica de recuperação de habilidades para suportar regras incrementais (+1 no Short Rest) sem IFs fixos.

## Decisoes de arquitetura atuais

- **Frontend**: Vite + React + TypeScript + Zustand.
- **Backend**: NestJS + Fastify + Prisma (SQLite).
- **Estilos**: Tailwind CSS com helper `cn` (clsx + tailwind-merge).
- **Datasets**: A fonte canonica de regras é `data/5etools/5e-2024/` via backend.
- **Design System**: Padrão de cartas de magia 2024 em `docs/design_system_spells.md`.

## Melhores Práticas e Lógica de Negócio (D&D 2024)

### 1. Sistema de Escolhas Genéricas (Generic Choice System)
Para lidar com habilidades de nível 1 que exigem escolhas (ex: *Weapon Mastery*), implementamos um motor de detecção baseado em padrões:
- **Funcionamento**: O sistema analisa o texto bruto da habilidade em busca de padrões como "choose X kinds of Y" e gera a UI dinamicamente.
- **Persistência**: As escolhas são armazenadas no `character.classFeatureChoices`, mapeadas pelo ID da habilidade.

### 2. Tratamento Unificado de Dados (Data Parsing)
Criamos a utilidade `frontend/src/lib/data-parser.ts` para resolver o problema de artefatos JSON (`{@item...}`, `{@spell...}`) do 5etools.
- **`clean5eText`**: Remove tags técnicas e mantém apenas o texto legível.
- **`parse5eEntry`**: Processa recursivamente estruturas complexas (listas, tabelas) para garantir descrições amigáveis.

### 3. Atributos de Background e Reatividade
Refatoramos o sistema de bônus de Background para ser explícito:
- **Ordem de Seleção**: No padrão +2/+1, a primeira habilidade clicada recebe +2 e a segunda +1, com badges visuais.
- **Cálculo Derivado**: O hook `useDerivedState.ts` soma em tempo real os bônus de background aos atributos base.

### 4. Interface de Equipamento e Magias
- **Comparação Lado a Lado**: Cartões comparativos para escolha de equipamento inicial A ou B.
- **Restrições de Magia**: O componente `MagicInitiate.tsx` suporta `constraintClass` (ex: Acolyte filtra apenas magias de Cleric).

### 5. Gestão de Vitalidade e Descansos (D&D 2024)
Implementamos o sistema de combate e recuperação baseado nas regras do PHB 2024:
- **Dano e Cura**: Sistema reativo onde o dano consome **Temporary HP antes do HP real** obrigatoriamente.
- **Death Saves**: Interface de sucessos/falhas que aparece automaticamente quando o personagem chega a 0 HP. Receber cura limpa os testes; receber THP a 0 HP fornece proteção mas não estabiliza.
- **Cálculo de HP Retroativo**: Sempre que o modificador de Constituição aumenta (ex: via Talento), o `maxHp` é recalculado para todos os níveis anteriores automaticamente.
- **HP no Level Up**: Agora soma corretamente `Média do Dado de Vida + Modificador de CON`, incluindo bônus vindos de Background.
- **Rages & Second Wind (2024)**: Implementada a recuperação de **+1 uso** no Descanso Curto (Short Rest), em vez de reset total ou nenhum.

### 6. Sistema de Level Up e Hierarquia de Escolhas
Implementamos um fluxo dinâmico e estético para evolução de personagens:
- **Fluxo Hierárquico**: Escolhas críticas (como Subclasse no Nível 3) são priorizadas. 
- **Automatização de Magias**: Novo passo no Criador que gerencia limites de Truques e Magias Preparadas (ex: Wizard 6 magias no Spellbook nível 1).
- **Detecção de Escolhas via Texto**: O sistema agora interpreta frases como "gain proficiency with X skills" para gerar seletores dinâmicos, automatizando recursos como *Bonus Proficiencies* do Bardo da Lore.
- **Talentos Automatizados**: O sistema detecta benefícios fixos de talentos (ex: *Actor* concede +1 Carisma e adiciona sub-habilidades como *Impersonation* e *Mimicry* automaticamente).

### 7. Sistema Dinâmico de Recursos e Recuperação
Substituímos lógicas fixas por uma arquitetura baseada em dados (`Strategy Pattern`):
- **`parseResourceInfo`**: Interpretador que extrai limites de uso (Proficiency Bonus, Multiplicadores de Nível) e regras de recuperação (Reset Total ou Incremento) diretamente da descrição das habilidades.
- **Escalonamento**: Recursos como *Lay on Hands* (5x Nível) e *Indomitable* atualizam seus máximos e disponíveis instantaneamente ao subir de nível.
- **Metadados de Recuperação**: Cada característica agora carrega sua própria estratégia (`full` ou `inc`), permitindo suporte universal a qualquer classe ou espécie sem alteração no código central do Store.
- **Exclusões Inteligentes**: Habilidades como *Primal Knowledge* são filtradas para não exibirem barras de uso desnecessárias.

### 8. Persistência e Sincronização
- **Motor de Auto-save Global**: O `useEffect` de sincronização reside no `AppLayout.tsx`. Isso garante que o salvamento não seja interrompido quando o usuário navega entre rotas ou personagens, pois o Layout permanece montado durante toda a sessão.
- **Ciclo de Salvamento**: Atualmente configurado com um debounce de 1000ms. O estado `isSaving` é definido como `true` imediatamente após qualquer alteração no Store, fornecendo feedback visual e um sinal de sincronização estável para testes E2E.
- **Snapshot de Features**: O campo `recordJson` no backend armazena o estado completo das `features` (incluindo cargas atuais), garantindo que nada desapareça ao trocar de personagem ou recarregar a página.
- **Normalização de Classes**: Sincronia entre IDs da API (`path-of-the-berserker`) e nomes exibidos (`Berserker`), permitindo filtragem precisa de habilidades de subclasse no Level Up.

### 9. Interface e Design System
- **Skills Tab**: Layout dinâmico que alterna entre 1 coluna (sidebar) e 2 colunas (wide view) para otimizar espaço.
- **Vitality Panel**: Painel interativo que oculta controles de dano/cura sob o círculo de HP para minimizar ruído visual.
- **Identidade Visual**: Padrão "Modern High Fantasy" com tons de ouro, teal e rose, utilizando blur e bordas arredondadas (3xl).
- **Atributos Únicos**: No método Standard Array, o sistema bloqueia valores já selecionados para evitar duplicidade.

### 10. Progressão e Evolução (Level Up)
- **Histórico de Escolhas**: Bônus de atributos (**ASI**) e Talentos (**Feats**) não modificam os atributos base permanentemente. Eles são armazenados em `character.asiChoices` indexados pelo nível (ex: `character.asiChoices["4"]`).
- **Cálculo de Projeção**: O hook `useDerivedState.ts` e o serviço de backend `characters.service.ts` somam em sincronia: `Atributo Base + Bônus de Background + Soma de todos os ASIs/Feats históricos`.
- **Validação Estrita**: A finalização do Level Up utiliza um motor de validação que impede o avanço caso escolhas obrigatórias (Subclasse, Perícias de Primal Knowledge, etc.) não tenham sido feitas ou requisitos de Talentos não sejam atendidos.
- **Half-Feats**: Talentos que concedem +1 em atributo utilizam um seletor auxiliar que persiste o bônus no mesmo objeto `asiChoices` do nível correspondente.

### 11. Sistema de Magias e Slots
- **Cálculo de Slots**: O total de slots por nível é calculado dinamicamente no frontend via `lib/spell-utils.ts`. Isso garante que a UI exiba os slots corretamente mesmo para personagens recém-criados ou sem conexão momentânea com o backend.
- **Rastreamento de Uso**: O estado `character.spellSlots` armazena o contador `used`. A interface em `SpellsTab.tsx` utiliza quadrados clicáveis que preenchem o pool de uso de forma sequencial.
- **Integração com Long Rest**: O motor de descanso longo (`applyLongRest`) percorre o objeto de slots e reseta todos os contadores `used` para zero.

### 12. Gestão de Moedas e Inventário
- **Currency System**: Implementamos suporte completo para moedas (CP, SP, EP, GP, PP) com uma seção dedicada no inventário.
- **Conversão de Equipamento**: O sistema de Background agora converte automaticamente o valor do equipamento inicial em moedas no objeto `currency`.
- **Instanciação Única**: Cada item possui um `instanceId`, permitindo a gestão individual de quantidades e estados de equipamento (ex: vestir uma armadura e manter outra idêntica na mochila).
- **Ações de Inventário**: Adicionada funcionalidade de remoção direta e busca manual no catálogo completo de itens.

## Modulos Implementados

### Frontend Moderno (`frontend/src/`)
- **UI Components**: `Card`, `Select`, `NumberInput`, `Checkbox`, `ChoiceSelector`, `RuleText`.
- **Builder**: `SpeciesSelect`, `ClassSelect`, `BackgroundSelect`, `AbilityScores`, `MagicInitiate`, `SpellSelect`, `LevelUpModal`.
- **Sheet**: Abas de Resumo, Perícias, Inventário, Ações, Magias (`SpellCard`), e Habilidades.
- **Layout**: `AppLayout`, `Header`, `CharacterMenu`.

### Backend Services (`backend/src/modules/`)
- **Rules Catalog**: Endpoints para backgrounds, classes, spells, class-spells, species, items, features, feats, subraces, actions, conditions e level-up-options.
- **Character Projection**: Cálculo de nível, proficiency, HP, AC e spellcasting metrics.
- **Actions**: Derivação de ações de combate.
- **Resources**: Uso e recuperação de recursos (Ki, Rage, Second Wind, etc.).
- **Inventory**: Gerenciamento de munição.

## Futuro Projeto: Otimização da Pipeline de Dados (ETL)

Para evolução profissional do sistema:

1.  **Banco de Dados Relacional**: Migrar a leitura de JSONs gigantes em memória para tabelas PostgreSQL/SQLite indexadas.
2.  **Server-side Pre-processing**: Mover a limpeza de texto (`data-parser`) para o momento da ingestão no banco de dados.
3.  **Data Pruning**: Deletar assets irrelevantes do repositório completo do 5etools (~1GB), mantendo apenas os dados do core 2024.

## Verificacao

- `npm run dev`: Inicia o frontend na porta 3000.
- `npm run backend:dev`: Inicia o backend na porta 3100.
