import { useEffect, useMemo, useState } from 'react'
import type { ShapeMesh } from 'replicad'
import { proxy } from 'comlink'
import { cad } from '../cad/cliente'
import type { Design } from '../model/types'
import { tr } from '../i18n'

/** Liga o motor CAD (uma vez) e gera as peças do projeto no worker, com espera curta entre mudanças. */
export function usePecas(d: Design | null, ligar = true) {
  const [pecas, setPecas] = useState<Record<string, { mesh: ShapeMesh; stl: Blob }>>({})
  const [erro, setErro] = useState('')
  const [carga, setCarga] = useState(0)

  useEffect(() => {
    if (!ligar) return
    cad
      .iniciar(proxy((f: number) => setCarga(f)))
      .then(() => setCarga(1))
      .catch((e) => setErro(String(e)))
  }, [ligar])

  const chaves = d?.pecas.map((pc) => pc.chave).join('|') ?? ''
  useEffect(() => {
    if (!d || !ligar) return
    let vivo = true
    const t = setTimeout(() => {
      for (const pc of d.pecas)
        cad
          .peca(pc.spec)
          .then((r) => vivo && setPecas((x) => ({ ...x, [pc.chave]: r })))
          .catch((e) => vivo && setErro(tr(`Falha ao gerar ${pc.nome}: ${e}`, `Failed to generate ${pc.nome}: ${e}`)))
    }, 300)
    return () => {
      vivo = false
      clearTimeout(t)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chaves, ligar])

  const meshes = useMemo(() => Object.fromEntries(Object.entries(pecas).map(([k, v]) => [k, v.mesh])), [pecas])
  const prontas = !!d && d.pecas.every((pc) => pecas[pc.chave])
  const feitas = d ? d.pecas.filter((pc) => pecas[pc.chave]).length : 0
  return { pecas, meshes, erro, carga, prontas, feitas }
}
