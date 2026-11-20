// Regras do quadro traseiro (rear). TS puro, sem React/Replicad. Unidades: mm.
// Eixos do mundo: X para trás (0 = ponta dianteira do trilho), Y lateral, Z para cima.
import type { Alerta, Design, Junta, PecaLista, Projeto, SpecPeca, Tubo, V3 } from './types'
import {
  FITA_L,
  FOLGA_LATERAL_MIN_CM,
  LIMITE_PESO_KG,
  LIMITES,
  PVC_PESO_MAX_KG,
  SEGMENTO_MIN_MM,
  tuboMinimo,
} from './defaults'
import { RACAS } from '../data/racas'

const BATENTE = 2 // mm de material entre o fim do tubo e o miolo da conexão

export const raioInterno = (s: { tuboD: number; folga: number }) => (s.tuboD + s.folga) / 2
export const raioExterno = (s: { tuboD: number; folga: number; parede: number }) => raioInterno(s) + s.parede

/** Menor ângulo entre os encaixes de uma conexão de tubo. */
export function anguloMinimo(s: SpecPeca): number {
  if (s.tipo === 'cotovelo') return clamp(s.angulo, 30, 180)
  if (s.tipo === 'te') return Math.min(clamp(s.angulo, 30, 150), 180 - clamp(s.angulo, 30, 150))
  return 180
}

/** Distância do centro da conexão até onde o tubo encosta. */
export function recuo(s: SpecPeca): number {
  if (s.tipo === 'ponteira' || s.tipo === 'clipSela') return 0
  if (s.tipo === 'suporteEixo') return (s.eixoD + s.folga) / 2 + s.parede + BATENTE
  const meio = (anguloMinimo(s) / 2) * (Math.PI / 180)
  return (meio >= Math.PI / 2 - 1e-9 ? 0 : raioInterno(s) / Math.tan(meio)) + BATENTE
}

/** Comprimento do clip ao longo do tubo: fita + 1 mm de folga + 4 mm de cada lado. */
export const comprimentoClip = (s: { fitaL: number }) => s.fitaL + 9

export const NOMES_PECA: Record<SpecPeca['tipo'], string> = {
  cotovelo: 'Cotovelo',
  te: 'Tê',
  suporteEixo: 'Suporte do eixo',
  ponteira: 'Ponteira com passador',
  clipSela: 'Clip da sela',
}

export function nomePeca(s: SpecPeca): string {
  return 'angulo' in s ? `${NOMES_PECA[s.tipo]} ${s.angulo}°` : NOMES_PECA[s.tipo]
}

export function validarCampo(campo: keyof typeof LIMITES, v: number): string | null {
  const [min, max] = LIMITES[campo]
  if (!Number.isFinite(v) || (v === 0 && min > 0)) return 'Preencha este campo'
  if (v < min || v > max) return `Entre ${min} e ${max}`
  return null
}

