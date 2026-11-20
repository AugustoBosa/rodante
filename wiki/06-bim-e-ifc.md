# 06 — BIM e IFC

[← Índice](README.md) · Fontes: [10](10-glossario-e-fontes.md#fontes)

## O que "BIM" significa aqui
Um **modelo único paramétrico** que gera: lista de materiais (BOM), cortes e medidas, desenhos e arquivos de fabricação (STL/STEP). IFC (formato de construção civil) só entra se houver demanda real; para uma cadeira, BOM + STL/STEP basta.

| Ferramenta | Fonte | Utilidade |
|---|---|---|
| web-ifc ✅ | [47] | Ler/escrever IFC no navegador. **MPL-2.0** (copyleft por arquivo; uso como dependência permitido), 1094★, ativo. Opcional |
| @thatopen/components ✅ | [62] | Toolkit BIM de alto nível. **MIT**, ativo |
| web-ifc-three ✅ | [48] | MIT, parado desde 2024-04 (deprecado). Não usar |
| FreeCAD BIM workbench (1.0) ✅ | [49] [50] | Referência de fluxo BIM (guia [49] é de 2020, desatualizado; wiki [50] CC BY-SA, FreeCAD LGPLv2) |

## Como usar no projeto
- Tratar a cadeira como "assembly" com peças, cada uma com material, dimensões e quantidade → BOM automático.
- Deixar IFC como exportação opcional futura.
- FreeCAD serve para validar o desenho manualmente antes de codificar.
