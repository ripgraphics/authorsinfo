'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle, Eye, EyeOff, Calendar, User } from 'lucide-react'
import type { Database } from '@/types/database'

interface User {
  id: string
  email: string
  name: string
  created_at?: string
  last_sign_in_at?: string
  user_metadata?: any
  app_metadata?: any
  role?: string
}

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [fetchError, setFetchError] = useState<string | null>(null)
  const router = useRouter()
  const { toast } = useToast()

  // Use the correct Supabase client with Database type
  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // Get redirect URL from query parameters
  const searchParams = new URLSearchParams(
    typeof window !== 'undefined' ? window.location.search : ''
  )
  const redirectTo = searchParams.get('redirect') || '/'

  useEffect(() => {
    async function fetchUsers() {
      setFetchError(null)
      try {
        const response = await fetch('/api/auth-users', { cache: 'no-store' })
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const data = await response.json()
        const primaryUsers = Array.isArray(data)
          ? data
          : Array.isArray((data as any)?.users)
            ? (data as any).users
            : []

        if (primaryUsers.length > 0) {
          setUsers(primaryUsers as User[])
          return
        }

        // Fallback to alternate endpoint if primary returns empty
        const fallbackRes = await fetch('/api/check-users', { cache: 'no-store' })
        if (fallbackRes.ok) {
          const fallbackData = await fallbackRes.json()
          const fallbackUsers = Array.isArray(fallbackData)
            ? fallbackData
            : Array.isArray(fallbackData?.users)
              ? fallbackData.users
              : []

          if (fallbackUsers.length > 0) {
            const normalized: User[] = fallbackUsers.map((u: any) => ({
              id: String(u.id),
              email: u.email || 'No email',
              name: u.name || u.email || 'Unknown User',
              created_at: u.created_at || undefined,
              last_sign_in_at: u.last_sign_in_at || undefined,
              role: u.role || 'user',
            }))
            setUsers(normalized)
            return
          }
        }

        // If both primary and fallback yield nothing
        setUsers([])
      } catch (error: any) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('User list fetch failed:', error)
        }
        // Try fallback if primary failed outright
        try {
          const fallbackRes = await fetch('/api/check-users', { cache: 'no-store' })
          if (fallbackRes.ok) {
            const fallbackData = await fallbackRes.json()
            const fallbackUsers = Array.isArray(fallbackData)
              ? fallbackData
              : Array.isArray(fallbackData?.users)
                ? fallbackData.users
                : []

            const normalized: User[] = fallbackUsers.map((u: any) => ({
              id: String(u.id),
              email: u.email || 'No email',
              name: u.name || u.email || 'Unknown User',
              created_at: u.created_at || undefined,
              last_sign_in_at: u.last_sign_in_at || undefined,
              role: u.role || 'user',
            }))
            setUsers(normalized)
            return
          }
        } catch (_) {
          // ignore and surface original error
        }
        setFetchError(error?.message || 'Failed to fetch users')
      }
    }
    fetchUsers()
  }, [])

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  const handleSignIn = async (
    e: React.FormEvent | null,
    emailArg?: string,
    passwordArg?: string
  ) => {
    if (e) e.preventDefault()
    setIsLoading(true)
    const loginEmail = emailArg ?? email
    const loginPassword = passwordArg ?? password

    try {
      const { error, data } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      })

      if (error) {
        throw error
      }

      toast({ title: 'Success', description: 'You have been signed in successfully' })

      // Redirect to the original page or home
      setTimeout(() => {
        router.push(redirectTo)
      }, 1000)
    } catch (rawError: unknown) {
      // Avoid console.error to prevent Next.js dev overlay from triggering
      if (process.env.NODE_ENV === 'development') {
        console.warn('Sign in failed:', rawError)
      }

      // Normalize error
      const errorObj = rawError as any

      let errorMessage = 'Failed to sign in'
      if (typeof errorObj === 'string') {
        errorMessage = errorObj
      } else if (errorObj?.message) {
        errorMessage = errorObj.message
      } else if (errorObj?.error_description) {
        errorMessage = errorObj.error_description
      }

      const status = errorObj?.status

      // Handle specific error codes
      if (status === 400) {
        errorMessage = 'Invalid email or password. Please check your credentials.'
      } else if (status === 401) {
        errorMessage = 'Authentication failed. Please try again.'
      } else if (status === 422) {
        errorMessage = 'Invalid email format.'
      }

      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: errorMessage,
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Autofill and login as user
  const loginAsUser = (userEmail: string) => {
    setEmail(userEmail)
    setPassword('password123')
    setTimeout(() => {
      console.log('loginAsUser triggered for:', userEmail)
      handleSignIn(null, userEmail, 'password123')
    }, 100)
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never'
    return new Date(dateString).toLocaleDateString()
  }

  return (
    <div className="flex flex-col items-center space-y-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Sign In</CardTitle>
          <CardDescription>Enter your credentials to access your account</CardDescription>
        </CardHeader>
        <form onSubmit={handleSignIn}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={togglePasswordVisibility}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
            <p className="text-sm text-muted-foreground text-center">
              Don't have an account?{' '}
              <Button variant="link" className="p-0 h-auto" onClick={() => router.push('/signup')}>
                Sign up
              </Button>
            </p>
          </CardFooter>
        </form>
      </Card>

      {/* User List for Testing */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Database Users ({users.length})</CardTitle>
          <CardDescription>
            <strong>Test Password for all users: password123</strong>
            <br />
            Click a user to log in as them
          </CardDescription>
        </CardHeader>
        <CardContent>
          {fetchError ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{fetchError}</AlertDescription>
            </Alert>
          ) : users.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>No Users Found</AlertTitle>
              <AlertDescription>
                No users were found in the database. Please make sure you have created some test
                users.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                Found {users.length} users in the database
              </div>

              {/* Test Login Button */}
              <div className="p-4 border rounded-lg bg-muted/50">
                <h3 className="font-medium mb-2">Quick Test Login</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Test login with the first user in the database:
                </p>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-mono bg-green-100 px-2 py-1 rounded-sm">
                    {users[0] ? users[0].email : 'No user'}
                  </span>
                  <span className="text-sm">→</span>
                  <span className="text-sm font-mono bg-green-100 px-2 py-1 rounded-sm">
                    password123
                  </span>
                </div>
                <Button
                  onClick={() => users[0] && handleSignIn(null, users[0].email, 'password123')}
                  disabled={isLoading || !users[0]}
                  size="sm"
                  variant="outline"
                >
                  {isLoading ? 'Testing...' : 'Test Login'}
                </Button>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {users.map((user) => (
                  <div
                    key={user.id}
                    className="flex flex-col border rounded-lg p-4 bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-sm">{user.name}</span>
                    </div>
                    <span className="text-xs text-muted-foreground mb-1">{user.email}</span>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                      <Calendar className="h-3 w-3" />
                      <span>Created: {formatDate(user.created_at)}</span>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                        Role: {user.role || 'user'}
                      </span>
                    </div>
                    <div className="bg-green-100 dark:bg-green-900/20 rounded-sm px-2 py-1 mb-3">
                      <span className="text-xs font-mono text-green-800 dark:text-green-200">
                        Password: password123
                      </span>
                    </div>
                    <Button size="sm" className="w-full" onClick={() => loginAsUser(user.email)}>
                      Login as {user.name}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
