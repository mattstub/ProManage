import { ERROR_CODES, HTTP_STATUS } from '@promanage/core'

import type { ErrorCode } from '@promanage/core'

export class AppError extends Error {
  public readonly statusCode: number
  public readonly code: ErrorCode
  public readonly details?: unknown

  constructor(
    message: string,
    statusCode: number,
    code: ErrorCode,
    details?: unknown
  ) {
    super(message)
    this.name = 'AppError'
    this.statusCode = statusCode
    this.code = code
    this.details = details
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND)
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized', code: ErrorCode = ERROR_CODES.UNAUTHORIZED) {
    super(message, HTTP_STATUS.UNAUTHORIZED, code)
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, HTTP_STATUS.FORBIDDEN, ERROR_CODES.FORBIDDEN)
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Validation failed', details?: unknown) {
    super(message, HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR, details)
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Resource already exists', code: ErrorCode = ERROR_CODES.CONFLICT) {
    super(message, HTTP_STATUS.CONFLICT, code)
  }
}
