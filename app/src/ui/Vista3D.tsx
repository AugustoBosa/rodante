import { forwardRef, Suspense, useEffect, useImperativeHandle, useMemo, useRef, useState, type ReactNode } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Bounds, Html, Line, OrbitControls } from '@react-three/drei'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { Box3, BufferAttribute, BufferGeometry, CatmullRomCurve3, Matrix4, Quaternion, Vector3, type Group } from 'three'
import type { ShapeMesh } from 'replicad'
import type { Design, Medidas, TipoCadeira, V3 } from '../model/types'
import { tr } from '../i18n'
import { COR, DepoisDoPrimeiroQuadro, Tinta } from './tinta3d'
import { Cao3D, useCao } from './Cao3D'
import { movimentoReduzido } from './tela'
import { COR_CINTA, corPeca } from './coresPecas'
import { comprimentoClip } from '../model/design'
import { FITA_L } from '../model/defaults'

function useGeometria(mesh: ShapeMesh) {
  return useMemo(() => {
    const g = new BufferGeometry()
    g.setAttribute('position', new BufferAttribute(new Float32Array(mesh.vertices), 3))
    g.setAttribute('normal', new BufferAttribute(new Float32Array(mesh.normals), 3))
    g.setIndex(mesh.triangles)
    return g
  }, [mesh])
}

function Junta({ mesh, pos, ex, ey, cor, r }: { mesh?: ShapeMesh; pos: V3; ex: V3; ey: V3; cor: string; r: number }) {
  const m = useMemo(() => {
    const x = new Vector3(...ex)
    const y = new Vector3(...ey)
    return new Matrix4().makeBasis(x, y, x.clone().cross(y)).setPosition(...pos)
  }, [pos, ex, ey])
  // peça CAD ainda não gerada: um nó simples no lugar
  if (!mesh)
    return (
      <mesh position={pos}>
        <sphereGeometry args={[r, 16, 12]} />
        <Tinta cor={cor} />
      </mesh>
    )
  return <JuntaMalha mesh={mesh} m={m} cor={cor} />
}
function JuntaMalha({ mesh, m, cor }: { mesh: ShapeMesh; m: Matrix4; cor: string }) {
  const geo = useGeometria(mesh)
  return (
    <mesh geometry={geo} matrix={m} matrixAutoUpdate={false}>
      <Tinta cor={cor} />
    </mesh>
  )
}

function Tubo({ a, b, r }: { a: V3; b: V3; r: number }) {
  const { meio, quat, comp } = useMemo(() => {
    const va = new Vector3(...a)
    const dir = new Vector3(...b).sub(va)
    const comp = dir.length()
    return { comp, meio: va.add(dir.clone().multiplyScalar(0.5)), quat: new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), dir.normalize()) }
  }, [a, b])
  if (comp <= 0) return null
  return (
    <mesh position={meio} quaternion={quat}>
      <cylinderGeometry args={[r, r, comp, 20]} />
      <Tinta cor={COR.cinza1} traco={1} />
    </mesh>
  )
}

function Roda({ pos, d, largura, andar }: { pos: V3; d: number; largura: number; andar: boolean }) {
  const g = useRef<Group>(null)
  useFrame((_, dt) => {
    if (andar && g.current) g.current.rotation.y -= (dt * 260) / (d / 2) // ~26 cm/s
  })
  return (
    <group position={pos}>
      <group ref={g}>
        <mesh>
          <cylinderGeometry args={[d / 2, d / 2, largura, 40]} />
          <Tinta cor={COR.cinza3} traco={1} />
        </mesh>
        <mesh>
          <cylinderGeometry args={[d / 3.2, d / 3.2, largura + 2, 24]} />
          <Tinta cor={COR.papel} traco={1} />
        </mesh>
        {[0, 1, 2].map((i) => (
          <mesh key={i} rotation-y={(i * Math.PI) / 3} position={[0, 0, 0]}>
            <boxGeometry args={[d / 1.7, largura + 3, 4]} />
            <meshBasicMaterial color={COR.tinta} />
          </mesh>
        ))}
      </group>
    </group>
  )
}

function Cota({ de, ate, texto }: { de: V3; ate: V3; texto: string }) {
  const meio: V3 = [(de[0] + ate[0]) / 2, (de[1] + ate[1]) / 2, (de[2] + ate[2]) / 2]
  return (
    <group>
      <Line points={[de, ate]} color={COR.azul} lineWidth={1.5} dashed dashSize={8} gapSize={5} />
      <Html position={meio} center zIndexRange={[1, 0]}>
        <span className="cota-rotulo">{texto}</span>
      </Html>
    </group>
  )
}

