'use client'
import { useState, useEffect, useCallback } from 'react'
import { Plus, Search, SlidersHorizontal, Phone, Calendar, AlertTriangle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Paciente } from '@/types/database'
import { format, differenceInYears, differenceInDays, parseISO, isToday, getMonth, getDate } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CadastrarPacienteModal } from './CadastrarPacienteModal'
import { PacienteDetalheModal } from './PacienteDetalheModal'
import clsx from 'clsx'

type Tab = 'buscar' | 'aniversariantes' | 'retornos'

function Avatar({ nome }: { nome: string }) {
  const ini = nome.charAt(0).toUpperCase()
  const colors = ['bg-blue-100 text-blue-700','bg-purple-100 text-purple-700',
    'bg-green-100 text-green-700','bg-orange-100 text-orange-700','bg-pink-100 text-pink-700']
  const color = colors[ini.charCodeAt(0) % colors.length]
  return (
    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm shrink-0 ${color}`}>
      {ini}
    </div>
  )
}

function UltimaConsulta({ data }: { data: string | null }) {
  if (!data) return <span className="text-xs text-gray-400">Sem consultas</span>
  const d = parseISO(data)
  const dias = differenceInDays(new Date(), d)
  const label = dias === 0 ? 'hoje' : dias === 1 ? '1 dia atrás' :
    dias < 30 ? `${dias} dias atrás` :
    dias < 365 ? `${Math.floor(dias/30)} meses atrás` :
    `${Math.floor(dias/365)} ano${Math.floor(dias/365) > 1 ? 's' : ''} atrás`
  return (
    <span className="text-xs text-gray-500">
      Última consulta: <span className="text-blue-600">{format(d, 'dd/MM/yyyy')}</span> · {label}
    </span>
  )
}

export function PacientesPage() {
  const [tab, setTab] = useState<Tab>('buscar')
  const [busca, setBusca] = useState('')
  const [pacientes, setPacientes] = useState<Paciente[]>([])
  const [loading, setLoading] = useState(true)
  const [showCadastro, setShowCadastro] = useState(false)
  const [pacienteSelecionado, setPacienteSelecionado] = useState<Paciente | null>(null)

  const fetchPacientes = useCallback(async () => {
    setLoading(true)
    let query = supabase
      .from('pacientes')
      .select('*')
      .eq('status', 'Ativo')
      .order('nome')

    if (busca.trim()) {
      query = query.or(`nome.ilike.%${busca}%,telefone.ilike.%${busca}%,cpf.ilike.%${busca}%`)
    }

    const { data } = await query.limit(50)
    setPacientes(data || [])
    setLoading(false)
  }, [busca])

  useEffect(() => { fetchPacientes() }, [fetchPacientes])

  const aniversariantes = pacientes.filter(p => {
    if (!p.data_nascimento) return false
    const d = parseISO(p.data_nascimento)
    const hoje = new Date()
    return getMonth(d) === getMonth(hoje) && getDate(d) >= getDate(hoje)
  })

  const retornos = pacientes.filter(p => {
    if (!p.data_ultima_consulta) return false
    const dias = differenceInDays(new Date(), parseISO(p.data_ultima_consulta))
    return dias >= 150 && dias <= 240
  })

  const lista = tab === 'aniversariantes' ? aniversariantes
    : tab === 'retornos' ? retornos
    : pacientes

  return (
    <div className="max-w-5xl mx-auto">
      {/* Título */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Pacientes</h1>
        <button onClick={() => setShowCadastro(true)} className="btn-primary">
          <Plus size={16} />
          Cadastrar paciente
        </button>
      </div>

      {/* Card principal */}
      <div className="card">
        {/* Tabs */}
        <div className="flex gap-6 px-6 border-b border-gray-100">
          {([
            ['buscar', 'Buscar'],
            ['aniversariantes', 'Aniversariantes'],
            ['retornos', 'Retornos semestrais'],
          ] as [Tab, string][]).map(([t, label]) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={tab === t ? 'tab-btn-active' : 'tab-btn-inactive'}
            >
              {label}
              {t === 'aniversariantes' && aniversariantes.length > 0 && (
                <span className="ml-1.5 bg-blue-100 text-blue-700 text-xs px-1.5 py-0.5 rounded-full">
                  {aniversariantes.length}
                </span>
              )}
              {t === 'retornos' && retornos.length > 0 && (
                <span className="ml-1.5 bg-orange-100 text-orange-700 text-xs px-1.5 py-0.5 rounded-full">
                  {retornos.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Busca + filtro */}
        {tab === 'buscar' && (
          <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-50">
            <div className="flex-1 relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                className="input pl-9"
                placeholder="Busque por nome, telefone ou CPF"
                value={busca}
                onChange={e => setBusca(e.target.value)}
              />
            </div>
            <button className="btn-secondary">
              <SlidersHorizontal size={15} />
              Filtrar por categoria
            </button>
          </div>
        )}

        {/* Header da lista */}
        {lista.length > 0 && (
          <div className="grid grid-cols-[1fr_160px_180px] gap-4 px-6 py-2 border-b border-gray-50">
            <span className="text-xs font-medium text-gray-500">Nome</span>
            <span className="text-xs font-medium text-gray-500">CPF</span>
            <span className="text-xs font-medium text-gray-500">Telefone</span>
          </div>
        )}

        {/* Lista */}
        <div className="divide-y divide-gray-50">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-6 py-4 animate-pulse">
                <div className="w-10 h-10 rounded-full bg-gray-100" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3.5 bg-gray-100 rounded w-40" />
                  <div className="h-3 bg-gray-50 rounded w-56" />
                </div>
              </div>
            ))
          ) : lista.length === 0 ? (
            <div className="py-16 text-center text-gray-400">
              <Users size={40} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">
                {tab === 'buscar' ? (busca ? 'Nenhum paciente encontrado' : 'Nenhum paciente cadastrado') :
                 tab === 'aniversariantes' ? 'Nenhum aniversariante este mês' :
                 'Nenhum paciente com retorno pendente'}
              </p>
            </div>
          ) : (
            lista.map(p => (
              <button
                key={p.id}
                onClick={() => setPacienteSelecionado(p)}
                className="w-full grid grid-cols-[1fr_160px_180px] gap-4 px-6 py-4 hover:bg-gray-50 transition-colors text-left items-center"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar nome={p.nome} />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900 text-sm truncate">{p.nome}</span>
                      {p.tem_alergia && (
                        <AlertTriangle size={13} className="text-red-500 shrink-0" title="Alergia cadastrada" />
                      )}
                      {tab === 'aniversariantes' && p.data_nascimento && (
                        <span className="badge badge-blue text-xs">🎂 Aniversário</span>
                      )}
                      {tab === 'retornos' && (
                        <span className="badge badge-yellow text-xs">📅 Retorno</span>
                      )}
                    </div>
                    <UltimaConsulta data={p.data_ultima_consulta} />
                  </div>
                </div>
                <span className="text-sm text-gray-500">{p.cpf || '—'}</span>
                <div className="flex items-center gap-1.5 text-sm text-gray-500">
                  {p.telefone && <Phone size={13} className="text-green-500" />}
                  {p.telefone || '—'}
                </div>
              </button>
            ))
          )}
        </div>

        {/* Footer */}
        {lista.length > 0 && (
          <div className="px-6 py-3 border-t border-gray-50 text-xs text-gray-400">
            {lista.length} paciente{lista.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {showCadastro && (
        <CadastrarPacienteModal
          onClose={() => setShowCadastro(false)}
          onSaved={() => { setShowCadastro(false); fetchPacientes() }}
        />
      )}
      {pacienteSelecionado && (
        <PacienteDetalheModal
          paciente={pacienteSelecionado}
          onClose={() => setPacienteSelecionado(null)}
          onUpdated={fetchPacientes}
        />
      )}
    </div>
  )
}

function Users({ size, className }: { size: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  )
}
