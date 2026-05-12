'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Printer, ArrowLeft, CheckCircle2, XCircle } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import Link from 'next/link'
import type { SaudeBucal } from '@/components/Pacientes/AnamnesesModal'

interface Anamnese {
  id: string
  created_at: string
  paciente_nome: string
  paciente_id: string
  motivo_consulta: string
  tem_dor_atual: boolean
  local_dor: string
  intensidade_dor: number
  tempo_problema: string
  ultima_consulta_dentista: string
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
  consome_alcool: boolean
  bruxismo: boolean
  sangramento_pos_procedimento: boolean
  medo_tratamento: boolean
  saude_bucal: SaudeBucal | null
  observacoes: string
}

// ── Componentes de exibição ──────────────────────────────────
function Sim({ v }: { v: boolean }) {
  return v
    ? <span className="inline-flex items-center gap-1 text-green-700 font-semibold print:text-black"><CheckCircle2 size={13} className="print:hidden" />Sim</span>
    : <span className="inline-flex items-center gap-1 text-gray-400 print:text-black"><XCircle size={13} className="print:hidden" />Não</span>
}

function Row({ label, value, full }: { label: string; value: React.ReactNode; full?: boolean }) {
  return (
    <div className={`flex justify-between items-start gap-4 py-1.5 border-b border-gray-100 print:border-gray-300 last:border-0 ${full ? 'col-span-2' : ''}`}>
      <span className="text-sm text-gray-500 print:text-gray-700 shrink-0">{label}</span>
      <span className="text-sm text-gray-900 font-medium text-right">{value || <span className="text-gray-300">—</span>}</span>
    </div>
  )
}

function Sec({ title }: { title: string }) {
  return (
    <h2 className="text-xs font-bold text-gray-400 print:text-gray-700 uppercase tracking-widest mt-8 mb-3 first:mt-0 pb-1 border-b-2 border-gray-200 print:border-gray-400">
      {title}
    </h2>
  )
}

function SbRow({ label, value, detail }: { label: string; value: string; detail?: string }) {
  if (!value) return null
  const display = value === 'sim' ? 'Sim' : value === 'nao' ? 'Não' : value
  return (
    <div className="flex justify-between items-start gap-2 py-1.5 border-b border-gray-100 print:border-gray-300 last:border-0">
      <span className="text-sm text-gray-500 print:text-gray-700">{label}</span>
      <span className="text-sm font-medium text-gray-900 text-right">
        {display}
        {detail && <span className="block text-xs text-gray-400 print:text-gray-600 font-normal">{detail}</span>}
      </span>
    </div>
  )
}

