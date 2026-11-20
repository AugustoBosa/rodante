---
name: Rodante
description: Cadeira de rodas sob medida para cães, desenhada como um manual de montagem.
colors:
  azul: "#1f4fd1"
  azul-tinta: "#ffffff"
  azul-claro: "#e2e9fb"
  papel: "#fbfaf7"
  papel-2: "#f1efe9"
  tinta: "#141414"
  tinta-2: "#57534b"
  cinza-1: "#e4e1d9"
  cinza-2: "#c8c4ba"
  cinza-3: "#8e897e"
  erro: "#c4291c"
  erro-claro: "#fbe7e4"
  aviso: "#8a5a00"
  aviso-claro: "#fbf0d6"
  azul-escuro-modo: "#86a6ff"
  azul-tinta-escuro-modo: "#0b1430"
  azul-claro-escuro-modo: "#1a2446"
  papel-escuro-modo: "#121211"
  papel-2-escuro-modo: "#1b1b19"
  tinta-escuro-modo: "#f1efe9"
  tinta-2-escuro-modo: "#b4afa4"
  cinza-1-escuro-modo: "#2a2926"
  cinza-2-escuro-modo: "#3d3b37"
  cinza-3-escuro-modo: "#6f6b63"
  erro-escuro-modo: "#ff8a7d"
  erro-claro-escuro-modo: "#3a1a16"
  aviso-escuro-modo: "#f0c062"
  aviso-claro-escuro-modo: "#33280f"
typography:
  display:
    fontFamily: "'Archivo Variable', 'Archivo', system-ui, sans-serif"
    fontSize: "clamp(2.4rem, 5.2vw, 5.6rem)"
    fontWeight: 860
    lineHeight: 1.02
    letterSpacing: "-0.025em"
    fontVariation: "'wdth' 118"
  headline:
    fontFamily: "'Archivo Variable', 'Archivo', system-ui, sans-serif"
    fontSize: "clamp(1.7rem, 3.2vw, 3rem)"
    fontWeight: 820
    lineHeight: 1.02
    letterSpacing: "-0.025em"
    fontVariation: "'wdth' 112"
  title:
    fontFamily: "'Archivo Variable', 'Archivo', system-ui, sans-serif"
    fontSize: "1.15rem"
    fontWeight: 700
    lineHeight: 1.02
    letterSpacing: "-0.01em"
  body:
    fontFamily: "'Archivo Variable', 'Archivo', system-ui, sans-serif"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: 1.55
    fontVariation: "'wdth' 100"
  label:
    fontFamily: "'Archivo Variable', 'Archivo', system-ui, sans-serif"
    fontSize: "0.95rem"
    fontWeight: 700
  botao:
    fontFamily: "'Archivo Variable', 'Archivo', system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 700
  dado:
    fontFamily: "'Archivo Variable', 'Archivo', system-ui, sans-serif"
    fontSize: "1.15rem"
    fontWeight: 600
    fontFeature: "'tnum'"
  numeral:
    fontFamily: "'Archivo Variable', 'Archivo', system-ui, sans-serif"
    fontSize: "clamp(4.5rem, 8vw, 8rem)"
    fontWeight: 900
    lineHeight: 0.8
    fontVariation: "'wdth' 62"
  marca:
    fontFamily: "'Archivo Variable', 'Archivo', system-ui, sans-serif"
    fontSize: "1.3rem"
    fontWeight: 900
    letterSpacing: "-0.03em"
    fontVariation: "'wdth' 125"
rounded:
  raio: "3px"
  fino: "2px"
spacing:
  margem: "clamp(16px, 3.2vw, 56px)"
  secao: "clamp(56px, 8vw, 120px)"
  topo: "60px"
