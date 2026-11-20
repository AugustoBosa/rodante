# Rodante

Site gratuito e de código aberto que gera o projeto de uma **cadeira de rodas traseira para cães** a partir das medidas do animal. A pessoa informa 4 medidas e os materiais que tem e recebe:

- modelo 3D do quadro com cotas;
- lista de materiais (BOM) e lista de cortes de tubo (CSV);
- arquivos **STL** das conexões impressas: tê, cotovelo, suporte do eixo, ponteira e clip da sela;
- passo a passo de montagem e alertas de segurança;
- um pacote `.zip` com tudo, um link compartilhável e a prancha pronta para imprimir em PDF.

Tudo roda no navegador. Não há conta nem servidor, e os projetos ficam no `localStorage` de quem usa.

> **Aviso:** nenhum projeto substitui a avaliação de um veterinário ou fisioterapeuta. O projeto é caseiro e não passou por teste de laboratório. Os valores padrão (folgas, Ø do tubo por peso, limite de 40 kg) são estimativas e ficam em `app/src/model/defaults.ts` para calibração.

## Rodar

```bash
cd app
npm install
npm run dev      # http://localhost:5173
npm test         # regras do quadro, peças CAD, link, pacote zip
npm run build    # gera app/dist (site estático)
```

## Publicar

`.github/workflows/deploy.yml` testa, compila e publica no GitHub Pages a cada push em `master`. No repositório do GitHub, ative **Settings → Pages → Source: GitHub Actions**.

## Estrutura

| Pasta | O que tem |
|---|---|
| `app/src/model/` | Regras do quadro em TS puro (`design.ts`), BOM e cortes (`bom.ts`), botões de calibração (`defaults.ts`) |
| `app/src/cad/` | Peças em Replicad (`pecas.ts`), rodando num Web Worker (`worker.ts`) |
| `app/src/ui/` | Telas: início, wizard, prancha técnica com 3D, meus projetos |
| `app/src/store.ts` | localStorage, link compartilhável e validação de dados importados |
| `wiki/` | Pesquisa de apoio (medidas, biomecânica, materiais, licenças) |
| `docs/` | Proposta de interface e plano de execução |

## Licenças

- Código deste repositório: MIT (`LICENSE`).
- `replicad`: MIT. `replicad-opencascadejs` (OpenCascade compilado para WASM): **LGPL-2.1**, usado sem modificação e carregado como biblioteca separada.
- Faixas de peso e altura por raça: aproximações dos padrões AKC, usadas só como alerta.
