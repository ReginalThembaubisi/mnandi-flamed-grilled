import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-800 mb-4">
            🍽️ Welcome to Mnandi Flame-Grilled
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Delicious food, easy ordering, no WhatsApp hassle!
          </p>
          {/* Developer credit removed for privacy */}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {/* Menu Card */}
          <div className="bg-white rounded-xl shadow-lg p-6 text-center hover:shadow-xl transition-shadow">
            <div className="text-4xl mb-4">🍽️</div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-3">Browse Menu</h2>
            <p className="text-gray-600 mb-6">
              Check out our delicious menu items with real-time updates from Google Sheets
            </p>
            <Link 
              href="/menu"
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors inline-block"
            >
              View Menu
            </Link>
          </div>
          
          {/* Orders Card */}
          <div className="bg-white rounded-xl shadow-lg p-6 text-center hover:shadow-xl transition-shadow">
            <div className="text-4xl mb-4">📋</div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-3">Manage Orders</h2>
            <p className="text-gray-600 mb-6">
              View and manage all customer orders with customer details
            </p>
            <Link 
              href="/admin/login"
              className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors inline-block"
            >
              Admin Login
            </Link>
          </div>
          
          {/* Track Order Card */}
          <div className="bg-white rounded-xl shadow-lg p-6 text-center hover:shadow-xl transition-shadow">
            <div className="text-4xl mb-4">🔍</div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-3">Track Order</h2>
            <p className="text-gray-600 mb-6">
              Check your order status with your confirmation number
            </p>
            <Link 
              href="/track-order"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors inline-block"
            >
              Track Order
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
