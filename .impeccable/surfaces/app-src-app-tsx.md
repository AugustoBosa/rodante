---
version: 1
slug: "app-src-app-tsx"
primary_target: "app/src/App.tsx"
related_targets: ["app/src/ui/Inicio.tsx","app/src/ui/Wizard.tsx","app/src/ui/Prancha.tsx","app/src/ui/Projetos.tsx"]
---

## Scope
App inteiro do Rodante (Início, wizard `#/novo`, prancha `#/projeto/:id`, Meus projetos). Início = Persuade; wizard e prancha = Operate dentro do mesmo mundo. Tela cheia no PC, celular de primeira classe.

## Audience, job, constraints
Tutor leigo mede o cão no celular; profissional/maker fabrica no PC. Ação principal: começar um projeto (escolher o tipo e medir). Prova: o 3D real calculado e as peças CAD reais. Restrições: aviso veterinário visível, sem backend, pt/en, WebGL com reserva 2D, reduced-motion.

## Decisões do usuário
Cão 3D CC0 nas medidas + reserva 2D; cão dentro da cadeira na prancha (botão); Início vira vitrine + ferramenta. Direção escolhida: Manual de montagem (cartão IMPECCABLE’S PICK).

## Direction contract
THESIS: O Rodante é o manual de montagem da cadeira do seu cão, escrito para aquele cão: inventário com contagens, passos numerados, figuras de traço. Recusa a landing pet pastel com patinhas e o split "título à esquerda, 3D à direita, três cartões".
OWN-WORLD: Papel branco quente, traço preto de 1,5/3 px, sombreamento isométrico em três cinzas, um azul de destaque só para "esta peça / sua medida / ação", vermelho só para erro e para o ✗ dos quadros certo/errado. Archivo (largura expandida e preta para números de passo gigantes; normal para texto, números tabulares). Balões de chamada com linha-guia, contagens ×4, setas de movimento, pictograma de duas pessoas, cantos retos, caixas com borda preta.
STORY: Entende que o projeto sai sob medida para o seu cão; acredita porque vê a cadeira 3D real se montar passo a passo e as peças reais; começa escolhendo A/B/C e medindo.
FIRST VIEWPORT: Capa do manual em tela cheia. Cadeira 3D em traço (isométrico ortográfico) com o cão dentro ocupa ~60% à direita e sangra; título "Rodante" + frase em Archivo preto à esquerda-alto; seletor A/B/C (traseira, dianteira, 4 rodas) troca o 3D; botão azul "Começar com esta" logo abaixo do seletor; faixa "você vai precisar: ×1 fita métrica ×2 pessoas ×1 veterinário" no rodapé da tela.
FORM: Manual de montagem sem palavras (item 1 da lista ordenada; escolhido pelo usuário como IMPECCABLE’S PICK), seed key 469b3844. Assinatura: o 3D renderizado como desenho de manual (toon + contornos) e a cadeira que se monta conforme a rolagem, com molas e amortecimento.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
