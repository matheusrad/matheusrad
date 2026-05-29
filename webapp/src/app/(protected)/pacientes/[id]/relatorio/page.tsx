'use client'
import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Printer, ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface RegistroClinico {
  id: string; tipo: string; data: string
  conteudo: Record<string, unknown>; created_at: string
}
interface Paciente {
  id: string; nome: string; data_nascimento: string | null; cpf: string | null
  telefone: string | null; email: string | null
}
interface Clinica {
  nome: string; dentista_nome: string | null; dentista_cro: string | null
  endereco: string | null; numero: string | null; bairro: string | null
  cidade: string | null; estado: string | null; telefone: string | null; whatsapp: string | null
  logo_base64: string | null
}

function Secao({ titulo, campos }: { titulo: string; campos: [string, unknown][] }) {
  const visiveis = campos.filter(([, v]) => v)
  if (!visiveis.length) return null
  return (
    <div className="mb-4">
      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 border-b border-gray-200 pb-1 mb-2">{titulo}</p>
      <table className="w-full text-sm">
        <tbody>
          {visiveis.map(([label, valor]) => (
            <tr key={label} className="border-b border-gray-50">
              <td className="py-1 pr-4 text-xs text-gray-500 w-44 align-top">{label}</td>
              <td className="py-1 text-gray-800">{String(valor)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function RegistroCard({ r, index }: { r: RegistroClinico; index: number }) {
  const c = r.conteudo as Record<string, unknown>
  const tipoLabel: Record<string, string> = {
    exame_clinico: 'Exame Clínico', ortodontia: 'Ortodontia', endodontia: 'Endodontia',
  }
  const dataFmt = format(parseISO(r.data), "d 'de' MMMM 'de' yyyy", { locale: ptBR })

  return (
    <div className="mb-8 break-inside-avoid">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-6 h-6 rounded-full bg-gray-800 text-white text-xs flex items-center justify-center font-bold shrink-0">
          {index + 1}
        </div>
        <div>
          <p className="font-bold text-sm text-gray-900">{tipoLabel[r.tipo] ?? r.tipo}</p>
          <p className="text-xs text-gray-500">{dataFmt}</p>
        </div>
      </div>

      <div className="pl-9">
        {r.tipo === 'exame_clinico' && (
          <>
            <Secao titulo="Exame Extrabucal" campos={[
              ['Face / Assimetria', c.face], ['ATM', c.atm], ['Linfonodos', c.linfonodos],
              ['Lábios', c.labios], ['Mucosa labial', c.mucosa_labial],
            ]} />
            <Secao titulo="Exame Intrabucal" campos={[
              ['Mucosa oral', c.mucosa_oral], ['Língua', c.lingua], ['Assoalho', c.assoalho],
              ['Palato', c.palato], ['Gengiva / Periodonto', c.gengiva],
            ]} />
            <Secao titulo="Oclusão / DTM" campos={[
              ['Classe de Angle', c.classe_angle], ['Overjet (mm)', c.overjet],
              ['Overbite (mm)', c.overbite], ['Sinais de DTM', c.dtm_sinais], ['Parafunções', c.parafuncoes],
            ]} />
            <Secao titulo="Patologias" campos={[
              ['Lesões de cárie', c.lesoes_carie], ['Fraturas', c.fraturas],
              ['Lesões em mucosas', c.lesoes_mucosa], ['Outras patologias', c.outras_patologias],
            ]} />
            {c.observacoes && <p className="text-xs text-gray-600 mt-2"><strong>Obs.:</strong> {String(c.observacoes)}</p>}
          </>
        )}

        {r.tipo === 'ortodontia' && (
          <>
            <Secao titulo="Configuração do aparelho" campos={[
              ['Tipo de aparelho', c.tipo_aparelho], ['Fase', c.fase],
            ]} />
            <Secao titulo="Arcos e fios" campos={[
              ['Arco superior', c.arco_sup_fio || c.arco_sup_numero
                ? `${c.arco_sup_fio ?? ''} ${c.arco_sup_numero ?? ''}`.trim() : undefined],
              ['Arco inferior', c.arco_inf_fio || c.arco_inf_numero
                ? `${c.arco_inf_fio ?? ''} ${c.arco_inf_numero ?? ''}`.trim() : undefined],
              ['Elásticos', c.elasticos],
            ]} />
            <Secao titulo="Sessão" campos={[
              ['Bráquetes / colagem', c.broquetes], ['Observações', c.observacoes],
              ['Próximo passo', c.proximo_passo],
            ]} />
          </>
        )}

        {r.tipo === 'endodontia' && (
          <>
            <Secao titulo="Identificação" campos={[
              ['Dente', c.dente], ['Diagnóstico', c.diagnostico], ['Sessão', c.sessao],
            ]} />
            <Secao titulo="Instrumentação" campos={[
              ['Comprimento de trabalho', c.comprimento_trabalho], ['Lima inicial (IAF)', c.lima_inicial],
              ['Lima apical (MAF)', c.lima_apical], ['Técnica / instrumento', c.instrumentacao],
            ]} />
            <Secao titulo="Irrigação e medicação" campos={[
              ['Irrigação', c.irrigacao], ['Medicação intracanal', c.medicacao_intracanal],
            ]} />
            <Secao titulo="Obturação e selamento" campos={[
              ...(c.obturado ? [
                ['Canal obturado', 'Sim'] as [string, unknown],
                ['Técnica', c.tecnica_obturacao] as [string, unknown],
                ['Cimento', c.cimento] as [string, unknown],
              ] : []),
              ['Selamento coronário', c.selamento],
              ['Observações', c.observacoes],
            ]} />
          </>
        )}
      </div>
    </div>
  )
}

export default function RelatorioPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const pacienteId = params.id as string
  const registroId = searchParams.get('registro')

  const [paciente, setPaciente] = useState<Paciente | null>(null)
  const [registros, setRegistros] = useState<RegistroClinico[]>([])
  const [clinica, setClinica] = useState<Clinica | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [{ data: p }, { data: cfg }] = await Promise.all([
        supabase.from('pacientes').select('id, nome, data_nascimento, cpf, telefone, email').eq('id', pacienteId).single(),
        supabase.from('configuracoes_clinica').select('*').limit(1).single(),
      ])
      setPaciente(p as Paciente | null)
      if (cfg) setClinica(cfg as Clinica)

      let q = (supabase.from('registros_clinicos') as any)
        .select('*')
        .eq('paciente_id', pacienteId)
        .order('data', { ascending: true })

      if (registroId) q = q.eq('id', registroId)

      const { data: rows } = await q
      setRegistros((rows as RegistroClinico[]) ?? [])
      setLoading(false)
    }
    load()
  }, [pacienteId, registroId])

  if (loading) return <div className="p-8 text-center text-gray-400">Carregando relatório...</div>
  if (!paciente) return <div className="p-8 text-center text-gray-400">Paciente não encontrado.</div>

  const hoje = format(new Date(), "d 'de' MMMM 'de' yyyy", { locale: ptBR })
  const endereco = [clinica?.endereco, clinica?.numero, clinica?.bairro, clinica?.cidade && clinica?.estado ? `${clinica.cidade} – ${clinica.estado}` : clinica?.cidade].filter(Boolean).join(', ')

  return (
    <>
      {/* barra de ações */}
      <div className="print:hidden fixed top-0 left-0 right-0 bg-white border-b border-gray-100 z-10 px-6 py-3 flex items-center gap-4 shadow-sm">
        <button onClick={() => router.back()} className="btn-secondary text-sm">
          <ArrowLeft size={15} /> Voltar
        </button>
        <div className="flex-1" />
        <p className="text-sm text-gray-500">{paciente.nome}</p>
        <button onClick={() => window.print()} className="btn-primary">
          <Printer size={15} /> Imprimir / PDF
        </button>
      </div>

      {/* conteúdo imprimível */}
      <div className="print-body pt-16 print:pt-0">
        <div className="max-w-[700px] mx-auto p-8">
          {/* cabeçalho */}
          <div className="flex items-center gap-5 border-b-2 border-gray-700 pb-4 mb-6">
            <div className="w-20 h-20 shrink-0 flex items-center justify-center">
              {clinica?.logo_base64 ? (
                <img src={clinica.logo_base64} alt="Logo" className="w-20 h-20 object-contain" />
              ) : (
                <div className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-300 text-[10px] print:border-0">
                  logo
                </div>
              )}
            </div>
            <div>
              <h1 className="text-base font-bold text-gray-900">{clinica?.nome ?? 'Consultório Odontológico'}</h1>
              {endereco && <p className="text-xs text-gray-500 mt-0.5">{endereco}</p>}
              {(clinica?.whatsapp || clinica?.telefone) && (
                <p className="text-xs text-gray-500">Tel: {clinica.whatsapp ?? clinica.telefone}</p>
              )}
            </div>
          </div>

          {/* título do relatório */}
          <p className="text-center font-bold text-xs uppercase tracking-widest text-gray-700 mb-1">
            {registroId ? 'Registro Clínico' : 'Relatório de Tratamentos'}
          </p>
          <p className="text-center text-xs text-gray-400 mb-6">Emitido em {hoje}</p>

          {/* dados do paciente */}
          <div className="bg-gray-50 rounded-xl p-4 mb-6 text-sm">
            <p className="font-semibold text-gray-800 mb-1">{paciente.nome}</p>
            <div className="flex flex-wrap gap-x-6 gap-y-0.5 text-xs text-gray-500">
              {paciente.data_nascimento && <span>Nasc.: {format(parseISO(paciente.data_nascimento), 'dd/MM/yyyy')}</span>}
              {paciente.cpf && <span>CPF: {paciente.cpf}</span>}
              {paciente.telefone && <span>Tel: {paciente.telefone}</span>}
              {paciente.email && <span>{paciente.email}</span>}
            </div>
          </div>

          {/* registros */}
          {registros.length === 0 ? (
            <p className="text-center text-sm text-gray-400">Nenhum registro encontrado.</p>
          ) : (
            <div>
              <p className="text-xs text-gray-400 mb-4">{registros.length} registro(s) — em ordem cronológica</p>
              {registros.map((r, i) => <RegistroCard key={r.id} r={r} index={i} />)}
            </div>
          )}

          {/* rodapé */}
          <div className="border-t border-gray-200 mt-10 pt-6 flex justify-between items-end">
            <div className="text-xs text-gray-400">
              <p>{clinica?.nome ?? ''}</p>
            </div>
            <div className="text-center">
              <div className="border-b border-gray-600 w-48 mb-1" />
              <p className="text-xs font-semibold text-gray-700">{clinica?.dentista_nome ?? ''}</p>
              {clinica?.dentista_cro && <p className="text-xs text-gray-500">{clinica.dentista_cro}</p>}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
