'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { verifyAdminCredentials, createAdminSession, validateAdminSession } from '../../../lib/adminAuth'
import { checkLoginRateLimit, recordFailedLoginAttempt, clearLoginAttempts } from '../../../lib/security'

export default function AdminLogin() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [isChecking, setIsChecking] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Check if already logged in
    const session = validateAdminSession()
    if (session.isValid) {
      router.push('/admin/dashboard')
    } else {
      setIsChecking(false)
    }
  }, [router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Check rate limiting
    const rateLimitCheck = checkLoginRateLimit()
    if (!rateLimitCheck.allowed) {
      setError(rateLimitCheck.error || 'Too many login attempts. Please try again later.')
      setLoading(false)
      return
    }

    // Sanitize inputs
    const sanitizedUsername = username.trim()
    const sanitizedPassword = password

    // Verify credentials
    if (verifyAdminCredentials(sanitizedUsername, sanitizedPassword)) {
      // Clear failed login attempts on success
      clearLoginAttempts()
      
      // Create session
      createAdminSession()
      
      // Redirect to admin dashboard
      router.push('/admin/dashboard')
    } else {
      // Record failed attempt
      recordFailedLoginAttempt()
      
      const newRateLimit = checkLoginRateLimit()
      if (newRateLimit.remainingAttempts !== undefined) {
        setError(`Invalid username or password. ${newRateLimit.remainingAttempts} attempt(s) remaining.`)
      } else {
        setError('Invalid username or password')
      }
      setLoading(false)
    }
  }

  if (isChecking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    )
  }


  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 md:p-10">
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center text-white text-4xl shadow-lg">
              👨‍🍳
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Login</h1>
            <p className="text-gray-600">Mnandi Flame-Grilled Management</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all bg-gray-50 focus:bg-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all bg-gray-50 focus:bg-white"
                required
              />
            </div>

            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 animate-fade-in">
                <div className="flex items-center">
                  <span className="text-red-500 mr-2">⚠️</span>
                  <p className="text-red-700 text-sm font-medium">{error}</p>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-3.5 rounded-lg hover:from-green-700 hover:to-green-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing In...
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <a 
              href="/"
              className="text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors inline-flex items-center"
            >
              <span className="mr-1">←</span> Back to Home
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