/** Fita de nylon passando pelos pontos (tubo fino, cor de tecido). */
function Cinta({ pontos, fechada = false }: { pontos: V3[]; fechada?: boolean }) {
  const curva = useMemo(() => new CatmullRomCurve3(pontos.map((p) => new Vector3(...p)), fechada), [pontos, fechada])
  return (
    <mesh>
      <tubeGeometry args={[curva, 64, 5, 8, fechada]} />
      <Tinta cor={COR_CINTA} traco={1} />
    </mesh>
  )
}

/**
 * Cão dentro do quadro: quadril sobre o eixo (traseira) ou ombro sobre o eixo dianteiro. As patas apoiadas
 * nas rodas não andam. Desenha as cintas da sela (uma por par de clips, por baixo da barriga) e o arnês
 * (peitoral ou de quadril) ligado às ponteiras.
 */
function CaoNoQuadro({ med, d, tipo, andar, onCorpo }: { med: Medidas; d: Design; tipo: TipoCadeira; andar: boolean; onCorpo: (b: Box3) => void }) {
  const cao = useCao(med, tipo)
  const m = cao.marcos
  const eixo = Math.min(...d.rodas.map((r) => r.pos[0]))
  const ombro = tipo === 'traseira' ? eixo - m.quadril : eixo
  const H = d.cotas.alturaTrilho
  // caixa do corpo para a câmera enquadrar o cão inteiro
  useEffect(() => {
    onCorpo(new Box3(new Vector3(ombro + m.xNariz, -m.largura / 2, 0), new Vector3(ombro + m.xCauda, m.largura / 2, m.altura)))
  }, [ombro, m, onCorpo])
  const cintas = useMemo(() => {
    const yC = Math.abs(d.juntas.find((j) => j.spec.tipo === 'clipSela')?.pos[1] ?? d.cotas.larguraInterna / 2)
    // a cinta encosta por baixo do corpo: barriga no meio do tronco, prega da coxa atrás, axila na frente
    const fundo = (x: number) => (x > ombro + m.quadril * 0.8 ? m.virilha : x < ombro + m.quadril * 0.2 ? m.axila : m.barriga) - 6
    const meia = m.largura * 0.36
    const meioClip = comprimentoClip({ fitaL: FITA_L }) / 2
    const xs = [...new Set(d.juntas.filter((j) => j.spec.tipo === 'clipSela' && j.pos[1] < 0).map((j) => Math.round(j.pos[0] + meioClip)))]
    const sela: V3[][] = xs.map((x) => {
      const z = fundo(x)
      return [[x, -yC, H], [x, -meia, z + 18], [x, 0, z], [x, meia, z + 18], [x, yC, H]]
    })
    // arnês: anel no peito (ponteiras na frente) ou no quadril (ponteiras atrás), ligado às ponteiras
    const pont = d.juntas.filter((j) => j.spec.tipo === 'ponteira')
    if (!pont.length) return { sela, anel: null, ligas: [] as V3[][] }
    const naFrente = pont[0].pos[0] < ombro + m.quadril / 2
    const xa = naFrente ? ombro + m.quadril * 0.1 : ombro + m.quadril * 0.95
    const base = naFrente ? m.axila : m.virilha
    const cz = (base + m.costas) / 2
    const rz = (m.costas - base) / 2 + 10
    const ry = m.largura / 2 + 10
    const anel: V3[] = Array.from({ length: 16 }, (_, i) => {
      const a = (i / 16) * Math.PI * 2
      return [xa, ry * Math.cos(a), cz + rz * Math.sin(a)]
    })
    const ligas: V3[][] = pont.map((j) => [j.pos, [xa, Math.sign(j.pos[1]) * ry, cz - rz * 0.3]])
    return { sela, anel, ligas }
  }, [d, m, ombro, H])
  return (
    <>
      <group position={[ombro, 0, 0]}>
        <Cao3D cao={cao} anim={andar ? 'Walk' : 'Idle'} parado={tipo} />
      </group>
      {cintas.sela.map((p, i) => (
        <Cinta key={`s${i}`} pontos={p} />
      ))}
      {cintas.anel && <Cinta pontos={cintas.anel} fechada />}
      {cintas.ligas.map((p, i) => (
        <Cinta key={`l${i}`} pontos={p} />
      ))}
    </>
  )
}

export type Vista = 'iso' | 'tras' | 'lado' | 'frente' | 'topo'
export interface Vista3DHandle {
  olhar: (v: Vista) => void
}

interface Props {
  design: Design
  meshes: Record<string, ShapeMesh>
  tuboD: number
  tipo: TipoCadeira
  cotas?: boolean
  explodir?: number // 0 = montado, 1 = explodido
  cao?: Medidas | null
  destaque?: string | null
  andar?: boolean
  controles?: boolean
  girar?: boolean
  ativo?: boolean
  folga?: number // margem do enquadramento (1 = justo, <1 sangra)
  inicial?: Vista
}

