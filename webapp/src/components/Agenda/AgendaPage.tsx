'use client'
import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Plus, Calendar, Clock, User, CheckCircle2, XCircle, AlertCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Consulta } from '@/types/database'
import { format, addDays, subDays, startOfWeek, isSameDay, parseISO, addWeeks, subWeeks } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import clsx from 'clsx'

type ViewMode = 'semana' | 'dia' | 'lista'

const HORAS = Array.from({ length: 11 }, (_, i) => i + 8) // 8h-18h

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  Agendado:  { label: 'Agendado',  color: 'bg-blue-50 border-blue-200 text-blue-700',   icon: Clock },
  Confirmado:{ label: 'Confirmado',color: 'bg-green-50 border-green-200 text-green-700', icon: CheckCircle2 },
  Realizado: { label: 'Realizado', color: 'bg-gray-50 border-gray-200 text-gray-600',   icon: CheckCircle2 },
  Cancelado: { label: 'Cancelado', color: 'bg-red-50 border-red-200 text-red-600',       icon: XCircle },
  Faltou:    { label: 'Faltou',    color: 'bg-red-50 border-red-200 text-red-600',       icon: XCircle },
  Remarcado: { label: 'Remarcado', color: 'bg-yellow-50 border-yellow-200 text-yellow-700', icon: AlertCircle },
}

function ConsultaCard({ consulta, compact }: { consulta: Consulta; compact?: boolean }) {
  const cfg = statusConfig[consulta.status] || statusConfig.Agendado
  const Icon = cfg.icon
  const hora = format(parseISO(consulta.data_consulta), 'HH:mm')

  return (
    <div className={clsx(
      'border rounded-lg px-2.5 py-2 cursor-pointer hover:shadow-sm transition-shadow',
      cfg.color,
      compact ? 'text-xs' : 'text-sm'
    )}>
      <div className="flex items-center gap-1.5 font-medium truncate">
        <Icon size={11} />
        {compact ? consulta.paciente_nome.split(' ')[0] : consulta.paciente_nome}
      </div>
      {!compact && (
        <div className="text-xs opacity-75 mt-0.5">
          {hora} · {consulta.procedimento || 'Consulta'}
        </div>
      )}
      {compact && <div className="opacity-70">{hora}</div>}
    </div>
  )
}

