// Utility functions for the application

/**
 * Format phone number for WhatsApp (South African format)
 */
export function formatPhoneNumber(phoneNumber: string): string {
  let cleanNumber = phoneNumber.replace(/\D/g, '')
  
  // If number starts with 0, replace with 27 (South Africa)
  if (cleanNumber.startsWith('0')) {
    cleanNumber = '27' + cleanNumber.substring(1)
  }
  // If number doesn't start with country code, add +27
  else if (!cleanNumber.startsWith('27')) {
    cleanNumber = '27' + cleanNumber
  }
  
  return cleanNumber
}

/**
 * Format price to R currency format
 */
export function formatPrice(price: number | string): string {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price
  return `R${numPrice.toFixed(2)}`
}

/**
 * Format date to readable string
 */
export function formatDate(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return dateObj.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  })
}

/**
 * Format date and time to readable string
 */
export function formatDateTime(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return dateObj.toLocaleString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

/**
 * Calculate total price from cart items
 */
export function calculateCartTotal(items: Array<{ price: string | number; quantity: number }>): number {
  return items.reduce((total, item) => {
    const price = typeof item.price === 'string' ? parseFloat(item.price) : item.price
    return total + (price * (item.quantity || 1))
  }, 0)
}

/**
 * Generate order confirmation number
 */
export function generateOrderNumber(prefix: string = 'SHI'): string {
  return `${prefix}-${Date.now().toString().slice(-6)}`
}

/**
 * Validate email format (if needed in future)
 */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

/**
 * Validate phone number format (South African)
 */
export function isValidPhoneNumber(phone: string): boolean {
  const clean = phone.replace(/\D/g, '')
  return clean.length >= 10 && clean.length <= 12
}

/**
 * Debounce function for search inputs
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null
      func(...args)
    }
    
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

/**
 * Get status color class for order status
 */
export function getStatusColor(status: string): string {
  switch (status) {
    case 'pending': return 'bg-yellow-100 text-yellow-800'
    case 'preparing': return 'bg-blue-100 text-blue-800'
    case 'ready': return 'bg-green-100 text-green-800'
    case 'completed': return 'bg-gray-100 text-gray-800'
    case 'cancelled': return 'bg-red-100 text-red-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

/**
 * Get status emoji for order status
 */
export function getStatusEmoji(status: string): string {
  switch (status) {
    case 'pending': return '⏳'
    case 'preparing': return '👨‍🍳'
    case 'ready': return '✅'
    case 'completed': return '🎉'
    case 'cancelled': return '🚫'
    default: return '❓'
  }
}

/**
 * Get status label for order status
 */
export function getStatusLabel(status: string): string {
  switch (status) {
    case 'pending': 
    case 'preparing': 
      return 'Order Placed'
    case 'ready': 
      return 'Ready'
    case 'completed': 
      return 'Completed'
    case 'cancelled':
      return 'Cancelled'
    default: 
      return 'Unknown'
  }
}

