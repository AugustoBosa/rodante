import { expose } from 'comlink'
import init from 'replicad-opencascadejs'
import wasmUrl from 'replicad-opencascadejs/wasm?url'
import { setOC } from 'replicad'
import { cotovelo, type CotoveloParams } from './parts/cotovelo'

const pronto = init({ locateFile: () => wasmUrl }).then(setOC)

const api = {
  async cotovelo(p: CotoveloParams) {
    await pronto
    const peca = cotovelo(p)
    return {
      mesh: peca.mesh({ tolerance: 0.1, angularTolerance: 0.3 }),
      stl: peca.blobSTL({ binary: true, tolerance: 0.02, angularTolerance: 0.1 }),
    }
  },
}

expose(api)
export type CadApi = typeof api
