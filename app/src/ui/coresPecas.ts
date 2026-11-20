import type { SpecPeca } from '../model/types'

// Uma cor por tipo de peça impressa: a mesma no 3D, no inventário, na lista e nas miniaturas.
// Tons médios que leem no claro e no escuro; nenhum é o azul de ação (destaque) nem o vermelho de erro.
const COR_TIPO = {
  ponteira: '#d08c3c', // ocre
  cotovelo: '#5f9e6e', // verde
  te90: '#cf6f5a', // terracota
  te45: '#8e7cc3', // lilás
  suporteEixo: '#3f8f98', // petróleo
  clipSela: '#c4648f', // rosa
} as const

export function corPeca(s: SpecPeca): string {
  if (s.tipo === 'te') return s.angulo >= 90 ? COR_TIPO.te90 : COR_TIPO.te45
  return COR_TIPO[s.tipo]
}

/** Cintas, arnês e sela (fita de nylon): cor de tecido, longe das cores das peças. */
export const COR_CINTA = '#3b3a46'
