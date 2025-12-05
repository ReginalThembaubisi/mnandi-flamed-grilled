// Security utilities for input validation, sanitization, and protection

/**
 * Sanitize string to prevent XSS attacks
 * Removes HTML tags and escapes special characters
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') {
    return ''
  }
  
  // Remove HTML tags
  let sanitized = input.replace(/<[^>]*>/g, '')
  
  // Escape special characters
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  }
  
  sanitized = sanitized.replace(/[&<>"'/]/g, (char) => map[char] || char)
  
  return sanitized.trim()
}

/**
 * Sanitize text for display (less aggressive - preserves line breaks)
 */
export function sanitizeText(input: string): string {
  if (typeof input !== 'string') {
    return ''
  }
  
  // Remove script tags and dangerous HTML
  let sanitized = input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
  
  // Escape HTML but preserve line breaks
  sanitized = sanitized
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
  
  return sanitized.trim()
}

/**
 * Validate and sanitize phone number
 */
export function validateAndSanitizePhone(phone: string): { valid: boolean; sanitized: string; error?: string } {
  if (!phone || typeof phone !== 'string') {
    return { valid: false, sanitized: '', error: 'Phone number is required' }
  }
  
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '')
  
  // Validate length (South African numbers: 10-12 digits)
  if (cleaned.length < 10 || cleaned.length > 12) {
    return { valid: false, sanitized: cleaned, error: 'Phone number must be 10-12 digits' }
  }
  
  // Check for valid South African format
  if (cleaned.startsWith('0') && cleaned.length === 10) {
    return { valid: true, sanitized: cleaned }
  }
  
  if (cleaned.startsWith('27') && cleaned.length === 11) {
    return { valid: true, sanitized: cleaned }
  }
  
  if (cleaned.length === 9 && !cleaned.startsWith('0') && !cleaned.startsWith('27')) {
    return { valid: true, sanitized: cleaned }
  }
  
  return { valid: false, sanitized: cleaned, error: 'Invalid phone number format' }
}

/**
 * Validate and sanitize name
 */
export function validateAndSanitizeName(name: string): { valid: boolean; sanitized: string; error?: string } {
  if (!name || typeof name !== 'string') {
    return { valid: false, sanitized: '', error: 'Name is required' }
  }
  
  const trimmed = name.trim()
  
  // Length validation
  if (trimmed.length < 2) {
    return { valid: false, sanitized: trimmed, error: 'Name must be at least 2 characters' }
  }
  
  if (trimmed.length > 100) {
    return { valid: false, sanitized: trimmed, error: 'Name must be less than 100 characters' }
  }
  
  // Sanitize (remove HTML, but allow spaces and common characters)
  const sanitized = sanitizeInput(trimmed)
  
  // Check for valid name format (letters, spaces, hyphens, apostrophes)
  if (!/^[a-zA-Z\s\-'\.]+$/.test(sanitized)) {
    return { valid: false, sanitized, error: 'Name contains invalid characters' }
  }
  
  return { valid: true, sanitized }
}

/**
 * Validate and sanitize room number
 */
export function validateAndSanitizeRoomNumber(room: string): { valid: boolean; sanitized: string; error?: string } {
  if (!room || typeof room !== 'string') {
    return { valid: false, sanitized: '', error: 'Room number is required' }
  }
  
  const trimmed = room.trim()
  
  // Length validation
  if (trimmed.length < 1) {
    return { valid: false, sanitized: trimmed, error: 'Room number is required' }
  }
  
  if (trimmed.length > 20) {
    return { valid: false, sanitized: trimmed, error: 'Room number must be less than 20 characters' }
  }
  
  // Sanitize
  const sanitized = sanitizeInput(trimmed)
  
  return { valid: true, sanitized }
}

/**
 * Validate and sanitize address
 */
export function validateAndSanitizeAddress(address: string, required: boolean = false): { valid: boolean; sanitized: string; error?: string } {
  if (!address || typeof address !== 'string') {
    if (required) {
      return { valid: false, sanitized: '', error: 'Address is required' }
    }
    return { valid: true, sanitized: '' }
  }
  
  const trimmed = address.trim()
  
  if (required && trimmed.length === 0) {
    return { valid: false, sanitized: trimmed, error: 'Address is required' }
  }
  
  // Length validation
  if (trimmed.length > 200) {
    return { valid: false, sanitized: trimmed, error: 'Address must be less than 200 characters' }
  }
  
  // Sanitize (less aggressive for addresses - allow more characters)
  const sanitized = sanitizeText(trimmed)
  
  return { valid: true, sanitized }
}

/**
 * Validate and sanitize instructions
 */
export function validateAndSanitizeInstructions(instructions: string): { valid: boolean; sanitized: string; error?: string } {
  if (!instructions || typeof instructions !== 'string') {
    return { valid: true, sanitized: '' }
  }
  
  const trimmed = instructions.trim()
  
  // Length validation
  if (trimmed.length > 500) {
    return { valid: false, sanitized: trimmed, error: 'Instructions must be less than 500 characters' }
  }
  
  // Sanitize
  const sanitized = sanitizeText(trimmed)
  
  return { valid: true, sanitized }
}

/**
 * Safe JSON parse with error handling
 */
export function safeJsonParse<T>(json: string, defaultValue: T): T {
  try {
    if (!json || typeof json !== 'string') {
      return defaultValue
    }
    
    const parsed = JSON.parse(json)
    return parsed as T
  } catch (error) {
    console.error('JSON parse error:', error)
    return defaultValue
  }
}

/**
 * Safe JSON stringify with error handling
 */
export function safeJsonStringify(obj: any, defaultValue: string = '[]'): string {
  try {
    return JSON.stringify(obj)
  } catch (error) {
    console.error('JSON stringify error:', error)
    return defaultValue
  }
}

/**
 * Sanitize phone number for WhatsApp URL (prevent injection)
 */
export function sanitizePhoneForWhatsApp(phone: string): string {
  // Remove all non-digit characters
  let cleaned = phone.replace(/\D/g, '')
  
  // Validate it's a reasonable length
  if (cleaned.length < 9 || cleaned.length > 15) {
    throw new Error('Invalid phone number length')
  }
  
  // Ensure it's numeric only (prevent injection)
  if (!/^\d+$/.test(cleaned)) {
    throw new Error('Phone number contains invalid characters')
  }
  
  return cleaned
}

/**
 * Sanitize message for WhatsApp URL (prevent injection)
 */
export function sanitizeMessageForWhatsApp(message: string): string {
  if (typeof message !== 'string') {
    return ''
  }
  
  // Limit length
  if (message.length > 2000) {
    message = message.substring(0, 2000)
  }
  
  // Remove control characters except newlines
  message = message.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '')
  
  return message
}

