import type { Design, Projeto } from './types'
import { raioExterno } from './design'
import { idioma, tr } from '../i18n'

export interface LinhaBom {
  item: string
  especificacao: string
  qtd: number
  un: string
  obs: string
}

const PERDA_CORTE = 1.1 // +10% de tubo para erro de corte

export function bom(p: Projeto, d: Design): LinhaBom[] {
  const m = p.materiais
  const totalTubo = d.tubos.reduce((s, t) => s + Math.max(0, t.comprimento), 0)
  const encaixes = d.pecas.reduce((s, pc) => s + pc.qtd * encaixesPorPeca(pc.spec.tipo), 0)
  const ro = raioExterno({ tuboD: m.tuboD, folga: p.ajustes.folgaImpressao, parede: p.ajustes.paredeConexao })
  const rodas = d.rodas.length
  const un = tr('un', 'pcs')
  const linhas: LinhaBom[] = [
    {
      item: m.tubo === 'aluminio' ? tr('Tubo de alumínio', 'Aluminum tube') : tr('Tubo de PVC', 'PVC pipe'),
      especificacao: tr(`Ø ${m.tuboD} mm, parede ${m.tuboParede} mm`, `Ø ${m.tuboD} mm, wall ${m.tuboParede} mm`),
      qtd: Math.ceil((totalTubo * PERDA_CORTE) / 10) / 100,
      un: 'm',
      obs: tr('Inclui 10% de perda. Cortes na aba Cortes', 'Includes 10% waste. See the Cuts tab'),
    },
    ...d.pecas.map((pc) => ({
      item: `${pc.nome} ${tr('(impresso)', '(printed)')}`,
      especificacao: tr('PETG, 4 paredes, 40% preenchimento', 'PETG, 4 walls, 40% infill'),
      qtd: pc.qtd,
      un,
      obs: tr('STL na aba Peças', 'STL in the Parts tab'),
    })),
    {
      item: tr('Roda', 'Wheel'),
      especificacao: tr(`Ø ${m.rodaD} mm, largura ${m.rodaLargura} mm, furo para eixo ${m.eixoD} mm`, `Ø ${m.rodaD} mm, width ${m.rodaLargura} mm, ${m.eixoD} mm axle bore`),
      qtd: rodas,
      un,
      obs: tr('Com rolamento ou bucha', 'With bearing or bushing'),
    },
    {
      item: tr('Parafuso-eixo', 'Axle bolt'),
      especificacao: tr(`M${m.eixoD}, comprimento ≥ ${Math.ceil(2 * ro + m.rodaLargura + 15)} mm, sextavado`, `M${m.eixoD}, length ≥ ${Math.ceil(2 * ro + m.rodaLargura + 15)} mm, hex head`),
      qtd: rodas,
      un,
      obs: tr('Parte lisa onde gira a roda', 'Smooth shank where the wheel turns'),
    },
    { item: tr('Porca autotravante do eixo', 'Axle lock nut'), especificacao: `M${m.eixoD} (nylon)`, qtd: rodas, un, obs: tr('Nunca porca comum', 'Never a plain nut') },
    { item: tr('Arruela do eixo', 'Axle washer'), especificacao: `M${m.eixoD}`, qtd: 3 * rodas, un, obs: '' },
  ]
  if (m.parafusoD > 0)
    linhas.push(
      { item: tr('Parafuso de trava do tubo', 'Tube locking bolt'), especificacao: `M${m.parafusoD} × ${Math.ceil(2 * ro + 8)} mm`, qtd: encaixes, un, obs: tr('Um por encaixe', 'One per socket') },
      { item: tr('Porca autotravante', 'Lock nut'), especificacao: `M${m.parafusoD}`, qtd: encaixes, un, obs: '' },
    )
  linhas.push(
    { item: tr('Fita de nylon', 'Nylon webbing'), especificacao: '25 mm', qtd: 2, un: 'm', obs: tr('Sela/argolas das pernas', 'Saddle / leg rings') },
    { item: tr('Espuma ou neoprene', 'Foam or neoprene'), especificacao: tr('5 mm, para forrar a sela', '5 mm, to pad the saddle'), qtd: 1, un, obs: '~30 × 20 cm' },
    p.tipo === 'traseira'
      ? { item: tr('Peitoral (arnês)', 'Chest harness'), especificacao: tr(`para cão de ${p.cao.pesoKg} kg`, `for a ${p.cao.pesoKg} kg dog`), qtd: 1, un, obs: tr('Comercial; prende nas ponteiras', 'Off the shelf; ties to the end caps') }
      : p.tipo === 'dianteira'
        ? { item: tr('Arnês de quadril', 'Hip harness'), especificacao: tr(`para cão de ${p.cao.pesoKg} kg`, `for a ${p.cao.pesoKg} kg dog`), qtd: 1, un, obs: tr('Prende nas ponteiras de trás', 'Ties to the rear end caps') }
        : { item: tr('Sela de corpo inteiro', 'Full-body sling'), especificacao: tr('Tecido resistente com alças', 'Sturdy fabric with straps'), qtd: 1, un, obs: tr('Apoia peito e barriga; presa nos clips', 'Supports chest and belly; hangs from the clips') },
  )
  return linhas
}

