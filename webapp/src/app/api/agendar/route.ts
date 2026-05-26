import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'
import { format, parseISO, addMinutes } from 'date-fns'

export const dynamic = 'force-dynamic'

const SLOT_DURATION = 60  // minutos
const HORA_INICIO   = '08:00'
const HORA_FIM      = '18:00'

function gerarSlots(horaIni: string, horaFim: string, duracao: number): string[] {
  const slots: string[] = []
  const [ih, im] = horaIni.split(':').map(Number)
  const [fh, fm] = horaFim.split(':').map(Number)
  const totalMin  = fh * 60 + fm
  let cur = ih * 60 + im
  while (cur + duracao <= totalMin) {
    const h = String(Math.floor(cur / 60)).padStart(2, '0')
    const m = String(cur % 60).padStart(2, '0')
    slots.push(`${h}:${m}`)
    cur += duracao
  }
  return slots
}

// GET /api/agendar?data=YYYY-MM-DD&dentista_id=xxx
export async function GET(req: NextRequest) {
  const sb = getSupabaseAdmin()
  const { searchParams } = req.nextUrl
  const data       = searchParams.get('data')
  const dentistaId = searchParams.get('dentista_id')

  const { data: dentistas } = await (sb.from('dentistas') as any)
    .select('id, nome, especialidade, cro, cor')
    .eq('ativo', true)
    .order('nome')

  const { data: clinicaRows } = await (sb.from('configuracoes_clinica') as any)
    .select('nome, telefone')
    .limit(1)
  const clinica = clinicaRows?.[0] ?? { nome: 'Consultório', telefone: null }

  if (!data || !dentistaId) {
    return NextResponse.json({ dentistas: dentistas ?? [], clinica })
  }

  const dataIni = `${data}T00:00:00`
  const dataFim = `${data}T23:59:59`

  const { data: consultas } = await (sb.from('consultas') as any)
    .select('data_consulta, data_fim_consulta')
    .eq('dentista_id', dentistaId)
    .gte('data_consulta', dataIni)
    .lte('data_consulta', dataFim)
    .not('status', 'in', '("Cancelado","Faltou")')

  const ocupados = ((consultas ?? []) as any[]).map((c: any) => ({
    ini: parseISO(c.data_consulta).getTime(),
    fim: c.data_fim_consulta
      ? parseISO(c.data_fim_consulta).getTime()
      : parseISO(c.data_consulta).getTime() + SLOT_DURATION * 60_000,
  }))

  const todos = gerarSlots(HORA_INICIO, HORA_FIM, SLOT_DURATION)
  const agora = Date.now()

  const slots = todos.filter(slot => {
    const slotIni = new Date(`${data}T${slot}:00`).getTime()
    const slotFim = slotIni + SLOT_DURATION * 60_000
    if (slotIni <= agora) return false
    return !ocupados.some((o: any) => slotIni < o.fim && slotFim > o.ini)
  })

  return NextResponse.json({ dentistas: dentistas ?? [], slots, clinica })
}

// POST /api/agendar
export async function POST(req: NextRequest) {
  try {
    const sb = getSupabaseAdmin()
    const body = await req.json()
    const {
      dentista_id, dentista_nome, data, hora,
      paciente_nome, paciente_telefone, paciente_email, observacoes,
    } = body

    if (!dentista_id || !data || !hora || !paciente_nome || !paciente_telefone) {
      return NextResponse.json({ error: 'Dados obrigatórios ausentes' }, { status: 400 })
    }

    if (paciente_nome.trim().length < 3) {
      return NextResponse.json({ error: 'Nome inválido' }, { status: 400 })
    }

    const tel = paciente_telefone.replace(/\D/g, '')
    if (tel.length < 10) {
      return NextResponse.json({ error: 'Telefone inválido' }, { status: 400 })
    }

    const dataIni = `${data}T${hora}:00`
    const dataFim = `${data}T${format(addMinutes(parseISO(dataIni), SLOT_DURATION), 'HH:mm')}:00`

    // Verifica conflito de horário
    const { data: conflito } = await (sb.from('consultas') as any)
      .select('id')
      .eq('dentista_id', dentista_id)
      .gte('data_consulta', dataIni)
      .lt('data_consulta', dataFim)
      .not('status', 'in', '("Cancelado","Faltou")')
      .limit(1)

    if (conflito && conflito.length > 0) {
      return NextResponse.json({ error: 'Este horário acabou de ser ocupado. Por favor, escolha outro.' }, { status: 409 })
    }

    const { data: inserted, error } = await (sb.from('consultas') as any)
      .insert({
        paciente_nome:     paciente_nome.trim(),
        paciente_telefone: paciente_telefone.trim(),
        paciente_email:    paciente_email?.trim() || null,
        dentista_id,
        dentista_nome,
        data_consulta:     dataIni,
        data_fim_consulta: dataFim,
        status:            'Solicitado',
        canal_agendamento: 'Online',
        observacoes:       observacoes?.trim() || null,
      })
      .select('id')
      .single()

    if (error) throw error

    return NextResponse.json({ ok: true, id: inserted.id })
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Erro interno' }, { status: 500 })
  }
}
