// Tradução mínima: pt e en vão inline no ponto de uso, tr('pt', 'en'); os demais idiomas
// ficam em catálogos (src/locales) indexados pela frase em inglês e caem no inglês se faltar.
// Textos com valores usam marcadores: tr('de {n} cm', 'of {n} cm', { n }).
// Para somar um idioma: um arquivo em locales/, um import e uma linha em IDIOMAS.
// ponytail: idioma fixo por carregamento (trocar recarrega a página); catálogos estáticos,
// carregar sob demanda se passarem de ~10 idiomas.
import es from './locales/es'
import fr from './locales/fr'
import de from './locales/de'
import it from './locales/it'

export const IDIOMAS = [
  { codigo: 'pt', nome: 'Português', bcp47: 'pt-BR', pais: 'BR' },
  { codigo: 'en', nome: 'English', bcp47: 'en-US', pais: 'US' },
  { codigo: 'es', nome: 'Español', bcp47: 'es-ES', pais: 'ES' },
  { codigo: 'fr', nome: 'Français', bcp47: 'fr-FR', pais: 'FR' },
  { codigo: 'de', nome: 'Deutsch', bcp47: 'de-DE', pais: 'DE' },
  { codigo: 'it', nome: 'Italiano', bcp47: 'it-IT', pais: 'IT' },
] as const

export type Idioma = (typeof IDIOMAS)[number]['codigo']
export const CATALOGOS: Partial<Record<Idioma, Record<string, string>>> = { es, fr, de, it }

const CHAVE = 'rodante.idioma'
const ehIdioma = (s: unknown): s is Idioma => IDIOMAS.some((i) => i.codigo === s)

// salvo > idioma do navegador (em ordem de preferência, só o prefixo: pt-PT→pt) > inglês.
// Sem nada suportado, ou se o navegador falhar, vai inglês e o seletor é destacado.
export function detectar(salvo?: unknown, navegador: readonly string[] = []): { idioma: Idioma; naoSuportado: boolean } {
  if (ehIdioma(salvo)) return { idioma: salvo, naoSuportado: false }
  for (const l of navegador) {
    const c = String(l).toLowerCase().split('-')[0]
    if (ehIdioma(c)) return { idioma: c, naoSuportado: false }
  }
  return { idioma: 'en', naoSuportado: true }
}

function inicial() {
  // testes (Node) e worker não têm window: ficam em português
  if (typeof window === 'undefined') return { idioma: 'pt' as Idioma, naoSuportado: false }
  let salvo: unknown
  try {
    salvo = localStorage.getItem(CHAVE)
  } catch {
    /* sem storage: segue o navegador */
  }
  let nav: readonly string[] = []
  try {
    nav = navigator.languages?.length ? navigator.languages : [navigator.language]
  } catch {
    /* sem navigator: inglês */
  }
  return detectar(salvo, nav)
}

const { idioma: _idioma, naoSuportado } = inicial()
export const idioma: Idioma = _idioma
export const idiomaNaoSuportado = naoSuportado
const atual = IDIOMAS.find((i) => i.codigo === idioma)!
export const bcp47: string = atual.bcp47

export function tr(pt: string, en: string, vars?: Record<string, string | number>): string {
  const s = idioma === 'pt' ? pt : idioma === 'en' ? en : (CATALOGOS[idioma]?.[en] ?? en)
  return vars ? s.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m)) : s
}

export function trocarIdioma(novo: Idioma) {
  try {
    localStorage.setItem(CHAVE, novo)
  } catch {
    /* sem storage: vale só até recarregar */
  }
  location.reload()
}

export const dataLocal = (iso: string) => new Date(iso).toLocaleDateString(bcp47)
export const dataHoraLocal = (d: Date) => d.toLocaleString(bcp47)
export const formatoNumero = (n: number) => new Intl.NumberFormat(bcp47, { useGrouping: false, maximumFractionDigits: 20 }).format(n)
// planilhas em locales de vírgula decimal esperam ';' entre colunas
export const separadorCsv = formatoNumero(1.5).includes(',') ? ';' : ','
