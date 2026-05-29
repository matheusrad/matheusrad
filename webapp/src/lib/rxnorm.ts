const BASE = 'https://rxnav.nlm.nih.gov/REST'

export async function getRxCUI(name: string): Promise<string | null> {
  try {
    const r = await fetch(
      `${BASE}/rxcui.json?name=${encodeURIComponent(name)}&allsrc=0`,
      { signal: AbortSignal.timeout(5000) }
    )
    if (!r.ok) return null
    const d = await r.json()
    return d?.idGroup?.rxnormId?.[0] ?? null
  } catch {
    return null
  }
}

export interface Interacao {
  descricao: string
  severidade: 'high' | 'moderate' | 'low' | string
  farmacos: string[]
}

export async function verificarInteracoes(rxcuis: string[]): Promise<Interacao[]> {
  if (rxcuis.length < 2) return []
  try {
    const r = await fetch(
      `${BASE}/interaction/list.json?rxcuis=${rxcuis.join('+')}`,
      { signal: AbortSignal.timeout(8000) }
    )
    if (!r.ok) return []
    const d = await r.json()
    const results: Interacao[] = []
    for (const grp of d?.fullInteractionTypeGroup ?? []) {
      for (const tipo of grp.fullInteractionType ?? []) {
        for (const par of tipo.interactionPair ?? []) {
          results.push({
            descricao: par.description ?? '',
            severidade: par.severity ?? '',
            farmacos: (par.interactionConcept ?? []).map(
              (c: { minConceptItem?: { name?: string } }) => c.minConceptItem?.name ?? ''
            ),
          })
        }
      }
    }
    return results
  } catch {
    return []
  }
}
