// Shared types and interfaces for the application

export interface MenuItem {
  'Items': string
  'Price': string
  'Available': string
  'Image URL': string
  'Description': string
  'Category': string
}

export interface BusinessStatus {
  'Day': string
  'Open': string
  'Opening Time': string
  'Closing Time': string
}

export interface SideOption {
  'Side Name': string
  'Available': string
  'Price': string
}

export interface CartItem {
  id: string
  name: string
  price: string
  basePrice?: string
  extraSidesCost?: number
  image?: string
  description?: string
  quantity: number
  selectedSide?: string
  isCombo?: boolean
}

export interface CustomerInfo {
  name: string
  roomNumber: string
  phoneNumber: string
  deliveryType: 'pickup' | 'delivery'
  deliveryAddress?: string
  instructions?: string
}

export interface Order {
  customer: CustomerInfo
  items: CartItem[]
  total: number
  timestamp: string
  orderId: string
  confirmationNumber?: string
  status?: 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled'
}

export interface DailySales {
  date: string
  totalRevenue: number
  orderCount: number
  items: { [key: string]: number }
}

export interface Customer {
  name: string
  roomNumber: string
  phoneNumber: string
  firstOrderDate: string
  totalOrders: number
  totalSpent: number
  lastOrderDate: string
}

export interface Special {
  id: string
  title: string
  description: string
  discount: string
  validUntil: string
  isActive: boolean
}

