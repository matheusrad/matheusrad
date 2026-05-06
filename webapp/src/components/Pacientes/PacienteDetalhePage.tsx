'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, Edit2, AlertCircle, Phone, Mail, Cake, FileText,
  Plus, Calendar, Clock, CheckCircle2, XCircle, DollarSign,
  Upload, Download, Trash2, ChevronRight, User, Clipboard,
  Activity, CreditCard, Folder, Archive,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Paciente, Consulta, Documento } from '@/types/database'
import { format, parseISO, differenceInYears, formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Odontograma, type ToothTratamento } from '@/components/Odontograma/Odontograma'
import clsx from 'clsx'

type Tab = 'visao-geral' | 'anamneses' | 'orcamentos' | 'tratamentos' | 'pagamentos' | 'evolucoes' | 'documentos' | 'arquivos'

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'visao-geral',  label: 'Visão Geral',   icon: User },
  { id: 'anamneses',    label: 'Anamneses',      icon: Clipboard },
  { id: 'orcamentos',   label: 'Orçamentos',     icon: DollarSign },
  { id: 'tratamentos',  label: 'Tratamentos',    icon: Activity },
  { id: 'pagamentos',   label: 'Pagamentos',     icon: CreditCard },
  { id: 'evolucoes',    label: 'Evoluções',      icon: FileText },
  { id: 'documentos',   label: 'Documentos',     icon: Folder },
  { id: 'arquivos',     label: 'Arquivos',       icon: Archive },
]

const statusConsultaConfig: Record<string, { label: string; color: string }> = {
  Agendado:   { label: 'Agendado',   color: 'badge-blue' },
  Confirmado: { label: 'Confirmado', color: 'badge-green' },
  Realizado:  { label: 'Realizado',  color: 'badge-gray' },
  Cancelado:  { label: 'Cancelado',  color: 'badge-red' },
  Faltou:     { label: 'Faltou',     color: 'badge-red' },
  Remarcado:  { label: 'Remarcado',  color: 'badge-yellow' },
}

function EmptyState({ icon: Icon, title, action }: { icon: React.ElementType; title: string; action?: React.ReactNode }) {
  return (
    <div className="py-16 flex flex-col items-center justify-center text-center gap-3">
      <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center">
        <Icon size={28} className="text-gray-300" />
      </div>
      <p className="text-sm text-gray-500">{title}</p>
      {action}
    </div>
  )
}

