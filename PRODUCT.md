# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
- **Tutor** de um cão com perda de mobilidade (traseira, dianteira ou geral), em casa, quase sempre no celular, medindo o cão com ajuda de outra pessoa e uma fita métrica.
- **Profissional** (fisioterapeuta veterinário, serralheiro, maker com impressora 3D) que monta cadeiras para clientes; usa o PC para ajustar parâmetros, ler a prancha e baixar arquivos.
- **ONG / protetor** que faz cadeiras em série para cães resgatados, com orçamento curto.

## Product Purpose
Rodante transforma algumas medidas do cão e os materiais que a pessoa tem (tubo, roda, eixo, parafuso) em um projeto completo de cadeira de rodas: modelo 3D, lista de materiais, cortes de tubo, passo a passo de montagem e as conexões para imprimir em 3D (STL e STEP). Sucesso = alguém sem formação técnica sai com um projeto que dá para comprar, cortar, imprimir e montar.

## Positioning
O projeto é calculado na hora para as medidas daquele cão e para o material que a pessoa já tem, e devolve peças imprimíveis reais (geradas por CAD no navegador), não um molde genérico nem um produto à venda.

## Operating Context
- Medição: cão deitado de lado, fita métrica, duas pessoas. A medida do usuário é a fonte; a raça (faixas AKC aproximadas) só alerta.
- Três tipos: cadeira traseira, dianteira e de 4 rodas. Quem indica o tipo é o veterinário.
- Fabricação: tubo de alumínio ou PVC, rodas compradas, conexões impressas em PETG.
- Saídas: pacote .zip (BOM, cortes, LEIA-ME, STL/STEP por peça, STEP do conjunto), CSV, link compartilhável, impressão da prancha (Ctrl+P).

## Capabilities and Constraints
- Sem backend: projetos no `localStorage`, link `#/p/…`, import/export `.json`.
- Motor CAD (Replicad/OpenCascade WASM) roda num Web Worker; é pesado e só deve carregar quando necessário.
- Idiomas: pt-BR e inglês (`tr(pt, en)`).
- Modos Simples/Avançado na prancha.
- Valores de calibração ainda sem validação física (ver `wiki/STATUS.md`).

## Brand Commitments
- Nome: **Rodante** (definitivo). Gratuito, código aberto (MIT).
- Aviso veterinário obrigatório: no Início, checkbox na Revisão do wizard e na Prancha. Um erro de segurança bloqueia o download.

## Evidence on Hand
- Cálculo real do quadro e peças (`app/src/model/*`, `app/src/cad/*`), com testes.
- Pesquisa em `wiki/` (projetos similares, medidas, biomecânica, materiais).
- Não existem: depoimentos, fotos de cadeiras montadas, números de usuários, cadeira de teste montada. Não inventar.

## Product Principles
1. Segurança antes de conveniência: o aviso veterinário e os alertas nunca ficam escondidos.
2. Leigo primeiro: cada medida e cada passo explicados com figura e linguagem simples.
3. Mostrar, não prometer: o 3D e as peças reais são a prova.
4. Funciona no celular de quem mede e no PC de quem fabrica.

## Accessibility & Inclusion
WCAG AA; foco visível; navegação por teclado no wizard e nas abas; `prefers-reduced-motion` respeitado; alternativa sem WebGL.
