import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { Inicio } from './ui/Inicio'
import { Wizard } from './ui/Wizard'
import { Projetos } from './ui/Projetos'
import { deLink, importar, obter } from './store'

// three.js e o motor CAD só carregam quando a prancha abre
const Prancha = lazy(() => import('./ui/Prancha'))

function useRota(): string[] {
  const [h, setH] = useState(location.hash)
  useEffect(() => {
    const f = () => setH(location.hash)
    addEventListener('hashchange', f)
    return () => removeEventListener('hashchange', f)
  }, [])
  return h.replace(/^#\/?/, '').split('/')
}

function Marca() {
  return (
    <a className="marca" href="#/">
      <svg viewBox="0 0 30 30" aria-hidden="true">
        <circle cx="10" cy="21" r="7" fill="none" stroke="currentColor" strokeWidth="2.5" />
        <circle cx="10" cy="21" r="2" fill="currentColor" />
        <path d="M10 21 V8 H26" fill="none" stroke="currentColor" strokeWidth="2.5" />
        <rect x="14" y="5" width="10" height="5" fill="var(--fita)" />
      </svg>
      Rodante
    </a>
  )
}

export default function App() {
  const [rota, id] = useRota()
  const main = useRef<HTMLElement>(null)
  const linkInvalido = rota === 'p' && !!id && !deLink(id)

  useEffect(() => {
    scrollTo(0, 0)
    main.current?.focus()
  }, [rota, id])

  // link compartilhado: #/p/<dados> → importa e abre
  useEffect(() => {
    if (rota !== 'p' || !id) return
    const p = deLink(id)
    if (!p) return
    if (!obter(p.id)) importar(p)
    location.replace(`#/projeto/${obter(p.id) ? p.id : ''}`)
  }, [rota, id])

  let pagina
  if (rota === 'novo') pagina = <Wizard />
  else if (rota === 'projetos') pagina = <Projetos />
  else if (rota === 'projeto' && id)
    pagina = (
      <Suspense fallback={<p className="pagina">Abrindo a prancha…</p>}>
        <Prancha id={id} />
      </Suspense>
    )
  else if (rota === 'p')
    pagina = <p className="pagina">{linkInvalido ? 'Este link de projeto está incompleto ou corrompido. Peça um novo link a quem compartilhou.' : 'Abrindo projeto compartilhado…'}</p>
  else pagina = <Inicio />

  return (
    <>
      <header className="topo">
        <Marca />
        <nav aria-label="Principal">
          <a href="#/novo" aria-current={rota === 'novo' ? 'page' : undefined}>Novo projeto</a>
          <a href="#/projetos" aria-current={rota === 'projetos' ? 'page' : undefined}>Meus projetos</a>
        </nav>
      </header>
      <main ref={main} tabIndex={-1}>{pagina}</main>
      {rota !== 'projeto' && (
        <footer className="rodape">
          Rodante é gratuito e de código aberto (MIT). Os projetos ficam só no seu navegador. Nenhum projeto substitui a avaliação de um veterinário.
        </footer>
      )}
    </>
  )
}
