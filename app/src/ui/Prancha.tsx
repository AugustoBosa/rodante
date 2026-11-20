import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import type { ShapeMesh } from 'replicad'
import { Campo } from './Campo'
import { MiniPeca, Vista3D, type Vista, type Vista3DHandle } from './Vista3D'
import { cad } from '../cad/cliente'
import { computeDesign, validarCampo } from '../model/design'
import { bom, cortes, csv, montagem } from '../model/bom'
import { LIMITES } from '../model/defaults'
import type { Ajustes, Design, Materiais, Medidas, Projeto } from '../model/types'
import { RACAS } from '../data/racas'
import { obter, paraLink, salvar } from '../store'
import { baixar, DICA_IMPRESSAO, linhasCortes, nomeStl, pacoteZip, slug } from '../saidas'

type Aba = 'bom' | 'cortes' | 'pecas' | 'montagem' | 'alertas'
const ABAS: [Aba, string][] = [
  ['bom', 'Materiais'],
  ['cortes', 'Cortes'],
  ['pecas', 'Peças'],
  ['montagem', 'Montagem'],
  ['alertas', 'Alertas'],
]

type NomeCampo = keyof typeof LIMITES
const CAMPOS_MEDIDAS: [keyof Medidas, string][] = [
  ['alturaPernaCm', 'Altura da perna traseira'],
  ['comprimentoCm', 'Comprimento do tronco'],
  ['larguraCm', 'Largura do corpo'],
  ['alturaCostasCm', 'Altura das costas'],
]
const CAMPOS_MATERIAIS: [keyof Omit<Materiais, 'tubo'>, string, boolean][] = [
  ['tuboD', 'Ø externo do tubo', false],
  ['tuboParede', 'Parede do tubo', true],
  ['rodaD', 'Ø da roda', false],
  ['rodaLargura', 'Largura da roda', false],
  ['eixoD', 'Ø do eixo da roda', false],
  ['parafusoD', 'Ø do parafuso de trava', false],
]
const CAMPOS_AJUSTES: [keyof Ajustes, string, string, string][] = [
  ['folgaLateralCm', 'Folga lateral (por lado)', 'cm', 'Espaço entre o corpo e o quadro.'],
  ['ajusteAlturaCm', 'Abaixar o quadro em', 'cm', 'Comece mais baixo e suba aos poucos.'],
  ['extensaoTraseiraMm', 'Trilho atrás do eixo', 'mm', 'Até a barra traseira.'],
  ['folgaImpressao', 'Folga de impressão', 'mm', 'No diâmetro do encaixe. Calibre com uma peça de teste.'],
  ['paredeConexao', 'Parede das conexões', 'mm', ''],
  ['profundidade', 'Profundidade do encaixe', 'mm', 'Quanto o tubo entra na conexão.'],
]

function invalidos(p: Projeto): string[] {
  const todos: [NomeCampo, number][] = [
    ['pesoKg', p.cao.pesoKg],
    ...CAMPOS_MEDIDAS.map(([k]) => [k, p.medidas[k]] as [NomeCampo, number]),
    ...CAMPOS_MATERIAIS.map(([k]) => [k, p.materiais[k]] as [NomeCampo, number]),
    ...CAMPOS_AJUSTES.map(([k]) => [k, p.ajustes[k]] as [NomeCampo, number]),
  ]
  return todos.filter(([k, v]) => validarCampo(k, v)).map(([k]) => k)
}

export default function Prancha({ id }: { id: string }) {
  const [p, setP] = useState(() => obter(id))
  if (!p)
    return (
      <div className="pagina vazio">
        <h1>Projeto não encontrado</h1>
        <p>Ele pode ter sido excluído ou criado em outro navegador. Projetos ficam salvos só no navegador onde foram feitos.</p>
        <a className="btn btn-primario" href="#/projetos">Ver meus projetos</a>
      </div>
    )
  return <PranchaProjeto p={p} setP={(f) => setP((x) => (x ? f(x) : x))} />
}

