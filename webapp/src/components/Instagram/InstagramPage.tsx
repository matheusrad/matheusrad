'use client'
import { useState, useEffect } from 'react'
import { Instagram, Plus, RefreshCw, Calendar, Heart, MessageCircle, Send, Image, Sparkles, Clock, CheckCircle2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { ConteudoPostado } from '@/types/database'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import clsx from 'clsx'

type Tab = 'feed' | 'criar' | 'agendados'

const temas = [
  { id: 'dica', label: 'Dica de saúde bucal', emoji: '🦷' },
  { id: 'procedimento', label: 'Procedimento em destaque', emoji: '✨' },
  { id: 'antes_depois', label: 'Antes e depois', emoji: '🔄' },
  { id: 'motivacional', label: 'Post motivacional', emoji: '💪' },
  { id: 'curiosidade', label: 'Curiosidade odontológica', emoji: '🧠' },
  { id: 'promocao', label: 'Promoção / Novidade', emoji: '🎉' },
]

interface ConteudoGerado {
  legenda_instagram: string
  texto_story_whatsapp: string
  hashtags: string[]
  call_to_action: string
  ideia_visual: string
}

export function InstagramPage() {
  const [tab, setTab] = useState<Tab>('feed')
  const [posts, setPosts] = useState<ConteudoPostado[]>([])
  const [loading, setLoading] = useState(true)
  const [temaSelecionado, setTemaSelecionado] = useState('')
  const [topico, setTopico] = useState('')
  const [gerando, setGerando] = useState(false)
  const [conteudo, setConteudo] = useState<ConteudoGerado | null>(null)

  useEffect(() => {
    supabase.from('conteudo_postado')
      .select('*')
      .order('data_postagem', { ascending: false })
      .limit(20)
      .then(({ data }) => {
        setPosts(data || [])
        setLoading(false)
      })
  }, [])

  async function gerarConteudo() {
    if (!temaSelecionado) return
    setGerando(true)
    setConteudo(null)
    // Simula geração (em produção chama o webhook n8n que chama Claude)
    await new Promise(r => setTimeout(r, 2000))
    setConteudo({
      legenda_instagram: `🦷 ${topico || 'Cuidar dos seus dentes é cuidar da sua saúde!'}\n\nSabia que uma boa higiene bucal pode prevenir doenças cardíacas? Nossa equipe está aqui para te ajudar a manter um sorriso saudável.\n\n✅ Agende sua consulta hoje mesmo!\n📍 Atendimento personalizado e humanizado`,
      texto_story_whatsapp: `✨ ${topico || 'Dica do dia'}: Escove os dentes por pelo menos 2 minutos, 3x ao dia! Quer saber mais? Chama a gente 😊`,
      hashtags: ['#odontologia', '#saúdebucal', '#dentista', '#sorriso', '#higienebucal', '#cuidadosdentais'],
      call_to_action: 'Agende sua consulta pelo link na bio!',
      ideia_visual: 'Foto de sorriso feliz + dente ilustrado em azul claro, fundo branco minimalista',
    })
    setGerando(false)
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 rounded-xl flex items-center justify-center">
            <Instagram size={18} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Instagram & Stories</h1>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary text-xs"><RefreshCw size={13} /> Sincronizar</button>
          <button onClick={() => setTab('criar')} className="btn-primary"><Sparkles size={15} /> Gerar conteúdo</button>
        </div>
      </div>

      {/* Tabs */}
      <div className="card mb-6">
        <div className="flex gap-6 px-6 border-b border-gray-100">
          {([
            ['feed', 'Feed publicado'],
            ['criar', 'Criar com IA'],
            ['agendados', 'Agendados'],
          ] as [Tab, string][]).map(([t, label]) => (
            <button key={t} onClick={() => setTab(t)}
              className={t === tab ? 'tab-btn-active' : 'tab-btn-inactive'}>
              {label}
            </button>
          ))}
        </div>

        {/* FEED */}
        {tab === 'feed' && (
          <div className="p-6">
            {loading ? (
              <div className="grid grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="aspect-square bg-gray-100 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : posts.length === 0 ? (
              <div className="py-16 text-center">
                <Instagram size={40} className="mx-auto mb-3 text-gray-200" />
                <p className="text-sm text-gray-400 mb-1">Nenhum post publicado ainda</p>
                <p className="text-xs text-gray-300">Use &quot;Criar com IA&quot; para gerar o primeiro conteúdo</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {posts.map(post => (
                  <div key={post.id} className="group relative aspect-square bg-gray-100 rounded-xl overflow-hidden cursor-pointer">
                    {post.link_midia ? (
                      <img src={post.link_midia} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
                        <Image size={32} className="text-gray-300" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-4 opacity-0 group-hover:opacity-100">
                      <span className="flex items-center gap-1 text-white text-sm font-medium">
                        <Heart size={16} /> {post.curtidas || 0}
                      </span>
                      <span className="flex items-center gap-1 text-white text-sm font-medium">
                        <MessageCircle size={16} /> {post.comentarios || 0}
                      </span>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-white text-[10px] truncate">{post.legenda}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* CRIAR COM IA */}
        {tab === 'criar' && (
          <div className="p-6 space-y-6">
            <div>
              <p className="text-sm font-medium text-gray-700 mb-3">Escolha o tema do post</p>
              <div className="grid grid-cols-3 gap-3">
                {temas.map(t => (
                  <button
                    key={t.id}
                    onClick={() => setTemaSelecionado(t.id)}
                    className={clsx(
                      'flex items-center gap-2 p-3 rounded-lg border text-sm text-left transition-colors',
                      temaSelecionado === t.id
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-100 hover:border-gray-200 text-gray-700'
                    )}>
                    <span className="text-lg">{t.emoji}</span>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Tópico ou instrução adicional <span className="text-gray-400 font-normal">(opcional)</span>
              </label>
              <input
                className="input w-full"
                placeholder="Ex: falar sobre clareamento dental, destacar promoção de limpeza..."
                value={topico}
                onChange={e => setTopico(e.target.value)}
              />
            </div>

            <button
              disabled={!temaSelecionado || gerando}
              onClick={gerarConteudo}
              className="btn-primary disabled:opacity-40 w-full justify-center">
              {gerando ? (
                <><RefreshCw size={15} className="animate-spin" /> Gerando com IA...</>
              ) : (
                <><Sparkles size={15} /> Gerar conteúdo</>
              )}
            </button>

            {conteudo && (
              <div className="space-y-4 pt-2">
                <div className="border border-gray-100 rounded-xl p-5 space-y-4">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Legenda Instagram</p>
                    <p className="text-sm text-gray-800 whitespace-pre-line">{conteudo.legenda_instagram}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {conteudo.hashtags.map(h => (
                        <span key={h} className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{h}</span>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-gray-50 pt-4">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Story / WhatsApp Status</p>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-sm text-gray-700">{conteudo.texto_story_whatsapp}</p>
                    </div>
                  </div>

                  <div className="border-t border-gray-50 pt-4">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Ideia visual</p>
                    <p className="text-sm text-gray-600 italic">{conteudo.ideia_visual}</p>
                  </div>

                  <div className="border-t border-gray-50 pt-4">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Call to action</p>
                    <p className="text-sm text-gray-700">{conteudo.call_to_action}</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button className="btn-primary flex-1 justify-center">
                    <Send size={14} /> Publicar no Instagram
                  </button>
                  <button className="btn-secondary flex-1 justify-center">
                    <Clock size={14} /> Agendar publicação
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* AGENDADOS */}
        {tab === 'agendados' && (
          <div className="p-12 text-center">
            <Calendar size={40} className="mx-auto mb-3 text-gray-200" />
            <p className="text-sm text-gray-500 mb-1">Posts agendados aparecem aqui</p>
            <p className="text-xs text-gray-400">O workflow n8n publica automaticamente Seg/Qua/Sex às 9h</p>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Posts publicados', value: posts.length.toString(), icon: Image, color: 'text-purple-600' },
          { label: 'Curtidas totais', value: posts.reduce((s, p) => s + (p.curtidas || 0), 0).toString(), icon: Heart, color: 'text-pink-500' },
          { label: 'Comentários', value: posts.reduce((s, p) => s + (p.comentarios || 0), 0).toString(), icon: MessageCircle, color: 'text-blue-500' },
          { label: 'Publicados este mês', value: posts.filter(p => p.data_postagem?.startsWith(format(new Date(), 'yyyy-MM'))).length.toString(), icon: CheckCircle2, color: 'text-green-500' },
        ].map(item => (
          <div key={item.label} className="card p-4">
            <div className="flex items-center gap-2 mb-2">
              <item.icon size={16} className={item.color} />
              <p className="text-xs text-gray-500">{item.label}</p>
            </div>
            <p className="text-2xl font-bold text-gray-900">{item.value}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
