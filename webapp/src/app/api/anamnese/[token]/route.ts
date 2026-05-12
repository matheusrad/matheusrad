import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// GET /api/anamnese/[token] — valida o token e retorna dados do paciente
export async function GET(
  _req: NextRequest,
  { params }: { params: { token: string } }
) {
  const supabase = adminClient()

  const { data: tokenRow, error } = await supabase
    .from('anamnese_tokens')
    .select('paciente_id, expires_at, used_at, pacientes(nome, telefone)')
    .eq('token', params.token)
    .single()

  if (error || !tokenRow) {
    return NextResponse.json({ error: 'Link inválido ou expirado.' }, { status: 404 })
  }

  if (tokenRow.used_at) {
    return NextResponse.json({ error: 'Este link já foi utilizado.' }, { status: 410 })
  }

  if (new Date(tokenRow.expires_at) < new Date()) {
    return NextResponse.json({ error: 'Este link expirou. Solicite um novo à clínica.' }, { status: 410 })
  }

  const paciente = tokenRow.pacientes as { nome: string; telefone: string } | null

  return NextResponse.json({
    paciente_id: tokenRow.paciente_id,
    paciente_nome: paciente?.nome ?? '',
  })
}

// POST /api/anamnese/[token] — salva anamnese e marca token como usado
export async function POST(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  const supabase = adminClient()

  // Valida token novamente
  const { data: tokenRow, error: tokenErr } = await supabase
    .from('anamnese_tokens')
    .select('id, paciente_id, expires_at, used_at, pacientes(nome)')
    .eq('token', params.token)
    .single()

  if (tokenErr || !tokenRow) {
    return NextResponse.json({ error: 'Link inválido.' }, { status: 404 })
  }
  if (tokenRow.used_at) {
    return NextResponse.json({ error: 'Este link já foi utilizado.' }, { status: 410 })
  }
  if (new Date(tokenRow.expires_at) < new Date()) {
    return NextResponse.json({ error: 'Link expirado.' }, { status: 410 })
  }

  const body = await req.json()
  const paciente = tokenRow.pacientes as { nome: string } | null

  // Salva anamnese
  const { error: insertErr } = await supabase.from('anamneses').insert({
    ...body,
    paciente_id: tokenRow.paciente_id,
    paciente_nome: paciente?.nome ?? body.paciente_nome ?? '',
  })

  if (insertErr) {
    return NextResponse.json({ error: insertErr.message }, { status: 500 })
  }

  // Marca token como usado
  await supabase
    .from('anamnese_tokens')
    .update({ used_at: new Date().toISOString() })
    .eq('id', tokenRow.id)

  return NextResponse.json({ ok: true })
}
