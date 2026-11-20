// Peças impressas em Replicad. Medidas em mm. Recuos e raios vêm do modelo (model/design.ts)
// para que os cortes de tubo e a geometria usem exatamente a mesma conta.
import { makeBox, makeCylinder, makeSphere, type Shape3D } from 'replicad'
import { comprimentoClip, raioExterno, raioInterno, recuo } from '../model/design'
import type { SpecPeca } from '../model/types'
import { FITA_L } from '../model/defaults'

const TAMPA = 4

/** Furo passante para o parafuso que trava o tubo, ao longo de `dir`, centrado em `centro`. */
function furoParafuso(s: SpecPeca, centro: [number, number, number], dir: [number, number, number], ro: number): Shape3D | null {
  if (s.parafusoD <= 0) return null
  const meio = ro + 1
  const ini = centro.map((c, i) => c - dir[i] * meio) as [number, number, number]
  return makeCylinder((s.parafusoD + s.folga) / 2, 2 * meio, ini, dir)
}

const cortar = (peca: Shape3D, ferramentas: (Shape3D | null)[]) =>
  ferramentas.reduce<Shape3D>((p, f) => (f ? p.cut(f) : p), peca)

/** Encaixes no plano XY, nos ângulos dados (graus a partir de +X, girando para +Y). */
function conector(s: SpecPeca, angulos: number[]): Shape3D {
  const ri = raioInterno(s)
  const ro = raioExterno(s)
  const r0 = recuo(s)
  const comp = r0 + s.profundidade
  let peca: Shape3D = makeSphere(ro)
  for (const a of angulos) peca = peca.fuse(makeCylinder(ro, comp, [0, 0, 0], [1, 0, 0]).rotate(a, [0, 0, 0], [0, 0, 1]))
  for (const a of angulos) {
    const furo = makeCylinder(ri, s.profundidade + 1, [r0, 0, 0], [1, 0, 0])
    const paraf = furoParafuso(s, [r0 + s.profundidade / 2, 0, 0], [0, 0, 1], ro)
    peca = cortar(peca, [furo.rotate(a, [0, 0, 0], [0, 0, 1]), paraf?.rotate(a, [0, 0, 0], [0, 0, 1]) ?? null])
  }
  return peca
}

/** Eixo da roda no centro, ao longo de Y; encaixe do tubo para cima (+Z). Base plana para imprimir em pé. */
function suporteEixo(s: Extract<SpecPeca, { tipo: 'suporteEixo' }>): Shape3D {
  const ro = raioExterno(s)
  const hb = recuo(s)
  const bloco = makeBox([-ro, -ro, -hb], [ro, ro, hb]).fuse(makeCylinder(ro, hb + s.profundidade, [0, 0, 0], [0, 0, 1]))
  return cortar(bloco, [
    makeCylinder(raioInterno(s), s.profundidade + 1, [0, 0, hb], [0, 0, 1]),
    makeCylinder((s.eixoD + s.folga) / 2, 2 * ro + 2, [0, -ro - 1, 0], [0, 1, 0]),
    furoParafuso(s, [0, 0, hb + s.profundidade / 2], [1, 0, 0], ro),
  ])
}

/** Tubo entra por -Z até a origem; tampa e passador de fita para +Z. Imprimir com a boca para baixo. */
function ponteira(s: SpecPeca): Shape3D {
  const ro = raioExterno(s)
  const w = Math.max(2 * ro, FITA_L + 10) / 2
  const corpo = makeCylinder(ro, s.profundidade + TAMPA, [0, 0, -s.profundidade], [0, 0, 1]).fuse(
    makeBox([-w, -2.5, TAMPA - 1], [w, 2.5, TAMPA + 14]),
  )
  return cortar(corpo, [
    makeCylinder(raioInterno(s), s.profundidade + 1, [0, 0, -s.profundidade - 1], [0, 0, 1]),
    makeBox([-(FITA_L + 1) / 2, -3, TAMPA + 5], [(FITA_L + 1) / 2, 3, TAMPA + 10]),
    furoParafuso(s, [0, 0, -s.profundidade / 2], [1, 0, 0], ro),
  ])
}

/** Abraçadeira em "C" ao longo de Z, abertura em +X, passador de fita em -X. */
function clipSela(s: Extract<SpecPeca, { tipo: 'clipSela' }>): Shape3D {
  const ro = raioExterno(s)
  const L = comprimentoClip(s)
  const corpo = makeCylinder(ro, L).fuse(makeBox([-(ro + 10), -2.5, 0], [-ro + 1, 2.5, L]))
  return cortar(corpo, [
    makeCylinder(raioInterno(s), L + 2, [0, 0, -1]),
    makeBox([0, -s.tuboD * 0.4, -1], [ro + 1, s.tuboD * 0.4, L + 1]),
    makeBox([-(ro + 7), -3, 4], [-(ro + 3), 3, L - 4]),
  ])
}

export function construir(s: SpecPeca): Shape3D {
  switch (s.tipo) {
    case 'cotovelo':
      return conector(s, [0, s.angulo])
    case 'te':
      return conector(s, [0, 180, s.angulo])
    case 'suporteEixo':
      return suporteEixo(s)
    case 'ponteira':
      return ponteira(s)
    case 'clipSela':
      return clipSela(s)
  }
}

type V = [number, number, number]

/**
 * Base local (ex, ey, ez = ex×ey) → rotação eixo-ângulo (graus) que leva os eixos do mundo até ela.
 * Usado para posicionar as peças no STEP do conjunto.
 */
export function eixoAngulo(ex: V, ey: V): { angulo: number; eixo: V } {
  const ez: V = [ex[1] * ey[2] - ex[2] * ey[1], ex[2] * ey[0] - ex[0] * ey[2], ex[0] * ey[1] - ex[1] * ey[0]]
  // R[i][j] = componente i da coluna j (colunas = ex, ey, ez)
  const R = [0, 1, 2].map((i) => [ex[i], ey[i], ez[i]])
  const cos = (R[0][0] + R[1][1] + R[2][2] - 1) / 2
  const ang = Math.acos(Math.min(1, Math.max(-1, cos)))
  if (ang < 1e-9) return { angulo: 0, eixo: [0, 0, 1] }
  if (Math.PI - ang < 1e-6) {
    // 180°: R = 2uuᵀ − I
    const i = [0, 1, 2].reduce((a, b) => (R[b][b] > R[a][a] ? b : a), 0)
    const ui = Math.sqrt((R[i][i] + 1) / 2)
    const u = [0, 1, 2].map((j) => (j === i ? ui : R[i][j] / (2 * ui))) as V
    return { angulo: 180, eixo: u }
  }
  const s = 2 * Math.sin(ang)
  return { angulo: (ang * 180) / Math.PI, eixo: [(R[2][1] - R[1][2]) / s, (R[0][2] - R[2][0]) / s, (R[1][0] - R[0][1]) / s] }
}
