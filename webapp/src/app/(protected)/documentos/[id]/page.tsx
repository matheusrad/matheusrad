'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Printer, ArrowLeft } from 'lucide-react'

interface DocRow { id: string; tipo: string; paciente_nome: string | null; numero_documento: string | null; conteudo_texto: string | null; created_at: string }
interface Clinica { nome: string; cro: string | null; telefone: string | null; email: string | null; endereco: string | null; numero: string | null; cidade: string | null; estado: string | null }

const CLINICA_PADRAO: Clinica = { nome: 'Consultório Dra. Lorena Coutinho', cro: null, telefone: null, email: null, endereco: null, numero: null, cidade: null, estado: null }

function Cabecalho({ clinica, numero, data }: { clinica: Clinica; numero: string | null; data: string }) {
  const endereco = [clinica.endereco, clinica.numero, clinica.cidade, clinica.estado].filter(Boolean).join(', ')
  return (
    <div className="border-b-2 border-gray-800 pb-4 mb-6">
      <h1 className="text-xl font-bold text-gray-900">{clinica.nome}</h1>
      {clinica.cro && <p className="text-sm text-gray-600">{clinica.cro}</p>}
      {endereco && <p className="text-sm text-gray-500">{endereco}</p>}
      {clinica.telefone && <p className="text-sm text-gray-500">Tel: {clinica.telefone}</p>}
      {clinica.email && <p className="text-sm text-gray-500">{clinica.email}</p>}
      <div className="flex justify-between mt-3 text-xs text-gray-400 border-t border-gray-200 pt-2">
        <span>Nº {numero ?? '—'}</span>
        <span>{format(parseISO(data), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}</span>
      </div>
    </div>
  )
}

function Rodape({ clinica }: { clinica: Clinica }) {
  return (
    <div className="mt-16 text-center">
      <div className="w-64 mx-auto border-b border-gray-500 mb-2" />
      <p className="text-sm font-semibold">{clinica.nome}</p>
      {clinica.cro && <p className="text-xs text-gray-500">{clinica.cro}</p>}
    </div>
  )
}

function PrintReceituario({ doc, clinica, especial }: { doc: DocRow; clinica: Clinica; especial?: boolean }) {
  const dados = JSON.parse(doc.conteudo_texto ?? '{}')
  const meds: { nome: string; posologia: string }[] = dados.medicamentos ?? []
  return (
    <div>
      <Cabecalho clinica={clinica} numero={doc.numero_documento} data={doc.created_at} />
      <p className="text-center font-bold text-base uppercase tracking-widest mb-6">
        {especial ? 'Receituário Especial' : 'Receituário Médico'}
      </p>
      <p className="text-sm mb-4"><span className="font-medium">Paciente:</span> {doc.paciente_nome}</p>
      {especial && dados.numero_notificacao && (
        <p className="text-sm mb-4"><span className="font-medium">Nº de notificação:</span> {dados.numero_notificacao}</p>
      )}
      <div className="space-y-5 mb-6">
        {meds.map((m, i) => (
          <div key={i}>
            <p className="font-semibold text-sm">{i + 1}. {m.nome}</p>
            <p className="text-sm text-gray-700 ml-4 mt-0.5">{m.posologia}</p>
          </div>
        ))}
      </div>
      {dados.observacoes && (
        <div className="border-t border-gray-200 pt-4 mt-4">
          <p className="text-sm font-medium">Observações:</p>
          <p className="text-sm text-gray-700">{dados.observacoes}</p>
        </div>
      )}
      {especial && (
        <div className="mt-6 text-xs text-gray-400 border border-gray-200 rounded p-3">
          <p>Este receituário é de uso obrigatório para medicamentos sujeitos a controle especial (Portaria SVS/MS nº 344/98).</p>
          <p className="mt-1 font-medium">1ª via: Farmácia · 2ª via: Paciente</p>
        </div>
      )}
      <Rodape clinica={clinica} />
    </div>
  )
}

function PrintAtestado({ doc, clinica }: { doc: DocRow; clinica: Clinica }) {
  const dados = JSON.parse(doc.conteudo_texto ?? '{}')
  const isComp = dados.tipo === 'comparecimento'
  const dataConsulta = dados.data_consulta
    ? format(parseISO(dados.data_consulta), "d 'de' MMMM 'de' yyyy", { locale: ptBR })
    : '—'
  return (
    <div>
      <Cabecalho clinica={clinica} numero={doc.numero_documento} data={doc.created_at} />
      <p className="text-center font-bold text-base uppercase tracking-widest mb-8">Atestado Odontológico</p>
      <p className="text-sm leading-relaxed text-gray-800">
        Atesto para os devidos fins que o(a) paciente <strong>{doc.paciente_nome}</strong>
        {isComp
          ? <> compareceu a esta clínica no dia <strong>{dataConsulta}</strong>{dados.duracao ? <>, pelo período de <strong>{dados.duracao}</strong></> : ''}, para tratamento odontológico.</>
          : <> encontra-se impossibilitado(a) de exercer suas atividades pelo período de <strong>{dados.duracao ?? '—'}</strong>, a partir de <strong>{dataConsulta}</strong>, em decorrência de tratamento odontológico.</>
        }
      </p>
      {dados.cid && <p className="text-sm mt-3 text-gray-600">CID: {dados.cid}</p>}
      {dados.observacoes && <p className="text-sm mt-3 text-gray-600">{dados.observacoes}</p>}
      <Rodape clinica={clinica} />
    </div>
  )
}

function PrintPedidoExame({ doc, clinica }: { doc: DocRow; clinica: Clinica }) {
  const dados = JSON.parse(doc.conteudo_texto ?? '{}')
  const exames: { nome: string; descricao?: string }[] = dados.exames ?? []
  return (
    <div>
      <Cabecalho clinica={clinica} numero={doc.numero_documento} data={doc.created_at} />
      <p className="text-center font-bold text-base uppercase tracking-widest mb-6">
        Solicitação de Exame{dados.urgente ? <span className="text-red-600"> – URGENTE</span> : ''}
      </p>
      <p className="text-sm mb-4"><span className="font-medium">Paciente:</span> {doc.paciente_nome}</p>
      <div className="mb-6">
        <p className="font-medium text-sm mb-3">Exames solicitados:</p>
        <ul className="space-y-2">
          {exames.map((e, i) => (
            <li key={i} className="text-sm">
              <span className="font-medium">{i + 1}. {e.nome}</span>
              {e.descricao && <span className="text-gray-500"> — {e.descricao}</span>}
            </li>
          ))}
        </ul>
      </div>
      {dados.indicacao && (
        <div className="border-t border-gray-200 pt-4">
          <p className="text-sm font-medium">Indicação clínica / Justificativa:</p>
          <p className="text-sm text-gray-700 mt-1">{dados.indicacao}</p>
        </div>
      )}
      <Rodape clinica={clinica} />
    </div>
  )
}

export default function DocumentoPrintPage() {
  const params = useParams()
  const router = useRouter()
  const [doc,     setDoc]     = useState<DocRow | null>(null)
  const [clinica, setClinica] = useState<Clinica>(CLINICA_PADRAO)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      supabase.from('documentos').select('*').eq('id', params.id as string).single(),
      supabase.from('configuracoes_clinica').select('nome,cro,telefone,email,endereco,numero,cidade,estado').limit(1).single(),
    ]).then(([{ data: doc }, { data: cfg }]) => {
      if (doc) setDoc(doc as DocRow)
      if (cfg) setClinica(cfg as Clinica)
      setLoading(false)
    })
  }, [params.id])

  if (loading) return <div className="p-8 text-center text-gray-400">Carregando...</div>
  if (!doc)    return <div className="p-8 text-center text-gray-400">Documento não encontrado.</div>

  function renderDoc() {
    if (!doc) return null
    switch (doc.tipo) {
      case 'receituario':          return <PrintReceituario doc={doc} clinica={clinica} />
      case 'receituario_especial': return <PrintReceituario doc={doc} clinica={clinica} especial />
      case 'atestado':             return <PrintAtestado doc={doc} clinica={clinica} />
      case 'pedido_exame':         return <PrintPedidoExame doc={doc} clinica={clinica} />
      default: return <p>Tipo desconhecido</p>
    }
  }

  return (
    <>
      <div className="print:hidden fixed top-0 left-0 right-0 bg-white border-b border-gray-100 z-10 px-6 py-3 flex items-center gap-4">
        <button onClick={() => router.back()} className="btn-secondary text-sm">
          <ArrowLeft size={15} /> Voltar
        </button>
        <div className="flex-1" />
        <p className="text-sm text-gray-500">{doc.paciente_nome} · {doc.numero_documento}</p>
        <button onClick={() => window.print()} className="btn-primary">
          <Printer size={15} /> Imprimir / PDF
        </button>
      </div>

      <div className="print:mt-0 mt-20 flex justify-center px-4 pb-12">
        <div className="w-full max-w-2xl bg-white shadow-md rounded-xl p-10 print:shadow-none print:rounded-none print:p-0 print:max-w-none">
          {renderDoc()}
        </div>
      </div>

      <style>{`
        @media print {
          @page { size: A4; margin: 20mm 18mm; }
          body { -webkit-print-color-adjust: exact; }
        }
      `}</style>
    </>
  )
}