components:
  botao:
    backgroundColor: "{colors.papel}"
    textColor: "{colors.tinta}"
    typography: "{typography.botao}"
    rounded: "{rounded.raio}"
    padding: "10px 20px"
    height: "48px"
  botao-hover:
    backgroundColor: "{colors.tinta}"
    textColor: "{colors.papel}"
  botao-primario:
    backgroundColor: "{colors.azul}"
    textColor: "{colors.azul-tinta}"
    typography: "{typography.botao}"
    rounded: "{rounded.raio}"
    padding: "10px 20px"
    height: "48px"
  botao-primario-hover:
    backgroundColor: "{colors.tinta}"
    textColor: "{colors.papel}"
  botao-grande:
    padding: "14px 28px"
    height: "60px"
  botao-pequeno:
    padding: "6px 12px"
    height: "38px"
  botao-perigo:
    backgroundColor: "{colors.papel}"
    textColor: "{colors.erro}"
  botao-perigo-hover:
    backgroundColor: "{colors.erro}"
    textColor: "{colors.papel}"
  botao-pressionado:
    backgroundColor: "{colors.tinta}"
    textColor: "{colors.papel}"
  entrada:
    backgroundColor: "{colors.papel}"
    textColor: "{colors.tinta}"
    typography: "{typography.dado}"
    rounded: "{rounded.raio}"
    padding: "11px 12px"
  entrada-unidade:
    backgroundColor: "{colors.papel-2}"
    textColor: "{colors.tinta-2}"
    width: "52px"
  opcao:
    backgroundColor: "{colors.papel}"
    textColor: "{colors.tinta}"
    rounded: "{rounded.raio}"
    padding: "16px 16px 16px 56px"
  opcao-marcada:
    backgroundColor: "{colors.azul-claro}"
    textColor: "{colors.tinta}"
  carimbo-vet:
    backgroundColor: "{colors.papel}"
    textColor: "{colors.tinta}"
    rounded: "{rounded.raio}"
    padding: "16px 18px"
  cota-rotulo:
    backgroundColor: "{colors.papel}"
    textColor: "{colors.azul}"
    rounded: "{rounded.fino}"
    padding: "2px 7px"
  fita-rotulo:
    backgroundColor: "{colors.azul}"
    textColor: "{colors.azul-tinta}"
    rounded: "{rounded.fino}"
    padding: "4px 10px"
  aba:
    textColor: "{colors.tinta-2}"
    typography: "{typography.botao}"
    padding: "14px 10px"
  aba-ativa:
    textColor: "{colors.tinta}"
  passo-numero:
    textColor: "{colors.tinta}"
    typography: "{typography.numeral}"
  passo-numero-ativo:
    textColor: "{colors.azul}"
---

# Design System: Rodante

## Overview

**Creative North Star: "O Manual de Montagem"**

O Rodante se apresenta como o manual impresso que vem na caixa de um móvel desmontado, só que escrito para um cão específico. A tela é papel branco quente com traço preto. Cada bloco é uma caixa com borda preta fina, os cantos são quase retos e as seções se separam por linhas que atravessam a largura inteira. Os números falam mais alto que as palavras: passos numerados em algarismos pretos gigantes e condensados, contagens `×4` ao lado de cada peça, letras A/B/C para os tipos de cadeira. As figuras não são fotos. São desenhos de traço: o quadro em 3D isométrico com sombreamento de três cinzas e contorno preto, o cão como silhueta de papel contornada, as fitas métricas em azul.

A densidade muda com a tarefa, o mundo não. O Início é editorial e espaçado (seções de até 120px de respiro, títulos de até 5,6rem). O wizard e a prancha são operacionais: colunas fixas, palco 3D grudado ao lado, tabelas com números tabulares. Os dois lados usam as mesmas caixas, o mesmo traço e o mesmo azul. Um único azul marca "esta peça, a sua medida, a próxima ação". O vermelho aparece só para erro e para o ✗ dos quadros certo/errado. O tema escuro inverte o papel para quase-preto quente e a tinta para creme, mantendo o mesmo desenho.

O movimento é o de um manual que se monta sozinho: a cadeira explode e se junta conforme a rolagem, a fita métrica desenrola até a medida, a roda anda sobre a fita no carregamento. Tudo usa uma única curva de saída suave e desaparece com `prefers-reduced-motion`. Rejeições confirmadas: a landing de pet em tons pastel com patinhas, e o layout genérico "título à esquerda, 3D à direita, três cartões".

