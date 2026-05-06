'use client'
import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, Scale, Plus, Filter, Download, Receipt, AlertCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { NotaFiscal, Consulta } from '@/types/database'
import { format, parseISO, startOfMonth, endOfMonth, subMonths } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import clsx from 'clsx'

type Tab = 'painel' | 'fluxo' | 'boletos' | 'comissoes'

interface ResumoMes {
  receitas: number
  a_receber: number
  despesas: number
  inadimplencia: number
}

const MESES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

function CardValor({ titulo, valor, sub, cor, icon: Icon }: {
  titulo: string; valor: string; sub: string; cor: string; icon: React.ElementType
}) {
  return (
    <div className="card p-5 flex items-start justify-between">
      <div>
        <p className={`text-xs font-semibold uppercase tracking-wide ${cor}`}>{titulo}</p>
        <p className="text-2xl font-bold text-gray-900 mt-1">{valor}</p>
        <p className="text-xs text-gray-500 mt-1">{sub}</p>
      </div>
      <div className={`w-9 h-9 rounded-full flex items-center justify-center opacity-20`}
        style={{ background: cor.includes('green') ? '#16a34a' : cor.includes('red') ? '#dc2626' : '#2563eb' }}>
        <Icon size={18} />
      </div>
    </div>
  )
}

