import { useId } from 'react'
import { tr } from '../i18n'

// Reserva 2D do palco de medidas (sem WebGL, aparelho fraco, impressão, enquanto o 3D carrega).
// Silhueta CC0 de Margot Michaud (PhyloPic), espelhada para a cabeça ficar à esquerda como no 3D.
export type QualMedida = 'alturaPerna' | 'alturaPernaDianteira' | 'comprimento' | 'largura' | 'alturaCostas'

const SILHUETA = `${import.meta.env.BASE_URL}modelos/cao-lado.svg`
const CHAO = 527

const DESCRICAO: Record<QualMedida | 'todas', string> = {
  alturaPerna: tr('Cão de lado. Fita vertical da prega onde a coxa encontra o corpo até o chão, na pata traseira.', 'Dog from the side. Vertical tape from the crease where the thigh meets the body down to the ground, on the hind leg.'),
  alturaPernaDianteira: tr('Cão de lado. Fita vertical da axila até o chão, na pata dianteira.', 'Dog from the side. Vertical tape from the armpit down to the ground, on the front leg.'),
  comprimento: tr('Cão de lado. Fita horizontal do meio do ombro ao meio do quadril.', 'Dog from the side. Horizontal tape from mid shoulder to mid hip.'),
  largura: tr('Cão visto de cima. Fita atravessando o ponto mais largo do corpo.', 'Dog seen from above. Tape across the widest point of the body.'),
  alturaCostas: tr('Cão de lado. Fita vertical da linha das costas até o chão.', 'Dog from the side. Vertical tape from the back line down to the ground.'),
  todas: tr('Cão de lado com as fitas métricas de perna, comprimento e costas.', 'Dog from the side with the leg, length and back tape measures.'),
}

/** Fita reta com pontas e marcas, em coordenadas do desenho. */
function Fita({ x1, y1, x2, y2, rotulo }: { x1: number; y1: number; x2: number; y2: number; rotulo: string }) {
  const vert = x1 === x2
  const comp = Math.abs(vert ? y2 - y1 : x2 - x1)
  const marcas = []
  for (let t = 12; t < comp; t += 12) marcas.push(t)
  const [ox, oy] = [Math.min(x1, x2), Math.min(y1, y2)]
  return (
    <g>
      <rect x={vert ? x1 - 7 : ox} y={vert ? oy : y1 - 7} width={vert ? 14 : comp} height={vert ? comp : 14} fill="var(--azul)" />
      <g stroke="var(--papel)" strokeWidth={1.6}>
        {marcas.map((t) => (vert ? <line key={t} x1={x1 - 7} x2={x1 - (t % 60 ? 2 : -1)} y1={oy + t} y2={oy + t} /> : <line key={t} y1={y1 - 7} y2={y1 - (t % 60 ? 2 : -1)} x1={ox + t} x2={ox + t} />))}
      </g>
      <g stroke="var(--tinta)" strokeWidth={4}>
        {vert ? (
          <>
            <line x1={x1 - 16} x2={x1 + 16} y1={y1} y2={y1} />
            <line x1={x1 - 16} x2={x1 + 16} y1={y2} y2={y2} />
          </>
        ) : (
          <>
            <line y1={y1 - 16} y2={y1 + 16} x1={x1} x2={x1} />
            <line y1={y1 - 16} y2={y1 + 16} x1={x2} x2={x2} />
          </>
        )}
      </g>
      <text x={vert ? x1 + 20 : (x1 + x2) / 2} y={vert ? (y1 + y2) / 2 : y1 - 22} textAnchor={vert ? 'start' : 'middle'} dominantBaseline="middle" fontSize={26} fontWeight={800} fill="var(--azul)">
        {rotulo}
      </text>
    </g>
  )
}

const guia = { stroke: 'var(--tinta)', strokeWidth: 2, strokeDasharray: '6 6' }

export function Ilustracao({ medida }: { medida: QualMedida | 'todas' }) {
  const mascara = useId()
  const ver =(m: QualMedida) => medida === m || medida === 'todas'
  if (medida === 'largura')
    return (
      <svg className="ilustracao" viewBox="0 0 640 420" role="img" aria-label={DESCRICAO.largura}>
        <g fill="var(--cinza-1)" stroke="var(--tinta)" strokeWidth={3}>
          <path d="M520 210 q60 -10 90 -60" fill="none" strokeWidth={14} strokeLinecap="round" />
          <ellipse cx={340} cy={210} rx={200} ry={78} />
          <ellipse cx={130} cy={210} rx={62} ry={50} />
          <ellipse cx={72} cy={210} rx={34} ry={22} />
        </g>
        <Fita x1={360} y1={120} x2={360} y2={300} rotulo={tr('largura', 'width')} />
        <text x={320} y={392} textAnchor="middle" fontSize={22} fill="var(--tinta-2)">{tr('visto de cima', 'seen from above')}</text>
      </svg>
    )
  return (
    <svg className="ilustracao" viewBox="-20 -10 740 570" role="img" aria-label={DESCRICAO[medida]}>
      <defs>
        <mask id={mascara} style={{ maskType: 'alpha' }}>
          <g transform="translate(600 0) scale(-1 1)">
            <image href={SILHUETA} width={600} height={526.6} />
          </g>
        </mask>
      </defs>
      <rect x={0} y={0} width={600} height={527} fill="var(--cinza-2)" mask={`url(#${CSS.escape(mascara)})`} />
      <line x1={-20} x2={720} y1={CHAO} y2={CHAO} stroke="var(--tinta)" strokeWidth={3} />
      {ver('alturaPernaDianteira') && medida !== 'todas' && (
        <>
          <line x1={110} x2={205} y1={325} y2={325} {...guia} />
          <Fita x1={110} y1={325} x2={110} y2={CHAO} rotulo={tr('perna', 'leg')} />
        </>
      )}
      {ver('alturaPerna') && (
        <>
          <line x1={470} x2={600} y1={280} y2={280} {...guia} />
          <Fita x1={600} y1={280} x2={600} y2={CHAO} rotulo={tr('perna', 'leg')} />
        </>
      )}
      {ver('comprimento') && (
        <>
          <line x1={175} x2={175} y1={95} y2={175} {...guia} />
          <line x1={490} x2={490} y1={95} y2={160} {...guia} />
          <Fita x1={175} y1={95} x2={490} y2={95} rotulo={tr('ombro → quadril', 'shoulder → hip')} />
        </>
      )}
      {ver('alturaCostas') && <Fita x1={330} y1={155} x2={330} y2={CHAO} rotulo={tr('costas', 'back')} />}
    </svg>
  )
}
