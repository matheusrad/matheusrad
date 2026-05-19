'use client'
import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Printer, ArrowLeft, PenLine, Upload, X, RotateCcw } from 'lucide-react'

interface DocRow {
  id: string; tipo: string; paciente_nome: string | null
  numero_documento: string | null; conteudo_texto: string | null; created_at: string
}
interface Clinica {
  nome: string; cnpj: string | null; cro: string | null; telefone: string | null; whatsapp: string | null
  email: string | null; cep: string | null; endereco: string | null; numero: string | null
  complemento: string | null; bairro: string | null; cidade: string | null; estado: string | null
  dentista_nome: string | null; dentista_cro: string | null; assinatura_base64: string | null
  emitir_recibo: string | null; logo_base64: string | null
}

const CLINICA_PADRAO: Clinica = {
  nome: 'Consultório Dra. Lorena Coutinho', cnpj: null, cro: null, telefone: null, whatsapp: null,
  email: null, cep: null, endereco: null, numero: null, complemento: null,
  bairro: null, cidade: null, estado: null,
  dentista_nome: 'Dra. Lorena Coutinho', dentista_cro: null, assinatura_base64: null,
  emitir_recibo: 'dentista', logo_base64: null,
}

// ─── pad de assinatura ────────────────────────────────────────────────────────

