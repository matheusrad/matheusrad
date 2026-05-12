'use client'
import { useState, useEffect } from 'react'
import { Clipboard, Plus, Eye, Pencil, CheckCircle2, XCircle, Send, Copy, Check } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { AnamnesesModal } from './AnamnesesModal'
import type { AnamnesesFormData } from './AnamnesesModal'

type Anamnese = AnamnesesFormData & { id: string; created_at: string }

// ── Visualizador ──────────────────────────────────────────────
function Viewer({ a, onClose, onEdit }: { a: Anamnese; onClose: () => void; onEdit: () => void }) {
  const Bool = ({ v }: { v: boolean }) => v
    ? <span className="inline-flex items-center gap-1 text-green-600 text-xs font-medium"><CheckCircle2 size={12} />Sim</span>
    : <span className="inline-flex items-center gap-1 text-gray-400 text-xs"><XCircle size={12} />Não</span>

  const Row = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div className="flex justify-between py-1.5 border-b border-gray-50 last:border-0 gap-4">
      <span className="text-sm text-gray-500 shrink-0">{label}</span>
      <span className="text-sm text-gray-900 font-medium text-right">{value || '—'}</span>
    </div>
  )

  const Sec = ({ title }: { title: string }) => (
    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 mt-4 first:mt-0">{title}</h3>
  )

  const sb = a.saude_bucal ?? {}

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div>
            <h2 className="font-semibold text-gray-900">Anamnese</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {format(parseISO(a.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={onEdit} className="btn-secondary text-xs py-1.5 px-3"><Pencil size={12} /> Editar</button>
            <button onClick={onClose} className="btn-secondary text-xs py-1.5 px-3">Fechar</button>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-4">
          <Sec title="Queixa principal" />
          <Row label="Motivo da consulta" value={a.motivo_consulta} />
          <Row label="Tem dor?" value={<Bool v={a.tem_dor_atual} />} />
          {a.tem_dor_atual && <>
            <Row label="Local da dor" value={a.local_dor} />
            <Row label="Intensidade" value={`${a.intensidade_dor}/10`} />
          </>}
          <Row label="Duração do problema" value={a.tempo_problema} />
          <Row label="Última consulta" value={a.ultima_consulta_dentista} />

          <Sec title="Questionário de saúde" />
          <Row label="01 Em tratamento médico?" value={<Bool v={a.em_tratamento_medico} />} />
          {a.em_tratamento_medico && <Row label="Qual tratamento?" value={a.detalhe_tratamento_medico} />}
          <Row label="02 Toma algum remédio?" value={<Bool v={a.usa_medicamento} />} />
          {a.usa_medicamento && <Row label="Qual(is)?" value={a.qual_medicamento} />}
          <Row label="03 Está grávida?" value={<Bool v={a.gestante} />} />
          {a.gestante && <Row label="Período" value={a.periodo_gestacao} />}
          <Row label="05 Suspendeu algum remédio?" value={<Bool v={a.suspendeu_remedio} />} />
          {a.suspendeu_remedio && <Row label="Qual e por quê?" value={a.detalhe_remedio_suspenso} />}
          <Row label="06 Tem alergia?" value={<Bool v={a.tem_alergia} />} />
          {a.tem_alergia && <Row label="Qual(is)?" value={a.qual_alergia} />}
          <Row label="07 Sensível a metais/látex?" value={<Bool v={a.sensivel_metais_latex} />} />

          <div className="grid grid-cols-2 gap-x-4">
            <Row label="08 Diabético?" value={<Bool v={a.diabetes} />} />
            <Row label="09 Tem anemia?" value={<Bool v={a.tem_anemia} />} />
            <Row label="10 Tem asma?" value={<Bool v={a.tem_asma} />} />
            <Row label="11 HIV positivo?" value={<Bool v={a.hiv_imunossuprimido} />} />
            <Row label="12 Sujeito a infecções?" value={<Bool v={a.sujeito_infeccoes} />} />
            <Row label="13 Epilepsia/ataques nervosos?" value={<Bool v={a.tem_epilepsia} />} />
            <Row label="14 Já teve convulsões?" value={<Bool v={a.ja_teve_convulsoes} />} />
            <Row label="15 Desmaios/tonturas?" value={<Bool v={a.desmaios_tonturas} />} />
          </div>
          <Row label="16 Pressão arterial" value={a.pressao_arterial} />
          <Row label="17 Usa marcapasso/válvula cardíaca?" value={<Bool v={a.usa_marcapasso} />} />
          <Row label="18 Articulações artificiais/prótese?" value={<Bool v={a.articulacoes_artificiais} />} />
          <Row label="19 Formigamento/inchaço?" value={<Bool v={a.formigamento_inchazo} />} />
          <Row label="20 Sangra muito/cicatriza devagar?" value={<Bool v={a.disturbio_coagulacao} />} />
          <Row label="21 Fuma/tabaco?" value={<Bool v={a.fuma} />} />
          <Row label="22 Já foi operado?" value={<Bool v={a.ja_fez_cirurgia} />} />
          <Row label="23 Já teve doença grave?" value={<Bool v={a.doenca_grave} />} />
          {a.doenca_grave && <Row label="Qual?" value={a.detalhe_doenca_grave} />}
          <Row label="24 Problemas cardíacos/gástricos/renais/hepáticos?" value={<Bool v={a.tem_doenca_sistemica} />} />
          {a.tem_doenca_sistemica && <Row label="Quais?" value={a.qual_doenca} />}
          {a.outras_informacoes_saude && <Row label="25 Outras informações" value={a.outras_informacoes_saude} />}

          <Sec title="Condições específicas" />
          <div className="grid grid-cols-2 gap-x-4">
            {([
              ['Hipertensão', a.hipertensao], ['Problema cardíaco', a.problema_cardiaco],
              ['Doença renal', a.doenca_renal], ['Doença hepática', a.doenca_hepatica],
              ['Osteoporose', a.osteoporose], ['Consome álcool', a.consome_alcool],
              ['Bruxismo', a.bruxismo], ['Medo de tratamento', a.medo_tratamento],
              ['Sangramento pós-procedimento', a.sangramento_pos_procedimento],
            ] as [string, boolean][]).map(([label, val]) => (
              <Row key={label} label={label} value={<Bool v={val} />} />
            ))}
          </div>

          {Object.values(sb).some(v => v) && <>
            <Sec title="Saúde bucal e hábitos" />
            {([
              ['01 Respira bem pelo nariz?', sb.respira_bem_nariz, sb.respira_obs],
              ['02 Dificuldade/barulho ao abrir a boca?', sb.dificuldade_boca, sb.dificuldade_boca_obs],
              ['03 Dor na articulação da mandíbula?', sb.dor_mandibula, sb.dor_mandibula_obs],
              ['04 Range os dentes?', sb.range_dentes],
              ['05 Mastiga dos dois lados?', sb.mastiga_dois_lados],
              ['06 Mastiga bem os alimentos?', sb.mastiga_bem],
              ['07 Retenção de comida entre dentes?', sb.retencao_comida],
              ['08 Hábito de mascar chiclete/bala?', sb.chiclete_bala, sb.chiclete_freq],
              ['09 Ingere muito doce?', sb.muito_doce],
              ['10 Café/líquidos escuros frequentemente?', sb.cafe_escuros, sb.cafe_freq],
              ['11 Come fora de hora?', sb.come_fora_hora],
              ['12 Escova os dentes depois de comer?', sb.escova_depois],
              ['13 Gengiva inchada ou dolorida?', sb.gengiva_inchada, sb.gengiva_inchada_obs],
              ['14 Gengiva sangra ao escovar?', sb.gengiva_sangra],
              ['15 Teve instruções de higiene bucal?', sb.instrucoes_higiene],
              ['16 Vezes que escova/dia', sb.vezes_escovacao_dia],
              ['17 Duração da escovação', sb.tempo_escovacao],
              ['18 Vezes que usa fio dental/dia', sb.vezes_fio_dental],
              ['19 Usa antisséptico bucal?', sb.antisseptico, sb.antisseptico_qual],
              ['20 Frequência ao dentista', sb.freq_dentista],
              ['21 Último tratamento odontológico', sb.ultimo_tratamento],
              ['22 Tomou anestesia local?', sb.anestesia_local, sb.anestesia_obs],
            ] as [string, string, string?][]).filter(([, v]) => v).map(([label, value, detail]) => (
              <Row key={label} label={label} value={detail ? `${value}${detail ? ` — ${detail}` : ''}` : value} />
            ))}
          </>}

          {a.observacoes && <>
            <Sec title="Observações da cirurgiã-dentista" />
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{a.observacoes}</p>
          </>}
        </div>
      </div>
    </div>
  )
}

// ── Tab principal ─────────────────────────────────────────────
// ── Gerador de link ───────────────────────────────────────────
function LinkModal({ pacienteId, pacienteNome, pacienteTelefone, onClose }: {
  pacienteId: string; pacienteNome: string; pacienteTelefone: string; onClose: () => void
}) {
  const [link, setLink]       = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied]   = useState(false)

  async function gerarLink() {
    setLoading(true)
    const token = crypto.randomUUID()
    const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString()
    const { error } = await supabase.from('anamnese_tokens').insert({
      paciente_id: pacienteId, token, expires_at: expiresAt,
    })
    if (!error) {
      const url = `${window.location.origin}/anamnese/${token}`
      setLink(url)
    }
    setLoading(false)
  }

  useEffect(() => { gerarLink() }, [])

  function copiarLink() {
    navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function enviarWhatsApp() {
    const tel = pacienteTelefone.replace(/\D/g, '')
    const msg = encodeURIComponent(
      `Olá, ${pacienteNome}! 😊\n\nPara agilizar sua consulta, pedimos que preencha sua ficha de anamnese pelo link abaixo. É rápido e pode fazer pelo celular:\n\n${link}\n\nO link é válido por 72 horas. Qualquer dúvida, estamos à disposição! 🦷`
    )
    window.open(`https://wa.me/55${tel}?text=${msg}`, '_blank')
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl p-6">
        <h2 className="font-semibold text-gray-900 mb-1">Enviar anamnese por WhatsApp</h2>
        <p className="text-sm text-gray-500 mb-4">Um link único será gerado para {pacienteNome} preencher no celular. Válido por 72 horas.</p>

        {loading ? (
          <div className="flex justify-center py-6">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : link ? (
          <div className="space-y-3">
            <div className="bg-gray-50 rounded-xl p-3 flex items-center gap-2">
              <p className="text-xs text-gray-600 flex-1 break-all font-mono">{link}</p>
              <button onClick={copiarLink} className="shrink-0 p-1.5 text-gray-400 hover:text-gray-600 rounded">
                {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
              </button>
            </div>
            <button onClick={enviarWhatsApp}
              className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors">
              <Send size={16} /> Abrir WhatsApp e enviar
            </button>
            <button onClick={copiarLink}
              className="w-full border border-gray-200 text-gray-700 font-medium py-2.5 rounded-xl flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors text-sm">
              {copied ? <><Check size={14} className="text-green-500" /> Copiado!</> : <><Copy size={14} /> Copiar link</>}
            </button>
          </div>
        ) : (
          <p className="text-sm text-red-500">Erro ao gerar o link. Tente novamente.</p>
        )}

        <button onClick={onClose} className="mt-4 w-full text-sm text-gray-400 hover:text-gray-600 py-1">Fechar</button>
      </div>
    </div>
  )
}

// ── Tab principal ─────────────────────────────────────────────
interface Props { pacienteId: string; pacienteNome: string; pacienteTelefone?: string }

export function AnamnesesTab({ pacienteId, pacienteNome, pacienteTelefone = '' }: Props) {
  const [anamneses, setAnamneses] = useState<Anamnese[]>([])
  const [loading, setLoading]     = useState(true)
  const [showForm, setShowForm]   = useState(false)
  const [showLink, setShowLink]   = useState(false)
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
        <div className="flex gap-2">
          <button onClick={() => setShowLink(true)} className="btn-secondary">
            <Send size={14} /> Enviar por WhatsApp
          </button>
          <button onClick={() => setShowForm(true)} className="btn-primary">
            <Plus size={14} /> Preencher aqui
          </button>
        </div>
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
                  {i === anamneses.length - 1 ? 'Anamnese inicial' : `Anamnese — atualização ${anamneses.length - i - 1}`}
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
        <AnamnesesModal pacienteId={pacienteId} pacienteNome={pacienteNome}
          onClose={() => setShowForm(false)} onSaved={handleSaved} />
      )}
      {editing && (
        <AnamnesesModal pacienteId={pacienteId} pacienteNome={pacienteNome}
          initial={editing} onClose={() => setEditing(null)} onSaved={handleSaved} />
      )}
      {viewing && !editing && (
        <Viewer a={viewing} onClose={() => setViewing(null)}
          onEdit={() => { setEditing(viewing); setViewing(null) }} />
      )}
      {showLink && (
        <LinkModal pacienteId={pacienteId} pacienteNome={pacienteNome}
          pacienteTelefone={pacienteTelefone} onClose={() => setShowLink(false)} />
      )}
    </div>
  )
}
