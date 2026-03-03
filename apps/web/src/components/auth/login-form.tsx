'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'

import { loginSchema } from '@promanage/core/schemas'
import {
  Alert,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Stack,
} from '@promanage/ui-components'

import type { LoginInput } from '@promanage/core/schemas'

import { useAuth } from '@/hooks/use-auth'
import { getApiClient } from '@/lib/api-client'

export function LoginForm() {
  const [serverError, setServerError] = useState<string | null>(null)
  const router = useRouter()
  const { setAuth } = useAuth()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  })

  async function onSubmit(data: LoginInput) {
    setServerError(null)
    try {
      const { user, accessToken } = await getApiClient().auth.login(data)
      setAuth(user, accessToken)
      router.push('/dashboard')
    } catch (err: unknown) {
      setServerError(
        err instanceof Error ? err.message : 'Invalid email or password.'
      )
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sign in to ProManage</CardTitle>
        <CardDescription>Enter your credentials to continue</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent>
          <Stack gap={4}>
            {serverError && (
              <Alert variant="error">{serverError}</Alert>
            )}
            <div className="space-y-1">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                {...register('email')}
              />
              {errors.email && (
                <p className="text-xs text-red-600">{errors.email.message}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                {...register('password')}
              />
              {errors.password && (
                <p className="text-xs text-red-600">{errors.password.message}</p>
              )}
            </div>
          </Stack>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Signing in...' : 'Sign in'}
          </Button>
          <p className="text-sm text-gray-500 text-center">
            No account?{' '}
            <Link href="/register" className="text-blue-600 hover:underline">
              Create one
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  )
}
