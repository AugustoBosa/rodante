import { useEffect, useRef, useState } from 'react'

// Utilidades de tela sem three.js (podem ir no pacote principal).

export const movimentoReduzido = () => matchMedia('(prefers-reduced-motion: reduce)').matches

/** WebGL bom o bastante para o 3D? Sem WebGL, pouca memória ou ?sem3d → desenhos 2D. */
export const tem3D: boolean = (() => {
  if (typeof window === 'undefined') return false
  if (/[?&]sem3d\b/.test(location.search + location.hash)) return false
  const mem = (navigator as { deviceMemory?: number }).deviceMemory
  if (mem !== undefined && mem < 4) return false
  try {
    const gl = document.createElement('canvas').getContext('webgl2')
    gl?.getExtension('WEBGL_lose_context')?.loseContext() // só testa; não prende um contexto
    return !!gl
  } catch {
    return false
  }
})()

/** Ref + "está perto da tela?" (pausa o 3D fora dela). */
export function useVisivel<T extends Element>(margem = '200px') {
  const ref = useRef<T>(null)
  const [v, setV] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => setV(e.isIntersecting), { rootMargin: margem })
    io.observe(el)
    return () => io.disconnect()
  }, [margem])
  return [ref, v] as const
}
