import { expect, test } from 'vitest'
import { alcance, comprimentoClip, computeDesign, pvcPeloPeso, recuo } from './design'
import { bom, cintas, comprados, cortes, csv } from './bom'
import { AJUSTES_PADRAO, FITA_L, GARUPA_FRACAO, MATERIAIS_PADRAO, PEITO_FRACAO, SEGMENTO_MIN_MM } from './defaults'
import type { Projeto } from './types'

const projeto = (over: { peso: number; raca: string; perna: number; comp: number; larg: number; costas: number }, mat = {}): Projeto => ({
  versao: 1,
  id: 't',
  criadoEm: '',
  atualizadoEm: '',
  cao: { nome: 'Teste', raca: over.raca, pesoKg: over.peso },
  tipo: 'traseira',
  metodoMedida: 'deitado-de-lado',
  medidas: { alturaPernaCm: over.perna, alturaPernaDianteiraCm: 0, comprimentoCm: over.comp, larguraCm: over.larg, alturaCostasCm: over.costas },
  materiais: { ...MATERIAIS_PADRAO, ...mat },
  ajustes: AJUSTES_PADRAO,
  avisoVet: true,
})

const dachshund = projeto({ peso: 8, raca: 'dachshund', perna: 18, comp: 35, larg: 16, costas: 22 }, { tuboD: 12.7, rodaD: 100 })
const srd = projeto({ peso: 20, raca: 'srd', perna: 35, comp: 50, larg: 24, costas: 48 })
const labrador = projeto({ peso: 35, raca: 'labrador', perna: 45, comp: 65, larg: 32, costas: 58 }, { tuboD: 22.22, rodaD: 250 })
const erros = (p: Projeto) => computeDesign(p).alertas.filter((a) => a.nivel === 'erro')

test('casos típicos montam sem erro e com cortes positivos', () => {
  for (const [p, n] of [[dachshund, 7], [srd, 13], [labrador, 13]] as const) {
    const d = computeDesign(p)
    expect(erros(p)).toEqual([])
    expect(d.tubos).toHaveLength(n) // cão baixo: sem diagonal
    for (const t of d.tubos) expect(t.comprimento).toBeGreaterThanOrEqual(20)
  }
})

test('altura do trilho = perna − ajuste; eixo = raio da roda', () => {
  const d = computeDesign(srd)
  expect(d.cotas.alturaTrilho).toBe((35 - AJUSTES_PADRAO.ajusteAlturaCm) * 10)
  expect(d.cotas.alturaEixo).toBe(75)
})

test('corte = distância entre centros − recuos das duas conexões', () => {
  const d = computeDesign(srd)
  const barra = d.tubos.find((t) => t.nome === 'Barra traseira')!
  const cot = d.juntas.find((j) => j.spec.tipo === 'cotovelo')!.spec
  const yC = Math.abs(d.juntas.find((j) => j.spec.tipo === 'cotovelo')!.pos[1])
  expect(barra.comprimento).toBe(Math.round(2 * yC - 2 * recuo(cot)))
})

test('roda grande demais vira erro', () => {
  expect(erros({ ...dachshund, materiais: { ...dachshund.materiais, rodaD: 300 } })).toHaveLength(1)
})

test('peso acima do limite vira erro; tubo fino vira aviso', () => {
  const pesado = { ...labrador, cao: { ...labrador.cao, pesoKg: 45 } }
  expect(erros(pesado).some((a) => a.texto.includes('40 kg'))).toBe(true)
  const fino = computeDesign({ ...labrador, materiais: { ...labrador.materiais, tuboD: 12.7 } })
  expect(fino.alertas.some((a) => a.nivel === 'aviso' && a.texto.includes('Tubo fino'))).toBe(true)
})

test('folga lateral pequena vira aviso', () => {
  const d = computeDesign({ ...srd, ajustes: { ...srd.ajustes, folgaLateralCm: 0.5 } })
  expect(d.alertas.some((a) => a.texto.includes('Folga lateral'))).toBe(true)
})

