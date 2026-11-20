import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { ArrowRight, Check, Dog, Printer, Ruler, Stethoscope, Users, X } from 'lucide-react'
import { Miniatura } from './Miniatura'
import { gravarRascunho, lerRascunho } from '../store'
import { ir } from '../rota'
import { tr } from '../i18n'
import { computeDesign, LETRA_TIPO, TIPOS } from '../model/design'
import { comprados, cortes, montagem } from '../model/bom'
import type { TipoCadeira } from '../model/types'
import { projetoProvisorio } from './exemplo'
import { movimentoReduzido, tem3D, useVisivel } from './tela'

const PalcoProjeto = lazy(() => import('./PalcoProjeto'))
const PecasVitrine = lazy(() => import('./PecasVitrine'))

const REGRAS: { sim: boolean; titulo: string; texto: string }[] = [
  { sim: true, titulo: tr('Fale com um veterinário antes', 'Talk to a vet first'), texto: tr('A cadeira certa depende do diagnóstico.', 'The right cart depends on the diagnosis.') },
  { sim: false, titulo: tr('Escolher o tipo sozinho', 'Picking the type on your own'), texto: tr('O tipo errado de cadeira pode piorar o quadro.', 'The wrong type of cart can make things worse.') },
  { sim: true, titulo: tr('Comece com o quadro baixo', 'Start with the frame low'), texto: tr('As patas devem tocar o chão. Ajuste aos poucos.', 'The paws must touch the ground. Adjust gradually.') },
  { sim: false, titulo: tr('Usar acima de 40 kg', 'Using it above 40 kg'), texto: tr('Projeto caseiro não é indicado. Procure um fabricante profissional.', 'A home-made design is not suitable. Look for a professional manufacturer.') },
  { sim: true, titulo: tr('Primeiros usos curtos', 'Short first sessions'), texto: tr('De 5 a 10 minutos, sempre supervisionados.', '5 to 10 minutes, always supervised.') },
  { sim: false, titulo: tr('Esquecer a revisão', 'Skipping the check-up'), texto: tr('Use porca autotravante e inspecione as peças toda semana.', 'Use lock nuts and inspect the parts every week.') },
]

/** 0 → 1 conforme a seção passa pela tela (para montar a cadeira com a rolagem). */
function useRolagem(ref: React.RefObject<HTMLElement | null>) {
  const [p, setP] = useState(0)
  useEffect(() => {
    let raf = 0
    const medir = () => {
      raf = 0
      const el = ref.current
      if (!el) return
      const r = el.getBoundingClientRect()
      setP(Math.min(1, Math.max(0, -r.top / Math.max(1, r.height - innerHeight))))
    }
    const pedir = () => (raf ||= requestAnimationFrame(medir))
    addEventListener('scroll', pedir, { passive: true })
    addEventListener('resize', pedir)
    medir()
    return () => {
      removeEventListener('scroll', pedir)
      removeEventListener('resize', pedir)
      cancelAnimationFrame(raf)
    }
  }, [ref])
  return p
}