/**
 * Rate limiting for login attempts
 */
const LOGIN_ATTEMPTS_KEY = 'adminLoginAttempts'
const MAX_LOGIN_ATTEMPTS = 5
const LOCKOUT_DURATION = 15 * 60 * 1000 // 15 minutes

export interface LoginAttemptResult {
  allowed: boolean
  remainingAttempts?: number
  lockoutTime?: number
  error?: string
}

export function checkLoginRateLimit(): LoginAttemptResult {
  if (typeof window === 'undefined') {
    return { allowed: true }
  }
  
  const attemptsData = localStorage.getItem(LOGIN_ATTEMPTS_KEY)
  
  if (!attemptsData) {
    return { allowed: true, remainingAttempts: MAX_LOGIN_ATTEMPTS }
  }
  
  try {
    const { count, timestamp } = JSON.parse(attemptsData)
    const now = Date.now()
    const timeSinceFirstAttempt = now - timestamp
    
    // Reset if lockout period has passed
    if (timeSinceFirstAttempt > LOCKOUT_DURATION) {
      localStorage.removeItem(LOGIN_ATTEMPTS_KEY)
      return { allowed: true, remainingAttempts: MAX_LOGIN_ATTEMPTS }
    }
    
    // Check if locked out
    if (count >= MAX_LOGIN_ATTEMPTS) {
      const lockoutTime = LOCKOUT_DURATION - timeSinceFirstAttempt
      const minutes = Math.ceil(lockoutTime / (60 * 1000))
      return {
        allowed: false,
        lockoutTime,
        error: `Too many login attempts. Please try again in ${minutes} minute(s).`
      }
    }
    
    return {
      allowed: true,
      remainingAttempts: MAX_LOGIN_ATTEMPTS - count
    }
  } catch (error) {
    // If parsing fails, allow login but reset
    localStorage.removeItem(LOGIN_ATTEMPTS_KEY)
    return { allowed: true, remainingAttempts: MAX_LOGIN_ATTEMPTS }
  }
}

export function recordFailedLoginAttempt(): void {
  if (typeof window === 'undefined') {
    return
  }
  
  const attemptsData = localStorage.getItem(LOGIN_ATTEMPTS_KEY)
  const now = Date.now()
  
  if (!attemptsData) {
    localStorage.setItem(LOGIN_ATTEMPTS_KEY, JSON.stringify({
      count: 1,
      timestamp: now
    }))
    return
  }
  
  try {
    const { count, timestamp } = JSON.parse(attemptsData)
    const timeSinceFirstAttempt = now - timestamp
    
    // Reset if lockout period has passed
    if (timeSinceFirstAttempt > LOCKOUT_DURATION) {
      localStorage.setItem(LOGIN_ATTEMPTS_KEY, JSON.stringify({
        count: 1,
        timestamp: now
      }))
      return
    }
    
    // Increment count
    localStorage.setItem(LOGIN_ATTEMPTS_KEY, JSON.stringify({
      count: count + 1,
      timestamp: timestamp // Keep original timestamp
    }))
  } catch (error) {
    // Reset on error
    localStorage.setItem(LOGIN_ATTEMPTS_KEY, JSON.stringify({
      count: 1,
      timestamp: now
    }))
  }
}

export function clearLoginAttempts(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(LOGIN_ATTEMPTS_KEY)
  }
}

/**
 * Validate order confirmation number format
 */
export function validateOrderNumber(orderNumber: string): boolean {
  if (!orderNumber || typeof orderNumber !== 'string') {
    return false
  }
  
  // Format: SHI-123456 or similar (prefix-6digits)
  const pattern = /^[A-Z]{2,4}-\d{6,8}$/i
  return pattern.test(orderNumber.trim())
}

/**
 * Sanitize order number for lookup
 */
export function sanitizeOrderNumber(orderNumber: string): string {
  if (!orderNumber || typeof orderNumber !== 'string') {
    return ''
  }
  
  // Remove any dangerous characters, keep alphanumeric and hyphens
  return orderNumber.replace(/[^A-Z0-9\-]/gi, '').toUpperCase().trim()
}

