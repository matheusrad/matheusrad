'use client'
import { useEffect, useState } from 'react'
import { Stethoscope, CheckCircle2, AlertCircle, ChevronRight, ChevronLeft } from 'lucide-react'

// ── Tipos ──────────────────────────────────────────────────────
interface SaudeBucal {
  respira_bem_nariz: string; respira_obs: string
  dificuldade_boca: string; dificuldade_boca_obs: string
  dor_mandibula: string; dor_mandibula_obs: string
  range_dentes: string
  mastiga_dois_lados: string
  mastiga_bem: string
  retencao_comida: string
  chiclete_bala: string; chiclete_freq: string
  muito_doce: string
  cafe_escuros: string; cafe_freq: string
  come_fora_hora: string
  escova_depois: string
  gengiva_inchada: string; gengiva_inchada_obs: string
  gengiva_sangra: string
  instrucoes_higiene: string
  antisseptico: string; antisseptico_qual: string
  anestesia_local: string; anestesia_obs: string
  vezes_escovacao_dia: string
  tempo_escovacao: string
  vezes_fio_dental: string
  freq_dentista: string
  ultimo_tratamento: string
  historia_doenca_atual: string
  medico_responsavel: string
  historia_familiar: string
  dieta_obs: string
}

const EMPTY_SB: SaudeBucal = {
  respira_bem_nariz: '', respira_obs: '',
  dificuldade_boca: '', dificuldade_boca_obs: '',
  dor_mandibula: '', dor_mandibula_obs: '',
  range_dentes: '', mastiga_dois_lados: '', mastiga_bem: '',
  retencao_comida: '', chiclete_bala: '', chiclete_freq: '',
  muito_doce: '', cafe_escuros: '', cafe_freq: '',
  come_fora_hora: '', escova_depois: '',
  gengiva_inchada: '', gengiva_inchada_obs: '',
  gengiva_sangra: '', instrucoes_higiene: '',
  antisseptico: '', antisseptico_qual: '',
  anestesia_local: '', anestesia_obs: '',
  vezes_escovacao_dia: '', tempo_escovacao: '', vezes_fio_dental: '',
  freq_dentista: '', ultimo_tratamento: '',
  historia_doenca_atual: '', medico_responsavel: '', historia_familiar: '', dieta_obs: '',
}

interface FormData {
  motivo_consulta: string; tem_dor_atual: boolean; local_dor: string
  intensidade_dor: number; tempo_problema: string; ultima_consulta_dentista: string
  em_tratamento_medico: boolean; detalhe_tratamento_medico: string
  usa_medicamento: boolean; qual_medicamento: string
  gestante: boolean; periodo_gestacao: string
  suspendeu_remedio: boolean; detalhe_remedio_suspenso: string
  tem_alergia: boolean; qual_alergia: string
  sensivel_metais_latex: boolean; diabetes: boolean; tem_anemia: boolean
  tem_asma: boolean; hiv_imunossuprimido: boolean; sujeito_infeccoes: boolean
  tem_epilepsia: boolean; ja_teve_convulsoes: boolean; desmaios_tonturas: boolean
  pressao_arterial: string; usa_marcapasso: boolean; articulacoes_artificiais: boolean
  usa_protese: boolean; formigamento_inchazo: boolean; disturbio_coagulacao: boolean
  fuma: boolean; ja_fez_cirurgia: boolean; doenca_grave: boolean
  detalhe_doenca_grave: string; tem_doenca_sistemica: boolean; qual_doenca: string
  hipertensao: boolean; problema_cardiaco: boolean; doenca_renal: boolean
  doenca_hepatica: boolean; osteoporose: boolean; outras_informacoes_saude: string
  consome_alcool: boolean; bruxismo: boolean; sangramento_pos_procedimento: boolean
  medo_tratamento: boolean; saude_bucal: SaudeBucal; observacoes: string
}

