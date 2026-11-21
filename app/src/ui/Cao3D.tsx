import { useEffect, useMemo } from 'react'
import { useAnimations, useGLTF } from '@react-three/drei'
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js'
import { useFrame } from '@react-three/fiber'
import { BackSide, Group, MeshBasicMaterial, SkinnedMesh, Vector2, Vector3, type AnimationClip, type Object3D } from 'three'
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import type { Medidas, TipoCadeira } from '../model/types'
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
  barriga: number // altura da parte de baixo da barriga, no meio do tronco
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
  // fundo do tronco na linha do meio (entre as patas), num trecho de X: axila, barriga, prega da coxa
  const larg = Math.max(...ys) - Math.min(...ys)
  const fundo = (de: number, ate: number) =>
    Math.min(...tronco.filter((p) => Math.abs(p.y - cy) < larg * 0.18 && p.x > ombro.x + comp * de && p.x < ombro.x + comp * ate).map((p) => p.z)) - z0
  const r: Ref = {
    yaw: yaw.rotation.z,
    desloc: [-ombro.x, -cy, -z0],
    comp,
    costas: Math.max(...dorso.map((p) => p.z)) - z0,
    larg,
    axila: fundo(0.1, 0.3),
    virilha: fundo(0.7, 0.9),
    altura: Math.max(...zs) - z0,
    barriga: fundo(0.25, 0.8),
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
  barriga: number
  xNariz: number
  xCauda: number
  xPataD: number
  xPataT: number
}

const COSTAS_PADRAO_MM = 380 // cão médio quando nada foi medido ainda

/**
 * `apoio`: na cadeira, a altura do cão vem da perna que define o trilho (traseira → prega da coxa,
 * dianteira → axila), para o trilho ficar logo abaixo da barriga como na montagem real.
 */
export function marcos(r: Ref, m: Partial<Medidas>, apoio?: TipoCadeira): Marcos {
  const mm = (cm?: number) => (cm && cm > 0 ? cm * 10 : 0)
  const [costas, pT, pD, comp, larg] = [m.alturaCostasCm, m.alturaPernaCm, m.alturaPernaDianteiraCm, m.comprimentoCm, m.larguraCm].map(mm)
  const pelaPerna = apoio === 'dianteira' ? (pD ? pD / r.axila : 0) : apoio ? (pT ? pT / r.virilha : 0) : 0
  const sz = pelaPerna || (costas ? costas / r.costas : pT ? pT / r.virilha : pD ? pD / r.axila : comp ? comp / r.comp : COSTAS_PADRAO_MM / r.costas)
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
    barriga: r.barriga * sz,
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
const TRACO_PX = 1.6
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
export function useCao(med: Partial<Medidas>, apoio?: TipoCadeira) {
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
    () => marcos(base.ref, { alturaCostasCm, alturaPernaCm, alturaPernaDianteiraCm, comprimentoCm, larguraCm }, apoio),
    [base.ref, alturaCostasCm, alturaPernaCm, alturaPernaDianteiraCm, comprimentoCm, larguraCm, apoio],
  )
  return { ...base, animations, marcos: m }
}

// Ossos de cada par de patas (nomes já sem "." pelo GLTFLoader). IK e alvos de polo entram junto.
const PATAS_TRAS = /^(BackShoulder|BackLeg|BackUpperLeg|BackLowerLeg|IKBackLeg|FFB|PoleTargetBack)/
const PATAS_FRENTE = /^(FrontShoulder|FrontUpperLeg|FrontLowerLeg|IKFrontLeg|FF(?!B)|PoleTarget(?!Back))/

/** Na cadeira, as patas apoiadas nas rodas ficam paradas: tira as trilhas delas da animação. */
function semPatas(clips: AnimationClip[], parado?: TipoCadeira): AnimationClip[] {
  if (!parado) return clips
  const fora = (n: string) => (parado !== 'dianteira' && PATAS_TRAS.test(n)) || (parado !== 'traseira' && PATAS_FRENTE.test(n))
  return clips.map((c) => {
    const k = c.clone()
    k.tracks = k.tracks.filter((t) => !fora(t.name))
    return k
  })
}

export type CaoCarregado = ReturnType<typeof useCao>

/** Desenha o cão: origem no ombro, chão em z=0, cabeça para -X. */
export function Cao3D({ cao, anim = 'Idle', parado }: { cao: CaoCarregado; anim?: 'Idle' | 'Walk' | 'Idle_2'; parado?: TipoCadeira }) {
  const clips = useMemo(() => semPatas(cao.animations, parado), [cao.animations, parado])
  const { actions } = useAnimations(clips, cao.cena)
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
