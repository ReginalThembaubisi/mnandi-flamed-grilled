// Admin authentication utilities

const SESSION_TIMEOUT = 8 * 60 * 60 * 1000 // 8 hours in milliseconds
const ACTIVITY_TIMEOUT = 30 * 60 * 1000 // 30 minutes of inactivity
const SESSION_KEY = 'adminLoggedIn'
const SESSION_TIME_KEY = 'adminLoginTime'
const LAST_ACTIVITY_KEY = 'adminLastActivity'
const PASSWORD_KEY = 'adminPassword'

// Improved hash function using Web Crypto API if available, fallback to simple hash
async function hashPassword(password: string): Promise<string> {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    try {
      // Use Web Crypto API for better security
      const encoder = new TextEncoder()
      const data = encoder.encode(password)
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', data)
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
    } catch (error) {
      console.warn('Web Crypto API not available, using fallback hash')
    }
  }
  
  // Fallback: Simple hash (not cryptographically secure, but better than plain text)
  let hash = 0
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  return hash.toString(36)
}

// Synchronous version for compatibility (uses fallback)
function simpleHash(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return hash.toString(36)
}

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
 * Verify admin credentials (async version with better hashing)
 */
export async function verifyAdminCredentialsAsync(username: string, password: string): Promise<boolean> {
  if (username !== 'admin' || !password) {
    return false
  }

  const storedPasswordHash = localStorage.getItem(PASSWORD_KEY)
  const defaultPassword = 'mnandi2024'
  
  // If no stored password, use default
  if (!storedPasswordHash) {
    return password === defaultPassword
  }

  // Compare hashed passwords
  const inputHash = await hashPassword(password)
  return inputHash === storedPasswordHash
}

/**
 * Verify admin credentials (synchronous version for compatibility)
 */
export function verifyAdminCredentials(username: string, password: string): boolean {
  if (username !== 'admin' || !password) {
    return false
  }

  const storedPasswordHash = localStorage.getItem(PASSWORD_KEY)
  const defaultPassword = 'mnandi2024'
  
  // If no stored password, use default
  if (!storedPasswordHash) {
    return password === defaultPassword
  }

  // Compare hashed passwords (using fallback for sync)
  const inputHash = simpleHash(password)
  return inputHash === storedPasswordHash
}

/**
 * Set admin password (stores hashed version - async)
 */
export async function setAdminPasswordAsync(newPassword: string): Promise<void> {
  if (typeof window !== 'undefined' && newPassword) {
    const hash = await hashPassword(newPassword)
    localStorage.setItem(PASSWORD_KEY, hash)
  }
}

/**
 * Set admin password (stores hashed version - sync for compatibility)
 */
export function setAdminPassword(newPassword: string): void {
  if (typeof window !== 'undefined' && newPassword) {
    const hash = simpleHash(newPassword)
    localStorage.setItem(PASSWORD_KEY, hash)
  }
}

/**
 * Get current password hash (for verification during password change)
 */
export function getCurrentPasswordHash(): string | null {
  if (typeof window === 'undefined') {
    return null
  }
  return localStorage.getItem(PASSWORD_KEY)
}

/**
 * Verify password for password change
 */
export function verifyPasswordForChange(currentPassword: string): boolean {
  const storedHash = getCurrentPasswordHash()
  const defaultPassword = 'mnandi2024'
  
  if (!storedHash) {
    // No stored password, use default
    return currentPassword === defaultPassword
  }

  const inputHash = simpleHash(currentPassword)
  return inputHash === storedHash
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

