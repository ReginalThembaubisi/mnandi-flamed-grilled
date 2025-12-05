// Business status management with timestamp and cross-device sync

import { getSupabase } from './supabaseClient'

const BUSINESS_STATUS_KEY = 'businessStatus'
const STATUS_STALE_THRESHOLD = 60 * 60 * 1000 // 1 hour in milliseconds

export interface BusinessStatusData {
  isOpen: boolean
  message?: string
  timestamp: string
  updatedBy?: string
}

/**
 * Get business status from localStorage with staleness check
 */
export function getBusinessStatus(): BusinessStatusData | null {
  if (typeof window === 'undefined') {
    return null
  }

  const stored = localStorage.getItem(BUSINESS_STATUS_KEY)
  if (!stored) {
    return null
  }

  try {
    const status: BusinessStatusData = JSON.parse(stored)
    
    // Check if status is stale (older than threshold)
    const statusTime = new Date(status.timestamp).getTime()
    const now = Date.now()
    const age = now - statusTime

    if (age > STATUS_STALE_THRESHOLD) {
      // Status is stale, return null so caller can use fallback
      return null
    }

    return status
  } catch (e) {
    console.error('Error parsing business status:', e)
    return null
  }
}

/**
 * Set business status with timestamp
 */
export async function setBusinessStatus(isOpen: boolean, message?: string): Promise<void> {
  if (typeof window === 'undefined') {
    return
  }

  const status: BusinessStatusData = {
    isOpen,
    message,
    timestamp: new Date().toISOString(),
    updatedBy: 'admin'
  }

  // Save to localStorage
  localStorage.setItem(BUSINESS_STATUS_KEY, JSON.stringify(status))

  // Try to sync to Supabase if available
  try {
    const supabase = getSupabase()
    if (supabase) {
      // Try to update/create business status in Supabase
      // This assumes a 'business_status' table exists
      const { error } = await supabase
        .from('business_status')
        .upsert({
          id: 'current', // Single row for current status
          is_open: isOpen,
          message: message || null,
          updated_at: new Date().toISOString(),
          updated_by: 'admin'
        }, {
          onConflict: 'id'
        })

      if (error) {
        console.warn('Failed to sync business status to Supabase:', error.message)
        // Continue anyway - localStorage is updated
      }
    }
  } catch (e) {
    console.warn('Error syncing business status to Supabase:', e)
    // Continue anyway - localStorage is updated
  }
}

/**
 * Get business status from Supabase (for cross-device sync)
 */
export async function getBusinessStatusFromSupabase(): Promise<BusinessStatusData | null> {
  try {
    const supabase = getSupabase()
    if (!supabase) {
      return null
    }

    const { data, error } = await supabase
      .from('business_status')
      .select('*')
      .eq('id', 'current')
      .single()

    if (error || !data) {
      return null
    }

    const status: BusinessStatusData = {
      isOpen: data.is_open,
      message: data.message || undefined,
      timestamp: data.updated_at,
      updatedBy: data.updated_by || undefined
    }

    // Update localStorage with synced status
    localStorage.setItem(BUSINESS_STATUS_KEY, JSON.stringify(status))

    return status
  } catch (e) {
    console.warn('Error fetching business status from Supabase:', e)
    return null
  }
}

/**
 * Check if business is open, with fallback logic
 * Returns true if open, false if closed, or null if unknown
 */
export async function isBusinessOpen(): Promise<boolean | null> {
  // First check localStorage
  const localStatus = getBusinessStatus()
  
  if (localStatus) {
    return localStatus.isOpen
  }

  // If local status is stale or missing, try Supabase
  const supabaseStatus = await getBusinessStatusFromSupabase()
  if (supabaseStatus) {
    return supabaseStatus.isOpen
  }

  // No status available - return null to use fallback (Google Sheets or default)
  return null
}

/**
 * Check if business status is stale
 */
export function isBusinessStatusStale(): boolean {
  const status = getBusinessStatus()
  if (!status) {
    return true
  }

  const statusTime = new Date(status.timestamp).getTime()
  const now = Date.now()
  return (now - statusTime) > STATUS_STALE_THRESHOLD
}

