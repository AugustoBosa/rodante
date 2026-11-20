# dog_chair — Proposta de interface + plano de execução

## Contexto
A pesquisa está pronta em `dog_chair/wiki/` (STATUS, 01–10). Ainda não existe código. Objetivo do site: a pessoa informa raça, porte e **medidas do cão** e recebe o **projeto da cadeira de rodas**: modelo 3D, lista de materiais (BOM), lista de cortes de tubo e **STL das peças impressas**. Tudo roda no navegador.

Decisões do usuário (2026-11-20):
- **Público:** todos (tutor que faz em casa, profissional, ONG/mutirão). Por isso há modo **Simples/Avançado** e uma lista de projetos.
- **Modelo:** gratuito e open source (MIT). Sem login, sem backend.
- **Entrega 1:** completa, com STL gerado por Replicad.
- **Visual:** misto. Wizard acolhedor nas medidas; tela final com cara de prancha técnica.
- **Salvar:** localStorage + exportar/importar `.json` + link compartilhável (medidas codificadas na URL).
- **Stack:** React + Vite + TypeScript.
- **Quadro:** tubo (alumínio ou PVC; Ø e parede são parâmetros) unido por conexões impressas.
- **Validação:** o usuário tem impressora 3D. Cada fase de CAD termina com uma impressão de teste.

---

## 1. Proposta de interface

### Mapa do site (4 telas)
| Rota | Tela | Tom |
|---|---|---|
| `/` | **Início**: o que o site faz, aviso veterinário, botões "Novo projeto" e "Meus projetos" | acolhedor |
| `/novo` | **Wizard** em 5 passos | acolhedor |
| `/projeto/:id` | **Prancha técnica**: 3D, BOM, cortes, peças, montagem | oficina |
| `/projetos` | **Meus projetos**: lista local, duplicar, exportar/importar, exportação em lote | neutro |

Roteamento por hash (`#/projeto/abc`). Funciona em hospedagem estática sem configurar o servidor.

### Wizard `/novo` (mobile-first, porque o tutor mede o cão com o celular na mão)
1. **Seu cão**: nome, raça (autocomplete opcional, inclui SRD) e peso.
2. **Tipo de cadeira**: *Traseira* ativa. Dianteira e 4 rodas aparecem como "em breve", com um texto curto sobre quando cada uma é indicada ([wiki 03]).
3. **Medidas**: uma medida por cartão. Cada cartão tem uma ilustração SVG do cão marcando onde medir, o método usado e uma validação de faixa ("fora do comum para Dachshund, confira"). A raça só **sugere e valida**; a medida informada pelo usuário é sempre a fonte ([wiki 02, 04]).
   - Altura da perna traseira (deitado de lado), comprimento do tronco (ombro→quadril), largura no ponto mais largo, altura das costas ao chão.
4. **Materiais que você tem**: tubo (alumínio/PVC, Ø externo, parede), roda (Ø, Ø do eixo) e parafuso. Cada campo vem com valores padrão comuns no Brasil.
5. **Revisão**: resumo de tudo + checkbox obrigatório "vou avaliar com veterinário/fisioterapeuta". Botão "Gerar projeto".

Barra de progresso fixa. Botões Voltar/Avançar grandes. O rascunho fica salvo automaticamente.

### Prancha técnica `/projeto/:id`
- **Desktop (3 colunas):**
  - Esquerda: painel de parâmetros. Alternador **Simples/Avançado**. No Avançado aparecem folgas, Ø do tubo manual, ângulos, tolerância de impressão e espessura das paredes das conexões.
  - Centro: **viewport 3D** com botões de vista (lado/frente/topo/iso), cotas liga/desliga e vista explodida.
  - Direita: abas **BOM · Cortes · Peças impressas · Montagem · Alertas**.
- **Mobile:** 3D em cima e abas embaixo. Os parâmetros abrem numa gaveta.
- **Peças impressas:** um card por peça, com mini 3D, quantidade, material sugerido (PETG) e botão "Baixar STL".
- **Alertas:** regras de segurança, por exemplo "roda grande demais para essa altura → use roda menor", "peso acima de X kg → procure fabricante profissional", "folga lateral pequena".
- **Ações no topo:** Baixar tudo (.zip), Compartilhar link, Imprimir prancha (`window.print()` com CSS de impressão gera o PDF, sem biblioteca), Salvar.
- **Estilo da prancha:** fundo claro com grid fino, cotas em fonte mono, numeração de peças igual à da BOM.

### Meus projetos `/projetos`
Cards com nome do cão, data e miniatura. Ações por projeto: abrir, duplicar, exportar `.json`, excluir. Ações gerais: importar `.json` e "exportar todos" (atende ONG).

### Identidade visual (misto)
- Tokens CSS (`:root`) com tema claro e escuro.
- Wizard: cor quente principal (terracota/âmbar), cantos arredondados, ilustrações de linha.
- Prancha: neutros frios, azul técnico para cotas, fonte mono para números.
- Uma fonte sans para o texto e uma mono para dados.
- Aviso veterinário visível em Início, Revisão e Prancha.

---

## 2. Arquitetura

```
dog_chair/
  wiki/                 (existente)
  app/                  (novo — Vite React TS)
    src/
      model/            TS puro, sem React: regras do projeto
        types.ts        DogInput, Materials, Design, PartSpec, Warning
        design.ts       computeDesign(input) → membros/cortes, peças, alertas
        design.test.ts  vitest
        bom.ts          Design → linhas de BOM/cortes (+ CSV)
      cad/              Replicad em Web Worker (OCCT WASM é pesado)
        worker.ts       recebe PartSpec, devolve malha + STL
        parts/          cotovelo.ts, te.ts, suporteEixo.ts, ponteira.ts, clipSela.ts
      data/breeds.json  seed pequeno: raça, faixa de peso/medidas, fonte por linha
      ui/               wizard/, prancha/, projetos/, inicio/
      store.ts          localStorage + encode/decode do link (#p=base64url)
    public/illustrations/  SVGs de medição
```

