import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { Box, Dog, Download, Expand, Info, Link2, OctagonAlert, Printer, Ruler, SlidersHorizontal, TriangleAlert } from 'lucide-react'
import { Carregando } from './Carregando'
import { Campo } from './Campo'
import { MiniPeca, Vista3D, type Vista, type Vista3DHandle } from './Vista3D'
import { usePecas } from './usePecas'
import { corPeca } from './coresPecas'
import { cad } from '../cad/cliente'
import { computeDesign, medidasDoTipo, TIPOS, validarCampo } from '../model/design'
import { bom, cortes, csv, montagem } from '../model/bom'
import { LIMITES } from '../model/defaults'
import type { Ajustes, Design, Materiais, Medidas, Projeto, TipoCadeira } from '../model/types'
import { RACAS, nomeRaca } from '../data/racas'
import { tr } from '../i18n'
import { obter, paraLink, salvar } from '../store'
import { baixar, DICA_IMPRESSAO, linhasCortes, nomeStl, pacoteZip, slug } from '../saidas'

type Aba = 'bom' | 'cortes' | 'pecas' | 'montagem' | 'alertas'
const ABAS: [Aba, string][] = [
  ['pecas', tr('Peças', 'Parts')],
  ['bom', tr('Materiais', 'Materials')],
  ['cortes', tr('Cortes', 'Cuts')],
  ['montagem', tr('Montagem', 'Assembly')],
  ['alertas', tr('Alertas', 'Alerts')],
]
const VISTAS: Record<Vista, string> = { iso: '3D', tras: tr('Trás', 'Rear'), lado: tr('Lado', 'Side'), frente: tr('Frente', 'Front'), topo: tr('Topo', 'Top') }
const NIVEL: Record<string, string> = { erro: tr('erro', 'error'), aviso: tr('aviso', 'warning'), info: 'info' }
const ICONE_NIVEL = { erro: OctagonAlert, aviso: TriangleAlert, info: Info }

type NomeCampo = keyof typeof LIMITES
const CAMPOS_MEDIDAS: [keyof Medidas, string][] = [
  ['alturaPernaDianteiraCm', tr('Altura da perna dianteira', 'Front leg height')],
  ['alturaPernaCm', tr('Altura da perna traseira', 'Hind leg height')],
  ['comprimentoCm', tr('Comprimento do tronco', 'Body length')],
  ['larguraCm', tr('Largura do corpo', 'Body width')],
  ['alturaCostasCm', tr('Altura das costas', 'Back height')],
]
const CAMPOS_MATERIAIS: [keyof Omit<Materiais, 'tubo'>, string, boolean][] = [
  ['tuboD', tr('Ø externo do tubo', 'Tube outer Ø'), false],
  ['tuboParede', tr('Parede do tubo', 'Tube wall'), true],
  ['rodaD', tr('Ø da roda', 'Wheel Ø'), false],
  ['rodaLargura', tr('Largura da roda', 'Wheel width'), false],
  ['eixoD', tr('Ø do eixo da roda', 'Wheel axle Ø'), false],
  ['parafusoD', tr('Ø do parafuso de trava', 'Locking bolt Ø'), false],
]
const CAMPOS_AJUSTES: [keyof Ajustes, string, string, string][] = [
  ['folgaLateralCm', tr('Folga lateral (por lado)', 'Side clearance (each side)'), 'cm', tr('Espaço entre o corpo e o quadro.', 'Space between body and frame.')],
  ['ajusteAlturaCm', tr('Abaixar o quadro em', 'Lower the frame by'), 'cm', tr('Comece mais baixo e suba aos poucos.', 'Start low and raise it gradually.')],
  ['extensaoTraseiraMm', tr('Trilho além do eixo', 'Rail past the axle'), 'mm', tr('Do eixo até a barra ou ponteira.', 'From the axle to the crossbar or end cap.')],
  ['folgaImpressao', tr('Folga de impressão', 'Print clearance'), 'mm', tr('No diâmetro do encaixe. Calibre com uma peça de teste.', 'On the socket diameter. Calibrate with a test part.')],
  ['paredeConexao', tr('Parede das conexões', 'Connector wall'), 'mm', ''],
  ['profundidade', tr('Profundidade do encaixe', 'Socket depth'), 'mm', tr('Quanto o tubo entra na conexão.', 'How far the tube goes into the connector.')],
]

