import { google } from 'googleapis'

// Status → cor no Google Calendar
const STATUS_COLOR: Record<string, string> = {
  Agendado:   '9',  // azul
  Confirmado: '2',  // verde
  Remarcado:  '5',  // amarelo
  Cancelado:  '8',  // grafite
  Realizado:  '8',  // grafite
  Faltou:     '11', // vermelho
  Aguardando: '6',  // tangerina
}

function getAuth() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
  const key   = process.env.GOOGLE_SERVICE_ACCOUNT_KEY?.replace(/\\n/g, '\n')
  if (!email || !key) throw new Error('Google Calendar não configurado (env vars ausentes)')

  return new google.auth.GoogleAuth({
    credentials: { client_email: email, private_key: key },
    scopes: ['https://www.googleapis.com/auth/calendar'],
  })
}

function calendarId() {
  const id = process.env.GOOGLE_CALENDAR_ID
  if (!id) throw new Error('GOOGLE_CALENDAR_ID não definido')
  return id
}

export interface EventoConsulta {
  paciente_nome: string
  procedimento:  string | null
  data_consulta: string   // 'YYYY-MM-DD'
  hora_inicio:   string   // 'HH:mm'
  hora_fim:      string   // 'HH:mm'
  status:        string
  dentista_nome?: string | null
}

function buildEvent(c: EventoConsulta) {
  const tz = 'America/Sao_Paulo'
  const linhas = [
    `Paciente: ${c.paciente_nome}`,
    c.procedimento ? `Procedimento: ${c.procedimento}` : null,
    c.dentista_nome ? `Dentista: ${c.dentista_nome}` : null,
    `Status: ${c.status}`,
  ].filter(Boolean).join('\n')

  return {
    summary:     `${c.paciente_nome}${c.procedimento ? ` — ${c.procedimento}` : ''}`,
    description: linhas,
    colorId:     STATUS_COLOR[c.status] ?? '9',
    start: { dateTime: `${c.data_consulta}T${c.hora_inicio}:00`, timeZone: tz },
    end:   { dateTime: `${c.data_consulta}T${c.hora_fim}:00`,    timeZone: tz },
  }
}

export async function criarEvento(consulta: EventoConsulta): Promise<string> {
  const cal = google.calendar({ version: 'v3', auth: getAuth() })
  const { data } = await cal.events.insert({
    calendarId: calendarId(),
    requestBody: buildEvent(consulta),
  })
  return data.id!
}

export async function atualizarEvento(eventoId: string, consulta: EventoConsulta): Promise<void> {
  const cal = google.calendar({ version: 'v3', auth: getAuth() })
  await cal.events.update({
    calendarId: calendarId(),
    eventId:    eventoId,
    requestBody: buildEvent(consulta),
  })
}

export async function cancelarEvento(eventoId: string): Promise<void> {
  const cal = google.calendar({ version: 'v3', auth: getAuth() })
  // Atualiza cor para grafite e adiciona [CANCELADO] ao título
  const { data: existing } = await cal.events.get({ calendarId: calendarId(), eventId: eventoId })
  await cal.events.update({
    calendarId: calendarId(),
    eventId:    eventoId,
    requestBody: {
      ...existing,
      summary: existing.summary?.startsWith('[CANCELADO]')
        ? existing.summary
        : `[CANCELADO] ${existing.summary}`,
      colorId: '8',
      status:  'cancelled',
    },
  })
}

export async function deletarEvento(eventoId: string): Promise<void> {
  const cal = google.calendar({ version: 'v3', auth: getAuth() })
  await cal.events.delete({ calendarId: calendarId(), eventId: eventoId })
}

export function calendarConfigurado(): boolean {
  return !!(
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL &&
    process.env.GOOGLE_SERVICE_ACCOUNT_KEY &&
    process.env.GOOGLE_CALENDAR_ID
  )
}