test('peças agrupadas: 2 tê90, 4 tê45, 2 cotovelos, 2 suportes, 2 ponteiras, 4 clips', () => {
  const qtd = Object.fromEntries(computeDesign(srd).pecas.map((p) => [p.nome, p.qtd]))
  expect(qtd).toEqual({ 'Tê 90°': 2, 'Tê 45°': 4, 'Cotovelo 90°': 2, 'Suporte do eixo': 2, 'Ponteira com passador': 2, 'Clip da sela': 4 })
})

test('cortes somam os tubos; BOM e CSV saem', () => {
  const d = computeDesign(srd)
  const soma = cortes(d).reduce((s, c) => s + c.qtd * c.comprimento, 0)
  expect(soma).toBe(d.tubos.reduce((s, t) => s + t.comprimento, 0))
  const linhas = bom(srd, d)
  expect(linhas.find((l) => l.item.startsWith('Parafuso de trava'))!.qtd).toBe(2 * 3 + 4 * 3 + 2 * 2 + 2 + 2)
  const texto = csv(linhas as never)
  expect(texto.startsWith('﻿item;especificacao;qtd;un;obs')).toBe(true)
})

test('dianteira: espelho da traseira, ponteira atrás e barra na frente', () => {
  const p: Projeto = { ...srd, tipo: 'dianteira', medidas: { ...srd.medidas, alturaPernaDianteiraCm: 36 } }
  const d = computeDesign(p)
  expect(erros(p)).toEqual([])
  expect(d.tubos).toHaveLength(13)
  expect(d.tubos.some((t) => t.nome === 'Barra dianteira')).toBe(true)
  expect(d.cotas.alturaTrilho).toBe((36 - AJUSTES_PADRAO.ajusteAlturaCm) * 10)
  expect(d.rodas[0].pos[0]).toBeGreaterThanOrEqual(PEITO_FRACAO * 500) // barra à frente do peito
  expect(d.rodas.every((r) => r.pos[0] === d.rodas[0].pos[0])).toBe(true) // um eixo, sob o ombro
})

test('quatro rodas: dois eixos, duas barras, sem ponteira, nivelado pela perna mais curta', () => {
  const p: Projeto = { ...srd, tipo: 'quatro', medidas: { ...srd.medidas, alturaPernaDianteiraCm: 38 } }
  const d = computeDesign(p)
  expect(erros(p)).toEqual([])
  expect(d.rodas).toHaveLength(4)
  expect(d.tubos).toHaveLength(24)
  for (const t of d.tubos) expect(t.comprimento).toBeGreaterThanOrEqual(20)
  const qtd = Object.fromEntries(d.pecas.map((pc) => [pc.nome, pc.qtd]))
  expect(qtd).toEqual({ 'Tê 90°': 4, 'Tê 45°': 8, 'Cotovelo 90°': 4, 'Suporte do eixo': 4, 'Clip da sela': 8 })
  expect(d.cotas.alturaTrilho).toBe((35 - AJUSTES_PADRAO.ajusteAlturaCm) * 10)
  const torto = computeDesign({ ...p, medidas: { ...p.medidas, alturaPernaDianteiraCm: 50 } })
  expect(torto.alertas.some((a) => a.texto.includes('muito diferentes'))).toBe(true)
})

test('cintas: uma por par de clips, uma ligação por ponteira, fita somada na lista', () => {
  const d = computeDesign(srd)
  const c = cintas(srd, d)
  expect(c.sela).toBe(2) // traseira: 2 pares de clips
  expect(c.ligacoes).toBe(2) // 2 ponteiras → peitoral
  expect(c.selaMm).toBe(Math.round(240 * 1.6 + 2 * 30 + 160))
  expect(c.fitaM).toBeCloseTo(Math.ceil(((2 * c.selaMm + 2 * c.ligacaoMm) * 1.1) / 100) / 10)
  const fita = comprados(srd, d).find((l) => l.un === 'm')!
  expect(fita.qtd).toBe(c.fitaM)
  expect(comprados(srd, d).some((l) => /impresso|printed/.test(l.item))).toBe(false)
})

