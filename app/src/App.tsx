// Spike F1: cotovelo paramétrico → prévia 3D → STL. A interface final vem nas fases F3/F4.
import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { Bounds, OrbitControls } from '@react-three/drei'
import { BufferAttribute, BufferGeometry } from 'three'
import type { ShapeMesh } from 'replicad'
import { cad } from './cad/cliente'
import { COTOVELO_PADRAO, type CotoveloParams } from './cad/parts/cotovelo'

const CAMPOS: [keyof CotoveloParams, string, number][] = [
  ['tuboD', 'Ø externo do tubo (mm)', 0.05],
  ['folga', 'Folga no diâmetro (mm)', 0.05],
  ['parede', 'Parede (mm)', 0.5],
  ['profundidade', 'Profundidade do encaixe (mm)', 1],
  ['angulo', 'Ângulo entre os tubos (°)', 5],
  ['parafusoD', 'Ø do parafuso (mm, 0 = sem furo)', 0.5],
]

function Peca({ mesh }: { mesh: ShapeMesh }) {
  const geo = useMemo(() => {
    const g = new BufferGeometry()
    g.setAttribute('position', new BufferAttribute(new Float32Array(mesh.vertices), 3))
    g.setAttribute('normal', new BufferAttribute(new Float32Array(mesh.normals), 3))
    g.setIndex(mesh.triangles)
    return g
  }, [mesh])
  return (
    <mesh geometry={geo}>
      <meshStandardMaterial color="#c9774f" />
    </mesh>
  )
}

export default function App() {
  const [p, setP] = useState(COTOVELO_PADRAO)
  const [res, setRes] = useState<{ mesh: ShapeMesh; stl: Blob } | null>(null)
  const [erro, setErro] = useState('')
  const pedido = useRef(0)

  useEffect(() => {
    const id = ++pedido.current
    setErro('')
    cad
      .cotovelo(p)
      .then((r) => id === pedido.current && setRes(r))
      .catch((e) => id === pedido.current && setErro(String(e)))
  }, [p])

  const baixar = () => {
    if (!res) return
    const a = document.createElement('a')
    a.href = URL.createObjectURL(res.stl)
    a.download = `cotovelo_${p.tuboD}mm_${p.angulo}graus_folga${p.folga}.stl`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  return (
    <main style={{ display: 'grid', gridTemplateColumns: 'minmax(260px, 320px) 1fr', minHeight: '100vh' }}>
      <form style={{ padding: 16, display: 'grid', gap: 12, alignContent: 'start', borderRight: '1px solid var(--line)' }}>
        <h1 style={{ fontSize: 20, margin: 0 }}>Cotovelo — spike CAD</h1>
        {CAMPOS.map(([k, rotulo, passo]) => (
          <label key={k} style={{ display: 'grid', gap: 4, fontSize: 14 }}>
            {rotulo}
            <input
              type="number"
              step={passo}
              min={0}
              value={p[k]}
              onChange={(e) => e.target.value !== '' && setP({ ...p, [k]: Number(e.target.value) })}
              style={{ font: 'inherit', padding: 8, fontFamily: 'ui-monospace, monospace' }}
            />
          </label>
        ))}
        <button
          type="button"
          onClick={baixar}
          disabled={!res}
          style={{ font: 'inherit', padding: 12, background: 'var(--accent)', color: '#fff', border: 0, borderRadius: 8, cursor: 'pointer' }}
        >
          Baixar STL
        </button>
        <p style={{ color: 'var(--muted)', fontSize: 13, margin: 0 }}>
          {erro || (res ? `STL: ${(res.stl.size / 1024).toFixed(0)} KB` : 'Carregando motor CAD…')}
        </p>
      </form>
      <div style={{ minHeight: 360 }}>
        <Canvas camera={{ position: [80, 80, 80], up: [0, 0, 1] }}>
          <ambientLight intensity={0.6} />
          <directionalLight position={[100, 50, 200]} intensity={1.5} />
          {res && (
            <Bounds fit clip observe margin={1.4}>
              <Peca mesh={res.mesh} />
            </Bounds>
          )}
          <OrbitControls makeDefault />
        </Canvas>
      </div>
    </main>
  )
}