**Key Characteristics:**
- Papel quente, traço preto de 1,5px (3px no destaque), cantos de 3px.
- Um azul de ação e seleção; vermelho só para erro.
- Uma família, Archivo variável; a hierarquia vem do eixo de largura (62 a 125) e do peso.
- Números como protagonistas: passos, contagens e letras de tipo condensados e pretos.
- 3D ortográfico isométrico com material toon de três tons e contorno em pixels de tela.
- Sem sombras desfocadas: profundidade por traço, por preenchimento tonal e pelo próprio desenho 3D.

## Colors

Papel e tinta quentes, três cinzas de sombreamento, um azul de ação e dois tons de estado.

### Primary
- **Azul de Montagem** (`azul`): a única cor de destaque. Botão primário, opção e tipo selecionados, número do passo ativo, barra de etapas, sublinhado da aba e do link de navegação atual, anel de foco, cursor de texto, seleção de texto, rótulos de cota, fita métrica, conexão destacada no 3D e juntas nas miniaturas 2D. O texto sobre ele usa **Branco de Contraste** (`azul-tinta`).
- **Azul Lavado** (`azul-claro`): fundo de opção marcada, hover de peça no inventário, halo de foco das entradas e miolo do tubo na miniatura em hover.

### Neutral
- **Papel Quente** (`papel`): fundo de tudo, inclusive das caixas, botões secundários, cabeçalho fixo e palcos 3D. Também é a cor das conexões impressas e do corpo do cão no 3D.
- **Papel Sombreado** (`papel-2`): hover de link, linha de tabela e cartão; fundo da unidade nas entradas; metade "não faça" dos quadros certo/errado; fundo da miniatura de peça.
- **Tinta** (`tinta`): texto, todas as bordas estruturais, contorno do 3D, preenchimento de botão em hover e em estado pressionado.
- **Tinta Diluída** (`tinta-2`): texto secundário (classe `mudo`, leads, fichas, legendas, ajudas, abas inativas).
- **Cinza 1, 2 e 3** (`cinza-1`, `cinza-2`, `cinza-3`): os três tons de sombreamento. Cinza 1 é o tubo no 3D e a silhueta 2D do cão; Cinza 2 é a linha divisória fina (tabelas, cartões de medida, peças); Cinza 3 é a roda no 3D, a barra de rolagem e as letras A/B/C decorativas.

### Status
- **Vermelho de Erro** (`erro`) com fundo **Rosa de Erro** (`erro-claro`): mensagens de campo, alerta de erro, botão de perigo, carimbo veterinário com pendência e o ✗ dos quadros certo/errado.
- **Ocre de Aviso** (`aviso`) com fundo **Creme de Aviso** (`aviso-claro`): alertas de nível aviso.

### Tema escuro
Cada token tem um par `-escuro-modo` no frontmatter, aplicado por `prefers-color-scheme: dark` com os mesmos nomes de variável. O azul fica mais claro e o texto sobre ele fica azul-marinho.

### Named Rules
**The Azul Único Rule.** O azul só diz "esta peça / a sua medida / a ação". Nenhum título, ícone decorativo ou fundo de seção é azul.

**The Vermelho Só Para Erro Rule.** O vermelho aparece só em erro, perigo e no ✗ do certo/errado. Nunca como enfeite ou chamada de atenção comercial.

**The Três Cinzas Rule.** O sombreamento usa apenas papel, Cinza 1, Cinza 2 e Cinza 3: no 3D (degraus toon), no tubo desenhado em escala (faixas papel/Cinza 1/Cinza 2) e nas figuras 2D.

## Typography

**Display Font:** Archivo Variable (com Archivo, system-ui, sans-serif)
**Body Font:** Archivo Variable (mesma família)
**Label/Mono Font:** Archivo Variable com `font-variant-numeric: tabular-nums` para números

**Character:** Uma grotesca industrial usada em toda a sua amplitude. Larga e preta nos títulos, normal no texto, comprimida ao máximo nos números, como a tipografia de uma etiqueta técnica. Auto-hospedada via `@fontsource-variable/archivo` (eixos `wdth` 62–125, `wght` 100–900).

