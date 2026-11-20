# 09 — Arquitetura sugerida

[← Índice](README.md) · Síntese das páginas [01](01-projetos-similares.md)–[08](08-comunidades-e-foruns.md)

## Stack proposta
| Camada | Escolha | Por quê |
|---|---|---|
| Visualização | Three.js | Padrão; integra com Replicad |
| Geometria | Replicad (OCCT/WASM, MIT) [38] | Sólidos exatos; STL/STEP confirmados no código |
| Fallback | openscad-wasm [58] | Reusar lógica estilo FiGO [12] |
| Dados de raça | JSON seed com fonte por linha ([04](04-dados-de-racas.md)) | Simples, auditável |
| Saídas | BOM (CSV/PDF), lista de cortes, STL/STEP | O que o usuário fabrica |
| IFC | Opcional, depois [47] | YAGNI |

## Fluxo
1. Escolhe raça/porte → valores sugeridos.
2. Informa medidas ([02](02-medidas-e-sizing.md)); app valida faixas.
3. Escolhe tipo (MVP: rear) e roda/tubo disponíveis.
4. Modelo paramétrico → 3D, BOM, cortes, STL das conexões.
5. Aviso veterinário visível ([03](03-tipos-e-biomecanica.md)).

## MVP
Rear-support de tubo + peças impressas de conexão e sela, sem login, tudo no navegador.

## Riscos
- **Segurança do animal:** projeto errado pode ferir; exigir disclaimer e margens de segurança conservadoras.
- **Licenças:** FiGO é NC-SA segundo busca (não confirmado); SMAL **proíbe uso comercial** (confirmado); openscad-wasm é GPL-2.0 (copyleft se embutir); NASSCAD não é open source. Replicad (MIT) e o repo [59] (MIT) são seguros.
- **Resistência das peças impressas:** sem dados validados; testar.
- **Fontes fracas:** muitas são comerciais ([10](10-glossario-e-fontes.md#fontes)).

## Próximos passos
1. Verificar links e licenças (🔎 → ✅).
2. Completar busca GitHub/fóruns ([01](01-projetos-similares.md), [08](08-comunidades-e-foruns.md)).
3. Protótipo: uma peça em Replicad exportada em STL.
