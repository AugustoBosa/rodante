import { expect, test } from 'vitest'
import { deLink, paraLink, validarProjeto } from './store'
import { AJUSTES_PADRAO, MATERIAIS_PADRAO } from './model/defaults'
import type { Projeto } from './model/types'

const p: Projeto = {
  versao: 1,
  id: 'abc123',
  criadoEm: '2026-11-20T00:00:00.000Z',
  atualizadoEm: '2026-11-20T00:00:00.000Z',
  cao: { nome: 'Pipoca', raca: 'dachshund', pesoKg: 8 },
  tipo: 'traseira',
  metodoMedida: 'deitado-de-lado',
  medidas: { alturaPernaCm: 18, alturaPernaDianteiraCm: 0, comprimentoCm: 35, larguraCm: 16, alturaCostasCm: 22 },
  materiais: MATERIAIS_PADRAO,
  ajustes: AJUSTES_PADRAO,
  avisoVet: true,
}

test('link ida e volta recria o mesmo projeto', () => {
  const link = paraLink(p)
  expect(link).toMatch(/^[\w-]+$/)
  expect(deLink(link)).toEqual(p)
})

test('entrada de fora inválida é recusada', () => {
  expect(deLink('lixo!!')).toBeNull()
  expect(validarProjeto({ versao: 2 })).toBeNull()
  expect(validarProjeto({ ...p, medidas: { ...p.medidas, larguraCm: '16' } })).toBeNull()
  expect(validarProjeto({ ...p, id: '<script>' })!.id).toBe('script')
})
