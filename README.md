# D&D 5e Sheet Builder

Aplicativo web estatico para criar e visualizar fichas de D&D 5e no estilo mobile das referencias.

## Como rodar

```bash
python3 -m http.server 5173
```

Abra `http://localhost:5173`.

## Fontes de dados

- `https://www.dnd5eapi.co/api/2014`: usado para classes, niveis e progresso por nivel.
- `https://api.open5e.com/v2`: usado como fonte complementar para magias e conteudo aberto.

O app mantem fallback local para continuar funcionando offline ou se alguma API limitar CORS.

## Dados locais

Os dados baixados ficam em:

```text
data/
  manifest.json
  5e-2014/
    dnd5eapi/
    srd-2014/
  5e-2024/
    srd-2024/
    open5e-2024/
```

Para atualizar:

```bash
node scripts/sync-data.mjs
```

A API `dnd5eapi.co` publica atualmente o conjunto `/api/2014`; os dados 2024/5.5e foram separados a partir das fontes Open5e `srd-2024` e `open5e-2024`.

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