### Hierarchy
- **Marca** (900, 1,3rem, largura 125): só o nome "Rodante" no cabeçalho.
- **Display** (860, clamp 2,4–5,6rem, entrelinha 1,02, largura 118): h1 de página. Na capa vai até 4,9rem com no máximo 15ch.
- **Headline** (820, clamp 1,7–3rem, largura 112): h2 de seção. A mesma largura 112 aparece em legendas de painel, `summary`, títulos de regra e no título de carregamento.
- **Title** (700, 1,15rem): h3 de cartão, opção e peça.
- **Body** (400, 17px, entrelinha 1,55): texto corrido, com medida de 40–56ch nos blocos de leitura e 70ch no rodapé.
- **Label** (700, 0,95rem): rótulos de campo e legendas de grupo.
- **Botão** (700, 1rem; 1,15rem no grande, 0,9rem no pequeno e nas abas).
- **Dado** (600, 1,15rem, tabular): valor digitado nas entradas.
- **Numeral** (900, largura 62, entrelinha ~0,8): número do passo (até 8rem no Início, até 7,5rem no wizard), contagem `×N` (1,5–2,6rem), letra do tipo (1,7–2,4rem).

### Named Rules
**The Número Condensado Rule.** Todo número que conta ou ordena (passo, quantidade, letra de tipo) usa peso 900 em largura 62. Ele é o elemento mais visível do bloco.

**The Tabular Rule.** Toda medida, quantidade e milímetro usa algarismos tabulares, para as colunas alinharem.

## Layout

O espaço é de página inteira, sem contêiner centralizado com largura máxima. A margem lateral (`margem`) acompanha a viewport. O cabeçalho é fixo, com altura `topo` e uma linha de tinta embaixo. As seções empilham com respiro `secao` e uma linha de tinta de ponta a ponta entre elas.

As telas se dividem em proporções de 7 para 5. A capa usa texto 5fr (mínimo 380px) e cena 7fr, com a cena sangrando até a borda. A montagem com rolagem usa palco 7fr e passos 5fr. O wizard usa palco 7fr e formulário com mínimo de 420px. O palco 3D fica grudado (`position: sticky`) com a altura da viewport menos o cabeçalho, enquanto o conteúdo do outro lado rola. A prancha ocupa a viewport inteira em três colunas: painel de parâmetros (280–330px), vista 3D flexível e lateral com abas (360–440px).

Inventário e lista de projetos são grades de células que dividem as bordas: o contêiner leva a linha de cima e da esquerda, cada célula a da direita e a de baixo, sem vão entre elas (`auto-fill`, mínimo 220px e 320px). Formulários usam `auto-fit` com mínimo de 210–220px.

Pontos de quebra: até 1100px a prancha vira uma coluna, com a vista 3D grudada no topo (56svh) e abas e painel abaixo. Até 900px tudo vira uma coluna: o palco 3D sobe para o topo e fica grudado (36svh na capa, 38svh no wizard, 46svh na montagem), as etapas do wizard mostram só o rótulo atual e a navegação troca para rótulos curtos. Até 560px as miniaturas encolhem. A barra de ações do wizard fica grudada no rodapé. Os espaçamentos internos ficam entre 6px e 28px, sem escala formal.

## Elevation & Depth

O sistema é plano. Nenhuma superfície da interface tem sombra desfocada. A profundidade vem de três lugares: o traço preto que contorna cada caixa (1,5px, ou 3px para o que pede peso), o preenchimento tonal do Papel Sombreado e o próprio desenho 3D. No 3D, a câmera é ortográfica (sem perspectiva), a luz é uma hemisférica mais uma direcional, e o material toon tem três degraus fixos (rampa 120/200/255, filtro mais próximo). Por cima vai um contorno preto de espessura constante em pixels de tela (2px nas peças, 1,6px nas miniaturas, 2,5px no cão, este feito como casca de faces de trás porque a malha tem esqueleto). O cão não recebe sombreamento: é papel chapado com olhos em tinta. As cores do 3D são lidas das variáveis CSS, nunca escritas no código.