export function AgendaPage() {
  const [view, setView]         = useState<ViewMode>('semana')
  const [dataBase, setDataBase] = useState(new Date())
  const [consultas, setConsultas] = useState<Consulta[]>([])
  const [loading, setLoading]   = useState(true)

  const inicioSemana = startOfWeek(dataBase, { weekStartsOn: 1 })
  const diasSemana   = Array.from({ length: 6 }, (_, i) => addDays(inicioSemana, i)) // Seg-Sáb

  useEffect(() => {
    const inicio = format(inicioSemana, "yyyy-MM-dd'T00:00:00'")
    const fim    = format(addDays(inicioSemana, 6), "yyyy-MM-dd'T23:59:59'")

    supabase.from('consultas')
      .select('*')
      .gte('data_consulta', inicio)
      .lte('data_consulta', fim)
      .not('status', 'in', '(Cancelado)')
      .order('data_consulta')
      .then(({ data }) => {
        setConsultas(data || [])
        setLoading(false)
      })
  }, [dataBase])

  const consultasDoDia = (dia: Date) =>
    consultas.filter(c => isSameDay(parseISO(c.data_consulta), dia))

  const consultasNaHora = (dia: Date, hora: number) =>
    consultas.filter(c => {
      const d = parseISO(c.data_consulta)
      return isSameDay(d, dia) && d.getHours() === hora
    })

  const tituloSemana = `${format(inicioSemana, "d 'de' MMMM", { locale: ptBR })} – ${format(addDays(inicioSemana, 5), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}`

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Agenda</h1>
        <button className="btn-primary">
          <Plus size={15} /> Nova consulta
        </button>
      </div>

      {/* Controles */}
      <div className="card mb-4 px-4 py-3 flex items-center gap-3">
        <div className="flex items-center gap-1">
          <button onClick={() => setDataBase(d => subWeeks(d, 1))}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <ChevronLeft size={18} className="text-gray-500" />
          </button>
          <button onClick={() => setDataBase(new Date())}
            className="btn-secondary text-xs px-3 py-1.5">Hoje</button>
          <button onClick={() => setDataBase(d => addWeeks(d, 1))}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <ChevronRight size={18} className="text-gray-500" />
          </button>
        </div>

        <span className="text-sm font-medium text-gray-700 flex-1">{tituloSemana}</span>

        <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
          {(['semana','dia','lista'] as ViewMode[]).map(v => (
            <button key={v} onClick={() => setView(v)}
              className={clsx('px-3 py-1.5 text-xs font-medium rounded-md transition-colors capitalize',
                v === view ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500 hover:text-gray-700')}>
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* Grade semanal */}
      {view === 'semana' && (
        <div className="card overflow-x-auto">
          <div className="min-w-[700px]">
            {/* Cabeçalho com dias */}
            <div className="grid grid-cols-[60px_repeat(6,1fr)] border-b border-gray-100">
              <div className="py-3" />
              {diasSemana.map(dia => {
                const hoje = isSameDay(dia, new Date())
                return (
                  <div key={dia.toISOString()} className="py-3 text-center border-l border-gray-50">
                    <p className="text-xs text-gray-500 uppercase tracking-wide">
                      {format(dia, 'EEE', { locale: ptBR })}
                    </p>
                    <p className={clsx(
                      'text-lg font-semibold mt-0.5 w-8 h-8 mx-auto flex items-center justify-center rounded-full',
                      hoje ? 'bg-blue-600 text-white' : 'text-gray-800'
                    )}>
                      {format(dia, 'd')}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      {consultasDoDia(dia).length} consulta{consultasDoDia(dia).length !== 1 ? 's' : ''}
                    </p>
                  </div>
                )
              })}
            </div>

            {/* Grade de horas */}
            <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 340px)' }}>
              {HORAS.map(hora => (
                <div key={hora} className="grid grid-cols-[60px_repeat(6,1fr)] border-b border-gray-50 min-h-[72px]">
                  <div className="px-3 py-2 text-xs text-gray-400 font-medium pt-2">{hora}:00</div>
                  {diasSemana.map(dia => {
                    const slots = consultasNaHora(dia, hora)
                    return (
                      <div key={dia.toISOString()} className="border-l border-gray-50 p-1.5 space-y-1">
                        {slots.map(c => <ConsultaCard key={c.id} consulta={c} compact />)}
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Vista de lista */}
      {view === 'lista' && (
        <div className="card divide-y divide-gray-50">
          {loading ? (
            <div className="p-8 text-center text-sm text-gray-400">Carregando...</div>
          ) : consultas.length === 0 ? (
            <div className="p-12 text-center">
              <Calendar size={40} className="mx-auto mb-3 text-gray-200" />
              <p className="text-sm text-gray-400">Nenhuma consulta esta semana</p>
            </div>
          ) : consultas.map(c => {
            const cfg = statusConfig[c.status] || statusConfig.Agendado
            const Icon = cfg.icon
            return (
              <div key={c.id} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors">
                <div className="text-center w-12 shrink-0">
                  <p className="text-xs text-gray-400">{format(parseISO(c.data_consulta), 'EEE', { locale: ptBR })}</p>
                  <p className="text-lg font-bold text-gray-800">{format(parseISO(c.data_consulta), 'd')}</p>
                </div>
                <div className="w-px h-10 bg-gray-100" />
                <div className="w-16 text-center shrink-0">
                  <div className="text-sm font-semibold text-gray-700">{format(parseISO(c.data_consulta), 'HH:mm')}</div>
                  <div className="text-xs text-gray-400">1h</div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm">{c.paciente_nome}</p>
                  <p className="text-xs text-gray-500">{c.procedimento || 'Consulta'} · Via {c.canal_agendamento}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {c.valor_cobrado && (
                    <span className="text-sm font-medium text-gray-600">
                      R$ {c.valor_cobrado.toFixed(2).replace('.', ',')}
                    </span>
                  )}
                  <span className={clsx('flex items-center gap-1 badge border', cfg.color)}>
                    <Icon size={11} />
                    {cfg.label}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Vista de dia */}
      {view === 'dia' && (
        <div className="card p-6">
          <h2 className="font-semibold text-gray-800 mb-4">
            {format(dataBase, "EEEE, d 'de' MMMM", { locale: ptBR })}
          </h2>
          <div className="space-y-2">
            {consultasDoDia(dataBase).length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">Nenhuma consulta hoje</p>
            ) : consultasDoDia(dataBase).map(c => (
              <ConsultaCard key={c.id} consulta={c} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
