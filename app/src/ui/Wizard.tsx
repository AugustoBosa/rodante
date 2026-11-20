import { useEffect, useRef, useState } from 'react'
import { Campo } from './Campo'
import { Ilustracao, type QualMedida } from './Ilustracao'
import { RACAS } from '../data/racas'
import { AJUSTES_PADRAO, LIMITE_PESO_KG, MATERIAIS_PADRAO, MEDIDAS_VAZIAS, tuboMinimo } from '../model/defaults'
import { validarCampo } from '../model/design'
import type { Cao, Materiais, Medidas, Projeto } from '../model/types'
import { gravarRascunho, lerRascunho, limparRascunho, novoId, salvar } from '../store'
import { ir } from '../rota'

interface Rascunho {
  passo: number
  cao: Cao
  medidas: Medidas
  materiais: Materiais
  avisoVet: boolean
}

const PASSOS = ['Seu cão', 'Tipo de cadeira', 'Medidas', 'Materiais', 'Revisão']

const MEDIDAS: { k: keyof Medidas; ilus: QualMedida; rotulo: string; como: string }[] = [
  { k: 'alturaPernaCm', ilus: 'alturaPerna', rotulo: 'Altura da perna traseira', como: 'Deite o cão de lado. Meça da prega onde a coxa encontra o corpo até a almofada da pata, com a perna relaxada, sem esticar.' },
  { k: 'comprimentoCm', ilus: 'comprimento', rotulo: 'Comprimento do tronco', como: 'Do meio do ombro (logo atrás da pata da frente) ao meio do quadril.' },
  { k: 'larguraCm', ilus: 'largura', rotulo: 'Largura do corpo', como: 'Com o cão em pé, olhe de cima e meça o ponto mais largo, em geral a barriga ou o quadril.' },
  { k: 'alturaCostasCm', ilus: 'alturaCostas', rotulo: 'Altura das costas', como: 'Com o cão em pé, da linha das costas até o chão. Use para conferir as outras medidas.' },
]

const TUBOS_COMUNS = [12.7, 15.88, 19.05, 22.22, 25.4]

function inicial(): Rascunho {
  const r = lerRascunho() as Partial<Rascunho> | null
  return {
    passo: r?.passo ?? 0,
    cao: { nome: '', raca: '', pesoKg: 0, ...r?.cao },
    medidas: { ...MEDIDAS_VAZIAS, ...r?.medidas },
    materiais: { ...MATERIAIS_PADRAO, ...r?.materiais },
    avisoVet: r?.avisoVet ?? false,
  }
}

function errosDoPasso(r: Rascunho, passo: number): Record<string, string> {
  const e: Record<string, string> = {}
  const v = (campo: Parameters<typeof validarCampo>[0], valor: number) => {
    const m = validarCampo(campo, valor)
    if (m) e[campo] = m
  }
  if (passo === 0) {
    if (!r.cao.nome.trim()) e.nome = 'Dê um nome para encontrar o projeto depois'
    v('pesoKg', r.cao.pesoKg)
  }
  if (passo === 2) for (const m of MEDIDAS) v(m.k, r.medidas[m.k])
  if (passo === 3) for (const k of ['tuboD', 'tuboParede', 'rodaD', 'rodaLargura', 'eixoD', 'parafusoD'] as const) v(k, r.materiais[k])
  if (passo === 4 && !r.avisoVet) e.avisoVet = 'Confirme para gerar o projeto'
  return e
}

