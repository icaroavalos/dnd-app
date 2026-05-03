# D&D 5e Sheet Builder

Aplicativo web estatico para criar e visualizar fichas de D&D 5e no estilo mobile das referencias.

## Como rodar

```bash
python3 -m http.server 5173
```

Abra `http://localhost:5173`.

## Fonte de dados

O app usa exclusivamente os dados locais compactados do `5etools-v2.28.0`, com foco em regras 2024/5.5e. As APIs publicas nao sao usadas em runtime e nao ha fallback para regras ou magias.

A fonte local e melhor para o criador de ficha porque traz relacoes de classe/magia, progresso de cantrips, prepared spells, proficiencias de save, especies, lineages, subclasses e escolhas por nivel em uma estrutura mais completa do que as APIs publicas.

## Dados locais

Os dados baixados ficam em:

```text
data/
  manifest.json
  5etools/
    manifest.json
    5e-2014/
    5e-2024/
```

Para gerar os dados compactos a partir da pasta local do 5etools:

```bash
node scripts/build-5etools-data.mjs ./5etools-v2.28.0
```

O script reduz os dados brutos do 5etools para o que o criador precisa e separa as regras em:

- `data/5etools/5e-2014`: conteudo classico, sem fonte `XPHB`.
- `data/5etools/5e-2024`: conteudo 2024/5.5e, principalmente fonte `XPHB`.

A pasta bruta do 5etools e grande e nao deve ser carregada diretamente pelo navegador. A pasta compacta gerada ficou muito menor e preserva `source`/`edition` para filtros de publicacao.

Observacao para publicar: a pasta 5etools pode conter fontes alem de SRD/conteudo aberto. Antes de publicar um link publico, filtre as fontes conforme o conteudo que voce pode distribuir.

## Escopo inicial

- Criador guiado em ordem: origem, atributos, escolhas, niveis.
- Lista local de fichas criadas para alternar entre personagens.
- Criacao sempre inicia no nivel 1, com botao dedicado para subir de nivel.
- Menu superior de fichas com criar nova, subir nivel e alternar personagem.
- Escolha de subraca/especie, incluindo High Elf, Wood Elf e outras opcoes SRD.
- Previa de ficha com abas Base, Skills, Ataques, Magia e Notas.
- Calculo de modificadores, proficiencia, saves, skills, spell attack e spell DC.
- Progresso por nivel puxado da API quando disponivel.
- Limites de escolhas de classe e magia aplicados no formulario, usando classe, nivel e circulo da magia da API 5e quando disponiveis.
- Fallback SRD para magias iniciais de druida, clerigo e outras classes quando a API de classe nao responder.
- Escolha de magias agrupada por Cantrips e circulo da magia.
- Magias clicaveis com card de descricao, atributos de conjuracao e texto de nivel superior.
- Spellcards com cores por deck/classe no estilo Gale Force Nine.
- Persistencia local via `localStorage`.
