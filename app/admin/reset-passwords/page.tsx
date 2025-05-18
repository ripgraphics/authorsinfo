"use client"

import { useEffect, useState } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, CheckCircle2 } from "lucide-react"

export default function ResetPasswordsAdminPage() {
  const [users, setUsers] = useState<any[]>([])
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [allPassword, setAllPassword] = useState("")
  const [allStatus, setAllStatus] = useState<string | null>(null)
  const [userPasswords, setUserPasswords] = useState<{ [id: string]: string }>({})
  const [userStatus, setUserStatus] = useState<{ [id: string]: string }>({})
  const [loadingAll, setLoadingAll] = useState(false)
  const [loadingUser, setLoadingUser] = useState<{ [id: string]: boolean }>({})

  useEffect(() => {
    async function fetchUsers() {
      try {
        const res = await fetch("/api/auth-users")
        if (!res.ok) {
          setFetchError("Failed to fetch users from Auth.")
          return
        }
        const data = await res.json()
        setUsers(data)
      } catch (error) {
        setFetchError("An unexpected error occurred while fetching users.")
      }
    }
    fetchUsers()
  }, [])

  // Reset all users' passwords
  async function handleResetAll(e: React.FormEvent) {
    e.preventDefault()
    setAllStatus(null)
    setLoadingAll(true)
    try {
      const res = await fetch("/api/admin/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true, password: allPassword })
      })
      const data = await res.json()
      if (res.ok) {
        setAllStatus("All users' passwords have been reset successfully.")
      } else {
        setAllStatus(data.error || "Failed to reset all passwords.")
      }
    } catch (err) {
      setAllStatus("Unexpected error resetting all passwords.")
    } finally {
      setLoadingAll(false)
    }
  }

  // Reset a single user's password
  async function handleResetUser(userId: string, e: React.FormEvent) {
    e.preventDefault()
    setUserStatus((s) => ({ ...s, [userId]: "" }))
    setLoadingUser((l) => ({ ...l, [userId]: true }))
    try {
      const res = await fetch("/api/admin/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, password: userPasswords[userId] })
      })
      const data = await res.json()
      if (res.ok) {
        setUserStatus((s) => ({ ...s, [userId]: "Password reset successfully." }))
      } else {
        setUserStatus((s) => ({ ...s, [userId]: data.error || "Failed to reset password." }))
      }
    } catch (err) {
      setUserStatus((s) => ({ ...s, [userId]: "Unexpected error." }))
    } finally {
      setLoadingUser((l) => ({ ...l, [userId]: false }))
    }
  }

  return (
    <div className="max-w-3xl mx-auto py-10 space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Reset All Users' Passwords</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleResetAll} className="flex flex-col gap-4 md:flex-row md:items-end">
            <Input
              type="password"
              placeholder="Enter new password for all users"
              value={allPassword}
              onChange={(e) => setAllPassword(e.target.value)}
              required
              className="md:w-80"
            />
            <Button type="submit" disabled={loadingAll || !allPassword} className="md:ml-4">
              {loadingAll ? "Resetting..." : "Reset All Passwords"}
            </Button>
          </form>
          {allStatus && (
            <Alert className="mt-4" variant={allStatus.includes("success") ? "default" : "destructive"}>
              {allStatus.includes("success") ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <AlertCircle className="h-4 w-4" />}
              <AlertTitle>{allStatus.includes("success") ? "Success" : "Error"}</AlertTitle>
              <AlertDescription>{allStatus}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Reset Individual User Password</CardTitle>
        </CardHeader>
        <CardContent>
          {fetchError ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{fetchError}</AlertDescription>
            </Alert>
          ) : users.length === 0 ? (
            <div>No users found.</div>
          ) : (
            <div className="space-y-4">
              {users.map((user) => (
                <form
                  key={user.id}
                  onSubmit={(e) => handleResetUser(user.id, e)}
                  className="flex flex-col md:flex-row md:items-end gap-2 border-b pb-3"
                >
                  <div className="flex-1">
                    <div className="font-medium">{user.name || user.email}</div>
                    <div className="text-xs text-muted-foreground">{user.email}</div>
                  </div>
                  <Input
                    type="password"
                    placeholder="New password"
                    value={userPasswords[user.id] || ""}
                    onChange={(e) => setUserPasswords((p) => ({ ...p, [user.id]: e.target.value }))}
                    required
                    className="md:w-64"
                  />
                  <Button type="submit" size="sm" disabled={loadingUser[user.id] || !userPasswords[user.id]}>
                    {loadingUser[user.id] ? "Resetting..." : "Reset Password"}
                  </Button>
                  {userStatus[user.id] && (
                    <span className={userStatus[user.id].includes("success") ? "text-green-600 ml-2" : "text-red-600 ml-2"}>
                      {userStatus[user.id]}
                    </span>
                  )}
                </form>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 