import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, OctagonAlert, Stethoscope, Users } from 'lucide-react'
import { Campo } from './Campo'
import { Ilustracao, type QualMedida } from './Ilustracao'
import { RACAS, nomeRaca } from '../data/racas'
import { tr } from '../i18n'
import { AJUSTES_PADRAO, LIMITE_PESO_KG, MATERIAIS_PADRAO, MEDIDAS_VAZIAS, tuboMinimo } from '../model/defaults'
import { LETRA_TIPO, medidasDoTipo, TIPOS, validarCampo } from '../model/design'
import type { Cao, Materiais, Medidas, Projeto, TipoCadeira } from '../model/types'
import { gravarRascunho, lerRascunho, limparRascunho, novoId, salvar } from '../store'
import { ir } from '../rota'
import { tem3D } from './tela'
import { projetoProvisorio } from './exemplo'

// three.js só carrega quando o palco aparece
const PalcoMedida = lazy(() => import('./PalcoMedida'))
const PalcoProjeto = lazy(() => import('./PalcoProjeto'))

interface Rascunho {
  passo: number
  tipo: TipoCadeira
  cao: Cao
  medidas: Medidas
  materiais: Materiais
  avisoVet: boolean
}

const PASSOS = [tr('Seu cão', 'Your dog'), tr('Tipo', 'Type'), tr('Medidas', 'Measurements'), tr('Materiais', 'Materials'), tr('Revisão', 'Review')]

const MEDIDAS: { k: keyof Medidas; ilus: QualMedida; rotulo: string; como: string }[] = [
  {
    k: 'alturaPernaDianteiraCm',
    ilus: 'alturaPernaDianteira',
    rotulo: tr('Altura da perna dianteira', 'Front leg height'),
    como: tr('Deite o cão de lado. Meça da axila (onde a pata da frente encontra o peito) até a almofada da pata, sem esticar.', 'Lay the dog on its side. Measure from the armpit (where the front leg meets the chest) to the paw pad, without stretching.'),
  },
  {
    k: 'alturaPernaCm',
    ilus: 'alturaPerna',
    rotulo: tr('Altura da perna traseira', 'Hind leg height'),
    como: tr('Deite o cão de lado. Meça da prega onde a coxa encontra o corpo até a almofada da pata, com a perna relaxada, sem esticar.', 'Lay the dog on its side. Measure from the crease where the thigh meets the body to the paw pad, leg relaxed, without stretching.'),
  },
  { k: 'comprimentoCm', ilus: 'comprimento', rotulo: tr('Comprimento do tronco', 'Body length'), como: tr('Do meio do ombro (logo atrás da pata da frente) ao meio do quadril.', 'From mid shoulder (just behind the front leg) to mid hip.') },
  { k: 'larguraCm', ilus: 'largura', rotulo: tr('Largura do corpo', 'Body width'), como: tr('Com o cão em pé, olhe de cima e meça o ponto mais largo, em geral a barriga ou o quadril.', 'With the dog standing, look from above and measure the widest point, usually the belly or hips.') },
  { k: 'alturaCostasCm', ilus: 'alturaCostas', rotulo: tr('Altura das costas', 'Back height'), como: tr('Com o cão em pé, da linha das costas até o chão. Use para conferir as outras medidas.', 'With the dog standing, from the back line to the ground. Used to cross-check the other measurements.') },
]

const TUBOS_COMUNS = [12.7, 15.88, 19.05, 22.22, 25.4]

const SUBTITULO = [
  tr('O nome serve para achar o projeto depois. A raça só ajuda a conferir as medidas.', 'The name helps you find the project later. The breed only helps cross-check the measurements.'),
  tr('Quem indica o tipo é o veterinário. Na dúvida, não escolha sozinho.', 'The vet decides the type. If in doubt, do not choose on your own.'),
  tr('Em centímetros, com calma. Na dúvida, meça duas vezes e use a média.', 'In centimeters, calmly. If unsure, measure twice and use the average.'),
  tr('Já vem com medidas comuns no Brasil. Troque pelo que você comprou ou tem em casa.', 'Prefilled with common sizes. Change them to what you bought or have at home.'),
  tr('Confira tudo. Dá para corrigir depois na prancha.', 'Check everything. You can still fix it later on the drawing board.'),
]

