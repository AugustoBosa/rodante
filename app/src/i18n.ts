// Tradução mínima: cada texto leva as duas versões no próprio lugar, tr('pt', 'en').
// ponytail: idioma fixo por carregamento (trocar recarrega a página); sem lib, sem chaves.
export type Idioma = 'pt' | 'en'
const CHAVE = 'rodante.idioma'

function detectar(): Idioma {
  try {
    const s = localStorage.getItem(CHAVE)
    if (s === 'pt' || s === 'en') return s
  } catch {
    /* sem storage: segue o navegador */
  }
  return navigator.language?.toLowerCase().startsWith('pt') ? 'pt' : 'en'
}

// testes (Node) e worker não têm window: ficam em português
export const idioma: Idioma = typeof window === 'undefined' ? 'pt' : detectar()

export const tr = (pt: string, en: string) => (idioma === 'en' ? en : pt)

export function trocarIdioma(novo: Idioma) {
  try {
    localStorage.setItem(CHAVE, novo)
  } catch {
    /* sem storage: vale só até recarregar */
  }
  location.reload()
}

export const dataLocal = (iso: string) => new Date(iso).toLocaleDateString(idioma === 'en' ? 'en-US' : 'pt-BR')
