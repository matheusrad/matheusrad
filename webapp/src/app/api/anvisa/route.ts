import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const nome = req.nextUrl.searchParams.get('nome') ?? ''
  if (nome.length < 3) return NextResponse.json({ content: [] })

  try {
    const url =
      `https://consultas.anvisa.gov.br/api/consulta/medicamentos/produtos/` +
      `?nome=${encodeURIComponent(nome)}&count=10&page=0`

    const res = await fetch(url, {
      headers: {
        Authorization: 'Guest',
        Accept: 'application/json, text/plain, */*',
        'User-Agent': 'Mozilla/5.0',
      },
      signal: AbortSignal.timeout(8000),
    })

    if (!res.ok) return NextResponse.json({ content: [] })
    const data = await res.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ content: [] })
  }
}
