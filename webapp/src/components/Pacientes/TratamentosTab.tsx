'use client'
import { useState, useEffect } from 'react'
import { Plus, X, ChevronDown, ChevronUp, Printer, FileText, Activity } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import clsx from 'clsx'

// ─── tipos ────────────────────────────────────────────────────────────────────

type TipoRegistro = 'exame_clinico' | 'ortodontia' | 'endodontia'

interface RegistroClinico {
  id: string
  paciente_id: string
  tipo: TipoRegistro
  data: string
  conteudo: Record<string, unknown>
  created_at: string
}

// ─── helpers ──────────────────────────────────────────────────────────────────

const TIPO_CONFIG: Record<TipoRegistro, { label: string; cor: string }> = {
  exame_clinico: { label: 'Exame Clínico', cor: 'bg-blue-50 text-blue-700 border-blue-200' },
  ortodontia:    { label: 'Ortodontia',    cor: 'bg-purple-50 text-purple-700 border-purple-200' },
  endodontia:    { label: 'Endodontia',    cor: 'bg-amber-50 text-amber-700 border-amber-200' },
}

function Campo({ label, value, placeholder }: { label: string; value: string; placeholder?: string }) {
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-gray-50 last:border-0">
      <span className="text-xs text-gray-500 w-40 shrink-0 pt-1.5 leading-tight">{label}</span>
      <input
        readOnly
        value={value}
        placeholder={placeholder ?? '—'}
        className="flex-1 text-sm bg-transparent border-0 outline-none text-gray-700"
      />
    </div>
  )
}

function CampoEdit({ label, value, onChange, placeholder, type = 'text' }: {
  label: string; value: string; onChange: (v: string) => void
  placeholder?: string; type?: string
}) {
  return (
    <div className="flex items-start gap-3 py-2 border-b border-gray-50 last:border-0">
      <span className="text-xs text-gray-500 w-40 shrink-0 pt-2 leading-tight">{label}</span>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder ?? 'Sem alterações'}
        className="flex-1 text-sm border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  )
}

function TextareaEdit({ label, value, onChange, placeholder, rows = 2 }: {
  label: string; value: string; onChange: (v: string) => void
  placeholder?: string; rows?: number
}) {
  return (
    <div className="flex items-start gap-3 py-2 border-b border-gray-50 last:border-0">
      <span className="text-xs text-gray-500 w-40 shrink-0 pt-2 leading-tight">{label}</span>
      <textarea
        rows={rows}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder ?? ''}
        className="flex-1 text-sm border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
      />
    </div>
  )
}