function SignaturePad({ value, onChange }: { value: string | null; onChange: (b64: string | null) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawing   = useRef(false)
  const [mode,    setMode]  = useState<'draw' | 'upload' | null>(null)

  function getPos(e: React.MouseEvent | React.TouchEvent) {
    const rect = canvasRef.current!.getBoundingClientRect()
    const src  = 'touches' in e ? e.touches[0] : e
    return { x: src.clientX - rect.left, y: src.clientY - rect.top }
  }

  function start(e: React.MouseEvent | React.TouchEvent) {
    drawing.current = true
    const ctx = canvasRef.current!.getContext('2d')!
    const { x, y } = getPos(e)
    ctx.beginPath(); ctx.moveTo(x, y)
  }

  function move(e: React.MouseEvent | React.TouchEvent) {
    if (!drawing.current) return
    e.preventDefault()
    const ctx = canvasRef.current!.getContext('2d')!
    const { x, y } = getPos(e)
    ctx.lineTo(x, y)
    ctx.strokeStyle = '#1e293b'; ctx.lineWidth = 2; ctx.lineCap = 'round'
    ctx.stroke()
  }

  function stop() {
    drawing.current = false
    onChange(canvasRef.current!.toDataURL())
  }

  function limpar() {
    const ctx = canvasRef.current!.getContext('2d')!
    ctx.clearRect(0, 0, canvasRef.current!.width, canvasRef.current!.height)
    onChange(null)
  }

  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = ev => onChange(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  if (!mode) return (
    <div className="flex gap-2 print:hidden">
      <button onClick={() => setMode('draw')} className="btn-secondary text-xs">
        <PenLine size={13} /> Desenhar assinatura
      </button>
      <label className="btn-secondary text-xs cursor-pointer">
        <Upload size={13} /> Carregar imagem
        <input type="file" accept="image/*" className="hidden" onChange={handleUpload} />
      </label>
    </div>
  )

  if (mode === 'upload') return null

  return (
    <div className="print:hidden space-y-2">
      <canvas
        ref={canvasRef} width={400} height={80}
        className="border border-gray-200 rounded-lg cursor-crosshair touch-none w-full"
        onMouseDown={start} onMouseMove={move} onMouseUp={stop} onMouseLeave={stop}
        onTouchStart={start} onTouchMove={move} onTouchEnd={stop}
      />
      <div className="flex gap-2">
        <button onClick={limpar} className="btn-secondary text-xs"><RotateCcw size={12} /> Limpar</button>
        <button onClick={() => { limpar(); setMode(null) }} className="btn-secondary text-xs"><X size={12} /> Cancelar</button>
      </div>
    </div>
  )
}

// ─── componentes do documento ─────────────────────────────────────────────────

function Cabecalho({ clinica, data }: { clinica: Clinica; data: string }) {
  return (
    <div className="flex items-center justify-between border-b-2 border-gray-800 pb-4 mb-6">
      {/* Esquerda: nome da clínica */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">{clinica.nome}</h1>
        {clinica.email && <p className="text-xs text-gray-400 mt-0.5">{clinica.email}</p>}
      </div>

      {/* Direita: logo + data */}
      <div className="flex flex-col items-end gap-1">
        {clinica.logo_base64 ? (
          <img src={clinica.logo_base64} alt="Logo" className="h-12 object-contain" />
        ) : (
          <div className="h-12 w-12 rounded-lg bg-blue-50 flex items-center justify-center text-blue-300 text-xs">logo</div>
        )}
        <p className="text-xs text-gray-400">
          {format(parseISO(data), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
        </p>
      </div>
    </div>
  )
}

function Assinatura({ clinica, assinatura }: { clinica: Clinica; assinatura: string | null }) {
  return (
    <div className="mt-16 flex justify-center">
      <div className="text-center w-72">
        {assinatura ? (
          <img src={assinatura} alt="Assinatura" className="h-16 mx-auto object-contain mb-1" />
        ) : (
          <div className="h-16 mb-1" />
        )}
        <div className="border-b border-gray-600 mb-2" />
        <p className="text-base font-bold text-gray-900">{clinica.dentista_nome ?? clinica.nome}</p>
        {clinica.dentista_cro && <p className="text-sm text-gray-500">{clinica.dentista_cro}</p>}
      </div>
    </div>
  )
}

function Rodape({ clinica }: { clinica: Clinica }) {
  const enderecoCompleto = [
    clinica.endereco, clinica.numero, clinica.complemento,
    clinica.bairro, clinica.cidade && clinica.estado ? `${clinica.cidade} – ${clinica.estado}` : clinica.cidade,
    clinica.cep,
  ].filter(Boolean).join(', ')
  const wp = clinica.whatsapp || clinica.telefone
  return (
    <div className="border-t border-gray-200 pt-3 text-center text-xs text-gray-400 space-y-0.5">
      {enderecoCompleto && <p>{enderecoCompleto}</p>}
      {wp && <p>WhatsApp / Tel: {wp}</p>}
      {clinica.email && <p>{clinica.email}</p>}
    </div>
  )
}

// ─── tipos de documento ───────────────────────────────────────────────────────

function PrintReceituario({ doc, clinica, assinatura, especial }: { doc: DocRow; clinica: Clinica; assinatura: string | null; especial?: boolean }) {
  const dados = JSON.parse(doc.conteudo_texto ?? '{}')
  const meds: { nome: string; posologia: string }[] = dados.medicamentos ?? []
  return (
    <div>
      <Cabecalho clinica={clinica} data={doc.created_at} />
      <p className="text-center font-bold text-sm uppercase tracking-widest mb-6">
        {especial ? 'Receituário Especial' : 'Receituário Médico'}
      </p>
      <p className="text-sm mb-5"><span className="font-medium">Paciente:</span> {doc.paciente_nome}</p>
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
        <div className="border-t border-gray-100 pt-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Observações</p>
          <p className="text-sm text-gray-700">{dados.observacoes}</p>
        </div>
      )}
      {especial && (
        <p className="mt-6 text-xs text-gray-400 border border-gray-200 rounded p-3">
          Receituário de uso obrigatório para medicamentos sujeitos a controle especial (Portaria SVS/MS nº 344/98).<br />
          <strong>1ª via: Farmácia · 2ª via: Paciente</strong>
        </p>
      )}
      <Assinatura clinica={clinica} assinatura={assinatura} />
    </div>
  )
}

function PrintAtestado({ doc, clinica, assinatura }: { doc: DocRow; clinica: Clinica; assinatura: string | null }) {
  const dados = JSON.parse(doc.conteudo_texto ?? '{}')
  const isComp = dados.tipo === 'comparecimento'
  const dataConsulta = dados.data_consulta
    ? format(parseISO(dados.data_consulta), "d 'de' MMMM 'de' yyyy", { locale: ptBR })
    : '—'
  return (
    <div>
      <Cabecalho clinica={clinica} data={doc.created_at} />
      <p className="text-center font-bold text-sm uppercase tracking-widest mb-8">Atestado Odontológico</p>
      <p className="text-sm leading-7 text-gray-800">
        Atesto para os devidos fins que o(a) paciente <strong>{doc.paciente_nome}</strong>
        {isComp
          ? <> compareceu a esta clínica no dia <strong>{dataConsulta}</strong>
              {dados.duracao && <>, pelo período de <strong>{dados.duracao}</strong></>},
              para tratamento odontológico.</>
          : <> encontra-se impossibilitado(a) de exercer suas atividades pelo período de{' '}
              <strong>{dados.duracao ?? '—'}</strong>, a partir de <strong>{dataConsulta}</strong>,
              em decorrência de tratamento odontológico.</>
        }
      </p>
      {dados.cid && <p className="text-sm mt-3 text-gray-500">CID: {dados.cid}</p>}
      {dados.observacoes && <p className="text-sm mt-2 text-gray-500">{dados.observacoes}</p>}
      <Assinatura clinica={clinica} assinatura={assinatura} />
    </div>
  )
}

function PrintPedidoExame({ doc, clinica, assinatura }: { doc: DocRow; clinica: Clinica; assinatura: string | null }) {
  const dados = JSON.parse(doc.conteudo_texto ?? '{}')
  const exames: { nome: string; descricao?: string }[] = dados.exames ?? []
  return (
    <div>
      <Cabecalho clinica={clinica} data={doc.created_at} />
      <p className="text-center font-bold text-sm uppercase tracking-widest mb-6">
        Solicitação de Exame{dados.urgente ? ' – URGENTE' : ''}
      </p>
      <p className="text-sm mb-5"><span className="font-medium">Paciente:</span> {doc.paciente_nome}</p>
      <div className="mb-6">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Exames solicitados</p>
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
        <div className="border-t border-gray-100 pt-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Indicação clínica</p>
          <p className="text-sm text-gray-700">{dados.indicacao}</p>
        </div>
      )}
      <Assinatura clinica={clinica} assinatura={assinatura} />
    </div>
  )
}

// ─── página principal ─────────────────────────────────────────────────────────

export default function DocumentoPrintPage() {
  const params = useParams()
  const router = useRouter()
  const [doc,       setDoc]       = useState<DocRow | null>(null)
  const [clinica,   setClinica]   = useState<Clinica>(CLINICA_PADRAO)
  const [assinatura, setAssinatura] = useState<string | null>(null)
  const [loading,   setLoading]   = useState(true)

  useEffect(() => {
    Promise.all([
      supabase.from('documentos').select('*').eq('id', params.id as string).single(),
      supabase.from('configuracoes_clinica').select('*').limit(1).single(),
    ]).then(([{ data: doc }, { data: cfg }]) => {
      if (doc) setDoc(doc as DocRow)
      if (cfg) {
        setClinica(cfg as Clinica)
        if ((cfg as Clinica).assinatura_base64) setAssinatura((cfg as Clinica).assinatura_base64)
      }
      setLoading(false)
    })
  }, [params.id])

  async function salvarAssinatura(b64: string | null) {
    setAssinatura(b64)
    if (clinica) {
      await supabase.from('configuracoes_clinica').update({ assinatura_base64: b64 }).eq('id', (clinica as any).id)
    }
  }

  if (loading) return <div className="p-8 text-center text-gray-400">Carregando...</div>
  if (!doc)    return <div className="p-8 text-center text-gray-400">Documento não encontrado.</div>

  function renderDoc() {
    if (!doc) return null
    const props = { doc, clinica, assinatura }
    switch (doc.tipo) {
      case 'receituario':          return <PrintReceituario {...props} />
      case 'receituario_especial': return <PrintReceituario {...props} especial />
      case 'atestado':             return <PrintAtestado {...props} />
      case 'pedido_exame':         return <PrintPedidoExame {...props} />
      default: return <p>Tipo desconhecido</p>
    }
  }

  return (
    <>
      {/* Barra de ações */}
      <div className="print:hidden fixed top-0 left-0 right-0 bg-white border-b border-gray-100 z-10 px-6 py-3 flex items-center gap-4 shadow-sm">
        <button onClick={() => router.back()} className="btn-secondary text-sm">
          <ArrowLeft size={15} /> Voltar
        </button>
        <div className="flex-1" />
        <p className="text-sm text-gray-500">{doc.paciente_nome} · {doc.numero_documento}</p>
        <button onClick={() => window.print()} className="btn-primary">
          <Printer size={15} /> Imprimir / Baixar PDF
        </button>
      </div>

      {/* Assinatura digital (acima do documento) */}
      <div className="print:hidden mt-20 max-w-2xl mx-auto px-4 mb-4">
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 space-y-2">
          <p className="text-sm font-medium text-blue-800">Assinatura digital da dentista</p>
          <p className="text-xs text-blue-600">Desenhe ou carregue a assinatura — ela será salva e aparecerá em todos os documentos.</p>
          <SignaturePad value={assinatura} onChange={salvarAssinatura} />
          {assinatura && (
            <div className="flex items-center gap-3">
              <img src={assinatura} alt="Assinatura" className="h-10 border border-gray-200 rounded bg-white px-2" />
              <button onClick={() => salvarAssinatura(null)} className="text-xs text-red-500 hover:underline">Remover</button>
            </div>
          )}
        </div>
      </div>

      {/* Prévia do documento — fundo cinza simulando folha A4 */}
      <div className="print:hidden bg-gray-100 min-h-screen flex justify-center pt-6 pb-16 px-4">
        <div className="w-full max-w-[210mm]">
          <p className="text-xs text-gray-400 text-center mb-3">Prévia do documento · A4</p>
          {/* papel A4: flex column para empurrar rodapé pro fundo */}
          <div className="bg-white shadow-xl rounded-sm p-[18mm] min-h-[297mm] flex flex-col">
            <div className="flex-1">
              {renderDoc()}
            </div>
            <Rodape clinica={clinica} />
          </div>
        </div>
      </div>

      {/* Versão que será impressa — sem fundo cinza */}
      <div className="hidden print:block">
        {renderDoc()}
      </div>

      <style>{`
        @media print {
          @page { size: A4; margin: 20mm 18mm 28mm; }
          body { -webkit-print-color-adjust: exact; background: white; }
          * { box-shadow: none !important; }
          .rodape-print {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            padding: 8px 18mm 12px;
            background: white;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            font-size: 11px;
            color: #9ca3af;
            line-height: 1.6;
          }
        }
      `}</style>

      {/* Rodapé fixo apenas na impressão */}
      <div className="rodape-print hidden">
        {(() => {
          const enderecoCompleto = [
            clinica.endereco, clinica.numero, clinica.complemento,
            clinica.bairro, clinica.cidade && clinica.estado ? `${clinica.cidade} – ${clinica.estado}` : clinica.cidade,
            clinica.cep,
          ].filter(Boolean).join(', ')
          const wp = clinica.whatsapp || clinica.telefone
          return (
            <>
              {enderecoCompleto && <p>{enderecoCompleto}</p>}
              {wp && <p>WhatsApp / Tel: {wp}</p>}
              {clinica.email && <p>{clinica.email}</p>}
            </>
          )
        })()}
      </div>
    </>
  )
}
