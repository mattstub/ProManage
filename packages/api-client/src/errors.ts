export class ApiClientError extends Error {
  readonly code: string
  readonly status: number
  readonly details?: unknown

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message)
    this.name = 'ApiClientError'
    this.code = code
    this.status = status
    this.details = details
  }

  /** True when the server returned a 401 Unauthorized response. */
  get isUnauthorized() {
    return this.status === 401
  }

  /** True when the server returned a 403 Forbidden response. */
  get isForbidden() {
    return this.status === 403
  }

  /** True when the server returned a 404 Not Found response. */
  get isNotFound() {
    return this.status === 404
  }

  /** True when the server returned a 409 Conflict response (e.g. duplicate email). */
  get isConflict() {
    return this.status === 409
  }
}
