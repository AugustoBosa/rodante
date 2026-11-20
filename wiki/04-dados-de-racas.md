# 04 — Dados de raças

[← Índice](README.md) · Fontes: [10](10-glossario-e-fontes.md#fontes)

Não existe tabela única e confiável de medidas por raça. As fontes abaixo dão base científica; para o app, **a medida informada pelo usuário é a fonte primária** e a raça só sugere valores iniciais.

| Fonte | O que oferece | Observação |
|---|---|---|
| [30] ✅ | Sutter et al. 2008: 27 medidas em 1.155 cães; 13 métricas para 109 de 159 raças; só 53 raças com ≥3 machos e ≥3 fêmeas | Suplemento (PDF) com acesso possivelmente restrito: não confirmado |
| [31] [32] 🚫 | PubMed e Springer não abriram; [32] é o mesmo artigo de [30] | — |
| [33] ✅ | Dataset Liverpool, **CC BY 4.0**: 13 raças; "Code & Data.7z" (573 kB), "Models & Data.7z" (1 GB) | Conteúdo dos arquivos não inspecionado (pode ser CT/modelos, não medidas) |
| Padrões de raça (CKC, NZ Kennel) | Faixas de altura/proporção corpo÷altura | Dão faixa, não medidas de cadeira |
| [34] | Agregador de dimensões por raça | ⚠️ baixa autoridade, valores divergem |
| [35] ✅ | SMAL (modelo 3D articulado, inclui cão) | **Uso comercial proibido**; licença comercial via ps-license@tue.mpg.de |
| [36] [37] 🚫 | D-SMAL/BITE, RGBD-Dog | 403; derivados do SMAL, assumir não comercial. DogFLW não é público |

## Como usar no projeto
- Seed em JSON: raça → faixa de peso, altura, comprimento, proporção (fonte registrada por linha).
- Alternativa por **porte** (mini/pequeno/médio/grande/gigante) para raças mistas.
- Modelo 3D de cão (SMAL) só como visualização futura, depois de confirmar licença.