### Shadow Vocabulary
- **Seleção** (`box-shadow: inset 0 0 0 2px var(--azul)`): opção e tipo marcados, junto da borda azul.
- **Sublinhado ativo** (`box-shadow: inset 0 -3px 0 var(--azul)` na navegação; `inset 0 -4px 0` nas abas): item atual.
- **Halo de foco** (`box-shadow: 0 0 0 3px var(--azul-claro)`; `var(--erro-claro)` com erro): entrada com foco ou com erro.

### Named Rules
**The Traço, Não Sombra Rule.** Toda `box-shadow` do sistema é uma linha sólida sem desfoque. Para separar ou elevar algo, use borda de tinta ou preenchimento tonal.

## Shapes

As caixas têm cantos quase retos (`raio`, 3px): botões, entradas, opções, alertas, carimbo, alternador. Os rótulos flutuantes do 3D e o tubo desenhado usam 2px (`fino`). A barra de controles da vista usa o raio mais 3px. Círculos aparecem só onde o objeto é redondo: a marca de rádio das opções, o selo ✓/✗ de 64px do certo/errado e as rodas. A única pílula é o contador nas abas. A borda padrão é de 1,5px de tinta. O traço forte de 3px marca o carimbo veterinário e os pares certo/errado. Nos desenhos SVG o tubo tem ponta redonda: traço preto largo com miolo de papel por cima.

## Components

### Buttons
Caixas de traço que viram tinta sólida ao passar o mouse, como um carimbo.
- **Shape:** cantos quase retos (3px), borda de 1,5px, altura mínima de 48px.
- **Secundário (padrão):** papel com texto e borda de tinta. No hover, inverte para tinta com texto papel.
- **Primário:** azul com texto branco. No hover vira tinta. O ícone final (seta) desliza 4px para a direita.
- **Tamanhos:** grande (60px, para a ação principal da capa e do fecho) e pequeno (38px, para ferramentas da prancha e escolhas rápidas).
- **Perigo:** borda e texto vermelhos; no hover, fundo vermelho.
- **Pressionado (`aria-pressed`):** tinta sólida. É usado como alternância (cotas, vista explodida, cão na cadeira, diâmetro de tubo).
- **Ativo / Desabilitado:** ao clicar desce 1px e reduz para 0,98; desabilitado fica com opacidade 0,4.
- **Foco:** contorno azul de 3px com 3px de afastamento, em todos os elementos focáveis.

### Cards / Containers
- **Opção:** caixa de traço com marca de rádio circular à esquerda e letra condensada em Cinza 3 no canto. Marcada: borda azul, anel interno azul de 2px e fundo Azul Lavado.
- **Tipo (A/B/C da capa):** cartão compacto com letra, miniatura isométrica e nome. Sobe 3px no hover.
- **Célula de inventário / cartão de projeto:** células de grade com bordas compartilhadas, contagem `×N` grande no topo, legenda separada por linha Cinza 2. No hover, fundo Azul Lavado (peças) ou Papel Sombreado (projetos).
- **Peça (prancha):** borda Cinza 2, miniatura 3D girando ao lado. No hover ou foco, borda azul e fundo Azul Lavado a 40%.
- **Alerta:** ícone e texto em grade, borda de 1,5px na cor do nível sobre o fundo claro do mesmo nível.

### Inputs / Fields
- **Style:** caixa de traço com o valor em peso 600 tabular e um compartimento de unidade (cm, kg, mm) à direita, separado por linha e com fundo Papel Sombreado.
- **Focus:** borda azul e halo Azul Lavado de 3px. O campo de medida ativo também fica azul.
- **Error:** borda vermelha, halo rosa e mensagem vermelha em negrito com ícone.

### Navigation
- **Cabeçalho:** fixo, papel com linha de tinta embaixo. Marca à esquerda, links em peso 600 à direita, com hover Papel Sombreado e página atual sublinhada por barra azul de 3px. O seletor de idioma é um botão de traço pequeno. Abaixo de 900px os links usam rótulos curtos.
- **Etapas do wizard:** cinco células divididas por linhas Cinza 2. Uma barra azul de 4px se preenche da esquerda para a direita (0,5s) nas etapas feitas e na atual.
- **Abas da prancha:** faixa grudada com texto Tinta Diluída. A aba selecionada fica em tinta com barra azul de 4px embaixo. O contador é uma pílula de tinta.
- **Alternador Simples/Avançado:** botões unidos numa só caixa de traço; o ativo é tinta sólida.

