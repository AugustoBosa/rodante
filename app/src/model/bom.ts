import type { Design, Projeto } from './types'
import { raioExterno } from './design'
import { formatoNumero, separadorCsv, tr } from '../i18n'

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
      especificacao: tr('Ø {tuboD} mm, parede {tuboParede} mm', 'Ø {tuboD} mm, wall {tuboParede} mm', { tuboD: m.tuboD, tuboParede: m.tuboParede }),
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
      especificacao: tr('Ø {rodaD} mm, largura {rodaLargura} mm, furo para eixo {eixoD} mm', 'Ø {rodaD} mm, width {rodaLargura} mm, {eixoD} mm axle bore', { rodaD: m.rodaD, rodaLargura: m.rodaLargura, eixoD: m.eixoD }),
      qtd: rodas,
      un,
      obs: tr('Com rolamento ou bucha', 'With bearing or bushing'),
    },
    {
      item: tr('Parafuso-eixo', 'Axle bolt'),
      especificacao: tr('M{eixoD}, comprimento ≥ {v} mm, sextavado', 'M{eixoD}, length ≥ {v} mm, hex head', { eixoD: m.eixoD, v: Math.ceil(2 * ro + m.rodaLargura + 15) }),
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
  const c = cintas(p, d)
  linhas.push(
    {
      item: tr('Fita de nylon', 'Nylon webbing'),
      especificacao: '25 mm',
      qtd: c.fitaM,
      un: 'm',
      obs: tr(
        '{sela} cinta(s) de sela de ~{selaCm} cm{extra}, com 10% de sobra (estimativa)',
        '{sela} saddle strap(s) of ~{selaCm} cm{extra}, with 10% spare (estimate)',
        {
          sela: c.sela,
          selaCm: Math.round(c.selaMm / 10),
          extra: c.ligacoes
            ? tr(' + {n} ligação(ões) ao arnês de ~{cm} cm', ' + {n} harness link(s) of ~{cm} cm', { n: c.ligacoes, cm: Math.round(c.ligacaoMm / 10) })
            : '',
        },
      ),
    },
    { item: tr('Velcro (ou fivela) para a cinta', 'Velcro (or buckle) for the strap'), especificacao: tr('25 mm, ~10 cm por cinta', '25 mm, ~10 cm per strap'), qtd: c.sela + c.ligacoes, un, obs: tr('Fecha cada cinta e permite ajustar', 'Closes each strap and allows adjusting') },
    { item: tr('Espuma ou neoprene', 'Foam or neoprene'), especificacao: tr('5 mm, para forrar a sela', '5 mm, to pad the saddle'), qtd: 1, un, obs: '~30 × 20 cm' },
    p.tipo === 'traseira'
      ? { item: tr('Peitoral (arnês)', 'Chest harness'), especificacao: tr('para cão de {pesoKg} kg', 'for a {pesoKg} kg dog', { pesoKg: p.cao.pesoKg }), qtd: 1, un, obs: tr('Comercial; prende nas ponteiras', 'Off the shelf; ties to the end caps') }
      : p.tipo === 'dianteira'
        ? { item: tr('Arnês de quadril', 'Hip harness'), especificacao: tr('para cão de {pesoKg} kg', 'for a {pesoKg} kg dog', { pesoKg: p.cao.pesoKg }), qtd: 1, un, obs: tr('Prende nas ponteiras de trás', 'Ties to the rear end caps') }
        : { item: tr('Sela de corpo inteiro', 'Full-body sling'), especificacao: tr('Tecido resistente com alças', 'Sturdy fabric with straps'), qtd: 1, un, obs: tr('Apoia peito e barriga; presa nos clips', 'Supports chest and belly; hangs from the clips') },
  )
  return linhas
}

// ponytail: comprimentos de cinta estimados pela geometria; conferir na montagem real
const VOLTA_CLIP_MM = 80 // fita que dá a volta no clip e sobrepõe no velcro, de cada lado
const LIGACAO_MM = 250 // ponteira → argola do arnês, com sobra para ajuste

/** Cintas de fita: uma por par de clips (passa sob o corpo) e uma por ponteira (liga ao arnês). */
export function cintas(p: Projeto, d: Design) {
  const sela = d.juntas.filter((j) => j.spec.tipo === 'clipSela').length / 2
  const ligacoes = d.juntas.filter((j) => j.spec.tipo === 'ponteira').length
  const corpo = p.medidas.larguraCm * 10
  // de um trilho ao outro por baixo da barriga: ~1,6× a largura do corpo, mais a folga dos dois lados
  const selaMm = Math.round(corpo * 1.6 + 2 * p.ajustes.folgaLateralCm * 10 + 2 * VOLTA_CLIP_MM)
  const fitaM = Math.ceil(((sela * selaMm + ligacoes * LIGACAO_MM) * PERDA_CORTE) / 100) / 10
  return { sela, selaMm, ligacoes, ligacaoMm: LIGACAO_MM, fitaM }
}

/** Itens comprados (sem tubo e sem peças impressas): para contar à parte. */
export function comprados(p: Projeto, d: Design): LinhaBom[] {
  return bom(p, d).slice(1 + d.pecas.length)
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
      'Em cada eixo{v}: tê 90° → perna superior → tê 45° → perna inferior → suporte do eixo. Feche o triângulo com a diagonal.',
      'At each axle{v}: 90° tee → upper leg → 45° tee → lower leg → axle mount. Close the triangle with the brace.', { v: eixos > 1 ? tr(' (frente e trás)', ' (front and rear)') : '' },
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
      'Prenda os clips da sela no trilho e passe a fita forrada por baixo do corpo. Altura do trilho: {alturaTrilho} mm do chão.',
      'Snap the saddle clips onto the rail and run the padded webbing under the body. Rail height: {alturaTrilho} mm from the ground.', { alturaTrilho: d.cotas.alturaTrilho },
    ),
    tr('Coloque o cão com ajuda de outra pessoa. Confira: patas tocam o chão, nada raspa, coluna reta.', 'Put the dog in with a helper. Check: paws touch the ground, nothing rubs, spine is straight.'),
  ]
}

export function csv(linhas: Record<string, string | number>[]): string {
  if (!linhas.length) return ''
  // pt-BR: ';' e vírgula decimal (Excel brasileiro); en: ',' e ponto
  const sep = separadorCsv
  const cab = Object.keys(linhas[0])
  const cel = (v: string | number) => {
    const s = typeof v === 'number' ? formatoNumero(v) : v
    return new RegExp(`[${sep}"\\n]`).test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  return '﻿' + [cab.join(sep), ...linhas.map((l) => cab.map((c) => cel(l[c])).join(sep))].join('\r\n')
}
