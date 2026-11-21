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

test('detecta idioma: salvo > navegador (só prefixo) > inglês com destaque', async () => {
  const { detectar } = await import('./i18n')
  expect(detectar('de', ['fr'])).toEqual({ idioma: 'de', naoSuportado: false })
  expect(detectar('xx', ['fr-CA', 'en'])).toEqual({ idioma: 'fr', naoSuportado: false })
  expect(detectar(null, ['ja', 'pt-PT'])).toEqual({ idioma: 'pt', naoSuportado: false })
  expect(detectar(null, ['ja', 'zh-CN'])).toEqual({ idioma: 'en', naoSuportado: true })
  expect(detectar(undefined, [])).toEqual({ idioma: 'en', naoSuportado: true })
})

test('catálogos cobrem todas as frases de tr() e mantêm os marcadores', async () => {
  const { CATALOGOS, IDIOMAS } = await import('./i18n')
  // @ts-expect-error script .mjs sem tipos
  const { chaves } = await import('../scripts/tr-scan.mjs')
  const { RACAS } = await import('./data/racas')
  const todas = [...(chaves(new URL('.', import.meta.url).pathname.replace(/^\/(\w:)/, '$1')) as Map<string, string>).keys()]
  for (const r of RACAS) if (r.en) todas.push(r.en)
  const marcadores = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort().join()
  for (const { codigo } of IDIOMAS.filter((i) => i.codigo !== 'pt' && i.codigo !== 'en')) {
    const cat = CATALOGOS[codigo]
    expect(cat, codigo).toBeDefined()
    expect(todas.filter((k) => !(k in cat!)), `${codigo}: faltam`).toEqual([])
    for (const [k, v] of Object.entries(cat!)) expect(marcadores(v), `${codigo}: ${k}`).toBe(marcadores(k))
  }
})

test('em espanhol, tr usa o catálogo e preenche os marcadores', async () => {
  vi.resetModules()
  vi.stubGlobal('window', {})
  vi.stubGlobal('localStorage', { getItem: () => 'es', setItem: () => {} })
  const { tr, CATALOGOS, formatoNumero, separadorCsv } = await import('./i18n')
  const k = 'Between {min} and {max}'
  expect(tr('Entre {min} e {max}', k, { min: 1, max: 2 })).toBe(CATALOGOS.es![k].replace('{min}', '1').replace('{max}', '2'))
  expect(tr('só pt', 'sem tradução')).toBe('sem tradução')
  expect(formatoNumero(1.5)).toBe('1,5')
  expect(separadorCsv).toBe(';')
})
