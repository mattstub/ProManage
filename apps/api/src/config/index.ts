import { envSchema } from './env'

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error('Invalid environment variables:', parsed.error.flatten())
  process.exit(1)
}

export const config = parsed.data
