'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { Save, User, Building, ChevronRight, Plus, Pencil, Trash2, X, FileText, MessageSquare, CreditCard, Stethoscope, MoreVertical } from 'lucide-react'
import clsx from 'clsx'
import { supabase } from '@/lib/supabase'

type Secao = 'convenios' | 'anamneses' | 'mensagens' | 'clinica' | 'profissionais' | 'taxas'

const secoes: { id: Secao; label: string; icon: React.ElementType; desc: string }[] = [
  { id: 'convenios',     label: 'Convênios',      icon: Stethoscope,    desc: 'Planos e convênios odontológicos aceitos' },
  { id: 'anamneses',     label: 'Anamneses',       icon: FileText,       desc: 'Modelos e perguntas do formulário' },
  { id: 'mensagens',     label: 'Mensagens',       icon: MessageSquare,  desc: 'Templates de WhatsApp e lembretes' },
  { id: 'clinica',       label: 'Clínica',         icon: Building,       desc: 'Dados do consultório, endereço e fiscal' },
  { id: 'profissionais', label: 'Profissional',    icon: User,           desc: 'Cadastro de dentistas e especialidades' },
  { id: 'taxas',         label: 'Taxas maquininha',icon: CreditCard,     desc: 'Taxas das operadoras de cartão' },
]

interface Dentista { id: string; nome: string; especialidade: string | null; cro: string | null; cor: string; ativo: boolean; email?: string | null }

const CORES = ['#3B82F6','#10B981','#8B5CF6','#F59E0B','#EF4444','#EC4899','#14B8A6','#F97316']

interface Convenio { id: string; nome: string; registro: string | null; ativo: boolean }

