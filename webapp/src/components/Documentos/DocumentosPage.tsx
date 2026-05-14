'use client'
import { useState, useEffect, useRef } from 'react'
import { FileText, Plus, Search, Printer, X, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import clsx from 'clsx'
import { useRouter } from 'next/navigation'

// ─── tipos ────────────────────────────────────────────────────────────────────

type TipoDoc = 'receituario' | 'receituario_especial' | 'atestado' | 'pedido_exame'

const TIPOS: { id: TipoDoc; label: string; desc: string; cor: string }[] = [
  { id: 'receituario',          label: 'Receituário simples',   desc: 'Medicamentos e posologia',                    cor: 'bg-blue-50 border-blue-200 text-blue-700' },
  { id: 'receituario_especial', label: 'Receituário especial',  desc: 'Medicamentos controlados (2 vias)',            cor: 'bg-purple-50 border-purple-200 text-purple-700' },
  { id: 'atestado',             label: 'Atestado',              desc: 'Comparecimento ou incapacidade',              cor: 'bg-green-50 border-green-200 text-green-700' },
  { id: 'pedido_exame',         label: 'Pedido de exame',       desc: 'Raio-X, tomografia, laboratorial',            cor: 'bg-amber-50 border-amber-200 text-amber-700' },
]

interface Medicamento { nome: string; posologia: string }
interface DocRow { id: string; tipo: TipoDoc; paciente_nome: string | null; numero_documento: string | null; conteudo_texto: string | null; created_at: string }

// ─── helpers ──────────────────────────────────────────────────────────────────

function badgeColor(tipo: TipoDoc) {
  switch (tipo) {
    case 'receituario':          return 'bg-blue-50 text-blue-700 border-blue-200'
    case 'receituario_especial': return 'bg-purple-50 text-purple-700 border-purple-200'
    case 'atestado':             return 'bg-green-50 text-green-700 border-green-200'
    case 'pedido_exame':         return 'bg-amber-50 text-amber-700 border-amber-200'
  }
}

function tipoLabel(tipo: TipoDoc) {
  return TIPOS.find(t => t.id === tipo)?.label ?? tipo
}

function gerarNumero(tipo: TipoDoc) {
  const prefix = { receituario: 'RS', receituario_especial: 'RE', atestado: 'AT', pedido_exame: 'PE' }[tipo]
  return `${prefix}-${Date.now().toString().slice(-6)}`
}

// ─── sub-formulários ──────────────────────────────────────────────────────────

function ReceituarioForm({ especial, onChange }: { especial?: boolean; onChange: (d: object) => void }) {
  const [meds, setMeds] = useState<Medicamento[]>([{ nome: '', posologia: '' }])
  const [obs, setObs]   = useState('')
  const [notif, setNotif] = useState('')

  function update(newMeds = meds, newObs = obs, newNotif = notif) {
    onChange({ medicamentos: newMeds, observacoes: newObs, ...(especial ? { numero_notificacao: newNotif } : {}) })
  }

  function setMed(i: number, field: keyof Medicamento, val: string) {
    const next = meds.map((m, idx) => idx === i ? { ...m, [field]: val } : m)
    setMeds(next); update(next)
  }

  function addMed() { const next = [...meds, { nome: '', posologia: '' }]; setMeds(next); update(next) }
  function removeMed(i: number) { const next = meds.filter((_, idx) => idx !== i); setMeds(next); update(next) }

  return (
    <div className="space-y-4">
      {especial && (
        <div>
          <label className="label">Nº de notificação</label>
          <input className="input" placeholder="Número da notificação de receita" value={notif}
            onChange={e => { setNotif(e.target.value); update(meds, obs, e.target.value) }} />
        </div>
      )}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="label mb-0">Medicamentos</label>
          <button type="button" onClick={addMed} className="text-xs text-blue-600 hover:underline flex items-center gap-1">
            <Plus size={12} /> Adicionar medicamento
          </button>
        </div>
        <div className="space-y-2">
          {meds.map((m, i) => (
            <div key={i} className="border border-gray-100 rounded-xl p-3 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-400 w-4">{i + 1}.</span>
                <input className="input flex-1 text-sm" placeholder="Nome do medicamento e concentração" value={m.nome}
                  onChange={e => setMed(i, 'nome', e.target.value)} />
                {meds.length > 1 && (
                  <button type="button" onClick={() => removeMed(i)} className="p-1 text-gray-300 hover:text-red-500 rounded">
                    <X size={14} />
                  </button>
                )}
              </div>
              <textarea className="input w-full text-sm resize-none" rows={2} placeholder="Posologia: ex. 1 cápsula de 8/8h por 7 dias"
                value={m.posologia} onChange={e => setMed(i, 'posologia', e.target.value)} />
            </div>
          ))}
        </div>
      </div>
      <div>
        <label className="label">Observações (opcional)</label>
        <textarea className="input w-full resize-none text-sm" rows={2} placeholder="Recomendações adicionais..." value={obs}
          onChange={e => { setObs(e.target.value); update(meds, e.target.value) }} />
      </div>
    </div>
  )
}

function AtestadoForm({ onChange }: { onChange: (d: object) => void }) {
  const [tipoAt, setTipoAt] = useState<'comparecimento' | 'incapacidade'>('comparecimento')
  const [data,   setData]   = useState(format(new Date(), 'yyyy-MM-dd'))
  const [duracao, setDuracao] = useState('')
  const [cid,    setCid]    = useState('')
  const [obs,    setObs]    = useState('')

  function update(t = tipoAt, d = data, dur = duracao, c = cid, o = obs) {
    onChange({ tipo: t, data_consulta: d, duracao: dur, cid: c, observacoes: o })
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="label">Tipo de atestado</label>
        <div className="flex gap-2">
          {(['comparecimento', 'incapacidade'] as const).map(t => (
            <button key={t} type="button" onClick={() => { setTipoAt(t); update(t) }}
              className={clsx('flex-1 py-2.5 text-sm font-medium rounded-xl border transition-colors capitalize',
                tipoAt === t ? 'bg-blue-50 border-blue-400 text-blue-700' : 'border-gray-200 text-gray-600 hover:border-gray-300')}>
              {t === 'comparecimento' ? 'Comparecimento' : 'Incapacidade'}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Data da consulta</label>
          <input type="date" className="input" value={data} onChange={e => { setData(e.target.value); update(tipoAt, e.target.value) }} />
        </div>
        <div>
          <label className="label">{tipoAt === 'comparecimento' ? 'Duração (ex: 2 horas)' : 'Período (ex: 3 dias)'}</label>
          <input className="input" placeholder={tipoAt === 'comparecimento' ? '2 horas' : '3 dias'} value={duracao}
            onChange={e => { setDuracao(e.target.value); update(tipoAt, data, e.target.value) }} />
        </div>
      </div>
      <div>
        <label className="label">CID (opcional)</label>
        <input className="input" placeholder="Ex: K08.8" value={cid} onChange={e => { setCid(e.target.value); update(tipoAt, data, duracao, e.target.value) }} />
      </div>
      <div>
        <label className="label">Observações (opcional)</label>
        <textarea className="input w-full resize-none text-sm" rows={2} value={obs}
          onChange={e => { setObs(e.target.value); update(tipoAt, data, duracao, cid, e.target.value) }} />
      </div>
    </div>
  )
}

const EXAMES = [
  'Radiografia periapical', 'Radiografia interproximal (bite-wing)',
  'Panorâmica', 'Telerradiografia', 'Tomografia computadorizada (CBCT)',
  'Hemograma completo', 'Coagulograma', 'Glicemia em jejum',
  'Proteína C-reativa', 'VHS', 'Cultura e antibiograma',
]

function PedidoExameForm({ onChange }: { onChange: (d: object) => void }) {
  const [exames, setExames]       = useState<string[]>([''])
  const [indicacao, setIndicacao] = useState('')
  const [urgente, setUrgente]     = useState(false)

  function update(e = exames, ind = indicacao, urg = urgente) {
    onChange({ exames: e.filter(Boolean), indicacao: ind, urgente: urg })
  }

  function setExame(i: number, val: string) {
    const next = exames.map((ex, idx) => idx === i ? val : ex); setExames(next); update(next)
  }

  function addExame() { const next = [...exames, '']; setExames(next); update(next) }
  function removeExame(i: number) { const next = exames.filter((_, idx) => idx !== i); setExames(next); update(next) }

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="label mb-0">Exames solicitados</label>
          <button type="button" onClick={addExame} className="text-xs text-blue-600 hover:underline flex items-center gap-1">
            <Plus size={12} /> Adicionar exame
          </button>
        </div>
        <div className="space-y-2">
          {exames.map((ex, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-400 w-4">{i + 1}.</span>
              <input list="exames-lista" className="input flex-1 text-sm" placeholder="Nome do exame" value={ex}
                onChange={e => setExame(i, e.target.value)} />
              {exames.length > 1 && (
                <button type="button" onClick={() => removeExame(i)} className="p-1 text-gray-300 hover:text-red-500 rounded">
                  <X size={14} />
                </button>
              )}
            </div>
          ))}
          <datalist id="exames-lista">
            {EXAMES.map(e => <option key={e} value={e} />)}
          </datalist>
        </div>
      </div>
      <div>
        <label className="label">Indicação clínica / Justificativa</label>
        <textarea className="input w-full resize-none text-sm" rows={3} placeholder="Descreva a indicação clínica..." value={indicacao}
          onChange={e => { setIndicacao(e.target.value); update(exames, e.target.value) }} />
      </div>
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={urgente} onChange={e => { setUrgente(e.target.checked); update(exames, indicacao, e.target.checked) }} className="accent-blue-600" />
        <span className="text-sm text-gray-700">Urgente</span>
      </label>
    </div>
  )
}

// ─── modal novo documento ─────────────────────────────────────────────────────

function NovoDocModal({ onClose, onSaved }: { onClose: () => void; onSaved: (d: DocRow) => void }) {
  const [step, setStep]           = useState<1 | 2>(1)
  const [tipo, setTipo]           = useState<TipoDoc | null>(null)
  const [paciente, setPaciente]   = useState('')
  const [dados, setDados]         = useState<object>({})
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState('')

  async function salvar() {
    if (!tipo || !paciente.trim()) { setError('Preencha o nome do paciente.'); return }
    setSaving(true); setError('')
    const { data, error: err } = await supabase.from('documentos').insert({
      tipo,
      paciente_nome: paciente.trim(),
      numero_documento: gerarNumero(tipo),
      conteudo_texto: JSON.stringify(dados),
    }).select().single()
    if (err) { setError(err.message); setSaving(false); return }
    onSaved(data as DocRow)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
          <div>
            <h2 className="font-semibold text-gray-900">Novo documento</h2>
            {tipo && <p className="text-xs text-gray-400 mt-0.5">{tipoLabel(tipo)}</p>}
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"><X size={16} /></button>
        </div>

        <div className="p-6 space-y-5">
          {/* Passo 1 — escolha do tipo */}
          {step === 1 && (
            <div className="grid grid-cols-2 gap-3">
              {TIPOS.map(t => (
                <button key={t.id} onClick={() => { setTipo(t.id); setStep(2) }}
                  className={clsx('text-left p-4 rounded-xl border-2 transition-colors hover:shadow-sm', t.cor)}>
                  <p className="font-semibold text-sm">{t.label}</p>
                  <p className="text-xs mt-0.5 opacity-70">{t.desc}</p>
                </button>
              ))}
            </div>
          )}

          {/* Passo 2 — formulário */}
          {step === 2 && tipo && (
            <>
              <button onClick={() => { setStep(1); setTipo(null) }} className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1">
                ← Trocar tipo
              </button>
              <div>
                <label className="label">Nome do paciente *</label>
                <input className="input" autoFocus placeholder="Nome completo" value={paciente}
                  onChange={e => setPaciente(e.target.value)} />
              </div>
              {(tipo === 'receituario' || tipo === 'receituario_especial') && (
                <ReceituarioForm especial={tipo === 'receituario_especial'} onChange={setDados} />
              )}
              {tipo === 'atestado' && <AtestadoForm onChange={setDados} />}
              {tipo === 'pedido_exame' && <PedidoExameForm onChange={setDados} />}
              {error && <p className="text-sm text-red-600">{error}</p>}
            </>
          )}
        </div>

        {step === 2 && (
          <div className="px-6 py-4 border-t border-gray-100 flex gap-3 justify-end sticky bottom-0 bg-white">
            <button onClick={onClose} className="btn-secondary">Cancelar</button>
            <button onClick={salvar} disabled={saving || !paciente.trim()} className="btn-primary disabled:opacity-40">
              {saving ? 'Salvando...' : 'Salvar documento'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── página principal ─────────────────────────────────────────────────────────

type TipoFiltro = 'todos' | TipoDoc

export function DocumentosPage() {
  const router = useRouter()
  const [filtro,  setFiltro]  = useState<TipoFiltro>('todos')
  const [busca,   setBusca]   = useState('')
  const [docs,    setDocs]    = useState<DocRow[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    let q = supabase.from('documentos').select('*').order('created_at', { ascending: false })
    if (filtro !== 'todos') q = q.eq('tipo', filtro)
    q.limit(50).then(({ data }) => { setDocs((data as DocRow[]) ?? []); setLoading(false) })
  }, [filtro])

  const docsFiltrados = docs.filter(d =>
    d.paciente_nome?.toLowerCase().includes(busca.toLowerCase()) ||
    d.numero_documento?.includes(busca)
  )

  async function deletar(id: string) {
    await supabase.from('documentos').delete().eq('id', id)
    setDocs(prev => prev.filter(d => d.id !== id))
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Documentos</h1>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          <Plus size={15} /> Novo documento
        </button>
      </div>

      {/* Filtros */}
      <div className="card mb-4 px-4 py-3 flex items-center gap-3 flex-wrap">
        <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
          {(['todos', ...TIPOS.map(t => t.id)] as TipoFiltro[]).map(t => (
            <button key={t} onClick={() => setFiltro(t)}
              className={clsx('px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
                t === filtro ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500 hover:text-gray-700')}>
              {t === 'todos' ? 'Todos' : tipoLabel(t as TipoDoc)}
            </button>
          ))}
        </div>
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input pl-8 text-sm w-full" placeholder="Buscar por paciente ou número..."
            value={busca} onChange={e => setBusca(e.target.value)} />
        </div>
      </div>

      {/* Lista */}
      <div className="card divide-y divide-gray-50">
        {loading ? (
          <div className="p-8 text-center text-sm text-gray-400">Carregando...</div>
        ) : docsFiltrados.length === 0 ? (
          <div className="p-16 text-center">
            <FileText size={40} className="mx-auto mb-3 text-gray-200" />
            <p className="text-sm text-gray-400">Nenhum documento encontrado</p>
          </div>
        ) : docsFiltrados.map(doc => (
          <div key={doc.id} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
              <FileText size={18} className="text-blue-500" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-medium text-gray-900 text-sm">{doc.paciente_nome ?? '—'}</p>
                <span className={clsx('text-xs px-2 py-0.5 rounded-full border font-medium', badgeColor(doc.tipo))}>
                  {tipoLabel(doc.tipo)}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                Nº {doc.numero_documento ?? '—'} · {doc.created_at ? format(parseISO(doc.created_at), "d 'de' MMMM 'de' yyyy", { locale: ptBR }) : ''}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button onClick={() => router.push(`/documentos/${doc.id}`)}
                className="btn-secondary text-xs py-1.5 px-3">
                <Printer size={13} /> Imprimir
              </button>
              <button onClick={() => deletar(doc.id)}
                className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <NovoDocModal
          onClose={() => setShowModal(false)}
          onSaved={d => setDocs(prev => [d, ...prev])}
        />
      )}
    </div>
  )
}
