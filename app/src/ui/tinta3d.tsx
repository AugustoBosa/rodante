import { useEffect, useState, type ReactNode } from 'react'
import { Outlines } from '@react-three/drei'
import { DataTexture, NearestFilter, RedFormat } from 'three'

// Visual de manual para o 3D: sombreamento em três tons (toon) + contorno fino em pixels de tela.
// Cores lidas do CSS a cada uso (não uma vez no carregamento): acompanham o tema claro/escuro.
const v = (n: string) => getComputedStyle(document.documentElement).getPropertyValue(n).trim()
export const COR = {
  get papel() { return v('--papel') },
  get tinta() { return v('--tinta') },
  get azul() { return v('--azul') },
  get cinza1() { return v('--cinza-1') },
  get cinza2() { return v('--cinza-2') },
  get cinza3() { return v('--cinza-3') },
}

export const gradiente = new DataTexture(new Uint8Array([120, 200, 255]), 3, 1, RedFormat)
gradiente.minFilter = gradiente.magFilter = NearestFilter
gradiente.needsUpdate = true

/** Material de manual. Use como filho de <mesh>. */
export function Tinta({ cor, traco = 1.2, contorno = true }: { cor?: string; traco?: number; contorno?: boolean }) {
  return (
    <>
      <meshToonMaterial color={cor ?? COR.papel} gradientMap={gradiente} />
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

