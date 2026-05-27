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
  mode?: 'overview' | 'edit'
}

function getToothType(n: number): 'molar' | 'premolar' | 'canine' | 'incisor' {
  const pos = n % 10
  if (pos >= 6 || pos === 0) return 'molar'
  if (pos >= 4) return 'premolar'
  if (pos === 3) return 'canine'
  return 'incisor'
}

// Tamanhos de exibição por tipo
const SIZE = {
  molar:    { w: 34, h: 60 },
  premolar: { w: 26, h: 56 },
  canine:   { w: 22, h: 62 },
  incisor:  { w: 20, h: 54 },
}

// ── Arcada SUPERIOR — coroa em cima, raízes embaixo ───────────
// viewBox "0 0 50 90" para todos; tamanho de exibição varia por tipo

const UPPER_PATHS: Record<string, { crown: string; roots: string[] }> = {
  molar: {
    crown: `M 2,44
      C 1,30 2,16 7,9
      Q 12,2 19,1
      Q 25,0 31,1
      Q 38,2 43,9
      C 48,16 49,30 48,44 Z`,
    roots: [
      // raiz mesial (esquerda)
      `M 4,44 L 2,72 Q 7,84 17,80 L 20,44 Z`,
      // raiz distal (direita)
      `M 30,44 L 28,78 Q 36,88 46,82 L 48,44 Z`,
    ],
  },
  premolar: {
    crown: `M 5,44
      C 4,30 5,17 9,10
      Q 13,3 19,2
      Q 25,0 31,2
      Q 37,3 41,10
      C 45,17 46,30 45,44 Z`,
    roots: [
      `M 11,44 L 9,78 Q 25,88 41,78 L 39,44 Z`,
    ],
  },
  canine: {
    crown: `M 7,44 L 5,18 L 25,2 L 45,18 L 43,44 Z`,
    roots: [
      `M 12,44 L 10,82 Q 25,90 40,82 L 38,44 Z`,
    ],
  },
  incisor: {
    crown: `M 6,44 L 5,12 Q 6,2 25,2 Q 44,2 45,12 L 44,44 Z`,
    roots: [
      `M 12,44 L 10,78 Q 25,86 40,78 L 38,44 Z`,
    ],
  },
}

// ── Arcada INFERIOR — raízes em cima, coroa embaixo ───────────
const LOWER_PATHS: Record<string, { crown: string; roots: string[] }> = {
  molar: {
    crown: `M 2,46
      C 1,60 2,74 7,81
      Q 12,88 19,89
      Q 25,90 31,89
      Q 38,88 43,81
      C 48,74 49,60 48,46 Z`,
    roots: [
      `M 4,46 L 2,18 Q 7,6 17,10 L 20,46 Z`,
      `M 30,46 L 28,12 Q 36,2 46,8 L 48,46 Z`,
    ],
  },
  premolar: {
    crown: `M 5,46
      C 4,60 5,73 9,80
      Q 13,87 19,88
      Q 25,90 31,88
      Q 37,87 41,80
      C 45,73 46,60 45,46 Z`,
    roots: [
      `M 11,46 L 9,12 Q 25,2 41,12 L 39,46 Z`,
    ],
  },
  canine: {
    crown: `M 7,46 L 43,46 L 25,88 Z`,
    roots: [
      `M 12,46 L 10,8 Q 25,0 40,8 L 38,46 Z`,
    ],
  },
  incisor: {
    crown: `M 6,46 L 44,46 L 45,78 Q 44,88 25,88 Q 6,88 5,78 Z`,
    roots: [
      `M 12,46 L 10,12 Q 25,4 40,12 L 38,46 Z`,
    ],
  },
}

const UPPER_ROW = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28]
const LOWER_ROW = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38]

