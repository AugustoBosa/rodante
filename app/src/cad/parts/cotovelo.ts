import { makeCylinder, makeSphere, type Shape3D } from 'replicad'

/** Medidas em mm. `folga` e `parede` são botões de calibração: ajustar após imprimir. */
export interface CotoveloParams {
  tuboD: number // Ø externo real do tubo (medir com paquímetro)
  folga: number // folga no diâmetro do encaixe (ajuste por impressora)
  parede: number // espessura da parede da conexão
  profundidade: number // quanto o tubo entra na conexão
  angulo: number // ângulo entre os tubos, 30–180 (90 = "L", 180 = luva reta)
  parafusoD: number // Ø do parafuso que trava o tubo (0 = sem furo)
}

export const COTOVELO_PADRAO: CotoveloParams = {
  tuboD: 19.05, // 3/4", comum em alumínio no BR
  folga: 0.4,
  parede: 3,
  profundidade: 30,
  angulo: 90,
  parafusoD: 5, // M5
}

const BATENTE = 2 // mm de material entre o fim do tubo e o miolo

/** Distância do centro até onde o tubo encosta; evita que os dois furos se cruzem. */
export function batente(p: CotoveloParams): number {
  const ri = (p.tuboD + p.folga) / 2
  const meio = ((Math.min(Math.max(p.angulo, 30), 180) / 2) * Math.PI) / 180
  return (meio >= Math.PI / 2 - 1e-9 ? 0 : ri / Math.tan(meio)) + BATENTE
}

export function cotovelo(p: CotoveloParams): Shape3D {
  const ri = (p.tuboD + p.folga) / 2
  const ro = ri + p.parede
  const s = batente(p)
  const comp = s + p.profundidade
  const angulo = Math.min(Math.max(p.angulo, 30), 180)

  // braço ao longo de +X: casca, furo do tubo e furo do parafuso
  const casca = () => makeCylinder(ro, comp, [0, 0, 0], [1, 0, 0])
  const furo = () => {
    let f: Shape3D = makeCylinder(ri, p.profundidade + 1, [s, 0, 0], [1, 0, 0])
    if (p.parafusoD > 0) {
      const r = (p.parafusoD + p.folga) / 2
      f = f.fuse(makeCylinder(r, 2 * ro + 2, [s + p.profundidade / 2, 0, -ro - 1], [0, 0, 1]))
    }
    return f
  }

  return makeSphere(ro)
    .fuse(casca())
    .fuse(casca().rotate(angulo, [0, 0, 0], [0, 0, 1]))
    .cut(furo())
    .cut(furo().rotate(angulo, [0, 0, 0], [0, 0, 1]))
}
