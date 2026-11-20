# Status e retomada

[← Índice](README.md) · Atualizado em 2026-11-11

## Feito
- Pesquisa web + wiki v1 (README + páginas 01–10, pt-BR) em `dog_chair/wiki/`.
- Verificação de fontes: ~50 abertas e conferidas ✅, ~18 bloqueadas 🚫. Detalhe por fonte em [10](10-glossario-e-fontes.md#fontes).
- Plano original: `C:\Users\augus\.claude\plans\descri-o-do-projeto-gostaria-glistening-matsumoto.md`.

## Decisões / achados-chave
- **Stack candidata:** Replicad (MIT, `blobSTL`/`blobSTEP` confirmados no código) + Three.js ([05](05-ferramentas-cad-web.md), [09](09-arquitetura-sugerida.md)).
- **"BIM"** = modelo paramétrico único → BOM, cortes, STL/STEP. IFC opcional ([06](06-bim-e-ifc.md)).
- **Mais próximo do app desejado:** FiGO (OpenSCAD + Customizer). Licença CC BY-NC-SA só por busca; reimplementar do zero ([01](01-projetos-similares.md)).
- **Licenças:** SMAL proíbe uso comercial; openscad-wasm GPL-2.0; NASSCAD não é open source; repo `indeterminatedesign/3D-Printed-Dog-Wheelchair` é MIT.
- **Medidas:** método varia por fabricante; app deve registrar qual usou ([02](02-medidas-e-sizing.md)).
- **Evidência clínica:** só survey (62% das respostas de cães, percepção do tutor); sem estudo biomecânico de design. Aviso veterinário obrigatório ([03](03-tipos-e-biomecanica.md)).
- **Raças:** não há tabela única; medida do usuário é a fonte primária ([04](04-dados-de-racas.md)).

## Pendente
1. Abrir no navegador: FiGO (Thingiverse 1095924 / 1397964) e Instructables [2] para confirmar licença.
2. Fontes 🚫: 3, 5, 6, 8, 12, 15, 17, 18, 19, 23, 29, 31, 32, 36, 37, 52.
3. Suplemento de [30] (público?) e conteúdo do "Models & Data.7z" de [33].
4. Sites do "Rodinhas para Todos" e "Tô de Rodas"; grupos Facebook/Instagram; fornecedores BR sem validação ([07](07-impressao-3d-e-materiais.md), [08](08-comunidades-e-foruns.md)).
5. Relato de eixo com bucha/prisioneiro (atribuído à Eddie's) não confirmado.

## Interface e plano (2026-11-20)
Proposta + plano de execução aprovados: [`docs/proposta-interface.md`](../docs/proposta-interface.md).
Decisões: público todos (modo Simples/Avançado), gratuito MIT sem backend, entrega 1 com STL (Replicad), visual misto, salvar local + link, React+Vite+TS, tubo + conexões impressas, usuário tem impressora 3D.
Fases: F0 setup → F1 spike CAD (cotovelo impresso) → F2 modelo → F3 wizard → F4 prancha → F5 peças → F6 saídas → F7 deploy.

## F1 — Spike CAD (2026-11-20)
- Feito: `app/src/cad/parts/cotovelo.ts` (Ø tubo, folga, parede, profundidade, ângulo 30–180°, furo de parafuso), worker Replicad (`cad/worker.ts` + comlink), tela de teste em `app/src/App.tsx` com prévia 3D e botão "Baixar STL". Testes em `cotovelo.test.ts` (OCCT roda no Node).
- Licença: `replicad-opencascadejs` é **LGPL-2.1** (Replicad em si é MIT). Ok para projeto MIT carregando o WASM sem modificar; manter o aviso no README.
- Peso: WASM 22 MB (carrega uma vez, no worker); bundle principal 1,4 MB por causa do three/drei → dividir em F4.
- Impressão: a peça sai deitada (braços na horizontal) e precisa de suporte. Avaliar base plana em F5.
- **Pendente (usuário):** imprimir o cotovelo, testar encaixe no tubo real e anotar a folga que funcionou.

## Próximo passo sugerido
Com a folga calibrada: F2 — modelo paramétrico (`types.ts`, `design.ts`, `bom.ts`, `defaults.ts`) + testes.
