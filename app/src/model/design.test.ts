import { expect, test } from 'vitest'
import { computeDesign, recuo } from './design'
import { bom, cintas, comprados, cortes, csv } from './bom'
import { AJUSTES_PADRAO, MATERIAIS_PADRAO } from './defaults'
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
  for (const p of [dachshund, srd, labrador]) {
    const d = computeDesign(p)
    expect(erros(p)).toEqual([])
    expect(d.tubos).toHaveLength(13)
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
  expect(d.rodas.every((r) => r.pos[0] === AJUSTES_PADRAO.extensaoTraseiraMm)).toBe(true) // eixo sob o ombro
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
