import { beforeAll, expect, test } from 'vitest'
import init from 'replicad-opencascadejs'
import { measureVolume, setOC } from 'replicad'
import { batente, cotovelo, COTOVELO_PADRAO as P } from './cotovelo'

beforeAll(async () => setOC(await init()), 60_000)

const ri = (P.tuboD + P.folga) / 2
const ro = ri + P.parede

test('cotovelo 90°: caixa externa e furo do tubo', () => {
  const peca = cotovelo(P)
  const [min, max] = peca.boundingBox.bounds
  const comp = batente(P) + P.profundidade
  expect(max[0]).toBeCloseTo(comp, 1)
  expect(max[1]).toBeCloseTo(comp, 1)
  expect(min[0]).toBeCloseTo(-ro, 1)
  expect(max[2] - min[2]).toBeCloseTo(2 * ro, 1)

  // limite superior sem furo = esfera + 2 braços maciços; com furo tem de ficar abaixo disso
  const maciço = (4 / 3) * Math.PI * ro ** 3 + 2 * Math.PI * ro * ro * comp
  const furos = 2 * Math.PI * ri * ri * P.profundidade
  expect(measureVolume(peca)).toBeLessThan(maciço - 0.95 * furos)
  expect(measureVolume(peca)).toBeGreaterThan(0)
})

test('furos não se cruzam em ângulo fechado', () => {
  expect(batente({ ...P, angulo: 45 })).toBeGreaterThan(batente({ ...P, angulo: 90 }))
  expect(batente({ ...P, angulo: 180 })).toBe(2)
})

test('gera STL binário não vazio', async () => {
  const stl = cotovelo(P).blobSTL({ binary: true })
  expect(stl.size).toBeGreaterThan(10_000)
})
