const RETRYABLE_STATUS = new Set([408, 425, 429, 500, 502, 503, 504])
const DEFAULT_MAX_RETRIES = 3
const DEFAULT_BASE_DELAY_MS = 300
const DEFAULT_MAX_DELAY_MS = 8_000

export interface RetryFetchOptions {
  maxRetries?: number
  baseDelayMs?: number
  maxDelayMs?: number
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const computeBackoff = (attempt: number, baseDelayMs: number, maxDelayMs: number) => {
  const exp = Math.min(maxDelayMs, baseDelayMs * 2 ** attempt)
  const jitter = Math.random() * exp * 0.3
  return Math.round(exp + jitter)
}

const parseRetryAfter = (header: string | null): number | null => {
  if (!header) return null
  const seconds = Number(header)
  if (!Number.isNaN(seconds)) return Math.max(0, seconds * 1000)
  const dateMs = Date.parse(header)
  if (!Number.isNaN(dateMs)) return Math.max(0, dateMs - Date.now())
  return null
}

export function createRetryFetch(options: RetryFetchOptions = {}): typeof fetch {
  const {
    maxRetries = DEFAULT_MAX_RETRIES,
    baseDelayMs = DEFAULT_BASE_DELAY_MS,
    maxDelayMs = DEFAULT_MAX_DELAY_MS,
  } = options

  return async (input, init) => {
    let lastError: unknown

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(input, init)

        if (!RETRYABLE_STATUS.has(response.status) || attempt === maxRetries) {
          return response
        }

        const retryAfter = parseRetryAfter(response.headers.get('retry-after'))
        const delay = retryAfter ?? computeBackoff(attempt, baseDelayMs, maxDelayMs)

        if (typeof response.body?.cancel === 'function') {
          response.body.cancel().catch(() => {})
        }

        await sleep(Math.min(delay, maxDelayMs))
        continue
      } catch (error) {
        lastError = error

        if ((error as { name?: string })?.name === 'AbortError') throw error
        if (attempt === maxRetries) throw error

        await sleep(computeBackoff(attempt, baseDelayMs, maxDelayMs))
      }
    }

    throw lastError ?? new Error('retryFetch: exhausted retries')
  }
}
