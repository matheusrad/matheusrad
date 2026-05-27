'use client'
import { useState } from 'react'
import { X, Clipboard, ChevronRight, ChevronLeft, Heart, Stethoscope, Smile, Activity, User } from 'lucide-react'
import { supabase } from '@/lib/supabase'

// ── Tipos ──────────────────────────────────────────────────────
export interface SaudeBucal {
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
  // Campos novos (armazenados aqui para evitar migração)
  historia_doenca_atual: string
  medico_responsavel: string
  historia_familiar: string
  dieta_obs: string
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
  // História Médica Pregressa
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
  // Doenças e condições
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
  // Saúde bucal
  saude_bucal: SaudeBucal
  // Hábitos
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
  historia_doenca_atual: '', medico_responsavel: '', historia_familiar: '', dieta_obs: '',
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

// ── Componentes base ──────────────────────────────────────────
function SectionTitle({ children, subtitle }: { children: React.ReactNode; subtitle?: string }) {
  return (
    <div className="mb-4">
      <h3 className="text-sm font-semibold text-gray-800">{children}</h3>
      {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
    </div>
  )
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="block text-xs font-medium text-gray-600 mb-1">{children}</label>
}

function TextInput({ label, value, onChange, placeholder, rows }: {
  label?: string; value: string; onChange: (v: string) => void; placeholder?: string; rows?: number
}) {
  return (
    <div>
      {label && <FieldLabel>{label}</FieldLabel>}
      {rows ? (
        <textarea value={value} onChange={e => onChange(e.target.value)}
          rows={rows} className="input resize-none w-full text-sm" placeholder={placeholder} />
      ) : (
        <input value={value} onChange={e => onChange(e.target.value)}
          className="input w-full text-sm" placeholder={placeholder} />
      )}
    </div>
  )
}

function YesNoRow({ label, checked, onChange, extra }: {
  label: string; checked: boolean; onChange: (v: boolean) => void; extra?: React.ReactNode
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-gray-700 flex-1 leading-tight">{label}</span>
        <div className="flex gap-1.5 shrink-0">
          {([true, false] as const).map(opt => (
            <button key={String(opt)} type="button" onClick={() => onChange(opt)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all ${
                checked === opt
                  ? opt ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-300 bg-gray-100 text-gray-600'
                  : 'border-gray-200 text-gray-400 hover:border-gray-300'
              }`}>
              {opt ? 'Sim' : 'Não'}
            </button>
          ))}
        </div>
      </div>
      {checked && extra && <div className="pl-0">{extra}</div>}
    </div>
  )
}

function ConditionChip({ label, checked, onChange }: {
  label: string; checked: boolean; onChange: (v: boolean) => void
}) {
  return (
    <button type="button" onClick={() => onChange(!checked)}
      className={`px-3 py-2 rounded-xl text-xs font-medium border-2 transition-all text-left ${
        checked ? 'border-orange-400 bg-orange-50 text-orange-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'
      }`}>
      {label}
    </button>
  )
}

// ── Abas ──────────────────────────────────────────────────────
const TABS = [
  { id: 0, label: 'Queixa',   icon: Clipboard },
  { id: 1, label: 'Hist. Médica', icon: Heart },
  { id: 2, label: 'Doenças',  icon: Activity },
  { id: 3, label: 'Odontológica', icon: Smile },
  { id: 4, label: 'Hábitos',  icon: User },
]

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
  const [tab, setTab]     = useState(0)
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')

  function set<K extends keyof AnamnesesFormData>(key: K, value: AnamnesesFormData[K]) {
    setForm(prev => ({ ...prev, [key]: value }))
  }
  function setSB<K extends keyof SaudeBucal>(key: K, value: string) {
    setForm(prev => ({ ...prev, saude_bucal: { ...prev.saude_bucal, [key]: value } }))
  }

  async function handleSave() {
    setSaving(true)
    setError('')
    try {
      const payload = { ...form, paciente_id: pacienteId, paciente_nome: pacienteNome }
      let err
      if (isEdit) {
        ;({ error: err } = await (supabase.from('anamneses') as any).update(payload).eq('id', initial.id))
      } else {
        ;({ error: err } = await (supabase.from('anamneses') as any).insert(payload))
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
            <div>
              <h2 className="font-semibold text-gray-900 text-sm">{isEdit ? 'Editar anamnese' : 'Nova anamnese'}</h2>
              <p className="text-xs text-gray-400">{pacienteNome}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 shrink-0 overflow-x-auto">
          {TABS.map(t => {
            const Icon = t.icon
            return (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium whitespace-nowrap border-b-2 transition-colors ${
                  tab === t.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}>
                <Icon size={13} />{t.label}
              </button>
            )
          })}
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-5">

          {/* ── Tab 0: Queixa Principal ─────────────────────── */}
          {tab === 0 && (
            <div className="space-y-5">
              <SectionTitle subtitle="Motivo da consulta e história da doença atual">
                Queixa Principal
              </SectionTitle>

              <TextInput label="Motivo da consulta" value={form.motivo_consulta}
                onChange={v => set('motivo_consulta', v)} rows={2}
                placeholder="Descreva o motivo em linguagem simples..." />

              <TextInput label="História da doença atual (HDA)" value={sb.historia_doenca_atual}
                onChange={v => setSB('historia_doenca_atual', v)} rows={3}
                placeholder="Início, evolução, fatores de melhora/piora, tratamentos anteriores..." />

              <YesNoRow label="Está com dor no momento?"
                checked={form.tem_dor_atual} onChange={v => set('tem_dor_atual', v)}
                extra={
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <TextInput label="Local da dor" value={form.local_dor} onChange={v => set('local_dor', v)} placeholder="Ex: molar inferior direito" />
                    <div>
                      <FieldLabel>Intensidade (0–10)</FieldLabel>
                      <div className="flex items-center gap-2">
                        <input type="range" min={0} max={10} value={form.intensidade_dor}
                          onChange={e => set('intensidade_dor', Number(e.target.value))}
                          className="flex-1 accent-blue-600" />
                        <span className="text-sm font-bold text-blue-600 w-5 text-center">{form.intensidade_dor}</span>
                      </div>
                    </div>
                  </div>
                } />

              <div className="grid grid-cols-2 gap-3">
                <TextInput label="Há quanto tempo?" value={form.tempo_problema}
                  onChange={v => set('tempo_problema', v)} placeholder="Ex: 2 semanas" />
                <TextInput label="Última consulta ao dentista" value={form.ultima_consulta_dentista}
                  onChange={v => set('ultima_consulta_dentista', v)} placeholder="Ex: há 6 meses" />
              </div>
            </div>
          )}

          {/* ── Tab 1: História Médica Pregressa ────────────── */}
          {tab === 1 && (
            <div className="space-y-4">
              <SectionTitle subtitle="Tratamentos, medicamentos, alergias e histórico cirúrgico">
                História Médica Pregressa
              </SectionTitle>

              <YesNoRow label="Está ou esteve em tratamento médico recentemente?"
                checked={form.em_tratamento_medico} onChange={v => set('em_tratamento_medico', v)}
                extra={<TextInput value={form.detalhe_tratamento_medico} onChange={v => set('detalhe_tratamento_medico', v)} placeholder="Qual tratamento / especialidade?" />} />

              <TextInput label="Médico responsável (se houver)" value={sb.medico_responsavel}
                onChange={v => setSB('medico_responsavel', v)} placeholder="Nome e especialidade do médico" />

              <YesNoRow label="Toma algum medicamento?"
                checked={form.usa_medicamento} onChange={v => set('usa_medicamento', v)}
                extra={<TextInput value={form.qual_medicamento} onChange={v => set('qual_medicamento', v)} placeholder="Liste os medicamentos em uso..." />} />

              <YesNoRow label="Tem alguma alergia?"
                checked={form.tem_alergia} onChange={v => set('tem_alergia', v)}
                extra={<TextInput value={form.qual_alergia} onChange={v => set('qual_alergia', v)} placeholder="Ex: penicilina, AAS, látex, dipirona..." />} />

              <YesNoRow label="É sensível a metais ou ao látex?"
                checked={form.sensivel_metais_latex} onChange={v => set('sensivel_metais_latex', v)} />

              <YesNoRow label="Alguma vez teve que suspender um medicamento?"
                checked={form.suspendeu_remedio} onChange={v => set('suspendeu_remedio', v)}
                extra={<TextInput value={form.detalhe_remedio_suspenso} onChange={v => set('detalhe_remedio_suspenso', v)} placeholder="Qual e por quê?" />} />

              <YesNoRow label="Já realizou alguma cirurgia / intervenção?"
                checked={form.ja_fez_cirurgia} onChange={v => set('ja_fez_cirurgia', v)} />

              <YesNoRow label="Quando se machuca, sangra muito ou cicatriza devagar?"
                checked={form.disturbio_coagulacao} onChange={v => set('disturbio_coagulacao', v)} />

              <YesNoRow label="Está grávida?"
                checked={form.gestante} onChange={v => set('gestante', v)}
                extra={<TextInput value={form.periodo_gestacao} onChange={v => set('periodo_gestacao', v)} placeholder="De quantos meses?" />} />

              <TextInput label="Dieta e alimentação (observações)" value={sb.dieta_obs}
                onChange={v => setSB('dieta_obs', v)} rows={2}
                placeholder="Restrições alimentares, dieta especial, alergias alimentares..." />

              <TextInput label="História familiar (doenças hereditárias relevantes)" value={sb.historia_familiar}
                onChange={v => setSB('historia_familiar', v)} rows={2}
                placeholder="Ex: diabetes familiar, hipertensão, câncer..." />
            </div>
          )}

          {/* ── Tab 2: Doenças e Condições ──────────────────── */}
          {tab === 2 && (
            <div className="space-y-4">
              <SectionTitle subtitle="Selecione todas que se aplicam">
                Doenças e Condições Sistêmicas
              </SectionTitle>

              <div className="grid grid-cols-2 gap-2">
                {([
                  ['Hipertensão', 'hipertensao'],
                  ['Diabetes', 'diabetes'],
                  ['Problema cardíaco', 'problema_cardiaco'],
                  ['Doença renal', 'doenca_renal'],
                  ['Doença hepática (fígado)', 'doenca_hepatica'],
                  ['Anemia', 'tem_anemia'],
                  ['Asma', 'tem_asma'],
                  ['Osteoporose', 'osteoporose'],
                  ['HIV / imunossuprimido', 'hiv_imunossuprimido'],
                  ['Epilepsia / ataques', 'tem_epilepsia'],
                  ['Sujeito a infecções', 'sujeito_infeccoes'],
                  ['Convulsões', 'ja_teve_convulsoes'],
                  ['Desmaios / tonturas', 'desmaios_tonturas'],
                  ['Marcapasso / válvula', 'usa_marcapasso'],
                  ['Articulações artificiais', 'articulacoes_artificiais'],
                  ['Formigamento / inchaço', 'formigamento_inchazo'],
                ] as [string, keyof AnamnesesFormData][]).map(([label, key]) => (
                  <ConditionChip key={key} label={label}
                    checked={form[key] as boolean}
                    onChange={v => set(key, v)} />
                ))}
              </div>

              <div>
                <FieldLabel>Pressão arterial</FieldLabel>
                <div className="flex gap-2">
                  {['normal', 'alta', 'baixa', 'não sei'].map(op => (
                    <button key={op} type="button" onClick={() => set('pressao_arterial', op)}
                      className={`flex-1 py-2 rounded-xl text-xs font-semibold border-2 transition-all capitalize ${
                        form.pressao_arterial === op ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-400'
                      }`}>
                      {op}
                    </button>
                  ))}
                </div>
              </div>

              <YesNoRow label="Já teve alguma doença grave?"
                checked={form.doenca_grave} onChange={v => set('doenca_grave', v)}
                extra={<TextInput value={form.detalhe_doenca_grave} onChange={v => set('detalhe_doenca_grave', v)} placeholder="Qual?" />} />

              <YesNoRow label="Tem outras doenças sistêmicas (cardíacas, gástricas, renais, hepáticas)?"
                checked={form.tem_doenca_sistemica} onChange={v => set('tem_doenca_sistemica', v)}
                extra={<TextInput value={form.qual_doenca} onChange={v => set('qual_doenca', v)} placeholder="Descreva as condições..." />} />

              <TextInput label="Outras informações de saúde relevantes" value={form.outras_informacoes_saude}
                onChange={v => set('outras_informacoes_saude', v)} rows={2}
                placeholder="Qualquer informação adicional que o dentista deva saber..." />
            </div>
          )}

          {/* ── Tab 3: História Odontológica ─────────────────── */}
          {tab === 3 && (
            <div className="space-y-4">
              <SectionTitle subtitle="Histórico de tratamentos e hábitos de higiene bucal">
                História Odontológica Pregressa
              </SectionTitle>

              <div className="grid grid-cols-2 gap-3">
                <TextInput label="Última visita ao dentista" value={form.ultima_consulta_dentista}
                  onChange={v => set('ultima_consulta_dentista', v)} placeholder="Ex: há 6 meses" />
                <TextInput label="Último tratamento realizado" value={sb.ultimo_tratamento}
                  onChange={v => setSB('ultimo_tratamento', v)} placeholder="Ex: extração, limpeza" />
              </div>

              <YesNoRow label="Já tomou anestesia local?"
                checked={sb.anestesia_local === 'sim'}
                onChange={v => setSB('anestesia_local', v ? 'sim' : 'nao')}
                extra={<TextInput value={sb.anestesia_obs} onChange={v => setSB('anestesia_obs', v)} placeholder="Correu bem? Alguma reação?" />} />

              <div className="border-t border-gray-100 pt-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Hábitos de higiene bucal</p>
                <div className="grid grid-cols-3 gap-3">
                  <TextInput label="Escovações por dia" value={sb.vezes_escovacao_dia}
                    onChange={v => setSB('vezes_escovacao_dia', v)} placeholder="Ex: 3x" />
                  <TextInput label="Duração da escovação" value={sb.tempo_escovacao}
                    onChange={v => setSB('tempo_escovacao', v)} placeholder="Ex: 2 min" />
                  <TextInput label="Fio dental por dia" value={sb.vezes_fio_dental}
                    onChange={v => setSB('vezes_fio_dental', v)} placeholder="Ex: 1x" />
                </div>
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <YesNoRow label="Usa enxaguante/antisséptico?"
                    checked={sb.antisseptico === 'sim'}
                    onChange={v => setSB('antisseptico', v ? 'sim' : 'nao')}
                    extra={<TextInput value={sb.antisseptico_qual} onChange={v => setSB('antisseptico_qual', v)} placeholder="Qual produto?" />} />
                  <TextInput label="Frequência ao dentista" value={sb.freq_dentista}
                    onChange={v => setSB('freq_dentista', v)} placeholder="Ex: a cada 6 meses" />
                </div>
              </div>

              <div className="border-t border-gray-100 pt-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Condições bucais</p>
                <div className="space-y-3">
                  <YesNoRow label="Gengiva inchada ou dolorida?"
                    checked={sb.gengiva_inchada === 'sim'}
                    onChange={v => setSB('gengiva_inchada', v ? 'sim' : 'nao')}
                    extra={<TextInput value={sb.gengiva_inchada_obs} onChange={v => setSB('gengiva_inchada_obs', v)} placeholder="Região e frequência..." />} />
                  <YesNoRow label="Gengiva sangra ao escovar?"
                    checked={sb.gengiva_sangra === 'sim'}
                    onChange={v => setSB('gengiva_sangra', v ? 'sim' : 'nao')} />
                  <YesNoRow label="Dificuldade ou barulho ao abrir a boca?"
                    checked={sb.dificuldade_boca === 'sim'}
                    onChange={v => setSB('dificuldade_boca', v ? 'sim' : 'nao')}
                    extra={<TextInput value={sb.dificuldade_boca_obs} onChange={v => setSB('dificuldade_boca_obs', v)} placeholder="Descreva..." />} />
                  <YesNoRow label="Dor na articulação da mandíbula ou ouvido?"
                    checked={sb.dor_mandibula === 'sim'}
                    onChange={v => setSB('dor_mandibula', v ? 'sim' : 'nao')}
                    extra={<TextInput value={sb.dor_mandibula_obs} onChange={v => setSB('dor_mandibula_obs', v)} placeholder="Onde e com que frequência?" />} />
                  <YesNoRow label="Retenção de comida entre os dentes?"
                    checked={sb.retencao_comida === 'sim'}
                    onChange={v => setSB('retencao_comida', v ? 'sim' : 'nao')} />
                  <YesNoRow label="Mastiga dos dois lados da boca?"
                    checked={sb.mastiga_dois_lados === 'sim'}
                    onChange={v => setSB('mastiga_dois_lados', v ? 'sim' : 'nao')} />
                </div>
              </div>
            </div>
          )}

          {/* ── Tab 4: Hábitos e Estilo de Vida ──────────────── */}
          {tab === 4 && (
            <div className="space-y-4">
              <SectionTitle subtitle="Hábitos que influenciam a saúde bucal">
                Hábitos e Estilo de Vida
              </SectionTitle>

              <div className="space-y-3">
                <YesNoRow label="Fuma ou usa tabaco?"
                  checked={form.fuma} onChange={v => set('fuma', v)} />
                <YesNoRow label="Consome bebidas alcoólicas?"
                  checked={form.consome_alcool} onChange={v => set('consome_alcool', v)} />
                <YesNoRow label="Range os dentes (bruxismo)?"
                  checked={form.bruxismo} onChange={v => set('bruxismo', v)} />
                <YesNoRow label="Tem medo de tratamento dentário?"
                  checked={form.medo_tratamento} onChange={v => set('medo_tratamento', v)} />
                <YesNoRow label="Já teve sangramento após procedimento odontológico?"
                  checked={form.sangramento_pos_procedimento} onChange={v => set('sangramento_pos_procedimento', v)} />
                <YesNoRow label="Respira bem pelo nariz?"
                  checked={sb.respira_bem_nariz === 'sim'}
                  onChange={v => setSB('respira_bem_nariz', v ? 'sim' : 'nao')}
                  extra={<TextInput value={sb.respira_obs} onChange={v => setSB('respira_obs', v)} placeholder="O que dificulta?" />} />
                <YesNoRow label="Ingere muito doce?"
                  checked={sb.muito_doce === 'sim'}
                  onChange={v => setSB('muito_doce', v ? 'sim' : 'nao')} />
                <YesNoRow label="Bebe café ou líquidos escuros com frequência?"
                  checked={sb.cafe_escuros === 'sim'}
                  onChange={v => setSB('cafe_escuros', v ? 'sim' : 'nao')}
                  extra={<TextInput value={sb.cafe_freq} onChange={v => setSB('cafe_freq', v)} placeholder="Quantas vezes ao dia?" />} />
                <YesNoRow label="Hábito de mascar chiclete ou bala?"
                  checked={sb.chiclete_bala === 'sim'}
                  onChange={v => setSB('chiclete_bala', v ? 'sim' : 'nao')}
                  extra={<TextInput value={sb.chiclete_freq} onChange={v => setSB('chiclete_freq', v)} placeholder="Com que frequência?" />} />
                <YesNoRow label="Range os dentes à noite?"
                  checked={sb.range_dentes === 'sim'}
                  onChange={v => setSB('range_dentes', v ? 'sim' : 'nao')} />
              </div>

              <div className="border-t border-gray-100 pt-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Observações da cirurgiã-dentista</p>
                <TextInput value={form.observacoes} onChange={v => set('observacoes', v)} rows={3}
                  placeholder="Observações clínicas, notas para prontuário..." />
              </div>

              {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between gap-2 shrink-0">
          <div className="flex gap-1">
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`w-2 h-2 rounded-full transition-colors ${tab === t.id ? 'bg-blue-600' : 'bg-gray-200'}`} />
            ))}
          </div>
          <div className="flex gap-2">
            {tab > 0 && (
              <button onClick={() => setTab(t => t - 1)} className="btn-secondary flex items-center gap-1">
                <ChevronLeft size={14} /> Anterior
              </button>
            )}
            {tab < TABS.length - 1 ? (
              <button onClick={() => setTab(t => t + 1)} className="btn-primary flex items-center gap-1">
                Próximo <ChevronRight size={14} />
              </button>
            ) : (
              <>
                <button onClick={onClose} className="btn-secondary">Cancelar</button>
                <button onClick={handleSave} disabled={saving} className="btn-primary">
                  {saving ? 'Salvando...' : isEdit ? 'Salvar alterações' : 'Salvar anamnese'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