function encaixesPorPeca(tipo: string): number {
  return ({ te: 3, cotovelo: 2, suporteEixo: 1, ponteira: 1 } as Record<string, number>)[tipo] ?? 0
}

export function cortes(d: Design) {
  const mapa = new Map<string, { nome: string; comprimento: number; qtd: number }>()
  for (const t of d.tubos) {
    const nome = t.nome.replace(/ \([^)]*\)$/, '') // tira o lado: (esq)/(dir)/(left)/(right)
    const k = `${nome}|${t.comprimento}`
    const atual = mapa.get(k)
    if (atual) atual.qtd++
    else mapa.set(k, { nome, comprimento: t.comprimento, qtd: 1 })
  }
  return [...mapa.values()]
}

export function montagem(p: Projeto, d: Design): string[] {
  const ponteiras = d.pecas.some((pc) => pc.spec.tipo === 'ponteira')
  const eixos = d.rodas.length / 2
  const duasBarras = (d.pecas.find((pc) => pc.spec.tipo === 'cotovelo')?.qtd ?? 0) >= 4
  return [
    tr('Imprima todas as peças em PETG. Teste o encaixe de uma conexão no tubo antes de imprimir o resto.', 'Print all parts in PETG. Test one connector on the tube before printing the rest.'),
    tr('Corte os tubos conforme a aba Cortes. Lixe as rebarbas e confira cada medida.', 'Cut the tubes as listed in the Cuts tab. Deburr and check every length.'),
    tr('Monte cada lateral seguindo a ordem do trilho (Trilho 1, 2, 3…), com os tês nas posições do modelo 3D.', 'Build each side following the rail order (Rail 1, 2, 3…), with the tees where the 3D model shows them.'),
    tr(
      `Em cada eixo${eixos > 1 ? ' (frente e trás)' : ''}: tê 90° → perna superior → tê 45° → perna inferior → suporte do eixo. Feche o triângulo com a diagonal.`,
      `At each axle${eixos > 1 ? ' (front and rear)' : ''}: 90° tee → upper leg → 45° tee → lower leg → axle mount. Close the triangle with the brace.`,
    ),
    duasBarras ? tr('Una as duas laterais com as barras da frente e de trás.', 'Join both sides with the front and rear crossbars.') : tr('Una as duas laterais com a barra.', 'Join both sides with the crossbar.'),
    tr('Fure os tubos pelos furos das conexões e trave com parafuso e porca autotravante.', 'Drill the tubes through the connector holes and lock with bolt and lock nut.'),
    tr('Monte as rodas no suporte: parafuso-eixo, arruela, roda, arruela, porca autotravante. A roda deve girar sem folga.', 'Mount the wheels: axle bolt, washer, wheel, washer, lock nut. The wheel must spin without play.'),
    ponteiras
      ? p.tipo === 'dianteira'
        ? tr('Encaixe as ponteiras e prenda nelas o arnês de quadril com a fita.', 'Fit the end caps and tie the hip harness to them with webbing.')
        : tr('Encaixe as ponteiras e prenda nelas o peitoral com a fita.', 'Fit the end caps and tie the chest harness to them with webbing.')
      : tr('Prenda a sela de corpo inteiro nos clips, com alças sob o peito e a barriga.', 'Hang the full-body sling from the clips, with straps under chest and belly.'),
    tr(
      `Prenda os clips da sela no trilho e passe a fita forrada por baixo do corpo. Altura do trilho: ${d.cotas.alturaTrilho} mm do chão.`,
      `Snap the saddle clips onto the rail and run the padded webbing under the body. Rail height: ${d.cotas.alturaTrilho} mm from the ground.`,
    ),
    tr('Coloque o cão com ajuda de outra pessoa. Confira: patas tocam o chão, nada raspa, coluna reta.', 'Put the dog in with a helper. Check: paws touch the ground, nothing rubs, spine is straight.'),
  ]
}

export function csv(linhas: Record<string, string | number>[]): string {
  if (!linhas.length) return ''
  // pt-BR: ';' e vírgula decimal (Excel brasileiro); en: ',' e ponto
  const sep = idioma === 'en' ? ',' : ';'
  const cab = Object.keys(linhas[0])
  const cel = (v: string | number) => {
    const s = typeof v === 'number' ? (idioma === 'en' ? String(v) : String(v).replace('.', ',')) : v
    return new RegExp(`[${sep}"\\n]`).test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  return '﻿' + [cab.join(sep), ...linhas.map((l) => cab.map((c) => cel(l[c])).join(sep))].join('\r\n')
}
