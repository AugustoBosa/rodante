import { Suspense, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Html, Line } from '@react-three/drei'
import { MathUtils, Matrix4, Quaternion, Vector3, type Group } from 'three'
import type { Medidas, V3 } from '../model/types'
import type { QualMedida } from './Ilustracao'
import { Cao3D, useCao, type Marcos } from './Cao3D'
import { COR, DepoisDoPrimeiroQuadro } from './tinta3d'
import { movimentoReduzido } from './tela'
import { tr } from '../i18n'

const CAMPO: Record<QualMedida, keyof Medidas> = {
  alturaPerna: 'alturaPernaCm',
  alturaPernaDianteira: 'alturaPernaDianteiraCm',
  comprimento: 'comprimentoCm',
  largura: 'larguraCm',
  alturaCostas: 'alturaCostasCm',
}
const ROTULO: Record<QualMedida, string> = {
  alturaPerna: tr('perna traseira', 'hind leg'),
  alturaPernaDianteira: tr('perna dianteira', 'front leg'),
  comprimento: tr('ombro → quadril', 'shoulder → hip'),
  largura: tr('largura', 'width'),
  alturaCostas: tr('costas', 'back'),
}

/** Onde a fita vai em cada medida: de, até e a normal (lado que olha para a câmera). */
function fitaDe(q: QualMedida, m: Marcos): { de: V3; ate: V3; n: V3 } {
  const frente = -m.largura / 2 - 30 // na frente do cão, do lado da câmera
  if (q === 'alturaPernaDianteira') return { de: [m.xPataD - 45, frente, 0], ate: [m.xPataD - 45, frente, m.axila], n: [0, -1, 0] }
  if (q === 'alturaPerna') return { de: [m.xPataT - 20, frente, 0], ate: [m.xPataT - 20, frente, m.virilha], n: [0, -1, 0] }
  if (q === 'comprimento') return { de: [0, frente, m.costas * 0.72], ate: [m.quadril, frente, m.costas * 0.72], n: [0, -1, 0] }
  if (q === 'largura') return { de: [m.quadril * 0.55, -m.largura / 2, m.costas + 12], ate: [m.quadril * 0.55, m.largura / 2, m.costas + 12], n: [0, 0, 1] }
  return { de: [m.quadril * 0.45, frente, 0], ate: [m.quadril * 0.45, frente, m.costas], n: [0, -1, 0] }
}

/** Fita métrica que desenrola de `de` até `ate`, com marcas a cada 5 cm. */
function Fita({ de, ate, n, texto }: { de: V3; ate: V3; n: V3; texto: string }) {
  const g = useRef<Group>(null)
  const { comp, giro, meio } = useMemo(() => {
    const a = new Vector3(...de)
    const d = new Vector3(...ate).sub(a)
    const comp = d.length()
    const meio = d.clone().multiplyScalar(0.5).toArray()
    const x = d.normalize()
    const z = new Vector3(...n)
    const y = z.clone().cross(x)
    return { comp, meio, giro: new Quaternion().setFromRotationMatrix(new Matrix4().makeBasis(x, y, z)) }
  }, [de, ate, n])
  const larg = Math.max(10, comp * 0.035)
  useFrame((_, dt) => {
    if (!g.current) return
    g.current.scale.x = movimentoReduzido() ? 1 : MathUtils.damp(g.current.scale.x, 1, 5, dt)
  })
  const marcas = []
  for (let t = 50; t < comp; t += 50) marcas.push(t)
  return (
    <group position={de}>
      <group quaternion={giro}>
        <group ref={g} scale={[0.02, 1, 1]}>
          <mesh position={[comp / 2, 0, 0]}>
            <boxGeometry args={[comp, larg, 1]} />
            <meshBasicMaterial color={COR.azul} />
          </mesh>
          {marcas.map((t) => (
            <mesh key={t} position={[t, larg * (t % 100 === 0 ? 0.2 : 0.3), 1]}>
              <boxGeometry args={[2, larg * (t % 100 === 0 ? 0.6 : 0.4), 1]} />
              <meshBasicMaterial color={COR.papel} />
            </mesh>
          ))}
        </group>
        {[0, comp].map((t) => (
          <mesh key={t} position={[t, 0, 2]}>
            <boxGeometry args={[3, larg * 2.4, 1]} />
            <meshBasicMaterial color={COR.tinta} />
          </mesh>
        ))}
      </group>
      <DepoisDoPrimeiroQuadro>
        <Html center position={meio} zIndexRange={[5, 0]}>
          <span className="fita-rotulo">{texto}</span>
        </Html>
      </DepoisDoPrimeiroQuadro>
    </group>
  )
}

function Cena({ med, foco }: { med: Medidas; foco: QualMedida }) {
  const cao = useCao(med)
  const m = cao.marcos
  const { camera, size } = useThree()
  const alvo = useRef(new Vector3())
  const cima = foco === 'largura'
  const fita = fitaDe(foco, m)
  const valor = med[CAMPO[foco]]

  useFrame((_, dt) => {
    const cx = (m.xNariz + m.xCauda) / 2
    const centro = new Vector3(cx, 0, cima ? m.costas * 0.6 : m.altura * 0.5)
    const dir = (cima ? new Vector3(0, -0.22, 1) : new Vector3(0, -1, 0.1)).normalize().multiplyScalar(4000)
    const largV = (m.xCauda - m.xNariz) * 1.3
    const altV = cima ? m.largura * 2.6 : m.altura * 1.45
    const zoom = Math.min(size.width / largV, size.height / altV)
    const k = movimentoReduzido() ? 1 : 1 - Math.exp(-4 * dt)
    alvo.current.lerp(centro, k)
    camera.position.lerp(centro.clone().add(dir), k)
    camera.lookAt(alvo.current)
    camera.zoom = MathUtils.lerp(camera.zoom, zoom, k)
    camera.updateProjectionMatrix()
  })

  return (
    <>
      <hemisphereLight args={['#ffffff', '#9a958a', 1.3]} />
      <directionalLight position={[-800, -1500, 2200]} intensity={1.7} />
      <Cao3D cao={cao} anim={foco === 'largura' ? 'Idle' : 'Idle_2'} />
      {!cima && <Line points={[[m.xNariz - 160, 0, 0], [m.xCauda + 160, 0, 0]]} color={COR.tinta} lineWidth={2} />}
      <Fita key={foco} de={fita.de} ate={fita.ate} n={fita.n} texto={`${valor > 0 ? String(valor).replace('.', ',') : '?'} cm · ${ROTULO[foco]}`} />
    </>
  )
}

export default function PalcoMedida({ med, foco, ativo = true }: { med: Medidas; foco: QualMedida; ativo?: boolean }) {
  return (
    <Canvas
      className="cena"
      orthographic
      frameloop={ativo ? 'always' : 'never'}
      dpr={[1, 2]}
      camera={{ position: [0, -4000, 400], up: [0, 0, 1], zoom: 0.5, near: 1, far: 20000 }}
      aria-label={tr('Cão em 3D mostrando onde passar a fita métrica.', '3D dog showing where to place the tape measure.')}
    >
      <Suspense fallback={null}>
        <Cena med={med} foco={foco} />
      </Suspense>
    </Canvas>
  )
}
