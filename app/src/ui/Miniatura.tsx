import { useMemo } from 'react'
import { computeDesign } from '../model/design'
import type { Projeto, V3 } from '../model/types'
import { tr } from '../i18n'

// Projeção isométrica do quadro em SVG: sem WebGL, leve para listas com muitos projetos.
const C = Math.cos(Math.PI / 6)
const S = Math.sin(Math.PI / 6)
const iso = ([x, y, z]: V3): [number, number] => [(x + y) * C, (x - y) * S - z]

export function Miniatura({ p }: { p: Projeto }) {
  const desenho = useMemo(() => {
    const d = computeDesign(p)
    const rodas = d.rodas.map((r) =>
      Array.from({ length: 24 }, (_, i) => {
        const t = (i / 24) * 2 * Math.PI
        return iso([r.pos[0] + (r.d / 2) * Math.cos(t), r.pos[1], r.pos[2] + (r.d / 2) * Math.sin(t)])
      }),
    )
    const tubos = d.tubos.map((t) => [iso(t.a), iso(t.b)])
    const juntas = d.juntas.map((j) => iso(j.pos))
    const todos = [...rodas.flat(), ...tubos.flat(), ...juntas, iso([0, 0, 0])]
    const xs = todos.map((q) => q[0])
    const ys = todos.map((q) => q[1])
    const m = 20
    const vb = [Math.min(...xs) - m, Math.min(...ys) - m, Math.max(...xs) - Math.min(...xs) + 2 * m, Math.max(...ys) - Math.min(...ys) + 2 * m]
    return { rodas, tubos, juntas, vb, esp: p.materiais.tuboD }
  }, [p])

  const { rodas, tubos, juntas, vb, esp } = desenho
  return (
    <svg viewBox={vb.join(' ')} className="miniatura" role="img" aria-label={tr(`Desenho do quadro de ${p.cao.nome}`, `Frame drawing for ${p.cao.nome}`)}>
      {rodas.map((pts, i) => (
        <polygon key={i} className="roda" points={pts.map((q) => q.join(',')).join(' ')} strokeWidth={esp * 0.35} />
      ))}
      {/* tubo de manual: traço preto largo + miolo de papel por cima */}
      {tubos.map(([a, b], i) => (
        <line key={`f${i}`} className="tubo-fora" x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} strokeWidth={esp * 1.5} strokeLinecap="round" />
      ))}
      {tubos.map(([a, b], i) => (
        <line key={`d${i}`} className="tubo-dentro" x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} strokeWidth={esp * 0.75} strokeLinecap="round" />
      ))}
      {juntas.map((q, i) => (
        <circle key={i} className="junta" cx={q[0]} cy={q[1]} r={esp * 0.85} />
      ))}
    </svg>
  )
}
