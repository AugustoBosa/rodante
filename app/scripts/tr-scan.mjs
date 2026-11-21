// Varre o código por chamadas tr('pt', 'en'[, vars]) e devolve os literais.
// Usado pelo teste de completude (src/i18n.test.ts) e por `npm run i18n:chaves`.
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const ESC = { n: '\n', t: '\t', r: '\r' }
export const desescapar = (s) =>
  s.replace(/\\(u[0-9a-fA-F]{4}|.)/gs, (_, c) => (c[0] === 'u' && c.length === 5 ? String.fromCharCode(parseInt(c.slice(1), 16)) : (ESC[c] ?? c)))

// lê um literal a partir de i (aspa/crase); devolve { fim (índice após a aspa final), bruto, aspa }
function literal(src, i) {
  const aspa = src[i]
  if (aspa !== "'" && aspa !== '"' && aspa !== '`') return null
  let j = i + 1
  while (j < src.length && src[j] !== aspa) {
    if (src[j] === '\\') j += 2
    else if (aspa === '`' && src[j] === '$' && src[j + 1] === '{') j = fechaChave(src, j + 2)
    else j++
  }
  return { ini: i, fim: j + 1, bruto: src.slice(i + 1, j), aspa }
}

// índice logo após o '}' que fecha uma expressão ${...} aberta em i
function fechaChave(src, i) {
  let d = 1
  while (i < src.length && d > 0) {
    const c = src[i]
    if (c === "'" || c === '"' || c === '`') i = literal(src, i).fim
    else {
      if (c === '{') d++
      else if (c === '}') d--
      i++
    }
  }
  return i
}

export function varrer(src) {
  const achados = []
  const re = /(?<![\w.$])tr\(/g
  let m
  while ((m = re.exec(src))) {
    let i = m.index + m[0].length
    const ws = () => {
      while (/\s/.test(src[i] ?? '')) i++
    }
    ws()
    const a = literal(src, i)
    if (!a) continue
    i = a.fim
    ws()
    if (src[i] !== ',') continue
    i++
    ws()
    const b = literal(src, i)
    if (!b) continue
    i = b.fim
    ws()
    if (src[i] === ',') {
      i++
      ws()
    }
    achados.push({ pt: a, en: b, temVars: src[i] !== ')' })
  }
  return achados
}

export function arquivos(dir) {
  const out = []
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name)
    if (e.isDirectory()) out.push(...arquivos(p))
    else if (/\.(ts|tsx)$/.test(e.name) && !/\.test\.|^i18n\.ts$/.test(e.name) && !p.includes('locales')) out.push(p)
  }
  return out
}

// frases em inglês (já sem escapes) de todo o src, com o arquivo de origem
export function chaves(dir) {
  const mapa = new Map()
  for (const f of arquivos(dir)) {
    for (const c of varrer(readFileSync(f, 'utf8'))) {
      const k = c.en.aspa === '`' ? c.en.bruto : desescapar(c.en.bruto)
      if (!mapa.has(k)) mapa.set(k, f)
    }
  }
  return mapa
}
