// Regras do quadro (traseira, dianteira, quatro rodas). TS puro, sem React/Replicad. Unidades: mm.
// Eixos do mundo: X para trás (0 = ponta dianteira do trilho), Y lateral, Z para cima.
import type { Alerta, Design, Junta, Medidas, PecaLista, Projeto, SpecPeca, TipoCadeira, Tubo, V3 } from './types'
import {
  DIFERENCA_PERNAS_MAX,
  FITA_L,
  FOLGA_LATERAL_MIN_CM,
  LIMITE_PESO_KG,
  LIMITES,
  PVC_PESO_MAX_KG,
  SEGMENTO_MIN_MM,
  tuboMinimo,
} from './defaults'
import { RACAS, nomeRaca } from '../data/racas'
import { tr } from '../i18n'

const BATENTE = 2 // mm de material entre o fim do tubo e o miolo da conexão

export const raioInterno = (s: { tuboD: number; folga: number }) => (s.tuboD + s.folga) / 2
export const raioExterno = (s: { tuboD: number; folga: number; parede: number }) => raioInterno(s) + s.parede

/** Menor ângulo entre os encaixes de uma conexão de tubo. */
export function anguloMinimo(s: SpecPeca): number {
  if (s.tipo === 'cotovelo') return clamp(s.angulo, 30, 180)
  if (s.tipo === 'te') return Math.min(clamp(s.angulo, 30, 150), 180 - clamp(s.angulo, 30, 150))
  return 180
}

/** Distância do centro da conexão até onde o tubo encosta. */
export function recuo(s: SpecPeca): number {
  if (s.tipo === 'ponteira' || s.tipo === 'clipSela') return 0
  if (s.tipo === 'suporteEixo') return (s.eixoD + s.folga) / 2 + s.parede + BATENTE
  const meio = (anguloMinimo(s) / 2) * (Math.PI / 180)
  return (meio >= Math.PI / 2 - 1e-9 ? 0 : raioInterno(s) / Math.tan(meio)) + BATENTE
}

/** Comprimento do clip ao longo do tubo: fita + 1 mm de folga + 4 mm de cada lado. */
export const comprimentoClip = (s: { fitaL: number }) => s.fitaL + 9

export const NOMES_PECA: Record<SpecPeca['tipo'], string> = {
  cotovelo: tr('Cotovelo', 'Elbow'),
  te: tr('Tê', 'Tee'),
  suporteEixo: tr('Suporte do eixo', 'Axle mount'),
  ponteira: tr('Ponteira com passador', 'End cap with strap slot'),
  clipSela: tr('Clip da sela', 'Saddle clip'),
}

export function nomePeca(s: SpecPeca): string {
  return 'angulo' in s ? `${NOMES_PECA[s.tipo]} ${s.angulo}°` : NOMES_PECA[s.tipo]
}

export function validarCampo(campo: keyof typeof LIMITES, v: number): string | null {
  const [min, max] = LIMITES[campo]
  if (!Number.isFinite(v) || (v === 0 && min > 0)) return tr('Preencha este campo', 'Fill in this field')
  if (v < min || v > max) return tr(`Entre ${min} e ${max}`, `Between ${min} and ${max}`)
  return null
}

export const TIPOS: { id: TipoCadeira; nome: string; desc: string }[] = [
  {
    id: 'traseira',
    nome: tr('Traseira', 'Rear'),
    desc: tr(
      'Para fraqueza ou paralisia só nas patas de trás, com a frente forte. Casos comuns: hérnia de disco (IVDD) e mielopatia degenerativa.',
      'For weakness or paralysis in the hind legs only, with strong front legs. Common causes: disc disease (IVDD) and degenerative myelopathy.',
    ),
  },
  { id: 'dianteira', nome: tr('Dianteira', 'Front'), desc: tr('Para fraqueza nas patas da frente, com a traseira sustentando o corpo.', 'For weak front legs, with the hind legs bearing the body.') },
  {
    id: 'quatro',
    nome: tr('Quatro rodas', 'Four wheels'),
    desc: tr(
      'Para fraqueza nas quatro patas ou falta de equilíbrio. Em cão com fraqueza só atrás, pesa e cansa mais.',
      'For weakness in all four legs or poor balance. On a dog that is weak only behind, it is heavier and more tiring.',
    ),
  },
]

const PATAS: Record<TipoCadeira, string> = {
  traseira: tr('as patas traseiras', 'the hind paws'),
  dianteira: tr('as patas dianteiras', 'the front paws'),
  quatro: tr('as patas', 'the paws'),
}

/** Medidas que cada tipo de cadeira usa (as outras ficam fora da validação). */
export function medidasDoTipo(tipo: TipoCadeira): (keyof Medidas)[] {
  const pernas: (keyof Medidas)[] =
    tipo === 'traseira' ? ['alturaPernaCm'] : tipo === 'dianteira' ? ['alturaPernaDianteiraCm'] : ['alturaPernaDianteiraCm', 'alturaPernaCm']
  return [...pernas, 'comprimentoCm', 'larguraCm', 'alturaCostasCm']
}

