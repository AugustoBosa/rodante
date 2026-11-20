import { useRef, useState } from 'react'
import { Copy, Download, Plus, Trash2, Upload } from 'lucide-react'
import { duplicar, excluir, importar, listar } from '../store'
import { RACAS, nomeRaca } from '../data/racas'
import { baixar, slug } from '../saidas'
import { ir } from '../rota'
import { Miniatura } from './Miniatura'
import { LETRA_TIPO, TIPOS } from '../model/design'
import { dataLocal, tr } from '../i18n'
import type { Projeto } from '../model/types'


/** Pernas medidas, conforme o tipo: a traseira, a dianteira ou as duas. */
function pernas(p: Projeto): string {
  const d = p.medidas.alturaPernaDianteiraCm
  const t = p.medidas.alturaPernaCm
  if (p.tipo === 'dianteira') return `${tr('perna dianteira', 'front leg')} ${d}`
  if (p.tipo === 'quatro') return `${tr('pernas', 'legs')} ${d}/${t}`
  return `${tr('perna', 'leg')} ${t}`
}

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
    setMsg(
      n
        ? tr(`${n} projeto(s) importado(s).`, `${n} project(s) imported.`)
        : tr('Nenhum projeto válido nos arquivos escolhidos. Use o .json exportado pelo Rodante.', 'No valid project in the chosen files. Use the .json exported by Rodante.'),
    )
    atualizar()
    if (arquivo.current) arquivo.current.value = ''
  }

  return (
    <div className="projetos">
      <header>
        <div>
          <h1>{tr('Meus projetos', 'My projects')}</h1>
          <p>
            {tr(
              'Ficam salvos só neste navegador. Para levar a outro aparelho, exporte o arquivo ou copie o link na prancha.',
              'Saved only in this browser. To move them to another device, export the file or copy the link on the drawing board.',
            )}
          </p>
        </div>
        <div className="acoes">
          <a className="btn btn-primario" href="#/novo">
            <Plus className="ico" aria-hidden="true" />
            {tr('Novo projeto', 'New project')}
          </a>
          <label className="btn">
            <Upload className="ico" aria-hidden="true" />
            {tr('Importar .json', 'Import .json')}
            <input ref={arquivo} type="file" accept="application/json,.json" multiple className="visualmente-oculto" onChange={(e) => aoImportar(e.target.files)} />
          </label>
          <button className="btn" disabled={!lista.length} onClick={() => baixar(tr('rodante_projetos.json', 'rodante_projects.json'), JSON.stringify(lista, null, 2), 'application/json')}>
            <Download className="ico" aria-hidden="true" />
            {tr('Exportar todos', 'Export all')}
          </button>
        </div>
      </header>
      <p role="status" aria-live="polite">
        {msg}
      </p>

      {lista.length === 0 ? (
        <div className="vazio">
          <h2>{tr('Nenhum projeto ainda', 'No projects yet')}</h2>
          <p>{tr('Comece medindo o seu cão. Leva uns 10 minutos.', 'Start by measuring your dog. It takes about 10 minutes.')}</p>
          <a className="btn btn-primario" href="#/novo">
            {tr('Começar projeto', 'Start a project')}
          </a>
        </div>
      ) : (
        <ul className="lista-projetos">
          {lista.map((p) => {
            const raca = RACAS.find((r) => r.id === p.cao.raca)
            return (
              <li key={p.id} className="cartao-projeto entra">
                <span className="tipo-letra" aria-hidden="true">{LETRA_TIPO[p.tipo]}</span>
                <div className="capa-mini">
                  <Miniatura p={p} />
                </div>
                <div className="corpo">
                  <h2>
                    <a href={`#/projeto/${p.id}`}>{p.cao.nome}</a>
                  </h2>
                  <p className="ficha">
                    {TIPOS.find((t) => t.id === p.tipo)!.nome} · {raca ? nomeRaca(raca) : tr('raça não informada', 'breed not given')} · {p.cao.pesoKg} kg
                    <br />
                    {pernas(p)} · {tr('tronco', 'body')} {p.medidas.comprimentoCm} · {tr('largura', 'width')} {p.medidas.larguraCm} cm
                    <br />
                    {tr('alterado', 'changed')} {p.atualizadoEm ? dataLocal(p.atualizadoEm) : '—'}
                  </p>
                </div>
                <div className="acoes">
                  <button className="btn btn-pequeno" onClick={() => ir(`projeto/${duplicar(p).id}`)}>
                    <Copy className="ico" aria-hidden="true" />
                    {tr('Duplicar', 'Duplicate')}
                  </button>
                  <button className="btn btn-pequeno" onClick={() => baixar(`rodante_${slug(p.cao.nome)}.json`, JSON.stringify(p, null, 2), 'application/json')}>
                    <Download className="ico" aria-hidden="true" />
                    {tr('Exportar', 'Export')}
                  </button>
                  <button
                    className="btn btn-pequeno btn-perigo"
                    aria-label={tr(`Excluir o projeto de ${p.cao.nome}`, `Delete the project for ${p.cao.nome}`)}
                    onClick={() => {
                      if (confirm(tr(`Excluir o projeto de ${p.cao.nome}? Não dá para desfazer.`, `Delete the project for ${p.cao.nome}? This cannot be undone.`))) {
                        excluir(p.id)
                        atualizar()
                      }
                    }}
                  >
                    <Trash2 className="ico" aria-hidden="true" />
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
