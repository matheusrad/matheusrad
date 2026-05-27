'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
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

const UPPER_ROW = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28]
const LOWER_ROW = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38]

// svgOrigin = centro do viewBox "0 0 32 50" → "16 25"
const SVG_ORIGIN = '16 25'

// ── Dente individual ──────────────────────────────────────────
function ToothSVG({ number, isUpper, tratamento, selected, onClick }: {
  number: number
  isUpper: boolean
  tratamento?: ToothTratamento
  selected?: boolean
  onClick?: () => void
}) {
  const type = getToothType(number)
  const path = isUpper ? UPPER[type] : LOWER[type]

  const fill   = selected ? '#dbeafe' : !tratamento ? '#f9fafb' : tratamento.status === 'Finalizado' ? '#dcfce7' : '#ffedd5'
  const stroke = selected ? '#3b82f6' : !tratamento ? '#e5e7eb' : tratamento.status === 'Finalizado' ? '#16a34a' : '#ea580c'
  const dotY   = isUpper ? 47 : 3
  const dotFill = tratamento ? (tratamento.status === 'Finalizado' ? '#22c55e' : '#f97316') : 'transparent'

  return (
    <button
      onClick={onClick}
      title={`Dente ${number}${tratamento ? ` — ${tratamento.procedimento} (${tratamento.status})` : ''}`}
      className="flex flex-col items-center focus:outline-none"
    >
      {isUpper && <span className="text-[9px] text-gray-400 mb-0.5 font-medium">{number}</span>}
      <svg
        data-tooth={number}
        data-arch={isUpper ? 'upper' : 'lower'}
        data-has-tratamento={tratamento ? '1' : '0'}
        viewBox="0 0 32 50"
        width={20}
        height={30}
        style={{ overflow: 'visible' }}
      >
        <path d={path} fill={fill} stroke={stroke} strokeWidth={1.5} strokeLinejoin="round" />
        {tratamento && <circle cx="16" cy={dotY} r="2.5" fill={dotFill} data-dot />}
        {selected   && <circle cx="16" cy={dotY} r="2.5" fill="#3b82f6" />}
      </svg>
      {!isUpper && <span className="text-[9px] text-gray-400 mt-0.5 font-medium">{number}</span>}
    </button>
  )
}

// ── Odontograma ───────────────────────────────────────────────
export function Odontograma({ tratamentos = {}, onToothClick, selectedTooth }: OdontogramaProps) {
  const [localSelected, setLocalSelected] = useState<number | null>(null)
  const active = selectedTooth !== undefined ? selectedTooth : localSelected
  const containerRef = useRef<HTMLDivElement>(null)

  // ── Animação de entrada ───────────────────────────────────
  useEffect(() => {
    const ctx = gsap.context(() => {
      const upperSVGs = gsap.utils.toArray<SVGSVGElement>('[data-arch="upper"]', containerRef.current!)
      const lowerSVGs = gsap.utils.toArray<SVGSVGElement>('[data-arch="lower"]', containerRef.current!)

      // Parte do centro para as bordas
      const upperMid  = [...upperSVGs].reverse()   // 11→18 e 21→28 lidos do centro
      const lowerMid  = [...lowerSVGs].reverse()

      gsap.set([...upperSVGs, ...lowerSVGs], { scale: 0, opacity: 0, svgOrigin: SVG_ORIGIN })

      const tl = gsap.timeline({ delay: 0.15 })

      tl.to(upperSVGs, {
        scale: 1, opacity: 1,
        duration: 0.4,
        ease: 'back.out(2)',
        stagger: { each: 0.04, from: 'center' },
        svgOrigin: SVG_ORIGIN,
      })
      .to(lowerSVGs, {
        scale: 1, opacity: 1,
        duration: 0.4,
        ease: 'back.out(2)',
        stagger: { each: 0.04, from: 'center' },
        svgOrigin: SVG_ORIGIN,
      }, '-=0.3')

      // Pulse contínuo nos dots de tratamento
      const dots = gsap.utils.toArray<SVGCircleElement>('[data-dot]', containerRef.current!)
      dots.forEach(dot => {
        gsap.to(dot, {
          scale: 1.5,
          opacity: 0.5,
          duration: 1 + Math.random() * 0.5,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
          delay: Math.random() * 1.2,
          svgOrigin: '16 25',
        })
      })
    }, containerRef)

    return () => ctx.revert()
  }, [])

  // ── Clique: bounce ────────────────────────────────────────
  const handleClick = useCallback((n: number) => {
    setLocalSelected(prev => prev === n ? null : n)
    onToothClick?.(n)

    const el = containerRef.current?.querySelector<SVGSVGElement>(`[data-tooth="${n}"]`)
    if (!el) return

    gsap.timeline()
      .to(el, { scale: 0.72, duration: 0.1, ease: 'power2.in',    svgOrigin: SVG_ORIGIN })
      .to(el, { scale: 1.3,  duration: 0.2, ease: 'back.out(3)',  svgOrigin: SVG_ORIGIN })
      .to(el, { scale: 1,    duration: 0.15, ease: 'power1.inOut', svgOrigin: SVG_ORIGIN })
  }, [onToothClick])

  // ── Hover ─────────────────────────────────────────────────
  const hoverIn  = useCallback((n: number) => {
    const el = containerRef.current?.querySelector<SVGSVGElement>(`[data-tooth="${n}"]`)
    if (el) gsap.to(el, { scale: 1.2, duration: 0.18, ease: 'power2.out', svgOrigin: SVG_ORIGIN, overwrite: 'auto' })
  }, [])

  const hoverOut = useCallback((n: number) => {
    const el = containerRef.current?.querySelector<SVGSVGElement>(`[data-tooth="${n}"]`)
    if (el) gsap.to(el, { scale: 1,   duration: 0.2,  ease: 'power2.inOut', svgOrigin: SVG_ORIGIN, overwrite: 'auto' })
  }, [])

  // ── Render ────────────────────────────────────────────────
  return (
    <div ref={containerRef} className="select-none py-2">

      {/* Arcada superior */}
      <div className="flex items-end justify-center gap-px">
        {UPPER_ROW.map((n, i) => (
          <div key={n} className="flex items-end"
            onMouseEnter={() => hoverIn(n)}
            onMouseLeave={() => hoverOut(n)}
          >
            <ToothSVG
              number={n} isUpper
              tratamento={tratamentos[n]}
              selected={active === n}
              onClick={() => handleClick(n)}
            />
            {i === 7 && <div className="w-px h-6 bg-gray-200 self-center mx-1 shrink-0" />}
          </div>
        ))}
      </div>

      {/* Linha central */}
      <div className="flex justify-center my-1.5">
        <div className="w-[calc(100%-24px)] h-px border-t border-dashed border-gray-200" />
      </div>

      {/* Arcada inferior */}
      <div className="flex items-start justify-center gap-px">
        {LOWER_ROW.map((n, i) => (
          <div key={n} className="flex items-start"
            onMouseEnter={() => hoverIn(n)}
            onMouseLeave={() => hoverOut(n)}
          >
            <ToothSVG
              number={n} isUpper={false}
              tratamento={tratamentos[n]}
              selected={active === n}
              onClick={() => handleClick(n)}
            />
            {i === 7 && <div className="w-px h-6 bg-gray-200 self-center mx-1 shrink-0" />}
          </div>
        ))}
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
