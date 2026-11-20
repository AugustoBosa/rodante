import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState, type ReactNode } from 'react'
import { Canvas } from '@react-three/fiber'
import { Bounds, Grid, Html, Line, OrbitControls } from '@react-three/drei'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { BufferAttribute, BufferGeometry, Matrix4, Quaternion, Vector3 } from 'three'
import type { ShapeMesh } from 'replicad'
import type { Design, V3 } from '../model/types'

const COR_PECA = '#f2b705'
const COR_TUBO = '#c3ccd0'
const COR_COTA = '#2f5da8'

function useGeometria(mesh: ShapeMesh) {
  return useMemo(() => {
    const g = new BufferGeometry()
    g.setAttribute('position', new BufferAttribute(new Float32Array(mesh.vertices), 3))
    g.setAttribute('normal', new BufferAttribute(new Float32Array(mesh.normals), 3))
    g.setIndex(mesh.triangles)
    return g
  }, [mesh])
}

function Junta({ mesh, pos, ex, ey }: { mesh: ShapeMesh; pos: V3; ex: V3; ey: V3 }) {
  const geo = useGeometria(mesh)
  const m = useMemo(() => {
    const x = new Vector3(...ex)
    const y = new Vector3(...ey)
    return new Matrix4().makeBasis(x, y, x.clone().cross(y)).setPosition(...pos)
  }, [pos, ex, ey])
  return (
    <mesh geometry={geo} matrix={m} matrixAutoUpdate={false}>
      <meshStandardMaterial color={COR_PECA} roughness={0.55} />
    </mesh>
  )
}

function Tubo({ a, b, r }: { a: V3; b: V3; r: number }) {
  const { meio, quat, comp } = useMemo(() => {
    const va = new Vector3(...a)
    const dir = new Vector3(...b).sub(va)
    const comp = dir.length()
    return {
      comp,
      meio: va.add(dir.clone().multiplyScalar(0.5)),
      quat: new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), dir.normalize()),
    }
  }, [a, b])
  if (comp <= 0) return null
  return (
    <mesh position={meio} quaternion={quat}>
      <cylinderGeometry args={[r, r, comp, 24]} />
      <meshStandardMaterial color={COR_TUBO} metalness={0.6} roughness={0.35} />
    </mesh>
  )
}

function Cota({ de, ate, texto }: { de: V3; ate: V3; texto: string }) {
  const meio: V3 = [(de[0] + ate[0]) / 2, (de[1] + ate[1]) / 2, (de[2] + ate[2]) / 2]
  return (
    <group>
      <Line points={[de, ate]} color={COR_COTA} lineWidth={1.5} dashed dashSize={8} gapSize={5} />
      <Html position={meio} center zIndexRange={[1, 0]}>
        <span className="cota-rotulo">{texto}</span>
      </Html>
    </group>
  )
}

/** drei <Html> montado no mesmo commit do Canvas perde o primeiro rótulo; adia um quadro. */
function DepoisDoPrimeiroQuadro({ children }: { children: ReactNode }) {
  const [ok, setOk] = useState(false)
  useEffect(() => {
    const id = requestAnimationFrame(() => setOk(true))
    return () => cancelAnimationFrame(id)
  }, [])
  return ok ? children : null
}

export type Vista = 'iso' | 'lado' | 'frente' | 'topo'
export interface Vista3DHandle {
  olhar: (v: Vista) => void
}

interface Props {
  design: Design
  meshes: Record<string, ShapeMesh>
  tuboD: number
  cotas: boolean
}

