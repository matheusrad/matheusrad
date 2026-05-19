'use client'
import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Printer, ArrowLeft, PenLine, Upload, X, RotateCcw } from 'lucide-react'

interface DocRow {
  id: string; tipo: string; paciente_nome: string | null; paciente_id: string | null
  numero_documento: string | null; conteudo_texto: string | null; created_at: string
}
interface PacienteRow {
  id: string; nome: string; telefone: string | null; endereco: string | null
  cpf: string | null; data_nascimento: string | null; email: string | null
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

function Cabecalho({ clinica }: { clinica: Clinica }) {
  const wp = clinica.whatsapp || clinica.telefone
  const enderecoLinha = [
    clinica.endereco, clinica.numero, clinica.complemento,
    clinica.bairro, clinica.cidade && clinica.estado
      ? `${clinica.cidade} - ${clinica.estado}` : (clinica.cidade ?? clinica.estado),
  ].filter(Boolean).join(', ')

  return (
    <div className="flex items-center gap-5 border-b-2 border-gray-700 pb-4 mb-8">
      <div className="w-24 h-24 shrink-0 flex items-center justify-center">
        {clinica.logo_base64 ? (
          <img src={clinica.logo_base64} alt="Logo" className="w-24 h-24 object-contain" />
        ) : (
          <div className="w-24 h-24 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-300 text-[10px] text-center leading-tight print:border-0">
            sem<br/>logo
          </div>
        )}
      </div>
      <div>
        <h1 className="text-lg font-bold text-gray-900 leading-tight">{clinica.nome}</h1>
        {enderecoLinha && <p className="text-xs text-gray-600 mt-0.5">{enderecoLinha}</p>}
        {wp && <p className="text-xs text-gray-600">Telefone: {wp}</p>}
      </div>
    </div>
  )
}

function Assinatura({ clinica, assinatura, data }: { clinica: Clinica; assinatura: string | null; data: string }) {
  const cidade = clinica.cidade ?? ''
  const dataFormatada = format(parseISO(data), "d 'de' MMMM 'de' yyyy", { locale: ptBR })

  return (
    <div className="pt-8">
      <p className="text-sm text-gray-600 mb-6">
        {cidade ? `${cidade}, ` : ''}{dataFormatada}
      </p>
      <div className="flex justify-center">
        <div className="text-center">
          {assinatura ? (
            <img src={assinatura} alt="Assinatura" className="h-14 mx-auto object-contain mb-1" />
          ) : (
            <div className="h-14 mb-1" />
          )}
          <div className="border-b border-gray-600 mb-1.5" />
          <p className="text-sm font-bold text-gray-900 whitespace-nowrap">{clinica.dentista_nome ?? clinica.nome}</p>
          {clinica.dentista_cro && <p className="text-xs text-gray-500 whitespace-nowrap">{clinica.dentista_cro}</p>}
        </div>
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
    <div className="pt-3 text-center text-xs text-gray-400 space-y-0.5">
      {enderecoCompleto && <p>{enderecoCompleto}</p>}
      {wp && <p>WhatsApp / Tel: {wp}</p>}
      {clinica.email && <p>{clinica.email}</p>}
    </div>
  )
}

// ─── tipos de documento ───────────────────────────────────────────────────────

function PrintReceituario({ doc, clinica, assinatura, especial }: { doc: DocRow; clinica: Clinica; assinatura: string | null; paciente?: PacienteRow | null; especial?: boolean }) {
  const dados = JSON.parse(doc.conteudo_texto ?? '{}')
  const meds: { nome: string; posologia: string }[] = dados.medicamentos ?? []
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1">
        <Cabecalho clinica={clinica} />
        <p className="text-center font-bold text-sm uppercase tracking-widest mb-6">
          {especial ? 'Receituário Especial' : 'Receituário'}
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
      </div>
      <Assinatura clinica={clinica} assinatura={assinatura} data={doc.created_at} />
    </div>
  )
}

