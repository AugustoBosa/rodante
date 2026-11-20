# Status e retomada

[← Índice](README.md) · Atualizado em 2026-11-20

## Retomar aqui
- **Site no ar:** https://augustobosa.github.io/rodante/ · repo público https://github.com/AugustoBosa/rodante (branch `master`; o site é servido da branch `gh-pages`).
- **Último commit publicado:** `1d6fa64` (rodada 3). Árvore limpa depois dele, exceto este STATUS.
- **Rodar:** `cd app && npm install && npm run dev`. **Testes:** `npm test` (21). **Lint:** `npm run lint`.
- **Publicar:** push em `master` e depois **disparar o deploy à mão** (o push não dispara, ver Em aberto → Técnico):
  `gh workflow run deploy.yml -R AugustoBosa/rodante --ref master`
- **Grafo:** `graphify-out/` (local, fora do git). Perguntas sobre o código: `graphify query "<pergunta>"`. O hook `post-commit` atualiza o código sozinho; depois de commitar docs (`wiki/`, `docs/`, `README.md`), rodar `/graphify . --update` com **subagentes Haiku**.
- Proposta e plano originais: [`docs/proposta-interface.md`](../docs/proposta-interface.md).

## Em aberto

### Antes de usar com um cão (físico, usuário não vai imprimir agora)
1. **Calibrar `folgaImpressao`** (hoje 0,4 mm, chute) em `app/src/model/defaults.ts`: imprimir um tê, testar no tubo real e anotar a folga que encaixa firme.
2. **Montar uma cadeira de teste.** Dianteira e 4 rodas nunca foram montadas: geometria testada só em código e na tela.
3. **Resistência das peças:** nenhuma conexão teve teste de carga. O clip da sela em PETG pode trincar ao encaixar (TPU é alternativa).
4. **Valores padrão sem fonte** (todos em `defaults.ts`): Ø do tubo por faixa de peso, folga lateral 3 cm, limite 40 kg, PVC até 12 kg, diferença máxima de 15% entre pernas (4 rodas), abaixar o quadro 2 cm. Validar com montagem real e, se possível, fisioterapeuta veterinário.

### Não verificado (fazer quando der)
5. Abrir o **STEP do conjunto** num CAD (FreeCAD/Fusion) e conferir a posição das peças. Hoje só sabemos que o arquivo é gerado (a rotação das peças tem teste unitário em `pecas.test.ts`).
6. Abrir o **.zip em inglês** e conferir nomes de arquivo, CSV (`,` e ponto decimal) e README.
7. Refazer a **impressão da prancha em PDF** (Ctrl+P) depois das mudanças da rodada 3.
8. **Celular:** conferido só em emulação (390 px). Falta testar num celular real, em especial o 3D do cão (peso ~0,85 MB do modelo + WebGL).
8b. **Rótulos 3D em modo dev:** com StrictMode, o primeiro rótulo `<Html>` do drei às vezes some e o console mostra "synchronously unmount a root". No build de produção não acontece (sem StrictMode).

### Técnico
9. **Push em `master` não dispara o workflow** `deploy.yml` (0 execuções por push desde a criação do repo; Actions habilitado, workflow ativo, 0 webhooks). Causa não encontrada. Contorno: `gh workflow run` depois do push.
10. Grafo: atualização de **documentos** não é automática (o hook só cobre código). Por design.
11. Lighthouse "agentic browsing" reclama de `llms.txt` e `ard.json` ausentes. Ignorado (YAGNI).

