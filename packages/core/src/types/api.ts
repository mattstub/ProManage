export interface ApiResponse<T> {
  data: T
  meta?: PaginationMeta
}

export interface PaginationMeta {
  page: number
  perPage: number
  total: number
  totalPages: number
}

export interface ApiErrorResponse {
  error: {
    code: string
    message: string
    details?: unknown
  }
}
