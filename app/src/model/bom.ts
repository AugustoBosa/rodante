import type { Design, Projeto } from './types'
import { raioExterno } from './design'

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
  const tubo = m.tubo === 'aluminio' ? 'Tubo de alumínio' : 'Tubo de PVC'
  const linhas: LinhaBom[] = [
    { item: tubo, especificacao: `Ø ${m.tuboD} mm, parede ${m.tuboParede} mm`, qtd: Math.ceil((totalTubo * PERDA_CORTE) / 10) / 100, un: 'm', obs: 'Inclui 10% de perda. Cortes na aba Cortes' },
    ...d.pecas.map((pc) => ({ item: `${pc.nome} (impresso)`, especificacao: 'PETG, 4 paredes, 40% preenchimento', qtd: pc.qtd, un: 'un', obs: 'STL na aba Peças' })),
    { item: 'Roda', especificacao: `Ø ${m.rodaD} mm, largura ${m.rodaLargura} mm, furo para eixo ${m.eixoD} mm`, qtd: 2, un: 'un', obs: 'Com rolamento ou bucha' },
    { item: 'Parafuso-eixo', especificacao: `M${m.eixoD}, comprimento ≥ ${Math.ceil(2 * ro + m.rodaLargura + 15)} mm, sextavado`, qtd: 2, un: 'un', obs: 'Parte lisa onde gira a roda' },
    { item: 'Porca autotravante do eixo', especificacao: `M${m.eixoD} (nylon)`, qtd: 2, un: 'un', obs: 'Nunca porca comum' },
    { item: 'Arruela do eixo', especificacao: `M${m.eixoD}`, qtd: 6, un: 'un', obs: '' },
  ]
  if (m.parafusoD > 0)
    linhas.push(
      { item: 'Parafuso de trava do tubo', especificacao: `M${m.parafusoD} × ${Math.ceil(2 * ro + 8)} mm`, qtd: encaixes, un: 'un', obs: 'Um por encaixe' },
      { item: 'Porca autotravante', especificacao: `M${m.parafusoD}`, qtd: encaixes, un: 'un', obs: '' },
    )
  linhas.push(
    { item: 'Fita de nylon', especificacao: '25 mm', qtd: 2, un: 'm', obs: 'Sela/argolas das pernas' },
    { item: 'Espuma ou neoprene', especificacao: '5 mm, para forrar a sela', qtd: 1, un: 'un', obs: '~30 × 20 cm' },
    { item: 'Peitoral (arnês)', especificacao: `para cão de ${p.cao.pesoKg} kg`, qtd: 1, un: 'un', obs: 'Comercial; prende nas ponteiras' },
  )
  return linhas
}

function encaixesPorPeca(tipo: string): number {
  return ({ te: 3, cotovelo: 2, suporteEixo: 1, ponteira: 1 } as Record<string, number>)[tipo] ?? 0
}

export function cortes(d: Design) {
  const mapa = new Map<string, { nome: string; comprimento: number; qtd: number }>()
  for (const t of d.tubos) {
    const nome = t.nome.replace(/ \((esq|dir)\)$/, '')
    const k = `${nome}|${t.comprimento}`
    const atual = mapa.get(k)
    if (atual) atual.qtd++
    else mapa.set(k, { nome, comprimento: t.comprimento, qtd: 1 })
  }
  return [...mapa.values()]
}

export function montagem(d: Design): string[] {
  return [
    'Imprima todas as peças em PETG. Teste o encaixe de uma conexão no tubo antes de imprimir o resto.',
    'Corte os tubos conforme a aba Cortes. Lixe as rebarbas e confira cada medida.',
    'Monte cada lateral: trilho dianteiro → tê 45° → trilho meio → tê 90° → trilho traseiro → cotovelo.',
    'Na mesma lateral: tê 90° → perna superior → tê 45° → perna inferior → suporte do eixo. Feche o triângulo com a diagonal.',
    'Una as duas laterais com a barra traseira.',
    'Fure os tubos pelos furos das conexões e trave com parafuso e porca autotravante.',
    'Monte as rodas no suporte: parafuso-eixo, arruela, roda, arruela, porca autotravante. A roda deve girar sem folga.',
    'Encaixe as ponteiras na frente e prenda o peitoral nelas com a fita.',
    `Prenda os clips da sela no trilho e passe a fita forrada por baixo do quadril. Altura do trilho: ${d.cotas.alturaTrilho} mm do chão.`,
    'Coloque o cão com ajuda de outra pessoa. Confira: patas traseiras tocam o chão, nada raspa, coluna reta.',
  ]
}

export function csv(linhas: Record<string, string | number>[]): string {
  if (!linhas.length) return ''
  const cab = Object.keys(linhas[0])
  const cel = (v: string | number) => {
    const s = typeof v === 'number' ? String(v).replace('.', ',') : v
    return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  // BOM UTF-8 + ';' para abrir certo no Excel em pt-BR
  return '﻿' + [cab.join(';'), ...linhas.map((l) => cab.map((c) => cel(l[c])).join(';'))].join('\r\n')
}
