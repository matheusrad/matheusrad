import { NextRequest, NextResponse } from 'next/server'
import {
  criarEvento, atualizarEvento, cancelarEvento, deletarEvento,
  calendarConfigurado, type EventoConsulta,
} from '@/lib/googleCalendar'

// POST /api/calendar → cria evento, retorna { eventoId }
export async function POST(req: NextRequest) {
  if (!calendarConfigurado()) {
    return NextResponse.json({ error: 'Google Calendar não configurado' }, { status: 503 })
  }
  try {
    const consulta: EventoConsulta = await req.json()
    const eventoId = await criarEvento(consulta)
    return NextResponse.json({ eventoId })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// PUT /api/calendar → atualiza evento existente
export async function PUT(req: NextRequest) {
  if (!calendarConfigurado()) {
    return NextResponse.json({ error: 'Google Calendar não configurado' }, { status: 503 })
  }
  try {
    const { eventoId, consulta }: { eventoId: string; consulta: EventoConsulta } = await req.json()
    await atualizarEvento(eventoId, consulta)
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// DELETE /api/calendar → remove evento
export async function DELETE(req: NextRequest) {
  if (!calendarConfigurado()) {
    return NextResponse.json({ error: 'Google Calendar não configurado' }, { status: 503 })
  }
  try {
    const { eventoId, cancelar }: { eventoId: string; cancelar?: boolean } = await req.json()
    if (cancelar) {
      await cancelarEvento(eventoId)
    } else {
      await deletarEvento(eventoId)
    }
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// GET /api/calendar → verifica se está configurado
export async function GET() {
  return NextResponse.json({ configurado: calendarConfigurado() })
}