const DIRS: Record<Vista, V3> = { iso: [-0.9, -1.1, 0.75], tras: [0.55, -1, 0.32], lado: [0, -1, 0.0001], frente: [-1, 0, 0.0001], topo: [0.0001, -0.01, 1] }

/** Enquadra a caixa na tela: projeta os 8 cantos nos eixos da câmera e ajusta zoom e centro. */
function Camera({ caixa, folga, inicial, ctl, onOlhar }: { caixa: Box3; folga: number; inicial: Vista; ctl: React.RefObject<OrbitControlsImpl | null>; onOlhar: (f: (v: Vista) => void) => void }) {
  const { camera, size, invalidate } = useThree()
  const olhar = (v: Vista) => {
    const centro = caixa.getCenter(new Vector3())
    const raio = caixa.getSize(new Vector3()).length()
    camera.position.copy(centro.clone().add(new Vector3(...DIRS[v]).normalize().multiplyScalar(raio * 4)))
    camera.lookAt(centro)
    camera.updateMatrixWorld()
    const dir = new Vector3(1, 0, 0).applyQuaternion(camera.quaternion)
    const cima = new Vector3(0, 1, 0).applyQuaternion(camera.quaternion)
    const [a, b] = [caixa.min, caixa.max]
    const cantos = [0, 1, 2, 3, 4, 5, 6, 7].map((i) => new Vector3(i & 1 ? b.x : a.x, i & 2 ? b.y : a.y, i & 4 ? b.z : a.z))
    const faixa = (eixo: Vector3) => {
      const ds = cantos.map((c) => c.dot(eixo))
      return Math.max(...ds) - Math.min(...ds)
    }
    camera.zoom = Math.min(size.width / faixa(dir), size.height / faixa(cima)) / folga
    camera.updateProjectionMatrix()
    ctl.current?.target.copy(centro)
    ctl.current?.update()
    invalidate()
  }
  onOlhar(olhar)
  const chave = [caixa.min.toArray(), caixa.max.toArray()].flat().map((n) => Math.round(n / 20)).join()
  useEffect(() => olhar(inicial), [chave, size.width, size.height]) // eslint-disable-line react-hooks/exhaustive-deps
  return null
}

