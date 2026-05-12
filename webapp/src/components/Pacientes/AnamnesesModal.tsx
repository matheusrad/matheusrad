'use client'
import { useState } from 'react'
import { X, Clipboard } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export interface AnamnesesFormData {
  paciente_nome: string
  motivo_consulta: string
  tem_dor_atual: boolean
  local_dor: string
  intensidade_dor: number
  tempo_problema: string
  ultima_consulta_dentista: string
  usa_medicamento: boolean
  qual_medicamento: string
  tem_alergia: boolean
  qual_alergia: string
  tem_doenca_sistemica: boolean
  qual_doenca: string
  hipertensao: boolean
  diabetes: boolean
  problema_cardiaco: boolean
  doenca_renal: boolean
  doenca_hepatica: boolean
  disturbio_coagulacao: boolean
  osteoporose: boolean
  hiv_imunossuprimido: boolean
  gestante: boolean
  periodo_gestacao: string
  fuma: boolean
  consome_alcool: boolean
  bruxismo: boolean
  ja_fez_cirurgia: boolean
  sangramento_pos_procedimento: boolean
  medo_tratamento: boolean
  usa_protese: boolean
  observacoes: string
}

const EMPTY: AnamnesesFormData = {
  paciente_nome: '',
  motivo_consulta: '',
  tem_dor_atual: false,
  local_dor: '',
  intensidade_dor: 0,
  tempo_problema: '',
  ultima_consulta_dentista: '',
  usa_medicamento: false,
  qual_medicamento: '',
  tem_alergia: false,
  qual_alergia: '',
  tem_doenca_sistemica: false,
  qual_doenca: '',
  hipertensao: false,
  diabetes: false,
  problema_cardiaco: false,
  doenca_renal: false,
  doenca_hepatica: false,
  disturbio_coagulacao: false,
  osteoporose: false,
  hiv_imunossuprimido: false,
  gestante: false,
  periodo_gestacao: '',
  fuma: false,
  consome_alcool: false,
  bruxismo: false,
  ja_fez_cirurgia: false,
  sangramento_pos_procedimento: false,
  medo_tratamento: false,
  usa_protese: false,
  observacoes: '',
}

interface Props {
  pacienteId: string
  pacienteNome: string
  initial?: AnamnesesFormData & { id: string }
  onClose: () => void
  onSaved: () => void
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 mt-6 first:mt-0">{children}</h3>
}

function CheckField({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer select-none">
      <input
        type="checkbox"
        checked={checked}
        onChange={e => onChange(e.target.checked)}
        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
      />
      <span className="text-sm text-gray-700">{label}</span>
    </label>
  )
}

