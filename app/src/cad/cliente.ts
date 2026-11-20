import { wrap } from 'comlink'
import type { CadApi } from './worker'

export const cad = wrap<CadApi>(new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' }))