// ── Página ───────────────────────────────────────────────────
export default function AnamnesesViewPage({ params }: { params: { id: string } }) {
  const [anamnese, setAnamnese] = useState<Anamnese | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    supabase.from('anamneses').select('*').eq('id', params.id).single()
      .then(({ data, error }) => {
        if (error || !data) setNotFound(true)
        else setAnamnese(data as Anamnese)
        setLoading(false)
      })
  }, [params.id])

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (notFound || !anamnese) return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <p className="text-gray-500">Anamnese não encontrada.</p>
      <Link href="/pacientes" className="btn-secondary text-sm">← Voltar</Link>
    </div>
  )

  const a = anamnese
  const sb = a.saude_bucal ?? ({} as SaudeBucal)

  return (
    <>
      {/* CSS de impressão */}
      <style>{`
        @media print {
          @page { margin: 15mm 12mm; size: A4; }
          body { font-size: 11pt; }
        }
      `}</style>

      {/* Barra de ações — oculta na impressão */}
      <div className="print:hidden sticky top-0 z-10 bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-between">
        <Link href={`/pacientes/${a.paciente_id}`} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition-colors">
          <ArrowLeft size={16} /> Voltar ao paciente
        </Link>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
        >
          <Printer size={16} /> Baixar / Imprimir PDF
        </button>
      </div>

      {/* Conteúdo */}
      <div className="max-w-3xl mx-auto px-6 py-8 print:px-0 print:py-0">

        {/* Cabeçalho de impressão */}
        <div className="mb-8 pb-4 border-b-2 border-gray-200 print:border-gray-500">
          <h1 className="text-2xl font-bold text-gray-900 print:text-black">Ficha de Anamnese</h1>
          <div className="mt-2 flex flex-wrap gap-x-8 gap-y-1">
            <p className="text-sm text-gray-600 print:text-black">
              <span className="font-semibold">Paciente:</span> {a.paciente_nome}
            </p>
            <p className="text-sm text-gray-600 print:text-black">
              <span className="font-semibold">Data:</span>{' '}
              {format(parseISO(a.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </p>
          </div>
        </div>

        {/* 1. Queixa principal */}
        <Sec title="Queixa principal" />
        <Row label="Motivo da consulta" value={a.motivo_consulta} />
        <Row label="Tem dor no momento?" value={<Sim v={a.tem_dor_atual} />} />
        {a.tem_dor_atual && <>
          <Row label="Local da dor" value={a.local_dor} />
          <Row label="Intensidade da dor" value={`${a.intensidade_dor} / 10`} />
        </>}
        <Row label="Tempo com o problema" value={a.tempo_problema} />
        <Row label="Última consulta ao dentista" value={a.ultima_consulta_dentista} />

        {/* 2. Questionário de saúde */}
        <Sec title="Questionário de saúde" />
        <Row label="01 Em tratamento médico?" value={<Sim v={a.em_tratamento_medico} />} />
        {a.em_tratamento_medico && <Row label="   Qual tratamento?" value={a.detalhe_tratamento_medico} />}
        <Row label="02 Toma algum remédio?" value={<Sim v={a.usa_medicamento} />} />
        {a.usa_medicamento && <Row label="   Qual(is)?" value={a.qual_medicamento} />}
        <Row label="03 Está grávida?" value={<Sim v={a.gestante} />} />
        {a.gestante && <Row label="   Quantos meses?" value={a.periodo_gestacao} />}
        <Row label="05 Suspendeu algum remédio?" value={<Sim v={a.suspendeu_remedio} />} />
        {a.suspendeu_remedio && <Row label="   Qual e por quê?" value={a.detalhe_remedio_suspenso} />}
        <Row label="06 Tem alergia?" value={<Sim v={a.tem_alergia} />} />
        {a.tem_alergia && <Row label="   Qual(is)?" value={a.qual_alergia} />}
        <Row label="07 Sensível a metais / látex?" value={<Sim v={a.sensivel_metais_latex} />} />

        <div className="grid grid-cols-2 gap-x-8 print:gap-x-6">
          <Row label="08 Diabético?" value={<Sim v={a.diabetes} />} />
          <Row label="09 Tem anemia?" value={<Sim v={a.tem_anemia} />} />
          <Row label="10 Tem asma?" value={<Sim v={a.tem_asma} />} />
          <Row label="11 HIV positivo?" value={<Sim v={a.hiv_imunossuprimido} />} />
          <Row label="12 Sujeito a infecções?" value={<Sim v={a.sujeito_infeccoes} />} />
          <Row label="13 Epilepsia / ataques nervosos?" value={<Sim v={a.tem_epilepsia} />} />
          <Row label="14 Já teve convulsões?" value={<Sim v={a.ja_teve_convulsoes} />} />
          <Row label="15 Desmaios / tonturas?" value={<Sim v={a.desmaios_tonturas} />} />
        </div>

        <Row label="16 Pressão arterial" value={a.pressao_arterial} />
        <Row label="17 Usa marcapasso / válvula cardíaca?" value={<Sim v={a.usa_marcapasso} />} />
        <Row label="18 Articulações artificiais / prótese?" value={<Sim v={a.articulacoes_artificiais} />} />
        <Row label="19 Formigamento / inchaço nas extremidades?" value={<Sim v={a.formigamento_inchazo} />} />
        <Row label="20 Sangra muito / cicatriza devagar?" value={<Sim v={a.disturbio_coagulacao} />} />
        <Row label="21 Fuma ou consome tabaco?" value={<Sim v={a.fuma} />} />
        <Row label="22 Já foi operado?" value={<Sim v={a.ja_fez_cirurgia} />} />
        <Row label="23 Já teve doença grave?" value={<Sim v={a.doenca_grave} />} />
        {a.doenca_grave && <Row label="   Qual?" value={a.detalhe_doenca_grave} />}
        <Row label="24 Problemas cardíacos / gástricos / renais / hepáticos?" value={<Sim v={a.tem_doenca_sistemica} />} />
        {a.tem_doenca_sistemica && <Row label="   Quais?" value={a.qual_doenca} />}
        {a.outras_informacoes_saude && <Row label="25 Outras informações" value={a.outras_informacoes_saude} />}

        {/* 3. Condições específicas */}
        <Sec title="Condições específicas" />
        <div className="grid grid-cols-2 gap-x-8 print:gap-x-6">
          {([
            ['Hipertensão', a.hipertensao], ['Problema cardíaco', a.problema_cardiaco],
            ['Doença renal', a.doenca_renal], ['Doença hepática', a.doenca_hepatica],
            ['Osteoporose', a.osteoporose], ['Consome álcool', a.consome_alcool],
            ['Bruxismo', a.bruxismo], ['Medo de tratamento dental', a.medo_tratamento],
            ['Sangramento pós-procedimento', a.sangramento_pos_procedimento],
          ] as [string, boolean][]).map(([label, val]) => (
            <Row key={label} label={label} value={<Sim v={val} />} />
          ))}
        </div>

        {/* 4. Saúde bucal */}
        {Object.values(sb).some(v => v) && <>
          <Sec title="Saúde bucal e hábitos" />
          <div className="grid grid-cols-2 gap-x-8 print:gap-x-6">
            <SbRow label="01 Respira bem pelo nariz?" value={sb.respira_bem_nariz} detail={sb.respira_obs} />
            <SbRow label="02 Dificuldade/barulho ao abrir a boca?" value={sb.dificuldade_boca} detail={sb.dificuldade_boca_obs} />
            <SbRow label="03 Dor na articulação da mandíbula?" value={sb.dor_mandibula} detail={sb.dor_mandibula_obs} />
            <SbRow label="04 Range os dentes?" value={sb.range_dentes} />
            <SbRow label="05 Mastiga dos dois lados?" value={sb.mastiga_dois_lados} />
            <SbRow label="06 Mastiga bem os alimentos?" value={sb.mastiga_bem} />
            <SbRow label="07 Retenção de comida entre dentes?" value={sb.retencao_comida} />
            <SbRow label="08 Hábito de mascar chiclete/bala?" value={sb.chiclete_bala} detail={sb.chiclete_freq} />
            <SbRow label="09 Ingere muito doce?" value={sb.muito_doce} />
            <SbRow label="10 Café/líquidos escuros frequentemente?" value={sb.cafe_escuros} detail={sb.cafe_freq} />
            <SbRow label="11 Come fora de hora?" value={sb.come_fora_hora} />
            <SbRow label="12 Escova os dentes depois de comer?" value={sb.escova_depois} />
            <SbRow label="13 Gengiva inchada ou dolorida?" value={sb.gengiva_inchada} detail={sb.gengiva_inchada_obs} />
            <SbRow label="14 Gengiva sangra ao escovar?" value={sb.gengiva_sangra} />
            <SbRow label="15 Recebeu instruções de higiene bucal?" value={sb.instrucoes_higiene} />
            <SbRow label="16 Vezes que escova por dia" value={sb.vezes_escovacao_dia} />
            <SbRow label="17 Duração da escovação" value={sb.tempo_escovacao} />
            <SbRow label="18 Vezes que usa fio dental/dia" value={sb.vezes_fio_dental} />
            <SbRow label="19 Usa antisséptico/enxaguante bucal?" value={sb.antisseptico} detail={sb.antisseptico_qual} />
            <SbRow label="20 Frequência ao dentista" value={sb.freq_dentista} />
            <SbRow label="21 Último tratamento odontológico" value={sb.ultimo_tratamento} />
            <SbRow label="22 Já tomou anestesia local?" value={sb.anestesia_local} detail={sb.anestesia_obs} />
          </div>
        </>}

        {/* 5. Observações */}
        {a.observacoes && <>
          <Sec title="Observações da cirurgiã-dentista" />
          <p className="text-sm text-gray-800 whitespace-pre-wrap">{a.observacoes}</p>
        </>}

        {/* Rodapé de impressão */}
        <div className="hidden print:block mt-12 pt-4 border-t border-gray-400 text-xs text-gray-500 flex justify-between">
          <span>Ficha gerada em {format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
        </div>
      </div>
    </>
  )
}
