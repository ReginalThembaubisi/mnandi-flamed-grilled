'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAdminAuth } from '../../../hooks/useAdminAuth'
import { clearAdminSession } from '../../../lib/adminAuth'
import { AdminLayout } from '../../../components/admin/AdminLayout'
import { sanitizeText, sanitizePhoneForWhatsApp, sanitizeMessageForWhatsApp, validateAndSanitizePhone, safeJsonParse, safeJsonStringify } from '../../../lib/security'

interface Customer {
  name: string
  roomNumber: string
  phoneNumber: string
  firstOrderDate: string
  totalOrders: number
  totalSpent: number
  lastOrderDate: string
}

interface Order {
  customer: {
    name: string
    roomNumber: string
    phoneNumber: string
  }
  timestamp: string
  total: number
}

interface Special {
  id: string
  title: string
  description: string
  discount: string
  validUntil: string
  isActive: boolean
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [specials, setSpecials] = useState<Special[]>([])
  const [loading, setLoading] = useState(true)
  const [showSpecialForm, setShowSpecialForm] = useState(false)
  const [newSpecial, setNewSpecial] = useState<Partial<Special>>({
    title: '',
    description: '',
    discount: '',
    validUntil: '',
    isActive: true
  })
  const router = useRouter()
  const { isAuthenticated, isChecking } = useAdminAuth()

  useEffect(() => {
    if (!isChecking && !isAuthenticated) {
      return
    }

    if (!isAuthenticated) {
      return
    }

    loadData()
  }, [router, isAuthenticated, isChecking])

  const loadData = () => {
    try {
      // Load customers from orders
      const orders = safeJsonParse<Order[]>(localStorage.getItem('orders') || '[]', [])
      const customerMap = new Map<string, Customer>()

      orders.forEach((order: Order) => {
        const phone = order.customer.phoneNumber
        if (!customerMap.has(phone)) {
          customerMap.set(phone, {
            name: order.customer.name,
            roomNumber: order.customer.roomNumber,
            phoneNumber: phone,
            firstOrderDate: order.timestamp,
            totalOrders: 1,
            totalSpent: order.total,
            lastOrderDate: order.timestamp
          })
        } else {
          const customer = customerMap.get(phone)!
          customer.totalOrders += 1
          customer.totalSpent += order.total
          if (new Date(order.timestamp) > new Date(customer.lastOrderDate)) {
            customer.lastOrderDate = order.timestamp
          }
        }
      })

      setCustomers(Array.from(customerMap.values()).sort((a, b) => 
        new Date(b.lastOrderDate).getTime() - new Date(a.lastOrderDate).getTime()
      ))

      // Load specials
      const savedSpecials = safeJsonParse<Special[]>(localStorage.getItem('specials') || '[]', [])
      setSpecials(savedSpecials)
    } catch (err) {
      console.error('Error loading data:', err)
    } finally {
      setLoading(false)
    }
  }

  const createSpecial = () => {
    if (!newSpecial.title || !newSpecial.description) return

    // Sanitize inputs
    const sanitizedTitle = sanitizeText(newSpecial.title).substring(0, 100)
    const sanitizedDescription = sanitizeText(newSpecial.description).substring(0, 500)
    const sanitizedDiscount = sanitizeText(newSpecial.discount || '').substring(0, 50)

    const special: Special = {
      id: `special-${Date.now()}`,
      title: sanitizedTitle,
      description: sanitizedDescription,
      discount: sanitizedDiscount,
      validUntil: newSpecial.validUntil || '',
      isActive: newSpecial.isActive || true
    }

    const updatedSpecials = [...specials, special]
    setSpecials(updatedSpecials)
    localStorage.setItem('specials', safeJsonStringify(updatedSpecials))
    
    setNewSpecial({
      title: '',
      description: '',
      discount: '',
      validUntil: '',
      isActive: true
    })
    setShowSpecialForm(false)
  }

