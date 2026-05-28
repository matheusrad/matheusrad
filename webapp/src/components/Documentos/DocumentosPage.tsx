'use client'
import { useState, useEffect, useRef } from 'react'
import { FileText, Plus, Search, Printer, X, Trash2, ChevronDown, Check, Send } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import clsx from 'clsx'
import { useRouter } from 'next/navigation'

// ─── banco de medicamentos ────────────────────────────────────────────────────

const MEDICAMENTOS: { nome: string; posologia: string; controlado?: boolean }[] = [
  { nome: 'Amoxicilina 500mg',                    posologia: '1 cápsula de 8 em 8 horas por 7 dias' },
  { nome: 'Amoxicilina 875mg + Clavulanato 125mg', posologia: '1 comprimido de 12 em 12 horas por 7 dias' },
  { nome: 'Azitromicina 500mg',                   posologia: '1 comprimido 1 vez ao dia por 3 dias' },
  { nome: 'Cefalexina 500mg',                     posologia: '1 cápsula de 6 em 6 horas por 7 dias' },
  { nome: 'Clindamicina 300mg',                   posologia: '1 cápsula de 8 em 8 horas por 7 dias' },
  { nome: 'Metronidazol 400mg',                   posologia: '1 comprimido de 8 em 8 horas por 7 dias' },
  { nome: 'Nimesulida 100mg',                     posologia: '1 comprimido de 12 em 12 horas por 3 a 5 dias (após as refeições)' },
  { nome: 'Ibuprofeno 600mg',                     posologia: '1 comprimido de 8 em 8 horas por 3 a 5 dias (após as refeições)' },
  { nome: 'Dipirona 500mg',                       posologia: '1 a 2 comprimidos de 6 em 6 horas se dor (máx. 4 doses/dia)' },
  { nome: 'Paracetamol 750mg',                    posologia: '1 comprimido de 6 em 6 horas se dor (máx. 4 doses/dia)' },
  { nome: 'Dexametasona 4mg',                     posologia: '1 comprimido de 12 em 12 horas por 2 dias, iniciando no dia da cirurgia' },
  { nome: 'Betametasona 0,5mg',                   posologia: '1 comprimido de 12 em 12 horas por 3 dias' },
  { nome: 'Clorexidina 0,12% (solução)',           posologia: 'Bochecho de 15ml por 30 segundos de 12 em 12 horas por 10 dias' },
  { nome: 'Nistatina suspensão oral 100.000UI/mL', posologia: '1mL (pingue sobre a lesão) 4 vezes ao dia por 10 dias' },
  { nome: 'Tramadol 50mg',                        posologia: '1 cápsula de 6 em 6 horas se dor intensa', controlado: true },
  { nome: 'Codeína 30mg + Paracetamol 500mg',     posologia: '1 comprimido de 6 em 6 horas se dor', controlado: true },
  { nome: 'Clonazepam 0,5mg',                     posologia: '1 comprimido 1 hora antes do procedimento (uso único)', controlado: true },
  { nome: 'Midazolam 7,5mg',                      posologia: '1 comprimido 30 minutos antes do procedimento (uso único)', controlado: true },
]

// ─── banco de exames por categoria ───────────────────────────────────────────

const CATEGORIAS_EXAME = [
  {
    nome: 'Radiografia',
    exames: [
      { nome: 'Radiografia periapical',                desc: 'Região: ___' },
      { nome: 'Radiografia interproximal (bite-wing)', desc: 'Lados: direito / esquerdo' },
      { nome: 'Radiografia panorâmica',                desc: '' },
      { nome: 'Telerradiografia de perfil',            desc: '' },
      { nome: 'Radiografia oclusal',                   desc: 'Região: ___' },
    ],
  },
  {
    nome: 'Tomografia',
    exames: [
      { nome: 'Tomografia computadorizada (CBCT) – parcial', desc: 'Região: ___' },
      { nome: 'Tomografia computadorizada (CBCT) – total',   desc: '' },
      { nome: 'Tomografia de ATM bilateral',                 desc: '' },
    ],
  },
  {
    nome: 'Oclusão / ATM',
    exames: [
      { nome: 'Análise de modelos de estudo',   desc: '' },
      { nome: 'Registro de mordida',            desc: '' },
      { nome: 'Montagem em articulador',        desc: '' },
      { nome: 'Eletromiongrafia (EMG)',          desc: '' },
      { nome: 'Ressonância magnética de ATM',   desc: 'Bilateral / unilateral: ___' },
    ],
  },
  {
    nome: 'Biópsia / Patologia',
    exames: [
      { nome: 'Biópsia incisional',             desc: 'Região / lesão: ___' },
      { nome: 'Biópsia excisional',             desc: 'Região / lesão: ___' },
      { nome: 'Citologia esfoliativa',          desc: 'Região: ___' },
      { nome: 'Imuno-histoquímica',             desc: '' },
      { nome: 'Cultura microbiológica',         desc: 'Material: ___' },
      { nome: 'Antibiograma',                   desc: '' },
    ],
  },
  {
    nome: 'Laboratorial',
    exames: [
      { nome: 'Hemograma completo',              desc: '' },
      { nome: 'Coagulograma (TP, TTPA)',         desc: '' },
      { nome: 'Glicemia em jejum',               desc: '' },
      { nome: 'Hemoglobina glicada (HbA1c)',     desc: '' },
      { nome: 'Proteína C-reativa (PCR)',        desc: '' },
      { nome: 'VHS',                             desc: '' },
      { nome: 'Sorologia HIV',                   desc: '' },
      { nome: 'Hepatite B (HBsAg)',              desc: '' },
      { nome: 'Hepatite C (Anti-HCV)',           desc: '' },
      { nome: 'Cultura e antibiograma',          desc: 'Material: ___' },
    ],
  },
]

