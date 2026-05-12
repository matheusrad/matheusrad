'use client'
import { useState } from 'react'
import { X, Clipboard } from 'lucide-react'
import { supabase } from '@/lib/supabase'

// ── Tipos ──────────────────────────────────────────────────────
export interface SaudeBucal {
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

export interface AnamnesesFormData {
  paciente_nome: string
  // Queixa principal
  motivo_consulta: string
  tem_dor_atual: boolean
  local_dor: string
  intensidade_dor: number
  tempo_problema: string
  ultima_consulta_dentista: string
  // Questionário S/N (PDF perguntas 01–25)
  em_tratamento_medico: boolean
  detalhe_tratamento_medico: string
  usa_medicamento: boolean
  qual_medicamento: string
  gestante: boolean
  periodo_gestacao: string
  suspendeu_remedio: boolean
  detalhe_remedio_suspenso: string
  tem_alergia: boolean
  qual_alergia: string
  sensivel_metais_latex: boolean
  diabetes: boolean
  tem_anemia: boolean
  tem_asma: boolean
  hiv_imunossuprimido: boolean
  sujeito_infeccoes: boolean
  tem_epilepsia: boolean
  ja_teve_convulsoes: boolean
  desmaios_tonturas: boolean
  pressao_arterial: string
  usa_marcapasso: boolean
  articulacoes_artificiais: boolean
  usa_protese: boolean
  formigamento_inchazo: boolean
  disturbio_coagulacao: boolean
  fuma: boolean
  ja_fez_cirurgia: boolean
  doenca_grave: boolean
  detalhe_doenca_grave: string
  tem_doenca_sistemica: boolean
  qual_doenca: string
  hipertensao: boolean
  problema_cardiaco: boolean
  doenca_renal: boolean
  doenca_hepatica: boolean
  osteoporose: boolean
  outras_informacoes_saude: string
  // Saúde bucal (PDF segunda seção)
  saude_bucal: SaudeBucal
  // Hábitos adicionais
  consome_alcool: boolean
  bruxismo: boolean
  sangramento_pos_procedimento: boolean
  medo_tratamento: boolean
  // Observações
  observacoes: string
}

const EMPTY_SAUDE_BUCAL: SaudeBucal = {
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

const EMPTY: AnamnesesFormData = {
  paciente_nome: '',
  motivo_consulta: '', tem_dor_atual: false, local_dor: '', intensidade_dor: 0,
  tempo_problema: '', ultima_consulta_dentista: '',
  em_tratamento_medico: false, detalhe_tratamento_medico: '',
  usa_medicamento: false, qual_medicamento: '',
  gestante: false, periodo_gestacao: '',
  suspendeu_remedio: false, detalhe_remedio_suspenso: '',
  tem_alergia: false, qual_alergia: '',
  sensivel_metais_latex: false,
  diabetes: false, tem_anemia: false, tem_asma: false, hiv_imunossuprimido: false,
  sujeito_infeccoes: false, tem_epilepsia: false, ja_teve_convulsoes: false,
  desmaios_tonturas: false, pressao_arterial: '',
  usa_marcapasso: false, articulacoes_artificiais: false, usa_protese: false,
  formigamento_inchazo: false, disturbio_coagulacao: false, fuma: false,
  ja_fez_cirurgia: false, doenca_grave: false, detalhe_doenca_grave: '',
  tem_doenca_sistemica: false, qual_doenca: '',
  hipertensao: false, problema_cardiaco: false, doenca_renal: false,
  doenca_hepatica: false, osteoporose: false, outras_informacoes_saude: '',
  saude_bucal: EMPTY_SAUDE_BUCAL,
  consome_alcool: false, bruxismo: false, sangramento_pos_procedimento: false,
  medo_tratamento: false, observacoes: '',
}

// ── Componentes de formulário ─────────────────────────────────
function SectionTitle({ num, children }: { num?: string; children: React.ReactNode }) {
  return (
    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 mt-6 first:mt-0 flex items-center gap-2">
      {num && <span className="bg-blue-50 text-blue-600 rounded px-1.5 py-0.5 text-xs font-bold">{num}</span>}
      {children}
    </h3>
  )
}

function CheckRow({ num, label, checked, onChange, children }: {
  num?: string; label: string; checked: boolean; onChange: (v: boolean) => void; children?: React.ReactNode
}) {
  return (
    <div className="space-y-2">
      <label className="flex items-start gap-2 cursor-pointer select-none">
        <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)}
          className="w-4 h-4 mt-0.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 shrink-0" />
        <span className="text-sm text-gray-700">
          {num && <span className="text-gray-400 font-mono mr-1">{num}</span>}
          {label}
        </span>
      </label>
      {checked && children && <div className="pl-6">{children}</div>}
    </div>
  )
}