function DentistaModal({ initial, onClose, onSaved }: {
  initial?: Dentista | null; onClose: () => void; onSaved: (d: Dentista) => void
}) {
  const [nome,   setNome]   = useState(initial?.nome ?? '')
  const [email,  setEmail]  = useState(initial?.email ?? '')
  const [spec,   setSpec]   = useState(initial?.especialidade ?? 'Clínico Geral')
  const [cro,    setCro]    = useState(initial?.cro ?? '')
  const [cor,    setCor]    = useState(initial?.cor ?? '#3B82F6')
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState('')

  async function handleSave() {
    if (!nome.trim()) { setError('Nome é obrigatório.'); return }
    setSaving(true); setError('')
    const payload = { nome: nome.trim(), email: email || null, especialidade: spec || null, cro: cro || null, cor }
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
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-5 z-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">{initial ? 'Editar profissional' : 'Novo profissional'}</h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"><X size={16} /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="label">Nome completo *</label>
            <input value={nome} onChange={e => setNome(e.target.value)} className="input" placeholder="Dra. Lorena..." autoFocus />
          </div>
          <div>
            <label className="label">E-mail</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="input" placeholder="dentista@email.com" />
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

const BANDEIRAS = [
  { nome: 'Visa Débito',        taxa: '' },
  { nome: 'Visa Crédito à vista', taxa: '' },
  { nome: 'Visa Crédito parcelado', taxa: '' },
  { nome: 'Mastercard Débito',  taxa: '' },
  { nome: 'Mastercard Crédito à vista', taxa: '' },
  { nome: 'Mastercard Crédito parcelado', taxa: '' },
  { nome: 'Elo Débito',         taxa: '' },
  { nome: 'Elo Crédito',        taxa: '' },
  { nome: 'Hipercard',          taxa: '' },
  { nome: 'American Express',   taxa: '' },
  { nome: 'Pix',                taxa: '' },
]

function TaxasMaquininha() {
  const [taxas, setTaxas] = useState(BANDEIRAS)

  function setTaxa(i: number, val: string) {
    setTaxas(prev => prev.map((t, idx) => idx === i ? { ...t, taxa: val } : t))
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">Taxa por modalidade (%)</p>
      {taxas.map((t, i) => (
        <div key={t.nome} className="flex items-center gap-4 py-2.5 border-b border-gray-50 last:border-0">
          <p className="flex-1 text-sm text-gray-700">{t.nome}</p>
          <div className="flex items-center gap-1">
            <input
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={t.taxa}
              onChange={e => setTaxa(i, e.target.value)}
              placeholder="0,00"
              className="w-20 text-right input py-1.5 text-sm"
            />
            <span className="text-sm text-gray-400">%</span>
          </div>
        </div>
      ))}
      <p className="text-xs text-gray-400 pt-2">As taxas são usadas para calcular o líquido recebido nos relatórios financeiros.</p>
    </div>
  )
}

function ConveniosSecao() {
  const [convenios, setConvenios] = useState<Convenio[]>([
    { id: '1', nome: 'Amil Dental', registro: 'ANS 000001', ativo: true },
    { id: '2', nome: 'Bradesco Dental', registro: 'ANS 000002', ativo: true },
    { id: '3', nome: 'Odontoprev', registro: 'ANS 000003', ativo: true },
    { id: '4', nome: 'Particular', registro: null, ativo: true },
  ])
  const [novo, setNovo] = useState(false)
  const [novoNome, setNovoNome] = useState('')
  const [novoReg, setNovoReg] = useState('')

  function addConvenio() {
    if (!novoNome.trim()) return
    setConvenios(prev => [...prev, { id: Date.now().toString(), nome: novoNome.trim(), registro: novoReg || null, ativo: true }])
    setNovoNome(''); setNovoReg(''); setNovo(false)
  }

  function removeConvenio(id: string) {
    setConvenios(prev => prev.filter(c => c.id !== id))
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Convênios e planos aceitos</p>
        <button onClick={() => setNovo(true)} className="btn-primary text-xs py-1.5 px-3">
          <Plus size={13} /> Adicionar
        </button>
      </div>

      {novo && (
        <div className="flex gap-2 p-3 bg-blue-50 rounded-xl border border-blue-100">
          <input value={novoNome} onChange={e => setNovoNome(e.target.value)} placeholder="Nome do convênio *"
            className="input flex-1 text-sm" autoFocus onKeyDown={e => e.key === 'Enter' && addConvenio()} />
          <input value={novoReg} onChange={e => setNovoReg(e.target.value)} placeholder="Registro ANS (opcional)"
            className="input w-44 text-sm" />
          <button onClick={addConvenio} className="btn-primary text-xs px-3">OK</button>
          <button onClick={() => { setNovo(false); setNovoNome(''); setNovoReg('') }} className="btn-secondary text-xs px-3">Cancelar</button>
        </div>
      )}

      <div className="space-y-1">
        {convenios.map(c => (
          <div key={c.id} className="flex items-center gap-3 px-4 py-3 border border-gray-100 rounded-xl hover:border-gray-200 transition-colors">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
              <Stethoscope size={14} className="text-blue-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900">{c.nome}</p>
              {c.registro && <p className="text-xs text-gray-400">{c.registro}</p>}
            </div>
            <button onClick={() => removeConvenio(c.id)} className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

function MensagensSecao() {
  const templates = [
    { key: 'confirmacao', label: 'Confirmação de consulta', desc: 'Enviado 24h antes da consulta' },
    { key: 'lembrete',    label: 'Lembrete semanal',        desc: 'Segunda-feira às 8h para toda a semana' },
    { key: 'aniversario', label: 'Parabéns aniversariante', desc: 'Enviado no dia do aniversário' },
    { key: 'retorno',     label: 'Lembrete de retorno',     desc: 'Para pacientes sem consulta há 6 meses' },
    { key: 'falta',       label: 'Paciente não compareceu', desc: 'Enviado quando consulta é marcada como falta' },
  ]
  const [ativo, setAtivo] = useState(templates[0].key)
  const [textos, setTextos] = useState<Record<string, string>>({
    confirmacao: 'Olá, {{nome}}! Lembramos que você tem consulta amanhã, {{data}} às {{hora}}, no Consultório Dra. Lorena Coutinho. Confirme sua presença respondendo SIM. 😊',
    lembrete:    'Olá, {{nome}}! Você tem consulta essa semana: {{data}} às {{hora}}. Qualquer dúvida, entre em contato. 🦷',
    aniversario: 'Feliz aniversário, {{nome}}! 🎂 O Consultório Dra. Lorena Coutinho deseja um dia incrível para você!',
    retorno:     'Olá, {{nome}}! Faz um tempo que não te vemos por aqui. Que tal agendar uma revisão? Entre em contato para marcar sua consulta. 😊',
    falta:       'Olá, {{nome}}. Notamos que você não compareceu à sua consulta de {{data}}. Gostaria de reagendar? Estamos à disposição.',
  })

  return (
    <div className="flex gap-4 min-h-64">
      <div className="w-52 shrink-0 space-y-1">
        {templates.map(t => (
          <button key={t.key} onClick={() => setAtivo(t.key)}
            className={clsx('w-full text-left px-3 py-2.5 rounded-xl text-sm transition-colors',
              ativo === t.key ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-50')}>
            {t.label}
          </button>
        ))}
      </div>
      <div className="flex-1 space-y-2">
        <div className="text-xs text-gray-400 bg-gray-50 rounded-lg px-3 py-2">
          Variáveis disponíveis: <code className="text-blue-600">{'{{nome}}'}</code> <code className="text-blue-600">{'{{data}}'}</code> <code className="text-blue-600">{'{{hora}}'}</code> <code className="text-blue-600">{'{{convenio}}'}</code>
        </div>
        <textarea
          rows={7}
          value={textos[ativo] ?? ''}
          onChange={e => setTextos(prev => ({ ...prev, [ativo]: e.target.value }))}
          className="input w-full text-sm resize-none"
          placeholder="Digite o template da mensagem..."
        />
        <div className="flex items-center justify-between">
          <Toggle label="Ativar envio automático" desc={templates.find(t => t.key === ativo)?.desc ?? ''} defaultChecked />
        </div>
      </div>
    </div>
  )
}

function DentistaRow({ dentista: d, initials, onEdit, onDelete, deleting }: {
  dentista: Dentista; initials: string; onEdit: () => void; onDelete: () => void; deleting: boolean
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  return (
    <tr className="hover:bg-gray-50 transition-colors relative">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
            style={{ background: d.cor }}>
            {initials}
          </div>
          <span className="font-medium text-gray-900">{d.nome}</span>
        </div>
      </td>
      <td className="px-4 py-4 text-gray-500">{d.email ?? '—'}</td>
      <td className="px-4 py-4 text-gray-700">{d.cro ?? '—'}</td>
      <td className="px-4 py-4">
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border border-blue-200 text-blue-700 bg-blue-50">
          {d.especialidade ?? 'Dentista'}
        </span>
      </td>
      <td className="px-4 py-4 relative">
        <button onClick={() => setMenuOpen(v => !v)}
          className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
          <MoreVertical size={15} />
        </button>
        {menuOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
            <div className="absolute right-4 top-10 z-20 bg-white border border-gray-100 rounded-xl shadow-lg py-1 w-36">
              <button onClick={() => { setMenuOpen(false); onEdit() }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                <Pencil size={13} /> Editar
              </button>
              <button onClick={() => { setMenuOpen(false); onDelete() }} disabled={deleting}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50">
                <Trash2 size={13} /> {deleting ? 'Removendo...' : 'Desativar'}
              </button>
            </div>
          </>
        )}
      </td>
    </tr>
  )
}

const FUSOS = [
  'America/Sao_Paulo', 'America/Manaus', 'America/Belem',
  'America/Fortaleza', 'America/Recife', 'America/Cuiaba',
  'America/Porto_Velho', 'America/Boa_Vista', 'America/Rio_Branco',
]

const UFS = ['AC','AL','AM','AP','BA','CE','DF','ES','GO','MA','MG','MS','MT','PA','PB','PE','PI','PR','RJ','RN','RO','RR','RS','SC','SE','SP','TO']

interface ClinicaConfig {
  id?: string; nome: string; email: string; cnpj: string; telefone: string; whatsapp: string; cro: string
  fuso_horario: string; cep: string; endereco: string; numero: string; complemento: string
  bairro: string; cidade: string; estado: string; emitir_recibo: string
  pacientes_aguardando: boolean; pesquisa_satisfacao: boolean
  dentista_nome: string; dentista_cro: string
}

const CONFIG_VAZIA: ClinicaConfig = {
  nome: 'Consultório Dra. Lorena Coutinho', email: '', cnpj: '', telefone: '', whatsapp: '', cro: '',
  fuso_horario: 'America/Sao_Paulo', cep: '', endereco: '', numero: '', complemento: '',
  bairro: '', cidade: '', estado: 'SP', emitir_recibo: 'dentista',
  pacientes_aguardando: true, pesquisa_satisfacao: false,
  dentista_nome: 'Dra. Lorena Coutinho', dentista_cro: '',
}

function ClinicaSecao({ registerSalvar }: { registerSalvar?: (fn: () => Promise<void>) => void }) {
  const [cfg,      setCfg]      = useState<ClinicaConfig>(CONFIG_VAZIA)
  const [loading,  setLoading]  = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [ok,       setOk]       = useState(false)
  const [erro,     setErro]     = useState('')
  const [logo,     setLogo]     = useState<string | null>(null)

  useEffect(() => {
    supabase.from('configuracoes_clinica').select('*').limit(1).single()
      .then(({ data, error }) => {
        if (data) setCfg(data as ClinicaConfig)
        setLoading(false)
      })
  }, [])

  function set(field: keyof ClinicaConfig, value: string | boolean) {
    setCfg(prev => ({ ...prev, [field]: value }))
  }

  async function salvar() {
    setSalvando(true); setOk(false); setErro('')

    const { id, ...payload } = cfg

    let error
    if (id) {
      ;({ error } = await supabase.from('configuracoes_clinica').update(payload).eq('id', id))
    } else {
      const { data, error: err } = await supabase.from('configuracoes_clinica').insert(payload).select().single()
      error = err
      if (data) setCfg(data as ClinicaConfig)
    }

    setSalvando(false)
    if (error) {
      setErro(error.message)
    } else {
      setOk(true)
      setTimeout(() => setOk(false), 3000)
    }
  }

  function handleLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setLogo(URL.createObjectURL(file))
  }

  useEffect(() => {
    registerSalvar?.(salvar)
  })

  if (loading) return <div className="py-12 text-center text-sm text-gray-400">Carregando...</div>

  return (
    <div className="space-y-6">
      {/* Dados da clínica */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">Dados da clínica</p>
        <div className="flex gap-4">
          <div className="flex-1 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">* Nome</label>
                <input className="input w-full" value={cfg.nome} onChange={e => set('nome', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                <input className="input w-full" type="email" placeholder="contato@clinica.com.br"
                  value={cfg.email} onChange={e => set('email', e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-4 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">CNPJ ou CPF</label>
                <input className="input w-full" placeholder="00.000.000/0001-00"
                  value={cfg.cnpj} onChange={e => set('cnpj', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Telefone</label>
                <input className="input w-full" placeholder="(11) 3333-3333"
                  value={cfg.telefone} onChange={e => set('telefone', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">WhatsApp</label>
                <input className="input w-full" placeholder="(11) 99999-9999"
                  value={cfg.whatsapp} onChange={e => set('whatsapp', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Fuso horário</label>
                <select className="input w-full" value={cfg.fuso_horario} onChange={e => set('fuso_horario', e.target.value)}>
                  {FUSOS.map(f => <option key={f} value={f}>{f.replace('America/', '').replace('_', ' ')}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nome completo da dentista</label>
                <input className="input w-full" placeholder="Dra. Lorena Coutinho"
                  value={cfg.dentista_nome} onChange={e => set('dentista_nome', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">CRO</label>
                <input className="input w-full" placeholder="CRO-SP 443"
                  value={cfg.dentista_cro} onChange={e => set('dentista_cro', e.target.value)} />
              </div>
            </div>
          </div>
          <div className="shrink-0 flex flex-col items-center gap-2">
            <div className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden bg-gray-50">
              {logo ? <img src={logo} alt="Logo" className="w-full h-full object-cover" /> : <Building size={28} className="text-gray-300" />}
            </div>
            {logo
              ? <button onClick={() => setLogo(null)} className="text-xs text-red-500 hover:underline">Remover</button>
              : <label className="text-xs text-blue-600 hover:underline cursor-pointer">
                  Adicionar logo
                  <input type="file" accept="image/*" className="hidden" onChange={handleLogo} />
                </label>}
          </div>
        </div>
      </div>

      {/* Endereço */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">Endereço</p>
        <div className="space-y-3">
          <div className="grid grid-cols-4 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">CEP</label>
              <input className="input w-full" placeholder="00000-000" value={cfg.cep} onChange={e => set('cep', e.target.value)} />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Endereço</label>
              <input className="input w-full" placeholder="Rua, Avenida..." value={cfg.endereco} onChange={e => set('endereco', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Número</label>
              <input className="input w-full" placeholder="123" value={cfg.numero} onChange={e => set('numero', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-4 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Complemento</label>
              <input className="input w-full" placeholder="Sala, andar..." value={cfg.complemento} onChange={e => set('complemento', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Bairro</label>
              <input className="input w-full" placeholder="Bairro" value={cfg.bairro} onChange={e => set('bairro', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Cidade</label>
              <input className="input w-full" placeholder="São Paulo" value={cfg.cidade} onChange={e => set('cidade', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Estado</label>
              <select className="input w-full" value={cfg.estado} onChange={e => set('estado', e.target.value)}>
                {UFS.map(uf => <option key={uf}>{uf}</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Recursos + Contabilidade */}
      <div className="grid grid-cols-2 gap-4">
        <div className="border border-gray-100 rounded-2xl p-5">
          <p className="font-medium text-gray-800 mb-4">Recursos</p>
          <div className="divide-y divide-gray-50">
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-medium text-gray-800">Listar pacientes aguardando</p>
                <p className="text-xs text-gray-500 mt-0.5">Exibe na lateral da agenda os pacientes na sala de espera</p>
              </div>
              <button onClick={() => set('pacientes_aguardando', !cfg.pacientes_aguardando)}
                className={clsx('w-11 h-6 rounded-full transition-colors relative shrink-0 ml-4', cfg.pacientes_aguardando ? 'bg-blue-600' : 'bg-gray-200')}>
                <span className={clsx('absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform', cfg.pacientes_aguardando ? 'translate-x-5' : 'translate-x-0.5')} />
              </button>
            </div>
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-medium text-gray-800">Pesquisa de satisfação</p>
                <p className="text-xs text-gray-500 mt-0.5">Envia pesquisa de 0 a 10 após o atendimento via WhatsApp</p>
              </div>
              <button onClick={() => set('pesquisa_satisfacao', !cfg.pesquisa_satisfacao)}
                className={clsx('w-11 h-6 rounded-full transition-colors relative shrink-0 ml-4', cfg.pesquisa_satisfacao ? 'bg-blue-600' : 'bg-gray-200')}>
                <span className={clsx('absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform', cfg.pesquisa_satisfacao ? 'translate-x-5' : 'translate-x-0.5')} />
              </button>
            </div>
          </div>
        </div>
        <div className="border border-gray-100 rounded-2xl p-5">
          <p className="font-medium text-gray-800 mb-4">Contabilidade</p>
          <p className="text-sm text-gray-600 mb-3">Emitir recibos</p>
          <div className="space-y-3">
            {(['dentista', 'clinica'] as const).map(opt => (
              <label key={opt} className="flex items-center gap-2.5 cursor-pointer">
                <input type="radio" name="recibo" value={opt} checked={cfg.emitir_recibo === opt}
                  onChange={() => set('emitir_recibo', opt)} className="accent-blue-600" />
                <span className="text-sm text-gray-700">
                  {opt === 'dentista' ? 'Em nome do dentista' : 'Em nome da clínica'}
                </span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* feedback */}
      {ok   && <p className="text-sm text-green-600 font-medium text-right">✓ Salvo</p>}
      {erro && <p className="text-sm text-red-600 text-right">{erro}</p>}
    </div>
  )
}

export function ConfiguracoesPage() {
  const [secaoAtiva,  setSecaoAtiva]  = useState<Secao>('convenios')
  const [salvando,    setSalvando]    = useState(false)
  const [dentistas,   setDentistas]   = useState<Dentista[]>([])
  const [showModal,   setShowModal]   = useState(false)
  const [editando,    setEditando]    = useState<Dentista | null>(null)
  const [deletando,   setDeletando]   = useState<string | null>(null)
  const salvarClinicaRef = useRef<(() => Promise<void>) | null>(null)
  const registerSalvarClinica = useCallback((fn: () => Promise<void>) => {
    salvarClinicaRef.current = fn
  }, [])

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
    if (secaoAtiva === 'clinica' && salvarClinicaRef.current) {
      await salvarClinicaRef.current()
    }
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

          {secaoAtiva === 'convenios' && <ConveniosSecao />}

          {secaoAtiva === 'anamneses' && (
            <>
              <FieldGroup label="Configurações do formulário">
                <Toggle label="Exigir assinatura digital" desc="Paciente deve assinar o formulário ao enviar" defaultChecked />
                <Toggle label="Enviar link por WhatsApp" desc="Envia link da anamnese ao confirmar agendamento" defaultChecked />
                <Toggle label="Reenviar anamnese a cada consulta" desc="Pede nova anamnese sempre que agendar consulta" />
                <Toggle label="Permitir edição pelo paciente" desc="Paciente pode atualizar respostas mesmo após envio" />
              </FieldGroup>
              <FieldGroup label="Validade do link">
                <div className="flex items-center gap-3">
                  <input type="number" defaultValue={72} className="input w-24 text-sm" />
                  <span className="text-sm text-gray-500">horas após o envio</span>
                </div>
              </FieldGroup>
              <FieldGroup label="Mensagem de envio">
                <textarea rows={4} defaultValue="Olá, {{nome}}! Para confirmar sua consulta, preencha sua anamnese clicando no link abaixo. O preenchimento leva menos de 2 minutos. 🦷"
                  className="input w-full text-sm resize-none" />
              </FieldGroup>
            </>
          )}

          {secaoAtiva === 'mensagens' && <MensagensSecao />}

          {secaoAtiva === 'clinica' && <ClinicaSecao registerSalvar={registerSalvarClinica} />}

          {secaoAtiva === 'profissionais' && (
            <div className="-m-6">
              {/* Cabeçalho interno */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <h2 className="font-semibold text-gray-900 text-base">Gestão de profissionais</h2>
                <button onClick={() => { setEditando(null); setShowModal(true) }} className="btn-primary">
                  <Plus size={14} /> Convidar profissional
                </button>
              </div>

              {dentistas.length === 0 ? (
                <div className="py-16 flex flex-col items-center gap-3 text-center">
                  <User size={36} className="text-gray-200" />
                  <p className="text-sm text-gray-500">Nenhum profissional cadastrado ainda.</p>
                  <button onClick={() => { setEditando(null); setShowModal(true) }} className="btn-primary text-xs">
                    <Plus size={12} /> Cadastrar primeiro profissional
                  </button>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-6 py-3">Nome</th>
                      <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-4 py-3">E-mail</th>
                      <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-4 py-3">CRO</th>
                      <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-4 py-3">Tipo</th>
                      <th className="w-10" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {dentistas.map(d => {
                      const initials = d.nome.trim().split(' ').map((p: string) => p[0]).slice(0, 2).join('').toUpperCase()
                      return (
                        <DentistaRow
                          key={d.id}
                          dentista={d}
                          initials={initials}
                          onEdit={() => { setEditando(d); setShowModal(true) }}
                          onDelete={() => handleDelete(d.id)}
                          deleting={deletando === d.id}
                        />
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {secaoAtiva === 'taxas' && <TaxasMaquininha />}

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
