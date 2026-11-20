# 02 — Medidas e sizing

[← Índice](README.md) · Fontes: [10](10-glossario-e-fontes.md#fontes)

## Como os fabricantes medem
| Fonte | Método resumido |
|---|---|
| [21] Walkin' Pets | Altura da perna traseira com o cão deitado de lado, da prega onde a coxa encontra o corpo até a almofada plantar, sem esticar. Comprimento: de trás da pata dianteira à garupa. Largura: ponto mais largo + folga (~6 in por lado segundo o FAQ) |
| [22] K9 Carts ✅ | 4 medidas: altura (costas→chão), comprimento (meio dos ombros→meio dos quadris), largura e circunferência no ponto mais largo |
| [23] Eddie's Wheels 🚫 | Guia visual em PDF; não conseguimos extrair o texto, abrir à mão |
| [24] Walkin' Pets ✅ | Raça, peso e altura da perna traseira (deitado de lado); calculadora SureFit. Abaixo de 25 lb: comprimento axila→garupa [21] |
| [51] Disabled Dog Mobility Hub | Compara métodos por fabricante |
| [17] Petz (BR) | Peitoral: somar ~30 cm à distância entre faixa no peito e patas traseiras |

> O método **varia por fabricante**. O app deve registrar qual método foi usado.

## Variáveis de entrada sugeridas (rascunho)
| Variável | Observação |
|---|---|
| Peso (kg) | Dimensiona tubo, eixo e roda |
| Altura da perna traseira | Define altura do quadro/eixo |
| Comprimento do tronco | Define comprimento do quadro |
| Largura do corpo (ponto mais largo) | + folga lateral |
| Altura do peito ao chão, altura das costas | Usadas por fabricantes BR |
| Ø da roda disponível | Altura do quadro = f(Ø roda) [10] |
| Ø e espessura do tubo, tamanho do parafuso | Estilo FiGO [12] |

## Regras práticas encontradas
- Altura do quadro depende do diâmetro da roda; resultado negativo ⇒ roda menor [10].
- Começar mais baixo para o cão se adaptar; patas devem poder tocar o chão [11].
- Eixo: bucha/rolamento + prisioneiro travado; parafuso solto causou queda relatada (**de resultado de busca; o FAQ [55] aberto não confirma**; tratar como boa prática, não como fato).
- Largura: apertado atrita, largo perde estabilidade/alinhamento [21].
- ⚠️ Evitar página que mede por "altura do cotovelo" (fonte não confiável, não alinha com fabricantes).
