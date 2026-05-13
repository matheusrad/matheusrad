'use client'
import { useState, useEffect } from 'react'
import { Save, User, Building, Webhook, Bell, Shield, ChevronRight, Plus, Pencil, Trash2, X } from 'lucide-react'
import clsx from 'clsx'
import { supabase } from '@/lib/supabase'

type Secao = 'clinica' | 'profissionais' | 'integracoes' | 'notificacoes' | 'seguranca'

const secoes: { id: Secao; label: string; icon: React.ElementType; desc: string }[] = [
  { id: 'clinica',        label: 'Clínica',         icon: Building, desc: 'Dados do consultório, endereço e fiscal' },
  { id: 'profissionais',  label: 'Profissionais',    icon: User,     desc: 'Cadastro de dentistas e especialidades' },
  { id: 'integracoes',    label: 'Integrações',      icon: Webhook,  desc: 'n8n, Evolution API, Supabase, Instagram' },
  { id: 'notificacoes',   label: 'Notificações',     icon: Bell,     desc: 'Lembretes automáticos e alertas' },
  { id: 'seguranca',      label: 'Segurança',        icon: Shield,   desc: 'Senha, acesso e backup de dados' },
]

interface Dentista { id: string; nome: string; especialidade: string | null; cro: string | null; cor: string; ativo: boolean }

const CORES = ['#3B82F6','#10B981','#8B5CF6','#F59E0B','#EF4444','#EC4899','#14B8A6','#F97316']

function DentistaModal({ initial, onClose, onSaved }: {
  initial?: Dentista | null; onClose: () => void; onSaved: (d: Dentista) => void
}) {
  const [nome,   setNome]   = useState(initial?.nome ?? '')
  const [spec,   setSpec]   = useState(initial?.especialidade ?? 'Clínico Geral')
  const [cro,    setCro]    = useState(initial?.cro ?? '')
  const [cor,    setCor]    = useState(initial?.cor ?? '#3B82F6')
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState('')

  async function handleSave() {
    if (!nome.trim()) { setError('Nome é obrigatório.'); return }
    setSaving(true); setError('')
    const payload = { nome: nome.trim(), especialidade: spec || null, cro: cro || null, cor }
    let data, err
    if (initial) {
      ;({ data, error: err } = await supabase.from('dentistas').update(payload).eq('id', initial.id).select().single())
    } else {
      ;({ data, error: err } = await supabase.from('dentistas').insert(payload).select().single())
    }
    if (err) { setError(err.message); setSaving(false); return }
    onSaved(data as Dentista)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-5 z-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">{initial ? 'Editar profissional' : 'Novo profissional'}</h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"><X size={16} /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="label">Nome completo *</label>
            <input value={nome} onChange={e => setNome(e.target.value)} className="input" placeholder="Dra. Lorena..." autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Especialidade</label>
              <input value={spec} onChange={e => setSpec(e.target.value)} className="input" placeholder="Clínico Geral" />
            </div>
            <div>
              <label className="label">CRO</label>
              <input value={cro} onChange={e => setCro(e.target.value)} className="input" placeholder="CRO-SP 00000" />
            </div>
          </div>
          <div>
            <label className="label">Cor na agenda</label>
            <div className="flex gap-2 flex-wrap mt-1">
              {CORES.map(c => (
                <button key={c} onClick={() => setCor(c)} style={{ background: c }}
                  className={clsx('w-8 h-8 rounded-full transition-transform', cor === c && 'scale-110 ring-2 ring-offset-2 ring-gray-400')} />
              ))}
            </div>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
        <div className="flex gap-2 mt-5 justify-end">
          <button onClick={onClose} className="btn-secondary">Cancelar</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary">
            {saving ? 'Salvando...' : initial ? 'Salvar' : 'Adicionar'}
          </button>
        </div>
      </div>
    </div>
  )
}

function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">{label}</p>
      <div className="space-y-3">{children}</div>
    </div>
  )
}

function Field({ label, placeholder, type = 'text', defaultValue }: { label: string; placeholder?: string; type?: string; defaultValue?: string }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      <input className="input w-full" type={type} placeholder={placeholder} defaultValue={defaultValue} />
    </div>
  )
}

