import { useRef, useState } from 'react'
import { duplicar, excluir, importar, listar } from '../store'
import { RACAS } from '../data/racas'
import { baixar, slug } from '../saidas'
import { ir } from '../rota'

export function Projetos() {
  const [lista, setLista] = useState(listar)
  const [msg, setMsg] = useState('')
  const arquivo = useRef<HTMLInputElement>(null)
  const atualizar = () => setLista(listar())

  async function aoImportar(files: FileList | null) {
    let n = 0
    for (const f of files ?? []) {
      try {
        n += importar(JSON.parse(await f.text()))
      } catch {
        /* arquivo que não é JSON: conta como 0 */
      }
    }
    setMsg(n ? `${n} projeto(s) importado(s).` : 'Nenhum projeto válido nos arquivos escolhidos. Use o .json exportado pelo Rodante.')
    atualizar()
    if (arquivo.current) arquivo.current.value = ''
  }

  return (
    <div className="pagina">
      <h1>Meus projetos</h1>
      <p className="mudo">Ficam salvos só neste navegador. Para levar a outro aparelho, exporte o arquivo ou copie o link na prancha.</p>
      <div className="acoes">
        <a className="btn btn-primario" href="#/novo">Novo projeto</a>
        <label className="btn">
          Importar .json
          <input ref={arquivo} type="file" accept="application/json,.json" multiple className="visualmente-oculto" onChange={(e) => aoImportar(e.target.files)} />
        </label>
        <button className="btn" disabled={!lista.length} onClick={() => baixar('rodante_projetos.json', JSON.stringify(lista, null, 2), 'application/json')}>
          Exportar todos
        </button>
      </div>
      <p role="status" aria-live="polite" style={{ marginTop: 12 }}>{msg}</p>

      {lista.length === 0 ? (
        <div className="vazio cartao">
          <h2>Nenhum projeto ainda</h2>
          <p>Comece medindo o seu cão. Leva uns 10 minutos.</p>
          <a className="btn btn-primario" href="#/novo">Começar projeto</a>
        </div>
      ) : (
        <ul className="lista-projetos" style={{ listStyle: 'none', padding: 0 }}>
          {lista.map((p) => (
            <li key={p.id} className="cartao">
              <h2 style={{ fontSize: '1.3rem' }}>
                <a href={`#/projeto/${p.id}`}>{p.cao.nome}</a>
              </h2>
              <p className="mono mudo" style={{ fontSize: '0.85rem' }}>
                {RACAS.find((r) => r.id === p.cao.raca)?.nome ?? 'raça não informada'} · {p.cao.pesoKg} kg
                <br />
                perna {p.medidas.alturaPernaCm} · tronco {p.medidas.comprimentoCm} · largura {p.medidas.larguraCm} cm
                <br />
                alterado {p.atualizadoEm ? new Date(p.atualizadoEm).toLocaleDateString('pt-BR') : '—'}
              </p>
              <div className="acoes">
                <a className="btn btn-pequeno" href={`#/projeto/${p.id}`}>Abrir</a>
                <button className="btn btn-pequeno" onClick={() => ir(`projeto/${duplicar(p).id}`)}>Duplicar</button>
                <button className="btn btn-pequeno" onClick={() => baixar(`rodante_${slug(p.cao.nome)}.json`, JSON.stringify(p, null, 2), 'application/json')}>Exportar</button>
                <button
                  className="btn btn-pequeno btn-perigo"
                  onClick={() => {
                    if (confirm(`Excluir o projeto de ${p.cao.nome}? Não dá para desfazer.`)) {
                      excluir(p.id)
                      atualizar()
                    }
                  }}
                >
                  Excluir
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
