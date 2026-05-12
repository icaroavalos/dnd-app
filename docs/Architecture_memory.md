# Architecture Memory

Ultima revisao: 2026-05-12.

## Resumo executivo

O projeto concluiu a migração integral do frontend de uma arquitetura Vanilla JS legada para um ecossistema moderno baseado em **Vite + React + TypeScript**. O backend NestJS + Fastify permanece como a fonte de verdade para regras e persistência via Prisma.

**Atualização 2026-05-12:** 
- **Frontend React concluído**: O código legado em Vanilla JS (`app.js`, `index.html`, `src/app/`) foi removido.
- **Zustand**: Gerenciamento de estado global implementado para o personagem e UI.
- **Tailwind CSS**: Migração integral concluída para estilos utilitários.
- **D&D 2024 (XPHB)**: O sistema agora suporta nativamente as novas regras de criação de personagens, incluindo escolhas de nível 1 dinâmicas.

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
- **Dano e Cura**: Sistema reativo que consome Temporary HP antes do HP real.
- **Temporary HP**: Segue a regra de 2024 (não acumula, mantém-se o maior valor).
- **Bloodied State**: Novo marcador formal para criaturas com 50% ou menos de HP.
- **Hit Dice (2024)**: Recuperação total de todos os dados de vida gastos ao finalizar um Descanso Longo.
- **Descanso Curto**: Permite gastar Hit Dice individualmente para cura.

### 6. Sistema de Level Up e Escolhas Pendentes
Implementamos um fluxo dinâmico para evolução de personagens:
- **Botão Level Up**: Localizado no resumo da ficha, automatiza o incremento de nível e HP.
- **Fila de Decisões (Pending Choices)**: Ao subir de nível, o sistema varre novas habilidades. Se uma habilidade exigir escolhas (Subclasse, ASI, Feats), ela entra em uma fila de decisões.
- **Resolução de Escolhas**: As decisões pendentes aparecem em destaque na aba de Habilidades, permitindo que o jogador resolva cada uma antes de continuar sua jornada.
- **Integração reativa**: Escolhas feitas (como um aumento de atributo ou nova proficiência) são aplicadas instantaneamente em toda a ficha.

## Modulos Implementados

### Frontend Moderno (`frontend/src/`)
- **UI Components**: `Card`, `Select`, `NumberInput`, `Checkbox`.
- **Sheet**: Abas de Resumo, Perícias, Inventário, Ações, Magias e Habilidades.

### Backend Services (`backend/src/modules/`)
- **Rules Catalog**: Endpoints para backgrounds, classes, spells, species, items e features.
- **Character Projection**: Cálculo de nível, proficiency, HP, AC e spellcasting metrics.

## Futuro Projeto: Otimização da Pipeline de Dados (ETL)

Para evolução profissional do sistema:

1.  **Banco de Dados Relacional**: Migrar a leitura de JSONs gigantes em memória para tabelas PostgreSQL/SQLite indexadas.
2.  **Server-side Pre-processing**: Mover a limpeza de texto (`data-parser`) para o momento da ingestão no banco de dados.
3.  **Data Pruning**: Deletar assets irrelevantes do repositório completo do 5etools (~1GB), mantendo apenas os dados do core 2024.

## Verificacao

- `npm run dev`: Inicia o frontend na porta 3000.
- `npm run backend:dev`: Inicia o backend na porta 3100.