function PrintAtestado({ doc, clinica, assinatura, paciente }: { doc: DocRow; clinica: Clinica; assinatura: string | null; paciente?: PacienteRow | null }) {
  const dados = JSON.parse(doc.conteudo_texto ?? '{}')
  const isComp = dados.tipo === 'comparecimento'

  const dataConsulta = dados.data_consulta
    ? format(parseISO(dados.data_consulta), "d 'de' MMMM 'de' yyyy", { locale: ptBR })
    : '—'

  const identificacao = [
    paciente?.cpf ? `CPF: ${paciente.cpf}` : null,
    paciente?.data_nascimento
      ? `nascido(a) em ${format(parseISO(paciente.data_nascimento), 'dd/MM/yyyy')}`
      : null,
  ].filter(Boolean).join(', ')

  const horaTexto = dados.hora_inicio && dados.hora_fim
    ? ` no horário das ${dados.hora_inicio} às ${dados.hora_fim}`
    : dados.hora_inicio ? ` a partir das ${dados.hora_inicio}` : ''

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1">
        <Cabecalho clinica={clinica} />

        <p className="text-center font-bold text-sm uppercase tracking-widest mb-10">
          {isComp ? 'Declaração de Comparecimento' : 'Atestado Odontológico'}
        </p>

        {/* Corpo do atestado */}
        <div className="text-sm leading-8 text-gray-800 text-justify">
          {isComp ? (
            <>
              <p>
                Atesto para os devidos fins que o(a) paciente{' '}
                <strong>{doc.paciente_nome}</strong>
                {identificacao ? `, ${identificacao},` : ','}{' '}
                compareceu a esta clínica odontológica no dia{' '}
                <strong>{dataConsulta}</strong>
                {horaTexto && <><strong>{horaTexto}</strong></>},
                para realização de tratamento odontológico
                {dados.procedimento ? ` (${dados.procedimento})` : ''}.
              </p>
              <p className="mt-4">
                O presente documento é emitido a pedido do(a) interessado(a) para os fins que se fizerem necessários, em conformidade com o art. 17, inciso VII, do Código de Ética Odontológica.
              </p>
            </>
          ) : (
            <>
              <p>
                Atesto para os devidos fins que o(a) paciente{' '}
                <strong>{doc.paciente_nome}</strong>
                {identificacao ? `, ${identificacao},` : ','}{' '}
                esteve sob meus cuidados profissionais e encontra-se
                impossibilitado(a) de exercer suas atividades habituais
                pelo período de{' '}
                <strong>{dados.duracao ?? '___'}</strong>,
                a partir de <strong>{dataConsulta}</strong>,
                em decorrência de tratamento odontológico
                {dados.procedimento ? ` (${dados.procedimento})` : ''}.
              </p>
              <p className="mt-4">
                O presente atestado é fornecido para os devidos fins, em conformidade com o art. 17, inciso VII, do Código de Ética Odontológica (Resolução CFO-118/2012).
              </p>
            </>
          )}
        </div>

        {/* CID e observações */}
        {(dados.cid || dados.observacoes) && (
          <div className="mt-6 space-y-1.5">
            {dados.cid && (
              <p className="text-sm text-gray-600">
                <span className="font-semibold">CID-10:</span> {dados.cid}
              </p>
            )}
            {dados.observacoes && (
              <p className="text-sm text-gray-600">
                <span className="font-semibold">Observações:</span> {dados.observacoes}
              </p>
            )}
          </div>
        )}
      </div>

      <Assinatura clinica={clinica} assinatura={assinatura} data={doc.created_at} />
    </div>
  )
}

function PrintPedidoExame({ doc, clinica, assinatura }: { doc: DocRow; clinica: Clinica; assinatura: string | null; paciente?: PacienteRow | null }) {
  const dados = JSON.parse(doc.conteudo_texto ?? '{}')
  const exames: { nome: string; descricao?: string }[] = dados.exames ?? []
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1">
        <Cabecalho clinica={clinica} />
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
      </div>
      <Assinatura clinica={clinica} assinatura={assinatura} data={doc.created_at} />
    </div>
  )
}