function TextInput({ label, value, onChange, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string
}) {
  return (
    <div>
      <label className="label">{label}</label>
      <input value={value} onChange={e => onChange(e.target.value)} className="input" placeholder={placeholder} />
    </div>
  )
}

function BucalYesNo({ num, label, value, onChange, showDetailOn = 'sim', detailPlaceholder, detailValue, onDetailChange }: {
  num: string; label: string; value: string; onChange: (v: string) => void
  showDetailOn?: 'sim' | 'nao'
  detailPlaceholder?: string; detailValue?: string; onDetailChange?: (v: string) => void
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs text-gray-600">
        <span className="text-gray-400 font-mono mr-1">{num}</span>{label}
      </p>
      <div className="flex gap-2">
        {(['sim', 'nao'] as const).map(opt => (
          <button key={opt} type="button" onClick={() => onChange(opt)}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border-2 transition-all ${
              value === opt
                ? opt === 'sim' ? 'border-green-500 bg-green-50 text-green-700' : 'border-red-300 bg-red-50 text-red-600'
                : 'border-gray-200 text-gray-400 hover:border-gray-300'
            }`}>
            {opt === 'sim' ? 'Sim' : 'Não'}
          </button>
        ))}
      </div>
      {detailPlaceholder && value === showDetailOn && (
        <input value={detailValue ?? ''} onChange={e => onDetailChange?.(e.target.value)}
          placeholder={detailPlaceholder}
          className="input text-xs py-1.5" />
      )}
    </div>
  )
}

function BucalText({ num, label, value, onChange, placeholder }: {
  num: string; label: string; value: string; onChange: (v: string) => void; placeholder?: string
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs text-gray-600">
        <span className="text-gray-400 font-mono mr-1">{num}</span>{label}
      </label>
      <input value={value} onChange={e => onChange(e.target.value)}
        className="input text-xs py-1.5" placeholder={placeholder ?? 'Resposta...'} />
    </div>
  )
}

// ── Props ─────────────────────────────────────────────────────
interface Props {
  pacienteId: string
  pacienteNome: string
  initial?: AnamnesesFormData & { id: string }
  onClose: () => void
  onSaved: () => void
}

export function AnamnesesModal({ pacienteId, pacienteNome, initial, onClose, onSaved }: Props) {
  const isEdit = !!initial
  const [form, setForm] = useState<AnamnesesFormData>(initial ?? { ...EMPTY, paciente_nome: pacienteNome })
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')

  function set<K extends keyof AnamnesesFormData>(key: K, value: AnamnesesFormData[K]) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  function setBucal<K extends keyof SaudeBucal>(key: K, value: string) {
    setForm(prev => ({ ...prev, saude_bucal: { ...prev.saude_bucal, [key]: value } }))
  }

  async function handleSave() {
    setSaving(true)
    setError('')
    try {
      const payload = { ...form, paciente_id: pacienteId, paciente_nome: pacienteNome }
      let err
      if (isEdit) {
        ;({ error: err } = await supabase.from('anamneses').update(payload).eq('id', initial.id))
      } else {
        ;({ error: err } = await supabase.from('anamneses').insert(payload))
      }
      if (err) throw err
      onSaved()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro ao salvar anamnese.')
    } finally {
      setSaving(false)
    }
  }

  const sb = form.saude_bucal

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-xl">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-2">
            <Clipboard size={18} className="text-blue-600" />
            <h2 className="font-semibold text-gray-900">{isEdit ? 'Editar anamnese' : 'Nova anamnese'}</h2>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-2">

          {/* 1. Queixa principal */}
          <SectionTitle>Queixa principal</SectionTitle>
          <div className="space-y-3">
            <div>
              <label className="label">Motivo da consulta</label>
              <textarea value={form.motivo_consulta} onChange={e => set('motivo_consulta', e.target.value)}
                rows={2} className="input resize-none" placeholder="Descreva o motivo..." />
            </div>
            <CheckRow label="Tem dor no momento?" checked={form.tem_dor_atual} onChange={v => set('tem_dor_atual', v)}>
              <div className="grid grid-cols-2 gap-3">
                <TextInput label="Local da dor" value={form.local_dor} onChange={v => set('local_dor', v)} placeholder="Ex: molar inferior" />
                <div>
                  <label className="label">Intensidade (0–10)</label>
                  <input type="number" min={0} max={10} value={form.intensidade_dor}
                    onChange={e => set('intensidade_dor', Number(e.target.value))} className="input" />
                </div>
              </div>
            </CheckRow>
            <div className="grid grid-cols-2 gap-3">
              <TextInput label="Há quanto tempo tem o problema?" value={form.tempo_problema} onChange={v => set('tempo_problema', v)} placeholder="Ex: 2 semanas" />
              <TextInput label="Última consulta ao dentista" value={form.ultima_consulta_dentista} onChange={v => set('ultima_consulta_dentista', v)} placeholder="Ex: há 6 meses" />
            </div>
          </div>

          {/* 2. Questionário de saúde (PDF Q01–Q25) */}
          <SectionTitle num="Q">Questionário de saúde</SectionTitle>
          <p className="text-xs text-gray-400 -mt-1 mb-3">Responda com Sim (marque) ou Não (deixe desmarcado). Em caso positivo, forneça detalhes.</p>
          <div className="space-y-3">
            <CheckRow num="01" label="Está ou esteve recentemente em tratamento médico?" checked={form.em_tratamento_medico} onChange={v => set('em_tratamento_medico', v)}>
              <TextInput label="Qual tratamento?" value={form.detalhe_tratamento_medico} onChange={v => set('detalhe_tratamento_medico', v)} />
            </CheckRow>
            <CheckRow num="02" label="Está tomando algum remédio?" checked={form.usa_medicamento} onChange={v => set('usa_medicamento', v)}>
              <TextInput label="Qual(is) remédio(s)?" value={form.qual_medicamento} onChange={v => set('qual_medicamento', v)} />
            </CheckRow>
            <CheckRow num="03" label="Está grávida?" checked={form.gestante} onChange={v => set('gestante', v)}>
              <TextInput label="De quantos meses?" value={form.periodo_gestacao} onChange={v => set('periodo_gestacao', v)} />
            </CheckRow>
            <CheckRow num="05" label="Alguma vez teve que suspender o uso de algum remédio?" checked={form.suspendeu_remedio} onChange={v => set('suspendeu_remedio', v)}>
              <TextInput label="Qual remédio e por quê?" value={form.detalhe_remedio_suspenso} onChange={v => set('detalhe_remedio_suspenso', v)} />
            </CheckRow>
            <CheckRow num="06" label="Tem alergia?" checked={form.tem_alergia} onChange={v => set('tem_alergia', v)}>
              <TextInput label="Qual(is) alergia(s)?" value={form.qual_alergia} onChange={v => set('qual_alergia', v)} placeholder="Ex: penicilina, látex..." />
            </CheckRow>
            <CheckRow num="07" label="É sensível a metais ou ao látex?" checked={form.sensivel_metais_latex} onChange={v => set('sensivel_metais_latex', v)} />

            <div className="grid grid-cols-2 gap-3 pt-1">
              <CheckRow num="08" label="É diabético?" checked={form.diabetes} onChange={v => set('diabetes', v)} />
              <CheckRow num="09" label="Tem anemia?" checked={form.tem_anemia} onChange={v => set('tem_anemia', v)} />
              <CheckRow num="10" label="Tem asma?" checked={form.tem_asma} onChange={v => set('tem_asma', v)} />
              <CheckRow num="11" label="É HIV positivo?" checked={form.hiv_imunossuprimido} onChange={v => set('hiv_imunossuprimido', v)} />
              <CheckRow num="12" label="É sujeito a infecções?" checked={form.sujeito_infeccoes} onChange={v => set('sujeito_infeccoes', v)} />
              <CheckRow num="13" label="Tem epilepsia ou ataques nervosos?" checked={form.tem_epilepsia} onChange={v => set('tem_epilepsia', v)} />
              <CheckRow num="14" label="Já teve convulsões alguma vez?" checked={form.ja_teve_convulsoes} onChange={v => set('ja_teve_convulsoes', v)} />
              <CheckRow num="15" label="Costuma desmaiar ou sentir tonturas?" checked={form.desmaios_tonturas} onChange={v => set('desmaios_tonturas', v)} />
            </div>

            <div>
              <label className="label"><span className="text-gray-400 font-mono mr-1">16</span> Pressão arterial</label>
              <div className="flex gap-3">
                {['normal', 'alta', 'baixa'].map(op => (
                  <label key={op} className="flex items-center gap-1.5 cursor-pointer">
                    <input type="radio" name="pressao" value={op} checked={form.pressao_arterial === op}
                      onChange={() => set('pressao_arterial', op)}
                      className="text-blue-600 focus:ring-blue-500" />
                    <span className="text-sm text-gray-700 capitalize">{op}</span>
                  </label>
                ))}
              </div>
            </div>

            <CheckRow num="17" label="Usa marcapasso ou válvula cardíaca artificial?" checked={form.usa_marcapasso} onChange={v => set('usa_marcapasso', v)} />
            <CheckRow num="18" label="Tem articulações artificiais ou usa prótese?" checked={form.articulacoes_artificiais} onChange={v => set('articulacoes_artificiais', v)} />
            <CheckRow num="19" label="Tem formigamento ou inchaço nas extremidades?" checked={form.formigamento_inchazo} onChange={v => set('formigamento_inchazo', v)} />
            <CheckRow num="20" label="Quando se fere, sangra muito ou demora para cicatrizar?" checked={form.disturbio_coagulacao} onChange={v => set('disturbio_coagulacao', v)} />
            <CheckRow num="21" label="Fuma ou consome qualquer variedade de tabaco?" checked={form.fuma} onChange={v => set('fuma', v)} />
            <CheckRow num="22" label="Já foi operado?" checked={form.ja_fez_cirurgia} onChange={v => set('ja_fez_cirurgia', v)} />
            <CheckRow num="23" label="Já teve alguma outra doença grave?" checked={form.doenca_grave} onChange={v => set('doenca_grave', v)}>
              <TextInput label="Qual doença?" value={form.detalhe_doenca_grave} onChange={v => set('detalhe_doenca_grave', v)} />
            </CheckRow>
            <CheckRow num="24" label="Tem problemas cardíacos, gástricos, renais, hepáticos ou outros que mereçam cuidados?" checked={form.tem_doenca_sistemica} onChange={v => set('tem_doenca_sistemica', v)}>
              <TextInput label="Quais condições?" value={form.qual_doenca} onChange={v => set('qual_doenca', v)} />
            </CheckRow>
            <div>
              <label className="label"><span className="text-gray-400 font-mono mr-1">25</span> Há alguma outra informação importante sobre sua saúde?</label>
              <textarea value={form.outras_informacoes_saude} onChange={e => set('outras_informacoes_saude', e.target.value)}
                rows={2} className="input resize-none" />
            </div>
          </div>

          {/* 3. Condições específicas */}
          <SectionTitle>Condições específicas</SectionTitle>
          <div className="grid grid-cols-2 gap-2">
            <CheckRow label="Hipertensão" checked={form.hipertensao} onChange={v => set('hipertensao', v)} />
            <CheckRow label="Problema cardíaco" checked={form.problema_cardiaco} onChange={v => set('problema_cardiaco', v)} />
            <CheckRow label="Doença renal" checked={form.doenca_renal} onChange={v => set('doenca_renal', v)} />
            <CheckRow label="Doença hepática" checked={form.doenca_hepatica} onChange={v => set('doenca_hepatica', v)} />
            <CheckRow label="Osteoporose" checked={form.osteoporose} onChange={v => set('osteoporose', v)} />
            <CheckRow label="Consome álcool" checked={form.consome_alcool} onChange={v => set('consome_alcool', v)} />
            <CheckRow label="Bruxismo (range dentes)" checked={form.bruxismo} onChange={v => set('bruxismo', v)} />
            <CheckRow label="Medo de tratamento dental" checked={form.medo_tratamento} onChange={v => set('medo_tratamento', v)} />
            <CheckRow label="Sangramento pós-procedimento" checked={form.sangramento_pos_procedimento} onChange={v => set('sangramento_pos_procedimento', v)} />
          </div>

          {/* 4. Saúde bucal (PDF segunda seção) */}
          <SectionTitle num="B">Saúde bucal e hábitos</SectionTitle>
          <div className="grid grid-cols-2 gap-3">
            <BucalYesNo num="01" label="Respira bem pelo nariz?" value={sb.respira_bem_nariz} onChange={v => setBucal('respira_bem_nariz', v)}
              showDetailOn="nao" detailPlaceholder="O que dificulta?" detailValue={sb.respira_obs} onDetailChange={v => setBucal('respira_obs', v)} />
            <BucalYesNo num="02" label="Dificuldade/barulho ao abrir a boca?" value={sb.dificuldade_boca} onChange={v => setBucal('dificuldade_boca', v)}
              detailPlaceholder="Descreva..." detailValue={sb.dificuldade_boca_obs} onDetailChange={v => setBucal('dificuldade_boca_obs', v)} />
            <BucalYesNo num="03" label="Dor na articulação da mandíbula/ouvido?" value={sb.dor_mandibula} onChange={v => setBucal('dor_mandibula', v)}
              detailPlaceholder="Onde e com que frequência?" detailValue={sb.dor_mandibula_obs} onDetailChange={v => setBucal('dor_mandibula_obs', v)} />
            <BucalYesNo num="04" label="Range os dentes?" value={sb.range_dentes} onChange={v => setBucal('range_dentes', v)} />
            <BucalYesNo num="05" label="Mastiga dos dois lados?" value={sb.mastiga_dois_lados} onChange={v => setBucal('mastiga_dois_lados', v)} />
            <BucalYesNo num="06" label="Mastiga bem os alimentos?" value={sb.mastiga_bem} onChange={v => setBucal('mastiga_bem', v)} />
            <BucalYesNo num="07" label="Retenção de comida entre dentes?" value={sb.retencao_comida} onChange={v => setBucal('retencao_comida', v)} />
            <BucalYesNo num="08" label="Hábito de mascar chiclete/bala?" value={sb.chiclete_bala} onChange={v => setBucal('chiclete_bala', v)}
              detailPlaceholder="Com que frequência?" detailValue={sb.chiclete_freq} onDetailChange={v => setBucal('chiclete_freq', v)} />
            <BucalYesNo num="09" label="Ingere muito doce?" value={sb.muito_doce} onChange={v => setBucal('muito_doce', v)} />
            <BucalYesNo num="10" label="Café/líquidos escuros frequentemente?" value={sb.cafe_escuros} onChange={v => setBucal('cafe_escuros', v)}
              detailPlaceholder="Quantas vezes ao dia?" detailValue={sb.cafe_freq} onDetailChange={v => setBucal('cafe_freq', v)} />
            <BucalYesNo num="11" label="Costuma comer fora de hora?" value={sb.come_fora_hora} onChange={v => setBucal('come_fora_hora', v)} />
            <BucalYesNo num="12" label="Escova os dentes depois de comer?" value={sb.escova_depois} onChange={v => setBucal('escova_depois', v)} />
            <BucalYesNo num="13" label="Gengiva inchada ou dolorida?" value={sb.gengiva_inchada} onChange={v => setBucal('gengiva_inchada', v)}
              detailPlaceholder="Em qual região? Frequência?" detailValue={sb.gengiva_inchada_obs} onDetailChange={v => setBucal('gengiva_inchada_obs', v)} />
            <BucalYesNo num="14" label="Gengiva sangra ao escovar?" value={sb.gengiva_sangra} onChange={v => setBucal('gengiva_sangra', v)} />
            <BucalYesNo num="15" label="Já teve instruções de higiene bucal?" value={sb.instrucoes_higiene} onChange={v => setBucal('instrucoes_higiene', v)} />
            <BucalText num="16" label="Quantas vezes escova/dia?" value={sb.vezes_escovacao_dia} onChange={v => setBucal('vezes_escovacao_dia', v)} placeholder="Ex: 3 vezes" />
            <BucalText num="17" label="Duração da escovação?" value={sb.tempo_escovacao} onChange={v => setBucal('tempo_escovacao', v)} placeholder="Ex: 2 minutos" />
            <BucalText num="18" label="Vezes que usa fio dental/dia?" value={sb.vezes_fio_dental} onChange={v => setBucal('vezes_fio_dental', v)} placeholder="Ex: 1 vez" />
            <BucalYesNo num="19" label="Usa antisséptico/enxaguante bucal?" value={sb.antisseptico} onChange={v => setBucal('antisseptico', v)}
              detailPlaceholder="Qual produto?" detailValue={sb.antisseptico_qual} onDetailChange={v => setBucal('antisseptico_qual', v)} />
            <BucalText num="20" label="Frequência ao dentista?" value={sb.freq_dentista} onChange={v => setBucal('freq_dentista', v)} placeholder="Ex: 6 em 6 meses" />
            <BucalText num="21" label="Último tratamento odontológico?" value={sb.ultimo_tratamento} onChange={v => setBucal('ultimo_tratamento', v)} placeholder="Ex: há 6 meses" />
            <BucalYesNo num="22" label="Já tomou anestesia local?" value={sb.anestesia_local} onChange={v => setBucal('anestesia_local', v)}
              detailPlaceholder="Correu bem? Alguma reação?" detailValue={sb.anestesia_obs} onDetailChange={v => setBucal('anestesia_obs', v)} />
          </div>

          {/* 5. Observações */}
          <SectionTitle>Observações da cirurgiã-dentista</SectionTitle>
          <textarea value={form.observacoes} onChange={e => set('observacoes', e.target.value)}
            rows={3} className="input resize-none w-full" placeholder="Observações clínicas adicionais..." />

          {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2 shrink-0">
          <button onClick={onClose} className="btn-secondary">Cancelar</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary">
            {saving ? 'Salvando...' : isEdit ? 'Salvar alterações' : 'Salvar anamnese'}
          </button>
        </div>
      </div>
    </div>
  )
}
