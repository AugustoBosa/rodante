import { strToU8, zipSync } from 'fflate'
import type { Design, PecaLista, Projeto } from './model/types'
import { bom, cortes, csv, montagem } from './model/bom'

export function baixar(nome: string, dados: Blob | string, tipo = 'text/plain;charset=utf-8') {
  const blob = typeof dados === 'string' ? new Blob([dados], { type: tipo }) : dados
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = nome
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 1000)
}

export const slug = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'projeto'

export const nomeStl = (pc: PecaLista) => `${slug(pc.nome)}_x${pc.qtd}.stl`

export const linhasCortes = (d: Design) => cortes(d).map((c) => ({ peca: c.nome, comprimento_mm: c.comprimento, qtd: c.qtd }))

export const DICA_IMPRESSAO: Record<PecaLista['spec']['tipo'], string> = {
  cotovelo: 'Deitada, com suporte nos furos.',
  te: 'Deitada, com suporte nos furos.',
  suporteEixo: 'Em pé, base plana na mesa. Sem suporte.',
  ponteira: 'Boca para baixo, passador para cima.',
  clipSela: 'Em pé. PETG ou TPU (mais flexível para encaixar).',
}

function leiaMe(p: Projeto, d: Design): string {
  const c = d.cotas
  return [
    `RODANTE — projeto de cadeira de rodas traseira para ${p.cao.nome} (${p.cao.pesoKg} kg)`,
    `Gerado em ${new Date().toLocaleString('pt-BR')}`,
    '',
    'AVISO: avaliação de veterinário ou fisioterapeuta é obrigatória antes do uso. Projeto caseiro, sem teste de laboratório.',
    '',
    'MEDIDAS DO CÃO (cm, deitado de lado)',
    `  perna traseira ${p.medidas.alturaPernaCm} · comprimento ${p.medidas.comprimentoCm} · largura ${p.medidas.larguraCm} · costas ${p.medidas.alturaCostasCm}`,
    '',
    'COTAS DO QUADRO (mm)',
    `  altura do trilho ${c.alturaTrilho} · comprimento ${c.comprimentoTrilho} · largura interna ${c.larguraInterna} · largura total ${c.larguraTotal} · altura do eixo ${c.alturaEixo}`,
    '',
    'ALERTAS',
    ...d.alertas.map((a) => `  [${a.nivel}] ${a.texto}`),
    '',
    'IMPRESSÃO (pasta stl/, o número no nome é a quantidade)',
    ...d.pecas.map((pc) => `  ${pc.nome} ×${pc.qtd}: ${DICA_IMPRESSAO[pc.spec.tipo]}`),
    '',
    'MONTAGEM',
    ...montagem(d).map((m, i) => `  ${i + 1}. ${m}`),
    '',
    'Arquivos: lista-de-materiais.csv, cortes.csv, projeto.json (reabra em "Meus projetos" > Importar).',
  ].join('\r\n')
}

export async function pacoteZip(p: Projeto, d: Design, stls: Record<string, Blob>): Promise<Blob> {
  const arquivos: Record<string, Uint8Array> = {}
  for (const pc of d.pecas) {
    const b = stls[pc.chave]
    if (b) arquivos[`stl/${nomeStl(pc)}`] = new Uint8Array(await b.arrayBuffer())
  }
  arquivos['lista-de-materiais.csv'] = strToU8(csv(bom(p, d) as never))
  arquivos['cortes.csv'] = strToU8(csv(linhasCortes(d)))
  arquivos['projeto.json'] = strToU8(JSON.stringify(p, null, 2))
  arquivos['LEIA-ME.txt'] = strToU8(leiaMe(p, d))
  return new Blob([zipSync(arquivos) as BlobPart], { type: 'application/zip' })
}