function invalidos(p: Projeto): string[] {
  const todos: [NomeCampo, number][] = [
    ['pesoKg', p.cao.pesoKg],
    ...medidasDoTipo(p.tipo).map((k) => [k, p.medidas[k]] as [NomeCampo, number]),
    ...CAMPOS_MATERIAIS.map(([k]) => [k, p.materiais[k]] as [NomeCampo, number]),
    ...CAMPOS_AJUSTES.map(([k]) => [k, p.ajustes[k]] as [NomeCampo, number]),
  ]
  return todos.filter(([k, v]) => validarCampo(k, v)).map(([k]) => k)
}

export default function Prancha({ id }: { id: string }) {
  const [p, setP] = useState(() => obter(id))
  if (!p)
    return (
      <div className="projetos vazio">
        <h1>{tr('Projeto não encontrado', 'Project not found')}</h1>
        <p>
          {tr(
            'Ele pode ter sido excluído ou criado em outro navegador. Projetos ficam salvos só no navegador onde foram feitos.',
            'It may have been deleted or created in another browser. Projects are saved only in the browser where they were made.',
          )}
        </p>
        <a className="btn btn-primario" href="#/projetos">
          {tr('Ver meus projetos', 'See my projects')}
        </a>
      </div>
    )
  return <PranchaProjeto p={p} setP={(f) => setP((x) => (x ? f(x) : x))} />
}

