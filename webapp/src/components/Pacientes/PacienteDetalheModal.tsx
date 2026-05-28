'use client'
import { useState, useEffect } from 'react'
import { X, Phone, Mail, Calendar, FileText, AlertTriangle, Pill, Activity, MapPin, User, Heart } from 'lucide-react'
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
    rg: paciente.rg || '',
    data_nascimento: paciente.data_nascimento || '',
    profissao: paciente.profissao || '',
    sexo: paciente.sexo || '',
    estado_civil: paciente.estado_civil || '',
    nacionalidade: paciente.nacionalidade || '',
    cep: paciente.cep || '',
    rua: paciente.rua || '',
    numero_endereco: paciente.numero_endereco || '',
    complemento: paciente.complemento || '',
    bairro: paciente.bairro || '',
    cidade: paciente.cidade || '',
    estado_uf: paciente.estado_uf || '',
    filiacao: paciente.filiacao || '',
    indicacao: paciente.indicacao || '',
    plano_odontologico: paciente.plano_odontologico || '',
    numero_carteirinha: paciente.numero_carteirinha || '',
    observacoes_clinicas: paciente.observacoes_clinicas || '',
  })
  const [saving, setSaving] = useState(false)

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

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
    await (supabase.from('pacientes') as any).update({
      nome: form.nome,
      telefone: form.telefone.replace(/\D/g, ''),
      email: form.email || null,
      cpf: form.cpf || null,
      rg: form.rg || null,
      data_nascimento: form.data_nascimento || null,
      profissao: form.profissao || null,
      sexo: form.sexo || null,
      estado_civil: form.estado_civil || null,
      nacionalidade: form.nacionalidade || null,
      cep: form.cep.replace(/\D/g, '') || null,
      rua: form.rua || null,
      numero_endereco: form.numero_endereco || null,
      complemento: form.complemento || null,
      bairro: form.bairro || null,
      cidade: form.cidade || null,
      estado_uf: form.estado_uf || null,
      endereco: [form.rua, form.numero_endereco, form.bairro, form.cidade].filter(Boolean).join(', ') || null,
      filiacao: form.filiacao || null,
      indicacao: form.indicacao || null,
      plano_odontologico: form.plano_odontologico || null,
      numero_carteirinha: form.numero_carteirinha || null,
      observacoes_clinicas: form.observacoes_clinicas || null,
    }).eq('id', paciente.id)
    setSaving(false)
    setEditing(false)
    onUpdated()
  }

  // Build address display string
  const addressLine1 = [paciente.rua, paciente.numero_endereco, paciente.complemento].filter(Boolean).join(', ')
  const addressLine2 = [paciente.bairro, paciente.cidade && paciente.estado_uf ? `${paciente.cidade} - ${paciente.estado_uf}` : paciente.cidade || paciente.estado_uf].filter(Boolean).join(' — ')
  const hasAddress = addressLine1 || addressLine2 || paciente.cep

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
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
          <div className="mx-6 mt-4 flex gap-2 flex-wrap shrink-0">
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
        <div className="flex gap-6 px-6 mt-4 border-b border-gray-100 shrink-0">
          {(['info', 'consultas', 'documentos'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={t === tab ? 'tab-btn-active' : 'tab-btn-inactive'}>
              {t === 'info' ? 'Informações' : t === 'consultas' ? 'Consultas' : 'Documentos'}
            </button>
          ))}
        </div>

        {/* Conteúdo */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {tab === 'info' && !editing && (
            <div className="space-y-5">
              {/* Contato */}
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: Phone,    label: 'Telefone',   value: paciente.telefone },
                  { icon: Mail,     label: 'E-mail',     value: paciente.email || '—' },
                  { icon: Calendar, label: 'Nascimento', value: paciente.data_nascimento ? format(parseISO(paciente.data_nascimento), 'dd/MM/yyyy') : '—' },
                  { icon: Activity, label: 'Profissão',  value: paciente.profissao || '—' },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center mt-0.5 shrink-0">
                      <Icon size={14} className="text-gray-500" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 font-medium">{label}</p>
                      <p className="text-sm text-gray-800">{value}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Documentos pessoais */}
              {(paciente.cpf || paciente.rg) && (
                <div className="flex gap-4">
                  {paciente.cpf && (
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center shrink-0">
                        <FileText size={14} className="text-gray-500" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 font-medium">CPF</p>
                        <p className="text-sm text-gray-800">{paciente.cpf}</p>
                      </div>
                    </div>
                  )}
                  {paciente.rg && (
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center shrink-0">
                        <FileText size={14} className="text-gray-500" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 font-medium">RG</p>
                        <p className="text-sm text-gray-800">{paciente.rg}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Dados pessoais adicionais */}
              {(paciente.sexo || paciente.estado_civil || paciente.nacionalidade) && (
                <div className="bg-gray-50 rounded-xl px-4 py-3 flex flex-wrap gap-x-6 gap-y-2">
                  {paciente.sexo && (
                    <div>
                      <p className="text-xs text-gray-400 font-medium">Sexo</p>
                      <p className="text-sm text-gray-800">{paciente.sexo}</p>
                    </div>
                  )}
                  {paciente.estado_civil && (
                    <div>
                      <p className="text-xs text-gray-400 font-medium">Estado civil</p>
                      <p className="text-sm text-gray-800">{paciente.estado_civil}</p>
                    </div>
                  )}
                  {paciente.nacionalidade && (
                    <div>
                      <p className="text-xs text-gray-400 font-medium">Nacionalidade</p>
                      <p className="text-sm text-gray-800">{paciente.nacionalidade}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Endereço */}
              {hasAddress && (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center mt-0.5 shrink-0">
                    <MapPin size={14} className="text-gray-500" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-medium">Endereço</p>
                    {addressLine1 && <p className="text-sm text-gray-800">{addressLine1}</p>}
                    {addressLine2 && <p className="text-sm text-gray-800">{addressLine2}</p>}
                    {paciente.cep && <p className="text-xs text-gray-500 mt-0.5">CEP: {paciente.cep}</p>}
                  </div>
                </div>
              )}

              {/* Filiação */}
              {paciente.filiacao && (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center mt-0.5 shrink-0">
                    <User size={14} className="text-gray-500" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-medium">Filiação</p>
                    <p className="text-sm text-gray-800">{paciente.filiacao}</p>
                  </div>
                </div>
              )}

              {/* Indicação */}
              {paciente.indicacao && (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center mt-0.5 shrink-0">
                    <Heart size={14} className="text-gray-500" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-medium">Como conheceu a clínica</p>
                    <p className="text-sm text-gray-800">{paciente.indicacao}</p>
                  </div>
                </div>
              )}

              {/* Plano odontológico */}
              {paciente.plano_odontologico && (
                <div className="bg-blue-50 rounded-lg px-4 py-3">
                  <p className="text-xs font-medium text-blue-700">Plano Odontológico</p>
                  <p className="text-sm text-blue-900 mt-0.5">
                    {paciente.plano_odontologico}
                    {paciente.numero_carteirinha && <span className="text-blue-600 ml-2">— Carteirinha: {paciente.numero_carteirinha}</span>}
                  </p>
                </div>
              )}

              {/* Observações clínicas */}
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
                <button onClick={() => setEditing(true)} className="btn-secondary">Editar cadastro</button>
              </div>
            </div>
          )}

          {tab === 'info' && editing && (
            <div className="space-y-5">
              {/* Identificação */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Identificação</p>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Nome completo</label>
                    <input className="input w-full" value={form.nome} onChange={e => set('nome', e.target.value)} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Data de nascimento</label>
                      <input type="date" className="input w-full" value={form.data_nascimento} onChange={e => set('data_nascimento', e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Profissão</label>
                      <input className="input w-full" value={form.profissao} onChange={e => set('profissao', e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Sexo</label>
                    <div className="flex flex-wrap gap-2">
                      {['Masculino', 'Feminino', 'Outro', 'Não informado'].map(opt => (
                        <button key={opt} type="button" onClick={() => set('sexo', form.sexo === opt ? '' : opt)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-medium border-2 transition-all ${
                            form.sexo === opt ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'
                          }`}>
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">CPF</label>
                      <input className="input w-full" placeholder="000.000.000-00" value={form.cpf} onChange={e => set('cpf', e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">RG</label>
                      <input className="input w-full" value={form.rg} onChange={e => set('rg', e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Estado civil</label>
                    <div className="flex flex-wrap gap-2">
                      {['Solteiro(a)', 'Casado(a)', 'Divorciado(a)', 'Viúvo(a)', 'União estável'].map(opt => (
                        <button key={opt} type="button" onClick={() => set('estado_civil', form.estado_civil === opt ? '' : opt)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-medium border-2 transition-all ${
                            form.estado_civil === opt ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'
                          }`}>
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Nacionalidade</label>
                    <input className="input w-full" value={form.nacionalidade} onChange={e => set('nacionalidade', e.target.value)} />
                  </div>
                </div>
              </div>

              {/* Contato */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Contato</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Telefone</label>
                    <input className="input w-full" value={form.telefone} onChange={e => set('telefone', e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">E-mail</label>
                    <input type="email" className="input w-full" value={form.email} onChange={e => set('email', e.target.value)} />
                  </div>
                </div>
              </div>

              {/* Endereço */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Endereço</p>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">CEP</label>
                      <input className="input w-full" placeholder="00000-000" value={form.cep} onChange={e => set('cep', e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Bairro</label>
                      <input className="input w-full" value={form.bairro} onChange={e => set('bairro', e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Rua / Logradouro</label>
                    <input className="input w-full" value={form.rua} onChange={e => set('rua', e.target.value)} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Número</label>
                      <input className="input w-full" value={form.numero_endereco} onChange={e => set('numero_endereco', e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Complemento</label>
                      <input className="input w-full" value={form.complemento} onChange={e => set('complemento', e.target.value)} />
                    </div>
                  </div>
                  <div className="grid grid-cols-[1fr_80px] gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Cidade</label>
                      <input className="input w-full" value={form.cidade} onChange={e => set('cidade', e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Estado</label>
                      <input className="input w-full uppercase" maxLength={2} value={form.estado_uf} onChange={e => set('estado_uf', e.target.value.toUpperCase())} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Complementar */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Informações Complementares</p>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Filiação</label>
                    <textarea className="input resize-none w-full" rows={2} value={form.filiacao} onChange={e => set('filiacao', e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Como conheceu a clínica / Indicação</label>
                    <input className="input w-full" value={form.indicacao} onChange={e => set('indicacao', e.target.value)} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Plano odontológico</label>
                      <input className="input w-full" value={form.plano_odontologico} onChange={e => set('plano_odontologico', e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">N° carteirinha</label>
                      <input className="input w-full" value={form.numero_carteirinha} onChange={e => set('numero_carteirinha', e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Observações clínicas</label>
                    <textarea className="input resize-none w-full" rows={3} value={form.observacoes_clinicas} onChange={e => set('observacoes_clinicas', e.target.value)} />
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button onClick={handleSave} disabled={saving} className="btn-primary">
                  {saving ? 'Salvando...' : 'Salvar alterações'}
                </button>
                <button onClick={() => setEditing(false)} className="btn-secondary">Cancelar</button>
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