export function computeDesign(p: Projeto): Design {
  const { medidas: md, materiais: m, ajustes: aj, cao } = p
  const alertas: Alerta[] = []
  const imp = { tuboD: m.tuboD, folga: aj.folgaImpressao, parede: aj.paredeConexao, profundidade: aj.profundidade, parafusoD: m.parafusoD }
  const te90: SpecPeca = { tipo: 'te', angulo: 90, ...imp }
  const te45: SpecPeca = { tipo: 'te', angulo: 45, ...imp }
  const cot: SpecPeca = { tipo: 'cotovelo', angulo: 90, ...imp }
  const sup: SpecPeca = { tipo: 'suporteEixo', eixoD: m.eixoD, ...imp }
  const pont: SpecPeca = { tipo: 'ponteira', ...imp }
  const clip: SpecPeca = { tipo: 'clipSela', fitaL: FITA_L, ...imp }
  const ro = raioExterno(imp)

  // Altura do trilho: perna do lado das rodas. Quatro rodas: nivela pela perna mais curta.
  const pernaT = md.alturaPernaCm
  const pernaD = md.alturaPernaDianteiraCm
  const pernaBase = p.tipo === 'traseira' ? pernaT : p.tipo === 'dianteira' ? pernaD : Math.min(pernaT, pernaD)
  const H = (pernaBase - aj.ajusteAlturaCm) * 10 // centro do trilho
  const R = m.rodaD / 2 // centro do eixo
  const L = md.comprimentoCm * 10 // ombro → quadril
  const ext = aj.extensaoTraseiraMm // trilho além do eixo até a barra
  const larguraInterna = (md.larguraCm + 2 * aj.folgaLateralCm) * 10
  const yC = larguraInterna / 2 + ro
  const yRoda = yC + ro + 5 + m.rodaLargura / 2

  // X para trás. Cada eixo tem diagonal a 45° apontando para dentro do quadro (s = sentido em X).
  // traseira: ponteira na frente (x=0), eixo sob o quadril, barra atrás.
  // dianteira: barra na frente, eixo sob o ombro, ponteira atrás (presa no arnês do quadril).
  // quatro: barra nas duas pontas, um eixo sob o ombro e outro sob o quadril.
  const eixos: { x: number; s: 1 | -1; nome: string }[] =
    p.tipo === 'traseira'
      ? [{ x: L, s: -1, nome: '' }]
      : p.tipo === 'dianteira'
        ? [{ x: ext, s: 1, nome: '' }]
        : [
            { x: ext, s: 1, nome: tr(' dianteira', ' (front)') },
            { x: ext + L, s: -1, nome: tr(' traseira', ' (rear)') },
          ]
  const xFim = p.tipo === 'traseira' ? L + ext : p.tipo === 'dianteira' ? ext + L : 2 * ext + L
  const pontaFrente = p.tipo === 'traseira' ? pont : cot
  const pontaTras = p.tipo === 'dianteira' ? pont : cot
  const livre = p.tipo === 'quatro' ? L / 2 : L // espaço entre o eixo e a outra ponta
  const span = Math.max(0, Math.min(livre, H - R) * 0.5) // diagonal ocupa metade do espaço livre
  const z1 = H - span

  const tubos: Tubo[] = []
  const juntas: Junta[] = []
  const tubo = (nome: string, A: V3, B: V3, sA: SpecPeca, sB: SpecPeca) => {
    const d = dist(A, B)
    const u = scale(sub(B, A), 1 / (d || 1))
    const rA = recuo(sA)
    const rB = recuo(sB)
    tubos.push({ nome, a: add(A, scale(u, rA)), b: sub(B, scale(u, rB)), comprimento: round(d - rA - rB) })
  }
  /** Conexão na ponta do trilho: ponteira (tubo sai para dentro) ou cotovelo virando para o outro lado. */
  const juntaPonta = (spec: SpecPeca, x: number, y: number, dentro: 1 | -1): Junta =>
    spec.tipo === 'ponteira'
      ? { spec, pos: [x, y, H], ex: [0, 0, 1], ey: [0, dentro, 0] }
      : { spec, pos: [x, y, H], ex: [dentro, 0, 0], ey: [0, Math.sign(-y), 0] }

  for (const [lado, y] of [[tr('esq', 'left'), -yC], [tr('dir', 'right'), yC]] as const) {
    // paradas ao longo do trilho, em ordem de X
    const paradas: { x: number; spec: SpecPeca }[] = [
      { x: 0, spec: pontaFrente },
      ...eixos.flatMap((e) => [
        { x: e.x, spec: te90 },
        { x: e.x + e.s * span, spec: te45 },
      ]),
      { x: xFim, spec: pontaTras },
    ].sort((a, b) => a.x - b.x)
    paradas.forEach((pa, i) => {
      if (i > 0) tubo(`${tr('Trilho', 'Rail')} ${i} (${lado})`, [paradas[i - 1].x, y, H], [pa.x, y, H], paradas[i - 1].spec, pa.spec)
    })
    juntas.push(juntaPonta(pontaFrente, 0, y, 1), juntaPonta(pontaTras, xFim, y, -1))
    for (const e of eixos) {
      const E: V3 = [e.x, y, H]
      const D: V3 = [e.x + e.s * span, y, H]
      const P: V3 = [e.x, y, z1]
      const S: V3 = [e.x, y, R]
      tubo(`${tr('Perna superior', 'Upper leg')}${e.nome} (${lado})`, E, P, te90, te45)
      tubo(`${tr('Perna inferior', 'Lower leg')}${e.nome} (${lado})`, P, S, te45, sup)
      tubo(`${tr('Diagonal', 'Brace')}${e.nome} (${lado})`, D, P, te45, te45)
      juntas.push(
        { spec: te45, pos: D, ex: [-e.s, 0, 0], ey: [0, 0, -1] },
        { spec: te90, pos: E, ex: [1, 0, 0], ey: [0, 0, -1] },
        { spec: te45, pos: P, ex: [0, 0, 1], ey: [e.s, 0, 0] },
        { spec: sup, pos: S, ex: [1, 0, 0], ey: [0, 1, 0] },
      )
      // clips da sela: entre o eixo e a diagonal, e entre o eixo e a ponta (origem na borda do clip, Z local = +X)
      const ponta = e.s === -1 ? xFim : 0
      for (const x of [e.x + (e.s * span) / 2, (e.x + ponta) / 2])
        juntas.push({ spec: clip, pos: [x - comprimentoClip({ fitaL: FITA_L }) / 2, y, H], ex: [0, 0, 1], ey: [0, -1, 0] })
    }
  }
  if (pontaFrente.tipo === 'cotovelo') tubo(tr('Barra dianteira', 'Front crossbar'), [0, -yC, H], [0, yC, H], cot, cot)
  if (pontaTras.tipo === 'cotovelo') tubo(tr('Barra traseira', 'Rear crossbar'), [xFim, -yC, H], [xFim, yC, H], cot, cot)

  const curtos = tubos.filter((t) => t.comprimento < SEGMENTO_MIN_MM)
  if (H - R <= 0 || curtos.length)
    alertas.push({
      nivel: 'erro',
      texto: ((lista) =>
        tr(
          `Não cabe: ${lista || 'perna'} fica curto demais. Use roda menor (hoje Ø ${m.rodaD} mm) ou confira a altura da perna.`,
          `Does not fit: ${lista || 'leg'} is too short. Use a smaller wheel (now Ø ${m.rodaD} mm) or check the leg height.`,
        ))([...new Set(curtos.map((t) => t.nome.replace(/ \([^)]*\)$/, '').toLowerCase()))].join(', ')),
    })
  if (cao.pesoKg > LIMITE_PESO_KG)
    alertas.push({ nivel: 'erro', texto: tr(`Peso acima de ${LIMITE_PESO_KG} kg: este projeto caseiro não é indicado. Procure um fabricante profissional.`, `Weight above ${LIMITE_PESO_KG} kg: this home-made design is not suitable. Look for a professional manufacturer.`) })
  const tMin = tuboMinimo(cao.pesoKg)
  if (m.tubo === 'aluminio' && m.tuboD < tMin)
    alertas.push({ nivel: 'aviso', texto: tr(`Tubo fino para ${cao.pesoKg} kg: use Ø ≥ ${tMin} mm (estimativa sem teste de carga).`, `Tube too thin for ${cao.pesoKg} kg: use Ø ≥ ${tMin} mm (estimate, no load test).`) })
  if (m.tubo === 'pvc' && cao.pesoKg > PVC_PESO_MAX_KG)
    alertas.push({ nivel: 'aviso', texto: tr(`PVC é indicado só até ~${PVC_PESO_MAX_KG} kg. Para ${cao.pesoKg} kg prefira alumínio.`, `PVC is only suitable up to ~${PVC_PESO_MAX_KG} kg. For ${cao.pesoKg} kg use aluminum.`) })
  if (aj.folgaLateralCm < FOLGA_LATERAL_MIN_CM)
    alertas.push({ nivel: 'aviso', texto: tr(`Folga lateral de ${aj.folgaLateralCm} cm pode raspar no corpo. Recomendado ≥ ${FOLGA_LATERAL_MIN_CM} cm.`, `Side clearance of ${aj.folgaLateralCm} cm may rub the body. Recommended ≥ ${FOLGA_LATERAL_MIN_CM} cm.`) })
  if (md.alturaCostasCm > 0 && H + ro > md.alturaCostasCm * 10)
    alertas.push({ nivel: 'aviso', texto: tr('O trilho fica acima da linha das costas. Confira a altura da perna e a altura das costas.', 'The rail sits above the back line. Check the leg height and the back height.') })
  if (p.tipo === 'quatro' && Math.abs(pernaT - pernaD) > DIFERENCA_PERNAS_MAX * Math.max(pernaT, pernaD))
    alertas.push({ nivel: 'aviso', texto: tr(`Pernas da frente (${pernaD} cm) e de trás (${pernaT} cm) muito diferentes: o quadro fica na altura da mais curta. Confira as medidas.`, `Front legs (${pernaD} cm) and hind legs (${pernaT} cm) differ a lot: the frame follows the shorter one. Check the measurements.`) })
  if (p.tipo === 'dianteira')
    alertas.push({ nivel: 'aviso', texto: tr('Cadeira dianteira só funciona se as patas traseiras sustentam o corpo. Confirme com o veterinário.', 'A front cart only works if the hind legs bear the body. Confirm with the vet.') })
  if (p.tipo === 'quatro')
    alertas.push({ nivel: 'aviso', texto: tr('Cadeira de 4 rodas pesa mais e cansa mais. Use só se o veterinário indicar fraqueza nas quatro patas.', 'A 4-wheel cart is heavier and more tiring. Use it only if the vet finds weakness in all four legs.') })
  const raca = RACAS.find((r) => r.id === cao.raca)
  if (raca?.pesoKg && (cao.pesoKg < raca.pesoKg[0] * 0.7 || cao.pesoKg > raca.pesoKg[1] * 1.3))
    alertas.push({ nivel: 'aviso', texto: tr(`Peso fora do comum para ${nomeRaca(raca)} (${raca.pesoKg[0]}–${raca.pesoKg[1]} kg). Confira.`, `Unusual weight for ${nomeRaca(raca)} (${raca.pesoKg[0]}–${raca.pesoKg[1]} kg). Please check.`) })
  if (raca?.alturaCm && (md.alturaCostasCm < raca.alturaCm[0] * 0.75 || md.alturaCostasCm > raca.alturaCm[1] * 1.25))
    alertas.push({ nivel: 'aviso', texto: tr(`Altura das costas fora do comum para ${nomeRaca(raca)} (${raca.alturaCm[0]}–${raca.alturaCm[1]} cm). Confira a medida.`, `Unusual back height for ${nomeRaca(raca)} (${raca.alturaCm[0]}–${raca.alturaCm[1]} cm). Check the measurement.`) })
  alertas.push(
    { nivel: 'info', texto: tr('Avaliação de veterinário ou fisioterapeuta é obrigatória antes do uso.', 'A vet or physiotherapist assessment is required before use.') },
    { nivel: 'info', texto: tr(`Comece com o quadro mais baixo: ${PATAS[p.tipo]} devem tocar o chão. Ajuste aos poucos.`, `Start with the frame low: ${PATAS[p.tipo]} must touch the ground. Adjust gradually.`) },
    { nivel: 'info', texto: tr('Use porca autotravante (ou trava química) no eixo e nos parafusos. Inspecione toda semana.', 'Use lock nuts (or threadlocker) on the axle and bolts. Inspect every week.') },
    { nivel: 'info', texto: tr('Primeiros usos curtos (5–10 min) e sempre supervisionados.', 'Keep first sessions short (5–10 min) and always supervised.') },
  )

  const mapa = new Map<string, PecaLista>()
  for (const j of juntas) {
    const chave = JSON.stringify(j.spec)
    const atual = mapa.get(chave)
    if (atual) atual.qtd++
    else mapa.set(chave, { chave, nome: nomePeca(j.spec), spec: j.spec, qtd: 1 })
  }

  return {
    tubos,
    juntas,
    rodas: eixos.flatMap((e) => [-1, 1].map((s) => ({ pos: [e.x, s * yRoda, R] as V3, d: m.rodaD, largura: m.rodaLargura }))),
    pecas: [...mapa.values()],
    alertas,
    cotas: {
      alturaTrilho: round(H),
      comprimentoTrilho: round(xFim),
      larguraInterna: round(larguraInterna),
      larguraTotal: round(2 * yRoda + m.rodaLargura),
      alturaEixo: round(R),
    },
  }
}

const clamp = (v: number, a: number, b: number) => Math.min(Math.max(v, a), b)
const round = (v: number) => Math.round(v)
const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]]
const scale = (a: V3, k: number): V3 => [a[0] * k, a[1] * k, a[2] * k]
const dist = (a: V3, b: V3) => Math.hypot(...sub(a, b))
