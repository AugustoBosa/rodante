import { useMemo, type ReactNode } from 'react'
import { computeDesign } from '../model/design'
import type { Projeto, V3 } from '../model/types'
import { tr } from '../i18n'
import { corPeca } from './coresPecas'

// Projeção isométrica do quadro em SVG (sem WebGL, leve para listas), no mesmo visual do 3D:
// tubo com contorno, juntas na cor de cada peça, rodas cinza com cubo, desenhados de trás para a frente.
const C = Math.cos(Math.PI / 6)
const S = Math.sin(Math.PI / 6)
const iso = ([x, y, z]: V3): [number, number] => [(x + y) * C, (x - y) * S - z]
const perto = ([x, y]: V3) => x - y // maior = mais perto de quem olha
const pts = (q: [number, number][]) => q.map((p) => p.join(',')).join(' ')

export function Miniatura({ p }: { p: Projeto }) {
  const { vb, itens } = useMemo(() => {
    const d = computeDesign(p)
    const circulo = (c: V3, r: number) =>
      Array.from({ length: 28 }, (_, i) => {
        const t = (i / 28) * 2 * Math.PI
        return iso([c[0] + r * Math.cos(t), c[1], c[2] + r * Math.sin(t)])
      })
    const todos = [...d.rodas.flatMap((r) => circulo(r.pos, r.d / 2)), ...d.tubos.flatMap((t) => [iso(t.a), iso(t.b)]), iso([0, 0, 0])]
    const xs = todos.map((q) => q[0])
    const ys = todos.map((q) => q[1])
    const larg = Math.max(...xs) - Math.min(...xs)
    const s = Math.max(p.materiais.tuboD, larg / 42) // espessura legível em qualquer tamanho
    const m = s * 2
    const vb = [Math.min(...xs) - m, Math.min(...ys) - m, larg + 2 * m, Math.max(...ys) - Math.min(...ys) + 2 * m]

    const itens: { z: number; el: ReactNode }[] = []
    d.rodas.forEach((r, i) =>
      itens.push({
        z: perto(r.pos),
        el: (
          <g key={`r${i}`}>
            <polygon className="roda" points={pts(circulo(r.pos, r.d / 2))} strokeWidth={s * 0.4} />
            <polygon className="cubo" points={pts(circulo(r.pos, r.d / 3.2))} strokeWidth={s * 0.3} />
          </g>
        ),
      }),
    )
    d.tubos.forEach((t, i) => {
      const [a, b] = [iso(t.a), iso(t.b)]
      const meio: V3 = [(t.a[0] + t.b[0]) / 2, (t.a[1] + t.b[1]) / 2, 0]
      itens.push({
        z: perto(meio),
        el: (
          <g key={`t${i}`} strokeLinecap="round">
            <line className="tubo-fora" x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} strokeWidth={s * 1.7} />
            <line className="tubo-dentro" x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} strokeWidth={s * 1.05} />
          </g>
        ),
      })
    })
    d.juntas.forEach((j, i) => {
      const [x, y] = iso(j.pos)
      itens.push({ z: perto(j.pos) + 1, el: <circle key={`j${i}`} className="junta" cx={x} cy={y} r={s * 1.05} fill={corPeca(j.spec)} strokeWidth={s * 0.3} /> })
    })
    itens.sort((a, b) => a.z - b.z)
    return { vb, itens }
  }, [p])

  return (
    <svg viewBox={vb.join(' ')} className="miniatura" role="img" aria-label={tr('Desenho do quadro de {nome}', 'Frame drawing for {nome}', { nome: p.cao.nome || tr('exemplo', 'example') })}>
      {itens.map((i) => i.el)}
    </svg>
  )
}
