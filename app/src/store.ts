// Persistência sem backend: localStorage + link com o projeto comprimido na URL.
import { deflateSync, inflateSync, strFromU8, strToU8 } from 'fflate'
import type { Projeto } from './model/types'
import { AJUSTES_PADRAO, MATERIAIS_PADRAO } from './model/defaults'
import { tr } from './i18n'

const CHAVE = 'rodante.projetos'
const RASCUNHO = 'rodante.rascunho'

// localStorage pode falhar (aba anônima, cota cheia): o app segue funcionando sem salvar.
function ler<T>(k: string, padrao: T): T {
  try {
    const s = localStorage.getItem(k)
    return s ? (JSON.parse(s) as T) : padrao
  } catch {
    return padrao
  }
}
function gravar(k: string, v: unknown): boolean {
  try {
    localStorage.setItem(k, JSON.stringify(v))
    return true
  } catch {
    return false
  }
}

export const listar = (): Projeto[] => ler<unknown[]>(CHAVE, []).map(validarProjeto).filter((p): p is Projeto => !!p)
export const obter = (id: string) => listar().find((p) => p.id === id)
export const novoId = () => crypto.randomUUID().slice(0, 8)

export function salvar(p: Projeto): boolean {
  const atualizado = { ...p, atualizadoEm: new Date().toISOString() }
  return gravar(CHAVE, [atualizado, ...listar().filter((x) => x.id !== p.id)])
}

export function excluir(id: string) {
  gravar(CHAVE, listar().filter((p) => p.id !== id))
}

export function duplicar(p: Projeto): Projeto {
  const agora = new Date().toISOString()
  const copia = { ...p, id: novoId(), criadoEm: agora, cao: { ...p.cao, nome: `${p.cao.nome} ${tr('(cópia)', '(copy)')}` } }
  salvar(copia)
  return copia
}

/** Importa sem sobrescrever: id repetido ganha id novo. Retorna quantos entraram. */
export function importar(dados: unknown): number {
  const lista = (Array.isArray(dados) ? dados : [dados]).map(validarProjeto).filter((p): p is Projeto => !!p)
  const ids = new Set(listar().map((p) => p.id))
  for (const p of lista) salvar(ids.has(p.id) ? { ...p, id: novoId() } : p)
  return lista.length
}

export const lerRascunho = () => ler<Partial<Projeto> | null>(RASCUNHO, null)
export const gravarRascunho = (r: Partial<Projeto>) => gravar(RASCUNHO, r)
export const limparRascunho = () => {
  try {
    localStorage.removeItem(RASCUNHO)
  } catch {
    /* sem storage: nada a limpar */
  }
}

export function paraLink(p: Projeto): string {
  const bytes = deflateSync(strToU8(JSON.stringify(p)), { level: 9 })
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function deLink(s: string): Projeto | null {
  try {
    const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/'))
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0))
    return validarProjeto(JSON.parse(strFromU8(inflateSync(bytes))))
  } catch {
    return null
  }
}

/** Fronteira de confiança: link e arquivo importado vêm de fora. Aceita só o formato esperado. */
export function validarProjeto(x: unknown): Projeto | null {
  if (!x || typeof x !== 'object') return null
  const o = x as Record<string, unknown>
  const obj = (v: unknown) => (v && typeof v === 'object' ? (v as Record<string, unknown>) : null)
  const num = (v: unknown, padrao?: number) => (typeof v === 'number' && Number.isFinite(v) ? v : padrao)
  const str = (v: unknown, max = 80) => (typeof v === 'string' ? v.slice(0, max) : '')
  const cao = obj(o.cao)
  const md = obj(o.medidas)
  const mt = obj(o.materiais) ?? {}
  const aj = obj(o.ajustes) ?? {}
  if (o.versao !== 1 || !cao || !md) return null
  const medidas = {
    alturaPernaCm: num(md.alturaPernaCm),
    alturaPernaDianteiraCm: num(md.alturaPernaDianteiraCm, 0),
    comprimentoCm: num(md.comprimentoCm),
    larguraCm: num(md.larguraCm),
    alturaCostasCm: num(md.alturaCostasCm),
  }
  const pesoKg = num(cao.pesoKg)
  if (pesoKg === undefined || Object.values(medidas).some((v) => v === undefined)) return null
  const m = MATERIAIS_PADRAO
  const a = AJUSTES_PADRAO
  return {
    versao: 1,
    id: str(o.id, 20).replace(/[^\w-]/g, '') || novoId(),
    criadoEm: str(o.criadoEm, 40),
    atualizadoEm: str(o.atualizadoEm, 40),
    cao: { nome: str(cao.nome) || tr('Sem nome', 'Unnamed'), raca: str(cao.raca, 30), pesoKg },
    tipo: o.tipo === 'dianteira' || o.tipo === 'quatro' ? o.tipo : 'traseira',
    metodoMedida: 'deitado-de-lado',
    medidas: medidas as Projeto['medidas'],
    materiais: {
      tubo: mt.tubo === 'pvc' ? 'pvc' : 'aluminio',
      tuboD: num(mt.tuboD, m.tuboD)!,
      tuboParede: num(mt.tuboParede, m.tuboParede)!,
      rodaD: num(mt.rodaD, m.rodaD)!,
      rodaLargura: num(mt.rodaLargura, m.rodaLargura)!,
      eixoD: num(mt.eixoD, m.eixoD)!,
      parafusoD: num(mt.parafusoD, m.parafusoD)!,
    },
    ajustes: {
      folgaLateralCm: num(aj.folgaLateralCm, a.folgaLateralCm)!,
      ajusteAlturaCm: num(aj.ajusteAlturaCm, a.ajusteAlturaCm)!,
      extensaoTraseiraMm: num(aj.extensaoTraseiraMm, a.extensaoTraseiraMm)!,
      folgaImpressao: num(aj.folgaImpressao, a.folgaImpressao)!,
      paredeConexao: num(aj.paredeConexao, a.paredeConexao)!,
      profundidade: num(aj.profundidade, a.profundidade)!,
    },
    avisoVet: o.avisoVet === true,
  }
}