export function AnamnesesModal({ pacienteId, pacienteNome, initial, onClose, onSaved }: Props) {
  const isEdit = !!initial
  const [form, setForm] = useState<AnamnesesFormData>(initial ?? { ...EMPTY, paciente_nome: pacienteNome })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function set<K extends keyof AnamnesesFormData>(key: K, value: AnamnesesFormData[K]) {
    setForm(prev => ({ ...prev, [key]: value }))
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
        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-1">

          {/* Queixa principal */}
          <SectionTitle>Queixa principal</SectionTitle>
          <div className="space-y-3">
            <div>
              <label className="label">Motivo da consulta</label>
              <textarea value={form.motivo_consulta} onChange={e => set('motivo_consulta', e.target.value)}
                rows={2} className="input resize-none" placeholder="Descreva o motivo da consulta..." />
            </div>
            <CheckField label="Tem dor no momento?" checked={form.tem_dor_atual} onChange={v => set('tem_dor_atual', v)} />
            {form.tem_dor_atual && (
              <div className="grid grid-cols-2 gap-3 pl-6">
                <div>
                  <label className="label">Local da dor</label>
                  <input value={form.local_dor} onChange={e => set('local_dor', e.target.value)} className="input" placeholder="Ex: molar inferior direito" />
                </div>
                <div>
                  <label className="label">Intensidade (0–10)</label>
                  <input type="number" min={0} max={10} value={form.intensidade_dor}
                    onChange={e => set('intensidade_dor', Number(e.target.value))} className="input" />
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Há quanto tempo tem o problema?</label>
                <input value={form.tempo_problema} onChange={e => set('tempo_problema', e.target.value)} className="input" placeholder="Ex: 2 semanas" />
              </div>
              <div>
                <label className="label">Última consulta ao dentista</label>
                <input value={form.ultima_consulta_dentista} onChange={e => set('ultima_consulta_dentista', e.target.value)} className="input" placeholder="Ex: há 6 meses" />
              </div>
            </div>
          </div>

          {/* Saúde geral */}
          <SectionTitle>Saúde geral</SectionTitle>
          <div className="space-y-3">
            <CheckField label="Usa medicamento regularmente?" checked={form.usa_medicamento} onChange={v => set('usa_medicamento', v)} />
            {form.usa_medicamento && (
              <div className="pl-6">
                <label className="label">Qual(is) medicamento(s)?</label>
                <input value={form.qual_medicamento} onChange={e => set('qual_medicamento', e.target.value)} className="input" placeholder="Nome e dosagem" />
              </div>
            )}
            <CheckField label="Tem alergia?" checked={form.tem_alergia} onChange={v => set('tem_alergia', v)} />
            {form.tem_alergia && (
              <div className="pl-6">
                <label className="label">Qual(is) alergia(s)?</label>
                <input value={form.qual_alergia} onChange={e => set('qual_alergia', e.target.value)} className="input" placeholder="Ex: penicilina, látex..." />
              </div>
            )}
            <CheckField label="Tem doença sistêmica?" checked={form.tem_doenca_sistemica} onChange={v => set('tem_doenca_sistemica', v)} />
            {form.tem_doenca_sistemica && (
              <div className="pl-6">
                <label className="label">Qual(is) doença(s)?</label>
                <input value={form.qual_doenca} onChange={e => set('qual_doenca', e.target.value)} className="input" placeholder="Descreva as condições" />
              </div>
            )}
          </div>

          {/* Condições específicas */}
          <SectionTitle>Condições específicas</SectionTitle>
          <div className="grid grid-cols-2 gap-2">
            <CheckField label="Hipertensão" checked={form.hipertensao} onChange={v => set('hipertensao', v)} />
            <CheckField label="Diabetes" checked={form.diabetes} onChange={v => set('diabetes', v)} />
            <CheckField label="Problema cardíaco" checked={form.problema_cardiaco} onChange={v => set('problema_cardiaco', v)} />
            <CheckField label="Doença renal" checked={form.doenca_renal} onChange={v => set('doenca_renal', v)} />
            <CheckField label="Doença hepática" checked={form.doenca_hepatica} onChange={v => set('doenca_hepatica', v)} />
            <CheckField label="Distúrbio de coagulação" checked={form.disturbio_coagulacao} onChange={v => set('disturbio_coagulacao', v)} />
            <CheckField label="Osteoporose" checked={form.osteoporose} onChange={v => set('osteoporose', v)} />
            <CheckField label="HIV / imunossuprimido" checked={form.hiv_imunossuprimido} onChange={v => set('hiv_imunossuprimido', v)} />
            <CheckField label="Gestante" checked={form.gestante} onChange={v => set('gestante', v)} />
            {form.gestante && (
              <div className="col-span-2 pl-6">
                <label className="label">Período de gestação</label>
                <input value={form.periodo_gestacao} onChange={e => set('periodo_gestacao', e.target.value)} className="input" placeholder="Ex: 2º trimestre" />
              </div>
            )}
          </div>

          {/* Hábitos */}
          <SectionTitle>Hábitos</SectionTitle>
          <div className="grid grid-cols-2 gap-2">
            <CheckField label="Fuma" checked={form.fuma} onChange={v => set('fuma', v)} />
            <CheckField label="Consome álcool" checked={form.consome_alcool} onChange={v => set('consome_alcool', v)} />
            <CheckField label="Bruxismo (range dentes)" checked={form.bruxismo} onChange={v => set('bruxismo', v)} />
          </div>

          {/* Histórico odontológico */}
          <SectionTitle>Histórico odontológico</SectionTitle>
          <div className="grid grid-cols-2 gap-2">
            <CheckField label="Já fez cirurgia odontológica" checked={form.ja_fez_cirurgia} onChange={v => set('ja_fez_cirurgia', v)} />
            <CheckField label="Sangramento pós-procedimento" checked={form.sangramento_pos_procedimento} onChange={v => set('sangramento_pos_procedimento', v)} />
            <CheckField label="Medo de tratamento dental" checked={form.medo_tratamento} onChange={v => set('medo_tratamento', v)} />
            <CheckField label="Usa prótese" checked={form.usa_protese} onChange={v => set('usa_protese', v)} />
          </div>

          {/* Observações */}
          <SectionTitle>Observações adicionais</SectionTitle>
          <textarea value={form.observacoes} onChange={e => set('observacoes', e.target.value)}
            rows={3} className="input resize-none w-full" placeholder="Outras informações relevantes..." />

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