test('nenhuma peça se sobrepõe: entre duas bocas sobra tubo e os clips ficam no tubo livre', () => {
  const prof = AJUSTES_PADRAO.profundidade
  const cl = comprimentoClip({ fitaL: FITA_L })
  for (const base of [dachshund, srd, labrador])
    for (const tipo of ['traseira', 'dianteira', 'quatro'] as const) {
      const p: Projeto = { ...base, tipo, medidas: { ...base.medidas, alturaPernaDianteiraCm: base.medidas.alturaPernaCm } }
      const d = computeDesign(p)
      expect(erros(p), `${base.cao.raca} ${tipo}`).toEqual([])
      // cada ponta de tubo entra `prof` na boca: o que sobra é o tubo visível entre duas conexões
      for (const t of d.tubos) expect(t.comprimento - 2 * prof, `${base.cao.raca} ${tipo} ${t.nome}`).toBeGreaterThanOrEqual(SEGMENTO_MIN_MM - 0.5)
      const H = d.juntas.find((j) => j.spec.tipo === 'clipSela')!.pos[2]
      for (const y of [-1, 1]) {
        const noTrilho = d.juntas.filter((j) => Math.sign(j.pos[1]) === y && j.pos[2] === H)
        const clips = noTrilho.filter((j) => j.spec.tipo === 'clipSela').map((j) => [j.pos[0], j.pos[0] + cl])
        const outras = noTrilho.filter((j) => j.spec.tipo !== 'clipSela').map((j) => [j.pos[0] - alcance(j.spec), j.pos[0] + alcance(j.spec)])
        for (const [a, b] of clips) {
          for (const [c, e] of [...outras, ...clips.filter(([x]) => x !== a)])
            expect(b <= c || e <= a, `${base.cao.raca} ${tipo}: clip em ${a} encosta em [${c}, ${e}]`).toBe(true)
        }
      }
    }
})

test('diagonal só quando cabe: cão baixo sai sem tê 45° e com aviso', () => {
  const baixo = computeDesign(dachshund)
  expect(baixo.pecas.some((pc) => pc.spec.tipo === 'te' && pc.spec.angulo === 45)).toBe(false)
  expect(baixo.alertas.some((a) => a.nivel === 'aviso' && a.texto.includes('diagonal'))).toBe(true)
  const alto = computeDesign(srd)
  expect(alto.pecas.some((pc) => pc.spec.tipo === 'te' && pc.spec.angulo === 45)).toBe(true)
  expect(alto.alertas.some((a) => a.texto.includes('diagonal'))).toBe(false)
})

test('barras fora do corpo: atrás da garupa e à frente do peito', () => {
  const L = 500
  const tras = computeDesign(srd)
  expect(tras.cotas.comprimentoTrilho - tras.rodas[0].pos[0]).toBeGreaterThanOrEqual(GARUPA_FRACAO * L)
  const quatro = computeDesign({ ...srd, tipo: 'quatro', medidas: { ...srd.medidas, alturaPernaDianteiraCm: 35 } })
  const xs = quatro.rodas.map((r) => r.pos[0])
  expect(Math.min(...xs)).toBeGreaterThanOrEqual(PEITO_FRACAO * L)
  expect(quatro.cotas.comprimentoTrilho - Math.max(...xs)).toBeGreaterThanOrEqual(GARUPA_FRACAO * L)
})

test('PVC pelo peso: até 12 kg livre, até 15 kg com aviso, acima bloqueia', () => {
  const comPvc = (pesoKg: number) => computeDesign({ ...dachshund, cao: { ...dachshund.cao, pesoKg }, materiais: { ...dachshund.materiais, tubo: 'pvc' } }).alertas
  expect(pvcPeloPeso(12)).toBe('ok')
  expect(pvcPeloPeso(14)).toBe('aviso')
  expect(pvcPeloPeso(15.5)).toBe('bloqueado')
  expect(comPvc(10).some((a) => a.texto.includes('PVC'))).toBe(false)
  expect(comPvc(14).some((a) => a.nivel === 'aviso' && a.texto.includes('PVC'))).toBe(true)
  expect(comPvc(20).some((a) => a.nivel === 'erro' && a.texto.includes('PVC'))).toBe(true)
})
