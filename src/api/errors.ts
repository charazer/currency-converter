export type ApiErrorKind = 'not-found' | 'invalid-request' | 'unavailable' | 'network' | 'malformed'

const MESSAGES: Record<ApiErrorKind, string> = {
  'not-found': 'That currency pair is not available.',
  'invalid-request': 'That request was rejected by the exchange rate service.',
  unavailable: 'The exchange rate service is temporarily unavailable.',
  network: 'Could not reach the exchange rate service. Check your connection.',
  malformed: 'The exchange rate service returned an unexpected response.',
}

export class ApiError extends Error {
  readonly kind: ApiErrorKind
  readonly status: number | undefined

  constructor(kind: ApiErrorKind, status?: number, options?: ErrorOptions) {
    super(MESSAGES[kind], options)
    this.name = 'ApiError'
    this.kind = kind
    this.status = status
  }

  /** Only transient failures are worth a retry; bad input and bad payloads will fail again. */
  get retryable(): boolean {
    return this.kind === 'network' || this.kind === 'unavailable'
  }
}

export function apiErrorForStatus(status: number): ApiError {
  if (status === 404) return new ApiError('not-found', status)
  if (status === 422 || status === 400) return new ApiError('invalid-request', status)
  return new ApiError('unavailable', status)
}
