export type V3 = [number, number, number]

export interface Cao {
  nome: string
  raca: string // id em data/racas.ts ou '' (não informada)
  pesoKg: number
}

/** Medidas do cão em cm, método "deitado de lado" (ver wiki 02). */
export interface Medidas {
  alturaPernaCm: number // prega da coxa → almofada da pata, deitado de lado
  comprimentoCm: number // meio do ombro → meio do quadril
  larguraCm: number // ponto mais largo do corpo
  alturaCostasCm: number // costas → chão, em pé
}

/** Materiais que o usuário tem. Tudo em mm. */
export interface Materiais {
  tubo: 'aluminio' | 'pvc'
  tuboD: number // Ø externo
  tuboParede: number
  rodaD: number
  rodaLargura: number
  eixoD: number // Ø do parafuso-eixo da roda
  parafusoD: number // parafuso que trava o tubo na conexão (0 = sem)
}

/** Botões de calibração (modo Avançado). */
export interface Ajustes {
  folgaLateralCm: number // por lado, entre o corpo e o quadro
  ajusteAlturaCm: number // abaixa o quadro para começar mais baixo
  extensaoTraseiraMm: number // trilho além do eixo até a barra traseira
  folgaImpressao: number // mm no diâmetro dos encaixes
  paredeConexao: number // mm
  profundidade: number // mm que o tubo entra na conexão
}

export interface Projeto {
  versao: 1
  id: string
  criadoEm: string
  atualizadoEm: string
  cao: Cao
  tipo: 'traseira'
  metodoMedida: 'deitado-de-lado'
  medidas: Medidas
  materiais: Materiais
  ajustes: Ajustes
  avisoVet: boolean
}

export interface ParamsImpressao {
  tuboD: number
  folga: number
  parede: number
  profundidade: number
  parafusoD: number
}

export type SpecPeca = ParamsImpressao &
  (
    | { tipo: 'cotovelo' | 'te'; angulo: number }
    | { tipo: 'suporteEixo'; eixoD: number }
    | { tipo: 'ponteira' }
    | { tipo: 'clipSela'; fitaL: number }
  )

export interface Tubo {
  nome: string
  a: V3 // ponta do tubo (já descontado o encaixe)
  b: V3
  comprimento: number // mm de corte
}

/** Conexão posicionada: origem local em `pos`, eixos locais X=ex, Y=ey, Z=ex×ey. */
export interface Junta {
  spec: SpecPeca
  pos: V3
  ex: V3
  ey: V3
}

export interface Alerta {
  nivel: 'erro' | 'aviso' | 'info'
  texto: string
}

export interface PecaLista {
  chave: string
  nome: string
  spec: SpecPeca
  qtd: number
}

export interface Design {
  tubos: Tubo[]
  juntas: Junta[]
  rodas: { pos: V3; d: number; largura: number }[]
  pecas: PecaLista[]
  alertas: Alerta[]
  cotas: {
    alturaTrilho: number
    comprimentoTrilho: number
    larguraInterna: number
    larguraTotal: number
    alturaEixo: number
  }
}