  const sendSpecialToAll = (special: Special) => {
    try {
      const message = `🎉 *SPECIAL OFFER - Mnandi Flame-Grilled*

${sanitizeText(special.title)}

${sanitizeText(special.description)}

${special.discount ? `💰 *Discount: ${sanitizeText(special.discount)}*` : ''}

${special.validUntil ? `⏰ *Valid until: ${new Date(special.validUntil).toLocaleDateString()}*` : ''}

🍽️ Order now and enjoy this amazing deal!

Thank you for being a valued customer! 🎉`

      const sanitizedMessage = sanitizeMessageForWhatsApp(message)
      const encodedMessage = encodeURIComponent(sanitizedMessage)
      
      // Send to all customers
      customers.forEach(customer => {
        try {
          const phoneValidation = validateAndSanitizePhone(customer.phoneNumber)
          if (!phoneValidation.valid) {
            console.warn(`Invalid phone number for customer ${customer.name}: ${phoneValidation.error}`)
            return
          }
          
          let phoneNumber = phoneValidation.sanitized
          
          // Add South African country code if not present
          if (phoneNumber.startsWith('0')) {
            phoneNumber = '27' + phoneNumber.substring(1)
          } else if (!phoneNumber.startsWith('27')) {
            phoneNumber = '27' + phoneNumber
          }

          // Final security check
          const sanitizedPhone = sanitizePhoneForWhatsApp(phoneNumber)
          const whatsappUrl = `https://wa.me/${sanitizedPhone}?text=${encodedMessage}`
          window.open(whatsappUrl, '_blank')
        } catch (error) {
          console.error(`Error sending to ${customer.name}:`, error)
        }
      })
    } catch (error) {
      console.error('Error sending special to all:', error)
      alert('Error sending messages. Please check customer phone numbers.')
    }
  }

  const sendSpecialToCustomer = (special: Special, customer: Customer) => {
    try {
      const message = `🎉 *SPECIAL OFFER - Mnandi Flame-Grilled*

Hi ${sanitizeText(customer.name)}! 👋

${sanitizeText(special.title)}

${sanitizeText(special.description)}

${special.discount ? `💰 *Discount: ${sanitizeText(special.discount)}*` : ''}

${special.validUntil ? `⏰ *Valid until: ${new Date(special.validUntil).toLocaleDateString()}*` : ''}

🍽️ Order now and enjoy this amazing deal!

Thank you for being a valued customer! 🎉`

      const sanitizedMessage = sanitizeMessageForWhatsApp(message)
      const encodedMessage = encodeURIComponent(sanitizedMessage)
      
      const phoneValidation = validateAndSanitizePhone(customer.phoneNumber)
      if (!phoneValidation.valid) {
        alert(`Invalid phone number: ${phoneValidation.error}`)
        return
      }
      
      let phoneNumber = phoneValidation.sanitized
      
      // Add South African country code if not present
      if (phoneNumber.startsWith('0')) {
        phoneNumber = '27' + phoneNumber.substring(1)
      } else if (!phoneNumber.startsWith('27')) {
        phoneNumber = '27' + phoneNumber
      }

      // Final security check
      const sanitizedPhone = sanitizePhoneForWhatsApp(phoneNumber)
      const whatsappUrl = `https://wa.me/${sanitizedPhone}?text=${encodedMessage}`
      window.open(whatsappUrl, '_blank')
    } catch (error) {
      console.error('Error sending special to customer:', error)
      alert('Error sending message. Please check the phone number.')
    }
  }

  const deleteSpecial = (specialId: string) => {
    const updatedSpecials = specials.filter(s => s.id !== specialId)
    setSpecials(updatedSpecials)
    localStorage.setItem('specials', safeJsonStringify(updatedSpecials))
  }

  if (isChecking || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null // Will redirect via useAdminAuth
  }

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Customer Management</h1>
              <p className="text-gray-600">Manage customers and create special offers</p>
            </div>
            <button
              onClick={() => setShowSpecialForm(true)}
              className="px-5 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2 font-medium shadow-sm"
            >
              <span>🎉</span>
              <span>Create Special</span>
            </button>
          </div>
        </div>

