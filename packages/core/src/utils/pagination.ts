import type { PaginationMeta } from '../types/api'

const DEFAULT_PAGE = 1
const DEFAULT_PER_PAGE = 20
const MAX_PER_PAGE = 100

/**
 * Parse and clamp pagination parameters from query strings.
 */
export function parsePagination(params: {
  page?: string | number
  perPage?: string | number
}): { page: number; perPage: number; skip: number; take: number } {
  const page = Math.max(
    1,
    typeof params.page === 'string'
      ? parseInt(params.page, 10) || DEFAULT_PAGE
      : params.page ?? DEFAULT_PAGE
  )

  const perPage = Math.min(
    MAX_PER_PAGE,
    Math.max(
      1,
      typeof params.perPage === 'string'
        ? parseInt(params.perPage, 10) || DEFAULT_PER_PAGE
        : params.perPage ?? DEFAULT_PER_PAGE
    )
  )

  return {
    page,
    perPage,
    skip: (page - 1) * perPage,
    take: perPage,
  }
}

/**
 * Build pagination metadata from a query result.
 */
export function buildPaginationMeta(
  total: number,
  page: number,
  perPage: number
): PaginationMeta {
  return {
    page,
    perPage,
    total,
    totalPages: Math.ceil(total / perPage),
  }
}
