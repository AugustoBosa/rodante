// Botões de calibração. Nenhum destes valores tem fonte validada (ver wiki 02/07):
// ajustar com impressão, montagem e, se possível, revisão de fisioterapeuta veterinário.
import type { Ajustes, Materiais, Medidas } from './types'

export const LIMITE_PESO_KG = 40 // acima disso: recomendar fabricante profissional
export const SEGMENTO_MIN_MM = 20 // tubo mais curto que isso não monta
export const FOLGA_LATERAL_MIN_CM = 1.5
export const PVC_PESO_MAX_KG = 12
export const DIFERENCA_PERNAS_MAX = 0.15 // 4 rodas: acima disso o quadro nivelado fica torto para o cão

// ponytail: tabela heurística peso → Ø mínimo de tubo de alumínio; trocar por teste de carga
export const TUBO_MIN_POR_PESO: [pesoAteKg: number, tuboMinD: number][] = [
  [8, 12.7], // 1/2"
  [18, 15.88], // 5/8"
  [28, 19.05], // 3/4"
  [40, 22.22], // 7/8"
]

export function tuboMinimo(pesoKg: number): number {
  return (TUBO_MIN_POR_PESO.find(([ate]) => pesoKg <= ate) ?? TUBO_MIN_POR_PESO.at(-1)!)[1]
}

export const MATERIAIS_PADRAO: Materiais = {
  tubo: 'aluminio',
  tuboD: 19.05,
  tuboParede: 1.5,
  rodaD: 150,
  rodaLargura: 35,
  eixoD: 8,
  parafusoD: 5,
}

export const AJUSTES_PADRAO: Ajustes = {
  folgaLateralCm: 3,
  ajusteAlturaCm: 2,
  extensaoTraseiraMm: 60,
  folgaImpressao: 0.4, // calibrar com o cotovelo de teste (F1)
  paredeConexao: 3,
  profundidade: 30,
}

export const MEDIDAS_VAZIAS: Medidas = { alturaPernaCm: 0, alturaPernaDianteiraCm: 0, comprimentoCm: 0, larguraCm: 0, alturaCostasCm: 0 }

/** Faixas aceitas na entrada [min, max]. Fora disso o campo é inválido. */
export const LIMITES = {
  pesoKg: [1, 80],
  alturaPernaCm: [8, 80],
  alturaPernaDianteiraCm: [8, 80],
  comprimentoCm: [15, 110],
  larguraCm: [8, 60],
  alturaCostasCm: [15, 100],
  tuboD: [8, 40],
  tuboParede: [0.5, 5],
  rodaD: [50, 400],
  rodaLargura: [10, 80],
  eixoD: [4, 20],
  parafusoD: [0, 10],
  folgaLateralCm: [0, 10],
  ajusteAlturaCm: [-5, 10],
  extensaoTraseiraMm: [30, 200],
  folgaImpressao: [0, 2],
  paredeConexao: [2, 8],
  profundidade: [15, 80],
} as const satisfies Record<string, readonly [number, number]>

export const FITA_L = 25 // mm, fita de nylon da sela
