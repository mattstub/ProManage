'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'

import { registerSchema } from '@promanage/core/schemas'
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

import type { RegisterInput } from '@promanage/core/schemas'

import { useAuth } from '@/hooks/use-auth'
import { getApiClient } from '@/lib/api-client'

export function RegisterForm() {
  const [serverError, setServerError] = useState<string | null>(null)
  const router = useRouter()
  const { setAuth } = useAuth()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  })

  async function onSubmit(data: RegisterInput) {
    setServerError(null)
    try {
      const { user, accessToken } = await getApiClient().auth.register(data)
      setAuth(user, accessToken)
      router.push('/dashboard')
    } catch (err: unknown) {
      setServerError(
        err instanceof Error ? err.message : 'Registration failed. Please try again.'
      )
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create your account</CardTitle>
        <CardDescription>
          Start managing your construction projects
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent>
          <Stack gap={4}>
            {serverError && (
              <Alert variant="error">{serverError}</Alert>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="firstName">First name</Label>
                <Input
                  id="firstName"
                  placeholder="Jane"
                  autoComplete="given-name"
                  {...register('firstName')}
                />
                {errors.firstName && (
                  <p className="text-xs text-red-600">{errors.firstName.message}</p>
                )}
              </div>
              <div className="space-y-1">
                <Label htmlFor="lastName">Last name</Label>
                <Input
                  id="lastName"
                  placeholder="Smith"
                  autoComplete="family-name"
                  {...register('lastName')}
                />
                {errors.lastName && (
                  <p className="text-xs text-red-600">{errors.lastName.message}</p>
                )}
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="organizationName">Company name</Label>
              <Input
                id="organizationName"
                placeholder="Smith Construction LLC"
                autoComplete="organization"
                {...register('organizationName')}
              />
              {errors.organizationName && (
                <p className="text-xs text-red-600">{errors.organizationName.message}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label htmlFor="email">Work email</Label>
              <Input
                id="email"
                type="email"
                placeholder="jane@smithconstruction.com"
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
                autoComplete="new-password"
                {...register('password')}
              />
              {errors.password && (
                <p className="text-xs text-red-600">{errors.password.message}</p>
              )}
              <p className="text-xs text-gray-400">
                Min 8 chars, one uppercase, lowercase, and number
              </p>
            </div>
          </Stack>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Creating account...' : 'Create account'}
          </Button>
          <p className="text-sm text-gray-500 text-center">
            Already have an account?{' '}
            <Link href="/login" className="text-blue-600 hover:underline">
              Sign in
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  )
}
