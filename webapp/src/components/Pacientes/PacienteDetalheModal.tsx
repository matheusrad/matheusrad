'use client'
import { useState, useEffect } from 'react'
import { X, Phone, Mail, Calendar, FileText, AlertTriangle, Pill, Activity } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Paciente, Consulta } from '@/types/database'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import clsx from 'clsx'

interface Props {
  paciente: Paciente
  onClose: () => void
  onUpdated: () => void
}

const statusColors: Record<string, string> = {
  Agendado:  'badge-blue',
  Confirmado:'badge-green',
  Realizado: 'badge-green',
  Cancelado: 'badge-red',
  Faltou:    'badge-red',
  Remarcado: 'badge-yellow',
}

export function PacienteDetalheModal({ paciente, onClose, onUpdated }: Props) {
  const [tab, setTab] = useState<'info' | 'consultas' | 'documentos'>('info')
  const [consultas, setConsultas] = useState<Consulta[]>([])
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({
    nome: paciente.nome,
    telefone: paciente.telefone,
    email: paciente.email || '',
    cpf: paciente.cpf || '',
    data_nascimento: paciente.data_nascimento || '',
    profissao: paciente.profissao || '',
    plano_odontologico: paciente.plano_odontologico || '',
    observacoes_clinicas: paciente.observacoes_clinicas || '',
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    supabase.from('consultas')
      .select('*')
      .eq('paciente_id', paciente.id)
      .order('data_consulta', { ascending: false })
      .limit(20)
      .then(({ data }) => setConsultas(data || []))
  }, [paciente.id])

  async function handleSave() {
    setSaving(true)
    await supabase.from('pacientes').update({
      nome: form.nome,
      telefone: form.telefone.replace(/\D/g, ''),
      email: form.email || null,
      cpf: form.cpf || null,
      data_nascimento: form.data_nascimento || null,
      profissao: form.profissao || null,
      plano_odontologico: form.plano_odontologico || null,
      observacoes_clinicas: form.observacoes_clinicas || null,
    }).eq('id', paciente.id)
    setSaving(false)
    setEditing(false)
    onUpdated()
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-semibold">
              {paciente.nome.charAt(0)}
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">{paciente.nome}</h2>
              <p className="text-xs text-gray-500">{paciente.total_consultas} consulta{paciente.total_consultas !== 1 ? 's' : ''} realizadas</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        {/* Alertas clínicos */}
        {(paciente.tem_alergia || paciente.usa_medicamento) && (
          <div className="mx-6 mt-4 flex gap-2 flex-wrap">
            {paciente.tem_alergia && (
              <div className="flex items-center gap-1.5 bg-red-50 text-red-700 text-xs px-3 py-1.5 rounded-lg border border-red-100">
                <AlertTriangle size={13} />
                <span className="font-medium">Alergia:</span> {paciente.descricao_alergia || 'Cadastrada'}
              </div>
            )}
            {paciente.usa_medicamento && (
              <div className="flex items-center gap-1.5 bg-orange-50 text-orange-700 text-xs px-3 py-1.5 rounded-lg border border-orange-100">
                <Pill size={13} />
                <span className="font-medium">Medicamento:</span> {paciente.descricao_medicamento || 'Em uso'}
              </div>
            )}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-6 px-6 mt-4 border-b border-gray-100">
          {(['info','consultas','documentos'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={t === tab ? 'tab-btn-active' : 'tab-btn-inactive'}>
              {t === 'info' ? 'Informações' : t === 'consultas' ? 'Consultas' : 'Documentos'}
            </button>
          ))}
        </div>

        {/* Conteúdo */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {tab === 'info' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: Phone,    label: 'Telefone',    value: paciente.telefone, key: 'telefone' },
                  { icon: Mail,     label: 'E-mail',      value: paciente.email || '—', key: 'email' },
                  { icon: Calendar, label: 'Nascimento',  value: paciente.data_nascimento ? format(parseISO(paciente.data_nascimento), 'dd/MM/yyyy') : '—', key: 'data_nascimento' },
                  { icon: Activity, label: 'Profissão',   value: paciente.profissao || '—', key: 'profissao' },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center mt-0.5">
                      <Icon size={14} className="text-gray-500" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 font-medium">{label}</p>
                      <p className="text-sm text-gray-800">{value}</p>
                    </div>
                  </div>
                ))}
              </div>

              {paciente.cpf && (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                    <FileText size={14} className="text-gray-500" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-medium">CPF</p>
                    <p className="text-sm text-gray-800">{paciente.cpf}</p>
                  </div>
                </div>
              )}

              {paciente.plano_odontologico && (
                <div className="bg-blue-50 rounded-lg px-4 py-3">
                  <p className="text-xs font-medium text-blue-700">Plano Odontológico</p>
                  <p className="text-sm text-blue-900 mt-0.5">{paciente.plano_odontologico}</p>
                </div>
              )}

              {paciente.observacoes_clinicas && (
                <div className="bg-yellow-50 rounded-lg px-4 py-3">
                  <p className="text-xs font-medium text-yellow-700">Observações Clínicas</p>
                  <p className="text-sm text-yellow-900 mt-0.5">{paciente.observacoes_clinicas}</p>
                </div>
              )}

              {paciente.link_anamnese_pdf && (
                <a href={paciente.link_anamnese_pdf} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 text-blue-600 text-sm hover:underline">
                  <FileText size={15} />
                  Ver ficha de anamnese (PDF)
                </a>
              )}

              <div className="flex gap-2 pt-2">
                <a href={`https://wa.me/${paciente.telefone}`} target="_blank" rel="noopener noreferrer"
                  className="btn-primary">
                  <Phone size={15} /> WhatsApp
                </a>
                {!editing ? (
                  <button onClick={() => setEditing(true)} className="btn-secondary">Editar cadastro</button>
                ) : (
                  <>
                    <button onClick={handleSave} disabled={saving} className="btn-primary">
                      {saving ? 'Salvando...' : 'Salvar'}
                    </button>
                    <button onClick={() => setEditing(false)} className="btn-secondary">Cancelar</button>
                  </>
                )}
              </div>
            </div>
          )}

          {tab === 'consultas' && (
            <div className="space-y-2">
              {consultas.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">Nenhuma consulta registrada</p>
              ) : consultas.map(c => (
                <div key={c.id} className="flex items-center justify-between py-3 border-b border-gray-50">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {format(parseISO(c.data_consulta), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">{c.procedimento || 'Consulta'}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {c.valor_cobrado && (
                      <span className="text-sm font-medium text-gray-700">
                        R$ {c.valor_cobrado.toFixed(2).replace('.', ',')}
                      </span>
                    )}
                    <span className={clsx('badge', statusColors[c.status] || 'badge-gray')}>
                      {c.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === 'documentos' && (
            <div className="py-8 text-center text-gray-400 text-sm">
              <FileText size={36} className="mx-auto mb-2 opacity-30" />
              <p>Documentos e prescrições aparecerão aqui</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
