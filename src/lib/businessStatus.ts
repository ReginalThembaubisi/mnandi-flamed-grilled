// Business status management with timestamp and cross-device sync via Java Backend

import { configAPI } from './javaAPI'

export interface BusinessStatusData {
  isOpen: boolean
  message?: string
  timestamp: string
  updatedBy?: string
  loading?: boolean
}

/**
 * Get business status from backend (primary source of truth)
 */
export async function getBusinessStatusAsync(): Promise<BusinessStatusData | null> {
  try {
    // Always get from backend
    const config = await configAPI.getStatus()

    const status: BusinessStatusData = {
      isOpen: config.isOpen,
      message: config.message,
      timestamp: config.updatedAt || new Date().toISOString(),
      updatedBy: config.updatedBy
    }

    return status
  } catch (e) {
    console.warn('Failed to fetch business status from backend:', e)
    return null
  }
}

/**
 * Deprecated: Synchronous access removed. Always use async.
 */
export function getBusinessStatus(): BusinessStatusData | null {
  return null
}

/**
 * Set business status on backend
 */
export async function setBusinessStatus(isOpen: boolean, message?: string): Promise<void> {
  try {
    // Update backend only
    await configAPI.updateStatus(isOpen, message || '')
  } catch (e) {
    console.error('Failed to update business status on backend:', e)
    throw e // Propagate error to UI
  }
}

/**
 * Check if business is open
 */
export async function isBusinessOpen(): Promise<boolean | null> {
  const status = await getBusinessStatusAsync()
  return status ? status.isOpen : null
}

