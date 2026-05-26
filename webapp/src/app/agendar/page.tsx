'use client'
import { useState, useEffect, useCallback } from 'react'
import {
  ChevronLeft, ChevronRight, Calendar, Clock, User,
  Phone, Mail, CheckCircle, Loader2, AlertCircle, ArrowLeft,
} from 'lucide-react'
import {
  format, addDays, startOfMonth, endOfMonth, isSameDay,
  addMonths, subMonths, isBefore, startOfDay, parseISO,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import clsx from 'clsx'

// ── Tipos ─────────────────────────────────────────────────────
interface Dentista { id: string; nome: string; especialidade: string | null; cor: string }
interface Clinica  { nome: string; telefone: string | null }

type Step = 'dentista' | 'data' | 'horario' | 'dados' | 'confirmado'

// ── Helpers ───────────────────────────────────────────────────
function maskPhone(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 2)  return d
  if (d.length <= 6)  return `(${d.slice(0,2)}) ${d.slice(2)}`
  if (d.length <= 10) return `(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6)}`
  return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`
}

// ── Mini calendário público ───────────────────────────────────
function CalendarioPublico({
  selected, onSelect, dentista,
}: {
  selected: Date | null
  onSelect: (d: Date) => void
  dentista: Dentista
}) {
  const hoje   = startOfDay(new Date())
  const [mes, setMes] = useState(hoje)
  const inicio = startOfMonth(mes)
  const fim    = endOfMonth(mes)
  const offset = inicio.getDay()

  const dias: (Date | null)[] = [
    ...Array(offset).fill(null),
    ...Array.from({ length: fim.getDate() }, (_, i) => addDays(inicio, i)),
  ]

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => setMes(m => subMonths(m, 1))}
          className="p-2 hover:bg-gray-100 rounded-xl text-gray-500 transition-colors">
          <ChevronLeft size={18} />
        </button>
        <span className="font-semibold text-gray-800 capitalize">
          {format(mes, 'MMMM yyyy', { locale: ptBR })}
        </span>
        <button onClick={() => setMes(m => addMonths(m, 1))}
          className="p-2 hover:bg-gray-100 rounded-xl text-gray-500 transition-colors">
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="grid grid-cols-7 mb-2">
        {['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'].map(d => (
          <div key={d} className="text-center text-xs font-medium text-gray-400 py-1">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-y-1">
        {dias.map((dia, i) => {
          if (!dia) return <div key={i} />
          const passado  = isBefore(dia, hoje)
          const domingo  = dia.getDay() === 0
          const selecion = selected && isSameDay(dia, selected)
          const eHoje    = isSameDay(dia, hoje)

          return (
            <button key={i}
              onClick={() => !passado && !domingo && onSelect(dia)}
              disabled={passado || domingo}
              className={clsx(
                'h-9 w-9 mx-auto rounded-xl text-sm font-medium transition-all',
                passado || domingo ? 'text-gray-300 cursor-not-allowed' : 'hover:bg-gray-100 cursor-pointer',
                selecion && 'text-white font-bold shadow-md',
                !selecion && eHoje && 'border-2 text-blue-600',
                !selecion && !passado && !domingo && 'text-gray-700',
              )}
              style={selecion ? { backgroundColor: dentista.cor } : undefined}>
              {dia.getDate()}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────
export default function AgendarPage() {
  const [step, setStep]             = useState<Step>('dentista')
  const [clinica, setClinica]       = useState<Clinica>({ nome: 'Consultório', telefone: null })
  const [dentistas, setDentistas]   = useState<Dentista[]>([])
  const [dentSel, setDentSel]       = useState<Dentista | null>(null)
  const [dataSel, setDataSel]       = useState<Date | null>(null)
  const [horaSel, setHoraSel]       = useState<string | null>(null)
  const [slots, setSlots]           = useState<string[]>([])
  const [loadSlots, setLoadSlots]   = useState(false)

  const [nome, setNome]             = useState('')
  const [tel, setTel]               = useState('')
  const [email, setEmail]           = useState('')
  const [obs, setObs]               = useState('')
  const [saving, setSaving]         = useState(false)
  const [erro, setErro]             = useState('')
  const [bookingId, setBookingId]   = useState('')

  // Carrega dentistas + nome da clínica
  useEffect(() => {
    fetch('/api/agendar')
      .then(r => r.json())
      .then(({ dentistas: d, clinica: c }) => {
        setDentistas(d ?? [])
        if (c) setClinica(c)
      })
  }, [])

  // Carrega slots ao mudar dentista ou data
  const carregarSlots = useCallback(async (d: Dentista, dia: Date) => {
    setLoadSlots(true)
    setSlots([])
    setHoraSel(null)
    const dataStr = format(dia, 'yyyy-MM-dd')
    const res = await fetch(`/api/agendar?dentista_id=${d.id}&data=${dataStr}`)
    const json = await res.json()
    setSlots(json.slots ?? [])
    setLoadSlots(false)
  }, [])

  function selecionarDentista(d: Dentista) {
    setDentSel(d)
    setDataSel(null)
    setHoraSel(null)
    setSlots([])
    setStep('data')
  }

  function selecionarData(dia: Date) {
    setDataSel(dia)
    setHoraSel(null)
    if (dentSel) carregarSlots(dentSel, dia)
    setStep('horario')
  }

  function selecionarHora(h: string) {
    setHoraSel(h)
    setStep('dados')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    if (!dentSel || !dataSel || !horaSel) return

    const digits = tel.replace(/\D/g, '')
    if (digits.length < 10) { setErro('Telefone inválido.'); return }

    setSaving(true)
    try {
      const res = await fetch('/api/agendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dentista_id:       dentSel.id,
          dentista_nome:     dentSel.nome,
          data:              format(dataSel, 'yyyy-MM-dd'),
          hora:              horaSel,
          paciente_nome:     nome,
          paciente_telefone: tel,
          paciente_email:    email || null,
          observacoes:       obs || null,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Erro ao agendar')
      setBookingId(json.id)
      setStep('confirmado')
    } catch (err: any) {
      setErro(err.message)
    } finally {
      setSaving(false)
    }
  }

  // ── Stepper header ────────────────────────────────────────
  const stepLabels: { key: Step; label: string }[] = [
    { key: 'dentista', label: 'Profissional' },
    { key: 'data',     label: 'Data' },
    { key: 'horario',  label: 'Horário' },
    { key: 'dados',    label: 'Seus dados' },
  ]
  const stepOrder: Step[] = ['dentista', 'data', 'horario', 'dados', 'confirmado']
  const stepIdx = stepOrder.indexOf(step)

  function goBack() {
    if (stepIdx > 0 && step !== 'confirmado') {
      setStep(stepOrder[stepIdx - 1])
    }
  }

  // ── Render ────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          {step !== 'dentista' && step !== 'confirmado' && (
            <button onClick={goBack}
              className="p-2 hover:bg-gray-100 rounded-xl text-gray-500 transition-colors">
              <ArrowLeft size={18} />
            </button>
          )}
          <div>
            <h1 className="font-bold text-gray-900 text-lg leading-tight">{clinica.nome}</h1>
            <p className="text-sm text-gray-500">Agendamento online</p>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">

        {/* Stepper — só mostra antes de confirmar */}
        {step !== 'confirmado' && (
          <div className="flex items-center gap-0 mb-8">
            {stepLabels.map((s, i) => {
              const idx  = stepLabels.findIndex(x => x.key === step)
              const done = i < idx
              const curr = i === idx
              return (
                <div key={s.key} className="flex items-center flex-1 last:flex-none">
                  <div className={clsx(
                    'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all',
                    done && 'bg-blue-600 text-white',
                    curr && 'bg-blue-600 text-white ring-4 ring-blue-100',
                    !done && !curr && 'bg-gray-200 text-gray-400',
                  )}>
                    {done ? <CheckCircle size={14} /> : i + 1}
                  </div>
                  <span className={clsx(
                    'text-xs font-medium ml-1.5 hidden sm:block',
                    curr ? 'text-blue-600' : done ? 'text-gray-600' : 'text-gray-400',
                  )}>
                    {s.label}
                  </span>
                  {i < stepLabels.length - 1 && (
                    <div className={clsx(
                      'flex-1 h-0.5 mx-2 rounded-full',
                      done ? 'bg-blue-600' : 'bg-gray-200',
                    )} />
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* ── Step 1: Selecionar dentista ── */}
        {step === 'dentista' && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">Com quem você quer consultar?</h2>
            <p className="text-gray-500 text-sm mb-6">Escolha o profissional desejado</p>
            {dentistas.length === 0 ? (
              <div className="flex flex-col items-center py-16 text-gray-400">
                <Loader2 size={32} className="animate-spin mb-3" />
                <p>Carregando profissionais...</p>
              </div>
            ) : (
              <div className="space-y-3">
                {dentistas.map(d => (
                  <button key={d.id} onClick={() => selecionarDentista(d)}
                    className="w-full flex items-center gap-4 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-200 transition-all text-left group">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-lg shrink-0 transition-transform group-hover:scale-105"
                      style={{ backgroundColor: d.cor }}>
                      {d.nome.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900">{d.nome}</p>
                      <p className="text-sm text-gray-500">{d.especialidade ?? 'Clínico Geral'}</p>
                    </div>
                    <ChevronRight size={18} className="text-gray-300 group-hover:text-blue-400 transition-colors" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Step 2: Selecionar data ── */}
        {step === 'data' && dentSel && (
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shrink-0"
                style={{ backgroundColor: dentSel.cor }}>
                {dentSel.nome.charAt(0)}
              </div>
              <div>
                <p className="font-semibold text-gray-900">{dentSel.nome}</p>
                <p className="text-sm text-gray-500">{dentSel.especialidade ?? 'Clínico Geral'}</p>
              </div>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">Qual data preferida?</h2>
            <p className="text-sm text-gray-500 mb-6">Domingos não disponíveis</p>
            <CalendarioPublico selected={dataSel} onSelect={selecionarData} dentista={dentSel} />
          </div>
        )}

        {/* ── Step 3: Selecionar horário ── */}
        {step === 'horario' && dentSel && dataSel && (
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shrink-0"
                style={{ backgroundColor: dentSel.cor }}>
                {dentSel.nome.charAt(0)}
              </div>
              <div>
                <p className="font-semibold text-gray-900">{dentSel.nome}</p>
                <p className="text-sm text-gray-500 capitalize">
                  {format(dataSel, "EEEE, d 'de' MMMM", { locale: ptBR })}
                </p>
              </div>
            </div>

            <h2 className="text-xl font-bold text-gray-900 mb-1">Qual horário funciona?</h2>
            <p className="text-sm text-gray-500 mb-6">Consultas de 1 hora</p>

            {loadSlots ? (
              <div className="flex flex-col items-center py-12 text-gray-400">
                <Loader2 size={28} className="animate-spin mb-2" />
                <p className="text-sm">Verificando disponibilidade...</p>
              </div>
            ) : slots.length === 0 ? (
              <div className="flex flex-col items-center py-12 text-gray-400 bg-white rounded-2xl border border-gray-100">
                <Calendar size={32} className="mb-3 text-gray-300" />
                <p className="font-medium text-gray-600">Nenhum horário disponível</p>
                <p className="text-sm mt-1">Tente outra data</p>
                <button onClick={() => setStep('data')}
                  className="mt-4 px-5 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors">
                  Escolher outra data
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {slots.map(h => (
                  <button key={h} onClick={() => selecionarHora(h)}
                    className={clsx(
                      'py-3 rounded-2xl text-sm font-semibold border-2 transition-all',
                      horaSel === h
                        ? 'text-white border-transparent shadow-md scale-105'
                        : 'bg-white border-gray-100 text-gray-700 hover:border-blue-300 hover:text-blue-700 shadow-sm hover:shadow',
                    )}
                    style={horaSel === h ? { backgroundColor: dentSel.cor, borderColor: dentSel.cor } : undefined}>
                    <Clock size={13} className="inline mr-1 opacity-60" />
                    {h}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Step 4: Dados pessoais ── */}
        {step === 'dados' && dentSel && dataSel && horaSel && (
          <div>
            {/* Resumo */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-6">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Resumo do agendamento</p>
              <div className="space-y-2 text-sm text-gray-700">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-md flex items-center justify-center text-white text-[10px] font-bold"
                    style={{ backgroundColor: dentSel.cor }}>
                    {dentSel.nome.charAt(0)}
                  </div>
                  <span>{dentSel.nome}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar size={14} className="text-gray-400" />
                  <span className="capitalize">{format(dataSel, "EEEE, d 'de' MMMM", { locale: ptBR })}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={14} className="text-gray-400" />
                  <span>{horaSel} (1 hora)</span>
                </div>
              </div>
            </div>

            <h2 className="text-xl font-bold text-gray-900 mb-1">Seus dados</h2>
            <p className="text-sm text-gray-500 mb-6">Para confirmarmos seu agendamento</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Nome */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Nome completo <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text" required value={nome}
                    onChange={e => setNome(e.target.value)}
                    placeholder="Seu nome completo"
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  />
                </div>
              </div>

              {/* Telefone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  WhatsApp / Telefone <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="tel" required value={tel}
                    onChange={e => setTel(maskPhone(e.target.value))}
                    placeholder="(99) 99999-9999"
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  />
                </div>
              </div>

              {/* E-mail (opcional) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  E-mail <span className="text-gray-400 font-normal">(opcional)</span>
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email" value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  />
                </div>
              </div>

              {/* Observações */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Observações <span className="text-gray-400 font-normal">(opcional)</span>
                </label>
                <textarea
                  value={obs}
                  onChange={e => setObs(e.target.value)}
                  placeholder="Ex: Dor de dente, retorno, urgência..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white resize-none"
                />
              </div>

              {erro && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                  <AlertCircle size={15} />
                  {erro}
                </div>
              )}

              <button type="submit" disabled={saving}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold rounded-2xl text-base transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-200">
                {saving ? (
                  <><Loader2 size={18} className="animate-spin" /> Agendando...</>
                ) : (
                  <>Confirmar agendamento</>
                )}
              </button>

              <p className="text-center text-xs text-gray-400">
                Seus dados são usados apenas para confirmar o agendamento e são protegidos conforme a LGPD.
              </p>
            </form>
          </div>
        )}

        {/* ── Step 5: Confirmado ── */}
        {step === 'confirmado' && dentSel && dataSel && horaSel && (
          <div className="flex flex-col items-center text-center py-8">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-5">
              <CheckCircle size={40} className="text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Solicitação enviada!</h2>
            <p className="text-gray-500 max-w-sm mb-8">
              Recebemos seu pedido de agendamento. Entraremos em contato pelo WhatsApp para confirmar.
            </p>

            <div className="w-full bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-left mb-8">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Detalhes</p>
              <div className="space-y-3 text-sm text-gray-700">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0"
                    style={{ backgroundColor: dentSel.cor }}>
                    {dentSel.nome.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold">{dentSel.nome}</p>
                    <p className="text-gray-500 text-xs">{dentSel.especialidade ?? 'Clínico Geral'}</p>
                  </div>
                </div>
                <div className="h-px bg-gray-100" />
                <div className="flex items-center gap-2">
                  <Calendar size={14} className="text-gray-400" />
                  <span className="capitalize">{format(dataSel, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={14} className="text-gray-400" />
                  <span>{horaSel} — {nome}</span>
                </div>
                {clinica.telefone && (
                  <div className="flex items-center gap-2">
                    <Phone size={14} className="text-gray-400" />
                    <span>{clinica.telefone}</span>
                  </div>
                )}
              </div>
            </div>

            <button onClick={() => {
              setStep('dentista')
              setDentSel(null)
              setDataSel(null)
              setHoraSel(null)
              setNome(''); setTel(''); setEmail(''); setObs('')
              setBookingId('')
            }}
              className="px-8 py-3 border-2 border-gray-200 text-gray-700 font-semibold rounded-2xl hover:bg-gray-50 transition-colors text-sm">
              Fazer outro agendamento
            </button>
          </div>
        )}

      </main>
    </div>
  )
}
