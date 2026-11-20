import { useEffect, useState, type ReactNode } from 'react'
import { Outlines } from '@react-three/drei'
import { DataTexture, NearestFilter, RedFormat } from 'three'

// Visual de manual para o 3D: sombreamento em três tons (toon) + contorno preto em pixels de tela.
function lerCores() {
  const s = getComputedStyle(document.documentElement)
  const v = (n: string) => s.getPropertyValue(n).trim()
  return { papel: v('--papel'), tinta: v('--tinta'), azul: v('--azul'), cinza1: v('--cinza-1'), cinza2: v('--cinza-2'), cinza3: v('--cinza-3') }
}
export const COR = lerCores()

export const gradiente = new DataTexture(new Uint8Array([120, 200, 255]), 3, 1, RedFormat)
gradiente.minFilter = gradiente.magFilter = NearestFilter
gradiente.needsUpdate = true

/** Material de manual. Use como filho de <mesh>. */
export function Tinta({ cor = COR.papel, traco = 2, contorno = true }: { cor?: string; traco?: number; contorno?: boolean }) {
  return (
    <>
      <meshToonMaterial color={cor} gradientMap={gradiente} />
      {contorno && <Outlines screenspace thickness={traco} color={COR.tinta} />}
    </>
  )
}

/** drei <Html> montado no mesmo commit do Canvas perde o primeiro rótulo; adia um quadro. */
export function DepoisDoPrimeiroQuadro({ children }: { children: ReactNode }) {
  const [ok, setOk] = useState(false)
  useEffect(() => {
    const id = requestAnimationFrame(() => setOk(true))
    return () => cancelAnimationFrame(id)
  }, [])
  return ok ? children : null
}

