'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

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

  useEffect(() => {
    // Check if admin is logged in
    const isLoggedIn = localStorage.getItem('adminLoggedIn')
    if (!isLoggedIn) {
      router.push('/admin/login')
      return
    }

    loadData()
  }, [router])

  const loadData = () => {
    try {
      // Load customers from orders
      const orders = JSON.parse(localStorage.getItem('orders') || '[]')
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
      const savedSpecials = JSON.parse(localStorage.getItem('specials') || '[]')
      setSpecials(savedSpecials)
    } catch (err) {
      console.error('Error loading data:', err)
    } finally {
      setLoading(false)
    }
  }

  const createSpecial = () => {
    if (!newSpecial.title || !newSpecial.description) return

    const special: Special = {
      id: `special-${Date.now()}`,
      title: newSpecial.title!,
      description: newSpecial.description!,
      discount: newSpecial.discount || '',
      validUntil: newSpecial.validUntil || '',
      isActive: newSpecial.isActive || true
    }

    const updatedSpecials = [...specials, special]
    setSpecials(updatedSpecials)
    localStorage.setItem('specials', JSON.stringify(updatedSpecials))
    
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
    const message = `🎉 *SPECIAL OFFER - Mnandi Flame-Grilled*

${special.title}

${special.description}

${special.discount ? `💰 *Discount: ${special.discount}*` : ''}

${special.validUntil ? `⏰ *Valid until: ${new Date(special.validUntil).toLocaleDateString()}*` : ''}

🍽️ Order now and enjoy this amazing deal!

Thank you for being a valued customer! 🎉`

    const encodedMessage = encodeURIComponent(message)
    
    // Send to all customers
    customers.forEach(customer => {
      let phoneNumber = customer.phoneNumber.replace(/\s/g, '')
      
      // Add South African country code if not present
      if (!phoneNumber.startsWith('27')) {
        if (phoneNumber.startsWith('0')) {
          phoneNumber = '27' + phoneNumber.substring(1)
        } else {
          phoneNumber = '27' + phoneNumber
        }
      }

      const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`
      window.open(whatsappUrl, '_blank')
    })
  }

  const sendSpecialToCustomer = (special: Special, customer: Customer) => {
    const message = `🎉 *SPECIAL OFFER - Mnandi Flame-Grilled*

Hi ${customer.name}! 👋

${special.title}

${special.description}

${special.discount ? `💰 *Discount: ${special.discount}*` : ''}

${special.validUntil ? `⏰ *Valid until: ${new Date(special.validUntil).toLocaleDateString()}*` : ''}

🍽️ Order now and enjoy this amazing deal!

Thank you for being a valued customer! 🎉`

    const encodedMessage = encodeURIComponent(message)
    
    let phoneNumber = customer.phoneNumber.replace(/\s/g, '')
    
    // Add South African country code if not present
    if (!phoneNumber.startsWith('27')) {
      if (phoneNumber.startsWith('0')) {
        phoneNumber = '27' + phoneNumber.substring(1)
      } else {
        phoneNumber = '27' + phoneNumber
      }
    }

    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`
    window.open(whatsappUrl, '_blank')
  }

  const deleteSpecial = (specialId: string) => {
    const updatedSpecials = specials.filter(s => s.id !== specialId)
    setSpecials(updatedSpecials)
    localStorage.setItem('specials', JSON.stringify(updatedSpecials))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-center justify-between mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4 md:mb-0">
            👥 Customer Management
          </h1>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowSpecialForm(true)}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
            >
              <span>🎉</span>
              <span>Create Special</span>
            </button>
            <Link 
              href="/admin/dashboard"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <span>📊</span>
              <span>Dashboard</span>
            </Link>
            <button
              onClick={() => {
                localStorage.removeItem('adminLoggedIn')
                localStorage.removeItem('adminLoginTime')
                router.push('/admin/login')
              }}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Specials Section */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">🎉 Special Offers</h2>
          
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
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">👥 Customer Database</h2>
          <p className="text-gray-600 mb-6">Total customers: {customers.length}</p>
          
          {customers.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No customers yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-800">Customer</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-800">Room</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-800">Phone</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-800">Orders</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-800">Total Spent</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-800">Last Order</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-800">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((customer, index) => (
                    <tr key={index} className="border-b border-gray-100">
                      <td className="py-3 px-4 font-medium text-gray-800">{customer.name}</td>
                      <td className="py-3 px-4 text-gray-600">{customer.roomNumber}</td>
                      <td className="py-3 px-4 text-gray-600">{customer.phoneNumber}</td>
                      <td className="py-3 px-4 text-gray-600">{customer.totalOrders}</td>
                      <td className="py-3 px-4 text-green-600 font-medium">R{customer.totalSpent.toFixed(2)}</td>
                      <td className="py-3 px-4 text-gray-600 text-sm">
                        {new Date(customer.lastOrderDate).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex space-x-2">
                          {specials.map((special) => (
                            <button
                              key={special.id}
                              onClick={() => sendSpecialToCustomer(special, customer)}
                              className="bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700 transition-colors"
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
          )}
        </div>
      </div>
    </div>
  )
}