// ─── busca de paciente ────────────────────────────────────────────────────────

interface PacienteBusca {
  id: string; nome: string; telefone: string | null
  endereco: string | null; cpf: string | null; data_nascimento: string | null
}

function BuscaPacienteInput({ value, onSelect }: {
  value: PacienteBusca | null
  onSelect: (p: PacienteBusca | null) => void
}) {
  const [query, setQuery] = useState(value?.nome ?? '')
  const [lista, setLista] = useState<PacienteBusca[]>([])
  const [aberto, setAberto] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setAberto(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  async function buscar(q: string) {
    setQuery(q)
    onSelect(null)
    if (q.length < 2) { setLista([]); setAberto(false); return }
    const { data } = await supabase
      .from('pacientes')
      .select('id, nome, telefone, endereco, cpf, data_nascimento')
      .ilike('nome', `%${q}%`)
      .eq('status', 'Ativo')
      .limit(8)
    setLista((data as PacienteBusca[]) ?? [])
    setAberto(true)
  }

  function selecionar(p: PacienteBusca) {
    setQuery(p.nome)
    onSelect(p)
    setAberto(false)
    setLista([])
  }

  return (
    <div ref={ref} className="relative">
      <input
        className="input w-full"
        autoFocus
        placeholder="Digite o nome do paciente..."
        value={query}
        onChange={e => buscar(e.target.value)}
        onFocus={() => query.length >= 2 && lista.length > 0 && setAberto(true)}
      />
      {value && (
        <div className="mt-1.5 flex items-center gap-2 text-xs text-green-700 bg-green-50 border border-green-100 rounded-lg px-3 py-1.5">
          <span className="font-medium">✓ {value.nome}</span>
          {value.telefone && <span className="text-green-500">· {value.telefone}</span>}
          <button type="button" onClick={() => { onSelect(null); setQuery('') }}
            className="ml-auto text-green-400 hover:text-red-500">×</button>
        </div>
      )}
      {aberto && lista.length > 0 && (
        <div className="absolute top-full left-0 right-0 z-20 mt-1 bg-white border border-gray-100 rounded-xl shadow-lg overflow-hidden">
          {lista.map(p => (
            <button key={p.id} type="button" onMouseDown={() => selecionar(p)}
              className="w-full text-left px-4 py-2.5 text-sm hover:bg-blue-50 border-b border-gray-50 last:border-0">
              <p className="font-medium text-gray-800">{p.nome}</p>
              <p className="text-xs text-gray-400">{p.telefone ?? '—'}{p.cpf ? ` · CPF: ${p.cpf}` : ''}</p>
            </button>
          ))}
        </div>
      )}
      {aberto && lista.length === 0 && query.length >= 2 && (
        <div className="absolute top-full left-0 right-0 z-20 mt-1 bg-white border border-gray-100 rounded-xl shadow-sm px-4 py-3 text-sm text-gray-400">
          Nenhum paciente encontrado
        </div>
      )}
    </div>
  )
}

// ─── tipos ────────────────────────────────────────────────────────────────────

type TipoDoc = 'receituario' | 'receituario_especial' | 'receituario_controle_especial' | 'atestado' | 'pedido_exame'

const TIPOS: { id: TipoDoc; label: string; desc: string; cor: string }[] = [
  { id: 'receituario',                    label: 'Receituário simples',           desc: 'Medicamentos e posologia',               cor: 'bg-blue-50 border-blue-200 text-blue-700' },
  { id: 'receituario_especial',           label: 'Receituário especial',          desc: 'Medicamentos controlados (2 vias)',       cor: 'bg-purple-50 border-purple-200 text-purple-700' },
  { id: 'receituario_controle_especial',  label: 'Controle Especial',             desc: 'Formulário oficial · 2 vias impressas',  cor: 'bg-rose-50 border-rose-200 text-rose-700' },
  { id: 'atestado',                       label: 'Atestado',                      desc: 'Comparecimento ou incapacidade',          cor: 'bg-green-50 border-green-200 text-green-700' },
  { id: 'pedido_exame',                   label: 'Pedido de exame',               desc: 'Raio-X, tomografia, laboratorial',        cor: 'bg-amber-50 border-amber-200 text-amber-700' },
]

interface Medicamento { nome: string; posologia: string }
interface ExameSelecionado { nome: string; desc: string }
interface DocRow { id: string; tipo: TipoDoc; paciente_nome: string | null; numero_documento: string | null; conteudo_texto: string | null; created_at: string }

function badgeColor(tipo: TipoDoc) {
  switch (tipo) {
    case 'receituario':                   return 'bg-blue-50 text-blue-700 border-blue-200'
    case 'receituario_especial':          return 'bg-purple-50 text-purple-700 border-purple-200'
    case 'receituario_controle_especial': return 'bg-rose-50 text-rose-700 border-rose-200'
    case 'atestado':                      return 'bg-green-50 text-green-700 border-green-200'
    case 'pedido_exame':                  return 'bg-amber-50 text-amber-700 border-amber-200'
  }
}

function tipoLabel(tipo: TipoDoc) { return TIPOS.find(t => t.id === tipo)?.label ?? tipo }
function gerarNumero(tipo: TipoDoc) {
  const p = { receituario: 'RS', receituario_especial: 'RE', receituario_controle_especial: 'RC', atestado: 'AT', pedido_exame: 'PE' }[tipo]
  return `${p}-${Date.now().toString().slice(-6)}`
}

// ─── autocomplete de medicamento ──────────────────────────────────────────────

function MedicamentoInput({ index, med, controlado, onChange, onRemove, showRemove }: {
  index: number; med: Medicamento; controlado?: boolean
  onChange: (m: Medicamento) => void; onRemove: () => void; showRemove: boolean
}) {
  const [query, setQuery]   = useState(med.nome)
  const [open,  setOpen]    = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const filtrados = MEDICAMENTOS.filter(m =>
    (!controlado || m.controlado) &&
    (controlado || !m.controlado) &&
    m.nome.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 8)

  function select(m: typeof MEDICAMENTOS[0]) {
    setQuery(m.nome)
    onChange({ nome: m.nome, posologia: m.posologia })
    setOpen(false)
  }

  useEffect(() => {
    function handler(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className="border border-gray-100 rounded-xl p-3 space-y-2 bg-gray-50/50">
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold text-gray-400 w-5 shrink-0">{index + 1}.</span>
        <div ref={ref} className="flex-1 relative">
          <input
            className="input w-full text-sm"
            placeholder="Buscar medicamento..."
            value={query}
            onChange={e => { setQuery(e.target.value); onChange({ nome: e.target.value, posologia: med.posologia }); setOpen(true) }}
            onFocus={() => setOpen(true)}
          />
          {open && filtrados.length > 0 && (
            <div className="absolute top-full left-0 right-0 z-20 mt-1 bg-white border border-gray-100 rounded-xl shadow-lg overflow-hidden">
              {filtrados.map(m => (
                <button key={m.nome} type="button" onMouseDown={() => select(m)}
                  className="w-full text-left px-3 py-2.5 text-sm hover:bg-blue-50 border-b border-gray-50 last:border-0">
                  <p className="font-medium text-gray-800">{m.nome}</p>
                  <p className="text-xs text-gray-400 truncate">{m.posologia}</p>
                </button>
              ))}
            </div>
          )}
        </div>
        {showRemove && (
          <button type="button" onClick={onRemove} className="p-1 text-gray-300 hover:text-red-500 rounded shrink-0">
            <X size={14} />
          </button>
        )}
      </div>
      <textarea
        className="input w-full text-sm resize-none ml-7"
        rows={2}
        placeholder="Posologia: dose, frequência e duração..."
        value={med.posologia}
        onChange={e => onChange({ nome: med.nome, posologia: e.target.value })}
      />
    </div>
  )
}

// ─── formulário receituário ───────────────────────────────────────────────────

function ReceituarioForm({ especial, onChange }: { especial?: boolean; onChange: (d: object) => void }) {
  const [meds,  setMeds]  = useState<Medicamento[]>([{ nome: '', posologia: '' }])
  const [obs,   setObs]   = useState('')
  const [notif, setNotif] = useState('')

  function update(m = meds, o = obs, n = notif) {
    onChange({ medicamentos: m, observacoes: o, ...(especial ? { numero_notificacao: n } : {}) })
  }

  function setMed(i: number, val: Medicamento) { const next = meds.map((m, idx) => idx === i ? val : m); setMeds(next); update(next) }
  function addMed() { const next = [...meds, { nome: '', posologia: '' }]; setMeds(next); update(next) }
  function removeMed(i: number) { const next = meds.filter((_, idx) => idx !== i); setMeds(next); update(next) }

  return (
    <div className="space-y-4">
      {especial && (
        <div>
          <label className="label">Nº de notificação</label>
          <input className="input" placeholder="Número da notificação de receita especial" value={notif}
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
            <MedicamentoInput key={i} index={i} med={m} controlado={especial}
              onChange={val => setMed(i, val)} onRemove={() => removeMed(i)} showRemove={meds.length > 1} />
          ))}
        </div>
      </div>
      <div>
        <label className="label">Observações (opcional)</label>
        <textarea className="input w-full resize-none text-sm" rows={2}
          placeholder="Ex: Tomar com alimento. Não interromper o tratamento." value={obs}
          onChange={e => { setObs(e.target.value); update(meds, e.target.value) }} />
      </div>
    </div>
  )
}

// ─── formulário atestado ──────────────────────────────────────────────────────

function AtestadoForm({ onChange }: { onChange: (d: object) => void }) {
  const [tipoAt,     setTipoAt]     = useState<'comparecimento' | 'incapacidade'>('comparecimento')
  const [data,       setData]       = useState(format(new Date(), 'yyyy-MM-dd'))
  const [horaInicio, setHoraInicio] = useState('')
  const [horaFim,    setHoraFim]    = useState('')
  const [duracao,    setDuracao]    = useState('')
  const [cid,        setCid]        = useState('')
  const [obs,        setObs]        = useState('')
  const [procedimento, setProcedimento] = useState('')

  function update(
    t = tipoAt, d = data, hi = horaInicio, hf = horaFim,
    dur = duracao, c = cid, o = obs, proc = procedimento
  ) {
    onChange({ tipo: t, data_consulta: d, hora_inicio: hi, hora_fim: hf, duracao: dur, cid: c, observacoes: o, procedimento: proc })
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="label">Tipo de atestado</label>
        <div className="flex gap-2">
          {(['comparecimento', 'incapacidade'] as const).map(t => (
            <button key={t} type="button" onClick={() => { setTipoAt(t); update(t) }}
              className={clsx('flex-1 py-2.5 text-sm font-medium rounded-xl border-2 transition-colors',
                tipoAt === t ? 'bg-blue-50 border-blue-400 text-blue-700' : 'border-gray-200 text-gray-600 hover:border-gray-300')}>
              {t === 'comparecimento' ? 'Comparecimento' : 'Afastamento'}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="label">Data da consulta</label>
        <input type="date" className="input" value={data}
          onChange={e => { setData(e.target.value); update(tipoAt, e.target.value) }} />
      </div>

      {tipoAt === 'comparecimento' && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Hora de entrada</label>
            <input type="time" className="input" value={horaInicio}
              onChange={e => { setHoraInicio(e.target.value); update(tipoAt, data, e.target.value) }} />
          </div>
          <div>
            <label className="label">Hora de saída</label>
            <input type="time" className="input" value={horaFim}
              onChange={e => { setHoraFim(e.target.value); update(tipoAt, data, horaInicio, e.target.value) }} />
          </div>
        </div>
      )}

      {tipoAt === 'incapacidade' && (
        <div>
          <label className="label">Dias de afastamento</label>
          <input className="input" placeholder="Ex: 2 (dois) dias" value={duracao}
            onChange={e => { setDuracao(e.target.value); update(tipoAt, data, horaInicio, horaFim, e.target.value) }} />
        </div>
      )}

      <div>
        <label className="label">Procedimento realizado (opcional)</label>
        <input className="input" placeholder="Ex: Exodontia, tratamento de canal, restauração..." value={procedimento}
          onChange={e => { setProcedimento(e.target.value); update(tipoAt, data, horaInicio, horaFim, duracao, cid, obs, e.target.value) }} />
      </div>

      <div>
        <label className="label">CID (opcional)</label>
        <input className="input" placeholder="Ex: K04.0 – Pulpite" value={cid}
          onChange={e => { setCid(e.target.value); update(tipoAt, data, horaInicio, horaFim, duracao, e.target.value) }} />
      </div>

      <div>
        <label className="label">Observações (opcional)</label>
        <textarea className="input w-full resize-none text-sm" rows={2} value={obs}
          onChange={e => { setObs(e.target.value); update(tipoAt, data, horaInicio, horaFim, duracao, cid, e.target.value) }} />
      </div>
    </div>
  )
}

// ─── formulário pedido de exame / exame físico e clínico ─────────────────────

interface ExameFisico {
  // Extrabucal
  face: string; atm: string; linfonodos: string; labios: string; mucosa_labial: string
  // Intrabucal
  mucosa_oral: string; lingua: string; assoalho: string; palato: string; gengiva: string
  // Oclusão/DTM
  classe_angle: string; overjet: string; overbite: string; dtm_sinais: string; parafuncoes: string
  // Patologias
  lesoes_carie: string; fraturas: string; lesoes_mucosa: string; outras_patologias: string
}

const EMPTY_EXAME_FISICO: ExameFisico = {
  face: '', atm: '', linfonodos: '', labios: '', mucosa_labial: '',
  mucosa_oral: '', lingua: '', assoalho: '', palato: '', gengiva: '',
  classe_angle: '', overjet: '', overbite: '', dtm_sinais: '', parafuncoes: '',
  lesoes_carie: '', fraturas: '', lesoes_mucosa: '', outras_patologias: '',
}

const SECOES_EXAME = ['Extrabucal', 'Intrabucal', 'Oclusão / DTM', 'Patologias', 'Exames Complementares']

function ExameFisicoField({ label, value, onChange, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string
}) {
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-gray-50 last:border-0">
      <span className="text-xs text-gray-500 w-36 shrink-0 pt-1.5 leading-tight">{label}</span>
      <input value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder ?? 'Sem alterações'}
        className="flex-1 text-sm border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500" />
    </div>
  )
}

function PedidoExameForm({ onChange }: { onChange: (d: object) => void }) {
  const [secao, setSecao]             = useState(0)
  const [fisico, setFisico]           = useState<ExameFisico>(EMPTY_EXAME_FISICO)
  const [aba, setAba]                 = useState(0)
  const [selecionados, setSelecionados] = useState<ExameSelecionado[]>([])
  const [livres, setLivres]           = useState<{ titulo: string; descricao: string }[]>([])
  const [indicacao, setIndicacao]     = useState('')
  const [urgente, setUrgente]         = useState(false)

  function setF<K extends keyof ExameFisico>(key: K, val: string) {
    const next = { ...fisico, [key]: val }
    setFisico(next)
    emitir(next, selecionados, livres, indicacao, urgente)
  }

  function emitir(
    f = fisico, s = selecionados, l = livres,
    ind = indicacao, urg = urgente
  ) {
    const exames = [
      ...s.map(e => ({ nome: e.nome, descricao: e.desc })),
      ...l.filter(e => e.titulo).map(e => ({ nome: e.titulo, descricao: e.descricao })),
    ]
    onChange({ exame_fisico: f, exames, indicacao: ind, urgente: urg })
  }

  function toggleExame(nome: string, desc: string) {
    const existe = selecionados.find(e => e.nome === nome)
    const next = existe ? selecionados.filter(e => e.nome !== nome) : [...selecionados, { nome, desc }]
    setSelecionados(next); emitir(fisico, next)
  }

  function setDescricao(nome: string, val: string) {
    const next = selecionados.map(e => e.nome === nome ? { ...e, desc: val } : e)
    setSelecionados(next); emitir(fisico, next)
  }

  function addLivre() {
    const next = [...livres, { titulo: '', descricao: '' }]
    setLivres(next); emitir(fisico, selecionados, next)
  }
  function setLivre(i: number, field: 'titulo' | 'descricao', val: string) {
    const next = livres.map((l, idx) => idx === i ? { ...l, [field]: val } : l)
    setLivres(next); emitir(fisico, selecionados, next)
  }
  function removeLivre(i: number) {
    const next = livres.filter((_, idx) => idx !== i)
    setLivres(next); emitir(fisico, selecionados, next)
  }

  const totalExames = selecionados.length + livres.filter(l => l.titulo).length

  return (
    <div className="space-y-4">
      {/* Navegação entre seções */}
      <div className="flex gap-1 overflow-x-auto pb-0.5">
        {SECOES_EXAME.map((s, i) => (
          <button key={s} type="button" onClick={() => setSecao(i)}
            className={clsx(
              'px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap border transition-colors shrink-0',
              secao === i
                ? 'bg-blue-600 text-white border-blue-600'
                : 'border-gray-200 text-gray-500 hover:border-gray-300'
            )}>
            {i === 4 && totalExames > 0 ? `${s} (${totalExames})` : s}
          </button>
        ))}
      </div>

      {/* ── Seção 0: Exame Extrabucal ─────────────────────── */}
      {secao === 0 && (
        <div className="bg-gray-50 rounded-xl px-4 py-2">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 pt-1">Exame Extrabucal</p>
          <ExameFisicoField label="Face / Assimetria" value={fisico.face} onChange={v => setF('face', v)} />
          <ExameFisicoField label="ATM" value={fisico.atm} onChange={v => setF('atm', v)}
            placeholder="Ex: estalo, limitação, dor" />
          <ExameFisicoField label="Linfonodos" value={fisico.linfonodos} onChange={v => setF('linfonodos', v)}
            placeholder="Ex: aumentados, dolorosos" />
          <ExameFisicoField label="Lábios" value={fisico.labios} onChange={v => setF('labios', v)} />
          <ExameFisicoField label="Mucosa labial" value={fisico.mucosa_labial} onChange={v => setF('mucosa_labial', v)} />
        </div>
      )}

      {/* ── Seção 1: Exame Intrabucal ─────────────────────── */}
      {secao === 1 && (
        <div className="bg-gray-50 rounded-xl px-4 py-2">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 pt-1">Exame Intrabucal</p>
          <ExameFisicoField label="Mucosa oral" value={fisico.mucosa_oral} onChange={v => setF('mucosa_oral', v)} />
          <ExameFisicoField label="Língua / Assoalho" value={fisico.lingua} onChange={v => setF('lingua', v)} />
          <ExameFisicoField label="Assoalho bucal" value={fisico.assoalho} onChange={v => setF('assoalho', v)} />
          <ExameFisicoField label="Palato / Orofaringe" value={fisico.palato} onChange={v => setF('palato', v)} />
          <ExameFisicoField label="Gengiva / Periodonto" value={fisico.gengiva} onChange={v => setF('gengiva', v)}
            placeholder="Ex: hiperemia, retração, bolsa" />
        </div>
      )}

      {/* ── Seção 2: Oclusão / DTM ───────────────────────── */}
      {secao === 2 && (
        <div className="space-y-3">
          <div className="bg-gray-50 rounded-xl px-4 py-2">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 pt-1">Oclusão</p>
            <div className="py-2.5 border-b border-gray-100">
              <p className="text-xs text-gray-500 mb-2">Classe de Angle</p>
              <div className="flex gap-2">
                {['Classe I', 'Classe II div. 1', 'Classe II div. 2', 'Classe III'].map(c => (
                  <button key={c} type="button" onClick={() => setF('classe_angle', fisico.classe_angle === c ? '' : c)}
                    className={clsx('px-2.5 py-1 rounded-lg text-xs font-medium border-2 transition-all',
                      fisico.classe_angle === c
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 text-gray-500')}>
                    {c}
                  </button>
                ))}
              </div>
            </div>
            <ExameFisicoField label="Overjet (mm)" value={fisico.overjet} onChange={v => setF('overjet', v)} placeholder="Ex: 3mm" />
            <ExameFisicoField label="Overbite (mm)" value={fisico.overbite} onChange={v => setF('overbite', v)} placeholder="Ex: 2mm" />
          </div>
          <div className="bg-gray-50 rounded-xl px-4 py-2">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 pt-1">DTM / Parafunções</p>
            <ExameFisicoField label="Sinais de DTM" value={fisico.dtm_sinais} onChange={v => setF('dtm_sinais', v)}
              placeholder="Ex: estalo, crepitação, trava" />
            <ExameFisicoField label="Parafunções" value={fisico.parafuncoes} onChange={v => setF('parafuncoes', v)}
              placeholder="Ex: bruxismo, onicofagia" />
          </div>
        </div>
      )}

      {/* ── Seção 3: Patologias ──────────────────────────── */}
      {secao === 3 && (
        <div className="bg-gray-50 rounded-xl px-4 py-2">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 pt-1">Patologias Observadas</p>
          <ExameFisicoField label="Lesões de cárie" value={fisico.lesoes_carie} onChange={v => setF('lesoes_carie', v)}
            placeholder="Ex: dentes 36, 46 — cárie oclusal" />
          <ExameFisicoField label="Fraturas" value={fisico.fraturas} onChange={v => setF('fraturas', v)}
            placeholder="Ex: fratura de cúspide dente 16" />
          <ExameFisicoField label="Lesões em mucosas" value={fisico.lesoes_mucosa} onChange={v => setF('lesoes_mucosa', v)}
            placeholder="Ex: úlcera, leucoplasia, eritroplasia" />
          <ExameFisicoField label="Outras patologias" value={fisico.outras_patologias} onChange={v => setF('outras_patologias', v)} />
        </div>
      )}

      {/* ── Seção 4: Exames Complementares ──────────────── */}
      {secao === 4 && (
        <div className="space-y-4">
          <div>
            <label className="label">Selecione os exames solicitados</label>
            <div className="flex flex-wrap gap-1 mb-3">
              {[...CATEGORIAS_EXAME.map(c => c.nome), 'Personalizado'].map((nome, i) => (
                <button key={nome} type="button" onClick={() => setAba(i)}
                  className={clsx('px-2.5 py-1 text-xs font-medium rounded-lg border transition-colors',
                    aba === i ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 text-gray-500 hover:border-gray-300')}>
                  {nome}
                </button>
              ))}
            </div>

            {aba < CATEGORIAS_EXAME.length && (
              <div className="space-y-1.5">
                {CATEGORIAS_EXAME[aba].exames.map(exame => {
                  const sel = selecionados.find(e => e.nome === exame.nome)
                  return (
                    <div key={exame.nome} className="space-y-1">
                      <label className={clsx('flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors',
                        sel ? 'bg-blue-50 border-blue-200' : 'border-gray-100 hover:border-gray-200')}>
                        <div onClick={() => toggleExame(exame.nome, exame.desc)}
                          className={clsx('w-5 h-5 rounded flex items-center justify-center border-2 shrink-0 transition-colors',
                            sel ? 'bg-blue-600 border-blue-600' : 'border-gray-300')}>
                          {sel && <Check size={12} className="text-white" />}
                        </div>
                        <span className="text-sm text-gray-800 flex-1" onClick={() => toggleExame(exame.nome, exame.desc)}>
                          {exame.nome}
                        </span>
                      </label>
                      {sel && exame.desc && (
                        <input className="input text-sm ml-8" placeholder={`Detalhe: ${exame.desc}`}
                          value={sel.desc} onChange={e => setDescricao(exame.nome, e.target.value)} />
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {aba === CATEGORIAS_EXAME.length && (
              <div className="space-y-2">
                {livres.map((l, i) => (
                  <div key={i} className="border border-gray-100 rounded-xl p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <input className="input flex-1 text-sm" placeholder="Nome do exame" value={l.titulo}
                        onChange={e => setLivre(i, 'titulo', e.target.value)} />
                      <button type="button" onClick={() => removeLivre(i)} className="p-1 text-gray-300 hover:text-red-500 rounded">
                        <X size={14} />
                      </button>
                    </div>
                    <textarea className="input w-full text-sm resize-none" rows={2}
                      placeholder="Região anatômica / detalhes..." value={l.descricao}
                      onChange={e => setLivre(i, 'descricao', e.target.value)} />
                  </div>
                ))}
                <button type="button" onClick={addLivre} className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                  <Plus size={12} /> Adicionar exame personalizado
                </button>
              </div>
            )}
          </div>

          {totalExames > 0 && (
            <div className="bg-blue-50 rounded-xl px-4 py-3">
              <p className="text-xs font-semibold text-blue-700 mb-1.5">{totalExames} exame(s) solicitado(s)</p>
              <ul className="space-y-0.5">
                {selecionados.map(e => <li key={e.nome} className="text-xs text-blue-600">• {e.nome}{e.desc ? ` — ${e.desc}` : ''}</li>)}
                {livres.filter(l => l.titulo).map((l, i) => <li key={i} className="text-xs text-blue-600">• {l.titulo}</li>)}
              </ul>
            </div>
          )}

          <div>
            <label className="label">Indicação clínica / Hipótese diagnóstica</label>
            <textarea className="input w-full resize-none text-sm" rows={3}
              placeholder="Descreva a indicação clínica e hipótese diagnóstica para os exames solicitados..."
              value={indicacao}
              onChange={e => { setIndicacao(e.target.value); emitir(fisico, selecionados, livres, e.target.value) }} />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={urgente} className="accent-blue-600"
              onChange={e => { setUrgente(e.target.checked); emitir(fisico, selecionados, livres, indicacao, e.target.checked) }} />
            <span className="text-sm font-medium text-gray-700">Marcar como urgente</span>
          </label>
        </div>
      )}

      {/* Barra de navegação entre seções */}
      <div className="flex items-center justify-between pt-1">
        <button type="button" disabled={secao === 0} onClick={() => setSecao(s => s - 1)}
          className="text-xs text-gray-400 hover:text-gray-600 disabled:opacity-30 flex items-center gap-1">
          ← Anterior
        </button>
        <div className="flex gap-1">
          {SECOES_EXAME.map((_, i) => (
            <div key={i} onClick={() => setSecao(i)}
              className={clsx('w-1.5 h-1.5 rounded-full cursor-pointer transition-colors',
                i === secao ? 'bg-blue-600' : 'bg-gray-300')} />
          ))}
        </div>
        <button type="button" disabled={secao === SECOES_EXAME.length - 1} onClick={() => setSecao(s => s + 1)}
          className="text-xs text-gray-400 hover:text-gray-600 disabled:opacity-30 flex items-center gap-1">
          Próxima →
        </button>
      </div>
    </div>
  )
}

// ─── modal novo documento ─────────────────────────────────────────────────────

function NovoDocModal({ onClose, onSaved }: { onClose: () => void; onSaved: (d: DocRow) => void }) {
  const [step,     setStep]     = useState<1 | 2>(1)
  const [tipo,     setTipo]     = useState<TipoDoc | null>(null)
  const [paciente, setPaciente] = useState<PacienteBusca | null>(null)
  const [dados,    setDados]    = useState<object>({})
  const [saving,   setSaving]   = useState(false)
  const [error,    setError]    = useState('')

  async function salvar() {
    if (!tipo || !paciente) { setError('Selecione um paciente.'); return }
    setSaving(true); setError('')
    const { data, error: err } = await (supabase.from('documentos') as any).insert({
      tipo,
      paciente_id:   paciente.id,
      paciente_nome: paciente.nome,
      numero_documento: gerarNumero(tipo),
      conteudo_texto: JSON.stringify(dados),
    }).select().single()
    if (err) { setError(err.message); setSaving(false); return }
    onSaved(data as DocRow)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[92vh] flex flex-col">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between shrink-0">
          <div>
            <h2 className="font-semibold text-gray-900">Novo documento</h2>
            {tipo && <p className="text-xs text-gray-400 mt-0.5">{tipoLabel(tipo)}</p>}
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"><X size={16} /></button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {step === 1 && (
            <div className="grid grid-cols-2 gap-3">
              {TIPOS.map(t => (
                <button key={t.id} onClick={() => { setTipo(t.id); setStep(2) }}
                  className={clsx('text-left p-4 rounded-xl border-2 transition-all hover:shadow-sm', t.cor)}>
                  <p className="font-semibold text-sm">{t.label}</p>
                  <p className="text-xs mt-0.5 opacity-70">{t.desc}</p>
                </button>
              ))}
            </div>
          )}

          {step === 2 && tipo && (
            <>
              <button onClick={() => { setStep(1); setTipo(null) }}
                className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1">
                ← Trocar tipo
              </button>
              <div>
                <label className="label">Paciente *</label>
                <BuscaPacienteInput value={paciente} onSelect={setPaciente} />
              </div>
              {(tipo === 'receituario' || tipo === 'receituario_especial' || tipo === 'receituario_controle_especial') &&
                <ReceituarioForm especial={tipo !== 'receituario'} onChange={setDados} />}
              {tipo === 'atestado' && <AtestadoForm onChange={setDados} />}
              {tipo === 'pedido_exame' && <PedidoExameForm onChange={setDados} />}
              {error && <p className="text-sm text-red-600">{error}</p>}
            </>
          )}
        </div>

        {step === 2 && (
          <div className="px-6 py-4 border-t border-gray-100 flex gap-3 justify-end shrink-0">
            <button onClick={onClose} className="btn-secondary">Cancelar</button>
            <button onClick={salvar} disabled={saving || !paciente} className="btn-primary disabled:opacity-40">
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
  const router  = useRouter()
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

  function whatsapp(doc: DocRow) {
    const texto = encodeURIComponent(`Olá! Segue o documento *${tipoLabel(doc.tipo)}* — Nº ${doc.numero_documento ?? ''}. Acesse para visualizar e imprimir.`)
    window.open(`https://wa.me/?text=${texto}`, '_blank')
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Documentos</h1>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          <Plus size={15} /> Novo documento
        </button>
      </div>

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
                Nº {doc.numero_documento ?? '—'} · {doc.created_at
                  ? format(parseISO(doc.created_at), "d 'de' MMMM 'de' yyyy", { locale: ptBR }) : ''}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button onClick={() => whatsapp(doc)}
                className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="Enviar via WhatsApp">
                <Send size={15} />
              </button>
              <button onClick={() => router.push(`/documentos/${doc.id}`)} className="btn-secondary text-xs py-1.5 px-3">
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
        <NovoDocModal onClose={() => setShowModal(false)} onSaved={d => setDocs(prev => [d, ...prev])} />
      )}
    </div>
  )
}
