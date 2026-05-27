'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import clsx from 'clsx'
import gsap from 'gsap'

export interface ToothTratamento {
  procedimento: string
  status: 'Em aberto' | 'Finalizado'
}

export interface OdontogramaProps {
  tratamentos?: Record<number, ToothTratamento>
  onToothClick?: (toothNumber: number) => void
  selectedTooth?: number | null
}

function getToothType(n: number): 'molar' | 'premolar' | 'canine' | 'incisor' {
  const pos = n % 10
  if (pos >= 6 || pos === 0) return 'molar'
  if (pos >= 4) return 'premolar'
  if (pos === 3) return 'canine'
  return 'incisor'
}

const UPPER: Record<string, string> = {
  molar:    'M4,22 C4,4 28,4 28,22 L25,40 L20,33 L12,33 L7,40 Z',
  premolar: 'M6,22 C5,5 27,5 26,22 L23,44 L9,44 Z',
  canine:   'M7,23 L16,3 L25,23 L22,44 L10,44 Z',
  incisor:  'M7,22 L7,7 Q16,1 25,7 L25,22 L22,44 L10,44 Z',
}
const LOWER: Record<string, string> = {
  molar:    'M4,28 L7,10 L12,17 L20,17 L25,10 L28,28 C28,46 4,46 4,28 Z',
  premolar: 'M6,28 L9,6 L23,6 L26,28 C26,46 6,46 6,28 Z',
  canine:   'M7,27 L10,6 L22,6 L25,27 L16,47 Z',
  incisor:  'M7,28 L10,6 L22,6 L25,28 L25,43 Q16,49 7,43 Z',
}

// ── Dente individual ──────────────────────────────────────────
function ToothSVG({ number, isUpper, tratamento, selected, onClick, svgRef }: {
  number: number
  isUpper: boolean
  tratamento?: ToothTratamento
  selected?: boolean
  onClick?: () => void
  svgRef?: React.RefObject<SVGSVGElement>
}) {
  const type = getToothType(number)
  const path = isUpper ? UPPER[type] : LOWER[type]

  const fill = selected
    ? '#dbeafe'
    : !tratamento
    ? '#f9fafb'
    : tratamento.status === 'Finalizado'
    ? '#dcfce7'
    : '#ffedd5'

  const stroke = selected
    ? '#3b82f6'
    : !tratamento
    ? '#e5e7eb'
    : tratamento.status === 'Finalizado'
    ? '#16a34a'
    : '#ea580c'

  const dotY = isUpper ? 47 : 3
  const dotFill = tratamento
    ? tratamento.status === 'Finalizado' ? '#22c55e' : '#f97316'
    : 'transparent'

  return (
    <button
      onClick={onClick}
      title={`Dente ${number}${tratamento ? ` — ${tratamento.procedimento} (${tratamento.status})` : ''}`}
      className="flex flex-col items-center focus:outline-none"
    >
      {isUpper && (
        <span className="text-[9px] text-gray-400 mb-0.5 font-medium">{number}</span>
      )}
      <svg
        ref={svgRef}
        viewBox="0 0 32 50"
        width={20}
        height={30}
        style={{ overflow: 'visible', transformOrigin: 'center' }}
      >
        <path d={path} fill={fill} stroke={stroke} strokeWidth={1.5} strokeLinejoin="round" />
        {tratamento && (
          <circle cx="16" cy={dotY} r="2.5" fill={dotFill} />
        )}
        {selected && (
          <circle cx="16" cy={dotY} r="2.5" fill="#3b82f6" />
        )}
      </svg>
      {!isUpper && (
        <span className="text-[9px] text-gray-400 mt-0.5 font-medium">{number}</span>
      )}
    </button>
  )
}

const UPPER_ROW = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28]
const LOWER_ROW = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38]
const ALL_TEETH = [...UPPER_ROW, ...LOWER_ROW]

