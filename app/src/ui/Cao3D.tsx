import { useEffect, useMemo } from 'react'
import { useAnimations, useGLTF } from '@react-three/drei'
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js'
import { useFrame } from '@react-three/fiber'
import { BackSide, Group, MeshBasicMaterial, SkinnedMesh, Vector2, Vector3, type Object3D } from 'three'
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import type { Medidas } from '../model/types'
import { COR } from './tinta3d'
import { movimentoReduzido } from './tela'

// Shiba Inu de Quaternius (CC0), ver public/modelos/LICENCAS.txt.
export const URL_CAO = `${import.meta.env.BASE_URL}modelos/shiba.glb`
useGLTF.preload(URL_CAO)

/** Medidas do modelo cru (unidades do glTF), no referencial final: Z para cima, cabeça para -X. */
interface Ref {
  yaw: number
  desloc: [number, number, number] // leva ombro → x=0, centro → y=0, chão → z=0
  comp: number // ombro → quadril
  costas: number
  larg: number
  axila: number
  virilha: number
  altura: number
  xMin: number
  xMax: number
  xPataD: number
  xPataT: number
}

/** Mede o cão no próprio modelo: ossos para os pontos anatômicos, vértices para costas e largura. */
function medir(cena: Object3D): Ref {
  const tilt = new Group()
  tilt.rotation.x = Math.PI / 2 // glTF é Y para cima; a cena é Z para cima
  const yaw = new Group()
  tilt.add(cena)
  yaw.add(tilt)
  // o GLTFLoader tira o "." dos nomes (FrontShoulder.L → FrontShoulderL)
  const osso = (n: string) => (cena.getObjectByName(n) ?? cena.getObjectByName(n.replace('.', '')))!.getWorldPosition(new Vector3())
  yaw.updateMatrixWorld(true)
  const cab = osso('Head')
  const cauda = osso('Tail1')
  yaw.rotation.z = Math.PI - Math.atan2(cab.y - cauda.y, cab.x - cauda.x) // cabeça para -X
  yaw.updateMatrixWorld(true)

  const pts: Vector3[] = []
  cena.traverse((o) => {
    const m = o as SkinnedMesh
    if (!m.isSkinnedMesh) return
    m.skeleton.update()
    for (let i = 0; i < m.geometry.attributes.position.count; i++) pts.push(m.getVertexPosition(i, new Vector3()).applyMatrix4(m.matrixWorld))
  })
  const ombro = osso('FrontShoulder.L')
  const quadril = osso('BackLeg.L')
  const comp = quadril.x - ombro.x
  const tronco = pts.filter((p) => p.x >= ombro.x && p.x <= quadril.x)
  const dorso = tronco.filter((p) => p.x >= ombro.x + comp * 0.35) // sem o pescoço
  const zs = pts.map((p) => p.z)
  const xs = pts.map((p) => p.x)
  const z0 = Math.min(...zs)
  const ys = tronco.map((p) => p.y)
  const cy = (Math.min(...ys) + Math.max(...ys)) / 2
  // axila: entre o ombro e o cotovelo; prega da coxa: entre o quadril e o joelho
  const entre = (a: string, b: string, t: number) => osso(a).z + (osso(b).z - osso(a).z) * t - z0
  const r: Ref = {
    yaw: yaw.rotation.z,
    desloc: [-ombro.x, -cy, -z0],
    comp,
    costas: Math.max(...dorso.map((p) => p.z)) - z0,
    larg: Math.max(...ys) - Math.min(...ys),
    axila: entre('FrontShoulder.L', 'FrontLowerLeg.L', 0.75),
    virilha: entre('BackLeg.L', 'BackUpperLeg.L', 0.8),
    altura: Math.max(...zs) - z0,
    xMin: Math.min(...xs) - ombro.x,
    xMax: Math.max(...xs) - ombro.x,
    xPataD: osso('FrontLowerLeg.L_end').x - ombro.x,
    xPataT: osso('BackLowerLeg.L_end').x - ombro.x,
  }
  tilt.remove(cena) // só depois de ler tudo: fora do grupo, as posições voltam ao referencial do glTF
  return r
}

/** Pontos do cão em mm (origem no ombro, chão em z=0), já na escala das medidas. */
export interface Marcos {
  esc: [number, number, number]
  quadril: number
  axila: number
  virilha: number
  costas: number
  largura: number
  altura: number
  xNariz: number
  xCauda: number
  xPataD: number
  xPataT: number
}

const COSTAS_PADRAO_MM = 380 // cão médio quando nada foi medido ainda

