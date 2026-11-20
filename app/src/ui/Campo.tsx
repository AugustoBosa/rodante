import { useId } from 'react'

interface Props {
  rotulo: string
  valor: number
  onChange: (v: number) => void
  unidade?: string
  ajuda?: string
  erro?: string | null
  passo?: number
  vazioSeZero?: boolean
  id?: string
}

/** Campo numérico com unidade, ajuda e erro ligados por aria. Vazio vira 0. */
export function Campo({ rotulo, valor, onChange, unidade, ajuda, erro, passo = 0.1, vazioSeZero, id }: Props) {
  const auto = useId()
  const cid = id ?? auto
  const desc = [ajuda && `${cid}-ajuda`, erro && `${cid}-erro`].filter(Boolean).join(' ') || undefined
  return (
    <div className="campo" data-erro={!!erro}>
      <label htmlFor={cid}>
        {rotulo}
        {unidade && <span className="visualmente-oculto"> em {unidade}</span>}
      </label>
      <div className="entrada">
        <input
          id={cid}
          type="number"
          inputMode="decimal"
          step={passo}
          value={vazioSeZero && valor === 0 ? '' : valor}
          onChange={(e) => onChange(e.target.value === '' ? 0 : Number(e.target.value))}
          aria-invalid={!!erro}
          aria-describedby={desc}
        />
        {unidade && <span className="un" aria-hidden="true">{unidade}</span>}
      </div>
      {ajuda && <p className="ajuda" id={`${cid}-ajuda`}>{ajuda}</p>}
      {erro && <p className="erro" id={`${cid}-erro`}>{erro}</p>}
    </div>
  )
}