const EMPTY: FormData = {
  motivo_consulta: '', tem_dor_atual: false, local_dor: '', intensidade_dor: 0,
  tempo_problema: '', ultima_consulta_dentista: '',
  em_tratamento_medico: false, detalhe_tratamento_medico: '',
  usa_medicamento: false, qual_medicamento: '',
  gestante: false, periodo_gestacao: '',
  suspendeu_remedio: false, detalhe_remedio_suspenso: '',
  tem_alergia: false, qual_alergia: '',
  sensivel_metais_latex: false, diabetes: false, tem_anemia: false,
  tem_asma: false, hiv_imunossuprimido: false, sujeito_infeccoes: false,
  tem_epilepsia: false, ja_teve_convulsoes: false, desmaios_tonturas: false,
  pressao_arterial: '', usa_marcapasso: false, articulacoes_artificiais: false,
  usa_protese: false, formigamento_inchazo: false, disturbio_coagulacao: false,
  fuma: false, ja_fez_cirurgia: false, doenca_grave: false,
  detalhe_doenca_grave: '', tem_doenca_sistemica: false, qual_doenca: '',
  hipertensao: false, problema_cardiaco: false, doenca_renal: false,
  doenca_hepatica: false, osteoporose: false, outras_informacoes_saude: '',
  consome_alcool: false, bruxismo: false, sangramento_pos_procedimento: false,
  medo_tratamento: false, saude_bucal: EMPTY_SB, observacoes: '',
}

