import type { Design } from '../model/types'
import { DICA_IMPRESSAO } from '../saidas'
import { tr } from '../i18n'
import { MiniPeca } from './Vista3D'
import { usePecas } from './usePecas'
import { corPeca } from './coresPecas'

/** Inventário das peças impressas, cada uma girando em 3D quando o motor CAD termina. */
export default function PecasVitrine({ d, ligar }: { d: Design; ligar: boolean }) {
  const { pecas, carga } = usePecas(d, ligar)
  return (
    <ul className="inventario" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
      {d.pecas.map((pc) => (
        <li key={pc.chave} className="item-peca entra">
          <div className="mini">
            <span className="qtd" aria-label={tr('{qtd} unidades', '{qtd} units', { qtd: pc.qtd })}>×{pc.qtd}</span>
            {pecas[pc.chave] ? (
              <MiniPeca mesh={pecas[pc.chave].mesh} cor={corPeca(pc.spec)} rotulo={pc.nome} />
            ) : (
              <span className="esboco">{carga < 1 ? tr('motor de desenho {v}%', 'drawing engine {v}%', { v: Math.round(carga * 100) }) : tr('desenhando…', 'drawing…')}</span>
            )}
          </div>
          <div className="legenda">
            <h3><span className="amostra" style={{ background: corPeca(pc.spec) }} aria-hidden="true" />{pc.nome}</h3>
            <p>{DICA_IMPRESSAO[pc.spec.tipo]}</p>
          </div>
        </li>
      ))}
    </ul>
  )
}