function PranchaProjeto({ p, setP }: { p: Projeto; setP: (f: (x: Projeto) => Projeto) => void }) {
  const [modo, setModo] = useState<'simples' | 'avancado'>('simples')
  const [aba, setAba] = useState<Aba>('pecas')
  const [largo] = useState(() => matchMedia('(min-width: 1101px)').matches) // celular: parâmetros começam fechados
  const [cotas, setCotas] = useState(largo) // celular: cotas começam desligadas (poluem a tela pequena)
  const [explodir, setExplodir] = useState(false)
  const [verCao, setVerCao] = useState(true)
  const [destaque, setDestaque] = useState<string | null>(null)
  const [status, setStatus] = useState(tr('Salvo neste navegador', 'Saved in this browser'))
  const vista = useRef<Vista3DHandle>(null)
  const ultimo = useRef<Design | null>(null)

  const ruins = invalidos(p)
  const d = useMemo(() => (ruins.length ? ultimo.current : computeDesign(p)), [p, ruins.length])
  if (d) ultimo.current = d
  const erros = d?.alertas.filter((a) => a.nivel === 'erro') ?? []
  const { pecas, meshes, erro: erroCad, carga, prontas, feitas } = usePecas(d)

  // salva automático
  useEffect(() => {
    const t = setTimeout(() => setStatus(salvar(p) ? tr('Salvo neste navegador', 'Saved in this browser') : tr('Não foi possível salvar (armazenamento bloqueado)', 'Could not save (storage blocked)')), 400)
    return () => clearTimeout(t)
  }, [p])

  const nomeArq = slug(p.cao.nome)

  async function baixarTudo() {
    if (!d) return
    setStatus(tr('Montando o pacote…', 'Building the package…'))
    const stls = Object.fromEntries(Object.entries(pecas).map(([k, v]) => [k, v.stl]))
    const steps = Object.fromEntries(await Promise.all(d.pecas.map(async (pc) => [pc.chave, await cad.step(pc.spec)] as const)))
    baixar(`rodante_${nomeArq}.zip`, await pacoteZip(p, d, stls, steps, await stepConjunto(d)))
    setStatus(tr('Pacote baixado', 'Package downloaded'))
  }

  const stepConjunto = (dd: Design) =>
    cad.conjunto({ tubos: dd.tubos, juntas: dd.juntas, rodas: dd.rodas }, { d: p.materiais.tuboD, parede: p.materiais.tuboParede })

  async function baixarConjunto() {
    if (!d) return
    setStatus(tr('Montando o STEP do conjunto…', 'Building the assembly STEP…'))
    baixar(`rodante_${nomeArq}_conjunto.step`, await stepConjunto(d))
    setStatus(tr('STEP do conjunto baixado', 'Assembly STEP downloaded'))
  }

  async function copiarLink() {
    const url = `${location.origin}${location.pathname}#/p/${paraLink(p)}`
    try {
      await navigator.clipboard.writeText(url)
      setStatus(tr('Link copiado. Quem abrir recebe uma cópia do projeto.', 'Link copied. Whoever opens it gets a copy of the project.'))
    } catch {
      window.prompt(tr('Copie o link do projeto:', 'Copy the project link:'), url)
    }
  }

  const setCao = (v: Partial<Projeto['cao']>) => setP((x) => ({ ...x, cao: { ...x.cao, ...v } }))
  const setMed = (v: Partial<Medidas>) => setP((x) => ({ ...x, medidas: { ...x.medidas, ...v } }))
  const setMat = (v: Partial<Materiais>) => setP((x) => ({ ...x, materiais: { ...x.materiais, ...v } }))
  const setAj = (v: Partial<Ajustes>) => setP((x) => ({ ...x, ajustes: { ...x.ajustes, ...v } }))

  function teclaAbas(e: KeyboardEvent) {
    const i = ABAS.findIndex(([k]) => k === aba)
    const n = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0
    if (!n) return
    const prox = ABAS[(i + n + ABAS.length) % ABAS.length][0]
    setAba(prox)
    document.getElementById(`aba-${prox}`)?.focus()
  }

  const raca = RACAS.find((r) => r.id === p.cao.raca)
  const nAlertas = d?.alertas.filter((a) => a.nivel !== 'info').length ?? 0

  return (
    <div className="prancha">
      <div className="prancha-topo">
        <div>
          <h1>{p.cao.nome}</h1>
          <span className="ficha">
            {TIPOS.find((t) => t.id === p.tipo)!.nome} · {raca ? nomeRaca(raca) : tr('raça não informada', 'breed not given')} · {p.cao.pesoKg} kg
          </span>
        </div>
        <div className="acoes">
          <span className="status" role="status" aria-live="polite">{status}</span>
          <button className="btn btn-primario" onClick={baixarTudo} disabled={!prontas || erros.length > 0} title={erros.length ? tr('Corrija os erros antes de baixar', 'Fix the errors before downloading') : undefined}>
            <Download className="ico" aria-hidden="true" />
            {prontas ? tr('Baixar pacote (.zip)', 'Download package (.zip)') : tr('Gerando peças…', 'Generating parts…')}
          </button>
          <button className="btn btn-pequeno" onClick={copiarLink}>
            <Link2 className="ico" aria-hidden="true" />
            {tr('Copiar link', 'Copy link')}
          </button>
          <button className="btn btn-pequeno" onClick={() => print()}>
            <Printer className="ico" aria-hidden="true" />
            {tr('Imprimir', 'Print')}
          </button>
        </div>
      </div>

      <aside className="painel" aria-label={tr('Parâmetros do projeto', 'Project parameters')}>
        <details open={largo}>
          <summary>
            <SlidersHorizontal className="ico" aria-hidden="true" />
            {tr('Parâmetros', 'Parameters')}
          </summary>
          <div className="alternador" role="group" aria-label={tr('Nível de detalhe', 'Detail level')}>
            <button aria-pressed={modo === 'simples'} onClick={() => setModo('simples')}>
              {tr('Simples', 'Simple')}
            </button>
            <button aria-pressed={modo === 'avancado'} onClick={() => setModo('avancado')}>
              {tr('Avançado', 'Advanced')}
            </button>
          </div>
          <fieldset>
            <legend>{tr('Cão', 'Dog')}</legend>
            <div className="campo">
              <label htmlFor="p-nome">{tr('Nome', 'Name')}</label>
              <div className="entrada">
                <input id="p-nome" type="text" value={p.cao.nome} onChange={(e) => setCao({ nome: e.target.value })} />
              </div>
            </div>
            <Campo rotulo={tr('Peso', 'Weight')} unidade="kg" valor={p.cao.pesoKg} onChange={(pesoKg) => setCao({ pesoKg })} erro={validarCampo('pesoKg', p.cao.pesoKg)} />
          </fieldset>
          <fieldset>
            <legend>{tr('Cadeira', 'Cart')}</legend>
            <div className="campo">
              <label htmlFor="p-tipo">{tr('Tipo', 'Type')}</label>
              <div className="entrada">
                <select id="p-tipo" value={p.tipo} onChange={(e) => setP((x) => ({ ...x, tipo: e.target.value as TipoCadeira }))}>
                  {TIPOS.map((t) => (
                    <option key={t.id} value={t.id}>{t.nome}</option>
                  ))}
                </select>
              </div>
            </div>
          </fieldset>
          <fieldset>
            <legend>{tr('Medidas', 'Measurements')}</legend>
            {CAMPOS_MEDIDAS.filter(([k]) => medidasDoTipo(p.tipo).includes(k)).map(([k, r]) => (
              <Campo key={k} rotulo={r} unidade="cm" valor={p.medidas[k]} onChange={(v) => setMed({ [k]: v })} erro={validarCampo(k, p.medidas[k])} />
            ))}
          </fieldset>
          <fieldset>
            <legend>{tr('Materiais', 'Materials')}</legend>
            <div className="campo">
              <label htmlFor="p-tubo">{tr('Tubo', 'Tube')}</label>
              <div className="entrada">
                <select id="p-tubo" value={p.materiais.tubo} onChange={(e) => setMat({ tubo: e.target.value as Materiais['tubo'] })}>
                  <option value="aluminio">{tr('Alumínio', 'Aluminum')}</option>
                  <option value="pvc">PVC</option>
                </select>
              </div>
            </div>
            {CAMPOS_MATERIAIS.filter(([, , av]) => !av || modo === 'avancado').map(([k, r]) => (
              <Campo key={k} rotulo={r} unidade="mm" passo={k === 'tuboD' ? 0.01 : 0.5} valor={p.materiais[k]} onChange={(v) => setMat({ [k]: v })} erro={validarCampo(k, p.materiais[k])} />
            ))}
          </fieldset>
          {modo === 'avancado' && (
            <fieldset>
              <legend>{tr('Ajustes finos', 'Fine tuning')}</legend>
              {CAMPOS_AJUSTES.map(([k, r, un, ajuda]) => (
                <Campo key={k} rotulo={r} unidade={un} passo={un === 'mm' && k === 'folgaImpressao' ? 0.05 : 0.5} valor={p.ajustes[k]} onChange={(v) => setAj({ [k]: v })} erro={validarCampo(k, p.ajustes[k])} ajuda={ajuda || undefined} />
              ))}
            </fieldset>
          )}
        </details>
      </aside>

      <section className="vista" aria-label={tr('Modelo 3D', '3D model')}>
        {verCao && (
          <p className="aproximado">
            <Dog className="ico" aria-hidden="true" />
            {tr('Cão em posição aproximada, só para dar escala.', 'Dog in an approximate position, for scale only.')}
          </p>
        )}
        {d && (
          <Vista3D
            ref={vista}
            design={d}
            meshes={meshes}
            tuboD={p.materiais.tuboD}
            tipo={p.tipo}
            cotas={cotas}
            explodir={explodir ? 1 : 0}
            cao={verCao && !explodir ? p.medidas : null}
            destaque={destaque}
          />
        )}
        <div className="vista-controles" role="toolbar" aria-label={tr('Controles da vista', 'View controls')}>
          {(['iso', 'tras', 'lado', 'frente', 'topo'] as Vista[]).map((v) => (
            <button key={v} className="btn btn-pequeno" onClick={() => vista.current?.olhar(v)}>
              {v === 'iso' && <Box className="ico" aria-hidden="true" />}
              {VISTAS[v]}
            </button>
          ))}
          <span className="sep" aria-hidden="true" />
          <button className="btn btn-pequeno" aria-pressed={cotas} onClick={() => setCotas(!cotas)}>
            <Ruler className="ico" aria-hidden="true" />
            {tr('Cotas', 'Dimensions')}
          </button>
          <button className="btn btn-pequeno" aria-pressed={explodir} onClick={() => setExplodir(!explodir)}>
            <Expand className="ico" aria-hidden="true" />
            {tr('Explodir', 'Explode')}
          </button>
          <button className="btn btn-pequeno" aria-pressed={verCao} onClick={() => setVerCao(!verCao)} title={tr('Mostrar o cão na cadeira', 'Show the dog in the cart')}>
            <Dog className="ico" aria-hidden="true" />
            {tr('Cão', 'Dog')}
          </button>
        </div>
        {!prontas && !erroCad && d && (
          <Carregando
            fracao={carga < 1 ? carga : feitas / d.pecas.length}
            titulo={carga < 1 ? tr('Preparando o motor de desenho', 'Preparing the drawing engine') : tr('Desenhando as peças', 'Drawing the parts')}
            detalhe={
              carga < 1
                ? `${Math.round(carga * 100)}% · ${tr('só na primeira vez, depois fica guardado no navegador', 'first time only, then it stays cached in the browser')}`
                : tr(`${feitas} de ${d.pecas.length} peças`, `${feitas} of ${d.pecas.length} parts`)
            }
          />
        )}
      </section>

      <section className="lateral" aria-label={tr('Detalhes do projeto', 'Project details')}>
        {(erros.length > 0 || ruins.length > 0 || erroCad) && (
          <div style={{ padding: '16px 16px 0' }} role="alert">
            {ruins.length > 0 && (
              <p className="alerta" data-nivel="erro">
                <OctagonAlert className="ico" aria-hidden="true" />
                <span>{tr('Há campo com valor inválido nos parâmetros. Mostrando o último projeto válido.', 'A parameter has an invalid value. Showing the last valid design.')}</span>
              </p>
            )}
            {erros.map((a) => (
              <p key={a.texto} className="alerta" data-nivel="erro">
                <OctagonAlert className="ico" aria-hidden="true" />
                <span>{a.texto}</span>
              </p>
            ))}
            {erroCad && (
              <p className="alerta" data-nivel="erro">
                <OctagonAlert className="ico" aria-hidden="true" />
                <span>{erroCad}</span>
              </p>
            )}
          </div>
        )}
        <div className="abas" role="tablist" aria-label={tr('Seções do projeto', 'Project sections')} onKeyDown={teclaAbas}>
          {ABAS.map(([k, r]) => (
            <button key={k} id={`aba-${k}`} role="tab" aria-selected={aba === k} aria-controls={`painel-${k}`} tabIndex={aba === k ? 0 : -1} onClick={() => setAba(k)}>
              {r}
              {k === 'alertas' && nAlertas > 0 && <span className="conta">{nAlertas}</span>}
            </button>
          ))}
        </div>
        {d && (
          <>
            <div className="aba" role="tabpanel" id="painel-pecas" aria-labelledby="aba-pecas" hidden={aba !== 'pecas'}>
              <h2>{tr('Peças para imprimir', 'Parts to print')}</h2>
              <p className="mudo">
                {tr('PETG, 4 paredes, 40% de preenchimento. Imprima uma peça e teste o encaixe no tubo antes das outras.', 'PETG, 4 walls, 40% infill. Print one part and test the fit on the tube before the others.')}
              </p>
              <p>
                <button className="btn btn-pequeno nao-imprimir" disabled={!prontas || erros.length > 0} onClick={baixarConjunto}>
                  <Download className="ico" aria-hidden="true" />
                  {tr('Conjunto montado (.step)', 'Full assembly (.step)')}
                </button>
              </p>
              <div className="pecas">
                {d.pecas.map((pc) => {
                  const r = pecas[pc.chave]
                  return (
                    <div
                      key={pc.chave}
                      className="peca"
                      onPointerEnter={() => setDestaque(pc.chave)}
                      onPointerLeave={() => setDestaque(null)}
                      onFocus={() => setDestaque(pc.chave)}
                      onBlur={() => setDestaque(null)}
                    >
                      <div className="mini">
                        {r ? <MiniPeca mesh={r.mesh} cor={corPeca(pc.spec)} rotulo={`${tr('Prévia', 'Preview')}: ${pc.nome}`} ativo={destaque === pc.chave} /> : <span className="mudo" style={{ display: 'block', padding: 8 }}>{tr('desenhando…', 'drawing…')}</span>}
                      </div>
                      <div>
                        <div className="qtd">×{pc.qtd}</div>
                        <h3><span className="amostra" style={{ background: corPeca(pc.spec) }} aria-hidden="true" />{pc.nome}</h3>
                        <p className="mudo" style={{ fontSize: '0.9rem' }}>{DICA_IMPRESSAO[pc.spec.tipo]}</p>
                        <div className="acoes">
                          <button className="btn btn-pequeno nao-imprimir" disabled={!r} onClick={() => r && baixar(nomeStl(pc), r.stl)}>STL</button>
                          <button className="btn btn-pequeno nao-imprimir" disabled={!r} onClick={async () => baixar(nomeStl(pc).replace(/\.stl$/, '.step'), await cad.step(pc.spec))}>STEP</button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="aba" role="tabpanel" id="painel-bom" aria-labelledby="aba-bom" hidden={aba !== 'bom'}>
              <h2>{tr('Lista de materiais', 'Bill of materials')}</h2>
              <table>
                <thead>
                  <tr>
                    <th>{tr('Item', 'Item')}</th>
                    <th className="num">{tr('Qtd', 'Qty')}</th>
                  </tr>
                </thead>
                <tbody>
                  {bom(p, d).map((l) => (
                    <tr key={l.item}>
                      <td>
                        <strong>{l.item}</strong>
                        <br />
                        <span className="mudo">{l.especificacao}{l.obs ? ` · ${l.obs}` : ''}</span>
                      </td>
                      <td className="num">{String(l.qtd).replace('.', ',')} {l.un}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p style={{ marginTop: 12 }}>
                <button className="btn btn-pequeno nao-imprimir" onClick={() => baixar(`${tr('materiais', 'materials')}_${nomeArq}.csv`, csv(bom(p, d) as never), 'text/csv;charset=utf-8')}>
                  <Download className="ico" aria-hidden="true" />
                  {tr('Baixar CSV', 'Download CSV')}
                </button>
              </p>
            </div>

            <div className="aba" role="tabpanel" id="painel-cortes" aria-labelledby="aba-cortes" hidden={aba !== 'cortes'}>
              <h2>{tr('Cortes de tubo', 'Tube cuts')}</h2>
              <p className="mudo">{tr(`Medidas de ponta a ponta do tubo, já descontado o que entra nas conexões. Tubo Ø ${p.materiais.tuboD} mm.`, `Tube end-to-end lengths, with the part that goes into the connectors already taken off. Tube Ø ${p.materiais.tuboD} mm.`)}</p>
              <table>
                <thead>
                  <tr>
                    <th>{tr('Peça', 'Part')}</th>
                    <th className="num">{tr('Comprimento', 'Length')}</th>
                    <th className="num">{tr('Qtd', 'Qty')}</th>
                  </tr>
                </thead>
                <tbody>
                  {cortes(d).map((c) => (
                    <tr key={c.nome + c.comprimento}>
                      <td>{c.nome}</td>
                      <td className="num">{c.comprimento} mm</td>
                      <td className="num">{c.qtd}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p style={{ marginTop: 12 }}>
                <button className="btn btn-pequeno nao-imprimir" onClick={() => baixar(`${tr('cortes', 'cuts')}_${nomeArq}.csv`, csv(linhasCortes(d)), 'text/csv;charset=utf-8')}>
                  <Download className="ico" aria-hidden="true" />
                  {tr('Baixar CSV', 'Download CSV')}
                </button>
              </p>
            </div>

            <div className="aba" role="tabpanel" id="painel-montagem" aria-labelledby="aba-montagem" hidden={aba !== 'montagem'}>
              <h2>{tr('Montagem', 'Assembly')}</h2>
              <ol className="montagem">
                {montagem(p, d).map((m) => (
                  <li key={m}>{m}</li>
                ))}
              </ol>
            </div>

            <div className="aba" role="tabpanel" id="painel-alertas" aria-labelledby="aba-alertas" hidden={aba !== 'alertas'}>
              <h2>{tr('Alertas de segurança', 'Safety alerts')}</h2>
              {d.alertas.map((a) => {
                const Ico = ICONE_NIVEL[a.nivel]
                return (
                  <p key={a.texto} className="alerta" data-nivel={a.nivel}>
                    <Ico className="ico" aria-hidden="true" />
                    <span>
                      <strong>{NIVEL[a.nivel]}</strong>
                      {a.texto}
                    </span>
                  </p>
                )
              })}
            </div>
          </>
        )}
      </section>
    </div>
  )
}