function Toggle({ label, desc, defaultChecked }: { label: string; desc: string; defaultChecked?: boolean }) {
  const [on, setOn] = useState(defaultChecked ?? false)
  return (
    <div className="flex items-center justify-between py-3">
      <div>
        <p className="text-sm font-medium text-gray-800">{label}</p>
        <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
      </div>
      <button onClick={() => setOn(!on)}
        className={clsx('w-11 h-6 rounded-full transition-colors relative shrink-0 ml-4', on ? 'bg-blue-600' : 'bg-gray-200')}>
        <span className={clsx('absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform', on ? 'translate-x-5' : 'translate-x-0.5')} />
      </button>
    </div>
  )
}

export function ConfiguracoesPage() {
  const [secaoAtiva,  setSecaoAtiva]  = useState<Secao>('clinica')
  const [salvando,    setSalvando]    = useState(false)
  const [dentistas,   setDentistas]   = useState<Dentista[]>([])
  const [showModal,   setShowModal]   = useState(false)
  const [editando,    setEditando]    = useState<Dentista | null>(null)
  const [deletando,   setDeletando]   = useState<string | null>(null)

  useEffect(() => {
    if (secaoAtiva === 'profissionais') {
      supabase.from('dentistas').select('*').order('nome')
        .then(({ data }) => setDentistas((data as Dentista[]) ?? []))
    }
  }, [secaoAtiva])

  async function handleDelete(id: string) {
    setDeletando(id)
    await supabase.from('dentistas').update({ ativo: false }).eq('id', id)
    setDentistas(prev => prev.filter(d => d.id !== id))
    setDeletando(null)
  }

  function handleSaved(d: Dentista) {
    setDentistas(prev => {
      const idx = prev.findIndex(x => x.id === d.id)
      return idx >= 0 ? prev.map(x => x.id === d.id ? d : x) : [...prev, d]
    })
    setShowModal(false); setEditando(null)
  }

  async function salvar() {
    setSalvando(true)
    await new Promise(r => setTimeout(r, 800))
    setSalvando(false)
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
        <button onClick={salvar} disabled={salvando} className="btn-primary disabled:opacity-60">
          <Save size={15} /> {salvando ? 'Salvando...' : 'Salvar alterações'}
        </button>
      </div>

      <div className="flex gap-6">
        {/* Menu lateral */}
        <div className="w-56 shrink-0">
          <div className="card overflow-hidden">
            {secoes.map(s => {
              const Icon = s.icon
              return (
                <button key={s.id} onClick={() => setSecaoAtiva(s.id)}
                  className={clsx(
                    'w-full flex items-center gap-3 px-4 py-3.5 text-left border-b border-gray-50 last:border-0 transition-colors',
                    s.id === secaoAtiva ? 'bg-blue-50' : 'hover:bg-gray-50'
                  )}>
                  <Icon size={16} className={s.id === secaoAtiva ? 'text-blue-600' : 'text-gray-400'} />
                  <span className={clsx('text-sm font-medium', s.id === secaoAtiva ? 'text-blue-700' : 'text-gray-700')}>
                    {s.label}
                  </span>
                  <ChevronRight size={14} className="ml-auto text-gray-300" />
                </button>
              )
            })}
          </div>
        </div>

        {/* Conteúdo */}
        <div className="flex-1 card p-6 space-y-6">

          {secaoAtiva === 'clinica' && (
            <>
              <FieldGroup label="Dados do consultório">
                <Field label="Razão social" placeholder="Ex: Dra. Ana Silva Odontologia LTDA" defaultValue="Clínica Odontológica" />
                <Field label="CNPJ" placeholder="00.000.000/0001-00" />
                <Field label="Inscrição municipal" placeholder="Número de inscrição municipal" />
                <Field label="Código de serviço (NFS-e)" placeholder="Ex: 8630" defaultValue="8630" />
              </FieldGroup>
              <FieldGroup label="Endereço">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Rua" placeholder="Nome da rua" />
                  <Field label="Número" placeholder="123" />
                  <Field label="Bairro" placeholder="Bairro" />
                  <Field label="CEP" placeholder="00000-000" />
                  <Field label="Cidade" placeholder="São Paulo" />
                  <Field label="Estado" placeholder="SP" />
                </div>
              </FieldGroup>
              <FieldGroup label="Contato">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Telefone/WhatsApp" placeholder="(11) 99999-9999" />
                  <Field label="E-mail" type="email" placeholder="contato@clinica.com.br" />
                </div>
              </FieldGroup>
            </>
          )}

          {secaoAtiva === 'profissionais' && (
            <>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Profissionais cadastrados</p>
                <button onClick={() => { setEditando(null); setShowModal(true) }} className="btn-primary text-xs py-1.5 px-3">
                  <Plus size={13} /> Novo profissional
                </button>
              </div>

              {dentistas.length === 0 ? (
                <div className="py-12 flex flex-col items-center gap-3 text-center border-2 border-dashed border-gray-200 rounded-2xl">
                  <User size={36} className="text-gray-200" />
                  <p className="text-sm text-gray-500">Nenhum profissional cadastrado ainda.</p>
                  <button onClick={() => { setEditando(null); setShowModal(true) }} className="btn-primary text-xs">
                    <Plus size={12} /> Cadastrar primeiro profissional
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {dentistas.map(d => (
                    <div key={d.id} className="flex items-center gap-4 p-4 border border-gray-100 rounded-xl hover:border-gray-200 transition-colors">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
                        style={{ background: d.cor }}>
                        {d.nome.trim().split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-sm">{d.nome}</p>
                        <p className="text-xs text-gray-400">
                          {d.especialidade ?? 'Clínico Geral'}
                          {d.cro && ` · ${d.cro}`}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => { setEditando(d); setShowModal(true) }}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => handleDelete(d.id)} disabled={deletando === d.id}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {secaoAtiva === 'integracoes' && (
            <>
              <FieldGroup label="Supabase">
                <Field label="URL do projeto" placeholder="https://xxx.supabase.co" />
                <Field label="Chave anônima (anon key)" placeholder="eyJ..." type="password" />
              </FieldGroup>
              <FieldGroup label="n8n (automações)">
                <Field label="URL do n8n" placeholder="http://localhost:5678" defaultValue="http://localhost:5678" />
                <Field label="Webhook — Prescrição/Laudo" placeholder="https://n8n.local/webhook/prescricao" />
                <Field label="Webhook — Nota Fiscal" placeholder="https://n8n.local/webhook/nota-fiscal" />
              </FieldGroup>
              <FieldGroup label="Evolution API (WhatsApp)">
                <Field label="URL da Evolution API" placeholder="http://localhost:8080" defaultValue="http://localhost:8080" />
                <Field label="API Key" type="password" placeholder="Chave de autenticação" />
                <Field label="Instância" placeholder="nome-da-instancia" />
              </FieldGroup>
              <FieldGroup label="Instagram (Meta Graph API)">
                <Field label="Access Token" type="password" placeholder="Token de longa duração" />
                <Field label="Instagram User ID" placeholder="1234567890" />
              </FieldGroup>
            </>
          )}

          {secaoAtiva === 'notificacoes' && (
            <div className="divide-y divide-gray-50">
              <Toggle label="Confirmação de consulta semanal" desc="Envia WhatsApp segunda-feira às 8h para pacientes da semana" defaultChecked />
              <Toggle label="Lembrete 24h antes" desc="Avisa o paciente um dia antes da consulta" defaultChecked />
              <Toggle label="Aniversariantes do mês" desc="Parabeniza pacientes no dia do aniversário" defaultChecked />
              <Toggle label="Retorno semestral" desc="Lembrete para pacientes sem consulta há 6 meses" />
              <Toggle label="Alerta de inadimplência" desc="Notifica consultas não comparecidas" defaultChecked />
              <Toggle label="Notificação de nova mensagem" desc="Alerta no painel ao receber mensagem no WhatsApp" defaultChecked />
            </div>
          )}

          {secaoAtiva === 'seguranca' && (
            <>
              <FieldGroup label="Alterar senha">
                <Field label="Senha atual" type="password" placeholder="••••••••" />
                <Field label="Nova senha" type="password" placeholder="••••••••" />
                <Field label="Confirmar nova senha" type="password" placeholder="••••••••" />
              </FieldGroup>
              <FieldGroup label="Backup de dados">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div>
                    <p className="text-sm font-medium text-gray-800">Backup automático no Supabase</p>
                    <p className="text-xs text-gray-500 mt-0.5">Dados protegidos com replicação em tempo real</p>
                  </div>
                  <span className="badge badge-green">Ativo</span>
                </div>
                <button className="btn-secondary text-sm w-full justify-center">
                  Exportar todos os dados (CSV)
                </button>
              </FieldGroup>
            </>
          )}
        </div>
      </div>

      {showModal && (
        <DentistaModal
          initial={editando}
          onClose={() => { setShowModal(false); setEditando(null) }}
          onSaved={handleSaved}
        />
      )}
    </div>
  )
}