        {/* Specials Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600 text-xl">
              🎉
            </div>
            <h2 className="text-2xl font-semibold text-gray-900">Special Offers</h2>
          </div>
          
          {showSpecialForm && (
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <h3 className="font-semibold text-gray-800 mb-3">Create New Special</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Special Title"
                  value={newSpecial.title}
                  onChange={(e) => setNewSpecial({...newSpecial, title: e.target.value})}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                <input
                  type="text"
                  placeholder="Discount (e.g., 20% off)"
                  value={newSpecial.discount}
                  onChange={(e) => setNewSpecial({...newSpecial, discount: e.target.value})}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                <input
                  type="date"
                  placeholder="Valid Until"
                  value={newSpecial.validUntil}
                  onChange={(e) => setNewSpecial({...newSpecial, validUntil: e.target.value})}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={newSpecial.isActive}
                    onChange={(e) => setNewSpecial({...newSpecial, isActive: e.target.checked})}
                    className="rounded"
                  />
                  <label className="text-sm text-gray-700">Active</label>
                </div>
              </div>
              <textarea
                placeholder="Special Description"
                value={newSpecial.description}
                onChange={(e) => setNewSpecial({...newSpecial, description: e.target.value})}
                className="w-full mt-4 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                rows={3}
              />
              <div className="flex space-x-2 mt-4">
                <button
                  onClick={createSpecial}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Create Special
                </button>
                <button
                  onClick={() => setShowSpecialForm(false)}
                  className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="grid gap-4">
            {specials.map((special) => (
              <div key={special.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-800">{special.title}</h3>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      special.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {special.isActive ? 'Active' : 'Inactive'}
                    </span>
                    <button
                      onClick={() => deleteSpecial(special.id)}
                      className="text-red-600 hover:text-red-700 text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <p className="text-gray-600 text-sm mb-2">{special.description}</p>
                {special.discount && (
                  <p className="text-green-600 font-medium text-sm mb-2">{special.discount}</p>
                )}
                {special.validUntil && (
                  <p className="text-gray-500 text-xs mb-3">
                    Valid until: {new Date(special.validUntil).toLocaleDateString()}
                  </p>
                )}
                <div className="flex space-x-2">
                  <button
                    onClick={() => sendSpecialToAll(special)}
                    className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors"
                  >
                    📱 Send to All Customers
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Customers Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 text-xl">
              👥
            </div>
            <h2 className="text-2xl font-semibold text-gray-900">Customer Database</h2>
          </div>
          <p className="text-gray-600 mb-6">Total customers: {customers.length}</p>
          
          {customers.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">👥</div>
              <p className="text-gray-500 text-lg">No customers yet</p>
              <p className="text-gray-400 text-sm mt-2">Customers will appear here after placing orders</p>
            </div>
          ) : (
            <>
              {/* Mobile Card View */}
              <div className="block md:hidden space-y-4">
                {customers.map((customer, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 text-lg mb-1">{customer.name}</h3>
                        <p className="text-sm text-gray-600">Room: {customer.roomNumber}</p>
                        <p className="text-sm text-gray-600">Phone: {customer.phoneNumber}</p>
                      </div>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {customer.totalOrders} orders
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
                      <div>
                        <span className="text-gray-500">Total Spent:</span>
                        <span className="text-green-600 font-semibold ml-1">R{customer.totalSpent.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Last Order:</span>
                        <span className="text-gray-700 ml-1">{new Date(customer.lastOrderDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {specials.map((special) => (
                        <button
                          key={special.id}
                          onClick={() => sendSpecialToCustomer(special, customer)}
                          className="bg-blue-600 text-white px-3 py-2 rounded-lg text-xs hover:bg-blue-700 transition-colors font-medium shadow-sm min-h-[44px]"
                        >
                          Send Special
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-gray-200">
                      <th className="text-left py-4 px-4 font-semibold text-gray-700 text-sm uppercase tracking-wider">Customer</th>
                      <th className="text-left py-4 px-4 font-semibold text-gray-700 text-sm uppercase tracking-wider">Room</th>
                      <th className="text-left py-4 px-4 font-semibold text-gray-700 text-sm uppercase tracking-wider">Phone</th>
                      <th className="text-left py-4 px-4 font-semibold text-gray-700 text-sm uppercase tracking-wider">Orders</th>
                      <th className="text-left py-4 px-4 font-semibold text-gray-700 text-sm uppercase tracking-wider">Total Spent</th>
                      <th className="text-left py-4 px-4 font-semibold text-gray-700 text-sm uppercase tracking-wider">Last Order</th>
                      <th className="text-left py-4 px-4 font-semibold text-gray-700 text-sm uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {customers.map((customer, index) => (
                      <tr key={index} className="hover:bg-gray-50 transition-colors">
                        <td className="py-4 px-4 font-medium text-gray-900">{customer.name}</td>
                        <td className="py-4 px-4 text-gray-600">{customer.roomNumber}</td>
                        <td className="py-4 px-4 text-gray-600">{customer.phoneNumber}</td>
                        <td className="py-4 px-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {customer.totalOrders}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-green-600 font-semibold">R{customer.totalSpent.toFixed(2)}</td>
                        <td className="py-4 px-4 text-gray-600 text-sm">
                          {new Date(customer.lastOrderDate).toLocaleDateString()}
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex flex-wrap gap-2">
                            {specials.map((special) => (
                              <button
                                key={special.id}
                                onClick={() => sendSpecialToCustomer(special, customer)}
                                className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs hover:bg-blue-700 transition-colors font-medium shadow-sm"
                              >
                                Send Special
                              </button>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}