export function marcos(r: Ref, m: Partial<Medidas>): Marcos {
  const mm = (cm?: number) => (cm && cm > 0 ? cm * 10 : 0)
  const [costas, pT, pD, comp, larg] = [m.alturaCostasCm, m.alturaPernaCm, m.alturaPernaDianteiraCm, m.comprimentoCm, m.larguraCm].map(mm)
  const sz = costas ? costas / r.costas : pT ? pT / r.virilha : pD ? pD / r.axila : comp ? comp / r.comp : COSTAS_PADRAO_MM / r.costas
  // proporções além de 0,7–1,45× do modelo deformam o desenho: o cão só sugere, quem manda é a medida
  const lim = (s: number) => Math.min(Math.max(s, sz * 0.7), sz * 1.45)
  const sx = comp ? lim(comp / r.comp) : sz
  const sy = larg ? lim(larg / r.larg) : sz
  return {
    esc: [sx, sy, sz],
    quadril: r.comp * sx,
    axila: r.axila * sz,
    virilha: r.virilha * sz,
    costas: r.costas * sz,
    largura: r.larg * sy,
    altura: r.altura * sz,
    xNariz: r.xMin * sx,
    xCauda: r.xMax * sx,
    xPataD: r.xPataD * sx,
    xPataT: r.xPataT * sx,
  }
}

/**
 * Contorno de manual para malha com esqueleto (o <Outlines> do drei não acompanha o skinning aqui):
 * casca de faces de trás, empurrada pela normal em pixels de tela (traço igual em qualquer zoom).
 * O modelo é low-poly com normais por face: a casca usa normais suavizadas (vértices soldados), senão abre frestas.
 */
const TRACO_PX = 2.5
function contorno(m: SkinnedMesh, tela: { value: Vector2 }): SkinnedMesh {
  const mat = new MeshBasicMaterial({ color: COR.tinta, side: BackSide })
  mat.onBeforeCompile = (s) => {
    s.uniforms.uTela = tela
    s.vertexShader =
      'uniform vec2 uTela;\n' +
      s.vertexShader.replace(
        '#include <project_vertex>',
        `#include <project_vertex>
vec2 nTela = (projectionMatrix * modelViewMatrix * vec4(objectNormal, 0.0)).xy;
gl_Position.xy += normalize(nTela + 1e-6) * ${TRACO_PX.toFixed(1)} * 2.0 / uTela * gl_Position.w;`,
      )
  }
  const g = m.geometry.clone()
  g.deleteAttribute('normal')
  const soldada = mergeVertices(g, 1e-6)
  soldada.computeVertexNormals()
  const c = new SkinnedMesh(soldada, mat)
  c.bind(m.skeleton, m.bindMatrix)
  c.frustumCulled = false
  return c
}

/** Clona o cão (cada palco tem o seu), troca os materiais pelo traço de manual e mede. */
export function useCao(med: Partial<Medidas>) {
  const { scene, animations } = useGLTF(URL_CAO)
  const base = useMemo(() => {
    const cena = clone(scene)
    // figura de manual: corpo em papel chapado + contorno; o sombreamento em cinzas fica para as peças
    const papel = new MeshBasicMaterial({ color: COR.papel })
    const tinta = new MeshBasicMaterial({ color: COR.tinta })
    const corpos: SkinnedMesh[] = []
    cena.traverse((o) => {
      const m = o as SkinnedMesh
      if (!m.isSkinnedMesh) return
      const nome = (m.material as { name?: string }).name ?? ''
      m.material = nome === 'Black' || nome === 'Eyes_Pupil' || nome === 'Eyes_Black' ? tinta : papel
      m.frustumCulled = false
      if (nome.startsWith('Main')) corpos.push(m)
    })
    const ref = medir(cena)
    const tela = { value: new Vector2(1000, 1000) } // tamanho do canvas em px, atualizado a cada quadro
    for (const m of corpos) m.add(contorno(m, tela))
    return { cena, ref, tela }
  }, [scene])
  const { alturaCostasCm, alturaPernaCm, alturaPernaDianteiraCm, comprimentoCm, larguraCm } = med
  const m = useMemo(
    () => marcos(base.ref, { alturaCostasCm, alturaPernaCm, alturaPernaDianteiraCm, comprimentoCm, larguraCm }),
    [base.ref, alturaCostasCm, alturaPernaCm, alturaPernaDianteiraCm, comprimentoCm, larguraCm],
  )
  return { ...base, animations, marcos: m }
}

export type CaoCarregado = ReturnType<typeof useCao>

/** Desenha o cão: origem no ombro, chão em z=0, cabeça para -X. */
export function Cao3D({ cao, anim = 'Idle' }: { cao: CaoCarregado; anim?: 'Idle' | 'Walk' | 'Idle_2' }) {
  const { actions } = useAnimations(cao.animations, cao.cena)
  useEffect(() => {
    if (movimentoReduzido()) return
    const a = actions[anim]
    a?.reset().fadeIn(0.4).play()
    return () => void a?.fadeOut(0.4)
  }, [actions, anim])
  useFrame(({ size }) => cao.tela.value.set(size.width, size.height))
  const { ref, marcos: m } = cao
  return (
    <group scale={m.esc}>
      <group position={ref.desloc}>
        <group rotation-z={ref.yaw}>
          <group rotation-x={Math.PI / 2}>
            <primitive object={cao.cena} />
          </group>
        </group>
      </group>
    </group>
  )
}