export const Vista3D = forwardRef<Vista3DHandle, Props>(function Vista3D(
  { design: d, meshes, tuboD, tipo, cotas = false, explodir = 0, cao, destaque, andar = false, controles = true, girar = false, ativo = true, folga = 1.15, inicial = 'iso' },
  ref,
) {
  const ctl = useRef<OrbitControlsImpl>(null)
  const olharRef = useRef<(v: Vista) => void>(() => {})
  useImperativeHandle(ref, () => ({ olhar: (v) => olharRef.current(v) }))
  const c = d.cotas
  const centro = useMemo(() => new Vector3(c.comprimentoTrilho / 2, 0, c.alturaTrilho / 2), [c.comprimentoTrilho, c.alturaTrilho])
  const [corpo, setCorpo] = useState<Box3 | null>(null) // medido no modelo do cão quando ele carrega
  // caixa do que aparece: quadro + rodas e, com o cão, o corpo dele
  const caixa = useMemo(() => {
    const b = new Box3(new Vector3(0, -c.larguraTotal / 2, 0), new Vector3(c.comprimentoTrilho, c.larguraTotal / 2, c.alturaTrilho + tuboD))
    for (const r of d.rodas) b.expandByPoint(new Vector3(r.pos[0] - r.d / 2, 0, 0)).expandByPoint(new Vector3(r.pos[0] + r.d / 2, 0, r.d))
    if (cao && corpo) b.union(corpo)
    // vista explodida: as peças se afastam do centro (ver posições das juntas abaixo)
    if (explodir > 0) {
      const meio = b.getCenter(new Vector3())
      const k = new Vector3(1 + 0.3 * explodir, 1 + 0.6 * explodir, 1 + 0.4 * explodir)
      b.min.sub(meio).multiply(k).add(meio)
      b.max.sub(meio).multiply(k).add(meio)
    }
    return b
  }, [d, c, cao, corpo, tuboD, explodir])
  const anima = ativo && !movimentoReduzido() && (andar || !!cao || girar)

  const yC = Math.abs(d.juntas.find((j) => j.spec.tipo === 'cotovelo' || j.spec.tipo === 'ponteira')?.pos[1] ?? 0)
  const yCota = -(c.larguraTotal / 2 + 40)
  const e = explodir

  return (
    <Canvas
      className="cena"
      orthographic
      frameloop={!ativo ? 'never' : anima ? 'always' : 'demand'}
      dpr={[1, 2]}
      gl={{ preserveDrawingBuffer: true, antialias: true }}
      camera={{ position: [-3000, -3000, 3000], up: [0, 0, 1], zoom: 0.5, near: 1, far: 40000 }}
      aria-label={tr('Modelo 3D do quadro. Arraste para girar, role para aproximar.', 'Frame 3D model. Drag to rotate, scroll to zoom.')}
    >
      <hemisphereLight args={['#ffffff', '#9a958a', 1.3]} />
      <directionalLight position={[-600, -1200, 2000]} intensity={1.7} />
      {d.tubos.map((t) => (
        <Tubo key={t.nome} a={t.a} b={t.b} r={tuboD / 2} />
      ))}
      {d.juntas.map((j, i) => {
        const chave = JSON.stringify(j.spec)
        // vista explodida: conexões se afastam do centro do quadro, tubos ficam no lugar
        const pos: V3 = [j.pos[0] + (j.pos[0] - centro.x) * 0.3 * e, j.pos[1] * (1 + 0.6 * e), j.pos[2] + (j.pos[2] - c.alturaTrilho / 2) * 0.4 * e]
        return <Junta key={i} mesh={meshes[chave]} pos={pos} ex={j.ex} ey={j.ey} r={tuboD * 0.9} cor={destaque === chave ? COR.azul : corPeca(j.spec)} />
      })}
      {d.rodas.map((r, i) => (
        <Roda key={i} pos={[r.pos[0], r.pos[1] * (1 + 0.6 * e), r.pos[2]]} d={r.d} largura={r.largura} andar={anima && andar} />
      ))}
      {cao && (
        <Suspense fallback={null}>
          <CaoNoQuadro med={cao} d={d} tipo={tipo} andar={anima && andar} onCorpo={setCorpo} />
        </Suspense>
      )}
      {cotas && (
        <DepoisDoPrimeiroQuadro>
          <Cota de={[0, yCota, -10]} ate={[c.comprimentoTrilho, yCota, -10]} texto={`${tr('comprimento', 'length')} ${c.comprimentoTrilho} mm`} />
          <Cota de={[c.comprimentoTrilho + 50, -yC, c.alturaTrilho]} ate={[c.comprimentoTrilho + 50, yC, c.alturaTrilho]} texto={`${tr('entre trilhos', 'between rails')} ${Math.round(2 * yC)} mm`} />
          <Cota de={[-50, yCota, 0]} ate={[-50, yCota, c.alturaTrilho]} texto={`${tr('altura', 'height')} ${c.alturaTrilho} mm`} />
          <Cota de={[c.comprimentoTrilho / 2, -c.larguraTotal / 2, 0]} ate={[c.comprimentoTrilho / 2, c.larguraTotal / 2, 0]} texto={`${tr('largura total', 'overall width')} ${c.larguraTotal} mm`} />
        </DepoisDoPrimeiroQuadro>
      )}
      <OrbitControls ref={ctl} makeDefault enabled={controles} enableZoom={controles} autoRotate={girar && !movimentoReduzido()} autoRotateSpeed={0.6} target={centro} />
      <Camera caixa={caixa} folga={folga} inicial={inicial} ctl={ctl} onOlhar={(f) => (olharRef.current = f)} />
      <Acordar ativo={ativo} />
    </Canvas>
  )
})

/** Volta a desenhar ao reaparecer na tela (o frameloop 'never' → 'demand' sozinho não pede quadro). */
function Acordar({ ativo }: { ativo: boolean }) {
  const invalidate = useThree((s) => s.invalidate)
  useEffect(() => {
    if (ativo) invalidate()
  }, [ativo, invalidate])
  return null
}

/** Miniatura de uma peça: enquadrada sozinha, girando devagar quando visível. */
export function MiniPeca({ mesh, rotulo, cor, ativo = true }: { mesh: ShapeMesh; rotulo: string; cor?: string; ativo?: boolean }) {
  const geo = useGeometria(mesh)
  return (
    <Canvas className="cena" frameloop={ativo && !movimentoReduzido() ? 'always' : 'demand'} dpr={[1, 2]} camera={{ position: [60, -80, 60], up: [0, 0, 1], fov: 30 }} aria-label={rotulo} gl={{ preserveDrawingBuffer: true }}>
      <hemisphereLight args={['#ffffff', '#9a958a', 1.3]} />
      <directionalLight position={[50, -100, 150]} intensity={1.6} />
      <Bounds fit clip observe margin={1.9}>
        <Giro>
          <mesh geometry={geo}>
            <Tinta cor={cor} traco={1} />
          </mesh>
        </Giro>
      </Bounds>
    </Canvas>
  )
}
function Giro({ children }: { children: ReactNode }) {
  const g = useRef<Group>(null)
  useFrame((_, dt) => {
    if (g.current) g.current.rotation.z += dt * 0.5
  })
  return <group ref={g}>{children}</group>
}
