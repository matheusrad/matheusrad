'use client'

export interface EventoPayload {
  paciente_nome: string
  procedimento:  string | null
  data_consulta: string
  hora_inicio:   string
  hora_fim:      string
  status:        string
  dentista_nome?: string | null
}

async function api(method: string, body: object) {
  const res = await fetch('/api/calendar', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error ?? `Erro ${res.status}`)
  }
  return res.json()
}

export async function gcalCriar(payload: EventoPayload): Promise<string | null> {
  try {
    const { eventoId } = await api('POST', payload)
    return eventoId
  } catch (e) {
    console.warn('[Google Calendar] criar evento:', e)
    return null
  }
}

export async function gcalAtualizar(eventoId: string, payload: EventoPayload): Promise<void> {
  try {
    await api('PUT', { eventoId, consulta: payload })
  } catch (e) {
    console.warn('[Google Calendar] atualizar evento:', e)
  }
}

export async function gcalCancelar(eventoId: string): Promise<void> {
  try {
    await api('DELETE', { eventoId, cancelar: true })
  } catch (e) {
    console.warn('[Google Calendar] cancelar evento:', e)
  }
}

export async function gcalDeletar(eventoId: string): Promise<void> {
  try {
    await api('DELETE', { eventoId })
  } catch (e) {
    console.warn('[Google Calendar] deletar evento:', e)
  }
}
