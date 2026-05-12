'use client'
import { useEffect, useState } from 'react'
import { Stethoscope, CheckCircle2, AlertCircle, ChevronRight, ChevronLeft } from 'lucide-react'

// ── Tipos ──────────────────────────────────────────────────────
interface SaudeBucal {
  // Sim/Não (Q01-Q15, Q19, Q22)
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
  // Texto/quantitativo (Q16-Q18, Q20-Q21)
  vezes_escovacao_dia: string
  tempo_escovacao: string
  vezes_fio_dental: string
  freq_dentista: string
  ultimo_tratamento: string
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
    <div className="py-3 border-b border-gray-100 last:border-0">
      <p className="text-sm font-medium text-gray-800 mb-2">{label}</p>
      <div className="flex gap-3">
        {[true, false].map(opt => (
          <button key={String(opt)} type="button"
            onClick={() => onChange(opt)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${
              checked === opt
                ? opt ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-300 bg-gray-50 text-gray-600'
                : 'border-gray-200 text-gray-400'
            }`}>
            {opt ? 'Sim' : 'Não'}
          </button>
        ))}
      </div>
      {detail && checked && detailLabel && (
        <input value={detailValue ?? ''} onChange={e => onDetailChange?.(e.target.value)}
          placeholder={detailLabel}
          className="mt-2 w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      )}
    </div>
  )
}

function TextField({ label, value, onChange, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string
}) {
  return (
    <div className="py-3 border-b border-gray-100 last:border-0">
      <label className="text-sm font-medium text-gray-800 block mb-1.5">{label}</label>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder ?? ''}
        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
    </div>
  )
}

// Sim/Não baseado em string ('sim'|'nao') — para saúde bucal
function StrYesNo({ label, value, onChange, showDetailOn = 'sim', detailPlaceholder, detailValue, onDetailChange }: {
  label: string; value: string; onChange: (v: string) => void
  showDetailOn?: 'sim' | 'nao'
  detailPlaceholder?: string; detailValue?: string; onDetailChange?: (v: string) => void
}) {
  return (
    <div className="py-3 border-b border-gray-100 last:border-0">
      <p className="text-sm font-medium text-gray-800 mb-2">{label}</p>
      <div className="flex gap-3">
        {(['sim', 'nao'] as const).map(opt => (
          <button key={opt} type="button" onClick={() => onChange(opt)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${
              value === opt
                ? opt === 'sim' ? 'border-green-500 bg-green-50 text-green-700' : 'border-red-300 bg-red-50 text-red-600'
                : 'border-gray-200 text-gray-400'
            }`}>
            {opt === 'sim' ? 'Sim' : 'Não'}
          </button>
        ))}
      </div>
      {detailPlaceholder && value === showDetailOn && (
        <textarea value={detailValue ?? ''} onChange={e => onDetailChange?.(e.target.value)}
          placeholder={detailPlaceholder} rows={2}
          className="mt-2 w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
      )}
    </div>
  )
}

