'use client'
import { useState, useEffect, useRef } from 'react'
import { Search, Send, Phone, Smartphone, Clock, CheckCheck, Bot, Plus } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Mensagem } from '@/types/database'
import { format, parseISO, isToday, isYesterday } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import clsx from 'clsx'

type Tab = 'mensagens' | 'campanhas' | 'historico'

interface Conversa {
  telefone: string
  nome: string
  ultimaMensagem: string
  hora: string
  naoLidas: number
  foto?: string
}

function formatHora(iso: string) {
  const d = parseISO(iso)
  if (isToday(d)) return format(d, 'HH:mm')
  if (isYesterday(d)) return 'Ontem'
  return format(d, 'dd/MM')
}

function BolhaMsg({ msg }: { msg: Mensagem }) {
  const enviada = msg.direcao === 'enviada'
  return (
    <div className={clsx('flex', enviada ? 'justify-end' : 'justify-start')}>
      {!enviada && (
        <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-xs font-semibold text-gray-600 shrink-0 mr-2 mt-1">
          P
        </div>
      )}
      <div className={clsx(
        'max-w-[70%] px-3 py-2 rounded-2xl text-sm',
        enviada
          ? 'bg-blue-600 text-white rounded-tr-sm'
          : 'bg-white border border-gray-100 text-gray-800 rounded-tl-sm'
      )}>
        {msg.texto}
        <div className={clsx('flex items-center gap-1 mt-1', enviada ? 'justify-end' : 'justify-start')}>
          <span className={clsx('text-[10px]', enviada ? 'text-blue-200' : 'text-gray-400')}>
            {format(parseISO(msg.created_at), 'HH:mm')}
          </span>
          {enviada && <CheckCheck size={11} className="text-blue-200" />}
          {msg.intencao_detectada && !enviada && (
            <span className="ml-1 text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
              {msg.intencao_detectada}
            </span>
          )}
        </div>
      </div>
      {enviada && (
        <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-xs shrink-0 ml-2 mt-1">
          <Bot size={13} className="text-blue-600" />
        </div>
      )}
    </div>
  )
}

