'use client'
import { useState, useRef, useLayoutEffect, useCallback } from 'react'
import gsap from 'gsap'

export interface ToothTratamento {
  procedimento: string
  status: 'Em aberto' | 'Finalizado' | 'Cancelado'
}

export interface OdontogramaProps {
  tratamentos?: Record<number, ToothTratamento>
  onToothClick?: (toothNumber: number) => void
  selectedTooth?: number | null
  /** 'overview' = só verde/laranja, sem seleção visual. 'edit' = seleção normal */
  mode?: 'overview' | 'edit'
}

// ── Tipos por posição ─────────────────────────────────────────
function getToothType(n: number): 'molar' | 'premolar' | 'canine' | 'incisor' {
  const pos = n % 10
  if (pos >= 6 || pos === 0) return 'molar'
  if (pos >= 4) return 'premolar'
  if (pos === 3) return 'canine'
  return 'incisor'
}

// ── Paths anatômicos (viewBox 0 0 40 90) ─────────────────────
// Arcada SUPERIOR: coroa em cima (y pequeno), raízes embaixo
const CROWN_U: Record<string, string> = {
  incisor:  'M 11,43 L 10,11 Q 10,3 20,3 Q 30,3 30,11 L 29,43 Z',
  canine:   'M 10,43 L 9,17 L 20,3 L 31,17 L 30,43 Z',
  premolar: 'M 9,43 C 8,31 9,19 11,12 Q 14,4 17,4 Q 20,1 23,4 Q 26,4 29,12 C 31,19 32,31 31,43 Z',
  molar:    'M 4,43 C 4,30 5,16 8,9 Q 12,2 17,2 Q 20,0 23,2 Q 28,2 32,9 C 35,16 36,30 36,43 Z',
}
const ROOTS_U: Record<string, string[]> = {
  incisor:  ['M 13,43 L 12,77 Q 20,84 28,77 L 27,43 Z'],
  canine:   ['M 13,43 L 11,82 Q 20,88 29,82 L 27,43 Z'],
  premolar: ['M 13,43 L 11,77 Q 20,84 29,77 L 27,43 Z'],
  molar:    ['M 5,43 L 3,72 Q 11,80 16,75 L 18,43 Z', 'M 22,43 L 23,73 Q 29,82 35,77 L 36,43 Z'],
}

// Arcada INFERIOR: raízes em cima (y pequeno), coroa embaixo
const CROWN_L: Record<string, string> = {
  incisor:  'M 11,47 L 10,79 Q 10,87 20,87 Q 30,87 30,79 L 29,47 Z',
  canine:   'M 10,47 L 9,73 L 20,87 L 31,73 L 30,47 Z',
  premolar: 'M 9,47 C 8,59 9,71 11,78 Q 14,86 17,86 Q 20,89 23,86 Q 26,86 29,78 C 31,71 32,59 31,47 Z',
  molar:    'M 4,47 C 4,60 5,74 8,81 Q 12,88 17,88 Q 20,90 23,88 Q 28,88 32,81 C 35,74 36,60 36,47 Z',
}
const ROOTS_L: Record<string, string[]> = {
  incisor:  ['M 13,47 L 12,13 Q 20,6 28,13 L 27,47 Z'],
  canine:   ['M 13,47 L 11,8 Q 20,2 29,8 L 27,47 Z'],
  premolar: ['M 13,47 L 11,13 Q 20,6 29,13 L 27,47 Z'],
  molar:    ['M 5,47 L 3,18 Q 11,10 16,15 L 18,47 Z', 'M 22,47 L 23,17 Q 29,8 35,13 L 36,47 Z'],
}

const UPPER_ROW = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28]
const LOWER_ROW = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38]

// ── SVG de um dente ───────────────────────────────────────────
function ToothSVG({ number, isUpper, tratamento, selected, mode }: {
  number: number
  isUpper: boolean
  tratamento?: ToothTratamento
  selected?: boolean
  mode: 'overview' | 'edit'
}) {
  const type   = getToothType(number)
  const crown  = isUpper ? CROWN_U[type] : CROWN_L[type]
  const roots  = isUpper ? ROOTS_U[type] : ROOTS_L[type]

  const hasTrat = tratamento && tratamento.status !== 'Cancelado'

  // Cores
  const crownFill = mode === 'overview'
    ? (hasTrat
        ? (tratamento!.status === 'Finalizado' ? '#bbf7d0' : '#fed7aa')  // verde / laranja claro
        : '#f8fafc')
    : (selected ? '#dbeafe' : hasTrat
        ? (tratamento!.status === 'Finalizado' ? '#bbf7d0' : '#fed7aa')
        : '#f8fafc')

  const crownStroke = mode === 'overview'
    ? (hasTrat
        ? (tratamento!.status === 'Finalizado' ? '#16a34a' : '#ea580c')
        : '#9ca3af')
    : (selected ? '#3b82f6' : hasTrat
        ? (tratamento!.status === 'Finalizado' ? '#16a34a' : '#ea580c')
        : '#9ca3af')

  const rootFill   = '#f1f5f9'
  const rootStroke = '#cbd5e1'

  return (
    <svg viewBox="0 0 40 90" width={22} height={48} style={{ overflow: 'visible' }}>
      {/* Raízes */}
      {roots.map((d, i) => (
        <path key={i} d={d} fill={rootFill} stroke={rootStroke} strokeWidth={1.2} strokeLinejoin="round" />
      ))}
      {/* Coroa */}
      <path d={crown} fill={crownFill} stroke={crownStroke} strokeWidth={1.5} strokeLinejoin="round" />
    </svg>
  )
}

