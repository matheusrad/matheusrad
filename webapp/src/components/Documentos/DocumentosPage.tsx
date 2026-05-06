'use client'
import { useState, useEffect } from 'react'
import { FileText, Plus, Search, Download, Eye, Printer, Filter, AlertCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Documento } from '@/types/database'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import clsx from 'clsx'

type TipoFiltro = 'todos' | 'prescricao' | 'laudo' | 'anamnese'

const tipoConfig: Record<string, { label: string; color: string }> = {
  prescricao: { label: 'Prescrição', color: 'badge-blue' },
  laudo:      { label: 'Laudo',      color: 'badge-purple' },
  anamnese:   { label: 'Anamnese',   color: 'badge-green' },
}

export function DocumentosPage() {
  const [tipo, setTipo] = useState<TipoFiltro>('todos')
  const [busca, setBusca] = useState('')
  const [docs, setDocs] = useState<Documento[]>([])
  const [loading, setLoading] = useState(true)
  const [showNovoModal, setShowNovoModal] = useState(false)
  const [novoTipo, setNovoTipo] = useState<'prescricao' | 'laudo'>('prescricao')
  const [pacienteNome, setPacienteNome] = useState('')
  const [conteudo, setConteudo] = useState('')
  const [gerando, setGerando] = useState(false)

  useEffect(() => {
    let query = supabase.from('documentos').select('*').order('created_at', { ascending: false })
    if (tipo !== 'todos') query = query.eq('tipo', tipo)
    query.limit(50).then(({ data }) => {
      setDocs(data || [])
      setLoading(false)
    })
  }, [tipo])

  const docsFiltrados = docs.filter(d =>
    d.paciente_nome?.toLowerCase().includes(busca.toLowerCase()) ||
    d.numero_documento?.includes(busca)
  )

  async function gerarDocumento() {
    if (!pacienteNome.trim() || !conteudo.trim()) return
    setGerando(true)
    await new Promise(r => setTimeout(r, 1500))
    const novo: Partial<Documento> = {
      tipo: novoTipo,
      paciente_nome: pacienteNome,
      numero_documento: `${novoTipo === 'prescricao' ? 'RX' : 'LD'}-${Date.now()}`,
      conteudo_texto: conteudo,
    }
    const { data } = await supabase.from('documentos').insert(novo).select().single()
    if (data) setDocs(prev => [data, ...prev])
    setGerando(false)
    setShowNovoModal(false)
    setPacienteNome('')
    setConteudo('')
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Documentos</h1>
        <button onClick={() => setShowNovoModal(true)} className="btn-primary">
          <Plus size={15} /> Novo documento
        </button>
      </div>

      {/* Filtros */}
      <div className="card mb-4 px-4 py-3 flex items-center gap-3 flex-wrap">
        <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
          {(['todos', 'prescricao', 'laudo', 'anamnese'] as TipoFiltro[]).map(t => (
            <button key={t} onClick={() => setTipo(t)}
              className={clsx('px-3 py-1.5 text-xs font-medium rounded-md transition-colors capitalize',
                t === tipo ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500 hover:text-gray-700')}>
              {t === 'todos' ? 'Todos' : tipoConfig[t]?.label}
            </button>
          ))}
        </div>
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="input pl-8 text-sm w-full"
            placeholder="Buscar por paciente ou número..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
          />
        </div>
      </div>

      {/* Lista */}
      <div className="card divide-y divide-gray-50">
        {loading ? (
          <div className="p-8 text-center text-sm text-gray-400">Carregando...</div>
        ) : docsFiltrados.length === 0 ? (
          <div className="p-16 text-center">
            <FileText size={40} className="mx-auto mb-3 text-gray-200" />
            <p className="text-sm text-gray-400">Nenhum documento encontrado</p>
          </div>
        ) : docsFiltrados.map(doc => {
          const cfg = tipoConfig[doc.tipo] || { label: doc.tipo, color: 'badge' }
          return (
            <div key={doc.id} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
                <FileText size={18} className="text-blue-500" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-gray-900 text-sm">{doc.paciente_nome || '—'}</p>
                  <span className={clsx('badge border', cfg.color)}>{cfg.label}</span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  Nº {doc.numero_documento || '—'} · {doc.created_at ? format(parseISO(doc.created_at), "d 'de' MMMM 'de' yyyy", { locale: ptBR }) : ''}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {doc.link_pdf ? (
                  <>
                    <a href={doc.link_pdf} target="_blank" rel="noopener noreferrer"
                      className="btn-secondary text-xs py-1.5 px-3">
                      <Eye size={13} /> Visualizar
                    </a>
                    <a href={doc.link_pdf} download className="btn-secondary text-xs py-1.5 px-3">
                      <Download size={13} /> Baixar
                    </a>
                  </>
                ) : (
                  <span className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2.5 py-1.5 rounded-lg border border-amber-100">
                    <AlertCircle size={12} /> PDF não gerado
                  </span>
                )}
                <button className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors" title="Imprimir">
                  <Printer size={15} className="text-gray-400" />
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Modal novo documento */}
      {showNovoModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={e => { if (e.target === e.currentTarget) setShowNovoModal(false) }}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
            <div className="px-6 py-5 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Novo documento</h2>
              <p className="text-xs text-gray-500 mt-0.5">Gerado automaticamente com IA</p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Tipo de documento</label>
                <div className="flex gap-3">
                  {(['prescricao', 'laudo'] as const).map(t => (
                    <button key={t} onClick={() => setNovoTipo(t)}
                      className={clsx('flex-1 py-2.5 text-sm font-medium rounded-lg border transition-colors capitalize',
                        novoTipo === t ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:border-gray-300')}>
                      {tipoConfig[t].label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nome do paciente</label>
                <input className="input w-full" placeholder="Nome completo" value={pacienteNome} onChange={e => setPacienteNome(e.target.value)} />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {novoTipo === 'prescricao' ? 'Medicamentos e posologia' : 'Diagnóstico e conclusão'}
                </label>
                <textarea
                  className="input w-full resize-none"
                  rows={5}
                  placeholder={novoTipo === 'prescricao'
                    ? 'Ex: Amoxicilina 500mg - 1 cápsula de 8 em 8 horas por 7 dias...'
                    : 'Ex: Paciente apresenta periodontite leve no quadrante...'
                  }
                  value={conteudo}
                  onChange={e => setConteudo(e.target.value)}
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex gap-3 justify-end">
              <button onClick={() => setShowNovoModal(false)} className="btn-secondary">Cancelar</button>
              <button onClick={gerarDocumento} disabled={!pacienteNome.trim() || !conteudo.trim() || gerando} className="btn-primary disabled:opacity-40">
                {gerando ? 'Gerando...' : 'Gerar documento'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
