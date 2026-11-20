# 05 — Ferramentas de CAD paramétrico no navegador

[← Índice](README.md) · Fontes: [10](10-glossario-e-fontes.md#fontes)

| Ferramenta | Fonte | Tipo | Exporta | Notas |
|---|---|---|---|---|
| **Replicad** ✅ | [38] | Biblioteca JS sobre OpenCascade (WASM). **MIT**, 719★, ativo | `blobSTL` e `blobSTEP` confirmados no código-fonte | **Candidata principal** (a doc só lista `exportSTEP`/`STLExportOptions`) |
| OpenCascade.js ✅ | [39] | Porte do OCCT para WASM; licença no repo (não vista) | STEP, STL | Base do Replicad; mais baixo nível |
| Cascade Studio ✅ | [40] | IDE de CAD por código (OCCT). MIT, ativo | STEP, STL | Prototipar peças antes de portar |
| Bitbybit ✅ | [41] | TypeScript sobre OCCT, JSCAD, Manifold. MIT, ativo | vários | Alternativa all-in-one |
| JSCAD ✅ | [42] | Mesh/CSG em JS. MIT, ativo | STL | Sem B-rep (sem STEP) |
| openscad-wasm ✅ | [58] | OpenSCAD no navegador (repo oficial openscad/openscad-wasm). **GPL-2.0** | STL | Copyleft se embutir no app; reaproveita estilo FiGO |
| CADAM ✅ | [43] | Texto→OpenSCAD com Claude, sliders. GPL-3.0 (segundo o post) | STL | Referência de UX de parâmetros |
| JSketcher / ArcCAD ✅ | [44] [45] | CAD 2D/3D; licenças não reconhecidas, ArcCAD tem 2★ | — | Só referência de UI |
| NASSCAD ✅ | [46] | CAD em um HTML | STEP/STL | **Não é open source** (uso pessoal/educacional): não usar |
| CadQuery | — | Python | — | Sem build para navegador (lacuna) |

## Como usar no projeto
- Visualização: Three.js (padrão do ecossistema).
- Geometria: **Replicad** para peças impressas (STL) e eixos/tubos (STEP/desenho). Fallback: openscad-wasm.
- Validar cedo: exportar uma peça simples de conexão em STL e abrir no fatiador.
