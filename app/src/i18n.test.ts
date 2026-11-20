import { afterEach, expect, test, vi } from 'vitest'

afterEach(() => {
  vi.unstubAllGlobals()
  vi.resetModules()
})

test('em inglês, alertas, peças, BOM e cortes saem traduzidos', async () => {
  vi.resetModules()
  vi.stubGlobal('window', {})
  vi.stubGlobal('localStorage', { getItem: () => 'en', setItem: () => {} })
  const { computeDesign } = await import('./model/design')
  const { bom, cortes } = await import('./model/bom')
  const { AJUSTES_PADRAO, MATERIAIS_PADRAO } = await import('./model/defaults')
  const p = {
    versao: 1 as const,
    id: 'x',
    criadoEm: '',
    atualizadoEm: '',
    cao: { nome: 'Rex', raca: 'labrador', pesoKg: 30 },
    tipo: 'traseira' as const,
    metodoMedida: 'deitado-de-lado' as const,
    medidas: { alturaPernaCm: 18, alturaPernaDianteiraCm: 0, comprimentoCm: 50, larguraCm: 24, alturaCostasCm: 48 },
    materiais: { ...MATERIAIS_PADRAO, rodaD: 300 },
    ajustes: AJUSTES_PADRAO,
    avisoVet: true,
  }
  const d = computeDesign(p)
  expect(d.alertas.some((a) => a.texto.startsWith('Does not fit'))).toBe(true)
  expect(d.pecas.map((pc) => pc.nome)).toContain('Tee 90°')
  expect(bom(p, d)[0].item).toBe('Aluminum tube')
  expect(cortes(d).some((c) => c.nome === 'Rear crossbar')).toBe(true)
  expect(d.tubos.some((t) => t.nome.endsWith('(left)'))).toBe(true)
})