// ── Componentes ────────────────────────────────────────────────
function YesNo({ label, checked, onChange, detail, detailLabel, detailValue, onDetailChange }: {
  label: string; checked: boolean; onChange: (v: boolean) => void
  detail?: boolean; detailLabel?: string; detailValue?: string; onDetailChange?: (v: string) => void
}) {
  return (
    <div className="py-3.5 border-b border-gray-100 last:border-0">
      <p className="text-sm font-medium text-gray-800 mb-2.5 leading-snug">{label}</p>
      <div className="flex gap-3">
        {[true, false].map(opt => (
          <button key={String(opt)} type="button" onClick={() => onChange(opt)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${
              checked === opt
                ? opt ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-300 bg-gray-50 text-gray-600'
                : 'border-gray-200 text-gray-400'
            }`}>
            {opt ? '✓ Sim' : '✕ Não'}
          </button>
        ))}
      </div>
      {detail && checked && detailLabel && (
        <textarea value={detailValue ?? ''} onChange={e => onDetailChange?.(e.target.value)}
          placeholder={detailLabel} rows={2}
          className="mt-2.5 w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
      )}
    </div>
  )
}

function TextField({ label, value, onChange, placeholder, rows }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; rows?: number
}) {
  return (
    <div className="py-3 border-b border-gray-100 last:border-0">
      <label className="text-sm font-medium text-gray-800 block mb-1.5">{label}</label>
      {rows ? (
        <textarea value={value} onChange={e => onChange(e.target.value)} rows={rows}
          placeholder={placeholder ?? ''}
          className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
      ) : (
        <input value={value} onChange={e => onChange(e.target.value)}
          placeholder={placeholder ?? ''}
          className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      )}
    </div>
  )
}

function CondChip({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" onClick={() => onChange(!checked)}
      className={`px-3 py-2.5 rounded-xl text-sm font-medium border-2 transition-all text-left ${
        checked ? 'border-orange-400 bg-orange-50 text-orange-800' : 'border-gray-200 text-gray-500'
      }`}>
      {label}
    </button>
  )
}

// ── Passos ─────────────────────────────────────────────────────
const STEPS = [
  'Queixa Principal',
  'Histórico Médico',
  'Doenças',
  'Saúde Bucal',
  'Hábitos',
  'Confirmar',
]

export default function AnamnesesPublicaPage({ params }: { params: { token: string } }) {
  const [status, setStatus] = useState<'loading' | 'ok' | 'error' | 'done'>('loading')
  const [errorMsg, setErrorMsg] = useState('')
  const [pacienteNome, setPacienteNome] = useState('')
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<FormData>(EMPTY)
  const [submitting, setSubmitting] = useState(false)

  function set<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm(prev => ({ ...prev, [key]: value }))
  }
  function setSB<K extends keyof SaudeBucal>(key: K, value: string) {
    setForm(prev => ({ ...prev, saude_bucal: { ...prev.saude_bucal, [key]: value } }))
  }

  useEffect(() => {
    fetch(`/api/anamnese/${params.token}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) { setErrorMsg(data.error); setStatus('error') }
        else { setPacienteNome(data.paciente_nome); setStatus('ok') }
      })
      .catch(() => { setErrorMsg('Erro de conexão.'); setStatus('error') })
  }, [params.token])

  async function handleSubmit() {
    setSubmitting(true)
    try {
      const res = await fetch(`/api/anamnese/${params.token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setStatus('done')
    } catch (e: unknown) {
      setErrorMsg(e instanceof Error ? e.message : 'Erro ao enviar. Tente novamente.')
      setSubmitting(false)
    }
  }

  if (status === 'loading') return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (status === 'error') return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="text-center max-w-sm">
        <AlertCircle size={48} className="text-red-400 mx-auto mb-4" />
        <h1 className="text-lg font-semibold text-gray-900 mb-2">Link inválido</h1>
        <p className="text-sm text-gray-500">{errorMsg}</p>
      </div>
    </div>
  )

  if (status === 'done') return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="text-center max-w-sm">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 size={40} className="text-green-500" />
        </div>
        <h1 className="text-xl font-semibold text-gray-900 mb-2">Anamnese enviada!</h1>
        <p className="text-sm text-gray-500">Suas informações foram recebidas com sucesso. Até breve na consulta!</p>
      </div>
    </div>
  )

  const sb = form.saude_bucal

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 pt-4 pb-3 sticky top-0 z-10">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center shrink-0">
            <Stethoscope size={18} className="text-white" />
          </div>
          <div>
            <p className="text-[11px] text-gray-400 uppercase tracking-wide font-medium">Ficha de Anamnese</p>
            <p className="text-sm font-semibold text-gray-900 leading-tight">{pacienteNome}</p>
          </div>
        </div>
        {/* Progress */}
        <div className="flex gap-1 mb-1.5">
          {STEPS.map((_, i) => (
            <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i <= step ? 'bg-blue-600' : 'bg-gray-200'}`} />
          ))}
        </div>
        <p className="text-[11px] text-gray-400">{STEPS[step]} · Passo {step + 1} de {STEPS.length}</p>
      </div>

      {/* Body */}
      <div className="px-4 py-5 max-w-lg mx-auto pb-32">

        {/* ── Passo 1: Queixa Principal ─────────────────────── */}
        {step === 0 && (
          <div>
            <h2 className="text-base font-bold text-gray-900 mb-1">Qual é o motivo da sua consulta?</h2>
            <p className="text-xs text-gray-400 mb-4">Conte com suas próprias palavras o que te trouxe ao dentista.</p>
            <div className="bg-white rounded-2xl px-4">
              <div className="py-3.5 border-b border-gray-100">
                <label className="text-sm font-medium text-gray-800 block mb-1.5">Descreva o motivo</label>
                <textarea value={form.motivo_consulta} onChange={e => set('motivo_consulta', e.target.value)}
                  rows={3} placeholder="Ex: dor no dente, revisão, quero fazer uma limpeza..."
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
              <div className="py-3.5 border-b border-gray-100">
                <label className="text-sm font-medium text-gray-800 block mb-1.5">Mais detalhes sobre o problema (opcional)</label>
                <textarea value={sb.historia_doenca_atual} onChange={e => setSB('historia_doenca_atual', e.target.value)}
                  rows={2} placeholder="Como começou? Piora ou melhora com alguma coisa?"
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
              <YesNo label="Está com dor agora?" checked={form.tem_dor_atual} onChange={v => set('tem_dor_atual', v)}
                detail detailLabel="Onde dói? (Ex: dente do fundo direito...)" detailValue={form.local_dor} onDetailChange={v => set('local_dor', v)} />
              {form.tem_dor_atual && (
                <div className="py-3.5 border-b border-gray-100">
                  <label className="text-sm font-medium text-gray-800 block mb-2.5">Intensidade da dor (0 = sem dor · 10 = dor muito forte)</label>
                  <div className="flex items-center gap-3">
                    <input type="range" min={0} max={10} value={form.intensidade_dor}
                      onChange={e => set('intensidade_dor', Number(e.target.value))}
                      className="flex-1 accent-blue-600" />
                    <span className="text-2xl font-bold text-blue-600 w-10 text-center">{form.intensidade_dor}</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-gray-400 mt-1">
                    <span>Sem dor</span><span>Dor forte</span>
                  </div>
                </div>
              )}
              <TextField label="Há quanto tempo tem esse problema?" value={form.tempo_problema}
                onChange={v => set('tempo_problema', v)} placeholder="Ex: 2 semanas, 3 meses..." />
              <TextField label="Quando foi sua última consulta ao dentista?" value={form.ultima_consulta_dentista}
                onChange={v => set('ultima_consulta_dentista', v)} placeholder="Ex: há 6 meses, ano passado..." />
            </div>
          </div>
        )}

        {/* ── Passo 2: Histórico Médico ─────────────────────── */}
        {step === 1 && (
          <div>
            <h2 className="text-base font-bold text-gray-900 mb-1">Histórico médico</h2>
            <p className="text-xs text-gray-400 mb-4">Essas informações são importantes para o dentista planejar seu tratamento com segurança.</p>
            <div className="bg-white rounded-2xl px-4">
              <YesNo label="Está ou esteve recentemente em tratamento médico?" checked={form.em_tratamento_medico}
                onChange={v => set('em_tratamento_medico', v)} detail
                detailLabel="Qual tratamento / especialidade médica?" detailValue={form.detalhe_tratamento_medico}
                onDetailChange={v => set('detalhe_tratamento_medico', v)} />
              <TextField label="Nome do médico responsável (se tiver)" value={sb.medico_responsavel}
                onChange={v => setSB('medico_responsavel', v)} placeholder="Ex: Dr. João — Cardiologista" />
              <YesNo label="Toma algum medicamento?" checked={form.usa_medicamento}
                onChange={v => set('usa_medicamento', v)} detail
                detailLabel="Liste os medicamentos em uso..." detailValue={form.qual_medicamento}
                onDetailChange={v => set('qual_medicamento', v)} />
              <YesNo label="Tem alguma alergia?" checked={form.tem_alergia}
                onChange={v => set('tem_alergia', v)} detail
                detailLabel="Ex: penicilina, AAS, látex, dipirona..." detailValue={form.qual_alergia}
                onDetailChange={v => set('qual_alergia', v)} />
              <YesNo label="É sensível a metais ou ao látex?" checked={form.sensivel_metais_latex}
                onChange={v => set('sensivel_metais_latex', v)} />
              <YesNo label="Já teve que parar de usar algum remédio?" checked={form.suspendeu_remedio}
                onChange={v => set('suspendeu_remedio', v)} detail
                detailLabel="Qual remédio e por quê?" detailValue={form.detalhe_remedio_suspenso}
                onDetailChange={v => set('detalhe_remedio_suspenso', v)} />
              <YesNo label="Já realizou alguma cirurgia?" checked={form.ja_fez_cirurgia}
                onChange={v => set('ja_fez_cirurgia', v)} />
              <YesNo label="Quando se machuca, sangra muito ou cicatriza devagar?"
                checked={form.disturbio_coagulacao} onChange={v => set('disturbio_coagulacao', v)} />
              <YesNo label="Está grávida?" checked={form.gestante}
                onChange={v => set('gestante', v)} detail
                detailLabel="De quantos meses?" detailValue={form.periodo_gestacao}
                onDetailChange={v => set('periodo_gestacao', v)} />
              <TextField label="Alguma outra informação de saúde importante?" value={form.outras_informacoes_saude}
                onChange={v => set('outras_informacoes_saude', v)} rows={2}
                placeholder="Escreva aqui se quiser..." />
            </div>
          </div>
        )}

        {/* ── Passo 3: Doenças e Condições ─────────────────── */}
        {step === 2 && (
          <div>
            <h2 className="text-base font-bold text-gray-900 mb-1">Doenças e condições de saúde</h2>
            <p className="text-xs text-gray-400 mb-4">Toque para marcar todas que você tem ou já teve.</p>
            <div className="bg-white rounded-2xl p-4">
              <div className="grid grid-cols-2 gap-2 mb-4">
                {([
                  ['Hipertensão', 'hipertensao'],
                  ['Diabetes', 'diabetes'],
                  ['Problema cardíaco', 'problema_cardiaco'],
                  ['Doença renal', 'doenca_renal'],
                  ['Doença no fígado', 'doenca_hepatica'],
                  ['Anemia', 'tem_anemia'],
                  ['Asma', 'tem_asma'],
                  ['Osteoporose', 'osteoporose'],
                  ['HIV / imunossuprimido', 'hiv_imunossuprimido'],
                  ['Epilepsia / convulsões', 'tem_epilepsia'],
                  ['Desmaios / tonturas', 'desmaios_tonturas'],
                  ['Marcapasso / válvula', 'usa_marcapasso'],
                  ['Formigamento / inchaço', 'formigamento_inchazo'],
                  ['Sujeito a infecções', 'sujeito_infeccoes'],
                ] as [string, keyof FormData][]).map(([label, key]) => (
                  <CondChip key={key} label={label}
                    checked={form[key] as boolean}
                    onChange={v => set(key, v)} />
                ))}
              </div>
              <div className="border-t border-gray-100 pt-4">
                <p className="text-sm font-medium text-gray-800 mb-2.5">Como está sua pressão arterial?</p>
                <div className="grid grid-cols-2 gap-2">
                  {['Normal', 'Alta', 'Baixa', 'Não sei'].map(op => (
                    <button key={op} type="button" onClick={() => set('pressao_arterial', op.toLowerCase())}
                      className={`py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${
                        form.pressao_arterial === op.toLowerCase()
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 text-gray-400'
                      }`}>
                      {op}
                    </button>
                  ))}
                </div>
              </div>
              <div className="border-t border-gray-100 pt-3 mt-3 space-y-0">
                <YesNo label="Já teve alguma doença grave?" checked={form.doenca_grave}
                  onChange={v => set('doenca_grave', v)} detail
                  detailLabel="Qual doença?" detailValue={form.detalhe_doenca_grave}
                  onDetailChange={v => set('detalhe_doenca_grave', v)} />
                <YesNo label="Tem outras doenças que o dentista deva saber?" checked={form.tem_doenca_sistemica}
                  onChange={v => set('tem_doenca_sistemica', v)} detail
                  detailLabel="Descreva..." detailValue={form.qual_doenca}
                  onDetailChange={v => set('qual_doenca', v)} />
              </div>
            </div>
          </div>
        )}

        {/* ── Passo 4: Saúde Bucal ─────────────────────────── */}
        {step === 3 && (
          <div>
            <h2 className="text-base font-bold text-gray-900 mb-1">Saúde bucal e higiene</h2>
            <p className="text-xs text-gray-400 mb-4">Responda Sim ou Não. Quando necessário, um campo de detalhe aparecerá.</p>
            <div className="bg-white rounded-2xl px-4">
              <YesNo label="Sua gengiva fica inchada ou dolorida?" checked={sb.gengiva_inchada === 'sim'}
                onChange={v => setSB('gengiva_inchada', v ? 'sim' : 'nao')} detail
                detailLabel="Em qual região? Com que frequência?" detailValue={sb.gengiva_inchada_obs}
                onDetailChange={v => setSB('gengiva_inchada_obs', v)} />
              <YesNo label="Sua gengiva sangra quando escova os dentes?" checked={sb.gengiva_sangra === 'sim'}
                onChange={v => setSB('gengiva_sangra', v ? 'sim' : 'nao')} />
              <YesNo label="Sente dificuldade ou barulho ao abrir a boca?" checked={sb.dificuldade_boca === 'sim'}
                onChange={v => setSB('dificuldade_boca', v ? 'sim' : 'nao')} detail
                detailLabel="Ex: estalo, trava, dor ao abrir..." detailValue={sb.dificuldade_boca_obs}
                onDetailChange={v => setSB('dificuldade_boca_obs', v)} />
              <YesNo label="Sente dor na mandíbula, ouvido ou rosto?" checked={sb.dor_mandibula === 'sim'}
                onChange={v => setSB('dor_mandibula', v ? 'sim' : 'nao')} detail
                detailLabel="Onde e com que frequência?" detailValue={sb.dor_mandibula_obs}
                onDetailChange={v => setSB('dor_mandibula_obs', v)} />
              <YesNo label="Sente comida presa entre os dentes?" checked={sb.retencao_comida === 'sim'}
                onChange={v => setSB('retencao_comida', v ? 'sim' : 'nao')} />
              <YesNo label="Consegue mastigar bem os alimentos?" checked={sb.mastiga_bem === 'sim'}
                onChange={v => setSB('mastiga_bem', v ? 'sim' : 'nao')} />
              <YesNo label="Mastiga dos dois lados da boca?" checked={sb.mastiga_dois_lados === 'sim'}
                onChange={v => setSB('mastiga_dois_lados', v ? 'sim' : 'nao')} />
              <YesNo label="Já tomou anestesia local para tratamento dentário?" checked={sb.anestesia_local === 'sim'}
                onChange={v => setSB('anestesia_local', v ? 'sim' : 'nao')} detail
                detailLabel="Correu tudo bem? Teve alguma reação?" detailValue={sb.anestesia_obs}
                onDetailChange={v => setSB('anestesia_obs', v)} />

              <div className="py-3.5 border-b border-gray-100">
                <p className="text-sm font-medium text-gray-800 mb-3">Higiene bucal</p>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">Quantas vezes escova os dentes por dia?</label>
                    <input value={sb.vezes_escovacao_dia} onChange={e => setSB('vezes_escovacao_dia', e.target.value)}
                      placeholder="Ex: 3 vezes"
                      className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">Quanto tempo dura a escovação?</label>
                    <input value={sb.tempo_escovacao} onChange={e => setSB('tempo_escovacao', e.target.value)}
                      placeholder="Ex: 2 minutos"
                      className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">Usa fio dental? Quantas vezes por dia?</label>
                    <input value={sb.vezes_fio_dental} onChange={e => setSB('vezes_fio_dental', e.target.value)}
                      placeholder="Ex: 1 vez, raramente, nunca..."
                      className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
              </div>
              <YesNo label="Usa enxaguante ou antisséptico bucal?" checked={sb.antisseptico === 'sim'}
                onChange={v => setSB('antisseptico', v ? 'sim' : 'nao')} detail
                detailLabel="Qual produto? Ex: Listerine, Periogard..." detailValue={sb.antisseptico_qual}
                onDetailChange={v => setSB('antisseptico_qual', v)} />
              <TextField label="Com que frequência vai ao dentista?" value={sb.freq_dentista}
                onChange={v => setSB('freq_dentista', v)} placeholder="Ex: a cada 6 meses, 1 vez ao ano..." />
              <TextField label="Quando foi seu último tratamento odontológico?" value={sb.ultimo_tratamento}
                onChange={v => setSB('ultimo_tratamento', v)} placeholder="Ex: há 6 meses, extração em 2023..." />
            </div>
          </div>
        )}

        {/* ── Passo 5: Hábitos ──────────────────────────────── */}
        {step === 4 && (
          <div>
            <h2 className="text-base font-bold text-gray-900 mb-1">Hábitos e estilo de vida</h2>
            <p className="text-xs text-gray-400 mb-4">Esses hábitos influenciam diretamente na saúde bucal.</p>
            <div className="bg-white rounded-2xl px-4">
              <YesNo label="Fuma ou usa tabaco?" checked={form.fuma} onChange={v => set('fuma', v)} />
              <YesNo label="Consome bebidas alcoólicas?" checked={form.consome_alcool} onChange={v => set('consome_alcool', v)} />
              <YesNo label="Ingere muito doce?" checked={sb.muito_doce === 'sim'}
                onChange={v => setSB('muito_doce', v ? 'sim' : 'nao')} />
              <YesNo label="Bebe café ou líquidos escuros com frequência?" checked={sb.cafe_escuros === 'sim'}
                onChange={v => setSB('cafe_escuros', v ? 'sim' : 'nao')} detail
                detailLabel="Quantas vezes ao dia?" detailValue={sb.cafe_freq}
                onDetailChange={v => setSB('cafe_freq', v)} />
              <YesNo label="Tem hábito de mascar chiclete ou bala?" checked={sb.chiclete_bala === 'sim'}
                onChange={v => setSB('chiclete_bala', v ? 'sim' : 'nao')} detail
                detailLabel="Com que frequência?" detailValue={sb.chiclete_freq}
                onDetailChange={v => setSB('chiclete_freq', v)} />
              <YesNo label="Range os dentes (especialmente à noite)?" checked={form.bruxismo} onChange={v => set('bruxismo', v)} />
              <YesNo label="Respira bem pelo nariz?" checked={sb.respira_bem_nariz === 'sim'}
                onChange={v => setSB('respira_bem_nariz', v ? 'sim' : 'nao')} detail
                detailPlaceholder="O que dificulta? Ex: rinite, desvio de septo..." detailValue={sb.respira_obs}
                onDetailChange={v => setSB('respira_obs', v)} />
              <YesNo label="Tem medo de tratamento dentário?" checked={form.medo_tratamento}
                onChange={v => set('medo_tratamento', v)} />
              <YesNo label="Já teve sangramento após procedimento odontológico?"
                checked={form.sangramento_pos_procedimento} onChange={v => set('sangramento_pos_procedimento', v)} />
            </div>
          </div>
        )}

        {/* ── Passo 6: Confirmação ──────────────────────────── */}
        {step === 5 && (
          <div>
            <h2 className="text-base font-bold text-gray-900 mb-2">Revisar e enviar</h2>
            <p className="text-sm text-gray-500 mb-5">
              Revise suas respostas se desejar voltar nos passos anteriores, depois clique em <strong>Enviar</strong>.
            </p>
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 mb-4">
              <p className="text-sm text-blue-900 font-medium mb-1">Declaração de veracidade</p>
              <p className="text-sm text-blue-700">
                Ao enviar, confirmo que as informações prestadas são verdadeiras e estou ciente de que são sigilosas, sendo usadas exclusivamente para fins de tratamento odontológico.
              </p>
            </div>
            {errorMsg && (
              <div className="bg-red-50 border border-red-100 rounded-2xl p-4 mb-4">
                <p className="text-sm text-red-700">{errorMsg}</p>
              </div>
            )}
            <button onClick={handleSubmit} disabled={submitting}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold py-4 rounded-2xl text-base transition-colors flex items-center justify-center gap-2">
              {submitting ? (
                <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Enviando...</>
              ) : 'Enviar anamnese'}
            </button>
          </div>
        )}
      </div>

      {/* Nav bar fixa */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-3 flex gap-3 max-w-lg mx-auto left-1/2 -translate-x-1/2 w-full">
        {step > 0 && (
          <button onClick={() => setStep(s => s - 1)}
            className="flex items-center gap-1 px-5 py-3 border-2 border-gray-200 rounded-2xl text-sm font-semibold text-gray-700">
            <ChevronLeft size={18} /> Voltar
          </button>
        )}
        {step < STEPS.length - 1 && (
          <button onClick={() => setStep(s => s + 1)}
            className="flex-1 flex items-center justify-center gap-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-2xl text-sm font-semibold">
            Próximo <ChevronRight size={18} />
          </button>
        )}
      </div>
    </div>
  )
}
