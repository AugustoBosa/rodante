import { useEffect, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { BR, US, ES, FR, DE, IT } from 'country-flag-icons/string/3x2'
import { IDIOMAS, idioma, idiomaNaoSuportado, tr, trocarIdioma } from '../i18n'

// ponytail: bandeira = país do IDIOMAS[].pais; idioma novo → um import acima e uma entrada aqui.
const BANDEIRA: Record<string, string> = Object.fromEntries(
  Object.entries({ BR, US, ES, FR, DE, IT }).map(([k, svg]) => [k, `data:image/svg+xml,${encodeURIComponent(svg)}`]),
)

export function SeletorIdioma() {
  const [aberto, setAberto] = useState(false)
  // idioma do navegador não suportado: seletor pulsa por alguns segundos
  const [destaque, setDestaque] = useState(idiomaNaoSuportado)
  const raiz = useRef<HTMLDivElement>(null)
  const botao = useRef<HTMLButtonElement>(null)
  const atual = IDIOMAS.find((i) => i.codigo === idioma)!

  useEffect(() => {
    if (!destaque) return
    const t = setTimeout(() => setDestaque(false), 8000)
    return () => clearTimeout(t)
  }, [destaque])

  useEffect(() => {
    if (!aberto) return
    const fora = (e: PointerEvent) => !raiz.current?.contains(e.target as Node) && setAberto(false)
    addEventListener('pointerdown', fora)
    return () => removeEventListener('pointerdown', fora)
  }, [aberto])

  return (
    <div
      className="idioma"
      ref={raiz}
      onKeyDown={(e) => {
        if (e.key === 'Escape' && aberto) {
          setAberto(false)
          botao.current?.focus()
        }
      }}
    >
      <button
        ref={botao}
        type="button"
        className={`idioma-botao${destaque ? ' idioma-destaque' : ''}`}
        aria-haspopup="true"
        aria-expanded={aberto}
        aria-label={`${tr('Idioma', 'Language')}: ${atual.nome}`}
        onClick={() => {
          setDestaque(false)
          setAberto(!aberto)
        }}
      >
        <img src={BANDEIRA[atual.pais]} alt="" width="20" height="14" />
        <span aria-hidden="true">{atual.codigo.toUpperCase()}</span>
        <ChevronDown className="ico" aria-hidden="true" />
      </button>
      {aberto && (
        <ul className="idioma-lista">
          {IDIOMAS.map((i) => (
            <li key={i.codigo}>
              <button
                type="button"
                lang={i.bcp47}
                aria-current={i.codigo === idioma ? 'true' : undefined}
                onClick={() => (i.codigo === idioma ? setAberto(false) : trocarIdioma(i.codigo))}
              >
                <img src={BANDEIRA[i.pais]} alt="" width="20" height="14" />
                {i.nome}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
