// Admin authentication utilities
import { API_BASE_URL } from './javaAPI'

const SESSION_TIMEOUT = 8 * 60 * 60 * 1000 // 8 hours in milliseconds
const ACTIVITY_TIMEOUT = 30 * 60 * 1000 // 30 minutes of inactivity
const SESSION_KEY = 'adminLoggedIn'
const SESSION_TIME_KEY = 'adminLoginTime'
const LAST_ACTIVITY_KEY = 'adminLastActivity'

export interface AdminSession {
  isAuthenticated: boolean
  isValid: boolean
  timeRemaining?: number
}

/**
 * Check if admin session is valid
 */
export function validateAdminSession(): AdminSession {
  if (typeof window === 'undefined') {
    return { isAuthenticated: false, isValid: false }
  }

  const isLoggedIn = localStorage.getItem(SESSION_KEY)
  const loginTime = localStorage.getItem(SESSION_TIME_KEY)
  const lastActivity = localStorage.getItem(LAST_ACTIVITY_KEY)

  if (!isLoggedIn || !loginTime) {
    return { isAuthenticated: false, isValid: false }
  }

  const loginTimestamp = new Date(loginTime).getTime()
  const now = Date.now()
  const sessionAge = now - loginTimestamp

  // Check if session has expired (8 hours total)
  if (sessionAge > SESSION_TIMEOUT) {
    clearAdminSession()
    return { isAuthenticated: false, isValid: false }
  }

  // Check for inactivity timeout (30 minutes)
  if (lastActivity) {
    const lastActivityTime = parseInt(lastActivity, 10)
    const inactivityDuration = now - lastActivityTime

    if (inactivityDuration > ACTIVITY_TIMEOUT) {
      clearAdminSession()
      return { isAuthenticated: false, isValid: false }
    }
  }

  // Update last activity
  updateLastActivity()

  const timeRemaining = SESSION_TIMEOUT - sessionAge
  return {
    isAuthenticated: true,
    isValid: true,
    timeRemaining
  }
}

/**
 * Update last activity timestamp
 */
export function updateLastActivity(): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString())
  }
}

/**
 * Create admin session
 */
export function createAdminSession(): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(SESSION_KEY, 'true')
    localStorage.setItem(SESSION_TIME_KEY, new Date().toISOString())
    localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString())
  }
}

/**
 * Clear admin session
 */
export function clearAdminSession(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(SESSION_KEY)
    localStorage.removeItem(SESSION_TIME_KEY)
    localStorage.removeItem(LAST_ACTIVITY_KEY)
  }
}

/**
 * Verify admin credentials (async API call)
 */
export async function verifyAdminCredentialsAsync(username: string, password: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    })

    if (response.ok) {
      return true
    }
    return false
  } catch (error) {
    console.error('Login error:', error)
    return false
  }
}

/**
 * @deprecated Use verifyAdminCredentialsAsync instead
 */
export function verifyAdminCredentials(username: string, password: string): boolean {
  console.warn('Synchronous verifyAdminCredentials is deprecated. Use async version.')
  return false
}

/**
 * @deprecated Password management delegated to backend
 */
export async function setAdminPasswordAsync(newPassword: string): Promise<void> {
  console.warn('Client-side password setting is deprecated')
}

/**
 * @deprecated Password management delegated to backend
 */
export function setAdminPassword(newPassword: string): void {
  console.warn('Client-side password setting is deprecated')
}

/**
 * @deprecated Password management delegated to backend
 */
export function verifyPasswordForChange(currentPassword: string): boolean {
  console.warn('Client-side password verification is deprecated')
  return true // Allow change for now as backend handles actual auth
}

/**
 * Format time remaining in human-readable format
 */
export function formatTimeRemaining(ms: number): string {
  const hours = Math.floor(ms / (1000 * 60 * 60))
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60))

  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  return `${minutes}m`
}