export function computeDesign(p: Projeto): Design {
  const { medidas: md, materiais: m, ajustes: aj, cao } = p
  const alertas: Alerta[] = []
  const imp = { tuboD: m.tuboD, folga: aj.folgaImpressao, parede: aj.paredeConexao, profundidade: aj.profundidade, parafusoD: m.parafusoD }
  const te90: SpecPeca = { tipo: 'te', angulo: 90, ...imp }
  const te45: SpecPeca = { tipo: 'te', angulo: 45, ...imp }
  const cot: SpecPeca = { tipo: 'cotovelo', angulo: 90, ...imp }
  const sup: SpecPeca = { tipo: 'suporteEixo', eixoD: m.eixoD, ...imp }
  const pont: SpecPeca = { tipo: 'ponteira', ...imp }
  const clip: SpecPeca = { tipo: 'clipSela', fitaL: FITA_L, ...imp }
  const ro = raioExterno(imp)

  const H = (md.alturaPernaCm - aj.ajusteAlturaCm) * 10 // centro do trilho
  const R = m.rodaD / 2 // centro do eixo
  const xe = md.comprimentoCm * 10 // eixo sob o quadril
  const xr = xe + aj.extensaoTraseiraMm
  const span = Math.max(0, Math.min(xe, H - R) * 0.5) // diagonal a 45°, metade do espaço livre
  const xd = xe - span
  const z1 = H - span
  const larguraInterna = (md.larguraCm + 2 * aj.folgaLateralCm) * 10
  const yC = larguraInterna / 2 + ro
  const yRoda = yC + ro + 5 + m.rodaLargura / 2

  const tubos: Tubo[] = []
  const juntas: Junta[] = []
  const tubo = (nome: string, A: V3, B: V3, sA: SpecPeca, sB: SpecPeca) => {
    const d = dist(A, B)
    const u = scale(sub(B, A), 1 / (d || 1))
    const rA = recuo(sA)
    const rB = recuo(sB)
    tubos.push({ nome, a: add(A, scale(u, rA)), b: sub(B, scale(u, rB)), comprimento: round(d - rA - rB) })
  }

  for (const [lado, y] of [['esq', -yC], ['dir', yC]] as const) {
    const F: V3 = [0, y, H]
    const D: V3 = [xd, y, H]
    const E: V3 = [xe, y, H]
    const T: V3 = [xr, y, H]
    const P: V3 = [xe, y, z1]
    const S: V3 = [xe, y, R]
    tubo(`Trilho dianteiro (${lado})`, F, D, pont, te45)
    tubo(`Trilho meio (${lado})`, D, E, te45, te90)
    tubo(`Trilho traseiro (${lado})`, E, T, te90, cot)
    tubo(`Perna superior (${lado})`, E, P, te90, te45)
    tubo(`Perna inferior (${lado})`, P, S, te45, sup)
    tubo(`Diagonal (${lado})`, D, P, te45, te45)
    juntas.push(
      { spec: pont, pos: F, ex: [0, 0, 1], ey: [0, 1, 0] },
      { spec: te45, pos: D, ex: [1, 0, 0], ey: [0, 0, -1] },
      { spec: te90, pos: E, ex: [1, 0, 0], ey: [0, 0, -1] },
      { spec: cot, pos: T, ex: [-1, 0, 0], ey: [0, Math.sign(-y), 0] },
      { spec: te45, pos: P, ex: [0, 0, 1], ey: [-1, 0, 0] },
      { spec: sup, pos: S, ex: [1, 0, 0], ey: [0, 1, 0] },
    )
    // clips da sela: meio do trilho do meio e do traseiro (origem na borda do clip, Z local = +X)
    for (const x of [(xd + xe) / 2, (xe + xr) / 2])
      juntas.push({ spec: clip, pos: [x - comprimentoClip({ fitaL: FITA_L }) / 2, y, H], ex: [0, 0, 1], ey: [0, -1, 0] })
  }
  tubo('Barra traseira', [xr, -yC, H], [xr, yC, H], cot, cot)

  const curtos = tubos.filter((t) => t.comprimento < SEGMENTO_MIN_MM)
  if (H - R <= 0 || curtos.length)
    alertas.push({
      nivel: 'erro',
      texto: `Não cabe: ${[...new Set(curtos.map((t) => t.nome.replace(/ \((esq|dir)\)$/, '').toLowerCase()))].join(', ') || 'perna'} fica curto demais. Use roda menor (hoje Ø ${m.rodaD} mm) ou confira a altura da perna.`,
    })
  if (cao.pesoKg > LIMITE_PESO_KG)
    alertas.push({ nivel: 'erro', texto: `Peso acima de ${LIMITE_PESO_KG} kg: este projeto caseiro não é indicado. Procure um fabricante profissional.` })
  const tMin = tuboMinimo(cao.pesoKg)
  if (m.tubo === 'aluminio' && m.tuboD < tMin)
    alertas.push({ nivel: 'aviso', texto: `Tubo fino para ${cao.pesoKg} kg: use Ø ≥ ${tMin} mm (estimativa sem teste de carga).` })
  if (m.tubo === 'pvc' && cao.pesoKg > PVC_PESO_MAX_KG)
    alertas.push({ nivel: 'aviso', texto: `PVC é indicado só até ~${PVC_PESO_MAX_KG} kg. Para ${cao.pesoKg} kg prefira alumínio.` })
  if (aj.folgaLateralCm < FOLGA_LATERAL_MIN_CM)
    alertas.push({ nivel: 'aviso', texto: `Folga lateral de ${aj.folgaLateralCm} cm pode raspar no corpo. Recomendado ≥ ${FOLGA_LATERAL_MIN_CM} cm.` })
  if (md.alturaCostasCm > 0 && H + ro > md.alturaCostasCm * 10)
    alertas.push({ nivel: 'aviso', texto: 'O trilho fica acima da linha das costas. Confira a altura da perna e a altura das costas.' })
  const raca = RACAS.find((r) => r.id === cao.raca)
  if (raca?.pesoKg && (cao.pesoKg < raca.pesoKg[0] * 0.7 || cao.pesoKg > raca.pesoKg[1] * 1.3))
    alertas.push({ nivel: 'aviso', texto: `Peso fora do comum para ${raca.nome} (${raca.pesoKg[0]}–${raca.pesoKg[1]} kg). Confira.` })
  if (raca?.alturaCm && (md.alturaCostasCm < raca.alturaCm[0] * 0.75 || md.alturaCostasCm > raca.alturaCm[1] * 1.25))
    alertas.push({ nivel: 'aviso', texto: `Altura das costas fora do comum para ${raca.nome} (${raca.alturaCm[0]}–${raca.alturaCm[1]} cm). Confira a medida.` })
  alertas.push(
    { nivel: 'info', texto: 'Avaliação de veterinário ou fisioterapeuta é obrigatória antes do uso.' },
    { nivel: 'info', texto: 'Comece com o quadro mais baixo: as patas traseiras devem tocar o chão. Ajuste aos poucos.' },
    { nivel: 'info', texto: 'Use porca autotravante (ou trava química) no eixo e nos parafusos. Inspecione toda semana.' },
    { nivel: 'info', texto: 'Primeiros usos curtos (5–10 min) e sempre supervisionados.' },
  )

  const mapa = new Map<string, PecaLista>()
  for (const j of juntas) {
    const chave = JSON.stringify(j.spec)
    const atual = mapa.get(chave)
    if (atual) atual.qtd++
    else mapa.set(chave, { chave, nome: nomePeca(j.spec), spec: j.spec, qtd: 1 })
  }

  return {
    tubos,
    juntas,
    rodas: [-1, 1].map((s) => ({ pos: [xe, s * yRoda, R] as V3, d: m.rodaD, largura: m.rodaLargura })),
    pecas: [...mapa.values()],
    alertas,
    cotas: {
      alturaTrilho: round(H),
      comprimentoTrilho: round(xr),
      larguraInterna: round(larguraInterna),
      larguraTotal: round(2 * yRoda + m.rodaLargura),
      alturaEixo: round(R),
    },
  }
}

const clamp = (v: number, a: number, b: number) => Math.min(Math.max(v, a), b)
const round = (v: number) => Math.round(v)
const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]]
const scale = (a: V3, k: number): V3 => [a[0] * k, a[1] * k, a[2] * k]
const dist = (a: V3, b: V3) => Math.hypot(...sub(a, b))