// ── Odontograma ───────────────────────────────────────────────
export function Odontograma({ tratamentos = {}, onToothClick, selectedTooth }: OdontogramaProps) {
  const [localSelected, setLocalSelected] = useState<number | null>(null)
  const active = selectedTooth !== undefined ? selectedTooth : localSelected

  // Um ref por dente
  const svgRefs = useRef<Record<number, React.RefObject<SVGSVGElement>>>({})
  ALL_TEETH.forEach(n => {
    if (!svgRefs.current[n]) {
      svgRefs.current[n] = { current: null } as React.RefObject<SVGSVGElement>
    }
  })

  // ── Animação de entrada em cascata ────────────────────────
  useEffect(() => {
    const upperEls = UPPER_ROW.map(n => svgRefs.current[n]?.current).filter(Boolean)
    const lowerEls = LOWER_ROW.map(n => svgRefs.current[n]?.current).filter(Boolean)

    // Estado inicial: invisível + comprimido
    gsap.set([...upperEls, ...lowerEls], { scale: 0, opacity: 0 })

    // Arcada superior: dentes surgem do centro para as extremidades
    const upperOrdered = [
      ...UPPER_ROW.slice(7, -1).reverse(),  // 11,12,13... (direita do paciente → centro)
      ...UPPER_ROW.slice(0, 8).reverse(),   // 21,22,23... (esquerda → centro)
    ]

    const upperOrderedEls = upperOrdered
      .map(n => svgRefs.current[n]?.current)
      .filter(Boolean)

    const lowerOrdered = [
      ...LOWER_ROW.slice(7, -1).reverse(),
      ...LOWER_ROW.slice(0, 8).reverse(),
    ]
    const lowerOrderedEls = lowerOrdered
      .map(n => svgRefs.current[n]?.current)
      .filter(Boolean)

    const tl = gsap.timeline({ delay: 0.1 })

    // Arcada superior
    tl.to(upperOrderedEls, {
      scale: 1,
      opacity: 1,
      duration: 0.35,
      ease: 'back.out(1.8)',
      stagger: {
        each: 0.04,
        from: 'center',
      },
    })
    // Arcada inferior (ligeiramente após)
    .to(lowerOrderedEls, {
      scale: 1,
      opacity: 1,
      duration: 0.35,
      ease: 'back.out(1.8)',
      stagger: {
        each: 0.04,
        from: 'center',
      },
    }, '-=0.25')

    // Dentes com tratamento: pulse suave contínuo na bolinha de status
    ALL_TEETH.forEach(n => {
      const trat = tratamentos[n]
      const el = svgRefs.current[n]?.current
      if (!trat || !el) return

      const dot = el.querySelector('circle')
      if (!dot) return

      gsap.to(dot, {
        scale: 1.35,
        opacity: 0.6,
        duration: 1.1,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        delay: Math.random() * 1.5,
        transformOrigin: 'center',
      })
    })

    return () => { tl.kill() }
  }, [])                                     // só na montagem

  // ── Animação de clique: bounce no dente ───────────────────
  const handleClick = useCallback((n: number) => {
    const next = n === active ? null : n
    setLocalSelected(next)
    onToothClick?.(n)

    const el = svgRefs.current[n]?.current
    if (!el) return

    gsap.timeline()
      .to(el, { scale: 0.75, duration: 0.1, ease: 'power2.in' })
      .to(el, { scale: 1.25, duration: 0.18, ease: 'back.out(3)' })
      .to(el, { scale: 1,    duration: 0.14, ease: 'power1.inOut' })
  }, [active, onToothClick])

  // ── Hover: shimmer leve via GSAP (substitui o CSS anterior) ─
  const handleHoverIn = useCallback((n: number) => {
    const el = svgRefs.current[n]?.current
    if (!el) return
    gsap.to(el, { scale: 1.18, duration: 0.2, ease: 'power2.out', overwrite: 'auto' })
  }, [])

  const handleHoverOut = useCallback((n: number) => {
    const el = svgRefs.current[n]?.current
    if (!el) return
    gsap.to(el, { scale: 1, duration: 0.2, ease: 'power2.inOut', overwrite: 'auto' })
  }, [])

  // ── Render ────────────────────────────────────────────────
  const renderTooth = (n: number, isUpper: boolean, idx: number, rowLen: number) => (
    <div key={n} className={clsx('flex', isUpper ? 'items-end' : 'items-start')}>
      <ToothSVG
        number={n}
        isUpper={isUpper}
        tratamento={tratamentos[n]}
        selected={active === n}
        onClick={() => handleClick(n)}
        svgRef={svgRefs.current[n]}
      />
      {/* Separador central */}
      {idx === 7 && (
        <div className={clsx('w-px h-6 bg-gray-200 self-center mx-1 shrink-0')} />
      )}
    </div>
  )

  return (
    <div className="select-none py-2">
      {/* Arcada superior */}
      <div
        className="flex items-end justify-center gap-px"
        onMouseLeave={() => {}}
      >
        {UPPER_ROW.map((n, i) => {
          const btn = renderTooth(n, true, i, UPPER_ROW.length)
          // Wrap para capturar hover por dente
          return (
            <div
              key={n}
              className="flex items-end"
              onMouseEnter={() => handleHoverIn(n)}
              onMouseLeave={() => handleHoverOut(n)}
            >
              {btn}
              {i === 7 && <div className="w-px h-6 bg-gray-200 self-center mx-1 shrink-0" />}
            </div>
          )
        })}
      </div>

      {/* Linha central */}
      <div className="flex justify-center my-1.5">
        <div className="w-[calc(100%-24px)] h-px border-t border-dashed border-gray-200" />
      </div>

      {/* Arcada inferior */}
      <div className="flex items-start justify-center gap-px">
        {LOWER_ROW.map((n, i) => (
          <div
            key={n}
            className="flex items-start"
            onMouseEnter={() => handleHoverIn(n)}
            onMouseLeave={() => handleHoverOut(n)}
          >
            <ToothSVG
              number={n}
              isUpper={false}
              tratamento={tratamentos[n]}
              selected={active === n}
              onClick={() => handleClick(n)}
              svgRef={svgRefs.current[n]}
            />
            {i === 7 && <div className="w-px h-6 bg-gray-200 self-center mx-1 shrink-0" />}
          </div>
        ))}
      </div>

      {/* Legenda */}
      <div className="flex items-center justify-center gap-5 mt-3">
        <span className="flex items-center gap-1.5 text-xs text-gray-500">
          <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" />
          Finalizado
        </span>
        <span className="flex items-center gap-1.5 text-xs text-gray-500">
          <span className="w-2.5 h-2.5 rounded-full bg-orange-400 inline-block" />
          Em aberto
        </span>
      </div>
    </div>
  )
}
