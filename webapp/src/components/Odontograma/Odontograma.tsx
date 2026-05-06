'use client'
import { useState } from 'react'
import clsx from 'clsx'

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

// SVG paths — viewBox="0 0 32 50"
// Upper: crown at top, roots at bottom
const UPPER: Record<string, string> = {
  molar:    'M4,22 C4,4 28,4 28,22 L25,40 L20,33 L12,33 L7,40 Z',
  premolar: 'M6,22 C5,5 27,5 26,22 L23,44 L9,44 Z',
  canine:   'M7,23 L16,3 L25,23 L22,44 L10,44 Z',
  incisor:  'M7,22 L7,7 Q16,1 25,7 L25,22 L22,44 L10,44 Z',
}
// Lower: crown at bottom, roots at top
const LOWER: Record<string, string> = {
  molar:    'M4,28 L7,10 L12,17 L20,17 L25,10 L28,28 C28,46 4,46 4,28 Z',
  premolar: 'M6,28 L9,6 L23,6 L26,28 C26,46 6,46 6,28 Z',
  canine:   'M7,27 L10,6 L22,6 L25,27 L16,47 Z',
  incisor:  'M7,28 L10,6 L22,6 L25,28 L25,43 Q16,49 7,43 Z',
}

function ToothSVG({ number, isUpper, tratamento, selected, onClick }: {
  number: number
  isUpper: boolean
  tratamento?: ToothTratamento
  selected?: boolean
  onClick?: () => void
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
      className="flex flex-col items-center group focus:outline-none"
    >
      {isUpper && (
        <span className="text-[9px] text-gray-400 mb-0.5 font-medium">{number}</span>
      )}
      <svg viewBox="0 0 32 50" width={20} height={30}
        className="group-hover:scale-110 transition-transform origin-center overflow-visible">
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

export function Odontograma({ tratamentos = {}, onToothClick, selectedTooth }: OdontogramaProps) {
  const [localSelected, setLocalSelected] = useState<number | null>(null)
  const active = selectedTooth !== undefined ? selectedTooth : localSelected

  const handleClick = (n: number) => {
    const next = n === active ? null : n
    setLocalSelected(next)
    onToothClick?.(n)
  }

  return (
    <div className="select-none py-2">
      {/* Upper arch */}
      <div className="flex items-end justify-center gap-px">
        {UPPER_ROW.map((n, i) => (
          <div key={n} className="flex items-end">
            <ToothSVG
              number={n}
              isUpper
              tratamento={tratamentos[n]}
              selected={active === n}
              onClick={() => handleClick(n)}
            />
            {i === 7 && <div className="w-px h-6 bg-gray-200 self-center mx-1 shrink-0" />}
          </div>
        ))}
      </div>

      {/* Mid-line */}
      <div className="flex justify-center my-1.5">
        <div className="w-[calc(100%-24px)] h-px border-t border-dashed border-gray-200" />
      </div>

      {/* Lower arch */}
      <div className="flex items-start justify-center gap-px">
        {LOWER_ROW.map((n, i) => (
          <div key={n} className="flex items-start">
            <ToothSVG
              number={n}
              isUpper={false}
              tratamento={tratamentos[n]}
              selected={active === n}
              onClick={() => handleClick(n)}
            />
            {i === 7 && <div className="w-px h-6 bg-gray-200 self-center mx-1 shrink-0" />}
          </div>
        ))}
      </div>

      {/* Legend */}
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