export function MensagensPage() {
  const [tab, setTab] = useState<Tab>('mensagens')
  const [busca, setBusca] = useState('')
  const [conversas, setConversas] = useState<Conversa[]>([])
  const [telefoneAtivo, setTelefoneAtivo] = useState<string | null>(null)
  const [mensagens, setMensagens] = useState<Mensagem[]>([])
  const [loading, setLoading] = useState(true)
  const [msgTexto, setMsgTexto] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function loadConversas() {
      setLoading(true)
      const { data } = await supabase
        .from('historico_mensagens')
        .select('*, pacientes(nome)')
        .order('created_at', { ascending: false })
        .limit(200)

      if (!data) { setLoading(false); return }

      // Agrupa por telefone
      const map = new Map<string, Conversa>()
      data.forEach((m: any) => {
        if (!map.has(m.telefone)) {
          map.set(m.telefone, {
            telefone: m.telefone,
            nome: m.pacientes?.nome || m.telefone,
            ultimaMensagem: m.texto || '',
            hora: formatHora(m.created_at),
            naoLidas: 0,
          })
        }
      })
      setConversas(Array.from(map.values()))
      setLoading(false)
    }
    loadConversas()
  }, [])

  useEffect(() => {
    if (!telefoneAtivo) return
    supabase.from('historico_mensagens')
      .select('*')
      .eq('telefone', telefoneAtivo)
      .order('created_at')
      .limit(100)
      .then(({ data }) => {
        setMensagens(data || [])
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
      })
  }, [telefoneAtivo])

  const conversasFiltradas = conversas.filter(c =>
    c.nome.toLowerCase().includes(busca.toLowerCase()) ||
    c.telefone.includes(busca)
  )

  const nomeAtivo = conversas.find(c => c.telefone === telefoneAtivo)?.nome || telefoneAtivo

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Central de mensagens</h1>
        <div className="flex items-center gap-3 text-sm text-gray-500">
          <span className="flex items-center gap-1.5">
            <Smartphone size={14} className="text-green-500" />
            {conversas.length} conversas ativas
          </span>
          <span className="flex items-center gap-1.5">
            <Clock size={14} className="text-blue-500" />
            Saldo: automático via n8n
          </span>
        </div>
      </div>

      <div className="card flex h-[calc(100vh-180px)]">
        {/* Sidebar conversas */}
        <div className="w-72 border-r border-gray-100 flex flex-col shrink-0">
          {/* Tabs */}
          <div className="flex gap-4 px-4 border-b border-gray-100">
            {([
              ['mensagens', 'Mensagens'],
              ['campanhas', 'Campanhas automáticas'],
              ['historico', 'Histórico de envio'],
            ] as [Tab, string][]).map(([t, label]) => (
              <button key={t} onClick={() => setTab(t)}
                className={clsx('text-xs py-3 border-b-2 transition-colors font-medium',
                  t === tab ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'
                )}>
                {label}
              </button>
            ))}
          </div>

          {tab === 'mensagens' && (
            <>
              {/* Busca */}
              <div className="p-3 border-b border-gray-50">
                <div className="relative">
                  <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    className="input pl-8 text-xs"
                    placeholder="Procurar"
                    value={busca}
                    onChange={e => setBusca(e.target.value)}
                  />
                </div>
              </div>

              {/* Lista de conversas */}
              <div className="flex-1 overflow-y-auto">
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 px-4 py-3 animate-pulse">
                      <div className="w-9 h-9 bg-gray-100 rounded-full shrink-0" />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-3 bg-gray-100 rounded w-28" />
                        <div className="h-2.5 bg-gray-50 rounded w-40" />
                      </div>
                    </div>
                  ))
                ) : conversasFiltradas.length === 0 ? (
                  <div className="py-10 text-center text-xs text-gray-400">
                    {busca ? 'Nenhuma conversa encontrada' : 'Nenhuma mensagem ainda'}
                  </div>
                ) : (
                  conversasFiltradas.map(c => (
                    <button
                      key={c.telefone}
                      onClick={() => setTelefoneAtivo(c.telefone)}
                      className={clsx(
                        'w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors',
                        c.telefone === telefoneAtivo && 'bg-blue-50'
                      )}
                    >
                      <div className="w-9 h-9 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-sm font-semibold shrink-0">
                        {c.nome.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline">
                          <span className="text-sm font-medium text-gray-900 truncate">{c.nome}</span>
                          <span className="text-[10px] text-gray-400 shrink-0 ml-1">{c.hora}</span>
                        </div>
                        <p className="text-xs text-gray-500 truncate">{c.ultimaMensagem}</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </>
          )}

          {tab === 'campanhas' && (
            <div className="flex-1 flex items-center justify-center p-6 text-center">
              <div>
                <Bot size={32} className="mx-auto mb-2 text-gray-300" />
                <p className="text-xs text-gray-500 mb-3">
                  Campanhas automáticas são gerenciadas pelos workflows n8n:
                  confirmação semanal, aniversários, retornos semestrais.
                </p>
                <a href="http://localhost:5678" target="_blank" rel="noopener noreferrer"
                  className="btn-secondary text-xs">
                  Abrir n8n
                </a>
              </div>
            </div>
          )}

          {tab === 'historico' && (
            <div className="flex-1 overflow-y-auto p-4 text-xs text-gray-500">
              <p className="mb-2 font-medium text-gray-700">Últimas campanhas enviadas</p>
              <p className="text-gray-400">Ver tabela historico_mensagens no Supabase para relatório completo.</p>
            </div>
          )}
        </div>

        {/* Chat */}
        <div className="flex-1 flex flex-col">
          {!telefoneAtivo ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                <Phone size={28} className="text-blue-400" />
              </div>
              <p className="text-gray-500 text-sm">
                Acompanhe e responda os pacientes que<br />
                entraram em contato através da central de<br />
                mensagens automáticas
              </p>
            </div>
          ) : (
            <>
              {/* Header do chat */}
              <div className="flex items-center gap-3 px-5 py-3.5 border-b border-gray-100">
                <div className="w-9 h-9 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-semibold text-sm">
                  {(nomeAtivo || '?').charAt(0)}
                </div>
                <div>
                  <p className="font-medium text-gray-900 text-sm">{nomeAtivo}</p>
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <Phone size={11} /> {telefoneAtivo}
                  </p>
                </div>
                <div className="ml-auto flex gap-2">
                  <a href={`https://wa.me/${telefoneAtivo}`} target="_blank" rel="noopener noreferrer"
                    className="btn-secondary text-xs">
                    <Phone size={13} /> Abrir WhatsApp
                  </a>
                </div>
              </div>

              {/* Mensagens */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 bg-gray-50">
                {mensagens.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-8">Nenhuma mensagem registrada</p>
                ) : mensagens.map(m => (
                  <BolhaMsg key={m.id} msg={m} />
                ))}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <div className="px-4 py-3 border-t border-gray-100 flex gap-2">
                <input
                  className="input flex-1"
                  placeholder="Digite uma mensagem..."
                  value={msgTexto}
                  onChange={e => setMsgTexto(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault() /* enviar */ } }}
                />
                <button
                  disabled={!msgTexto.trim()}
                  className="btn-primary disabled:opacity-40"
                  onClick={async () => {
                    if (!msgTexto.trim() || !telefoneAtivo) return
                    await supabase.from('historico_mensagens').insert({
                      telefone: telefoneAtivo,
                      direcao: 'enviada',
                      texto: msgTexto.trim(),
                      tipo_mensagem: 'texto',
                      workflow_acionado: 'manual',
                    })
                    setMsgTexto('')
                    // recarrega
                    const { data } = await supabase.from('historico_mensagens')
                      .select('*').eq('telefone', telefoneAtivo).order('created_at').limit(100)
                    setMensagens(data || [])
                    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
                  }}
                >
                  <Send size={15} />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