export const Vista3D = forwardRef<Vista3DHandle, Props>(function Vista3D({ design: d, meshes, tuboD, cotas }, ref) {
  const ctl = useRef<OrbitControlsImpl>(null)
  const c = d.cotas
  const centro = useMemo(() => new Vector3(c.comprimentoTrilho / 2, 0, c.alturaTrilho / 2), [c.comprimentoTrilho, c.alturaTrilho])
  const tamanho = Math.max(c.comprimentoTrilho, c.larguraTotal, c.alturaTrilho)
  const DIRS: Record<Vista, V3> = { iso: [-0.9, -1.1, 0.75], lado: [0, -1, 0], frente: [-1, 0, 0], topo: [0.0001, -0.01, 1] }

  const olhar = (v: Vista) => {
    const o = ctl.current
    if (!o) return
    // tela em pé (celular) precisa de mais distância para caber a largura
    const cam = o.object as { aspect?: number }
    const k = 2.6 / Math.sqrt(Math.min(1, cam.aspect ?? 1))
    const dir = new Vector3(...DIRS[v]).normalize().multiplyScalar(tamanho * k)
    o.object.position.copy(centro.clone().add(dir))
    o.target.copy(centro)
    o.update()
  }
  useImperativeHandle(ref, () => ({ olhar }))
  // enquadra ao abrir e quando o tamanho do quadro muda muito
  const olharRef = useRef(olhar)
  useEffect(() => {
    olharRef.current = olhar
  })
  const escala = Math.round(tamanho / 50)
  useEffect(() => {
    const id = requestAnimationFrame(() => olharRef.current('iso'))
    return () => cancelAnimationFrame(id)
  }, [escala])

  const yC = Math.abs(d.juntas.find((j) => j.spec.tipo === 'cotovelo')?.pos[1] ?? 0)
  const yCota = -(c.larguraTotal / 2 + 40)
  const inicio = centro.clone().add(new Vector3(...DIRS.iso).normalize().multiplyScalar(tamanho * 2.6))

  return (
    <Canvas
      frameloop="demand"
      gl={{ preserveDrawingBuffer: true, antialias: true }}
      camera={{ position: inicio.toArray(), up: [0, 0, 1], fov: 35, near: 1, far: 20000 }}
      aria-label="Modelo 3D do quadro. Arraste para girar, role para aproximar."
    >
      <hemisphereLight args={['#ffffff', '#8a949a', 1.1]} />
      <directionalLight position={[-300, -500, 900]} intensity={1.6} />
      <Grid rotation={[Math.PI / 2, 0, 0]} position={[centro.x, 0, 0]} cellSize={10} sectionSize={100} cellColor="#9aa6ab" sectionColor="#6b787d" fadeDistance={tamanho * 4} infiniteGrid />
      {d.tubos.map((t) => (
        <Tubo key={t.nome} a={t.a} b={t.b} r={tuboD / 2} />
      ))}
      {d.juntas.map((j, i) => {
        const m = meshes[JSON.stringify(j.spec)]
        return m ? <Junta key={i} mesh={m} pos={j.pos} ex={j.ex} ey={j.ey} /> : null
      })}
      {d.rodas.map((r, i) => (
        <group key={i} position={r.pos}>
          <mesh>
            <cylinderGeometry args={[r.d / 2, r.d / 2, r.largura, 48]} />
            <meshStandardMaterial color="#2b3134" roughness={0.9} />
          </mesh>
          <mesh>
            <cylinderGeometry args={[r.d / 4, r.d / 4, r.largura + 2, 32]} />
            <meshStandardMaterial color="#9aa6ab" metalness={0.5} />
          </mesh>
        </group>
      ))}
      {cotas && (
        <DepoisDoPrimeiroQuadro>
          <Cota de={[0, yCota, -10]} ate={[c.comprimentoTrilho, yCota, -10]} texto={`comprimento ${c.comprimentoTrilho} mm`} />
          <Cota de={[c.comprimentoTrilho + 50, -yC, c.alturaTrilho]} ate={[c.comprimentoTrilho + 50, yC, c.alturaTrilho]} texto={`entre trilhos ${Math.round(2 * yC)} mm`} />
          <Cota de={[-50, yCota, 0]} ate={[-50, yCota, c.alturaTrilho]} texto={`altura ${c.alturaTrilho} mm`} />
          <Cota de={[c.comprimentoTrilho / 2, -c.larguraTotal / 2, 0]} ate={[c.comprimentoTrilho / 2, c.larguraTotal / 2, 0]} texto={`largura total ${c.larguraTotal} mm`} />
        </DepoisDoPrimeiroQuadro>
      )}
      <OrbitControls ref={ctl} makeDefault target={centro} />
    </Canvas>
  )
})

/** Miniatura de uma peça, enquadrada automaticamente. */
export function MiniPeca({ mesh, rotulo }: { mesh: ShapeMesh; rotulo: string }) {
  const geo = useGeometria(mesh)
  return (
    <Canvas frameloop="demand" camera={{ position: [60, -80, 60], up: [0, 0, 1], fov: 35 }} aria-label={rotulo} gl={{ preserveDrawingBuffer: true }}>
      <hemisphereLight args={['#ffffff', '#8a949a', 1.2]} />
      <directionalLight position={[50, -100, 150]} intensity={1.4} />
      <Bounds fit clip margin={1.3}>
        <mesh geometry={geo}>
          <meshStandardMaterial color={COR_PECA} roughness={0.55} />
        </mesh>
      </Bounds>
    </Canvas>
  )
}
