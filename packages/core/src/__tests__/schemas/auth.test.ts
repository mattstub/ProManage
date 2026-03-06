import { describe, it, expect } from 'vitest'

import { loginSchema, registerSchema } from '../../schemas/auth'

describe('loginSchema', () => {
  it('accepts valid credentials', () => {
    const result = loginSchema.safeParse({
      email: 'user@example.com',
      password: 'secret',
    })
    expect(result.success).toBe(true)
  })

  it('rejects invalid email', () => {
    const result = loginSchema.safeParse({ email: 'not-an-email', password: 'secret' })
    expect(result.success).toBe(false)
  })

  it('rejects missing password', () => {
    const result = loginSchema.safeParse({ email: 'user@example.com' })
    expect(result.success).toBe(false)
  })

  it('rejects empty password', () => {
    const result = loginSchema.safeParse({ email: 'user@example.com', password: '' })
    expect(result.success).toBe(false)
  })

  it('rejects email over 254 characters', () => {
    // 246 + '@test.com' (9) = 255 chars — one over the max(254) limit
    const long = 'a'.repeat(246) + '@test.com'
    const result = loginSchema.safeParse({ email: long, password: 'secret' })
    expect(result.success).toBe(false)
  })

  it('rejects password over 128 characters', () => {
    const result = loginSchema.safeParse({
      email: 'user@example.com',
      password: 'a'.repeat(129),
    })
    expect(result.success).toBe(false)
  })
})

describe('registerSchema', () => {
  const valid = {
    email: 'admin@example.com',
    password: 'Password1',
    firstName: 'Jane',
    lastName: 'Doe',
    organizationName: 'Acme Construction',
  }

  it('accepts valid registration data', () => {
    expect(registerSchema.safeParse(valid).success).toBe(true)
  })

  it('rejects password shorter than 8 characters', () => {
    const result = registerSchema.safeParse({ ...valid, password: 'Pass1' })
    expect(result.success).toBe(false)
  })

  it('rejects password with no uppercase letter', () => {
    const result = registerSchema.safeParse({ ...valid, password: 'password1' })
    expect(result.success).toBe(false)
  })

  it('rejects password with no lowercase letter', () => {
    const result = registerSchema.safeParse({ ...valid, password: 'PASSWORD1' })
    expect(result.success).toBe(false)
  })

  it('rejects password with no digit', () => {
    const result = registerSchema.safeParse({ ...valid, password: 'PasswordOnly' })
    expect(result.success).toBe(false)
  })

  it('rejects empty firstName', () => {
    const result = registerSchema.safeParse({ ...valid, firstName: '' })
    expect(result.success).toBe(false)
  })

  it('rejects firstName over 50 characters', () => {
    const result = registerSchema.safeParse({ ...valid, firstName: 'a'.repeat(51) })
    expect(result.success).toBe(false)
  })

  it('rejects empty organizationName', () => {
    const result = registerSchema.safeParse({ ...valid, organizationName: '' })
    expect(result.success).toBe(false)
  })

  it('rejects organizationName over 100 characters', () => {
    const result = registerSchema.safeParse({
      ...valid,
      organizationName: 'a'.repeat(101),
    })
    expect(result.success).toBe(false)
  })
})
