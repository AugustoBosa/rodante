import { beforeAll, expect, test } from 'vitest'
import init from 'replicad-opencascadejs'
import { measureVolume, setOC } from 'replicad'
import { construir } from './pecas'
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
