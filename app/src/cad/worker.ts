import { expose } from 'comlink'
import init from 'replicad-opencascadejs'
import wasmUrl from 'replicad-opencascadejs/wasm?url'
import { setOC, type ShapeMesh } from 'replicad'
import { construir } from './pecas'
import type { SpecPeca } from '../model/types'

const pronto = init({ locateFile: () => wasmUrl }).then(setOC)
// ponytail: cache sem limite; ok para dezenas de variações por sessão
const cache = new Map<string, { mesh: ShapeMesh; stl: Blob }>()

const api = {
  async peca(s: SpecPeca) {
    await pronto
    const chave = JSON.stringify(s)
    let r = cache.get(chave)
    if (!r) {
      const shape = construir(s)
      r = {
        mesh: shape.mesh({ tolerance: 0.1, angularTolerance: 0.3 }),
        stl: shape.blobSTL({ binary: true, tolerance: 0.02, angularTolerance: 0.1 }),
      }
      cache.set(chave, r)
    }
    return r
  },
}

expose(api)
export type CadApi = typeof api