// ── Odontograma principal ─────────────────────────────────────
export function Odontograma({ tratamentos = {}, onToothClick, selectedTooth, mode = 'edit' }: OdontogramaProps) {
  const [localSelected, setLocalSelected] = useState<number | null>(null)
  const active = mode === 'edit' ? (selectedTooth !== undefined ? selectedTooth : localSelected) : null
  const rootRef = useRef<HTMLDivElement>(null)

  // ── Animação entrada ──────────────────────────────────────
  useLayoutEffect(() => {
    const root = rootRef.current
    if (!root) return
    const wrappers = Array.from(root.querySelectorAll<HTMLElement>('[data-tooth]'))
    if (!wrappers.length) return

    gsap.set(wrappers, { scale: 0, opacity: 0, transformOrigin: 'center center' })
    gsap.to(wrappers, {
      scale: 1, opacity: 1,
      duration: 0.42,
      ease: 'back.out(1.9)',
      stagger: { each: 0.032, from: 'center' },
      delay: 0.1,
    })
    return () => gsap.killTweensOf(wrappers)
  }, [])

  // ── Clique ────────────────────────────────────────────────
  const handleClick = useCallback((n: number) => {
    if (mode === 'edit') setLocalSelected(prev => prev === n ? null : n)
    onToothClick?.(n)

    const el = rootRef.current?.querySelector<HTMLElement>(`[data-tooth="${n}"]`)
    if (!el) return
    gsap.killTweensOf(el)
    gsap.timeline()
      .to(el, { scale: 0.72, duration: 0.09, ease: 'power2.in',   transformOrigin: 'center center' })
      .to(el, { scale: 1.28, duration: 0.2,  ease: 'back.out(3)', transformOrigin: 'center center' })
      .to(el, { scale: 1,    duration: 0.14, ease: 'power1.inOut' })
  }, [mode, onToothClick])

  // ── Hover ─────────────────────────────────────────────────
  const hoverIn  = useCallback((n: number) => {
    const el = rootRef.current?.querySelector<HTMLElement>(`[data-tooth="${n}"]`)
    if (el) gsap.to(el, { scale: 1.18, duration: 0.16, ease: 'power2.out', transformOrigin: 'center center', overwrite: 'auto' })
  }, [])
  const hoverOut = useCallback((n: number) => {
    const el = rootRef.current?.querySelector<HTMLElement>(`[data-tooth="${n}"]`)
    if (el) gsap.to(el, { scale: 1, duration: 0.18, ease: 'power2.inOut', transformOrigin: 'center center', overwrite: 'auto' })
  }, [])

  const tooth = (n: number, isUpper: boolean, addSep: boolean) => (
    <div key={n}
      className={`flex ${isUpper ? 'items-end' : 'items-start'}`}
      onMouseEnter={() => hoverIn(n)}
      onMouseLeave={() => hoverOut(n)}
    >
      <button
        data-tooth={n}
        onClick={() => handleClick(n)}
        title={`Dente ${n}`}
        className="flex flex-col items-center focus:outline-none cursor-pointer"
      >
        {isUpper && <span className="text-[8px] text-gray-400 mb-0.5 font-medium leading-none">{n}</span>}
        <ToothSVG number={n} isUpper={isUpper} tratamento={tratamentos[n]} selected={active === n} mode={mode} />
        {!isUpper && <span className="text-[8px] text-gray-400 mt-0.5 font-medium leading-none">{n}</span>}
      </button>
      {addSep && <div className="w-px h-8 bg-gray-200 self-center mx-1 shrink-0" />}
    </div>
  )

  return (
    <div ref={rootRef} className="select-none py-1">
      {/* Arcada superior */}
      <div className="flex items-end justify-center gap-0.5">
        {UPPER_ROW.map((n, i) => tooth(n, true, i === 7))}
      </div>

      {/* Linha central */}
      <div className="flex justify-center my-1">
        <div className="w-[calc(100%-28px)] h-px border-t border-dashed border-gray-200" />
      </div>

      {/* Arcada inferior */}
      <div className="flex items-start justify-center gap-0.5">
        {LOWER_ROW.map((n, i) => tooth(n, false, i === 7))}
      </div>

      {/* Legenda */}
      <div className="flex items-center justify-center gap-5 mt-3">
        <span className="flex items-center gap-1.5 text-xs text-gray-500">
          <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" /> Finalizado
        </span>
        <span className="flex items-center gap-1.5 text-xs text-gray-500">
          <span className="w-2.5 h-2.5 rounded-full bg-orange-400 inline-block" /> Em aberto
        </span>
      </div>
    </div>
  )
}
