# 07 — Impressão 3D e materiais

[← Índice](README.md) · Fontes: [10](10-glossario-e-fontes.md#fontes)

## Materiais vistos nos projetos
| Componente | Opções encontradas | Fonte |
|---|---|---|
| Quadro | Tubo de alumínio, PVC, fibra de carbono | [2] [7] [1] |
| Sela/conexões | PLA impresso (sela); TPU em conceitos anatômicos | [2] [16] |
| Rodas | Carrinho de feira/bebê, cortador de grama, bicicleta (porte maior) | [8] [11] [17] |
| Eixo | Barra de ferro/threaded rod; ideal com bucha/rolamento e prisioneiro travado | [17] [55] |
| Corpo/apoio | Tecido, faixa de nylon, arnês comercial | [17] [3] |
| Acabamento | Tampas nas pontas dos tubos | [17] |

## Pontos de atenção
- PLA pode deformar com calor/uso; peças estruturais pedem PETG ou outro material mais resistente (a validar com testes; não encontrei fonte).
- Parafuso solto causou queda em cadeira comercial: prever trava química/contraporca e inspeção periódica [55].
- Custos relatados: ~US$150 [2], <£20 com sucata [3].

> Dos materiais acima, só [13] (Make:) e [7] foram abertos; os demais vêm de snippets de busca. O relato de eixo com bucha/prisioneiro [55] **não foi confirmado** no FAQ aberto.

## Fornecedores BR (🔎 só resultados de busca, nada validado)
Antes de usar, conferir Ø externo e parede do tubo e o tipo de eixo da roda (anúncios variam entre 1/2", 3/4" e 7/8").
- **Tubo de alumínio:** [Alumais Metais](https://www.mercadolivre.com.br/pagina/alumaismetais) · [Mercado Metais](https://www.mercadolivre.com.br/pagina/mercadometais) · [Alumínio Alure](https://www.mercadolivre.com.br/pagina/alumnioalure) · [Alumarx](https://www.mercadolivre.com.br/pagina/comercialalumarxdistribuidor) · [Loja do Mecânico](https://www.lojadomecanico.com.br/buscar/tubo-de-aluminio-16mm) · [AECweb (diretório)](https://www.aecweb.com.br/produto/perfil-tubular-de-aluminio/36715)
- **PVC e conexões (Tigre/Amanco):** só achados em agregadores de preço ([Zoom](https://www.zoom.com.br/tubos-conexoes), [Bondfaro](https://www.bondfaro.com.br/tubos-conexoes)); buscar loja de materiais de construção.
- **Rodas:** [Rodas para carrinhos](https://www.mercadolivre.com.br/pagina/rodasparacarrinhos) · [VL Distribuição](https://www.mercadolivre.com.br/pagina/vldistribuicao) · [roda borracha maciça 8" (Loja do Mecânico)](https://www.lojadomecanico.com.br/produto/84564/42/447/carro-de-carga-180kg-com-roda-de-borracha-macica-8-pol-fercar-ccm180)

## Como usar no projeto
- BOM gera: tubo (Ø, comprimento de cada corte), conexões impressas, eixo, rodas, parafusos, tecido.
- Pendente: fornecedores BR de tubo, roda e conexão; testes de carga das peças impressas.
