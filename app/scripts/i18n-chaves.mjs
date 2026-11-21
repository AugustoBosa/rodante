// Lista frases ainda sem tradução em src/locales/<idioma>.ts:  npm run i18n:faltando [idioma]
// Com --json imprime [{ en, pt }] de todas as frases (insumo para traduzir um idioma novo).
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { arquivos, chaves, desescapar, varrer } from './tr-scan.mjs'

const src = join(import.meta.dirname, '..', 'src')
const lit = (l) => (l.aspa === '`' ? l.bruto : desescapar(l.bruto))

if (process.argv.includes('--json')) {
  const mapa = new Map()
  for (const f of arquivos(src)) for (const c of varrer(readFileSync(f, 'utf8'))) mapa.set(lit(c.en), lit(c.pt))
  console.log(JSON.stringify([...mapa].map(([en, pt]) => ({ en, pt })), null, 1))
} else {
  const alvo = process.argv[2]
  const todas = [...chaves(src).keys()]
  for (const l of ['es', 'fr', 'de', 'it']) {
    if (alvo && alvo !== l) continue
    const txt = readFileSync(join(src, 'locales', `${l}.ts`), 'utf8')
    const faltam = todas.filter((k) => !txt.includes(JSON.stringify(k)) && !txt.includes(`'${k.replace(/'/g, "\\'")}'`))
    console.log(`${l}: faltam ${faltam.length} de ${todas.length}`)
    for (const k of faltam) console.log('  ' + k)
  }
}
