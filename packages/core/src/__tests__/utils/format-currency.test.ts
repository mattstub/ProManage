import { describe, it, expect } from 'vitest'

import { formatCurrency, formatCurrencyCompact } from '../../utils/format-currency'

describe('formatCurrency', () => {
  it('formats a whole dollar amount', () => {
    expect(formatCurrency(1000)).toBe('$1,000.00')
  })

  it('formats cents correctly', () => {
    expect(formatCurrency(9.99)).toBe('$9.99')
  })

  it('formats zero', () => {
    expect(formatCurrency(0)).toBe('$0.00')
  })

  it('formats negative amounts', () => {
    expect(formatCurrency(-500)).toBe('-$500.00')
  })

  it('formats large amounts with comma separators', () => {
    expect(formatCurrency(1234567.89)).toBe('$1,234,567.89')
  })
})

describe('formatCurrencyCompact', () => {
  it('formats thousands with K suffix', () => {
    // Intl compact notation may produce "$450K" or "$450K" — check contains K
    const result = formatCurrencyCompact(450000)
    expect(result).toContain('K')
    expect(result).toContain('$')
  })

  it('formats millions with M suffix', () => {
    const result = formatCurrencyCompact(1200000)
    expect(result).toContain('M')
    expect(result).toContain('$')
  })

  it('formats small amounts without suffix', () => {
    const result = formatCurrencyCompact(500)
    expect(result).toContain('$')
    // Should not have K or M for small amounts
    expect(result).not.toMatch(/[KMB]/)
  })
})