// ─── receituário controle especial ───────────────────────────────────────────

const RCE_COR = '#9b2d78'

function ViaRCE({ doc, clinica, assinatura, paciente }: { doc: DocRow; clinica: Clinica; assinatura: string | null; paciente?: PacienteRow | null }) {
  const dados = JSON.parse(doc.conteudo_texto ?? '{}')
  const meds: { nome: string; posologia: string }[] = dados.medicamentos ?? []
  const c = RCE_COR

  const emitenteLinha2 = [clinica.endereco, clinica.numero, clinica.complemento, clinica.bairro].filter(Boolean).join(', ')
  const emitenteLinha3 = [
    clinica.cep,
    clinica.cidade && clinica.estado ? `${clinica.cidade} - ${clinica.estado}` : (clinica.cidade ?? clinica.estado),
  ].filter(Boolean).join(' - ')
  const fone = clinica.whatsapp || clinica.telefone

  return (
    <div style={{ fontFamily: 'Arial, Helvetica, sans-serif', fontSize: '11px', color: '#333' }}>
      {/* Título */}
      <p style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '14px', color: c, marginBottom: '8px', letterSpacing: '1px' }}>
        RECEITUÁRIO CONTROLE ESPECIAL
      </p>

      {/* Emitente + Via */}
      <div style={{ display: 'flex', border: `1.5px solid ${c}`, marginBottom: '10px' }}>
        <div style={{ flex: 1, borderRight: `1px solid ${c}` }}>
          <div style={{ background: '#f8ecf4', textAlign: 'center', fontWeight: 'bold', fontSize: '10px', color: c, padding: '3px 6px', borderBottom: `1px solid ${c}` }}>
            IDENTIFICAÇÃO DO EMITENTE
          </div>
          <div style={{ padding: '8px', textAlign: 'center', color: c, lineHeight: 1.6 }}>
            <p style={{ fontWeight: 'bold' }}>{clinica.dentista_nome ?? clinica.nome}</p>
            <p>Cirurgião-Dentista</p>
            {clinica.dentista_cro && <p>{clinica.dentista_cro}</p>}
            {emitenteLinha2 && <p style={{ marginTop: '4px' }}>{emitenteLinha2}</p>}
            {emitenteLinha3 && <p>{emitenteLinha3}</p>}
            {fone && <p>Fone: {fone}</p>}
          </div>
        </div>
        <div style={{ width: '110px', padding: '10px 8px', color: c, fontSize: '10px', fontWeight: 'bold', lineHeight: 2 }}>
          <p>1ª VIA FARMÁCIA</p>
          <p>2ª VIA PACIENTE</p>
        </div>
      </div>

      {/* Campos do paciente */}
      {[
        { label: 'Paciente:', value: doc.paciente_nome ?? '' },
        { label: 'Endereço:', value: paciente?.endereco ?? '' },
        { label: 'Prescrição:', value: '' },
      ].map(({ label, value }) => (
        <div key={label} style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', marginBottom: '6px' }}>
          <span style={{ color: c, fontWeight: 'bold', whiteSpace: 'nowrap', minWidth: '72px' }}>{label}</span>
          <span style={{ flex: 1, borderBottom: '1px solid #999', paddingBottom: '1px' }}>{value}</span>
        </div>
      ))}

      {/* Medicamentos */}
      <div style={{ minHeight: '56px', marginBottom: '10px' }}>
        {meds.map((m, i) => (
          <div key={i} style={{ marginBottom: '6px' }}>
            <p style={{ fontWeight: 'bold' }}>{i + 1}. {m.nome}</p>
            <p style={{ marginLeft: '14px', color: '#555' }}>{m.posologia}</p>
          </div>
        ))}
        {Array.from({ length: Math.max(0, 6 - meds.length * 2) }).map((_, i) => (
          <div key={i} style={{ borderBottom: '1px solid #ddd', height: '16px', marginBottom: '4px' }} />
        ))}
      </div>

      {/* Data + Assinatura */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '20px', marginBottom: '2px' }}>
        <div style={{ whiteSpace: 'nowrap' }}>
          <span style={{ display: 'inline-block', borderBottom: '1px solid #999', width: '28px' }} />
          {' / '}
          <span style={{ display: 'inline-block', borderBottom: '1px solid #999', width: '28px' }} />
          {' / '}
          <span style={{ display: 'inline-block', borderBottom: '1px solid #999', width: '40px' }} />
        </div>
        <div style={{ flex: 1, borderBottom: '1px solid #999', minHeight: '28px', display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-end' }}>
          {assinatura && <img src={assinatura} alt="Assinatura" style={{ height: '28px', objectFit: 'contain' }} />}
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#888', marginBottom: '12px' }}>
        <span>Data</span>
        <span>Assinatura e Carimbo do Emitente</span>
      </div>

      {/* Comprador + Fornecedor */}
      <div style={{ display: 'flex', border: `1.5px solid ${c}` }}>
        {/* Comprador */}
        <div style={{ flex: 1, borderRight: `1px solid ${c}` }}>
          <div style={{ background: '#f8ecf4', textAlign: 'center', fontWeight: 'bold', fontSize: '10px', color: c, padding: '3px 6px', borderBottom: `1px solid ${c}` }}>
            IDENTIFICAÇÃO DO COMPRADOR
          </div>
          <div style={{ padding: '8px', fontSize: '10px', lineHeight: 1.9 }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3px' }}>
              <span>Nome:</span>
              <span style={{ flex: 1, borderBottom: '1px solid #ccc' }} />
            </div>
            <div style={{ height: '8px' }} />
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3px' }}>
              <span style={{ whiteSpace: 'nowrap' }}>Ident.:</span>
              <span style={{ flex: 1, borderBottom: '1px solid #ccc' }} />
              <span style={{ whiteSpace: 'nowrap', marginLeft: '4px' }}>Org. Emissor:</span>
              <span style={{ width: '36px', borderBottom: '1px solid #ccc' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3px' }}>
              <span>End.:</span>
              <span style={{ flex: 1, borderBottom: '1px solid #ccc' }} />
            </div>
            <div style={{ height: '8px' }} />
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3px' }}>
              <span>Cidade:</span>
              <span style={{ flex: 1, borderBottom: '1px solid #ccc' }} />
              <span style={{ marginLeft: '4px' }}>UF:</span>
              <span style={{ width: '24px', borderBottom: '1px solid #ccc' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3px' }}>
              <span>Telefone:</span>
              <span style={{ flex: 1, borderBottom: '1px solid #ccc' }} />
            </div>
          </div>
        </div>
        {/* Fornecedor */}
        <div style={{ flex: 1 }}>
          <div style={{ background: '#f8ecf4', textAlign: 'center', fontWeight: 'bold', fontSize: '10px', color: c, padding: '3px 6px', borderBottom: `1px solid ${c}` }}>
            IDENTIFICAÇÃO DO FORNECEDOR
          </div>
          <div style={{ height: '68px' }} />
          <div style={{ padding: '0 8px 8px', display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <div style={{ borderBottom: '1px solid #ccc', marginBottom: '3px' }} />
              <p style={{ fontSize: '9px', textAlign: 'center', color: '#666' }}>ASSINATURA DO FARMACÊUTICO</p>
            </div>
            <div style={{ width: '48px' }}>
              <div style={{ borderBottom: '1px solid #ccc', marginBottom: '3px' }} />
              <p style={{ fontSize: '9px', textAlign: 'center', color: '#666' }}>DATA</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function PrintReceituarioControleEspecial({ doc, clinica, assinatura, paciente }: { doc: DocRow; clinica: Clinica; assinatura: string | null; paciente?: PacienteRow | null }) {
  return (
    <>
      <ViaRCE doc={doc} clinica={clinica} assinatura={assinatura} paciente={paciente} />
      <div className="rce-separador">
        ✂ · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · ·
      </div>
      <ViaRCE doc={doc} clinica={clinica} assinatura={assinatura} paciente={paciente} />
    </>
  )
}

// ─── página principal ─────────────────────────────────────────────────────────

export default function DocumentoPrintPage() {
  const params = useParams()
  const router = useRouter()
  const [doc,       setDoc]       = useState<DocRow | null>(null)
  const [clinica,   setClinica]   = useState<Clinica>(CLINICA_PADRAO)
  const [paciente,  setPaciente]  = useState<PacienteRow | null>(null)
  const [assinatura, setAssinatura] = useState<string | null>(null)
  const [loading,   setLoading]   = useState(true)

  useEffect(() => {
    Promise.all([
      supabase.from('documentos').select('*').eq('id', params.id as string).single(),
      supabase.from('configuracoes_clinica').select('*').limit(1).single(),
    ]).then(async ([{ data: docData }, { data: cfg }]) => {
      const doc = docData as DocRow | null
      if (doc) {
        setDoc(doc)
        if (doc.paciente_id) {
          const { data: p } = await supabase
            .from('pacientes')
            .select('id, nome, telefone, endereco, cpf, data_nascimento, email')
            .eq('id', doc.paciente_id)
            .single()
          if (p) setPaciente(p as PacienteRow)
        }
      }
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
    const props = { doc, clinica, assinatura, paciente }
    switch (doc.tipo) {
      case 'receituario':                   return <PrintReceituario {...props} />
      case 'receituario_especial':          return <PrintReceituario {...props} especial />
      case 'receituario_controle_especial': return <PrintReceituarioControleEspecial {...props} />
      case 'atestado':                      return <PrintAtestado {...props} />
      case 'pedido_exame':                  return <PrintPedidoExame {...props} />
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
          <div className="bg-white shadow-xl rounded-sm p-[18mm] min-h-[297mm] flex flex-col">
            <div className="flex-1 flex flex-col">
              {renderDoc()}
            </div>
            <Rodape clinica={clinica} />
          </div>
        </div>
      </div>

      {/* Versão que será impressa */}
      <div className={`hidden print:block print-body${doc.tipo === 'receituario_controle_especial' ? ' print-body--rce' : ''}`}>
        {renderDoc()}
      </div>

      {/* Número de página — só na impressão */}
      <div className="page-num hidden">1</div>

      <style>{`
        @media print {
          @page { size: A4; margin: 0; }
          body {
            -webkit-print-color-adjust: exact;
            background: white;
          }
          * { box-shadow: none !important; }
          .print-body {
            padding: 18mm 18mm 32mm;
            height: 297mm;
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
          }
          .print-body--rce {
            height: auto;
            min-height: 297mm;
            display: block;
            padding: 14mm 18mm;
          }
          .rce-separador {
            text-align: center;
            font-size: 9px;
            color: #bbb;
            margin: 8px 0;
            letter-spacing: 1px;
          }
          .rodape-print {
            display: block !important;
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            padding: 6px 18mm 10px;
            background: white;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            font-size: 11px;
            color: #9ca3af;
            line-height: 1.7;
          }
          .page-num {
            display: block !important;
            position: fixed;
            bottom: 4mm;
            right: 18mm;
            font-size: 10px;
            color: #d1d5db;
          }
        }
      `}</style>

      {/* Rodapé fixo na impressão — oculto no RCE (tem própria estrutura) */}
      {doc.tipo !== 'receituario_controle_especial' && (
        <div className="rodape-print" style={{ display: 'none' }}>
          <Rodape clinica={clinica} />
        </div>
      )}
    </>
  )
}
