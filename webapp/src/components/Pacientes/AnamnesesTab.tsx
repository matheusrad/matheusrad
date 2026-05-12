'use client'
import { useState, useEffect } from 'react'
import { Clipboard, Plus, Eye, Pencil, CheckCircle2, XCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { AnamnesesModal } from './AnamnesesModal'
import type { AnamnesesFormData } from './AnamnesesModal'

type Anamnese = AnamnesesFormData & { id: string; created_at: string }

function Viewer({ a, onClose, onEdit }: { a: Anamnese; onClose: () => void; onEdit: () => void }) {
  const SIM = () => <span className="inline-flex items-center gap-1 text-green-600 text-xs font-medium"><CheckCircle2 size={12} />Sim</span>
  const NAO = () => <span className="inline-flex items-center gap-1 text-gray-400 text-xs"><XCircle size={12} />Não</span>
  const Bool = ({ v }: { v: boolean }) => v ? <SIM /> : <NAO />

  const Row = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div className="flex justify-between py-1.5 border-b border-gray-50 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm text-gray-900 font-medium text-right max-w-[60%]">{value || '—'}</span>
    </div>
  )

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div>
            <h2 className="font-semibold text-gray-900">Anamnese</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Preenchida em {format(parseISO(a.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={onEdit} className="btn-secondary text-xs py-1.5 px-3"><Pencil size={12} /> Editar</button>
            <button onClick={onClose} className="btn-secondary text-xs py-1.5 px-3">Fechar</button>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4">
          <section>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Queixa principal</h3>
            <Row label="Motivo da consulta" value={a.motivo_consulta} />
            <Row label="Tem dor?" value={<Bool v={a.tem_dor_atual} />} />
            {a.tem_dor_atual && <>
              <Row label="Local da dor" value={a.local_dor} />
              <Row label="Intensidade" value={`${a.intensidade_dor}/10`} />
            </>}
            <Row label="Duração do problema" value={a.tempo_problema} />
            <Row label="Última consulta" value={a.ultima_consulta_dentista} />
          </section>

          <section>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Saúde geral</h3>
            <Row label="Usa medicamento?" value={<Bool v={a.usa_medicamento} />} />
            {a.usa_medicamento && <Row label="Qual medicamento?" value={a.qual_medicamento} />}
            <Row label="Tem alergia?" value={<Bool v={a.tem_alergia} />} />
            {a.tem_alergia && <Row label="Qual alergia?" value={a.qual_alergia} />}
            <Row label="Doença sistêmica?" value={<Bool v={a.tem_doenca_sistemica} />} />
            {a.tem_doenca_sistemica && <Row label="Qual doença?" value={a.qual_doenca} />}
          </section>

          <section>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Condições específicas</h3>
            <div className="grid grid-cols-2 gap-1">
              {([
                ['Hipertensão', a.hipertensao],
                ['Diabetes', a.diabetes],
                ['Problema cardíaco', a.problema_cardiaco],
                ['Doença renal', a.doenca_renal],
                ['Doença hepática', a.doenca_hepatica],
                ['Distúrbio de coagulação', a.disturbio_coagulacao],
                ['Osteoporose', a.osteoporose],
                ['HIV / imunossuprimido', a.hiv_imunossuprimido],
                ['Gestante', a.gestante],
              ] as [string, boolean][]).map(([label, val]) => (
                <Row key={label} label={label} value={<Bool v={val} />} />
              ))}
            </div>
            {a.gestante && <Row label="Período" value={a.periodo_gestacao} />}
          </section>

          <section>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Hábitos</h3>
            <Row label="Fuma" value={<Bool v={a.fuma} />} />
            <Row label="Consome álcool" value={<Bool v={a.consome_alcool} />} />
            <Row label="Bruxismo" value={<Bool v={a.bruxismo} />} />
          </section>

          <section>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Histórico odontológico</h3>
            <Row label="Já fez cirurgia" value={<Bool v={a.ja_fez_cirurgia} />} />
            <Row label="Sangramento pós-procedimento" value={<Bool v={a.sangramento_pos_procedimento} />} />
            <Row label="Medo de tratamento" value={<Bool v={a.medo_tratamento} />} />
            <Row label="Usa prótese" value={<Bool v={a.usa_protese} />} />
          </section>

          {a.observacoes && (
            <section>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Observações</h3>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{a.observacoes}</p>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}

interface Props {
  pacienteId: string
  pacienteNome: string
}

export function AnamnesesTab({ pacienteId, pacienteNome }: Props) {
  const [anamneses, setAnamneses] = useState<Anamnese[]>([])
  const [loading, setLoading]     = useState(true)
  const [showForm, setShowForm]   = useState(false)
  const [viewing, setViewing]     = useState<Anamnese | null>(null)
  const [editing, setEditing]     = useState<Anamnese | null>(null)

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('anamneses')
      .select('*')
      .eq('paciente_id', pacienteId)
      .order('created_at', { ascending: false })
    setAnamneses((data as Anamnese[]) ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [pacienteId])

  function handleSaved() {
    setShowForm(false)
    setEditing(null)
    load()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-semibold text-gray-800">Anamneses</h2>
        <button onClick={() => setShowForm(true)} className="btn-primary">
          <Plus size={14} /> Nova anamnese
        </button>
      </div>

      {loading ? (
        <div className="py-16 flex justify-center">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : anamneses.length === 0 ? (
        <div className="py-16 flex flex-col items-center gap-3 text-center">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center">
            <Clipboard size={28} className="text-gray-300" />
          </div>
          <p className="text-sm text-gray-500">Nenhuma anamnese preenchida ainda.</p>
          <button onClick={() => setShowForm(true)} className="btn-primary text-xs">
            <Plus size={12} /> Preencher primeira anamnese
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {anamneses.map((a, i) => (
            <div key={a.id} className="border border-gray-100 rounded-xl p-4 flex items-center justify-between hover:border-gray-200 transition-colors">
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {i === anamneses.length - 1 ? 'Anamnese inicial' : `Anamnese ${anamneses.length - i}ª`}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {format(parseISO(a.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  {a.motivo_consulta && ` · ${a.motivo_consulta.slice(0, 50)}${a.motivo_consulta.length > 50 ? '...' : ''}`}
                </p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setViewing(a)} className="btn-secondary text-xs py-1.5 px-3">
                  <Eye size={12} /> Ver
                </button>
                <button onClick={() => setEditing(a)} className="btn-secondary text-xs py-1.5 px-3">
                  <Pencil size={12} /> Editar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <AnamnesesModal
          pacienteId={pacienteId}
          pacienteNome={pacienteNome}
          onClose={() => setShowForm(false)}
          onSaved={handleSaved}
        />
      )}
      {editing && (
        <AnamnesesModal
          pacienteId={pacienteId}
          pacienteNome={pacienteNome}
          initial={editing}
          onClose={() => setEditing(null)}
          onSaved={handleSaved}
        />
      )}
      {viewing && !editing && (
        <Viewer
          a={viewing}
          onClose={() => setViewing(null)}
          onEdit={() => { setEditing(viewing); setViewing(null) }}
        />
      )}
    </div>
  )
}