### Pesquisa (para depois, a pedido do usuário)
12. Abrir no navegador FiGO (Thingiverse 1095924 / 1397964) e Instructables [2] para confirmar licença. Não bloqueia nada: nenhum código deles foi reaproveitado.
13. Fontes 🚫 ainda bloqueadas: 3, 5, 6, 8, 12, 15, 17, 18, 19, 23, 29, 31, 32, 36, 37, 52.
14. Suplemento de [30] (público?) e conteúdo do "Models & Data.7z" de [33].
15. Sites do "Rodinhas para Todos" e "Tô de Rodas"; grupos Facebook/Instagram; fornecedores BR sem validação ([07](07-impressao-3d-e-materiais.md), [08](08-comunidades-e-foruns.md)).
16. Relato de eixo com bucha/prisioneiro (atribuído à Eddie's) não confirmado.

## Decisões
- **Nome:** Rodante (definitivo). Gratuito, MIT, sem backend; projetos no `localStorage`, link `#/p/…` e import/export `.json`.
- **Público:** todos (tutor, profissional, ONG) → modos Simples/Avançado e Meus projetos.
- **Stack:** React + Vite + TS; Three.js (react-three-fiber/drei) para o 3D; Replicad em Web Worker para as peças (STL/STEP).
- **Licenças:** Replicad MIT; `replicad-opencascadejs` **LGPL-2.1** (usado sem modificar, WASM separado). FiGO/SMAL são NC → não reaproveitar. Repo `indeterminatedesign/3D-Printed-Dog-Wheelchair` é MIT.
- **Medidas:** método "deitado de lado"; a medida do usuário é a fonte, a raça (faixas AKC aprox.) só alerta.
- **Segurança:** aviso veterinário em Início, Revisão (checkbox obrigatório) e Prancha; erro bloqueia o .zip.
- **Idiomas:** pt-BR e inglês via `tr('pt', 'en')` em `app/src/i18n.ts`; padrão pelo navegador; botão no topo.
- **Grafo:** graphify com Haiku na extração semântica (pedido do usuário).
- **Visual (2026-11-20, rodada 4):** mundo "manual de montagem" escolhido pelo usuário (impeccable): papel branco, traço preto, 3 cinzas, um azul só para "esta peça / sua medida / ação", vermelho só para erro. Fonte Archivo (auto-hospedada via `@fontsource-variable/archivo`), ícones `lucide-react`. 3D em toon + contorno, câmera ortográfica isométrica. Contexto em `PRODUCT.md` e `.impeccable/surfaces/`.
- **Cão:** Shiba Inu 3D de Quaternius (CC0) em `app/public/modelos/shiba.glb`; reserva 2D com silhueta CC0 (Margot Michaud, PhyloPic). Créditos em `app/public/modelos/LICENCAS.txt` e no rodapé.

## Mapa do código (`app/src/`)
| Arquivo | O que faz |
|---|---|
| `model/design.ts` | `computeDesign`: quadro traseira/dianteira/4 rodas, cortes (distância entre centros − recuos), alertas, `TIPOS`, `medidasDoTipo` |
| `model/bom.ts` | Lista de materiais, cortes, passos de montagem, CSV |
| `model/defaults.ts` | Todos os valores de calibração e limites |
| `cad/pecas.ts` | Peças Replicad (cotovelo, tê, suporte do eixo, ponteira, clip) + `eixoAngulo` |
| `cad/worker.ts` | Download do WASM com progresso, cache, STL/STEP por peça, STEP do conjunto |
| `ui/Prancha.tsx` · `ui/Vista3D.tsx` | Prancha técnica, 3D ortográfico, cotas, vistas, vista explodida, cão na cadeira, peça destacada |
| `ui/Wizard.tsx` · `ui/Ilustracao.tsx` | Wizard de 5 passos (palco 3D à esquerda) e reserva 2D das medidas |
| `ui/Cao3D.tsx` · `ui/PalcoMedida.tsx` | Cão 3D (mede o esqueleto, escala pelas medidas, contorno de manual) e palco com a fita que desenrola |
| `ui/Inicio.tsx` · `ui/PecasVitrine.tsx` · `ui/PalcoProjeto.tsx` | Vitrine: capa com o cão andando na cadeira, inventário de peças CAD reais, montagem guiada pela rolagem |
| `ui/tinta3d.tsx` · `ui/tela.ts` · `ui/usePecas.ts` · `ui/exemplo.ts` | Visual de manual no 3D · detecção de WebGL/visibilidade · motor CAD compartilhado · cão de exemplo |
| `ui/Projetos.tsx` · `ui/Miniatura.tsx` | Lista de projetos com miniatura isométrica |
| `ui/Carregando.tsx` | Tela de carregamento (roda na fita métrica) |
| `store.ts` · `saidas.ts` · `i18n.ts` | Persistência/link/validação · zip/CSV/LEIA-ME · idiomas |

## Histórico
- **2026-11-11:** pesquisa e wiki v1 (páginas 01–10). ~50 fontes conferidas ✅, ~18 bloqueadas 🚫.
- **2026-11-20, F0–F1:** setup e spike CAD (cotovelo Replicad → STL).
- **2026-11-20, F2–F7:** app completo (modelo, peças, wizard, prancha, saídas, deploy). Lighthouse 100.
- **2026-11-20, publicação:** repo público + GitHub Pages pela branch `gh-pages`.
- **2026-11-20, rodada 4:** nova UI/UX do zero (skill impeccable): tela cheia no PC, celular revisto, cão 3D nas medidas e na prancha, vitrine animada.
- **2026-11-20, rodada 3:** dianteira e 4 rodas, STEP por peça e do conjunto, vista explodida, miniaturas, carregamento animado, inglês, favicon próprio, grafo graphify (Haiku) com hook de commit.