// ── SVG do dente ──────────────────────────────────────────────
function ToothSVG({ number, isUpper, tratamento, selected, mode }: {
  number: number
  isUpper: boolean
  tratamento?: ToothTratamento
  selected?: boolean
  mode: 'overview' | 'edit'
}) {
  const type   = getToothType(number)
  const paths  = isUpper ? UPPER_PATHS[type] : LOWER_PATHS[type]
  const { w, h } = SIZE[type]
  const hasTrat   = tratamento && tratamento.status !== 'Cancelado'
  const isGreen   = hasTrat && tratamento!.status === 'Finalizado'
  const isOrange  = hasTrat && tratamento!.status === 'Em aberto'

  const crownFill   = selected && mode === 'edit' ? '#bfdbfe'
    : isGreen   ? '#86efac'
    : isOrange  ? '#fdba74'
    : '#f8fafc'

  const crownStroke = selected && mode === 'edit' ? '#3b82f6'
    : isGreen   ? '#16a34a'
    : isOrange  ? '#ea580c'
    : '#94a3b8'

  const rootFill   = '#f1f5f9'
  const rootStroke = '#cbd5e1'

  return (
    <svg viewBox="0 0 50 90" width={w} height={h} style={{ overflow: 'visible' }}>
      {paths.roots.map((d, i) => (
        <path key={i} d={d}
          fill={rootFill}
          stroke={rootStroke}
          strokeWidth={1.4}
          strokeLinejoin="round"
        />
      ))}
      <path
        d={paths.crown}
        fill={crownFill}
        stroke={crownStroke}
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
    </svg>
  )
}

// ── Odontograma ───────────────────────────────────────────────
export function Odontograma({ tratamentos = {}, onToothClick, selectedTooth, mode = 'edit' }: OdontogramaProps) {
  const [localSelected, setLocalSelected] = useState<number | null>(null)
  const active = mode === 'edit' ? (selectedTooth !== undefined ? selectedTooth : localSelected) : null
  const rootRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const root = rootRef.current
    if (!root) return
    const els = Array.from(root.querySelectorAll<HTMLElement>('[data-tooth]'))
    if (!els.length) return
    gsap.set(els, { scale: 0, opacity: 0, transformOrigin: 'center center' })
    gsap.to(els, {
      scale: 1, opacity: 1,
      duration: 0.4, ease: 'back.out(2)',
      stagger: { each: 0.03, from: 'center' },
      delay: 0.05,
    })
    return () => gsap.killTweensOf(els)
  }, [])

  const handleClick = useCallback((n: number) => {
    if (mode === 'edit') setLocalSelected(prev => prev === n ? null : n)
    onToothClick?.(n)
    const el = rootRef.current?.querySelector<HTMLElement>(`[data-tooth="${n}"]`)
    if (!el) return
    gsap.killTweensOf(el)
    gsap.timeline()
      .to(el, { scale: 0.75, duration: 0.08, ease: 'power2.in',   transformOrigin: 'center center' })
      .to(el, { scale: 1.25, duration: 0.18, ease: 'back.out(3)', transformOrigin: 'center center' })
      .to(el, { scale: 1,    duration: 0.14, ease: 'power1.inOut' })
  }, [mode, onToothClick])

  const hoverIn  = useCallback((n: number) => {
    const el = rootRef.current?.querySelector<HTMLElement>(`[data-tooth="${n}"]`)
    if (el) gsap.to(el, { scale: 1.18, duration: 0.15, ease: 'power2.out', transformOrigin: 'center center', overwrite: 'auto' })
  }, [])
  const hoverOut = useCallback((n: number) => {
    const el = rootRef.current?.querySelector<HTMLElement>(`[data-tooth="${n}"]`)
    if (el) gsap.to(el, { scale: 1, duration: 0.15, ease: 'power2.inOut', transformOrigin: 'center center', overwrite: 'auto' })
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
      {addSep && <div className="w-px h-10 bg-gray-200 self-center mx-1 shrink-0" />}
    </div>
  )

  return (
    <div ref={rootRef} className="select-none py-1">
      <div className="overflow-x-auto pb-1">
        {/* Arcada superior */}
        <div className="flex items-end justify-center gap-0.5 min-w-max mx-auto">
          {UPPER_ROW.map((n, i) => tooth(n, true, i === 7))}
        </div>

        {/* Linha central */}
        <div className="flex justify-center my-1.5">
          <div className="w-full h-px border-t border-dashed border-gray-200" />
        </div>

        {/* Arcada inferior */}
        <div className="flex items-start justify-center gap-0.5 min-w-max mx-auto">
          {LOWER_ROW.map((n, i) => tooth(n, false, i === 7))}
        </div>
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