**Fluxo de dados:** `DogInput` → `computeDesign` (puro e testado) → `Design`. O `Design` vai para a **BOM/cortes** (tabela/CSV), para o **viewport** (tubos como cilindros Three.js, que é barato) e para o **worker CAD** (cada `PartSpec` vira malha + STL).

**Dependências (mínimas):** `react`, `three` + `@react-three/fiber` + `@react-three/drei` (controles e cotas), `replicad` + `replicad-opencascadejs`, `comlink` (padrão dos exemplos do Replicad), `fflate` (zip), `vitest`.
Não usaremos: router (o hash basta), biblioteca de PDF (o print do navegador basta), state lib (`useReducer` basta), backend.

**Regras de projeto (MVP, quadro traseiro):**
- Quadro = 2 laterais (trilho superior + perna vertical + diagonal), barra traseira, eixo embaixo de cada perna vertical.
- Altura do trilho = altura da perna traseira − ajuste inicial (começar mais baixo, [wiki 02]).
- Perna vertical = altura − raio da roda − offsets das conexões. Se o resultado for ≤ 0, o app emite o alerta "use roda menor".
- Largura interna = largura do corpo + 2 × folga lateral.
- Ø do tubo por faixa de peso: tabela **heurística, sem fonte validada**. Fica marcada com `ponytail:` / "calibrar" e é editável no Avançado.
- Todos os fatores ficam em um único `defaults.ts` (o "botão de calibração").

---

## 3. Plano de execução (≈ 10–14 dias de trabalho)

| Fase | Entrega | Tempo | Pronto quando |
|---|---|---|---|
| **F0 Setup** | `git init`, `app/` com Vite React TS, vitest, licença MIT, `app/` excluído do Obsidian (`.obsidian/app.json` → `userIgnoreFilters`) | 0,5 dia | `npm run dev` e `npm test` rodam |
| **F1 Spike CAD** | Worker Replicad + **1 cotovelo** paramétrico (Ø tubo, ângulo, tolerância) → STL | 1 dia | STL abre no fatiador, **imprime e encaixa no tubo real**. Se falhar, decidir fallback antes de seguir |
| **F2 Modelo** | `types.ts`, `design.ts`, `bom.ts`, `defaults.ts`, testes de regra (roda grande, folga, cortes somam certo) | 1–2 dias | testes verdes |
| **F3 Wizard** | 5 passos, SVGs de medição, validação de faixa, seed de raças, rascunho salvo | 2 dias | o fluxo completo no celular gera um `DogInput` válido |
| **F4 Prancha** | viewport 3D (tubos + conexões), cotas, vistas, abas BOM/Cortes/Montagem/Alertas, Simples/Avançado | 2–3 dias | mudar um parâmetro atualiza 3D e BOM em menos de 1 s |
| **F5 Peças CAD** | tê, suporte de eixo (furo para bucha + contraporca), ponteira, clip da sela. Aba Peças com mini 3D | 2–3 dias | **todas as peças impressas e montadas num quadro de teste** |
| **F6 Saídas** | zip (STLs + BOM.csv + cortes.csv + projeto.json), CSS de impressão, localStorage, link, importar/exportar, exportar todos | 1 dia | abrir o link em aba anônima recria o mesmo projeto |
| **F7 Polimento + deploy** | acessibilidade (teclado, contraste, labels), tema escuro, mobile, deploy em GitHub Pages ou Cloudflare Pages | 1 dia | Lighthouse a11y ≥ 90, site no ar |

Ao concluir cada fase: atualizar `wiki/STATUS.md` (o usuário limpa o contexto entre sessões).
Na execução: usar as skills ponytail, karpathy-guidelines e one-skill-to-rule-them-all (CLAUDE.md), e frontend-design/impeccable em F3/F4.

### Arquivos críticos
- `app/src/model/design.ts` + `defaults.ts`: toda a regra de segurança fica aqui.
- `app/src/cad/worker.ts` + `parts/*`: geometria.
- `app/src/ui/prancha/*`: tela principal.
- `wiki/STATUS.md`: retomada.

---

## 4. Verificação
1. `npm test`: regras de `computeDesign` (casos Dachshund 8 kg, SRD 20 kg, Labrador 35 kg; roda grande demais; folga mínima).
2. `npm run dev` + navegador interno: percorrer o wizard em viewport mobile (375 px) e desktop, gerar projeto, conferir 3D/BOM.
3. Baixar o zip → abrir os STLs no PrusaSlicer/Cura → **imprimir e encaixar no tubo real** (F1 e F5).
4. Abrir o link compartilhado em aba anônima → o projeto aparece idêntico.
5. Imprimir a prancha (Ctrl+P → PDF) → página legível com cotas e BOM.
6. Lighthouse (chrome-devtools MCP) antes do deploy.

## 5. Brainstorm / pontos em aberto (não bloqueiam)
- **Nome e domínio do site**: "dog_chair" é nome de pasta, falta nome público em pt-BR.
- **Valores padrão** (folga lateral, Ø do tubo por peso, ajuste inicial de altura): sem fonte validada. Calibrar com impressão e montagem reais e, se possível, com revisão de um fisioterapeuta veterinário.
- **Limite de peso**: acima de quanto o site recusa e recomenda fabricante profissional? Sugestão inicial: 40 kg.
- **Fase 2**: cadeira dianteira e 4 rodas, export STEP, IFC, tradução EN.
