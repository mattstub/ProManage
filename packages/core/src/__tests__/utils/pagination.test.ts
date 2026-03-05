import { describe, it, expect } from 'vitest'

import { parsePagination, buildPaginationMeta } from '../../utils/pagination'

describe('parsePagination', () => {
  it('returns defaults when no params provided', () => {
    const result = parsePagination({})
    expect(result.page).toBe(1)
    expect(result.perPage).toBe(20)
    expect(result.skip).toBe(0)
    expect(result.take).toBe(20)
  })

  it('parses numeric page and perPage', () => {
    const result = parsePagination({ page: 3, perPage: 10 })
    expect(result.page).toBe(3)
    expect(result.perPage).toBe(10)
    expect(result.skip).toBe(20)
    expect(result.take).toBe(10)
  })

  it('parses string page and perPage', () => {
    const result = parsePagination({ page: '2', perPage: '5' })
    expect(result.page).toBe(2)
    expect(result.perPage).toBe(5)
    expect(result.skip).toBe(5)
  })

  it('clamps page to minimum 1', () => {
    expect(parsePagination({ page: 0 }).page).toBe(1)
    expect(parsePagination({ page: -5 }).page).toBe(1)
  })

  it('clamps perPage to minimum 1', () => {
    expect(parsePagination({ perPage: 0 }).perPage).toBe(1)
    expect(parsePagination({ perPage: -1 }).perPage).toBe(1)
  })

  it('clamps perPage to maximum 100', () => {
    expect(parsePagination({ perPage: 999 }).perPage).toBe(100)
    expect(parsePagination({ perPage: 101 }).perPage).toBe(100)
  })

  it('handles non-numeric strings by falling back to defaults', () => {
    const result = parsePagination({ page: 'abc', perPage: 'xyz' })
    expect(result.page).toBe(1)
    expect(result.perPage).toBe(20)
  })

  it('computes skip correctly for page 1', () => {
    expect(parsePagination({ page: 1, perPage: 25 }).skip).toBe(0)
  })

  it('computes skip correctly for page 4 with perPage 10', () => {
    expect(parsePagination({ page: 4, perPage: 10 }).skip).toBe(30)
  })
})

describe('buildPaginationMeta', () => {
  it('returns correct meta for a single page result', () => {
    const meta = buildPaginationMeta(5, 1, 20)
    expect(meta.total).toBe(5)
    expect(meta.page).toBe(1)
    expect(meta.perPage).toBe(20)
    expect(meta.totalPages).toBe(1)
  })

  it('calculates totalPages correctly', () => {
    expect(buildPaginationMeta(100, 1, 20).totalPages).toBe(5)
    expect(buildPaginationMeta(101, 1, 20).totalPages).toBe(6)
    expect(buildPaginationMeta(1, 1, 20).totalPages).toBe(1)
  })

  it('handles zero total', () => {
    const meta = buildPaginationMeta(0, 1, 20)
    expect(meta.total).toBe(0)
    expect(meta.totalPages).toBe(0)
  })
})
