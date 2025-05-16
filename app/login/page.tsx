'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [users, setUsers] = useState<any[]>([])
  const [fetchError, setFetchError] = useState<string | null>(null)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClientComponentClient()

  // Fetch all users from the users table
  useEffect(() => {
    async function fetchUsers() {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('id, email, name')
          .order('name', { ascending: true })
        
        if (error) {
          console.error('Error fetching users:', error)
          setFetchError('Failed to fetch users. Please check your database permissions.')
          return
        }

        if (data) {
          setUsers(data)
        }
      } catch (error) {
        console.error('Error in fetchUsers:', error)
        setFetchError('An unexpected error occurred while fetching users.')
      }
    }
    fetchUsers()
  }, [])

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
      toast({ title: "Success", description: "You have been signed in successfully" })
      router.refresh()
      router.push('/')
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message || "Failed to sign in" })
    } finally {
      setIsLoading(false)
    }
  }

  // Autofill and login as user
  const loginAsUser = (userEmail: string) => {
    setEmail(userEmail)
    setPassword('password123') // Default password for all test users
    setTimeout(() => {
      // Simulate form submit after state update
      const fakeEvent = { preventDefault: () => {} } as React.FormEvent
      handleSignIn(fakeEvent)
    }, 100)
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
              <Input id="email" type="email" placeholder="Enter your email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={isLoading}>{isLoading ? "Signing in..." : "Sign In"}</Button>
            <p className="text-sm text-muted-foreground text-center">
              Don't have an account?{' '}
              <Button variant="link" className="p-0 h-auto" onClick={() => router.push('/signup')}>Sign up</Button>
            </p>
          </CardFooter>
        </form>
      </Card>

      {/* User List for Testing */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Test Users</CardTitle>
          <CardDescription>Click a user to log in as them (password: <b>password123</b>)</CardDescription>
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
                No users were found in the database. Please make sure you have created some test users.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {users.map((user) => (
                <div key={user.id} className="flex flex-col border rounded p-3 bg-muted">
                  <span className="font-medium">{user.name || user.email.split('@')[0]}</span>
                  <span className="text-xs text-muted-foreground">{user.email}</span>
                  <span className="text-xs">Password: <b>password123</b></span>
                  <Button size="sm" className="mt-2" onClick={() => loginAsUser(user.email)}>
                    Login as this user
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 