### Passos Numerados (Signature)
Lista ordenada em que o número do passo é um numeral condensado gigante, com o texto ao lado limitado a 40ch. No Início os passos inativos ficam a 32% de opacidade e o ativo acende com o número em azul, enquanto a cadeira ao lado se monta com a rolagem. No wizard, o número da etapa abre o cabeçalho em azul. Na prancha, a lista de montagem repete o mesmo numeral em 2rem.

### Palco 3D de Manual (Signature)
Canvas ortográfico isométrico que enquadra sozinho a caixa do quadro (e do cão, quando presente). Tubos em Cinza 1, rodas em Cinza 3 com cubo de papel e três raios de tinta, conexões em papel (a destacada em azul). Cotas são linhas azuis tracejadas com rótulo de papel, borda e texto azuis. Na prancha, uma barra de controles centralizada embaixo traz vistas e alternâncias como botões pequenos sem borda. Sem WebGL, o palco vira a miniatura SVG isométrica ou a ilustração 2D do cão com fitas azuis.

### Fita Métrica e Rótulo de Medida (Signature)
A medida que o usuário está preenchendo aparece como uma fita azul com marcas de papel a cada 5cm, que desenrola com amortecimento até o tamanho certo. O valor vai num rótulo azul sólido com texto branco em peso 800 tabular.

### Carimbo Veterinário (Signature)
Caixa com traço forte de 3px e ícone de estetoscópio azul de 34px. Aparece no Início, na revisão do wizard e na prancha. Com pendência, a borda fica vermelha.

### Quadro Certo/Errado (Signature)
Pares lado a lado dentro de um traço forte de 3px. O lado "faça" tem selo circular azul com ✓. O lado "não faça" tem fundo Papel Sombreado e selo vermelho com ✗. Abaixo de 900px os pares empilham.

### Barra "Você vai precisar" (Signature)
Faixa no pé da capa com itens no formato contagem condensada, ícone e nome (`×1 fita métrica`, `×2 pessoas`), como a lista de ferramentas de um manual.

### Carregando (Signature)
Uma roda de traço anda sobre uma fita métrica que se preenche de azul conforme o progresso. Abaixo vão um título na largura 112 e um detalhe tabular.

## Do's and Don'ts

### Do:
- **Do** contornar toda caixa com traço de tinta de 1,5px e cantos de 3px; use 3px de traço só para o que precisa de peso (carimbo veterinário, certo/errado).
- **Do** reservar o azul para seleção, medida atual, foco e ação principal, com no máximo um botão primário por grupo de ações.
- **Do** escrever todo número de passo, contagem e letra de tipo em peso 900, largura 62; toda medida em algarismos tabulares.
- **Do** desenhar o 3D com o material de manual (toon de três tons e contorno em pixels de tela), lendo as cores das variáveis CSS.
- **Do** manter o cão como papel chapado com contorno; o sombreamento em cinzas fica para as peças.
- **Do** separar seções com linhas de tinta de ponta a ponta e deixar o palco 3D grudado ao lado do conteúdo que rola.
- **Do** oferecer reserva 2D (miniatura SVG isométrica ou ilustração com fita) sempre que o 3D não puder rodar.
- **Do** usar ícones lucide com traço 1,75 em 1,2em, e a curva `cubic-bezier(0.16, 1, 0.3, 1)` em todo movimento, desligado com `prefers-reduced-motion`.

### Don't:
- **Don't** usar sombra desfocada para elevar cartões, botões ou painéis.
- **Don't** introduzir uma segunda cor de destaque, gradiente decorativo ou tons pastel.
- **Don't** usar vermelho fora de erro, perigo e o ✗ do certo/errado.
- **Don't** usar fotos, patinhas ou ilustrações fofas; figuras são desenho de traço.
- **Don't** arredondar caixas além de 3px nem transformar botões em pílulas.
- **Don't** usar uma segunda família tipográfica; a hierarquia vem da largura e do peso do Archivo.
- **Don't** escrever cores fixas no código do 3D ou dos SVGs; use as variáveis.
