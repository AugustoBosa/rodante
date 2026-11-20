import { beforeAll, expect, test } from 'vitest'
import init from 'replicad-opencascadejs'
import { measureVolume, setOC } from 'replicad'
import { construir, eixoAngulo } from './pecas'
import { raioExterno, raioInterno, recuo } from '../model/design'
import type { SpecPeca } from '../model/types'

beforeAll(async () => setOC(await init()), 60_000)

const imp = { tuboD: 19.05, folga: 0.4, parede: 3, profundidade: 30, parafusoD: 5 }
const ri = raioInterno(imp)
const ro = raioExterno(imp)

test('cotovelo 90°: caixa externa e furos feitos', () => {
  const s: SpecPeca = { tipo: 'cotovelo', angulo: 90, ...imp }
  const peca = construir(s)
  const [min, max] = peca.boundingBox.bounds
  const comp = recuo(s) + imp.profundidade
  expect(max[0]).toBeCloseTo(comp, 1)
  expect(max[1]).toBeCloseTo(comp, 1)
  expect(min[0]).toBeCloseTo(-ro, 1)
  expect(max[2] - min[2]).toBeCloseTo(2 * ro, 1)
  // sem furos o volume seria ≤ esfera + 2 braços maciços
  const macico = (4 / 3) * Math.PI * ro ** 3 + 2 * Math.PI * ro * ro * comp
  expect(measureVolume(peca)).toBeLessThan(macico - 0.95 * 2 * Math.PI * ri * ri * imp.profundidade)
})

test('furos não se cruzam em ângulo fechado', () => {
  expect(recuo({ tipo: 'te', angulo: 45, ...imp })).toBeGreaterThan(recuo({ tipo: 'te', angulo: 90, ...imp }))
  expect(recuo({ tipo: 'cotovelo', angulo: 180, ...imp })).toBe(2)
})

test('tê 45°: três braços, todos com o mesmo recuo', () => {
  const s: SpecPeca = { tipo: 'te', angulo: 45, ...imp }
  const [min, max] = construir(s).boundingBox.bounds
  const comp = recuo(s) + imp.profundidade
  expect(max[0]).toBeCloseTo(comp, 1)
  expect(min[0]).toBeCloseTo(-comp, 1)
})

test('suporte do eixo: base plana e encaixe para cima', () => {
  const s: SpecPeca = { tipo: 'suporteEixo', eixoD: 8, ...imp }
  const [min, max] = construir(s).boundingBox.bounds
  expect(min[2]).toBeCloseTo(-recuo(s), 1)
  expect(max[2]).toBeCloseTo(recuo(s) + imp.profundidade, 1)
})

test('ponteira, clip e STL de todas as peças', () => {
  const specs: SpecPeca[] = [
    { tipo: 'ponteira', ...imp },
    { tipo: 'clipSela', fitaL: 25, ...imp },
    { tipo: 'te', angulo: 90, ...imp },
  ]
  for (const s of specs) {
    const peca = construir(s)
    expect(measureVolume(peca)).toBeGreaterThan(1000)
    expect(peca.blobSTL({ binary: true }).size).toBeGreaterThan(5_000)
  }
})

test('eixoAngulo reproduz a base ao girar os eixos do mundo', () => {
  const girar = (v: number[], eixo: number[], grausAng: number) => {
    // Rodrigues
    const a = (grausAng * Math.PI) / 180
    const [kx, ky, kz] = eixo
    const n = Math.hypot(kx, ky, kz)
    const k = [kx / n, ky / n, kz / n]
    const dot = k[0] * v[0] + k[1] * v[1] + k[2] * v[2]
    const cr = [k[1] * v[2] - k[2] * v[1], k[2] * v[0] - k[0] * v[2], k[0] * v[1] - k[1] * v[0]]
    return v.map((vi, i) => vi * Math.cos(a) + cr[i] * Math.sin(a) + k[i] * dot * (1 - Math.cos(a)))
  }
  const bases: [number[], number[]][] = [
    [[1, 0, 0], [0, 1, 0]],
    [[0, 0, 1], [0, 1, 0]],
    [[-1, 0, 0], [0, 1, 0]],
    [[-1, 0, 0], [0, -1, 0]],
    [[1, 0, 0], [0, 0, -1]],
    [[0, 0, 1], [-1, 0, 0]],
    [[0, 0, 1], [0, -1, 0]],
  ]
  for (const [ex, ey] of bases) {
    const { angulo, eixo } = eixoAngulo(ex as never, ey as never)
    const gx = girar([1, 0, 0], eixo, angulo)
    const gy = girar([0, 1, 0], eixo, angulo)
    ex.forEach((v, i) => expect(gx[i]).toBeCloseTo(v, 6))
    ey.forEach((v, i) => expect(gy[i]).toBeCloseTo(v, 6))
  }
})

test('STEP de uma peça sai como texto ISO-10303', async () => {
  const txt = await construir({ tipo: 'te', angulo: 90, ...imp }).blobSTEP().text()
  expect(txt.startsWith('ISO-10303-21')).toBe(true)
})
