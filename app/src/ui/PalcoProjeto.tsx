import { useMemo } from 'react'
import { computeDesign } from '../model/design'
import type { Projeto } from '../model/types'
import { Vista3D, type Vista } from './Vista3D'
import { usePecas } from './usePecas'

interface Props {
  p: Projeto
  ligarCad?: boolean // gera as peças reais (baixa o motor CAD); sem isso, nós simples no lugar
  cao?: boolean
  andar?: boolean
  girar?: boolean
  explodir?: number
  controles?: boolean
  ativo?: boolean
  folga?: number
  inicial?: Vista
}

/** Quadro 3D de um projeto (real ou provisório), com o cão e as peças CAD quando ligadas. */
export default function PalcoProjeto({ p, ligarCad = false, cao = true, andar, girar, explodir, controles = false, ativo = true, folga, inicial }: Props) {
  const d = useMemo(() => computeDesign(p), [p])
  const { meshes } = usePecas(d, ligarCad)
  return (
    <Vista3D
      design={d}
      meshes={meshes}
      tuboD={p.materiais.tuboD}
      tipo={p.tipo}
      cao={cao ? p.medidas : null}
      andar={andar}
      girar={girar}
      explodir={explodir}
      controles={controles}
      ativo={ativo}
      folga={folga}
      inicial={inicial}
    />
  )
}