function Chips({ label, options, value, onChange }: {
  label: string; options: string[]; value: string; onChange: (v: string) => void
}) {
  return (
    <div className="py-2 border-b border-gray-50 last:border-0">
      <p className="text-xs text-gray-500 mb-2">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {options.map(o => (
          <button key={o} type="button"
            onClick={() => onChange(value === o ? '' : o)}
            className={clsx('px-2.5 py-1 rounded-lg text-xs font-medium border-2 transition-all',
              value === o ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-500 hover:border-gray-300')}>
            {o}
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── formulário exame clínico ─────────────────────────────────────────────────

const SECOES_EXAME = ['Extrabucal', 'Intrabucal', 'Oclusão / DTM', 'Patologias']

interface ExameFisico {
  face: string; atm: string; linfonodos: string; labios: string; mucosa_labial: string
  mucosa_oral: string; lingua: string; assoalho: string; palato: string; gengiva: string
  classe_angle: string; overjet: string; overbite: string; dtm_sinais: string; parafuncoes: string
  lesoes_carie: string; fraturas: string; lesoes_mucosa: string; outras_patologias: string
  observacoes: string
}

const EMPTY_EXAME: ExameFisico = {
  face: '', atm: '', linfonodos: '', labios: '', mucosa_labial: '',
  mucosa_oral: '', lingua: '', assoalho: '', palato: '', gengiva: '',
  classe_angle: '', overjet: '', overbite: '', dtm_sinais: '', parafuncoes: '',
  lesoes_carie: '', fraturas: '', lesoes_mucosa: '', outras_patologias: '',
  observacoes: '',
}

function ExameClinicoForm({ value, onChange }: {
  value: ExameFisico; onChange: (v: ExameFisico) => void
}) {
  const [secao, setSecao] = useState(0)

  function set<K extends keyof ExameFisico>(key: K, val: string) {
    onChange({ ...value, [key]: val })
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-1 overflow-x-auto pb-0.5">
        {SECOES_EXAME.map((s, i) => (
          <button key={s} type="button" onClick={() => setSecao(i)}
            className={clsx('px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap border transition-colors shrink-0',
              secao === i ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 text-gray-500 hover:border-gray-300')}>
            {s}
          </button>
        ))}
      </div>

      {secao === 0 && (
        <div className="bg-gray-50 rounded-xl px-4 py-2">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1 pt-1">Extrabucal</p>
          <CampoEdit label="Face / Assimetria"  value={value.face}         onChange={v => set('face', v)} />
          <CampoEdit label="ATM"                value={value.atm}          onChange={v => set('atm', v)} placeholder="Ex: estalo, limitação, dor" />
          <CampoEdit label="Linfonodos"         value={value.linfonodos}   onChange={v => set('linfonodos', v)} placeholder="Ex: aumentados, dolorosos" />
          <CampoEdit label="Lábios"             value={value.labios}       onChange={v => set('labios', v)} />
          <CampoEdit label="Mucosa labial"      value={value.mucosa_labial} onChange={v => set('mucosa_labial', v)} />
        </div>
      )}

      {secao === 1 && (
        <div className="bg-gray-50 rounded-xl px-4 py-2">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1 pt-1">Intrabucal</p>
          <CampoEdit label="Mucosa oral"        value={value.mucosa_oral}  onChange={v => set('mucosa_oral', v)} />
          <CampoEdit label="Língua"             value={value.lingua}       onChange={v => set('lingua', v)} />
          <CampoEdit label="Assoalho bucal"     value={value.assoalho}     onChange={v => set('assoalho', v)} />
          <CampoEdit label="Palato / Orofaringe" value={value.palato}      onChange={v => set('palato', v)} />
          <CampoEdit label="Gengiva / Periodonto" value={value.gengiva}    onChange={v => set('gengiva', v)} placeholder="Ex: hiperemia, retração, bolsa" />
        </div>
      )}

      {secao === 2 && (
        <div className="space-y-3">
          <div className="bg-gray-50 rounded-xl px-4 py-2">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1 pt-1">Oclusão</p>
            <Chips label="Classe de Angle"
              options={['Classe I', 'Classe II div. 1', 'Classe II div. 2', 'Classe III']}
              value={value.classe_angle} onChange={v => set('classe_angle', v)} />
            <CampoEdit label="Overjet (mm)" value={value.overjet} onChange={v => set('overjet', v)} placeholder="Ex: 3mm" />
            <CampoEdit label="Overbite (mm)" value={value.overbite} onChange={v => set('overbite', v)} placeholder="Ex: 2mm" />
          </div>
          <div className="bg-gray-50 rounded-xl px-4 py-2">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1 pt-1">DTM / Parafunções</p>
            <CampoEdit label="Sinais de DTM"  value={value.dtm_sinais}  onChange={v => set('dtm_sinais', v)} placeholder="Ex: estalo, crepitação, trava" />
            <CampoEdit label="Parafunções"    value={value.parafuncoes} onChange={v => set('parafuncoes', v)} placeholder="Ex: bruxismo, onicofagia" />
          </div>
        </div>
      )}

      {secao === 3 && (
        <div className="bg-gray-50 rounded-xl px-4 py-2">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1 pt-1">Patologias</p>
          <CampoEdit label="Lesões de cárie"   value={value.lesoes_carie}    onChange={v => set('lesoes_carie', v)} placeholder="Ex: dentes 36, 46 — cárie oclusal" />
          <CampoEdit label="Fraturas"          value={value.fraturas}        onChange={v => set('fraturas', v)} placeholder="Ex: fratura de cúspide dente 16" />
          <CampoEdit label="Lesões em mucosas" value={value.lesoes_mucosa}   onChange={v => set('lesoes_mucosa', v)} placeholder="Ex: úlcera, leucoplasia, eritroplasia" />
          <CampoEdit label="Outras patologias" value={value.outras_patologias} onChange={v => set('outras_patologias', v)} />
        </div>
      )}

      <div className="flex items-center justify-between pt-1">
        <button type="button" disabled={secao === 0} onClick={() => setSecao(s => s - 1)}
          className="text-xs text-gray-400 hover:text-gray-600 disabled:opacity-30">← Anterior</button>
        <div className="flex gap-1">
          {SECOES_EXAME.map((_, i) => (
            <div key={i} onClick={() => setSecao(i)}
              className={clsx('w-1.5 h-1.5 rounded-full cursor-pointer transition-colors',
                i === secao ? 'bg-blue-600' : 'bg-gray-300')} />
          ))}
        </div>
        <button type="button" disabled={secao === SECOES_EXAME.length - 1} onClick={() => setSecao(s => s + 1)}
          className="text-xs text-gray-400 hover:text-gray-600 disabled:opacity-30">Próxima →</button>
      </div>

      <TextareaEdit label="Observações gerais" value={value.observacoes} onChange={v => set('observacoes', v)} rows={2} />
    </div>
  )
}

// ─── formulário ortodontia ────────────────────────────────────────────────────

interface OrtodontiaData {
  tipo_aparelho: string; fase: string
  arco_sup_fio: string; arco_sup_numero: string
  arco_inf_fio: string; arco_inf_numero: string
  elasticos: string; broquetes: string
  observacoes: string; proximo_passo: string
}

const EMPTY_ORTOD: OrtodontiaData = {
  tipo_aparelho: '', fase: '', arco_sup_fio: '', arco_sup_numero: '',
  arco_inf_fio: '', arco_inf_numero: '', elasticos: '', broquetes: '',
  observacoes: '', proximo_passo: '',
}

function OrtodontiaForm({ value, onChange }: {
  value: OrtodontiaData; onChange: (v: OrtodontiaData) => void
}) {
  function set<K extends keyof OrtodontiaData>(key: K, val: string) {
    onChange({ ...value, [key]: val })
  }

  return (
    <div className="space-y-3">
      <div className="bg-gray-50 rounded-xl px-4 py-2">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1 pt-1">Configuração do aparelho</p>
        <Chips label="Tipo de aparelho"
          options={['Fixo metálico', 'Fixo estético', 'Alinhadores', 'Removível']}
          value={value.tipo_aparelho} onChange={v => set('tipo_aparelho', v)} />
        <Chips label="Fase atual"
          options={['Nivelamento', 'Fechamento de espaços', 'Finalização', 'Contenção']}
          value={value.fase} onChange={v => set('fase', v)} />
      </div>

      <div className="bg-gray-50 rounded-xl px-4 py-2">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1 pt-1">Arcos e fios</p>
        <div className="grid grid-cols-2 gap-x-4">
          <CampoEdit label="Arco sup. — fio"    value={value.arco_sup_fio}    onChange={v => set('arco_sup_fio', v)} placeholder="Ex: NiTi, aço" />
          <CampoEdit label="Nº"                  value={value.arco_sup_numero} onChange={v => set('arco_sup_numero', v)} placeholder="Ex: 0.18" />
          <CampoEdit label="Arco inf. — fio"    value={value.arco_inf_fio}    onChange={v => set('arco_inf_fio', v)} placeholder="Ex: NiTi, aço" />
          <CampoEdit label="Nº"                  value={value.arco_inf_numero} onChange={v => set('arco_inf_numero', v)} placeholder="Ex: 0.16" />
        </div>
        <CampoEdit label="Elásticos"             value={value.elasticos}       onChange={v => set('elasticos', v)} placeholder="Ex: Classe II, 3/16 médio" />
      </div>

      <div className="bg-gray-50 rounded-xl px-4 py-2">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1 pt-1">Sessão</p>
        <CampoEdit label="Bráquetes / colagem"   value={value.broquetes}      onChange={v => set('broquetes', v)} placeholder="Ex: colado 14, removido 24" />
        <TextareaEdit label="Observações"        value={value.observacoes}    onChange={v => set('observacoes', v)} rows={2} />
        <TextareaEdit label="Próximo passo"      value={value.proximo_passo}  onChange={v => set('proximo_passo', v)} rows={2} placeholder="Ex: trocar para fio 0.19x0.25, elástico classe II" />
      </div>
    </div>
  )
}

// ─── formulário endodontia ────────────────────────────────────────────────────

interface EndodontiaData {
  dente: string; diagnostico: string; sessao: string
  comprimento_trabalho: string; lima_inicial: string; lima_apical: string
  instrumentacao: string; irrigacao: string; medicacao_intracanal: string
  obturado: boolean; tecnica_obturacao: string; cimento: string
  selamento: string; observacoes: string
}

const EMPTY_ENDO: EndodontiaData = {
  dente: '', diagnostico: '', sessao: '',
  comprimento_trabalho: '', lima_inicial: '', lima_apical: '',
  instrumentacao: '', irrigacao: '', medicacao_intracanal: '',
  obturado: false, tecnica_obturacao: '', cimento: '',
  selamento: '', observacoes: '',
}

function EndodontiaForm({ value, onChange }: {
  value: EndodontiaData; onChange: (v: EndodontiaData) => void
}) {
  function set<K extends keyof EndodontiaData>(key: K, val: EndodontiaData[K]) {
    onChange({ ...value, [key]: val })
  }

  return (
    <div className="space-y-3">
      <div className="bg-gray-50 rounded-xl px-4 py-2">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1 pt-1">Identificação</p>
        <CampoEdit label="Dente (número)"        value={value.dente}      onChange={v => set('dente', v)} placeholder="Ex: 36" type="text" />
        <Chips label="Diagnóstico"
          options={['Pulpite reversível', 'Pulpite irreversível', 'Necrose pulpar', 'Retratamento']}
          value={value.diagnostico} onChange={v => set('diagnostico', v)} />
        <Chips label="Sessão nº"
          options={['1ª', '2ª', '3ª', '4ª', '5ª+']}
          value={value.sessao} onChange={v => set('sessao', v)} />
      </div>

      <div className="bg-gray-50 rounded-xl px-4 py-2">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1 pt-1">Instrumentação</p>
        <CampoEdit label="Comprimento de trabalho" value={value.comprimento_trabalho} onChange={v => set('comprimento_trabalho', v)} placeholder="Ex: 21mm" />
        <CampoEdit label="Lima inicial (IAF)"      value={value.lima_inicial}          onChange={v => set('lima_inicial', v)} placeholder="Ex: #15" />
        <CampoEdit label="Lima apical (MAF)"       value={value.lima_apical}           onChange={v => set('lima_apical', v)} placeholder="Ex: #30" />
        <CampoEdit label="Técnica / instrumento"   value={value.instrumentacao}        onChange={v => set('instrumentacao', v)} placeholder="Ex: ProTaper Gold F3, Crown-down" />
      </div>

      <div className="bg-gray-50 rounded-xl px-4 py-2">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1 pt-1">Irrigação e medicação</p>
        <CampoEdit label="Irrigação"             value={value.irrigacao}            onChange={v => set('irrigacao', v)} placeholder="Ex: NaOCl 2,5%, EDTA 17%" />
        <CampoEdit label="Medicação intracanal"  value={value.medicacao_intracanal} onChange={v => set('medicacao_intracanal', v)} placeholder="Ex: Ca(OH)2 — manter 15 dias" />
      </div>

      <div className="bg-gray-50 rounded-xl px-4 py-2">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1 pt-1">Obturação e selamento</p>
        <div className="py-2 border-b border-gray-50">
          <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
            <input type="checkbox" checked={value.obturado} className="accent-blue-600"
              onChange={e => set('obturado', e.target.checked)} />
            Canal obturado nesta sessão
          </label>
        </div>
        {value.obturado && (
          <>
            <CampoEdit label="Técnica de obturação" value={value.tecnica_obturacao} onChange={v => set('tecnica_obturacao', v)} placeholder="Ex: Condensação lateral" />
            <CampoEdit label="Cimento obturador"    value={value.cimento}           onChange={v => set('cimento', v)} placeholder="Ex: AH Plus" />
          </>
        )}
        <CampoEdit label="Selamento coronário"      value={value.selamento}          onChange={v => set('selamento', v)} placeholder="Ex: Provisório — Coltosol / Permanente — resina" />
      </div>

      <TextareaEdit label="Observações" value={value.observacoes} onChange={v => set('observacoes', v)} rows={2} />
    </div>
  )
}

// ─── modal adicionar registro ─────────────────────────────────────────────────

function NovoRegistroModal({ pacienteId, onClose, onSaved }: {
  pacienteId: string
  onClose: () => void
  onSaved: (r: RegistroClinico) => void
}) {
  const [tipo, setTipo] = useState<TipoRegistro | null>(null)
  const [data, setData] = useState(new Date().toISOString().split('T')[0])
  const [conteudo, setConteudo] = useState<Record<string, unknown>>({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [exame, setExame]     = useState<ExameFisico>(EMPTY_EXAME)
  const [ortod, setOrtod]     = useState<OrtodontiaData>(EMPTY_ORTOD)
  const [endo, setEndo]       = useState<EndodontiaData>(EMPTY_ENDO)

  useEffect(() => {
    if (tipo === 'exame_clinico') setConteudo(exame as unknown as Record<string, unknown>)
    else if (tipo === 'ortodontia') setConteudo(ortod as unknown as Record<string, unknown>)
    else if (tipo === 'endodontia') setConteudo(endo as unknown as Record<string, unknown>)
  }, [exame, ortod, endo, tipo])

  async function salvar() {
    if (!tipo) return
    setSaving(true); setError('')
    const { data: row, error: err } = await (supabase.from('registros_clinicos') as any)
      .insert({ paciente_id: pacienteId, tipo, data, conteudo })
      .select()
      .single()
    if (err) { setError(err.message); setSaving(false); return }
    onSaved(row as RegistroClinico)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[92vh] flex flex-col">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between shrink-0">
          <h2 className="font-semibold text-gray-900">
            {tipo ? TIPO_CONFIG[tipo].label : 'Novo registro clínico'}
          </h2>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
            <X size={16} />
          </button>
        </div>

        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {/* Tipo */}
          {!tipo ? (
            <div className="grid grid-cols-1 gap-3">
              {(Object.entries(TIPO_CONFIG) as [TipoRegistro, { label: string; cor: string }][]).map(([id, cfg]) => (
                <button key={id} type="button" onClick={() => setTipo(id)}
                  className="text-left p-4 rounded-xl border-2 border-gray-100 hover:border-blue-200 hover:bg-blue-50 transition-all">
                  <p className="font-semibold text-sm text-gray-800">{cfg.label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {id === 'exame_clinico' && 'Extrabucal, intrabucal, oclusão, DTM e patologias'}
                    {id === 'ortodontia'    && 'Aparelho, arcos, fios, elásticos e planejamento'}
                    {id === 'endodontia'   && 'Diagnóstico, instrumentação, irrigação e obturação'}
                  </p>
                </button>
              ))}
            </div>
          ) : (
            <>
              <button onClick={() => setTipo(null)}
                className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1">
                ← Trocar tipo
              </button>

              <div>
                <label className="label">Data da sessão</label>
                <input type="date" className="input" value={data} onChange={e => setData(e.target.value)} />
              </div>

              {tipo === 'exame_clinico' && <ExameClinicoForm value={exame} onChange={v => { setExame(v); setConteudo(v as unknown as Record<string, unknown>) }} />}
              {tipo === 'ortodontia'    && <OrtodontiaForm   value={ortod} onChange={v => { setOrtod(v); setConteudo(v as unknown as Record<string, unknown>) }} />}
              {tipo === 'endodontia'    && <EndodontiaForm   value={endo}  onChange={v => { setEndo(v);  setConteudo(v as unknown as Record<string, unknown>) }} />}

              {error && <p className="text-sm text-red-600">{error}</p>}
            </>
          )}
        </div>

        {tipo && (
          <div className="px-5 py-4 border-t border-gray-100 flex gap-3 justify-end shrink-0">
            <button onClick={onClose} className="btn-secondary">Cancelar</button>
            <button onClick={salvar} disabled={saving} className="btn-primary disabled:opacity-40">
              {saving ? 'Salvando...' : 'Salvar registro'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── visualizador de registro ─────────────────────────────────────────────────

function RegistroView({ r }: { r: RegistroClinico }) {
  const c = r.conteudo as Record<string, string | boolean>

  function linha(label: string, valor: unknown) {
    if (!valor) return null
    return (
      <tr key={label} className="border-b border-gray-50">
        <td className="py-1.5 pr-4 text-xs text-gray-400 w-44 align-top">{label}</td>
        <td className="py-1.5 text-sm text-gray-700">{String(valor)}</td>
      </tr>
    )
  }

  if (r.tipo === 'exame_clinico') return (
    <div className="space-y-3 text-sm">
      {[
        ['Extrabucal', [['Face / Assimetria', c.face], ['ATM', c.atm], ['Linfonodos', c.linfonodos], ['Lábios', c.labios], ['Mucosa labial', c.mucosa_labial]]],
        ['Intrabucal', [['Mucosa oral', c.mucosa_oral], ['Língua', c.lingua], ['Assoalho', c.assoalho], ['Palato', c.palato], ['Gengiva', c.gengiva]]],
        ['Oclusão / DTM', [['Classe de Angle', c.classe_angle], ['Overjet', c.overjet], ['Overbite', c.overbite], ['Sinais DTM', c.dtm_sinais], ['Parafunções', c.parafuncoes]]],
        ['Patologias', [['Lesões de cárie', c.lesoes_carie], ['Fraturas', c.fraturas], ['Lesões mucosa', c.lesoes_mucosa], ['Outras', c.outras_patologias]]],
      ].map(([titulo, campos]) => {
        const rows = (campos as [string, unknown][]).filter(([, v]) => v)
        if (!rows.length) return null
        return (
          <div key={titulo as string}>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">{titulo as string}</p>
            <table className="w-full"><tbody>{rows.map(([l, v]) => linha(l, v))}</tbody></table>
          </div>
        )
      })}
      {c.observacoes && <p className="text-xs text-gray-500 border-t border-gray-100 pt-2"><span className="font-medium">Observações:</span> {c.observacoes as string}</p>}
    </div>
  )

  if (r.tipo === 'ortodontia') return (
    <table className="w-full text-sm">
      <tbody>
        {linha('Tipo de aparelho', c.tipo_aparelho)}
        {linha('Fase', c.fase)}
        {linha('Arco sup. fio', c.arco_sup_fio && c.arco_sup_numero ? `${c.arco_sup_fio} ${c.arco_sup_numero}` : c.arco_sup_fio || c.arco_sup_numero)}
        {linha('Arco inf. fio', c.arco_inf_fio && c.arco_inf_numero ? `${c.arco_inf_fio} ${c.arco_inf_numero}` : c.arco_inf_fio || c.arco_inf_numero)}
        {linha('Elásticos', c.elasticos)}
        {linha('Bráquetes', c.broquetes)}
        {linha('Observações', c.observacoes)}
        {linha('Próximo passo', c.proximo_passo)}
      </tbody>
    </table>
  )

  if (r.tipo === 'endodontia') return (
    <table className="w-full text-sm">
      <tbody>
        {linha('Dente', c.dente)}
        {linha('Diagnóstico', c.diagnostico)}
        {linha('Sessão', c.sessao)}
        {linha('Comp. de trabalho', c.comprimento_trabalho)}
        {linha('Lima inicial (IAF)', c.lima_inicial)}
        {linha('Lima apical (MAF)', c.lima_apical)}
        {linha('Instrumentação', c.instrumentacao)}
        {linha('Irrigação', c.irrigacao)}
        {linha('Medicação intracanal', c.medicacao_intracanal)}
        {c.obturado && linha('Obturado', 'Sim')}
        {c.obturado && linha('Técnica', c.tecnica_obturacao)}
        {c.obturado && linha('Cimento', c.cimento)}
        {linha('Selamento', c.selamento)}
        {linha('Observações', c.observacoes)}
      </tbody>
    </table>
  )

  return null
}

// ─── componente principal ─────────────────────────────────────────────────────

export function TratamentosTab({ pacienteId, pacienteNome }: {
  pacienteId: string
  pacienteNome: string
}) {
  const [registros, setRegistros]   = useState<RegistroClinico[]>([])
  const [loading, setLoading]       = useState(true)
  const [showModal, setShowModal]   = useState(false)
  const [expandido, setExpandido]   = useState<string | null>(null)

  useEffect(() => {
    ;(supabase.from('registros_clinicos') as any)
      .select('*')
      .eq('paciente_id', pacienteId)
      .order('data', { ascending: false })
      .then(({ data }: { data: RegistroClinico[] | null }) => {
        setRegistros(data ?? [])
        setLoading(false)
      })
  }, [pacienteId])

  function abrirRelatorio(registroId?: string) {
    const url = registroId
      ? `/pacientes/${pacienteId}/relatorio?registro=${registroId}`
      : `/pacientes/${pacienteId}/relatorio`
    window.open(url, '_blank')
  }

  if (loading) return <div className="py-10 text-center text-sm text-gray-400">Carregando...</div>

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-gray-800">Registros clínicos</h2>
        <div className="flex gap-2">
          {registros.length > 0 && (
            <button onClick={() => abrirRelatorio()}
              className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5">
              <FileText size={13} /> Gerar relatório
            </button>
          )}
          <button onClick={() => setShowModal(true)} className="btn-primary text-sm">
            <Plus size={14} /> Adicionar tratamento
          </button>
        </div>
      </div>

      {registros.length === 0 ? (
        <div className="py-16 flex flex-col items-center justify-center text-center gap-3">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center">
            <Activity size={28} className="text-gray-300" />
          </div>
          <p className="text-sm text-gray-500">Nenhum registro clínico ainda. Adicione o primeiro tratamento.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {registros.map(r => {
            const cfg = TIPO_CONFIG[r.tipo]
            const aberto = expandido === r.id
            return (
              <div key={r.id} className="border border-gray-100 rounded-xl overflow-hidden">
                <div className="flex items-center gap-3 px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={clsx('text-xs px-2 py-0.5 rounded-full border font-medium', cfg.cor)}>
                        {cfg.label}
                      </span>
                      <p className="text-sm font-medium text-gray-700">
                        {format(parseISO(r.data), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                      </p>
                    </div>
                    {/* resumo */}
                    <p className="text-xs text-gray-400 mt-0.5 truncate">
                      {r.tipo === 'ortodontia' && [(r.conteudo as Record<string, string>).tipo_aparelho, (r.conteudo as Record<string, string>).fase].filter(Boolean).join(' · ')}
                      {r.tipo === 'endodontia' && [`Dente ${(r.conteudo as Record<string, string>).dente}`, (r.conteudo as Record<string, string>).diagnostico, (r.conteudo as Record<string, string>).sessao + ' sessão'].filter(Boolean).join(' · ')}
                      {r.tipo === 'exame_clinico' && 'Exame clínico completo'}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button onClick={() => abrirRelatorio(r.id)}
                      className="p-1.5 text-gray-300 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors" title="Imprimir este registro">
                      <Printer size={14} />
                    </button>
                    <button onClick={() => setExpandido(aberto ? null : r.id)}
                      className="p-1.5 text-gray-300 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                      {aberto ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                  </div>
                </div>

                {aberto && (
                  <div className="border-t border-gray-50 px-4 py-3 bg-gray-50">
                    <RegistroView r={r} />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {showModal && (
        <NovoRegistroModal
          pacienteId={pacienteId}
          onClose={() => setShowModal(false)}
          onSaved={r => setRegistros(prev => [r, ...prev])}
        />
      )}
    </div>
  )
}