export function Wizard() {
  const [r, setR] = useState(inicial)
  const [mostrarErros, setMostrarErros] = useState(false)
  const titulo = useRef<HTMLHeadingElement>(null)
  const erros = errosDoPasso(r, r.passo)
  const err = (k: string) => (mostrarErros ? erros[k] : null)
  const raca = RACAS.find((x) => x.id === r.cao.raca)

  useEffect(() => {
    gravarRascunho(r)
  }, [r])
  useEffect(() => titulo.current?.focus(), [r.passo])

  const set = <K extends keyof Rascunho>(k: K, v: Partial<Rascunho[K]>) =>
    setR((x) => ({ ...x, [k]: typeof v === 'object' ? { ...(x[k] as object), ...v } : v }))

  function avancar() {
    if (Object.keys(erros).length) {
      setMostrarErros(true)
      requestAnimationFrame(() => (document.querySelector('[aria-invalid="true"]') as HTMLElement | null)?.focus())
      return
    }
    setMostrarErros(false)
    if (r.passo < PASSOS.length - 1) return setR({ ...r, passo: r.passo + 1 })
    const agora = new Date().toISOString()
    const p: Projeto = {
      versao: 1,
      id: novoId(),
      criadoEm: agora,
      atualizadoEm: agora,
      cao: { ...r.cao, nome: r.cao.nome.trim() },
      tipo: 'traseira',
      metodoMedida: 'deitado-de-lado',
      medidas: r.medidas,
      materiais: r.materiais,
      ajustes: AJUSTES_PADRAO,
      avisoVet: true,
    }
    salvar(p)
    limparRascunho()
    ir(`projeto/${p.id}`)
  }

  return (
    <div className="wizard">
      <header>
        <div className="fita-progresso" role="progressbar" aria-valuemin={1} aria-valuemax={PASSOS.length} aria-valuenow={r.passo + 1} aria-valuetext={`Passo ${r.passo + 1} de ${PASSOS.length}: ${PASSOS[r.passo]}`}>
          <div className="cheio" style={{ width: `${((r.passo + 1) / PASSOS.length) * 100}%` }} />
          <span>
            {r.passo + 1}/{PASSOS.length} · {PASSOS[r.passo]}
          </span>
        </div>
      </header>

      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault()
          avancar()
        }}
      >
        {r.passo === 0 && (
          <section>
            <h1 ref={titulo} tabIndex={-1}>Quem vai usar a cadeira?</h1>
            <p className="mudo">O nome serve para achar o projeto depois. A raça só ajuda a conferir as medidas.</p>
            <div className="grade-campos">
              <div className="campo" data-erro={!!err('nome')}>
                <label htmlFor="nome">Nome do cão</label>
                <div className="entrada">
                  <input id="nome" type="text" autoComplete="off" value={r.cao.nome} onChange={(e) => set('cao', { nome: e.target.value })} aria-invalid={!!err('nome')} aria-describedby={err('nome') ? 'nome-erro' : undefined} style={{ fontFamily: 'var(--texto)' }} />
                </div>
                {err('nome') && <p className="erro" id="nome-erro">{err('nome')}</p>}
              </div>
              <div className="campo">
                <label htmlFor="raca">Raça</label>
                <div className="entrada">
                  <select id="raca" value={r.cao.raca} onChange={(e) => set('cao', { raca: e.target.value })}>
                    <option value="">Não sei / outra</option>
                    {RACAS.map((x) => (
                      <option key={x.id} value={x.id}>{x.nome}</option>
                    ))}
                  </select>
                </div>
              </div>
              <Campo rotulo="Peso" unidade="kg" valor={r.cao.pesoKg} vazioSeZero onChange={(pesoKg) => set('cao', { pesoKg })} erro={err('pesoKg')} ajuda={raca?.pesoKg ? `Comum para ${raca.nome}: ${raca.pesoKg[0]}–${raca.pesoKg[1]} kg` : undefined} />
            </div>
            {r.cao.pesoKg > LIMITE_PESO_KG && (
              <p className="alerta" data-nivel="erro" role="alert">
                Acima de {LIMITE_PESO_KG} kg o projeto caseiro não é indicado. Você pode continuar para estudar, mas procure um fabricante profissional.
              </p>
            )}
          </section>
        )}

        {r.passo === 1 && (
          <section>
            <h1 ref={titulo} tabIndex={-1}>Que tipo de cadeira?</h1>
            <p className="mudo">Quem indica o tipo é o veterinário. Por enquanto o Rodante desenha só a traseira, a mais comum.</p>
            <fieldset className="opcoes" style={{ border: 0, padding: 0 }}>
              <legend className="visualmente-oculto">Tipo de cadeira</legend>
              <label className="opcao">
                <input type="radio" name="tipo" defaultChecked />
                <h3>Traseira</h3>
                Para fraqueza ou paralisia só nas patas de trás, com a frente forte. Casos comuns: hérnia de disco (IVDD) e mielopatia degenerativa.
              </label>
              <label className="opcao">
                <input type="radio" name="tipo" disabled />
                <h3>Dianteira <span className="selo">em breve</span></h3>
                Para fraqueza nas patas da frente, com a traseira funcionando.
              </label>
              <label className="opcao">
                <input type="radio" name="tipo" disabled />
                <h3>Quatro rodas <span className="selo">em breve</span></h3>
                Para fraqueza nas quatro patas ou falta de equilíbrio. Em cão com fraqueza só atrás, pesa e cansa mais.
              </label>
            </fieldset>
          </section>
        )}

        {r.passo === 2 && (
          <section>
            <h1 ref={titulo} tabIndex={-1}>Hora da fita métrica</h1>
            <p className="mudo">Meça em centímetros, com calma e com ajuda de outra pessoa. Na dúvida, meça duas vezes e use a média.</p>
            {MEDIDAS.map((m) => (
              <div key={m.k} className="cartao medida">
                <Ilustracao medida={m.ilus} />
                <Campo
                  rotulo={m.rotulo}
                  unidade="cm"
                  valor={r.medidas[m.k]}
                  vazioSeZero
                  onChange={(v) => set('medidas', { [m.k]: v })}
                  erro={err(m.k)}
                  ajuda={m.como + (m.k === 'alturaCostasCm' && raca?.alturaCm ? ` Comum para ${raca.nome}: ${raca.alturaCm[0]}–${raca.alturaCm[1]} cm.` : '')}
                />
              </div>
            ))}
          </section>
        )}

        {r.passo === 3 && (
          <section>
            <h1 ref={titulo} tabIndex={-1}>O que você tem para montar?</h1>
            <p className="mudo">Os valores já vêm preenchidos com medidas comuns no Brasil. Troque pelo que você comprou ou tem em casa. Meça o tubo com paquímetro.</p>
            <fieldset className="opcoes" style={{ border: 0, padding: 0, marginBottom: 20 }}>
              <legend className="campo" style={{ fontWeight: 700, marginBottom: 8 }}>Tubo do quadro</legend>
              {(['aluminio', 'pvc'] as const).map((t) => (
                <label key={t} className="opcao">
                  <input type="radio" name="tubo" checked={r.materiais.tubo === t} onChange={() => set('materiais', { tubo: t })} />
                  <h3>{t === 'aluminio' ? 'Alumínio' : 'PVC'}</h3>
                  {t === 'aluminio' ? 'Leve e resistente. Indicado para a maioria dos cães.' : 'Barato e fácil de achar. Só para cães leves, até ~12 kg.'}
                </label>
              ))}
            </fieldset>
            <div className="grade-campos">
              <div>
                <Campo rotulo="Ø externo do tubo" unidade="mm" passo={0.01} valor={r.materiais.tuboD} onChange={(tuboD) => set('materiais', { tuboD })} erro={err('tuboD')} ajuda={`Recomendado para ${r.cao.pesoKg || '?'} kg: ≥ ${tuboMinimo(r.cao.pesoKg)} mm`} />
                <div className="acoes" style={{ marginTop: 6 }}>
                  {TUBOS_COMUNS.map((d) => (
                    <button key={d} type="button" className="btn btn-pequeno" onClick={() => set('materiais', { tuboD: d })}>
                      {d}
                    </button>
                  ))}
                </div>
              </div>
              <Campo rotulo="Parede do tubo" unidade="mm" valor={r.materiais.tuboParede} onChange={(tuboParede) => set('materiais', { tuboParede })} erro={err('tuboParede')} />
              <Campo rotulo="Ø da roda" unidade="mm" passo={1} valor={r.materiais.rodaD} onChange={(rodaD) => set('materiais', { rodaD })} erro={err('rodaD')} ajuda="Roda menor deixa o quadro mais baixo e estável." />
              <Campo rotulo="Largura da roda" unidade="mm" passo={1} valor={r.materiais.rodaLargura} onChange={(rodaLargura) => set('materiais', { rodaLargura })} erro={err('rodaLargura')} />
              <Campo rotulo="Ø do eixo da roda" unidade="mm" passo={1} valor={r.materiais.eixoD} onChange={(eixoD) => set('materiais', { eixoD })} erro={err('eixoD')} ajuda="Diâmetro do furo do rolamento. Vira o parafuso-eixo." />
              <Campo rotulo="Ø do parafuso de trava" unidade="mm" passo={1} valor={r.materiais.parafusoD} onChange={(parafusoD) => set('materiais', { parafusoD })} erro={err('parafusoD')} ajuda="Prende o tubo na conexão. 0 = sem furo." />
            </div>
          </section>
        )}

        {r.passo === 4 && (
          <section>
            <h1 ref={titulo} tabIndex={-1}>Confira antes de gerar</h1>
            <div className="cartao" style={{ marginBottom: 16 }}>
              <dl className="resumo">
                <dt>Cão</dt>
                <dd>{r.cao.nome} · {raca?.nome ?? 'raça não informada'} · {r.cao.pesoKg} kg</dd>
                <dt>Tipo</dt>
                <dd>Traseira</dd>
                {MEDIDAS.map((m) => (
                  <Fragmento key={m.k} dt={m.rotulo} dd={`${r.medidas[m.k]} cm`} />
                ))}
                <dt>Tubo</dt>
                <dd>{r.materiais.tubo === 'aluminio' ? 'Alumínio' : 'PVC'} Ø {r.materiais.tuboD} × {r.materiais.tuboParede} mm</dd>
                <dt>Roda</dt>
                <dd>Ø {r.materiais.rodaD} × {r.materiais.rodaLargura} mm, eixo {r.materiais.eixoD} mm</dd>
              </dl>
              <div className="acoes" style={{ marginTop: 12 }}>
                <button type="button" className="btn btn-pequeno" onClick={() => setR({ ...r, passo: 2 })}>Corrigir medidas</button>
                <button type="button" className="btn btn-pequeno" onClick={() => setR({ ...r, passo: 3 })}>Corrigir materiais</button>
              </div>
            </div>
            <div className="aviso-vet campo" data-erro={!!err('avisoVet')}>
              <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontWeight: 400 }}>
                <input type="checkbox" checked={r.avisoVet} onChange={(e) => setR({ ...r, avisoVet: e.target.checked })} style={{ width: 22, height: 22, marginTop: 2 }} aria-invalid={!!err('avisoVet')} aria-describedby={err('avisoVet') ? 'vet-erro' : undefined} />
                <span>
                  <strong>Vou avaliar o uso com um veterinário ou fisioterapeuta.</strong> Entendo que é um projeto caseiro, sem teste de laboratório, e que a cadeira deve ser usada com supervisão.
                </span>
              </label>
              {err('avisoVet') && <p className="erro" id="vet-erro">{err('avisoVet')}</p>}
            </div>
          </section>
        )}

        <div className="barra-passos">
          <button type="button" className="btn" disabled={r.passo === 0} onClick={() => { setMostrarErros(false); setR({ ...r, passo: r.passo - 1 }) }}>
            Voltar
          </button>
          <button type="submit" className="btn btn-primario">
            {r.passo === PASSOS.length - 1 ? 'Gerar projeto' : 'Avançar'}
          </button>
        </div>
      </form>
    </div>
  )
}

function Fragmento({ dt, dd }: { dt: string; dd: string }) {
  return (
    <>
      <dt>{dt}</dt>
      <dd>{dd}</dd>
    </>
  )
}