function inicial(): Rascunho {
  const r = lerRascunho() as Partial<Rascunho> | null
  return {
    passo: r?.passo ?? 0,
    tipo: r?.tipo ?? 'traseira',
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
    if (!r.cao.nome.trim()) e.nome = tr('Dê um nome para encontrar o projeto depois', 'Give it a name to find the project later')
    v('pesoKg', r.cao.pesoKg)
  }
  if (passo === 2) for (const k of medidasDoTipo(r.tipo)) v(k, r.medidas[k])
  if (passo === 3) for (const k of ['tuboD', 'tuboParede', 'rodaD', 'rodaLargura', 'eixoD', 'parafusoD'] as const) v(k, r.materiais[k])
  if (passo === 4 && !r.avisoVet) e.avisoVet = tr('Confirme para gerar o projeto', 'Confirm to generate the design')
  return e
}

export function Wizard() {
  const [r, setR] = useState(inicial)
  const [mostrarErros, setMostrarErros] = useState(false)
  const titulo = useRef<HTMLHeadingElement>(null)
  const erros = errosDoPasso(r, r.passo)
  const err = (k: string) => (mostrarErros ? erros[k] : null)
  const raca = RACAS.find((x) => x.id === r.cao.raca)
  const medidasTipo = MEDIDAS.filter((m) => medidasDoTipo(r.tipo).includes(m.k))
  const [focoEscolhido, setFoco] = useState<QualMedida>(medidasTipo[0].ilus)
  const foco = medidasTipo.some((m) => m.ilus === focoEscolhido) ? focoEscolhido : medidasTipo[0].ilus

  // o palco mostra a raça escolhida no tamanho típico enquanto nada foi medido
  const medidasPalco = useMemo(() => {
    const m = { ...r.medidas }
    if (!m.alturaCostasCm && raca?.alturaCm) m.alturaCostasCm = (raca.alturaCm[0] + raca.alturaCm[1]) / 2
    return m
  }, [r.medidas, raca])
  const provisorio = useMemo(() => projetoProvisorio(r.tipo, medidasPalco, r.materiais), [r.tipo, medidasPalco, r.materiais])

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
      tipo: r.tipo,
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

  const naMedida = r.passo === 2
  const reserva = (
    <div className="cena">
      <Ilustracao medida={naMedida ? foco : 'todas'} />
    </div>
  )

  return (
    <div className="wizard">
      <div className="wizard-palco">
        {tem3D ? (
          <Suspense fallback={reserva}>
            {naMedida ? <PalcoMedida med={medidasPalco} foco={foco} /> : <PalcoProjeto p={provisorio} ligarCad={r.passo >= 3} folga={1.2} />}
          </Suspense>
        ) : (
          reserva
        )}
        <p className="legenda-palco">
          {naMedida
            ? tem3D
              ? tr('A fita azul mostra onde medir. O cão muda de tamanho com os seus números.', 'The blue tape shows where to measure. The dog resizes with your numbers.')
              : tr('A fita azul mostra onde medir.', 'The blue tape shows where to measure.')
            : tr('Prévia: medidas que faltam usam um cão de exemplo.', 'Preview: missing measurements use an example dog.')}
        </p>
      </div>

      <div className="wizard-form">
        <ol className="etapas" aria-label={tr('Etapas', 'Steps')}>
          {PASSOS.map((nome, i) => (
            <li key={nome} data-estado={i < r.passo ? 'feito' : i === r.passo ? 'atual' : 'depois'} aria-current={i === r.passo ? 'step' : undefined}>
              {i + 1}. {nome}
            </li>
          ))}
        </ol>

        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault()
            avancar()
          }}
        >
          <section>
            <div className="cabeca-passo">
              <span className="n" aria-hidden="true">{r.passo + 1}</span>
              <div>
                <h1 ref={titulo} tabIndex={-1}>
                  <span className="visualmente-oculto">{tr(`Passo ${r.passo + 1} de ${PASSOS.length}: `, `Step ${r.passo + 1} of ${PASSOS.length}: `)}</span>
                  {[
                    tr('Quem vai usar a cadeira?', 'Who will use the cart?'),
                    tr('Que tipo de cadeira?', 'Which type of cart?'),
                    tr('Hora da fita métrica', 'Time for the tape measure'),
                    tr('O que você tem para montar?', 'What do you have to build with?'),
                    tr('Confira antes de gerar', 'Check before generating'),
                  ][r.passo]}
                </h1>
                <p>{SUBTITULO[r.passo]}</p>
              </div>
            </div>

            {r.passo === 0 && (
              <>
                <div className="grade-campos">
                  <div className="campo" data-erro={!!err('nome')}>
                    <label htmlFor="nome">{tr('Nome do cão', 'Dog name')}</label>
                    <div className="entrada">
                      <input id="nome" type="text" autoComplete="off" value={r.cao.nome} onChange={(e) => set('cao', { nome: e.target.value })} aria-invalid={!!err('nome')} aria-describedby={err('nome') ? 'nome-erro' : undefined} />
                    </div>
                    {err('nome') && <p className="erro" id="nome-erro">{err('nome')}</p>}
                  </div>
                  <div className="campo">
                    <label htmlFor="raca">{tr('Raça', 'Breed')}</label>
                    <div className="entrada">
                      <select id="raca" value={r.cao.raca} onChange={(e) => set('cao', { raca: e.target.value })}>
                        <option value="">{tr('Não sei / outra', 'Not sure / other')}</option>
                        {RACAS.map((x) => (
                          <option key={x.id} value={x.id}>
                            {nomeRaca(x)}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <Campo
                    rotulo={tr('Peso', 'Weight')}
                    unidade="kg"
                    valor={r.cao.pesoKg}
                    vazioSeZero
                    onChange={(pesoKg) => set('cao', { pesoKg })}
                    erro={err('pesoKg')}
                    ajuda={raca?.pesoKg ? tr(`Comum para ${nomeRaca(raca)}: ${raca.pesoKg[0]}–${raca.pesoKg[1]} kg`, `Typical for ${nomeRaca(raca)}: ${raca.pesoKg[0]}–${raca.pesoKg[1]} kg`) : undefined}
                  />
                </div>
                {r.cao.pesoKg > LIMITE_PESO_KG && (
                  <p className="alerta" data-nivel="erro" role="alert" style={{ marginTop: 18 }}>
                    <OctagonAlert className="ico" aria-hidden="true" />
                    <span>
                      {tr(
                        `Acima de ${LIMITE_PESO_KG} kg o projeto caseiro não é indicado. Você pode continuar para estudar, mas procure um fabricante profissional.`,
                        `Above ${LIMITE_PESO_KG} kg a home-made cart is not recommended. You can continue to study it, but look for a professional manufacturer.`,
                      )}
                    </span>
                  </p>
                )}
              </>
            )}

            {r.passo === 1 && (
              <fieldset className="opcoes" style={{ gridTemplateColumns: '1fr' }}>
                <legend className="visualmente-oculto">{tr('Tipo de cadeira', 'Cart type')}</legend>
                {TIPOS.map((t) => (
                  <label key={t.id} className="opcao">
                    <input type="radio" name="tipo" checked={r.tipo === t.id} onChange={() => setR({ ...r, tipo: t.id })} />
                    <span className="letra" aria-hidden="true">{LETRA_TIPO[t.id]}</span>
                    <h3>{t.nome}</h3>
                    <span className="mudo">{t.desc}</span>
                  </label>
                ))}
              </fieldset>
            )}

            {r.passo === 2 && (
              <>
                <p className="pessoas">
                  <Users className="ico" aria-hidden="true" />
                  {tr('Duas pessoas: uma acalma o cão, a outra mede.', 'Two people: one calms the dog, the other measures.')}
                </p>
                <div className="medidas-lista">
                  {medidasTipo.map((m) => (
                    <div key={m.k} className="medida" data-ativo={foco === m.ilus} onFocus={() => setFoco(m.ilus)} onPointerEnter={() => setFoco(m.ilus)}>
                      <Campo
                        rotulo={m.rotulo}
                        unidade="cm"
                        valor={r.medidas[m.k]}
                        vazioSeZero
                        onChange={(v) => set('medidas', { [m.k]: v })}
                        erro={err(m.k)}
                        ajuda={m.como + (m.k === 'alturaCostasCm' && raca?.alturaCm ? tr(` Comum para ${nomeRaca(raca)}: ${raca.alturaCm[0]}–${raca.alturaCm[1]} cm.`, ` Typical for ${nomeRaca(raca)}: ${raca.alturaCm[0]}–${raca.alturaCm[1]} cm.`) : '')}
                      />
                    </div>
                  ))}
                </div>
              </>
            )}

            {r.passo === 3 && (
              <>
                <fieldset className="opcoes" style={{ marginBottom: 22 }}>
                  <legend className="rotulo" style={{ fontWeight: 700, marginBottom: 8, padding: 0 }}>{tr('Tubo do quadro', 'Frame tube')}</legend>
                  {(['aluminio', 'pvc'] as const).map((t) => (
                    <label key={t} className="opcao">
                      <input type="radio" name="tubo" checked={r.materiais.tubo === t} onChange={() => set('materiais', { tubo: t })} />
                      <h3>{t === 'aluminio' ? tr('Alumínio', 'Aluminum') : 'PVC'}</h3>
                      <span className="mudo">
                        {t === 'aluminio'
                          ? tr('Leve e resistente. Indicado para a maioria dos cães.', 'Light and strong. Suits most dogs.')
                          : tr('Barato e fácil de achar. Só para cães leves, até ~12 kg.', 'Cheap and easy to find. Only for light dogs, up to ~12 kg.')}
                      </span>
                    </label>
                  ))}
                </fieldset>
                <div className="grade-campos">
                  <div>
                    <Campo
                      rotulo={tr('Ø externo do tubo', 'Tube outer Ø')}
                      unidade="mm"
                      passo={0.01}
                      valor={r.materiais.tuboD}
                      onChange={(tuboD) => set('materiais', { tuboD })}
                      erro={err('tuboD')}
                      ajuda={tr(`Recomendado para ${r.cao.pesoKg || '?'} kg: ≥ ${tuboMinimo(r.cao.pesoKg)} mm. Meça com paquímetro.`, `Recommended for ${r.cao.pesoKg || '?'} kg: ≥ ${tuboMinimo(r.cao.pesoKg)} mm. Measure with calipers.`)}
                    />
                    <div className="tubos-comuns" role="group" aria-label={tr('Diâmetros comuns', 'Common diameters')}>
                      {TUBOS_COMUNS.map((d) => (
                        <button key={d} type="button" className="btn btn-pequeno" aria-pressed={r.materiais.tuboD === d} onClick={() => set('materiais', { tuboD: d })}>
                          {String(d).replace('.', tr(',', '.'))}
                        </button>
                      ))}
                    </div>
                  </div>
                  <Campo rotulo={tr('Parede do tubo', 'Tube wall')} unidade="mm" valor={r.materiais.tuboParede} onChange={(tuboParede) => set('materiais', { tuboParede })} erro={err('tuboParede')} />
                  <Campo rotulo={tr('Ø da roda', 'Wheel Ø')} unidade="mm" passo={1} valor={r.materiais.rodaD} onChange={(rodaD) => set('materiais', { rodaD })} erro={err('rodaD')} ajuda={tr('Roda menor deixa o quadro mais baixo e estável.', 'A smaller wheel makes the frame lower and steadier.')} />
                  <Campo rotulo={tr('Largura da roda', 'Wheel width')} unidade="mm" passo={1} valor={r.materiais.rodaLargura} onChange={(rodaLargura) => set('materiais', { rodaLargura })} erro={err('rodaLargura')} />
                  <Campo rotulo={tr('Ø do eixo da roda', 'Wheel axle Ø')} unidade="mm" passo={1} valor={r.materiais.eixoD} onChange={(eixoD) => set('materiais', { eixoD })} erro={err('eixoD')} ajuda={tr('Diâmetro do furo do rolamento. Vira o parafuso-eixo.', 'Bearing bore diameter. Becomes the axle bolt.')} />
                  <Campo rotulo={tr('Ø do parafuso de trava', 'Locking bolt Ø')} unidade="mm" passo={1} valor={r.materiais.parafusoD} onChange={(parafusoD) => set('materiais', { parafusoD })} erro={err('parafusoD')} ajuda={tr('Prende o tubo na conexão. 0 = sem furo.', 'Locks the tube in the connector. 0 = no hole.')} />
                </div>
              </>
            )}

            {r.passo === 4 && (
              <>
                <dl className="resumo">
                  <dt>{tr('Cão', 'Dog')}</dt>
                  <dd>
                    {r.cao.nome} · {raca ? nomeRaca(raca) : tr('raça não informada', 'breed not given')} · {r.cao.pesoKg} kg
                  </dd>
                  <dt>{tr('Tipo', 'Type')}</dt>
                  <dd>
                    {LETRA_TIPO[r.tipo]} · {TIPOS.find((t) => t.id === r.tipo)!.nome}
                  </dd>
                  {medidasTipo.map((m) => (
                    <Fragmento key={m.k} dt={m.rotulo} dd={`${r.medidas[m.k]} cm`} />
                  ))}
                  <dt>{tr('Tubo', 'Tube')}</dt>
                  <dd>
                    {r.materiais.tubo === 'aluminio' ? tr('Alumínio', 'Aluminum') : 'PVC'} Ø {r.materiais.tuboD} × {r.materiais.tuboParede} mm
                  </dd>
                  <dt>{tr('Roda', 'Wheel')}</dt>
                  <dd>
                    Ø {r.materiais.rodaD} × {r.materiais.rodaLargura} mm, {tr('eixo', 'axle')} {r.materiais.eixoD} mm
                  </dd>
                </dl>
                <div className="acoes" style={{ marginBottom: 20 }}>
                  <button type="button" className="btn btn-pequeno" onClick={() => setR({ ...r, passo: 2 })}>
                    {tr('Corrigir medidas', 'Fix measurements')}
                  </button>
                  <button type="button" className="btn btn-pequeno" onClick={() => setR({ ...r, passo: 3 })}>
                    {tr('Corrigir materiais', 'Fix materials')}
                  </button>
                </div>
                <div className="vet campo" data-erro={!!err('avisoVet')}>
                  <Stethoscope className="ico" aria-hidden="true" />
                  <div>
                    <label style={{ display: 'flex', gap: 12, alignItems: 'flex-start', fontWeight: 400 }}>
                      <input type="checkbox" checked={r.avisoVet} onChange={(e) => setR({ ...r, avisoVet: e.target.checked })} style={{ width: 22, height: 22, marginTop: 2, accentColor: 'var(--azul)', flex: 'none' }} aria-invalid={!!err('avisoVet')} aria-describedby={err('avisoVet') ? 'vet-erro' : undefined} />
                      <span>
                        <strong>{tr('Vou avaliar o uso com um veterinário ou fisioterapeuta.', 'I will check its use with a vet or physiotherapist.')}</strong>{' '}
                        {tr(
                          'Entendo que é um projeto caseiro, sem teste de laboratório, e que a cadeira deve ser usada com supervisão.',
                          'I understand this is a home-made design, not lab tested, and that the cart must be used under supervision.',
                        )}
                      </span>
                    </label>
                    {err('avisoVet') && <p className="erro" id="vet-erro" style={{ marginTop: 8 }}>{err('avisoVet')}</p>}
                  </div>
                </div>
              </>
            )}
          </section>

          <div className="barra-passos">
            <button type="button" className="btn" disabled={r.passo === 0} onClick={() => { setMostrarErros(false); setR({ ...r, passo: r.passo - 1 }) }}>
              <ArrowLeft className="ico" aria-hidden="true" />
              {tr('Voltar', 'Back')}
            </button>
            <button type="submit" className="btn btn-primario">
              {r.passo === PASSOS.length - 1 ? tr('Gerar projeto', 'Generate design') : tr('Avançar', 'Next')}
              <ArrowRight className="ico" aria-hidden="true" />
            </button>
          </div>
        </form>
      </div>
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
