// Faixas aproximadas dos padrões de raça (peso e altura na cernelha).
// Servem só para sugerir e alertar; a medida do usuário é sempre a fonte (wiki 04).
export interface Raca {
  id: string
  nome: string
  en?: string // nome em inglês, quando difere
  pesoKg?: [number, number]
  alturaCm?: [number, number]
  fonte: string
}

import { tr } from '../i18n'

const AKC = tr('Padrão de raça AKC (aprox.)', 'AKC breed standard (approx.)')

export const RACAS: Raca[] = [
  { id: 'srd', nome: 'SRD (vira-lata)', en: 'Mixed breed', fonte: '—' },
  { id: 'basset', nome: 'Basset Hound', pesoKg: [18, 29], alturaCm: [30, 38], fonte: AKC },
  { id: 'beagle', nome: 'Beagle', pesoKg: [9, 14], alturaCm: [33, 38], fonte: AKC },
  { id: 'border', nome: 'Border Collie', pesoKg: [14, 20], alturaCm: [46, 56], fonte: AKC },
  { id: 'boxer', nome: 'Boxer', pesoKg: [25, 32], alturaCm: [53, 64], fonte: AKC },
  { id: 'bulldog-frances', nome: 'Buldogue Francês', en: 'French Bulldog', pesoKg: [8, 13], alturaCm: [28, 33], fonte: AKC },
  { id: 'cocker', nome: 'Cocker Spaniel Inglês', en: 'English Cocker Spaniel', pesoKg: [12, 15], alturaCm: [38, 41], fonte: AKC },
  { id: 'corgi', nome: 'Corgi Pembroke', pesoKg: [10, 14], alturaCm: [25, 30], fonte: AKC },
  { id: 'dachshund', nome: 'Dachshund (Teckel)', en: 'Dachshund', pesoKg: [7, 15], alturaCm: [20, 23], fonte: AKC },
  { id: 'dachshund-mini', nome: 'Dachshund miniatura', en: 'Miniature Dachshund', pesoKg: [3, 5], alturaCm: [13, 15], fonte: AKC },
  { id: 'golden', nome: 'Golden Retriever', pesoKg: [25, 34], alturaCm: [51, 61], fonte: AKC },
  { id: 'labrador', nome: 'Labrador', en: 'Labrador Retriever', pesoKg: [25, 36], alturaCm: [55, 62], fonte: AKC },
  { id: 'lhasa', nome: 'Lhasa Apso', pesoKg: [5, 8], alturaCm: [25, 28], fonte: AKC },
  { id: 'pastor-alemao', nome: 'Pastor Alemão', en: 'German Shepherd', pesoKg: [22, 40], alturaCm: [56, 66], fonte: AKC },
  { id: 'pug', nome: 'Pug', pesoKg: [6, 8], alturaCm: [25, 33], fonte: AKC },
  { id: 'rottweiler', nome: 'Rottweiler', pesoKg: [35, 60], alturaCm: [56, 69], fonte: AKC },
  { id: 'shih-tzu', nome: 'Shih Tzu', pesoKg: [4, 7], alturaCm: [23, 27], fonte: AKC },
  { id: 'yorkshire', nome: 'Yorkshire Terrier', pesoKg: [2, 3.2], alturaCm: [18, 20], fonte: AKC },
]

export const nomeRaca = (r: Raca) => tr(r.nome, r.en ?? r.nome)
