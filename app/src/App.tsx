import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { Inicio } from './ui/Inicio'
import { Wizard } from './ui/Wizard'
import { Projetos } from './ui/Projetos'
import { Carregando } from './ui/Carregando'
import { deLink, importar, obter } from './store'
import { idioma, tr, trocarIdioma } from './i18n'

document.documentElement.lang = idioma === 'en' ? 'en' : 'pt-BR'
document.title = tr('Rodante — cadeira de rodas sob medida para cães', 'Rodante — custom-fit dog wheelchairs')

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
      <Suspense
        fallback={
          <div style={{ position: 'relative', minHeight: '70vh' }}>
            <Carregando fracao={0.05} titulo={tr('Abrindo a prancha', 'Opening the drawing board')} detalhe={tr('carregando o visualizador 3D', 'loading the 3D viewer')} />
          </div>
        }
      >
        <Prancha id={id} />
      </Suspense>
    )
  else if (rota === 'p')
    pagina = <p className="pagina">{linkInvalido
          ? tr('Este link de projeto está incompleto ou corrompido. Peça um novo link a quem compartilhou.', 'This project link is incomplete or corrupted. Ask whoever shared it for a new link.')
          : tr('Abrindo projeto compartilhado…', 'Opening shared project…')}</p>
  else pagina = <Inicio />

  return (
    <>
      <header className="topo">
        <Marca />
        <nav aria-label={tr('Principal', 'Main')}>
          <a href="#/novo" aria-current={rota === 'novo' ? 'page' : undefined}>
            {tr('Novo projeto', 'New project')}
          </a>
          <a href="#/projetos" aria-current={rota === 'projetos' ? 'page' : undefined}>
            {tr('Meus projetos', 'My projects')}
          </a>
          <button className="idioma" onClick={() => trocarIdioma(idioma === 'en' ? 'pt' : 'en')} lang={idioma === 'en' ? 'pt-BR' : 'en'}>
            {idioma === 'en' ? 'Português' : 'English'}
          </button>
        </nav>
      </header>
      <main ref={main} tabIndex={-1}>{pagina}</main>
      {rota !== 'projeto' && (
        <footer className="rodape">
          {tr(
            'Rodante é gratuito e de código aberto (MIT). Os projetos ficam só no seu navegador. Nenhum projeto substitui a avaliação de um veterinário.',
            'Rodante is free and open source (MIT). Projects stay in your browser only. No design replaces a vet assessment.',
          )}
        </footer>
      )}
    </>
  )
}
