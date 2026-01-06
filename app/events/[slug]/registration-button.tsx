'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CalendarDaysIcon, TicketIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

type RegistrationStatus = 'open' | 'not-open' | 'closed'

type EventRegistrationButtonProps = {
  eventId: string
  isActive: boolean
  status: RegistrationStatus
}

export default function EventRegistrationButton({
  eventId,
  isActive,
  status,
}: EventRegistrationButtonProps) {
  const [isRegistered, setIsRegistered] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const router = useRouter()

  // Check if the user is already registered for this event
  useEffect(() => {
    async function checkRegistrationStatus() {
      try {
        setIsLoading(true)
        // First, check if user is authenticated
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          setIsRegistered(null)
          return
        }

        const { data, error } = await fetch(`/api/events/${eventId}/register`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }).then((res) => res.json())

        if (error) {
          console.error('Error checking registration status:', error)
          return
        }

        setIsRegistered(data?.isRegistered || false)
      } catch (err) {
        console.error('Error checking registration status:', err)
      } finally {
        setIsLoading(false)
      }
    }

    checkRegistrationStatus()
  }, [eventId, supabase])

  const handleRegister = async () => {
    try {
      setIsSubmitting(true)
      setError(null)

      // First, check if user is authenticated
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        // Redirect to login page
        router.push(`/login?redirect=/events/${eventId}`)
        return
      }

      const response = await fetch(`/api/events/${eventId}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to register for event')
      }

      setIsRegistered(true)
      // Close modal if open
      setShowModal(false)
      // Refresh the page to show updated registration status
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'An error occurred during registration')
      console.error('Registration error:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancelRegistration = async () => {
    try {
      setIsSubmitting(true)
      setError(null)

      const response = await fetch(`/api/events/${eventId}/register`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to cancel registration')
      }

      setIsRegistered(false)
      // Refresh the page to show updated registration status
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'An error occurred while cancelling registration')
      console.error('Cancel registration error:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  // If we're still loading the registration status
  if (isLoading) {
    return (
      <button
        className="inline-flex items-center justify-center px-4 py-3 border border-transparent rounded-md shadow-xs text-base font-medium text-white bg-gray-400 cursor-not-allowed"
        disabled
      >
        <span className="animate-pulse">Checking registration...</span>
      </button>
    )
  }

  // If registration is not open yet or closed
  if (!isActive) {
    return (
      <button
        className="inline-flex items-center justify-center px-4 py-3 border border-transparent rounded-md shadow-xs text-base font-medium text-white bg-gray-500 cursor-not-allowed"
        disabled
      >
        {status === 'not-open' ? (
          <>
            <CalendarDaysIcon className="h-5 w-5 mr-2" />
            Registration Not Open Yet
          </>
        ) : (
          <>
            <XMarkIcon className="h-5 w-5 mr-2" />
            Registration Closed
          </>
        )}
      </button>
    )
  }

  // If the user is already registered
  if (isRegistered) {
    return (
      <div className="space-y-2">
        <div className="px-4 py-3 border border-green-500 rounded-md text-base font-medium text-green-700 bg-green-50 flex items-center">
          <TicketIcon className="h-5 w-5 mr-2" />
          You are registered for this event
        </div>
        <button
          onClick={handleCancelRegistration}
          disabled={isSubmitting}
          className="text-sm text-red-600 hover:text-red-800 hover:underline"
        >
          {isSubmitting ? 'Cancelling...' : 'Cancel registration'}
        </button>
      </div>
    )
  }

  // Default registration button
  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="inline-flex items-center justify-center px-4 py-3 border border-transparent rounded-md shadow-xs text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        <TicketIcon className="h-5 w-5 mr-2" />
        Register for Event
      </button>

      {/* Registration confirmation modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-4">
            <h3 className="text-lg font-semibold mb-4">Confirm Registration</h3>
            <p className="text-gray-700 mb-6">
              Are you sure you want to register for this event? You can cancel your registration
              later if needed.
            </p>

            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">{error}</div>
            )}

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                onClick={handleRegister}
                disabled={isSubmitting}
                className="px-4 py-2 border border-transparent rounded-md shadow-xs text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {isSubmitting ? 'Processing...' : 'Confirm Registration'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
