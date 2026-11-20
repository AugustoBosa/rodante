/** Roda que anda sobre a fita métrica conforme o progresso (0–1). */
export function Carregando({ fracao, titulo, detalhe }: { fracao: number; titulo: string; detalhe: string }) {
  const x = 10 + fracao * 250
  return (
    <div className="carregando" role="status" aria-live="polite">
      <svg viewBox="0 0 320 90" aria-hidden="true">
        <defs>
          <pattern id="marcas" width="6" height="14" patternUnits="userSpaceOnUse">
            <line x1="0.5" x2="0.5" y1="0" y2="4" stroke="var(--tinta)" strokeWidth="0.8" opacity="0.6" />
          </pattern>
          <pattern id="marcas-grandes" width="30" height="14" patternUnits="userSpaceOnUse">
            <line x1="0.5" x2="0.5" y1="0" y2="8" stroke="var(--tinta)" strokeWidth="1.4" opacity="0.8" />
          </pattern>
        </defs>
        <rect x="10" y="70" width="300" height="14" fill="var(--cinza-1)" />
        <rect x="10" y="70" width={x + 25 - 10} height="14" fill="var(--azul)" />
        <rect x="10" y="70" width="300" height="14" fill="url(#marcas)" />
        <rect x="10" y="70" width="300" height="14" fill="url(#marcas-grandes)" />
        <g className="roda-anda" style={{ transform: `translateX(${x}px)` }}>
          <g className="roda-gira">
            <circle cx="25" cy="45" r="22" fill="var(--papel)" stroke="var(--tinta)" strokeWidth="5" />
            <circle cx="25" cy="45" r="4" fill="var(--tinta)" />
            {[0, 60, 120].map((a) => (
              <line key={a} x1="25" y1="26" x2="25" y2="64" stroke="var(--tinta)" strokeWidth="2" transform={`rotate(${a} 25 45)`} />
            ))}
          </g>
        </g>
      </svg>
      <p className="carregando-titulo">{titulo}…</p>
      <p className="mudo num">{detalhe}</p>
    </div>
  )
}
