import { useEffect, useRef } from 'react'
import { tr } from '../i18n'

// Aviso de projeto em desenvolvimento: abre uma vez por aba/sessão.
const CHAVE = 'rodante.aviso'
const jaViu = () => {
  try {
    return sessionStorage.getItem(CHAVE) === '1'
  } catch {
    return false
  }
}

export function AvisoDev() {
  const d = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    if (!jaViu()) d.current?.showModal()
  }, [])
  const fechar = () => {
    try {
      sessionStorage.setItem(CHAVE, '1')
    } catch {
      /* sem storage: aparece de novo ao recarregar */
    }
    d.current?.close()
  }
  return (
    <dialog ref={d} className="aviso" aria-labelledby="aviso-t" onCancel={fechar}>
      <h2 id="aviso-t">{tr('Projeto em desenvolvimento', 'Project in development')}</h2>
      <p>
        {tr(
          'O Rodante ainda está sendo construído: há muito a melhorar e corrigir. Qualquer sugestão é bem-vinda!',
          'Rodante is still being built: there is a lot left to improve and fix. Any suggestion is welcome!',
        )}
      </p>
      <div className="aviso-acoes">
        <a className="btn" href="https://github.com/AugustoBosa/rodante/issues/new" target="_blank" rel="noreferrer">
          {tr('Enviar sugestão', 'Send a suggestion')}
        </a>
        <button type="button" className="btn btn-primario" autoFocus onClick={fechar}>
          {tr('Entendi', 'Got it')}
        </button>
      </div>
    </dialog>
  )
}