export function PacienteDetalhePage({ id }: { id: string }) {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('visao-geral')
  const [paciente, setPaciente] = useState<Paciente | null>(null)
  const [consultas, setConsultas] = useState<Consulta[]>([])
  const [documentos, setDocumentos] = useState<Documento[]>([])
  const [loading, setLoading] = useState(true)
  const [editando, setEditando] = useState(false)

  // Mock tratamentos per tooth (in production comes from tratamentos table)
  const [tratamentos] = useState<Record<number, ToothTratamento>>({})

  useEffect(() => {
    async function load() {
      setLoading(true)
      const [{ data: p }, { data: c }, { data: d }] = await Promise.all([
        supabase.from('pacientes').select('*').eq('id', id).single(),
        supabase.from('consultas').select('*').eq('paciente_id', id).order('data_consulta', { ascending: false }),
        supabase.from('documentos').select('*').eq('paciente_id', id).order('created_at', { ascending: false }),
      ])
      setPaciente(p)
      setConsultas(c || [])
      setDocumentos(d || [])
      setLoading(false)
    }
    load()
  }, [id])

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto animate-pulse space-y-4">
        <div className="h-8 w-40 bg-gray-100 rounded" />
        <div className="card p-6 h-24 bg-gray-50" />
      </div>
    )
  }

  if (!paciente) {
    return (
      <div className="max-w-5xl mx-auto">
        <button onClick={() => router.back()} className="btn-secondary mb-4">
          <ArrowLeft size={15} /> Voltar
        </button>
        <div className="card p-12 text-center text-gray-400">Paciente não encontrado</div>
      </div>
    )
  }

  const idade = paciente.data_nascimento
    ? differenceInYears(new Date(), parseISO(paciente.data_nascimento))
    : null

  const temAlertas = paciente.tem_alergia || paciente.usa_medicamento || paciente.tem_doenca_sistemica

  return (
    <div className="max-w-5xl mx-auto">
      {/* Breadcrumb */}
      <button onClick={() => router.push('/pacientes')}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4 transition-colors">
        <ArrowLeft size={15} /> Pacientes
      </button>

      {/* Patient header */}
      <div className="card mb-4">
        <div className="px-6 pt-6 pb-0">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xl font-bold shrink-0">
                {paciente.nome.charAt(0)}
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{paciente.nome}</h1>
                <div className="flex items-center gap-3 mt-1 flex-wrap">
                  {idade !== null && (
                    <span className="text-sm text-gray-500">{idade} anos</span>
                  )}
                  {paciente.cpf && (
                    <span className="text-sm text-gray-400">CPF {paciente.cpf}</span>
                  )}
                  <span className={clsx('badge border', paciente.status === 'Ativo' ? 'badge-green border-green-200' : 'badge-gray border-gray-200')}>
                    {paciente.status}
                  </span>
                  {paciente.novo_paciente && (
                    <span className="badge badge-blue">Novo paciente</span>
                  )}
                </div>
              </div>
            </div>
            <button onClick={() => setEditando(true)} className="btn-secondary text-xs">
              <Edit2 size={13} /> Editar
            </button>
          </div>

          {/* Alertas clínicos */}
          {temAlertas && (
            <div className="flex flex-wrap gap-2 mb-4">
              {paciente.tem_alergia && (
                <div className="flex items-center gap-1.5 text-xs text-red-700 bg-red-50 border border-red-100 px-3 py-1.5 rounded-lg">
                  <AlertCircle size={12} />
                  Alergia: {paciente.descricao_alergia}
                </div>
              )}
              {paciente.usa_medicamento && (
                <div className="flex items-center gap-1.5 text-xs text-orange-700 bg-orange-50 border border-orange-100 px-3 py-1.5 rounded-lg">
                  <AlertCircle size={12} />
                  Medicamento: {paciente.descricao_medicamento}
                </div>
              )}
              {paciente.tem_doenca_sistemica && (
                <div className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-100 px-3 py-1.5 rounded-lg">
                  <AlertCircle size={12} />
                  {paciente.descricao_doenca}
                </div>
              )}
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-1 overflow-x-auto -mx-1 px-1 scrollbar-hide">
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={clsx(
                  'flex items-center gap-1.5 px-3 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors shrink-0',
                  t.id === tab
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                )}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab content */}
        <div className="p-6">

          {/* VISÃO GERAL */}
          {tab === 'visao-geral' && (
            <div className="grid grid-cols-[280px_1fr] gap-6">
              {/* Left panel */}
              <div className="space-y-5">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Informações</p>
                  <div className="space-y-2.5">
                    {paciente.telefone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone size={13} className="text-gray-400 shrink-0" />
                        <a href={`https://wa.me/${paciente.telefone.replace(/\D/g,'')}`}
                          target="_blank" rel="noopener noreferrer"
                          className="text-blue-600 hover:underline">{paciente.telefone}</a>
                      </div>
                    )}
                    {paciente.email && (
                      <div className="flex items-center gap-2 text-sm">
                        <Mail size={13} className="text-gray-400 shrink-0" />
                        <span className="text-gray-700">{paciente.email}</span>
                      </div>
                    )}
                    {paciente.data_nascimento && (
                      <div className="flex items-center gap-2 text-sm">
                        <Cake size={13} className="text-gray-400 shrink-0" />
                        <span className="text-gray-700">
                          {format(parseISO(paciente.data_nascimento), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                        </span>
                      </div>
                    )}
                    {paciente.plano_odontologico && (
                      <div className="flex items-center gap-2 text-sm">
                        <FileText size={13} className="text-gray-400 shrink-0" />
                        <span className="text-gray-700">{paciente.plano_odontologico}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="border-t border-gray-50 pt-4">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Preferência de lembretes</p>
                  <p className="text-sm text-gray-700">WhatsApp</p>
                </div>

                <div className="border-t border-gray-50 pt-4">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Estatísticas</p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Total consultas</span>
                      <span className="font-medium text-gray-800">{paciente.total_consultas}</span>
                    </div>
                    {paciente.data_ultima_consulta && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Última consulta</span>
                        <span className="font-medium text-gray-800">
                          {formatDistanceToNow(parseISO(paciente.data_ultima_consulta), { locale: ptBR, addSuffix: true })}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right panel: odontogram + recent history */}
              <div className="space-y-6">
                {/* Odontogram */}
                <div className="border border-gray-100 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-semibold text-gray-700">Odontograma</p>
                    <div className="flex gap-1">
                      <button className="px-2.5 py-1 text-xs bg-blue-50 text-blue-700 rounded-lg font-medium">Permanentes</button>
                      <button className="px-2.5 py-1 text-xs text-gray-500 hover:bg-gray-50 rounded-lg font-medium">Decíduos</button>
                    </div>
                  </div>
                  <Odontograma tratamentos={tratamentos} />
                </div>

                {/* Historical consultations */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-semibold text-gray-700">Histórico de consultas</p>
                    <button className="btn-secondary text-xs py-1 px-3">
                      <Calendar size={12} /> Adicionar
                    </button>
                  </div>
                  {consultas.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-6">Nenhuma consulta registrada</p>
                  ) : (
                    <div className="space-y-2">
                      {consultas.slice(0, 5).map(c => {
                        const cfg = statusConsultaConfig[c.status] || statusConsultaConfig.Agendado
                        return (
                          <div key={c.id} className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0">
                            <div className="text-sm text-gray-500 w-32 shrink-0">
                              {format(parseISO(c.data_consulta), 'dd/MM/yyyy HH:mm')}
                            </div>
                            <p className="flex-1 text-sm text-gray-700 truncate">{c.procedimento || 'Consulta'}</p>
                            <span className={clsx('badge border border-current', cfg.color)}>{cfg.label}</span>
                          </div>
                        )
                      })}
                      {consultas.length > 5 && (
                        <button onClick={() => setTab('tratamentos')}
                          className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-1">
                          Ver todas ({consultas.length}) <ChevronRight size={12} />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ANAMNESES */}
          {tab === 'anamneses' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-semibold text-gray-800">Anamneses</h2>
                <button className="btn-primary">
                  <Clipboard size={14} /> Preencher anamnese
                </button>
              </div>
              {paciente.link_anamnese_pdf ? (
                <div className="border border-gray-100 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-800">Anamnese inicial</p>
                    <p className="text-xs text-gray-500 mt-0.5">PDF gerado pelo assistente IA</p>
                  </div>
                  <div className="flex gap-2">
                    <a href={paciente.link_anamnese_pdf} target="_blank" rel="noopener noreferrer" className="btn-secondary text-xs py-1.5 px-3">
                      <Download size={12} /> Baixar PDF
                    </a>
                  </div>
                </div>
              ) : (
                <EmptyState
                  icon={Clipboard}
                  title="O paciente não tem anamneses preenchidas. Vamos criar a primeira?"
                />
              )}
            </div>
          )}

          {/* ORÇAMENTOS */}
          {tab === 'orcamentos' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-semibold text-gray-800">Orçamentos</h2>
                <button className="btn-primary">
                  <Plus size={14} /> Novo orçamento
                </button>
              </div>
              <EmptyState
                icon={DollarSign}
                title="Nenhum orçamento foi criado para esse paciente. Vamos começar?"
              />
            </div>
          )}

          {/* TRATAMENTOS */}
          {tab === 'tratamentos' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-800">Tratamentos</h2>
                <button className="btn-primary">
                  <Plus size={14} /> Adicionar tratamento
                </button>
              </div>

              <div className="border border-gray-100 rounded-xl p-4 mb-6">
                <div className="flex gap-2 mb-4">
                  <button className="px-3 py-1.5 text-xs bg-blue-50 text-blue-700 rounded-lg font-medium">Permanentes</button>
                  <button className="px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-50 rounded-lg font-medium">Decíduos</button>
                </div>
                <Odontograma
                  tratamentos={tratamentos}
                  onToothClick={(n) => console.log('tooth', n)}
                />
              </div>

              <EmptyState
                icon={Activity}
                title="Sem tratamentos por aqui ainda. Vamos adicionar o primeiro?"
              />
            </div>
          )}

          {/* PAGAMENTOS */}
          {tab === 'pagamentos' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-semibold text-gray-800">Pagamentos</h2>
                <button className="btn-primary">
                  <Plus size={14} /> Registrar pagamento
                </button>
              </div>
              <EmptyState
                icon={CreditCard}
                title="Ainda não foram registrados pagamentos"
              />
            </div>
          )}

          {/* EVOLUÇÕES */}
          {tab === 'evolucoes' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-semibold text-gray-800">Evoluções clínicas</h2>
                <button className="btn-primary">
                  <Plus size={14} /> Adicionar evolução
                </button>
              </div>
              <EmptyState
                icon={Activity}
                title="Você ainda não registrou evoluções para este paciente. Vamos começar?"
              />
            </div>
          )}

          {/* DOCUMENTOS */}
          {tab === 'documentos' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-semibold text-gray-800">Documentos</h2>
                <button className="btn-primary">
                  <Plus size={14} /> Gerar documento
                </button>
              </div>
              {documentos.length === 0 ? (
                <EmptyState icon={FileText} title="Nenhum documento gerado para este paciente" />
              ) : (
                <div className="space-y-2">
                  {documentos.map(doc => (
                    <div key={doc.id} className="flex items-center gap-4 p-3 border border-gray-100 rounded-xl hover:bg-gray-50">
                      <FileText size={18} className="text-blue-400 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 capitalize">{doc.tipo}</p>
                        <p className="text-xs text-gray-500">{doc.numero_documento} · {doc.created_at ? format(parseISO(doc.created_at), 'dd/MM/yyyy') : ''}</p>
                      </div>
                      {doc.link_pdf && (
                        <a href={doc.link_pdf} target="_blank" rel="noopener noreferrer"
                          className="btn-secondary text-xs py-1 px-2.5">
                          <Download size={12} /> PDF
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ARQUIVOS */}
          {tab === 'arquivos' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-semibold text-gray-800">Arquivos</h2>
                <button className="btn-primary">
                  <Upload size={14} /> Enviar arquivo
                </button>
              </div>
              <EmptyState
                icon={Archive}
                title="Nenhum arquivo anexado"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
