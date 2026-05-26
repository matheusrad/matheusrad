'use client'
import { useState, useEffect, useCallback } from 'react'
import {
  ChevronLeft, ChevronRight, Plus, X, Phone,
  Clock, Stethoscope, CheckCircle2, XCircle,
  AlertCircle, FileText, Pencil, Users, Send,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { gcalCriar, gcalAtualizar, gcalCancelar } from '@/lib/calendarClient'
import type { Consulta } from '@/types/database'
import {
  format, addDays, startOfWeek, isSameDay, parseISO,
  addWeeks, subWeeks, addMonths, subMonths, startOfMonth,
  endOfMonth, isSameMonth, addHours,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import Link from 'next/link'
import clsx from 'clsx'

// ── Constantes ────────────────────────────────────────────────
const FIRST_HOUR = 7
const LAST_HOUR  = 19
const PX_HR      = 64
const HOURS      = Array.from({ length: LAST_HOUR - FIRST_HOUR }, (_, i) => i + FIRST_HOUR)
const DIAS_MIN   = ['D','S','T','Q','Q','S','S']

const PROCEDIMENTOS = [
  'Avaliação / Consulta inicial',
  'Consulta de retorno',
  'Urgência / Dor',
  'Limpeza (profilaxia)',
  'Aplicação de flúor',
  'Selante de fissuras',
  'Restauração (resina composta)',
  'Restauração (amálgama)',
  'Tratamento de canal (endodontia)',
  'Extração simples',
  'Extração de siso (3º molar)',
  'Cirurgia oral menor',
  'Prótese parcial removível (PPR)',
  'Prótese total',
  'Coroa unitária (prótese fixa)',
  'Prótese sobre implante',
  'Implante dentário (cirurgia)',
  'Clareamento dental (consultório)',
  'Clareamento dental (placa caseira)',
  'Faceta de porcelana',
  'Faceta de resina',
  'Aparelho ortodôntico fixo (instalação)',
  'Manutenção ortodôntica',
  'Aparelho removível',
  'Alinhador transparente',
  'Contenção pós-ortodontia',
  'Raspagem e alisamento radicular',
  'Cirurgia periodontal',
  'Gengivoplastia',
  'Enxerto gengival',
  'Placa miorrelaxante (bruxismo)',
  'Radiografia periapical',
  'Radiografia panorâmica',
  'Tomografia computadorizada',
]

interface Dentista { id: string; nome: string; especialidade: string | null; cro: string | null; cor: string; ativo: boolean }

const STATUS_CFG: Record<string, { label: string; bg: string; bl: string; text: string; dot: string }> = {
  Agendado:   { label: 'Agendado',   bg: 'bg-blue-50',   bl: 'border-l-blue-500',   text: 'text-blue-800',   dot: 'bg-blue-500' },
  Confirmado: { label: 'Confirmado', bg: 'bg-green-50',  bl: 'border-l-green-500',  text: 'text-green-800',  dot: 'bg-green-500' },
  Aguardando: { label: 'Aguardando', bg: 'bg-orange-50', bl: 'border-l-orange-500', text: 'text-orange-800', dot: 'bg-orange-500' },
  Realizado:  { label: 'Realizado',  bg: 'bg-gray-100',  bl: 'border-l-gray-400',   text: 'text-gray-600',   dot: 'bg-gray-400' },
  Cancelado:  { label: 'Cancelado',  bg: 'bg-red-50',    bl: 'border-l-red-400',    text: 'text-red-700',    dot: 'bg-red-400' },
  Faltou:     { label: 'Faltou',     bg: 'bg-red-100',   bl: 'border-l-red-600',    text: 'text-red-800',    dot: 'bg-red-600' },
  Remarcado:  { label: 'Remarcado',  bg: 'bg-amber-50',  bl: 'border-l-amber-500',  text: 'text-amber-800',  dot: 'bg-amber-400' },
}

// ── Mini calendário ───────────────────────────────────────────
function MiniCalendar({ selected, onSelect }: { selected: Date; onSelect: (d: Date) => void }) {
  const [mes, setMes] = useState(selected)
  const inicio  = startOfMonth(mes)
  const fim     = endOfMonth(mes)
  const offset  = inicio.getDay() // 0=dom
  const hoje    = new Date()
  const semana  = startOfWeek(selected, { weekStartsOn: 1 })

  const dias: (Date | null)[] = [
    ...Array(offset).fill(null),
    ...Array.from({ length: fim.getDate() }, (_, i) => addDays(inicio, i)),
  ]

  return (
    <div className="px-2 py-3">
      {/* mês */}
      <div className="flex items-center justify-between mb-2 px-1">
        <span className="text-xs font-semibold text-gray-700 capitalize">
          {format(mes, 'MMMM yyyy', { locale: ptBR })}
        </span>
        <div className="flex gap-0.5">
          <button onClick={() => setMes(m => subMonths(m, 1))}
            className="p-0.5 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600">
            <ChevronLeft size={14} />
          </button>
          <button onClick={() => setMes(m => addMonths(m, 1))}
            className="p-0.5 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600">
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* dias da semana */}
      <div className="grid grid-cols-7 mb-1">
        {DIAS_MIN.map((d, i) => (
          <div key={i} className="text-center text-[10px] font-medium text-gray-400 py-0.5">{d}</div>
        ))}
      </div>

      {/* dias */}
      <div className="grid grid-cols-7">
        {dias.map((dia, i) => {
          if (!dia) return <div key={i} />
          const isHoje    = isSameDay(dia, hoje)
          const isSel     = isSameDay(dia, selected)
          const inSemana  = dia >= semana && dia < addDays(semana, 6)
          const outroMes  = !isSameMonth(dia, mes)
          return (
            <button key={i} onClick={() => { onSelect(dia); setMes(dia) }}
              className={clsx(
                'text-[11px] h-6 w-6 mx-auto rounded-full flex items-center justify-center transition-colors',
                outroMes  && 'text-gray-300',
                !outroMes && !isHoje && !isSel && 'text-gray-700 hover:bg-gray-100',
                inSemana  && !isHoje && !isSel && 'bg-blue-50',
                isHoje    && !isSel && 'font-bold text-blue-600',
                isSel     && 'bg-blue-600 text-white font-bold',
              )}>
              {dia.getDate()}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── Popup de consulta ─────────────────────────────────────────
function ConsultaPopup({
  consulta, onClose, onEdit, onStatusChange,
}: {
  consulta: Consulta
  onClose: () => void
  onEdit: () => void
  onStatusChange: (id: string, status: string) => void
}) {
  const [statusLocal, setStatusLocal] = useState(consulta.status)
  const [statusOpen, setStatusOpen]   = useState(false)
  const [saving, setSaving]           = useState(false)
  const cfg = STATUS_CFG[statusLocal] || STATUS_CFG.Agendado

  const ini  = parseISO(consulta.data_consulta)
  const fim  = consulta.data_fim_consulta ? parseISO(consulta.data_fim_consulta) : addHours(ini, 1)
  const tel  = (consulta.paciente_telefone || '').replace(/\D/g, '')

  async function changeStatus(s: string) {
    setSaving(true)
    await supabase.from('consultas').update({ status: s }).eq('id', consulta.id)
    setStatusLocal(s as Consulta['status'])
    onStatusChange(consulta.id, s)

    // Sincroniza Google Calendar
    if (consulta.evento_google_id) {
      const ini = parseISO(consulta.data_consulta)
      const fim = consulta.data_fim_consulta ? parseISO(consulta.data_fim_consulta) : addHours(ini, 1)
      if (s === 'Cancelado' || s === 'Faltou') {
        gcalCancelar(consulta.evento_google_id)
      } else {
        gcalAtualizar(consulta.evento_google_id, {
          paciente_nome: consulta.paciente_nome,
          procedimento:  consulta.procedimento,
          data_consulta: format(ini, 'yyyy-MM-dd'),
          hora_inicio:   format(ini, 'HH:mm'),
          hora_fim:      format(fim, 'HH:mm'),
          status:        s,
        })
      }
    }

    setSaving(false)
    setStatusOpen(false)
  }

  const iniciais = consulta.paciente_nome.trim().split(' ')
    .filter(Boolean)
    .map(p => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-5 z-10">

        {/* fechar */}
        <button onClick={onClose}
          className="absolute top-3 right-3 p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
          <X size={16} />
        </button>

        {/* Paciente */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-11 h-11 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-base shrink-0">
            {iniciais}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-gray-900 truncate">{consulta.paciente_nome}</p>
            {tel && (
              <div className="flex items-center gap-1.5 mt-0.5">
                <Phone size={11} className="text-gray-400 shrink-0" />
                <span className="text-xs text-gray-500">{consulta.paciente_telefone}</span>
                {tel && (
                  <a href={`https://wa.me/55${tel}`} target="_blank" rel="noopener noreferrer"
                    className="text-xs text-green-600 hover:text-green-700 font-medium ml-1">
                    Confirmar consulta
                  </a>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Ações secundárias */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          {consulta.paciente_id ? (
            <Link href={`/pacientes/${consulta.paciente_id}`}
              className="flex items-center justify-center gap-1.5 border border-gray-200 rounded-xl py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
              <FileText size={14} /> Abrir prontuário
            </Link>
          ) : (
            <button disabled className="flex items-center justify-center gap-1.5 border border-gray-200 rounded-xl py-2 text-sm font-medium text-gray-400">
              <FileText size={14} /> Abrir prontuário
            </button>
          )}
          {consulta.paciente_id ? (
            <Link href={`/pacientes/${consulta.paciente_id}`}
              className="flex items-center justify-center gap-1.5 border border-gray-200 rounded-xl py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
              <Send size={14} /> Adicionar evolução
            </Link>
          ) : (
            <button disabled className="flex items-center justify-center gap-1.5 border border-gray-200 rounded-xl py-2 text-sm font-medium text-gray-400">
              <Send size={14} /> Adicionar evolução
            </button>
          )}
        </div>

        {/* Editar */}
        <button onClick={onEdit}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors mb-4">
          <Pencil size={14} /> Editar agendamento
        </button>

        {/* Detalhes */}
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <Stethoscope size={14} className="text-gray-400 shrink-0" />
            <span>Clínica</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Clock size={14} className="text-gray-400 shrink-0" />
            <span>
              {format(ini, "dd MMM yyyy", { locale: ptBR })} · {format(ini, 'HH:mm')} – {format(fim, 'HH:mm')}
            </span>
          </div>
          {consulta.procedimento && (
            <div className="flex items-center gap-2 text-gray-600">
              <FileText size={14} className="text-gray-400 shrink-0" />
              <span>{consulta.procedimento}</span>
            </div>
          )}
        </div>

        {/* Status dropdown */}
        <div className="relative mt-3">
          <button onClick={() => setStatusOpen(o => !o)} disabled={saving}
            className={clsx(
              'w-full flex items-center justify-between px-3 py-2 rounded-xl border text-sm font-medium transition-colors',
              cfg.bg, cfg.text
            )}>
            <span className="flex items-center gap-2">
              <span className={clsx('w-2 h-2 rounded-full', cfg.dot)} />
              {saving ? 'Salvando...' : cfg.label}
            </span>
            <ChevronLeft size={14} className={clsx('transition-transform', statusOpen && '-rotate-90')} />
          </button>

          {statusOpen && (
            <div className="absolute bottom-full left-0 right-0 mb-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden z-20">
              {Object.entries(STATUS_CFG).map(([s, c]) => (
                <button key={s} onClick={() => changeStatus(s)}
                  className={clsx(
                    'w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 transition-colors',
                    c.text, s === statusLocal && 'font-semibold'
                  )}>
                  <span className={clsx('w-2 h-2 rounded-full', c.dot)} />
                  {c.label}
                  {s === statusLocal && <CheckCircle2 size={13} className="ml-auto" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Modal nova / editar consulta ──────────────────────────────
interface PacienteOpt { id: string; nome: string; telefone: string }

function ConsultaModal({
  initial, defaultDate, onClose, onSaved,
}: {
  initial?: Consulta | null
  defaultDate?: Date
  onClose: () => void
  onSaved: () => void
}) {
  const isEdit = !!initial

  const [pacSearch, setPacSearch]   = useState(initial?.paciente_nome ?? '')
  const [pacientes, setPacientes]   = useState<PacienteOpt[]>([])
  const [pacSel, setPacSel]         = useState<PacienteOpt | null>(null)
  const [showSug, setShowSug]       = useState(false)

  const d0 = initial ? parseISO(initial.data_consulta) : (defaultDate ?? new Date())
  const f0 = initial?.data_fim_consulta ? parseISO(initial.data_fim_consulta) : addHours(d0, 1)

  const [data,       setData]       = useState(format(d0, 'yyyy-MM-dd'))
  const [horaIni,   setHoraIni]    = useState(format(d0, 'HH:mm'))
  const [horaFim,   setHoraFim]    = useState(format(f0, 'HH:mm'))
  const [proc,      setProc]       = useState(initial?.procedimento ?? '')
  const [canal,     setCanal]      = useState(initial?.canal_agendamento ?? 'WhatsApp')
  const [status,    setStatus]     = useState(initial?.status ?? 'Agendado')
  const [obs,       setObs]        = useState(initial?.observacoes ?? '')
  const [saving,    setSaving]     = useState(false)
  const [error,     setError]      = useState('')

  useEffect(() => {
    if (pacSearch.length < 2) { setPacientes([]); return }
    supabase.from('pacientes').select('id, nome, telefone')
      .ilike('nome', `%${pacSearch}%`).limit(6)
      .then(({ data }) => setPacientes((data ?? []) as PacienteOpt[]))
  }, [pacSearch])

  async function handleSave() {
    setSaving(true); setError('')
    try {
      const dataIni = `${data}T${horaIni}:00`
      const dataFim = `${data}T${horaFim}:00`
      const nomePaciente = pacSel?.nome ?? initial?.paciente_nome ?? pacSearch
      const payload: Record<string, unknown> = {
        paciente_id:       pacSel?.id    ?? initial?.paciente_id    ?? null,
        paciente_nome:     nomePaciente,
        paciente_telefone: pacSel?.telefone ?? initial?.paciente_telefone ?? null,
        data_consulta:     dataIni,
        data_fim_consulta: dataFim,
        procedimento:      proc || null,
        canal_agendamento: canal,
        status,
        observacoes:       obs || null,
      }

      const gcalPayload = {
        paciente_nome: nomePaciente,
        procedimento:  proc || null,
        data_consulta: data,
        hora_inicio:   horaIni,
        hora_fim:      horaFim,
        status,
      }

      if (isEdit) {
        const { error: e } = await supabase.from('consultas').update(payload).eq('id', initial!.id)
        if (e) throw e
        // Atualiza evento existente ou cria se não existia
        if (initial!.evento_google_id) {
          gcalAtualizar(initial!.evento_google_id, gcalPayload)
        } else {
          gcalCriar(gcalPayload).then(eventoId => {
            if (eventoId) supabase.from('consultas').update({ evento_google_id: eventoId }).eq('id', initial!.id)
          })
        }
      } else {
        const { data: inserted, error: e } = await supabase.from('consultas').insert(payload).select().single()
        if (e) throw e
        // Cria evento e salva ID
        gcalCriar(gcalPayload).then(eventoId => {
          if (eventoId && inserted) {
            supabase.from('consultas').update({ evento_google_id: eventoId }).eq('id', (inserted as any).id)
          }
        })
      }

      onSaved()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro ao salvar.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md z-10 flex flex-col max-h-[90vh]">

        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">{isEdit ? 'Editar agendamento' : 'Novo agendamento'}</h2>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
            <X size={16} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-3">
          {/* Paciente */}
          <div className="relative">
            <label className="label">Paciente</label>
            <input value={pacSearch}
              onChange={e => { setPacSearch(e.target.value); setShowSug(true); setPacSel(null) }}
              onFocus={() => setShowSug(true)}
              className="input" placeholder="Buscar paciente..." autoComplete="off" />
            {showSug && pacientes.length > 0 && (
              <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-xl shadow-lg mt-1 overflow-hidden">
                {pacientes.map(p => (
                  <button key={p.id} onMouseDown={() => {
                    setPacSel(p); setPacSearch(p.nome); setShowSug(false)
                  }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors">
                    <span className="font-medium">{p.nome}</span>
                    <span className="text-gray-400 ml-2 text-xs">{p.telefone}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Data */}
          <div>
            <label className="label">Data</label>
            <input type="date" value={data} onChange={e => setData(e.target.value)} className="input" />
          </div>

          {/* Horário */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Início</label>
              <input type="time" value={horaIni} onChange={e => setHoraIni(e.target.value)} className="input" />
            </div>
            <div>
              <label className="label">Fim</label>
              <input type="time" value={horaFim} onChange={e => setHoraFim(e.target.value)} className="input" />
            </div>
          </div>

          {/* Procedimento */}
          <div>
            <label className="label">Procedimento</label>
            <input list="proc-list" value={proc} onChange={e => setProc(e.target.value)}
              className="input" placeholder="Selecione ou escreva o procedimento..." autoComplete="off" />
            <datalist id="proc-list">
              {PROCEDIMENTOS.map(p => <option key={p} value={p} />)}
            </datalist>
          </div>

          {/* Canal + Status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Canal</label>
              <select value={canal} onChange={e => setCanal(e.target.value)} className="input">
                {['WhatsApp','Telefone','Presencial','Instagram','Site'].map(c => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Status</label>
              <select value={status} onChange={e => setStatus(e.target.value)} className="input">
                {Object.keys(STATUS_CFG).map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {/* Obs */}
          <div>
            <label className="label">Observações</label>
            <textarea value={obs} onChange={e => setObs(e.target.value)} rows={2}
              className="input resize-none" placeholder="Opcional..." />
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
        </div>

        <div className="px-5 py-4 border-t border-gray-100 flex gap-2 justify-end">
          <button onClick={onClose} className="btn-secondary">Cancelar</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary">
            {saving ? 'Salvando...' : isEdit ? 'Salvar alterações' : 'Agendar'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Bloco de consulta na grade ────────────────────────────────
function ConsultaBloco({ consulta, onClick }: { consulta: Consulta; onClick: () => void }) {
  const ini = parseISO(consulta.data_consulta)
  const fim = consulta.data_fim_consulta ? parseISO(consulta.data_fim_consulta) : addHours(ini, 1)

  const startFrac = ini.getHours() + ini.getMinutes() / 60 - FIRST_HOUR
  const endFrac   = fim.getHours() + fim.getMinutes() / 60 - FIRST_HOUR
  const top       = startFrac * PX_HR
  const height    = Math.max((endFrac - startFrac) * PX_HR - 2, 22)

  const cfg = STATUS_CFG[consulta.status] || STATUS_CFG.Agendado

  return (
    <button onClick={onClick}
      style={{ top, height, left: 2, right: 2 }}
      className={clsx(
        'absolute rounded-md border-l-4 px-1.5 py-1 text-left overflow-hidden',
        'hover:brightness-95 transition-all cursor-pointer',
        cfg.bg, cfg.bl, cfg.text
      )}>
      <p className="text-[10px] font-semibold leading-tight truncate">
        {format(ini, 'HH:mm')}–{format(fim, 'HH:mm')}
      </p>
      <p className="text-[11px] leading-tight truncate font-medium">
        {consulta.paciente_nome.split(' ')[0]}
      </p>
      {height > 44 && consulta.procedimento && (
        <p className="text-[10px] opacity-70 truncate">{consulta.procedimento}</p>
      )}
    </button>
  )
}

// ── Modal adicionar profissional (leve) ───────────────────────
function ProfissionalModal({ onClose, onSaved }: { onClose: () => void; onSaved: (d: Dentista) => void }) {
  const CORES = ['#3B82F6','#10B981','#8B5CF6','#F59E0B','#EF4444','#EC4899','#14B8A6','#F97316']
  const [nome,   setNome]   = useState('')
  const [spec,   setSpec]   = useState('Clínico Geral')
  const [cro,    setCro]    = useState('')
  const [cor,    setCor]    = useState('#3B82F6')
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState('')

  async function handleSave() {
    if (!nome.trim()) { setError('Nome é obrigatório.'); return }
    setSaving(true); setError('')
    const { data, error: e } = await supabase
      .from('dentistas').insert({ nome: nome.trim(), especialidade: spec, cro: cro || null, cor })
      .select().single()
    if (e) { setError(e.message); setSaving(false); return }
    onSaved(data as Dentista)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-5 z-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">Adicionar profissional</h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
            <X size={16} />
          </button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="label">Nome completo</label>
            <input value={nome} onChange={e => setNome(e.target.value)} className="input"
              placeholder="Dra. Fulana de Tal" autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Especialidade</label>
              <input value={spec} onChange={e => setSpec(e.target.value)} className="input"
                placeholder="Clínico Geral" />
            </div>
            <div>
              <label className="label">CRO</label>
              <input value={cro} onChange={e => setCro(e.target.value)} className="input"
                placeholder="CRO-SP 00000" />
            </div>
          </div>
          <div>
            <label className="label">Cor na agenda</label>
            <div className="flex gap-2 flex-wrap mt-1">
              {CORES.map(c => (
                <button key={c} onClick={() => setCor(c)}
                  style={{ background: c }}
                  className={clsx('w-7 h-7 rounded-full transition-transform', cor === c && 'scale-125 ring-2 ring-offset-1 ring-gray-400')} />
              ))}
            </div>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
        <div className="flex gap-2 mt-4 justify-end">
          <button onClick={onClose} className="btn-secondary">Cancelar</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary">
            {saving ? 'Salvando...' : 'Adicionar'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Página principal ──────────────────────────────────────────
export function AgendaPage() {
  const [dataBase,             setDataBase]             = useState(new Date())
  const [view,                 setView]                 = useState<'grade' | 'semana' | 'dia'>('grade')
  const [consultas,            setConsultas]            = useState<Consulta[]>([])
  const [loading,              setLoading]              = useState(true)
  const [selected,             setSelected]             = useState<Consulta | null>(null)
  const [editing,              setEditing]              = useState<Consulta | null>(null)
  const [newDate,              setNewDate]              = useState<Date | null>(null)
  const [showNova,             setShowNova]             = useState(false)
  const [aguardandoOpen,       setAguardandoOpen]       = useState(true)
  const [agendas,              setAgendas]              = useState(true)
  const [dentistas,            setDentistas]            = useState<Dentista[]>([])
  const [showAddProf,          setShowAddProf]          = useState(false)
  const [habilitarAguardando,  setHabilitarAguardando]  = useState(true)

  const inicio  = startOfWeek(dataBase, { weekStartsOn: 1 })
  const dias    = Array.from({ length: 6 }, (_, i) => addDays(inicio, i)) // Seg–Sáb

  const tituloSemana = format(inicio, 'MMMM yyyy', { locale: ptBR })

  const load = useCallback(() => {
    setLoading(true)
    const ini = format(inicio, "yyyy-MM-dd'T00:00:00'")
    const fim = format(addDays(inicio, 6), "yyyy-MM-dd'T23:59:59'")
    supabase.from('consultas').select('*')
      .gte('data_consulta', ini).lte('data_consulta', fim)
      .order('data_consulta')
      .then(({ data }) => { setConsultas((data as Consulta[]) ?? []); setLoading(false) })
  }, [dataBase])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    supabase.from('dentistas').select('*').eq('ativo', true).order('nome')
      .then(({ data, error }) => { if (!error) setDentistas((data as Dentista[]) ?? []) })
  }, [])

  useEffect(() => {
    supabase.from('configuracoes_clinica').select('pacientes_aguardando').limit(1).single()
      .then(({ data }) => { if (data) setHabilitarAguardando(data.pacientes_aguardando ?? true) })
  }, [])

  function consultasDoDia(dia: Date) {
    return consultas.filter(c => isSameDay(parseISO(c.data_consulta), dia))
  }

  function handleSaved() {
    setShowNova(false); setEditing(null); setSelected(null); setNewDate(null); load()
  }

  function handleStatusChange(id: string, status: string) {
    setConsultas(cs => cs.map(c => c.id === id ? { ...c, status: status as Consulta['status'] } : c))
  }

  const hoje = new Date()
  const aguardandoList = consultas.filter(c =>
    c.status === 'Aguardando' && isSameDay(parseISO(c.data_consulta), hoje)
  )

  return (
    <div className="-m-6 flex overflow-hidden" style={{ height: 'calc(100vh - 56px)' }}>

      {/* ── Sidebar esquerda ──────────────────────────────── */}
      <div className="w-56 shrink-0 border-r border-gray-100 bg-white flex flex-col overflow-y-auto">

        {/* Mini calendário */}
        <MiniCalendar selected={dataBase} onSelect={d => setDataBase(d)} />

        <div className="px-2 py-1">
          <div className="h-px bg-gray-100" />
        </div>

        {/* Pacientes aguardando — só exibe se habilitado nas configurações */}
        {habilitarAguardando && (
          <div className="px-3 py-2">
            <button onClick={() => setAguardandoOpen(o => !o)}
              className="flex items-center justify-between w-full text-xs font-semibold text-gray-500 uppercase tracking-wide py-1">
              <span className="flex items-center gap-1.5">
                Sala de espera
                {aguardandoList.length > 0 && (
                  <span className="bg-orange-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                    {aguardandoList.length}
                  </span>
                )}
              </span>
              <ChevronLeft size={12} className={clsx('transition-transform', aguardandoOpen && '-rotate-90')} />
            </button>
            {aguardandoOpen && (
              <div className="mt-1 space-y-1">
                {aguardandoList.length === 0 ? (
                  <p className="text-[11px] text-gray-400 py-1">Nenhum na sala de espera</p>
                ) : aguardandoList.map(c => (
                  <button key={c.id} onClick={() => setSelected(c)}
                    className="w-full text-left px-2 py-1.5 rounded-lg bg-orange-50 hover:bg-orange-100 transition-colors border border-orange-100">
                    <p className="text-xs font-medium text-orange-900 truncate">{c.paciente_nome.split(' ')[0]}</p>
                    <p className="text-[10px] text-orange-500">
                      {format(parseISO(c.data_consulta), 'HH:mm')} · aguardando
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="px-2 py-1"><div className="h-px bg-gray-100" /></div>

        {/* Agendas */}
        <div className="px-3 py-2">
          <button onClick={() => setAgendas(o => !o)}
            className="flex items-center justify-between w-full text-xs font-semibold text-gray-500 uppercase tracking-wide py-1">
            Agendas
            <ChevronLeft size={12} className={clsx('transition-transform', agendas && '-rotate-90')} />
          </button>
          {agendas && (
            <div className="mt-2 space-y-1">
              {dentistas.length === 0 ? (
                <p className="text-[11px] text-gray-400 px-2 py-1">Nenhum profissional cadastrado</p>
              ) : (
                <>
                  {dentistas.map(d => (
                    <div key={d.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-50">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: d.cor }} />
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-gray-800 truncate">{d.nome}</p>
                        {d.especialidade && (
                          <p className="text-[10px] text-gray-400 truncate">{d.especialidade}</p>
                        )}
                      </div>
                    </div>
                  ))}
                  <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-50 cursor-pointer"
                    onClick={() => {}}>
                    <Users size={11} className="text-gray-400 shrink-0" />
                    <span className="text-xs text-gray-500">Todos</span>
                  </div>
                </>
              )}
              <button onClick={() => setShowAddProf(true)}
                className="flex items-center gap-2 px-2 py-1 text-xs text-blue-500 hover:text-blue-700 font-medium">
                <Plus size={11} /> Adicionar profissional
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Área principal ────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Header da agenda */}
        <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 shrink-0">
          {/* + nova consulta */}
          <button onClick={() => setShowNova(true)}
            className="w-9 h-9 rounded-xl bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shrink-0 transition-colors shadow-sm">
            <Plus size={18} />
          </button>

          {/* Mês + navegação */}
          <div className="flex items-center gap-1">
            <button onClick={() => setDataBase(d => subWeeks(d, 1))}
              className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500">
              <ChevronLeft size={16} />
            </button>
            <button onClick={() => setDataBase(d => addWeeks(d, 1))}
              className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500">
              <ChevronRight size={16} />
            </button>
          </div>

          <span className="text-sm font-semibold text-gray-700 capitalize">{tituloSemana}</span>

          <div className="flex-1" />

          <button onClick={() => setDataBase(new Date())}
            className="btn-secondary text-xs px-3 py-1.5">Hoje</button>

          <div className="flex bg-gray-100 rounded-lg p-0.5 text-xs font-medium">
            {(['grade','semana','dia'] as const).map(v => (
              <button key={v} onClick={() => setView(v)}
                className={clsx(
                  'px-3 py-1.5 rounded-md transition-colors capitalize',
                  view === v ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500 hover:text-gray-700'
                )}>
                {v === 'grade' ? 'Todas' : v === 'semana' ? 'Semana' : 'Dia'}
              </button>
            ))}
          </div>
        </div>

        {/* ── Vista: lista da semana ───────────────────────── */}
        {view === 'semana' && (
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {loading ? (
              <div className="flex justify-center py-16">
                <div className="w-7 h-7 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : consultas.filter(c => c.status !== 'Cancelado').length === 0 ? (
              <div className="flex flex-col items-center py-16 gap-3 text-gray-400">
                <Clock size={36} />
                <p className="text-sm">Nenhuma consulta nesta semana</p>
              </div>
            ) : (
              <div className="space-y-6">
                {dias.map(dia => {
                  const dCons = consultasDoDia(dia).filter(c => c.status !== 'Cancelado')
                  if (dCons.length === 0) return null
                  return (
                    <div key={dia.toISOString()}>
                      <div className="flex items-center gap-3 mb-3">
                        <div className={clsx(
                          'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0',
                          isSameDay(dia, hoje) ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
                        )}>
                          {format(dia, 'd')}
                        </div>
                        <p className="text-sm font-semibold text-gray-700 capitalize">
                          {format(dia, "EEEE, dd 'de' MMMM", { locale: ptBR })}
                        </p>
                        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                          {dCons.length} consulta{dCons.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <div className="space-y-1 pl-11">
                        {dCons.map(c => {
                          const cfg = STATUS_CFG[c.status] || STATUS_CFG.Agendado
                          const ini = parseISO(c.data_consulta)
                          const fim = c.data_fim_consulta ? parseISO(c.data_fim_consulta) : addHours(ini, 1)
                          return (
                            <button key={c.id} onClick={() => setSelected(c)}
                              className="w-full flex items-center gap-4 px-4 py-3 bg-white border border-gray-100 rounded-xl hover:border-gray-200 hover:shadow-sm transition-all text-left">
                              <div className="text-center w-20 shrink-0">
                                <p className="text-sm font-bold text-gray-800">{format(ini, 'HH:mm')}</p>
                                <p className="text-xs text-gray-400">{format(fim, 'HH:mm')}</p>
                              </div>
                              <div className={clsx('w-1 h-8 rounded-full shrink-0', cfg.bl.replace('border-l-', 'bg-'))} />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-900 truncate">{c.paciente_nome}</p>
                                <p className="text-xs text-gray-400 truncate">{c.procedimento || 'Consulta'}</p>
                              </div>
                              <span className={clsx('text-xs font-medium px-2 py-1 rounded-lg shrink-0', cfg.bg, cfg.text)}>
                                {cfg.label}
                              </span>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Vista: só hoje ───────────────────────────────── */}
        {view === 'dia' && (
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center text-lg font-bold">
                {format(hoje, 'd')}
              </div>
              <div>
                <p className="text-base font-semibold text-gray-900 capitalize">
                  {format(hoje, "EEEE", { locale: ptBR })}
                </p>
                <p className="text-xs text-gray-400">
                  {format(hoje, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </p>
              </div>
            </div>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="w-7 h-7 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (() => {
              const hojeConsultas = consultasDoDia(hoje).filter(c => c.status !== 'Cancelado')
              return hojeConsultas.length === 0 ? (
                <div className="flex flex-col items-center py-12 gap-3 text-gray-400">
                  <Clock size={36} />
                  <p className="text-sm">Nenhuma consulta hoje</p>
                  <button onClick={() => { const d = new Date(); d.setHours(8,0,0,0); setNewDate(d); setShowNova(true) }}
                    className="btn-primary text-xs mt-1">
                    <Plus size={12} /> Agendar para hoje
                  </button>
                </div>
              ) : (
                <div className="space-y-1">
                  {hojeConsultas.map(c => {
                    const cfg = STATUS_CFG[c.status] || STATUS_CFG.Agendado
                    const ini = parseISO(c.data_consulta)
                    const fim = c.data_fim_consulta ? parseISO(c.data_fim_consulta) : addHours(ini, 1)
                    return (
                      <button key={c.id} onClick={() => setSelected(c)}
                        className="w-full flex items-center gap-4 px-4 py-3.5 bg-white border border-gray-100 rounded-xl hover:border-gray-200 hover:shadow-sm transition-all text-left">
                        <div className="text-center w-20 shrink-0">
                          <p className="text-sm font-bold text-gray-800">{format(ini, 'HH:mm')}</p>
                          <p className="text-xs text-gray-400">{format(fim, 'HH:mm')}</p>
                        </div>
                        <div className={clsx('w-1 h-10 rounded-full shrink-0', cfg.bl.replace('border-l-', 'bg-'))} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">{c.paciente_nome}</p>
                          <p className="text-xs text-gray-400 truncate">
                            {c.procedimento || 'Consulta'}
                            {c.paciente_telefone && ` · ${c.paciente_telefone}`}
                          </p>
                        </div>
                        <span className={clsx('text-xs font-medium px-2.5 py-1.5 rounded-lg shrink-0', cfg.bg, cfg.text)}>
                          {cfg.label}
                        </span>
                      </button>
                    )
                  })}
                </div>
              )
            })()}
          </div>
        )}

        {/* ── Vista: grade semanal (padrão) ────────────────── */}
        {view === 'grade' && <div className="flex-1 overflow-auto">
          <div className="flex flex-col min-h-full">

            {/* Cabeçalho: dias */}
            <div className="flex border-b border-gray-200 bg-white sticky top-0 z-10">
              <div className="w-14 shrink-0" /> {/* coluna de horas */}
              {dias.map(dia => {
                const isHoje = isSameDay(dia, hoje)
                const nCons  = consultasDoDia(dia).filter(c => c.status !== 'Cancelado').length
                return (
                  <div key={dia.toISOString()}
                    className="flex-1 text-center py-2 border-l border-gray-100 min-w-[80px]">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider">
                      {format(dia, 'EEE', { locale: ptBR })}
                    </p>
                    <p className={clsx(
                      'text-base font-semibold mx-auto w-8 h-8 flex items-center justify-center rounded-full',
                      isHoje ? 'bg-blue-600 text-white' : 'text-gray-800'
                    )}>
                      {format(dia, 'd')}
                    </p>
                    {nCons > 0 && (
                      <p className="text-[10px] text-gray-400">{nCons} consulta{nCons !== 1 ? 's' : ''}</p>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Grade de horas */}
            {loading ? (
              <div className="flex-1 flex items-center justify-center py-16">
                <div className="w-7 h-7 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="flex" style={{ height: HOURS.length * PX_HR }}>

                {/* Horas */}
                <div className="w-14 shrink-0 relative">
                  {HOURS.map(h => (
                    <div key={h} className="absolute w-full flex items-start justify-end pr-2"
                      style={{ top: (h - FIRST_HOUR) * PX_HR }}>
                      <span className="text-[10px] text-gray-400 -translate-y-2">{h}h</span>
                    </div>
                  ))}
                </div>

                {/* Colunas de dias */}
                {dias.map(dia => {
                  const isHoje   = isSameDay(dia, hoje)
                  const dCons    = consultasDoDia(dia)
                  return (
                    <div key={dia.toISOString()}
                      className={clsx(
                        'flex-1 relative border-l border-gray-100 min-w-[80px]',
                        isHoje && 'bg-blue-50/30'
                      )}>
                      {/* Linhas de hora */}
                      {HOURS.map(h => (
                        <div key={h} className="absolute w-full border-t border-gray-100"
                          style={{ top: (h - FIRST_HOUR) * PX_HR }}>
                          {/* clique em horário vazio */}
                          <div className="w-full hover:bg-blue-50/60 transition-colors cursor-pointer"
                            style={{ height: PX_HR }}
                            onClick={() => {
                              const d = new Date(dia)
                              d.setHours(h, 0, 0, 0)
                              setNewDate(d)
                              setShowNova(true)
                            }} />
                        </div>
                      ))}

                      {/* Consultas */}
                      {dCons.map(c => (
                        <ConsultaBloco key={c.id} consulta={c}
                          onClick={() => { setSelected(c); setEditing(null) }} />
                      ))}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>}
      </div>

      {/* ── Modais / popups ───────────────────────────────── */}
      {selected && !editing && (
        <ConsultaPopup
          consulta={selected}
          onClose={() => setSelected(null)}
          onEdit={() => { setEditing(selected); setSelected(null) }}
          onStatusChange={handleStatusChange}
        />
      )}

      {(showNova || editing) && (
        <ConsultaModal
          initial={editing}
          defaultDate={newDate ?? undefined}
          onClose={() => { setShowNova(false); setEditing(null); setNewDate(null) }}
          onSaved={handleSaved}
        />
      )}

      {showAddProf && (
        <ProfissionalModal
          onClose={() => setShowAddProf(false)}
          onSaved={d => { setDentistas(prev => [...prev, d]); setShowAddProf(false) }}
        />
      )}
    </div>
  )
}
