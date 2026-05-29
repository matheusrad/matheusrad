import { NextRequest, NextResponse } from 'next/server'

export interface BulaItem {
  expediente: string
  nome: string
  principioAtivo: string
  laboratorio: string
  tipoBula: 'PROFISSIONAL' | 'PACIENTE' | string
  urlPdf: string
}

export async function GET(req: NextRequest) {
  const nome = req.nextUrl.searchParams.get('nome') ?? ''
  if (nome.length < 3) return NextResponse.json({ content: [] })

  try {
    const url =
      `https://consultas.anvisa.gov.br/api/consulta/bulario/produto/` +
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

    const content: BulaItem[] = (data.content ?? []).map((item: Record<string, string>) => ({
      expediente:    item.expediente ?? '',
      nome:          item.nome ?? '',
      principioAtivo: item.principioAtivo ?? '',
      laboratorio:   item.laboratorio ?? '',
      tipoBula:      item.tipoBula ?? '',
      urlPdf: `https://consultas.anvisa.gov.br/api/consulta/bulario/produto/?expediente=${item.expediente}`,
    }))

    // profissional primeiro, depois paciente
    content.sort((a, b) =>
      a.tipoBula === 'PROFISSIONAL' ? -1 : b.tipoBula === 'PROFISSIONAL' ? 1 : 0
    )

    return NextResponse.json({ content })
  } catch {
    return NextResponse.json({ content: [] })
  }
}
