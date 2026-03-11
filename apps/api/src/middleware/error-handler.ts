import { ZodError } from 'zod'
import { Prisma } from '@prisma/client'
import { ERROR_CODES, HTTP_STATUS } from '@promanage/core'

import { AppError } from '../lib/errors'
import { logger } from '../lib/logger'

import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify'

export function errorHandler(
  error: FastifyError | Error,
  _request: FastifyRequest,
  reply: FastifyReply
) {
  // App errors (our own error classes)
  if (error instanceof AppError) {
    return reply.status(error.statusCode).send({
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
      },
    })
  }

  // Zod validation errors — use duck typing to handle multiple zod module copies.
  // Zod 4 uses .issues (Zod 3 used .errors); handle both via any-cast.
  if (error instanceof ZodError || error.name === 'ZodError') {
    const zodError = error as ZodError
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const issues: { path: (string | number)[]; message: string }[] = (zodError as any).issues ?? (zodError as any).errors ?? []
    const details = issues.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }))

    return reply.status(HTTP_STATUS.BAD_REQUEST).send({
      error: {
        code: ERROR_CODES.VALIDATION_ERROR,
        message: 'Validation failed',
        details,
      },
    })
  }

  // Prisma errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      return reply.status(HTTP_STATUS.CONFLICT).send({
        error: {
          code: ERROR_CODES.CONFLICT,
          message: 'A record with this value already exists',
        },
      })
    }
    if (error.code === 'P2025') {
      return reply.status(HTTP_STATUS.NOT_FOUND).send({
        error: {
          code: ERROR_CODES.NOT_FOUND,
          message: 'Record not found',
        },
      })
    }
  }

  // Fastify errors (rate limit, etc.)
  if ('statusCode' in error && typeof error.statusCode === 'number') {
    return reply.status(error.statusCode).send({
      error: {
        code: error.statusCode === 429 ? ERROR_CODES.RATE_LIMITED : ERROR_CODES.INTERNAL_ERROR,
        message: error.message,
      },
    })
  }

  // Unhandled errors
  logger.error(error, 'Unhandled error')

  return reply.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).send({
    error: {
      code: ERROR_CODES.INTERNAL_ERROR,
      message:
        process.env.NODE_ENV === 'development'
          ? error.message
          : 'Internal server error',
    },
  })
}