export function FinanceiroPage() {
  const [tab, setTab]       = useState<Tab>('painel')
  const [notas, setNotas]   = useState<NotaFiscal[]>([])
  const [consultas, setConsultas] = useState<Consulta[]>([])
  const [graficoDados, setGraficoDados] = useState<{ mes: string; entradas: number; saidas: number }[]>([])
  const [mesSelecionado, setMesSelecionado] = useState(format(new Date(), 'yyyy-MM'))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const inicio = format(startOfMonth(parseISO(mesSelecionado + '-01')), "yyyy-MM-dd'T'HH:mm:ss")
      const fim    = format(endOfMonth(parseISO(mesSelecionado + '-01')), "yyyy-MM-dd'T'HH:mm:ss")

      const [{ data: nfs }, { data: cons }] = await Promise.all([
        supabase.from('notas_fiscais')
          .select('*')
          .gte('data_emissao', inicio)
          .lte('data_emissao', fim)
          .order('data_emissao', { ascending: false }),
        supabase.from('consultas')
          .select('*')
          .gte('data_consulta', inicio)
          .lte('data_consulta', fim)
          .not('valor_cobrado', 'is', null)
          .order('data_consulta', { ascending: false }),
      ])
      setNotas(nfs || [])
      setConsultas(cons || [])

      // Gráfico: últimos 6 meses
      const chartData = []
      for (let i = 5; i >= 0; i--) {
        const m = subMonths(new Date(), i)
        const mesStr = format(m, 'yyyy-MM')
        const { data: nfsMes } = await supabase.from('notas_fiscais')
          .select('valor_liquido')
          .eq('mes_competencia', mesStr)
          .eq('status', 'Emitida')
        const entradas = (nfsMes || []).reduce((s, n) => s + (n.valor_liquido || 0), 0)
        chartData.push({ mes: MESES[m.getMonth()], entradas, saidas: 0 })
      }
      setGraficoDados(chartData)
      setLoading(false)
    }
    load()
  }, [mesSelecionado])

  const totalRecebido   = notas.filter(n => n.status === 'Emitida').reduce((s, n) => s + (n.valor_liquido || 0), 0)
  const aReceber        = consultas.filter(c => c.status !== 'Cancelado' && !c.nota_fiscal_emitida).reduce((s, c) => s + (c.valor_cobrado || 0), 0)
  const inadimplencia   = consultas.filter(c => c.status === 'Faltou').length

  const fmt = (v: number) => `R$ ${v.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Financeiro</h1>
        {tab === 'fluxo' && (
          <button className="btn-primary"><Plus size={15} /> Adicionar despesa</button>
        )}
      </div>

      {/* Tabs */}
      <div className="card mb-6">
        <div className="flex gap-6 px-6 border-b border-gray-100">
          {([
            ['painel',    'Painel'],
            ['fluxo',     'Fluxo de caixa'],
            ['boletos',   'Boletos'],
            ['comissoes', 'Comissões'],
          ] as [Tab, string][]).map(([t, label]) => (
            <button key={t} onClick={() => setTab(t)}
              className={t === tab ? 'tab-btn-active' : 'tab-btn-inactive'}>
              {label}
            </button>
          ))}
        </div>

        {/* PAINEL */}
        {tab === 'painel' && (
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-800">Visão Geral</h2>
              <div className="flex gap-2">
                <select className="input w-auto text-xs" value={mesSelecionado.split('-')[1]}
                  onChange={e => setMesSelecionado(`${mesSelecionado.split('-')[0]}-${e.target.value}`)}>
                  {MESES.map((m, i) => (
                    <option key={m} value={String(i+1).padStart(2,'0')}>{m}</option>
                  ))}
                </select>
                <select className="input w-auto text-xs" value={mesSelecionado.split('-')[0]}
                  onChange={e => setMesSelecionado(`${e.target.value}-${mesSelecionado.split('-')[1]}`)}>
                  {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-xs font-medium text-gray-500 mb-3">Entradas</p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Recebido</span>
                    <span className="text-green-600 font-medium">{fmt(totalRecebido)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">A receber</span>
                    <span className="text-gray-800 font-medium">{fmt(aReceber)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-semibold border-t pt-2">
                    <span className="text-gray-700">Total previsto</span>
                    <span className="text-blue-600">{fmt(totalRecebido + aReceber)}</span>
                  </div>
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 mb-3">Saídas</p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Pago</span>
                    <span className="font-medium">R$ 0,00</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">A pagar</span>
                    <span className="font-medium">R$ 0,00</span>
                  </div>
                  <div className="flex justify-between text-sm font-semibold border-t pt-2">
                    <span className="text-gray-700">Total previsto</span>
                    <span className="text-red-500">R$ 0,00</span>
                  </div>
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 mb-3">Resultados</p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Recebido</span>
                    <span className="text-green-600 font-medium">{fmt(totalRecebido)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">A receber</span>
                    <span className="font-medium">{fmt(aReceber)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-semibold border-t pt-2">
                    <span className="text-gray-700">Total previsto</span>
                    <span className="text-blue-600">{fmt(totalRecebido + aReceber)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Inadimplência */}
            {inadimplencia > 0 && (
              <div className="flex items-center gap-3 bg-red-50 border border-red-100 rounded-lg px-4 py-3">
                <AlertCircle size={18} className="text-red-500 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-red-800">Total de inadimplência</p>
                  <p className="text-xs text-red-600">{inadimplencia} paciente{inadimplencia > 1 ? 's' : ''} com consulta não comparecida</p>
                </div>
              </div>
            )}

            {/* Gráfico */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Evolução da clínica — Entradas vs Saídas</h3>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={graficoDados} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorEntradas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#2563eb" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={v => `${v/1000}k`} />
                  <Tooltip formatter={(v: number) => fmt(v)} labelStyle={{ fontWeight: 600 }} />
                  <Area type="monotone" dataKey="entradas" name="Entradas" stroke="#2563eb" strokeWidth={2} fill="url(#colorEntradas)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* FLUXO DE CAIXA */}
        {tab === 'fluxo' && (
          <div className="p-6 space-y-5">
            <div className="flex gap-3">
              <button className="btn-secondary text-xs"><Filter size={13}/> Filtrar</button>
              <select className="input w-auto text-xs">
                <option>Período: hoje</option>
                <option>Esta semana</option>
                <option>Este mês</option>
              </select>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {[
                { t: 'Receitas', v: fmt(totalRecebido), sub: `A receber ${fmt(aReceber)}`, cor: 'text-green-600', icon: TrendingUp },
                { t: 'Despesas', v: fmt(0), sub: 'A pagar R$ 0,00', cor: 'text-red-500', icon: TrendingDown },
                { t: 'Saldo', v: fmt(totalRecebido), sub: 'No período selecionado', cor: 'text-blue-600', icon: Scale },
              ].map(item => (
                <CardValor key={item.t} titulo={item.t} valor={item.v} sub={item.sub} cor={item.cor} icon={item.icon} />
              ))}
            </div>

            <div>
              <div className="grid grid-cols-[1fr_120px_120px_100px] gap-4 px-4 py-2 text-xs font-medium text-gray-500 border-b">
                <span>Descrição</span>
                <span>Data</span>
                <span>Valor líquido</span>
                <span>Status</span>
              </div>
              {loading ? (
                <div className="py-8 text-center text-sm text-gray-400">Carregando...</div>
              ) : notas.length === 0 && consultas.length === 0 ? (
                <div className="py-12 text-center text-sm text-gray-400">
                  <Receipt size={36} className="mx-auto mb-2 opacity-30" />
                  Nenhum lançamento neste período
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {notas.map(nf => (
                    <div key={nf.id} className="grid grid-cols-[1fr_120px_120px_100px] gap-4 px-4 py-3 items-center hover:bg-gray-50">
                      <div>
                        <p className="text-sm font-medium text-gray-900 truncate">{nf.paciente_nome} · {nf.paciente_cpf}</p>
                        <p className="text-xs text-gray-500 truncate">{nf.descricao_servico}</p>
                      </div>
                      <span className="text-sm text-gray-600">{format(parseISO(nf.data_emissao), 'dd/MM/yyyy')}</span>
                      <span className="text-sm font-medium text-gray-900">{fmt(nf.valor_liquido || 0)}</span>
                      <span className={clsx('badge', nf.status === 'Emitida' ? 'badge-green' : nf.status === 'Cancelada' ? 'badge-red' : 'badge-yellow')}>
                        {nf.status === 'Emitida' ? 'Recebido' : nf.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <button className="btn-secondary text-xs"><Download size={13}/> Exportar Excel</button>
            </div>
          </div>
        )}

        {/* BOLETOS */}
        {tab === 'boletos' && (
          <div className="p-12 flex flex-col items-center justify-center text-center gap-4">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center">
              <Receipt size={28} className="text-blue-500" />
            </div>
            <h3 className="font-semibold text-gray-800">Emissão de Boletos</h3>
            <p className="text-sm text-gray-500 max-w-sm">
              Para emitir boletos para os pacientes, ative a integração com seu banco.
              O custo por boleto pago é descontado do valor recebido.
            </p>
            <button className="btn-primary">Configurar integração bancária</button>
          </div>
        )}

        {/* COMISSÕES */}
        {tab === 'comissoes' && (
          <div className="p-12 text-center text-gray-400 text-sm">
            <p>Configure as comissões por dentista em Configurações → Dentistas</p>
          </div>
        )}
      </div>
    </div>
  )
}
