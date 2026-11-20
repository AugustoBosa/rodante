import { strToU8, zipSync } from 'fflate'
import type { Design, PecaLista, Projeto } from './model/types'
import { bom, cortes, csv, montagem } from './model/bom'
import { TIPOS } from './model/design'
import { idioma, tr } from './i18n'

export function baixar(nome: string, dados: Blob | string, tipo = 'text/plain;charset=utf-8') {
  const blob = typeof dados === 'string' ? new Blob([dados], { type: tipo }) : dados
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = nome
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 1000)
}

export const slug = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || tr('projeto', 'project')

export const nomeStl = (pc: PecaLista) => `${slug(pc.nome)}_x${pc.qtd}.stl`

export const linhasCortes = (d: Design): Record<string, string | number>[] =>
  cortes(d).map((c): Record<string, string | number> =>
    idioma === 'en' ? { part: c.nome, length_mm: c.comprimento, qty: c.qtd } : { peca: c.nome, comprimento_mm: c.comprimento, qtd: c.qtd },
  )

export const DICA_IMPRESSAO: Record<PecaLista['spec']['tipo'], string> = {
  cotovelo: tr('Deitada, com suporte nos furos.', 'Lying flat, with supports in the bores.'),
  te: tr('Deitada, com suporte nos furos.', 'Lying flat, with supports in the bores.'),
  suporteEixo: tr('Em pé, base plana na mesa. Sem suporte.', 'Standing, flat base on the bed. No supports.'),
  ponteira: tr('Boca para baixo, passador para cima.', 'Opening down, strap slot up.'),
  clipSela: tr('Em pé. PETG ou TPU (mais flexível para encaixar).', 'Standing. PETG or TPU (more flexible to snap on).'),
}

const ARQ = {
  bom: tr('lista-de-materiais.csv', 'bill-of-materials.csv'),
  cortes: tr('cortes.csv', 'cuts.csv'),
  conjunto: tr('conjunto-montado.step', 'assembly.step'),
  leiaMe: tr('LEIA-ME.txt', 'README.txt'),
}

function leiaMe(p: Projeto, d: Design): string {
  const c = d.cotas
  const md = p.medidas
  const tipo = TIPOS.find((t) => t.id === p.tipo)!.nome.toLowerCase()
  return [
    tr(`RODANTE — cadeira de rodas (${tipo}) para ${p.cao.nome} (${p.cao.pesoKg} kg)`, `RODANTE — dog wheelchair (${tipo}) for ${p.cao.nome} (${p.cao.pesoKg} kg)`),
    tr(`Gerado em ${new Date().toLocaleString('pt-BR')}`, `Generated on ${new Date().toLocaleString('en-US')}`),
    '',
    tr(
      'AVISO: avaliação de veterinário ou fisioterapeuta é obrigatória antes do uso. Projeto caseiro, sem teste de laboratório.',
      'WARNING: a vet or physiotherapist assessment is required before use. Home-made design, not lab tested.',
    ),
    '',
    tr('MEDIDAS DO CÃO (cm, deitado de lado)', 'DOG MEASUREMENTS (cm, lying on its side)'),
    tr(
      `  perna traseira ${md.alturaPernaCm || '—'} · perna dianteira ${md.alturaPernaDianteiraCm || '—'} · comprimento ${md.comprimentoCm} · largura ${md.larguraCm} · costas ${md.alturaCostasCm}`,
      `  hind leg ${md.alturaPernaCm || '—'} · front leg ${md.alturaPernaDianteiraCm || '—'} · length ${md.comprimentoCm} · width ${md.larguraCm} · back ${md.alturaCostasCm}`,
    ),
    '',
    tr('COTAS DO QUADRO (mm)', 'FRAME DIMENSIONS (mm)'),
    tr(
      `  altura do trilho ${c.alturaTrilho} · comprimento ${c.comprimentoTrilho} · largura interna ${c.larguraInterna} · largura total ${c.larguraTotal} · altura do eixo ${c.alturaEixo}`,
      `  rail height ${c.alturaTrilho} · length ${c.comprimentoTrilho} · inner width ${c.larguraInterna} · overall width ${c.larguraTotal} · axle height ${c.alturaEixo}`,
    ),
    '',
    tr('ALERTAS', 'ALERTS'),
    ...d.alertas.map((a) => `  [${a.nivel}] ${a.texto}`),
    '',
    tr('IMPRESSÃO (pasta stl/, o número no nome é a quantidade)', 'PRINTING (stl/ folder, the number in the name is the quantity)'),
    ...d.pecas.map((pc) => `  ${pc.nome} ×${pc.qtd}: ${DICA_IMPRESSAO[pc.spec.tipo]}`),
    '',
    tr('MONTAGEM', 'ASSEMBLY'),
    ...montagem(p, d).map((m, i) => `  ${i + 1}. ${m}`),
    '',
    tr(
      `Arquivos: stl/ (para imprimir), step/ (para CAD, inclui o conjunto montado), ${ARQ.bom}, ${ARQ.cortes}, projeto.json (reabra em "Meus projetos" > Importar).`,
      `Files: stl/ (to print), step/ (for CAD, includes the full assembly), ${ARQ.bom}, ${ARQ.cortes}, projeto.json (reopen it in "My projects" > Import).`,
    ),
  ].join('\r\n')
}

export async function pacoteZip(p: Projeto, d: Design, stls: Record<string, Blob>, steps: Record<string, Blob> = {}, conjunto?: Blob): Promise<Blob> {
  const arquivos: Record<string, Uint8Array> = {}
  const bytes = async (b: Blob) => new Uint8Array(await b.arrayBuffer())
  for (const pc of d.pecas) {
    if (stls[pc.chave]) arquivos[`stl/${nomeStl(pc)}`] = await bytes(stls[pc.chave])
    if (steps[pc.chave]) arquivos[`step/${nomeStl(pc).replace(/\.stl$/, '.step')}`] = await bytes(steps[pc.chave])
  }
  if (conjunto) arquivos[`step/${ARQ.conjunto}`] = await bytes(conjunto)
  arquivos[ARQ.bom] = strToU8(csv(bom(p, d) as never))
  arquivos[ARQ.cortes] = strToU8(csv(linhasCortes(d)))
  arquivos['projeto.json'] = strToU8(JSON.stringify(p, null, 2))
  arquivos[ARQ.leiaMe] = strToU8(leiaMe(p, d))
  return new Blob([zipSync(arquivos) as BlobPart], { type: 'application/zip' })
}