// ── Passos do formulário ───────────────────────────────────────
const STEPS = ['Queixa', 'Saúde geral', 'Condições', 'Saúde bucal', 'Confirmar']

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

  // ── Telas de estado ──────────────────────────────────────────
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
        <CheckCircle2 size={56} className="text-green-500 mx-auto mb-4" />
        <h1 className="text-lg font-semibold text-gray-900 mb-2">Anamnese enviada!</h1>
        <p className="text-sm text-gray-500">Suas informações foram recebidas com sucesso. Até breve na consulta!</p>
      </div>
    </div>
  )

  const sb = form.saude_bucal

  // ── Formulário por passos ────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shrink-0">
            <Stethoscope size={16} className="text-white" />
          </div>
          <div>
            <p className="text-xs text-gray-400">Ficha de Anamnese</p>
            <p className="text-sm font-semibold text-gray-900">{pacienteNome}</p>
          </div>
        </div>
        {/* Progress bar */}
        <div className="flex gap-1">
          {STEPS.map((s, i) => (
            <div key={s} className={`h-1 flex-1 rounded-full transition-colors ${i <= step ? 'bg-blue-600' : 'bg-gray-200'}`} />
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-1.5">{STEPS[step]} · Passo {step + 1} de {STEPS.length}</p>
      </div>

      {/* Body */}
      <div className="px-4 py-4 max-w-lg mx-auto pb-32">

        {/* Passo 1: Queixa principal */}
        {step === 0 && (
          <div>
            <h2 className="text-base font-semibold text-gray-900 mb-4">Qual é o motivo da sua consulta?</h2>
            <div className="bg-white rounded-2xl px-4">
              <div className="py-3 border-b border-gray-100">
                <label className="text-sm font-medium text-gray-800 block mb-1.5">Descreva o motivo</label>
                <textarea value={form.motivo_consulta} onChange={e => set('motivo_consulta', e.target.value)}
                  rows={3} placeholder="Ex: dor no dente, revisão, limpeza..."
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
              <YesNo label="Está com dor no momento?" checked={form.tem_dor_atual} onChange={v => set('tem_dor_atual', v)}
                detail detailLabel="Onde dói? (Ex: dente do fundo, direito...)" detailValue={form.local_dor} onDetailChange={v => set('local_dor', v)} />
              {form.tem_dor_atual && (
                <div className="py-3 border-b border-gray-100">
                  <label className="text-sm font-medium text-gray-800 block mb-2">Intensidade da dor (0 = sem dor · 10 = dor forte)</label>
                  <div className="flex items-center gap-3">
                    <input type="range" min={0} max={10} value={form.intensidade_dor}
                      onChange={e => set('intensidade_dor', Number(e.target.value))}
                      className="flex-1 accent-blue-600" />
                    <span className="text-xl font-bold text-blue-600 w-8 text-center">{form.intensidade_dor}</span>
                  </div>
                </div>
              )}
              <TextField label="Há quanto tempo tem esse problema?" value={form.tempo_problema} onChange={v => set('tempo_problema', v)} placeholder="Ex: 2 semanas, 3 meses..." />
              <TextField label="Quando foi sua última consulta ao dentista?" value={form.ultima_consulta_dentista} onChange={v => set('ultima_consulta_dentista', v)} placeholder="Ex: há 6 meses, ano passado..." />
            </div>
          </div>
        )}

        {/* Passo 2: Saúde geral */}
        {step === 1 && (
          <div>
            <h2 className="text-base font-semibold text-gray-900 mb-1">Questionário de saúde</h2>
            <p className="text-xs text-gray-400 mb-4">Responda com sinceridade. As informações são confidenciais.</p>
            <div className="bg-white rounded-2xl px-4">
              <YesNo label="01 · Está ou esteve recentemente em tratamento médico?" checked={form.em_tratamento_medico} onChange={v => set('em_tratamento_medico', v)}
                detail detailLabel="Qual tratamento?" detailValue={form.detalhe_tratamento_medico} onDetailChange={v => set('detalhe_tratamento_medico', v)} />
              <YesNo label="02 · Está tomando algum remédio?" checked={form.usa_medicamento} onChange={v => set('usa_medicamento', v)}
                detail detailLabel="Qual(is) remédio(s)?" detailValue={form.qual_medicamento} onDetailChange={v => set('qual_medicamento', v)} />
              <YesNo label="03 · Está grávida?" checked={form.gestante} onChange={v => set('gestante', v)}
                detail detailLabel="De quantos meses?" detailValue={form.periodo_gestacao} onDetailChange={v => set('periodo_gestacao', v)} />
              <YesNo label="05 · Alguma vez teve que parar de usar algum remédio?" checked={form.suspendeu_remedio} onChange={v => set('suspendeu_remedio', v)}
                detail detailLabel="Qual e por quê?" detailValue={form.detalhe_remedio_suspenso} onDetailChange={v => set('detalhe_remedio_suspenso', v)} />
              <YesNo label="06 · Tem alergia?" checked={form.tem_alergia} onChange={v => set('tem_alergia', v)}
                detail detailLabel="Qual(is)? Ex: penicilina, látex..." detailValue={form.qual_alergia} onDetailChange={v => set('qual_alergia', v)} />
              <YesNo label="07 · É sensível a metais ou ao látex?" checked={form.sensivel_metais_latex} onChange={v => set('sensivel_metais_latex', v)} />
              <YesNo label="08 · É diabético?" checked={form.diabetes} onChange={v => set('diabetes', v)} />
              <YesNo label="09 · Tem anemia?" checked={form.tem_anemia} onChange={v => set('tem_anemia', v)} />
              <YesNo label="10 · Tem asma?" checked={form.tem_asma} onChange={v => set('tem_asma', v)} />
              <YesNo label="11 · É HIV positivo?" checked={form.hiv_imunossuprimido} onChange={v => set('hiv_imunossuprimido', v)} />
              <YesNo label="12 · É sujeito a infecções com frequência?" checked={form.sujeito_infeccoes} onChange={v => set('sujeito_infeccoes', v)} />
              <YesNo label="13 · Tem epilepsia ou ataques nervosos?" checked={form.tem_epilepsia} onChange={v => set('tem_epilepsia', v)} />
              <YesNo label="14 · Já teve convulsões alguma vez?" checked={form.ja_teve_convulsoes} onChange={v => set('ja_teve_convulsoes', v)} />
              <YesNo label="15 · Costuma desmaiar ou sentir tonturas com frequência?" checked={form.desmaios_tonturas} onChange={v => set('desmaios_tonturas', v)} />
              <div className="py-3 border-b border-gray-100">
                <p className="text-sm font-medium text-gray-800 mb-2">16 · Pressão arterial</p>
                <div className="flex gap-2">
                  {['normal', 'alta', 'baixa', 'não sei'].map(op => (
                    <button key={op} type="button" onClick={() => set('pressao_arterial', op)}
                      className={`flex-1 py-2 rounded-xl text-xs font-semibold border-2 transition-all capitalize ${form.pressao_arterial === op ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-400'}`}>
                      {op}
                    </button>
                  ))}
                </div>
              </div>
              <YesNo label="17 · Usa marcapasso ou válvula cardíaca artificial?" checked={form.usa_marcapasso} onChange={v => set('usa_marcapasso', v)} />
              <YesNo label="18 · Tem articulações artificiais ou usa prótese?" checked={form.articulacoes_artificiais} onChange={v => set('articulacoes_artificiais', v)} />
              <YesNo label="19 · Tem formigamento ou inchaço nas extremidades?" checked={form.formigamento_inchazo} onChange={v => set('formigamento_inchazo', v)} />
              <YesNo label="20 · Quando se fere, sangra muito ou demora para cicatrizar?" checked={form.disturbio_coagulacao} onChange={v => set('disturbio_coagulacao', v)} />
              <YesNo label="21 · Fuma ou consome tabaco?" checked={form.fuma} onChange={v => set('fuma', v)} />
              <YesNo label="22 · Já foi operado?" checked={form.ja_fez_cirurgia} onChange={v => set('ja_fez_cirurgia', v)} />
              <YesNo label="23 · Já teve alguma outra doença grave?" checked={form.doenca_grave} onChange={v => set('doenca_grave', v)}
                detail detailLabel="Qual doença?" detailValue={form.detalhe_doenca_grave} onDetailChange={v => set('detalhe_doenca_grave', v)} />
              <YesNo label="24 · Tem problemas cardíacos, gástricos, renais ou hepáticos?" checked={form.tem_doenca_sistemica} onChange={v => set('tem_doenca_sistemica', v)}
                detail detailLabel="Quais condições?" detailValue={form.qual_doenca} onDetailChange={v => set('qual_doenca', v)} />
              <div className="py-3">
                <label className="text-sm font-medium text-gray-800 block mb-1.5">25 · Há alguma outra informação importante sobre sua saúde?</label>
                <textarea value={form.outras_informacoes_saude} onChange={e => set('outras_informacoes_saude', e.target.value)}
                  rows={2} placeholder="Escreva aqui se quiser..."
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
            </div>
          </div>
        )}

        {/* Passo 3: Condições específicas */}
        {step === 2 && (
          <div>
            <h2 className="text-base font-semibold text-gray-900 mb-4">Condições de saúde específicas</h2>
            <div className="bg-white rounded-2xl px-4">
              <YesNo label="Hipertensão (pressão alta)?" checked={form.hipertensao} onChange={v => set('hipertensao', v)} />
              <YesNo label="Problema cardíaco?" checked={form.problema_cardiaco} onChange={v => set('problema_cardiaco', v)} />
              <YesNo label="Doença renal (rim)?" checked={form.doenca_renal} onChange={v => set('doenca_renal', v)} />
              <YesNo label="Doença hepática (fígado)?" checked={form.doenca_hepatica} onChange={v => set('doenca_hepatica', v)} />
              <YesNo label="Osteoporose?" checked={form.osteoporose} onChange={v => set('osteoporose', v)} />
              <YesNo label="Consome bebidas alcoólicas?" checked={form.consome_alcool} onChange={v => set('consome_alcool', v)} />
              <YesNo label="Range os dentes (bruxismo)?" checked={form.bruxismo} onChange={v => set('bruxismo', v)} />
              <YesNo label="Tem medo de tratamento dentário?" checked={form.medo_tratamento} onChange={v => set('medo_tratamento', v)} />
              <YesNo label="Já teve sangramento após algum procedimento odontológico?" checked={form.sangramento_pos_procedimento} onChange={v => set('sangramento_pos_procedimento', v)} />
            </div>
          </div>
        )}

        {/* Passo 4: Saúde bucal */}
        {step === 3 && (
          <div>
            <h2 className="text-base font-semibold text-gray-900 mb-1">Saúde bucal e hábitos</h2>
            <p className="text-xs text-gray-400 mb-4">Toque em Sim ou Não. Quando necessário, um campo de detalhe aparecerá.</p>
            <div className="bg-white rounded-2xl px-4">
              <StrYesNo label="01 · Respira bem pelo nariz?" value={sb.respira_bem_nariz} onChange={v => setSB('respira_bem_nariz', v)}
                showDetailOn="nao" detailPlaceholder="O que dificulta? Ex: desvio de septo, rinite..." detailValue={sb.respira_obs} onDetailChange={v => setSB('respira_obs', v)} />
              <StrYesNo label="02 · Sente dificuldade ou barulho ao abrir a boca?" value={sb.dificuldade_boca} onChange={v => setSB('dificuldade_boca', v)}
                detailPlaceholder="Descreva: Ex: estalo, trava, dor ao abrir..." detailValue={sb.dificuldade_boca_obs} onDetailChange={v => setSB('dificuldade_boca_obs', v)} />
              <StrYesNo label="03 · Sente dores na articulação da mandíbula, ouvido ou rosto?" value={sb.dor_mandibula} onChange={v => setSB('dor_mandibula', v)}
                detailPlaceholder="Onde e com que frequência?" detailValue={sb.dor_mandibula_obs} onDetailChange={v => setSB('dor_mandibula_obs', v)} />
              <StrYesNo label="04 · Range os dentes (especialmente à noite)?" value={sb.range_dentes} onChange={v => setSB('range_dentes', v)} />
              <StrYesNo label="05 · Mastiga dos dois lados da boca?" value={sb.mastiga_dois_lados} onChange={v => setSB('mastiga_dois_lados', v)} />
              <StrYesNo label="06 · Consegue mastigar bem os alimentos?" value={sb.mastiga_bem} onChange={v => setSB('mastiga_bem', v)} />
              <StrYesNo label="07 · Sente comida ficando presa entre os dentes?" value={sb.retencao_comida} onChange={v => setSB('retencao_comida', v)} />
              <StrYesNo label="08 · Tem hábito de mascar chiclete ou bala?" value={sb.chiclete_bala} onChange={v => setSB('chiclete_bala', v)}
                detailPlaceholder="Com que frequência? Ex: todos os dias, às vezes..." detailValue={sb.chiclete_freq} onDetailChange={v => setSB('chiclete_freq', v)} />
              <StrYesNo label="09 · Come muito doce?" value={sb.muito_doce} onChange={v => setSB('muito_doce', v)} />
              <StrYesNo label="10 · Bebe café ou líquidos escuros com muita frequência?" value={sb.cafe_escuros} onChange={v => setSB('cafe_escuros', v)}
                detailPlaceholder="Quantas vezes ao dia? Ex: 3 cafés, 2 sucos..." detailValue={sb.cafe_freq} onDetailChange={v => setSB('cafe_freq', v)} />
              <StrYesNo label="11 · Costuma comer fora de hora?" value={sb.come_fora_hora} onChange={v => setSB('come_fora_hora', v)} />
              <StrYesNo label="12 · Escova os dentes depois de comer?" value={sb.escova_depois} onChange={v => setSB('escova_depois', v)} />
              <StrYesNo label="13 · Sua gengiva fica inchada ou dolorida?" value={sb.gengiva_inchada} onChange={v => setSB('gengiva_inchada', v)}
                detailPlaceholder="Em qual região? Com que frequência?" detailValue={sb.gengiva_inchada_obs} onDetailChange={v => setSB('gengiva_inchada_obs', v)} />
              <StrYesNo label="14 · Sua gengiva sangra quando escova os dentes?" value={sb.gengiva_sangra} onChange={v => setSB('gengiva_sangra', v)} />
              <StrYesNo label="15 · Já recebeu instruções de higiene bucal?" value={sb.instrucoes_higiene} onChange={v => setSB('instrucoes_higiene', v)} />

              <TextField label="16 · Quantas vezes escova os dentes por dia?" value={sb.vezes_escovacao_dia} onChange={v => setSB('vezes_escovacao_dia', v)} placeholder="Ex: 3 vezes" />
              <TextField label="17 · Quanto tempo dura cada escovação?" value={sb.tempo_escovacao} onChange={v => setSB('tempo_escovacao', v)} placeholder="Ex: 2 minutos" />
              <TextField label="18 · Quantas vezes usa fio dental por dia?" value={sb.vezes_fio_dental} onChange={v => setSB('vezes_fio_dental', v)} placeholder="Ex: 1 vez, raramente..." />

              <StrYesNo label="19 · Usa enxaguante ou antisséptico bucal?" value={sb.antisseptico} onChange={v => setSB('antisseptico', v)}
                detailPlaceholder="Qual produto? Ex: Listerine, Periogard..." detailValue={sb.antisseptico_qual} onDetailChange={v => setSB('antisseptico_qual', v)} />

              <TextField label="20 · Com que frequência vai ao dentista?" value={sb.freq_dentista} onChange={v => setSB('freq_dentista', v)} placeholder="Ex: a cada 6 meses, 1 vez ao ano..." />
              <TextField label="21 · Quando foi seu último tratamento odontológico?" value={sb.ultimo_tratamento} onChange={v => setSB('ultimo_tratamento', v)} placeholder="Ex: há 6 meses, em 2023..." />

              <StrYesNo label="22 · Já tomou anestesia local para tratamento dentário?" value={sb.anestesia_local} onChange={v => setSB('anestesia_local', v)}
                detailPlaceholder="Correu tudo bem? Teve alguma reação?" detailValue={sb.anestesia_obs} onDetailChange={v => setSB('anestesia_obs', v)} />
            </div>
          </div>
        )}

        {/* Passo 5: Confirmação */}
        {step === 4 && (
          <div>
            <h2 className="text-base font-semibold text-gray-900 mb-2">Confirmar e enviar</h2>
            <p className="text-sm text-gray-500 mb-4">
              Revise se desejar e clique em <strong>Enviar anamnese</strong> quando estiver pronto.
            </p>
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 mb-4">
              <p className="text-sm text-blue-800">
                Ao enviar, confirmo que as informações prestadas são verdadeiras e estou ciente de que são confidenciais.
              </p>
            </div>
            {errorMsg && (
              <div className="bg-red-50 border border-red-100 rounded-2xl p-4 mb-4">
                <p className="text-sm text-red-700">{errorMsg}</p>
              </div>
            )}
            <button onClick={handleSubmit} disabled={submitting}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold py-4 rounded-2xl text-base transition-colors">
              {submitting ? 'Enviando...' : 'Enviar anamnese'}
            </button>
          </div>
        )}
      </div>

      {/* Nav bar fixa */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-3 flex gap-3 max-w-lg mx-auto">
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