export function Inicio() {
  const temRascunho = !!lerRascunho()
  const [tipo, setTipo] = useState<TipoCadeira>('traseira')
  const p = useMemo(() => projetoProvisorio(tipo), [tipo])
  const d = useMemo(() => computeDesign(p), [p])
  const passos = useMemo(() => montagem(p, d), [p, d])
  const tubos = useMemo(() => cortes(d), [d])
  const maior = Math.max(...tubos.map((t) => t.comprimento))

  const [capa, capaVisivel] = useVisivel<HTMLDivElement>('0px')
  const [inventario, inventarioPerto] = useVisivel<HTMLElement>('600px')
  const [cadLigado, setCadLigado] = useState(false)
  if (inventarioPerto && !cadLigado) setCadLigado(true) // liga uma vez e não desliga

  const secaoMontagem = useRef<HTMLElement>(null)
  const [palcoMontagem, montagemVisivel] = useVisivel<HTMLDivElement>('0px')
  const prog = useRolagem(secaoMontagem)
  const reduzido = movimentoReduzido()
  const passoAtivo = reduzido ? passos.length - 1 : Math.min(passos.length - 1, Math.floor(prog * passos.length))
  const explodir = reduzido ? 0 : Math.max(0, 1 - prog * 1.25)

  function comecar() {
    gravarRascunho({ ...(lerRascunho() ?? {}), tipo })
    ir('novo')
  }

  const miniaturaGrande = <Miniatura p={p} />

  return (
    <>
      <section className="capa" aria-labelledby="capa-titulo">
        <div className="capa-texto">
          <h1 id="capa-titulo">{tr('A cadeira de rodas do seu cão começa com uma fita métrica.', "Your dog's wheelchair starts with a tape measure.")}</h1>
          <p className="lead">
            {tr(
              'Algumas medidas do seu cão e os materiais que você tem. O Rodante devolve o projeto: modelo 3D, lista de compras, cortes de tubo e as peças para imprimir em 3D.',
              'A few measurements of your dog and the materials you have. Rodante gives back the design: 3D model, shopping list, tube cuts and the parts to 3D print.',
            )}
          </p>
          <fieldset className="tipos">
            <legend>{tr('Qual cadeira o veterinário indicou?', 'Which cart did the vet recommend?')}</legend>
            {TIPOS.map((t) => (
              <label key={t.id} className="tipo" title={t.desc}>
                <input type="radio" name="tipo-capa" checked={tipo === t.id} onChange={() => setTipo(t.id)} />
                <span className="letra" aria-hidden="true">{LETRA_TIPO[t.id]}</span>
                <Miniatura p={projetoProvisorio(t.id)} />
                <span className="nome">{t.nome}</span>
              </label>
            ))}
          </fieldset>
          <div className="acoes">
            <button className="btn btn-primario btn-grande" onClick={comecar}>
              {temRascunho ? tr('Continuar projeto', 'Continue project') : tr('Começar com esta', 'Start with this one')}
              <ArrowRight className="ico" aria-hidden="true" />
            </button>
            <a className="btn btn-grande" href="#/projetos">
              {tr('Meus projetos', 'My projects')}
            </a>
          </div>
        </div>

        <div className="capa-cena" ref={capa}>
          <p className="rotulo-exemplo">
            <Dog className="ico" aria-hidden="true" />
            {tr('Cão de exemplo, ~10 kg', 'Example dog, ~10 kg')}
          </p>
          {tem3D ? (
            <Suspense fallback={<div className="cena">{miniaturaGrande}</div>}>
              <PalcoProjeto p={p} andar ligarCad={cadLigado} ativo={capaVisivel} folga={0.88} inicial="tras" />
            </Suspense>
          ) : (
            <div className="cena">{miniaturaGrande}</div>
          )}
        </div>

        <div className="precisa">
          <span>{tr('Você vai precisar', "You'll need")}</span>
          <span className="item">
            <b>×1</b> <Ruler className="ico" aria-hidden="true" /> {tr('fita métrica', 'tape measure')}
          </span>
          <span className="item">
            <b>×2</b> <Users className="ico" aria-hidden="true" /> {tr('pessoas', 'people')}
          </span>
          <span className="item">
            <b>×1</b> <Stethoscope className="ico" aria-hidden="true" /> {tr('veterinário', 'vet')}
          </span>
          <span className="item">
            <b>×1</b> <Printer className="ico" aria-hidden="true" /> {tr('impressora 3D ou serviço de impressão', '3D printer or print service')}
          </span>
        </div>
      </section>

      <section className="secao" ref={inventario} aria-labelledby="inv-titulo">
        <header>
          <h2 id="inv-titulo">{tr('Tudo o que entra na cadeira, contado.', 'Everything that goes into the cart, counted.')}</h2>
          <p>
            {tr(
              `Peças e cortes reais da cadeira ${TIPOS.find((t) => t.id === tipo)!.nome.toLowerCase()} do cão de exemplo. Com as medidas do seu cão, tudo muda de tamanho.`,
              `Real parts and cuts of the example dog's ${TIPOS.find((t) => t.id === tipo)!.nome.toLowerCase()} cart. With your dog's measurements, everything resizes.`,
            )}
          </p>
        </header>
        {tem3D ? (
          <Suspense fallback={null}>
            <PecasVitrine d={d} ligar={cadLigado} />
          </Suspense>
        ) : (
          <ul className="inventario" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {d.pecas.map((pc) => (
              <li key={pc.chave} className="item-peca" style={{ gridTemplateRows: 'auto' }}>
                <div className="legenda">
                  <span className="qtd" style={{ position: 'static' }}>×{pc.qtd}</span>
                  <h3>{pc.nome}</h3>
                </div>
              </li>
            ))}
          </ul>
        )}
        <h3 className="sub-inventario">{tr('Comprado pronto', 'Bought ready-made')}</h3>
        <ul className="comprados">
          {comprados(p, d).map((l) => (
            <li key={l.item}>
              <b>{l.un === 'm' ? `${String(l.qtd).replace('.', tr(',', '.'))} m` : `×${l.qtd}`}</b>
              <span>
                <strong>{l.item}</strong>
                <small>{l.especificacao}</small>
              </span>
            </li>
          ))}
        </ul>
        <h3 className="sub-inventario">{tr('Cortes de tubo, em escala', 'Tube cuts, to scale')}</h3>
        <div className="cortes" aria-label={tr('Cortes de tubo, desenhados em escala', 'Tube cuts, drawn to scale')}>
          {tubos.map((t) => (
            <div key={t.nome + t.comprimento} className="corte">
              <span>{t.nome}</span>
              <span className="corte-mm">
                {t.comprimento} mm <small>×{t.qtd}</small>
              </span>
              <span className="barra">
                <span className="tubo-desenho" style={{ width: `${(t.comprimento / maior) * 100}%` }} />
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="montagem-rolagem" ref={secaoMontagem} aria-labelledby="mont-titulo">
        <div className="palco" ref={palcoMontagem}>
          <h2 className="titulo-palco" id="mont-titulo">{tr(`Monte em ${passos.length} passos`, `Build it in ${passos.length} steps`)}</h2>
          {tem3D ? (
            <Suspense fallback={null}>
              <PalcoProjeto p={p} ligarCad={cadLigado} explodir={explodir} cao={passoAtivo === passos.length - 1} ativo={montagemVisivel} folga={1.2} />
            </Suspense>
          ) : (
            <div className="cena">{miniaturaGrande}</div>
          )}
        </div>
        <ol className="passos">
          {passos.map((t, i) => (
            <li key={t} className="passo" data-ativo={i === passoAtivo}>
              <p>{t}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="secao" aria-labelledby="regras-titulo">
        <header>
          <h2 id="regras-titulo">{tr('Certo e errado', 'Do and don’t')}</h2>
          <p>
            {tr(
              'Este projeto é caseiro, sem teste de laboratório. A cadeira deve ser usada com supervisão e só depois da avaliação de um veterinário.',
              'This is a home-made design, not lab tested. The cart must be used under supervision and only after a vet assessment.',
            )}
          </p>
        </header>
        <div className="certo-errado">
          {[0, 2, 4].map((i) => (
            <div key={i} className="par entra">
              {REGRAS.slice(i, i + 2).map((r) => (
                <div key={r.titulo} className="regra" data-tipo={r.sim ? 'sim' : 'nao'}>
                  <span className="marca-regra" role="img" aria-label={r.sim ? tr('Faça', 'Do') : tr('Não faça', "Don't")}>
                    {r.sim ? <Check className="ico" aria-hidden="true" /> : <X className="ico" aria-hidden="true" />}
                  </span>
                  <p>
                    <strong>{r.titulo}</strong>
                    {r.texto}
                  </p>
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>

      <section className="fecho" aria-labelledby="fecho-titulo">
        <div>
          <h2 id="fecho-titulo">{tr('Pronto para medir?', 'Ready to measure?')}</h2>
          <p className="mudo" style={{ fontSize: '1.15rem', marginTop: 12 }}>
            {tr('Leva uns 10 minutos. O projeto fica só no seu navegador.', 'It takes about 10 minutes. The project stays in your browser.')}
          </p>
        </div>
        <div className="acoes">
          <button className="btn btn-primario btn-grande" onClick={comecar}>
            {temRascunho ? tr('Continuar projeto', 'Continue project') : tr('Começar projeto', 'Start a project')}
            <ArrowRight className="ico" aria-hidden="true" />
          </button>
        </div>
      </section>
    </>
  )
}
