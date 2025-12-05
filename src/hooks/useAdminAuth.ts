'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { validateAdminSession, updateLastActivity, AdminSession } from '../lib/adminAuth'

export function useAdminAuth(redirectToLogin: boolean = true) {
  const [session, setSession] = useState<AdminSession>({ isAuthenticated: false, isValid: false })
  const [isChecking, setIsChecking] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Check authentication immediately
    const checkAuth = () => {
      const authSession = validateAdminSession()
      setSession(authSession)
      setIsChecking(false)

      if (!authSession.isValid && redirectToLogin) {
        router.push('/admin/login')
      }
    }

    checkAuth()

    // Set up activity tracking - update on user interaction
    const updateActivity = () => {
      const currentSession = validateAdminSession()
      if (currentSession.isValid) {
        updateLastActivity()
      }
    }

    // Track user activity
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart']
    events.forEach(event => {
      window.addEventListener(event, updateActivity, { passive: true })
    })

    // Periodic session validation (every 5 minutes)
    const validationInterval = setInterval(() => {
      const authSession = validateAdminSession()
      setSession(authSession)
      
      if (!authSession.isValid && redirectToLogin) {
        router.push('/admin/login')
      }
    }, 5 * 60 * 1000) // Check every 5 minutes

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, updateActivity)
      })
      clearInterval(validationInterval)
    }
  }, [router, redirectToLogin])

  return {
    isAuthenticated: session.isValid,
    isChecking,
    session
  }
}