function PranchaProjeto({ p, setP }: { p: Projeto; setP: (f: (x: Projeto) => Projeto) => void }) {
  const [modo, setModo] = useState<'simples' | 'avancado'>('simples')
  const [aba, setAba] = useState<Aba>('bom')
  const [cotas, setCotas] = useState(true)
  const [largo] = useState(() => matchMedia('(min-width: 1101px)').matches) // celular: parâmetros começam fechados
  const [status, setStatus] = useState('Salvo neste navegador')
  const [pecas, setPecas] = useState<Record<string, { mesh: ShapeMesh; stl: Blob }>>({})
  const [erroCad, setErroCad] = useState('')
  const vista = useRef<Vista3DHandle>(null)
  const ultimo = useRef<Design | null>(null)

  const ruins = invalidos(p)
  const d = useMemo(() => (ruins.length ? ultimo.current : computeDesign(p)), [p, ruins.length])
  if (d) ultimo.current = d
  const erros = d?.alertas.filter((a) => a.nivel === 'erro') ?? []
  const chaves = d?.pecas.map((pc) => pc.chave).join('|') ?? ''
  const prontas = !!d && d.pecas.every((pc) => pecas[pc.chave])

  // salva automático
  useEffect(() => {
    const t = setTimeout(() => setStatus(salvar(p) ? 'Salvo neste navegador' : 'Não foi possível salvar (armazenamento bloqueado)'), 400)
    return () => clearTimeout(t)
  }, [p])

  // gera as peças no worker (com espera curta para não recalcular a cada tecla)
  useEffect(() => {
    if (!d) return
    let vivo = true
    const t = setTimeout(() => {
      for (const pc of d.pecas)
        cad
          .peca(pc.spec)
          .then((r) => vivo && setPecas((x) => ({ ...x, [pc.chave]: r })))
          .catch((e) => vivo && setErroCad(`Falha ao gerar ${pc.nome}: ${e}`))
    }, 300)
    return () => {
      vivo = false
      clearTimeout(t)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chaves])

  const meshes = useMemo(() => Object.fromEntries(Object.entries(pecas).map(([k, v]) => [k, v.mesh])), [pecas])
  const nomeArq = slug(p.cao.nome)

  async function baixarTudo() {
    if (!d) return
    setStatus('Montando o pacote…')
    const stls = Object.fromEntries(Object.entries(pecas).map(([k, v]) => [k, v.stl]))
    baixar(`rodante_${nomeArq}.zip`, await pacoteZip(p, d, stls))
    setStatus('Pacote baixado')
  }

  async function copiarLink() {
    const url = `${location.origin}${location.pathname}#/p/${paraLink(p)}`
    try {
      await navigator.clipboard.writeText(url)
      setStatus('Link copiado. Quem abrir recebe uma cópia do projeto.')
    } catch {
      window.prompt('Copie o link do projeto:', url)
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

  return (
    <div className="prancha">
      <div className="prancha-topo">
        <div>
          <h1>{p.cao.nome}</h1>
          <span className="mudo mono" style={{ fontSize: '0.85rem' }}>
            traseira · {raca?.nome ?? 'raça não informada'} · {p.cao.pesoKg} kg
          </span>
        </div>
        <div className="acoes">
          <span className="mudo" role="status" aria-live="polite" style={{ fontSize: '0.9rem' }}>{status}</span>
          <button className="btn btn-primario btn-pequeno" onClick={baixarTudo} disabled={!prontas || erros.length > 0} title={erros.length ? 'Corrija os erros antes de baixar' : undefined}>
            {prontas ? 'Baixar pacote (.zip)' : 'Gerando peças…'}
          </button>
          <button className="btn btn-pequeno" onClick={copiarLink}>Copiar link</button>
          <button className="btn btn-pequeno" onClick={() => print()}>Imprimir prancha</button>
        </div>
      </div>

      <aside className="painel" aria-label="Parâmetros do projeto">
        <details open={largo}>
          <summary>Parâmetros</summary>
          <div className="alternador" role="group" aria-label="Nível de detalhe">
            <button aria-pressed={modo === 'simples'} onClick={() => setModo('simples')}>Simples</button>
            <button aria-pressed={modo === 'avancado'} onClick={() => setModo('avancado')}>Avançado</button>
          </div>
          <fieldset>
            <legend>Cão</legend>
            <div className="campo">
              <label htmlFor="p-nome">Nome</label>
              <div className="entrada">
                <input id="p-nome" type="text" value={p.cao.nome} onChange={(e) => setCao({ nome: e.target.value })} style={{ fontFamily: 'var(--texto)' }} />
              </div>
            </div>
            <Campo rotulo="Peso" unidade="kg" valor={p.cao.pesoKg} onChange={(pesoKg) => setCao({ pesoKg })} erro={validarCampo('pesoKg', p.cao.pesoKg)} />
          </fieldset>
          <fieldset>
            <legend>Medidas</legend>
            {CAMPOS_MEDIDAS.map(([k, r]) => (
              <Campo key={k} rotulo={r} unidade="cm" valor={p.medidas[k]} onChange={(v) => setMed({ [k]: v })} erro={validarCampo(k, p.medidas[k])} />
            ))}
          </fieldset>
          <fieldset>
            <legend>Materiais</legend>
            <div className="campo">
              <label htmlFor="p-tubo">Tubo</label>
              <div className="entrada">
                <select id="p-tubo" value={p.materiais.tubo} onChange={(e) => setMat({ tubo: e.target.value as Materiais['tubo'] })}>
                  <option value="aluminio">Alumínio</option>
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
              <legend>Ajustes finos</legend>
              {CAMPOS_AJUSTES.map(([k, r, un, ajuda]) => (
                <Campo key={k} rotulo={r} unidade={un} passo={un === 'mm' && k === 'folgaImpressao' ? 0.05 : 0.5} valor={p.ajustes[k]} onChange={(v) => setAj({ [k]: v })} erro={validarCampo(k, p.ajustes[k])} ajuda={ajuda || undefined} />
              ))}
            </fieldset>
          )}
        </details>
      </aside>

      <section className="vista" aria-label="Modelo 3D">
        <div className="vista-controles">
          {(['iso', 'lado', 'frente', 'topo'] as Vista[]).map((v) => (
            <button key={v} className="btn btn-pequeno" onClick={() => vista.current?.olhar(v)}>
              {v === 'iso' ? '3D' : v[0].toUpperCase() + v.slice(1)}
            </button>
          ))}
          <button className="btn btn-pequeno" aria-pressed={cotas} onClick={() => setCotas(!cotas)}>
            Cotas {cotas ? 'ligadas' : 'desligadas'}
          </button>
        </div>
        {d && <Vista3D ref={vista} design={d} meshes={meshes} tuboD={p.materiais.tuboD} cotas={cotas} />}
      </section>

      <section className="lateral" aria-label="Detalhes do projeto">
        {(erros.length > 0 || ruins.length > 0 || erroCad) && (
          <div style={{ padding: '16px 16px 0' }} role="alert">
            {ruins.length > 0 && (
              <p className="alerta" data-nivel="erro">Há campo com valor inválido nos parâmetros. Mostrando o último projeto válido.</p>
            )}
            {erros.map((a) => (
              <p key={a.texto} className="alerta" data-nivel="erro">{a.texto}</p>
            ))}
            {erroCad && <p className="alerta" data-nivel="erro">{erroCad}</p>}
          </div>
        )}
        <div className="abas" role="tablist" aria-label="Seções do projeto" onKeyDown={teclaAbas}>
          {ABAS.map(([k, r]) => (
            <button key={k} id={`aba-${k}`} role="tab" aria-selected={aba === k} aria-controls={`painel-${k}`} tabIndex={aba === k ? 0 : -1} onClick={() => setAba(k)}>
              {r}
              {k === 'alertas' && d ? ` (${d.alertas.filter((a) => a.nivel !== 'info').length})` : ''}
            </button>
          ))}
        </div>
        {d && (
          <>
            <div className="aba" role="tabpanel" id="painel-bom" aria-labelledby="aba-bom" hidden={aba !== 'bom'}>
              <h2>Lista de materiais</h2>
              <table>
                <thead>
                  <tr><th>Item</th><th className="num">Qtd</th></tr>
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
                <button className="btn btn-pequeno nao-imprimir" onClick={() => baixar(`materiais_${nomeArq}.csv`, csv(bom(p, d) as never), 'text/csv;charset=utf-8')}>Baixar CSV</button>
              </p>
            </div>

            <div className="aba" role="tabpanel" id="painel-cortes" aria-labelledby="aba-cortes" hidden={aba !== 'cortes'}>
              <h2>Cortes de tubo</h2>
              <p className="mudo">Medidas de ponta a ponta do tubo, já descontado o que entra nas conexões. Tubo Ø {p.materiais.tuboD} mm.</p>
              <table>
                <thead>
                  <tr><th>Peça</th><th className="num">Comprimento</th><th className="num">Qtd</th></tr>
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
                <button className="btn btn-pequeno nao-imprimir" onClick={() => baixar(`cortes_${nomeArq}.csv`, csv(linhasCortes(d)), 'text/csv;charset=utf-8')}>Baixar CSV</button>
              </p>
            </div>

            <div className="aba" role="tabpanel" id="painel-pecas" aria-labelledby="aba-pecas" hidden={aba !== 'pecas'}>
              <h2>Peças para imprimir</h2>
              <p className="mudo">PETG, 4 paredes, 40% de preenchimento. Imprima uma peça e teste o encaixe no tubo antes das outras.</p>
              <div className="pecas">
                {d.pecas.map((pc) => {
                  const r = pecas[pc.chave]
                  return (
                    <div key={pc.chave} className="peca">
                      <div className="mini">{r ? <MiniPeca mesh={r.mesh} rotulo={`Prévia: ${pc.nome}`} /> : <span className="mudo" style={{ display: 'block', padding: 8 }}>gerando…</span>}</div>
                      <div>
                        <h3>{pc.nome}</h3>
                        <div className="qtd">×{pc.qtd}</div>
                        <p className="mudo" style={{ fontSize: '0.9rem' }}>{DICA_IMPRESSAO[pc.spec.tipo]}</p>
                        <button className="btn btn-pequeno nao-imprimir" disabled={!r} onClick={() => r && baixar(nomeStl(pc), r.stl)}>Baixar STL</button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="aba" role="tabpanel" id="painel-montagem" aria-labelledby="aba-montagem" hidden={aba !== 'montagem'}>
              <h2>Montagem</h2>
              <ol className="montagem">
                {montagem(d).map((m) => (
                  <li key={m}>{m}</li>
                ))}
              </ol>
            </div>

            <div className="aba" role="tabpanel" id="painel-alertas" aria-labelledby="aba-alertas" hidden={aba !== 'alertas'}>
              <h2>Alertas de segurança</h2>
              {d.alertas.map((a) => (
                <p key={a.texto} className="alerta" data-nivel={a.nivel}>
                  <strong>{a.nivel}</strong>
                  <span>{a.texto}</span>
                </p>
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  )
}
