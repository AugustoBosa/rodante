// Cão em silhueta com a "fita métrica" amarela marcando onde medir.
export type QualMedida = 'alturaPerna' | 'comprimento' | 'largura' | 'alturaCostas'

const CHAO = 184

function Fita({ x1, y1, x2, y2, rotulo, lado = 1 }: { x1: number; y1: number; x2: number; y2: number; rotulo: string; lado?: 1 | -1 }) {
  const vertical = x1 === x2
  const comp = vertical ? y2 - y1 : x2 - x1
  const ticks = []
  for (let t = 3; t < comp; t += 6) {
    const grande = Math.round(t / 6) % 5 === 0
    const l = grande ? 6 : 3
    ticks.push(
      vertical ? (
        <line key={t} x1={x1 - 4.5} x2={x1 - 4.5 + l} y1={y1 + t} y2={y1 + t} />
      ) : (
        <line key={t} y1={y1 - 4.5} y2={y1 - 4.5 + l} x1={x1 + t} x2={x1 + t} />
      ),
    )
  }
  return (
    <g>
      {vertical ? <rect x={x1 - 4.5} y={y1} width={9} height={comp} fill="var(--fita)" /> : <rect x={x1} y={y1 - 4.5} width={comp} height={9} fill="var(--fita)" />}
      <g stroke="#1f2a2e" strokeWidth={0.8} opacity={0.7}>{ticks}</g>
      <g stroke="#1f2a2e" strokeWidth={2.5}>
        {vertical ? (
          <>
            <line x1={x1 - 8} x2={x1 + 8} y1={y1} y2={y1} />
            <line x1={x1 - 8} x2={x1 + 8} y1={y2} y2={y2} />
          </>
        ) : (
          <>
            <line y1={y1 - 8} y2={y1 + 8} x1={x1} x2={x1} />
            <line y1={y1 - 8} y2={y1 + 8} x1={x2} x2={x2} />
          </>
        )}
      </g>
      <text
        x={vertical ? x1 + lado * 12 : (x1 + x2) / 2}
        y={vertical ? (y1 + y2) / 2 : y1 - 12}
        textAnchor={vertical ? (lado === 1 ? 'start' : 'end') : 'middle'}
        dominantBaseline="middle"
        fontFamily="var(--mono)"
        fontSize={11}
        fontWeight={600}
        fill="var(--tinta)"
      >
        {rotulo}
      </text>
    </g>
  )
}

const tracejado = { stroke: 'var(--tinta)', strokeWidth: 1, strokeDasharray: '3 3', opacity: 0.6 }

function Lado() {
  return (
    <g fill="var(--tinta-2)" opacity={0.32}>
      <rect x={92} y={72} width={150} height={56} rx={28} />
      <ellipse cx={118} cy={104} rx={34} ry={32} />
      <polygon points="100,86 66,50 90,36 128,78" />
      <ellipse cx={72} cy={50} rx={24} ry={20} />
      <ellipse cx={50} cy={58} rx={16} ry={10} />
      <rect x={104} y={118} width={13} height={66} rx={6} />
      <rect x={126} y={118} width={12} height={66} rx={6} opacity={0.6} />
      <ellipse cx={222} cy={112} rx={28} ry={30} />
      <rect x={218} y={128} width={13} height={56} rx={6} />
      <rect x={200} y={128} width={12} height={56} rx={6} opacity={0.6} />
      <path d="M240 88 q30 -10 34 -42" fill="none" stroke="var(--tinta-2)" strokeWidth={8} strokeLinecap="round" />
    </g>
  )
}

function Cima() {
  return (
    <g fill="var(--tinta-2)" opacity={0.32}>
      <ellipse cx={170} cy={100} rx={80} ry={30} />
      <ellipse cx={72} cy={100} rx={22} ry={17} />
      <ellipse cx={52} cy={100} rx={12} ry={9} />
      <ellipse cx={82} cy={83} rx={8} ry={5} />
      <ellipse cx={82} cy={117} rx={8} ry={5} />
      <path d="M248 100 q25 0 42 -12" fill="none" stroke="var(--tinta-2)" strokeWidth={8} strokeLinecap="round" />
    </g>
  )
}

const DESCRICAO: Record<QualMedida | 'todas', string> = {
  alturaPerna: 'Cão de lado. Fita vertical da prega onde a coxa encontra o corpo até o chão, na pata traseira.',
  comprimento: 'Cão de lado. Fita horizontal do meio do ombro ao meio do quadril.',
  largura: 'Cão visto de cima. Fita atravessando o ponto mais largo do corpo.',
  alturaCostas: 'Cão de lado. Fita vertical da linha das costas até o chão.',
  todas: 'Cão de lado com três fitas métricas: altura da perna traseira, comprimento do ombro ao quadril e altura das costas.',
}

export function Ilustracao({ medida }: { medida: QualMedida | 'todas' }) {
  const ver = (m: QualMedida) => medida === m || medida === 'todas'
  return (
    <svg viewBox="0 0 320 200" role="img" aria-label={DESCRICAO[medida]}>
      <line x1={10} x2={310} y1={CHAO} y2={CHAO} stroke="var(--tinta)" strokeWidth={1.5} />
      {medida === 'largura' ? (
        <>
          <Cima />
          <Fita x1={190} y1={70} x2={190} y2={130} rotulo="largura" />
        </>
      ) : (
        <>
          <Lado />
          {ver('alturaPerna') && (
            <>
              <line x1={234} x2={268} y1={100} y2={100} {...tracejado} />
              <Fita x1={268} y1={100} x2={268} y2={CHAO} rotulo="perna" />
            </>
          )}
          {ver('comprimento') && (
            <>
              <line x1={112} x2={112} y1={56} y2={74} {...tracejado} />
              <line x1={222} x2={222} y1={56} y2={84} {...tracejado} />
              <Fita x1={112} y1={56} x2={222} y2={56} rotulo="ombro → quadril" />
            </>
          )}
          {ver('alturaCostas') && <Fita x1={170} y1={72} x2={170} y2={CHAO} rotulo="costas" lado={-1} />}
        </>
      )}
    </svg>
  )
}
