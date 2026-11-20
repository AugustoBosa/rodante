import { AJUSTES_PADRAO, MATERIAIS_PADRAO } from '../model/defaults'
import type { Materiais, Medidas, Projeto, TipoCadeira } from '../model/types'

// Cão de exemplo (porte médio, ~10 kg) para a vitrine e para o palco antes de medir.
// Valores ilustrativos: a tela sempre rotula como "exemplo".
export const MEDIDAS_EXEMPLO: Medidas = { alturaPernaCm: 24, alturaPernaDianteiraCm: 25, comprimentoCm: 40, larguraCm: 20, alturaCostasCm: 40 }

/** Projeto para o palco: usa o que já foi medido e completa o resto com o exemplo. */
export function projetoProvisorio(tipo: TipoCadeira, medidas: Partial<Medidas> = {}, materiais: Materiais = MATERIAIS_PADRAO): Projeto {
  const m = { ...MEDIDAS_EXEMPLO }
  for (const k of Object.keys(m) as (keyof Medidas)[]) if ((medidas[k] ?? 0) > 0) m[k] = medidas[k]!
  return {
    versao: 1,
    id: 'exemplo',
    criadoEm: '',
    atualizadoEm: '',
    cao: { nome: '', raca: '', pesoKg: 10 },
    tipo,
    metodoMedida: 'deitado-de-lado',
    medidas: m,
    materiais,
    ajustes: AJUSTES_PADRAO,
    avisoVet: true,
  }
}
