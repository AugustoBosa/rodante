import { expect, test } from 'vitest'
import { strFromU8, unzipSync } from 'fflate'
import { pacoteZip } from './saidas'
import { computeDesign } from './model/design'
import { AJUSTES_PADRAO, MATERIAIS_PADRAO } from './model/defaults'
import type { Projeto } from './model/types'

const p: Projeto = {
  versao: 1,
  id: 'z',
  criadoEm: '',
  atualizadoEm: '',
  cao: { nome: 'Pipoca', raca: 'dachshund', pesoKg: 8 },
  tipo: 'traseira',
  metodoMedida: 'deitado-de-lado',
  medidas: { alturaPernaCm: 18, alturaPernaDianteiraCm: 0, comprimentoCm: 35, larguraCm: 16, alturaCostasCm: 22 },
  materiais: { ...MATERIAIS_PADRAO, tuboD: 12.7, rodaD: 100 },
  ajustes: AJUSTES_PADRAO,
  avisoVet: true,
}

test('pacote zip traz STLs, CSVs, projeto e leia-me', async () => {
  const d = computeDesign(p)
  const stls = Object.fromEntries(d.pecas.map((pc) => [pc.chave, new Blob(['solid x'])]))
  const zip = unzipSync(new Uint8Array(await (await pacoteZip(p, d, stls, stls, new Blob(['ISO-10303-21;']))).arrayBuffer()))
  const nomes = Object.keys(zip).sort()
  expect(nomes.filter((n) => n.startsWith('stl/'))).toHaveLength(6)
  expect(nomes).toContain('stl/te-45_x4.stl')
  expect(nomes).toContain('step/te-45_x4.step')
  expect(nomes).toContain('step/conjunto-montado.step')
  expect(nomes).toEqual(expect.arrayContaining(['LEIA-ME.txt', 'cortes.csv', 'lista-de-materiais.csv', 'projeto.json']))
  expect(JSON.parse(strFromU8(zip['projeto.json']))).toEqual(p)
  expect(strFromU8(zip['LEIA-ME.txt'])).toContain('veterinário')
})
