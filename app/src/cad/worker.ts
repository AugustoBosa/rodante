import { expose } from 'comlink'
import init from 'replicad-opencascadejs'
import wasmUrl from 'replicad-opencascadejs/wasm?url'
import { makeCompound, makeCylinder, setOC, type Shape3D, type ShapeMesh } from 'replicad'
import { construir, eixoAngulo } from './pecas'
import type { Design, SpecPeca } from '../model/types'

// ponytail: tamanho descompactado aproximado do WASM, só para a barra quando o servidor manda gzip
// (aí o content-length é do arquivo comprimido). Atualizar se trocar a versão do replicad-opencascadejs.
const TAMANHO_WASM = 22.9e6

let pronto: Promise<void> | null = null

/** Baixa o WASM em partes para informar o progresso (0–1) e inicializa o OpenCascade uma vez. */
function carregar(aoProgresso?: (fracao: number) => void): Promise<void> {
  pronto ??= (async () => {
    const r = await fetch(wasmUrl)
    if (!r.ok || !r.body) throw new Error(`Falha ao baixar o motor de desenho (HTTP ${r.status})`)
    const semCompressao = !r.headers.get('content-encoding')
    const total = (semCompressao && Number(r.headers.get('content-length'))) || TAMANHO_WASM
    const leitor = r.body.getReader()
    const partes: Uint8Array[] = []
    let n = 0
    let ultimo = -1
    for (;;) {
      const { done, value } = await leitor.read()
      if (done) break
      partes.push(value)
      n += value.length
      const pct = Math.floor(Math.min(n / total, 0.99) * 100)
      if (pct !== ultimo) aoProgresso?.((ultimo = pct) / 100) // avisa só quando muda 1%
    }
    const bin = new Uint8Array(n)
    let o = 0
    for (const p of partes) {
      bin.set(p, o)
      o += p.length
    }
    setOC(await init({ wasmBinary: bin }))
    aoProgresso?.(1)
  })()
  return pronto
}

// ponytail: caches sem limite; ok para dezenas de variações por sessão
const formas = new Map<string, Shape3D>()
const malhas = new Map<string, { mesh: ShapeMesh; stl: Blob }>()
const steps = new Map<string, Blob>()

function forma(s: SpecPeca): Shape3D {
  const k = JSON.stringify(s)
  let f = formas.get(k)
  if (!f) formas.set(k, (f = construir(s)))
  return f
}

const api = {
  async iniciar(aoProgresso: (fracao: number) => void) {
    await carregar(aoProgresso)
  },

  async peca(s: SpecPeca) {
    await carregar()
    const k = JSON.stringify(s)
    let r = malhas.get(k)
    if (!r) {
      const f = forma(s)
      r = {
        mesh: f.mesh({ tolerance: 0.1, angularTolerance: 0.3 }),
        stl: f.blobSTL({ binary: true, tolerance: 0.02, angularTolerance: 0.1 }),
      }
      malhas.set(k, r)
    }
    return r
  },

  async step(s: SpecPeca) {
    await carregar()
    const k = JSON.stringify(s)
    let b = steps.get(k)
    if (!b) steps.set(k, (b = forma(s).blobSTEP()))
    return b
  },

  /** Conjunto montado (tubos ocos, conexões e rodas) num único STEP, para abrir em CAD. */
  async conjunto(d: Pick<Design, 'tubos' | 'juntas' | 'rodas'>, tubo: { d: number; parede: number }) {
    await carregar()
    const r = tubo.d / 2
    const ri = Math.max(r - tubo.parede, 0.1)
    const partes: Shape3D[] = []
    for (const t of d.tubos) {
      const dir = t.b.map((v, i) => v - t.a[i]) as [number, number, number]
      const len = Math.hypot(...dir)
      if (len <= 0) continue
      const u = dir.map((v) => v / len) as [number, number, number]
      const ini = t.a.map((v, i) => v - u[i]) as [number, number, number]
      partes.push(makeCylinder(r, len, t.a, u).cut(makeCylinder(ri, len + 2, ini, u)))
    }
    for (const j of d.juntas) {
      const { angulo, eixo } = eixoAngulo(j.ex, j.ey)
      let f = forma(j.spec).clone()
      if (angulo > 1e-6) f = f.rotate(angulo, [0, 0, 0], eixo)
      partes.push(f.translate(j.pos))
    }
    for (const rd of d.rodas)
      partes.push(makeCylinder(rd.d / 2, rd.largura, [rd.pos[0], rd.pos[1] - rd.largura / 2, rd.pos[2]], [0, 1, 0]))
    return makeCompound(partes).blobSTEP()
  },
}

expose(api)
export type CadApi = typeof api
