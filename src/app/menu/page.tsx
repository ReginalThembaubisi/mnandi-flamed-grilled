'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Papa from 'papaparse'

interface MenuItem {
  'Items': string
  'Price': string
  'Available': string
  'Image URL': string
  'Description': string
  'Category': string
}

interface BusinessStatus {
  'Day': string
  'Open': string
  'Opening Time': string
  'Closing Time': string
}

interface SideOption {
  'Side Name': string
  'Available': string
  'Price': string
}


export default function MenuPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [businessStatus, setBusinessStatus] = useState<BusinessStatus[]>([])
  const [sideOptions, setSideOptions] = useState<SideOption[]>([])
  const [isOpen, setIsOpen] = useState<boolean>(true)
  const [loading, setLoading] = useState<boolean>(true)
  const [refreshing, setRefreshing] = useState<boolean>(false)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)
  const [error, setError] = useState<string>('')
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [selectedCategory, setSelectedCategory] = useState<string>('All')
  const [showSuccessMessage, setShowSuccessMessage] = useState<boolean>(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [imageErrors, setImageErrors] = useState<{[key: string]: boolean}>({})
  const [selectedSides, setSelectedSides] = useState<{[key: string]: string}>({})
  const [showSideModal, setShowSideModal] = useState<boolean>(false)
  const [currentItem, setCurrentItem] = useState<MenuItem | null>(null)
  const [selectedQuantity, setSelectedQuantity] = useState<number>(1)
  const [itemQuantities, setItemQuantities] = useState<{[key: string]: number}>({})
  const [selectedMultipleSides, setSelectedMultipleSides] = useState<{side: string, quantity: number}[]>([])
  const [showAddMoreSidesModal, setShowAddMoreSidesModal] = useState<boolean>(false)
  const [includedSidesCount, setIncludedSidesCount] = useState<number>(1) // Default: 1 side included
  const [extraSidesCost, setExtraSidesCost] = useState<number>(0)

  // Get available sides from Google Sheets, with fallback
  const availableSides = sideOptions.length > 0 
    ? sideOptions
        .filter(side => side['Available'] === 'TRUE')
        .map(side => side['Side Name'])
    : ['Rice', 'Pap', 'Chips', 'Salad', 'Coleslaw', 'Bread'] // Fallback sides

  // Calculate extra sides cost
  const calculateExtraSidesCost = (selectedSides: string[]) => {
    if (selectedSides.length <= includedSidesCount) return 0
    
    const extraSides = selectedSides.slice(includedSidesCount)
    let totalCost = 0
    
    extraSides.forEach(sideName => {
      const side = sideOptions.find(s => s['Side Name'] === sideName)
      if (side && side['Price']) {
        totalCost += parseFloat(side['Price']) || 0
      }
    })
    
    return totalCost
  }

  useEffect(() => {
    fetchData()
    
    // Set up interval to refresh data every 10 minutes (less intrusive)
    const interval = setInterval(() => {
      fetchData()
    }, 600000) // 10 minutes
    
    // Cleanup interval on component unmount
    return () => clearInterval(interval)
  }, [])

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && selectedImage) {
        setSelectedImage(null)
      }
    }

    if (selectedImage) {
      document.addEventListener('keydown', handleKeyDown)
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'unset'
    }
  }, [selectedImage])

  const fetchData = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }
      
      // Fetch menu data from Google Sheets (with cache busting)
      const timestamp = Date.now()
      const menuResponse = await fetch(
        `https://docs.google.com/spreadsheets/d/e/2PACX-1vR1ZoV07-2CkaAs5mjdTboGX4hW7kJP0VczWCANVKSh73WbEdplzARXr3cXsUU4dhEq5AMZ2wN-CbyV/pub?gid=0&single=true&output=csv&t=${timestamp}`
      )
      
      if (!menuResponse.ok) {
        throw new Error(`Menu fetch failed: ${menuResponse.status} - ${menuResponse.statusText}`)
      }
      const menuText = await menuResponse.text()
      
      // Fetch business status data from Google Sheets - try different gid numbers
      let statusData: { data: BusinessStatus[] } = { data: [] }
      const statusGids = [1, 2, 3, 4, 5] // Try different gid numbers
      
      for (const gid of statusGids) {
        try {
          const statusResponse = await fetch(
            `https://docs.google.com/spreadsheets/d/e/2PACX-1vR1ZoV07-2CkaAs5mjdTboGX4hW7kJP0VczWCANVKSh73WbEdplzARXr3cXsUU4dhEq5AMZ2wN-CbyV/pub?gid=${gid}&single=true&output=csv`
          )
          
          if (statusResponse.ok) {
            const statusText = await statusResponse.text()
            
            // Check if this looks like business status data (has Day, Open columns)
            if (statusText.includes('Day') && statusText.includes('Open')) {
              statusData = Papa.parse<BusinessStatus>(statusText, { header: true })
              break
            }
          }
        } catch (statusError) {
          // Continue to next gid
        }
      }
      
      if (statusData.data.length === 0) {
        // No business status sheet found, using fallback (always open)
      }

      // Parse CSV data
      const menuData = Papa.parse<MenuItem>(menuText, { header: true })

      // Extract sides from main menu data (items that start with "Side:")
      const sidesFromMenu = menuData.data.filter(item => 
        item['Items']?.startsWith('Side:') && 
        (item['Available']?.toLowerCase() === 'true' || item['Available'] === 'TRUE')
      ).map(item => ({
        'Side Name': item['Items'].replace('Side: ', ''),
        'Available': item['Available'],
        'Price': item['Price'] || '0'
      }))

      // Available sides from menu

      // Use sides from menu or fallback
      const sidesData = {
        data: sidesFromMenu.length > 0 ? sidesFromMenu : [
          { 'Side Name': 'Chakalaka', 'Available': 'TRUE', 'Price': '10' },
          { 'Side Name': 'Coleslaw', 'Available': 'TRUE', 'Price': '10' },
          { 'Side Name': 'Salse', 'Available': 'TRUE', 'Price': '10' }
        ]
      }

      // Filter menu items that are available and convert image URLs
      const availableItems = menuData.data.filter(item => 
        (item['Available']?.toLowerCase() === 'true' || item['Available'] === 'TRUE')
      ).map(item => {
        // Pre-convert URLs to direct formats
        if (item['Image URL']) {
          let url = item['Image URL']
          
          // Pre-convert OneDrive URLs
          if (url.includes('1drv.ms') && !url.includes('&download=1')) {
            url = url + '&download=1'
          }
          
          // Pre-convert Imgur URLs
          if (url.includes('imgur.com/a/')) {
            // For Imgur albums, we need to get the first image
            // Try different formats for album images
            const albumId = url.match(/imgur\.com\/a\/([a-zA-Z0-9]+)/)?.[1]
            if (albumId) {
              // Try multiple formats for album images
              url = `https://i.imgur.com/${albumId}.jpg`
            }
          } else if (url.includes('imgur.com/') && !url.includes('i.imgur.com')) {
            // Convert regular Imgur page URL to direct image URL
            const imageId = url.match(/imgur\.com\/([a-zA-Z0-9]+)/)?.[1]
            if (imageId) {
              url = `https://i.imgur.com/${imageId}.jpg`
            }
          }
          
          item['Image URL'] = url
        }
        return item
      })

      // Using real Google Sheets data

      setMenuItems(availableItems)
      setBusinessStatus(statusData.data)
      setSideOptions(sidesData.data)

      // Check if business is open today (from Google Sheets or fallback)
      let isOpenToday = true // Default to open if no status data
      
      if (statusData.data.length > 0) {
        const today = new Date().toLocaleDateString('en-US', { weekday: 'long' })
        const todayStatus = statusData.data.find(status => 
          status['Day']?.toLowerCase() === today.toLowerCase()
        )
        
        // Check today's business status
        
        isOpenToday = todayStatus?.['Open']?.toLowerCase() === 'true'
      } else {
        // No business status data, defaulting to open
      }
      
      // Check for admin override in localStorage
      const adminBusinessStatus = localStorage.getItem('businessStatus')
      if (adminBusinessStatus) {
        const adminStatus = JSON.parse(adminBusinessStatus)
        isOpenToday = adminStatus.isOpen
      }
      
      setIsOpen(isOpenToday)
      
      // Update last updated timestamp
      setLastUpdated(new Date())
      
      // Show success message for manual refresh
      if (isRefresh) {
        setShowSuccessMessage(true)
        setTimeout(() => setShowSuccessMessage(false), 3000)
      }
      
    } catch (err) {
      console.error('Error fetching data:', err)
      setError('Failed to load menu data. Please check your Google Sheets URL and try again.')
    } finally {
      setLoading(false)
      setRefreshing(false)
      setLastRefresh(new Date())
    }
  }

  // Check if item already includes sides
  const includesSides = (item: MenuItem) => {
    const name = item['Items'].toLowerCase()
    return name.includes('& side') || name.includes('and side')
  }

  // Check if item can have sides added (only main meals, not side items)
  const isComboMeal = (item: MenuItem) => {
    const name = item['Items'].toLowerCase()
    // Show side selection for main meals only, not side items
    return !name.includes('side:')
  }

  const handleAddToCart = (item: MenuItem, quantity: number = 1) => {
    if (isComboMeal(item)) {
      // Set included sides count based on whether meal includes sides
      if (includesSides(item)) {
        setIncludedSidesCount(1) // First side is free
      } else {
        setIncludedSidesCount(0) // No free sides - all sides cost money
      }
      
      // Show side selection modal for main meals
      setCurrentItem(item)
      setSelectedQuantity(quantity)
      setSelectedMultipleSides([])
      setExtraSidesCost(0)
      setShowSideModal(true)
    } else {
      // Add directly to cart for side items
      addToCart(item, quantity)
    }
  }

  const handleSideSelection = (side: string) => {
    if (currentItem) {
      // Check if side already exists
      const existingSideIndex = selectedMultipleSides.findIndex(s => s.side === side)
      
      if (existingSideIndex >= 0) {
        // Increase quantity of existing side
        const newSides = [...selectedMultipleSides]
        newSides[existingSideIndex].quantity += 1
        setSelectedMultipleSides(newSides)
      } else {
        // Add new side with quantity 1
        const newSides = [...selectedMultipleSides, {side, quantity: 1}]
        setSelectedMultipleSides(newSides)
      }
      
      // Calculate extra cost
      const sideNames = selectedMultipleSides.flatMap(s => Array(s.quantity).fill(s.side))
      const extraCost = calculateExtraSidesCost(sideNames)
      setExtraSidesCost(extraCost)
      
      // Show "Add More Sides" modal instead of adding to cart immediately
      setShowSideModal(false)
      setShowAddMoreSidesModal(true)
    }
  }

  const handleAddMoreSides = () => {
    if (currentItem) {
      setShowAddMoreSidesModal(false)
      setShowSideModal(true)
    }
  }

  const handleFinishSides = () => {
    if (currentItem && selectedMultipleSides.length > 0) {
      // Add to cart with all selected sides and extra cost
      const sidesText = selectedMultipleSides.map(s => `${s.quantity}x ${s.side}`).join(', ')
      addToCart(currentItem, selectedQuantity, sidesText, extraSidesCost)
      
      // Reset everything
      setShowAddMoreSidesModal(false)
      setCurrentItem(null)
      setSelectedQuantity(1)
      setSelectedMultipleSides([])
      setExtraSidesCost(0)
    }
  }

  const handleRemoveSide = (sideToRemove: string) => {
    const newSides = selectedMultipleSides.filter(s => s.side !== sideToRemove)
    setSelectedMultipleSides(newSides)
    
    // Recalculate extra sides cost
    const sideNames = newSides.flatMap(s => Array(s.quantity).fill(s.side))
    const extraCost = calculateExtraSidesCost(sideNames)
    setExtraSidesCost(extraCost)
  }

  const handleAdjustSideQuantity = (sideName: string, change: number) => {
    const newSides = [...selectedMultipleSides]
    const sideIndex = newSides.findIndex(s => s.side === sideName)
    
    if (sideIndex >= 0) {
      newSides[sideIndex].quantity = Math.max(1, newSides[sideIndex].quantity + change)
      setSelectedMultipleSides(newSides)
      
      // Recalculate extra sides cost
      const sideNames = newSides.flatMap(s => Array(s.quantity).fill(s.side))
      const extraCost = calculateExtraSidesCost(sideNames)
      setExtraSidesCost(extraCost)
    }
  }

  const addToCart = (item: MenuItem, quantity: number = 1, selectedSide?: string, extraCost: number = 0) => {
    try {
      const existingCart = JSON.parse(localStorage.getItem('cart') || '[]')
      const basePrice = parseFloat(item['Price']) || 0
      const totalPrice = basePrice + extraCost
      
      const cartItem = {
        id: `${item['Items']}-${Date.now()}`,
        name: item['Items'],
        price: totalPrice.toString(),
        basePrice: item['Price'], // Keep original price
        extraSidesCost: extraCost, // Track extra sides cost
        image: item['Image URL'],
        description: item['Description'],
        quantity: quantity,
        selectedSide: selectedSide,
        isCombo: isComboMeal(item)
      }
      
      const updatedCart = [...existingCart, cartItem]
      localStorage.setItem('cart', JSON.stringify(updatedCart))
      
      // Show success feedback
      const sideText = selectedSide ? ` with ${selectedSide}` : ''
      const quantityText = quantity > 1 ? `${quantity}x ` : ''
      alert(`${quantityText}${item['Items']}${sideText} added to cart!`)
    } catch (err) {
      console.error('Error adding to cart:', err)
      alert('Failed to add item to cart')
    }
  }

  // Get unique categories from menu items
  const categories = ['All', ...Array.from(new Set(menuItems.map(item => item['Category'] || 'Other')))]

  // Filter menu items based on search and category
  const filteredItems = menuItems.filter(item => {
    const matchesSearch = item['Items'].toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (item['Description'] && item['Description'].toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesCategory = selectedCategory === 'All' || item['Category'] === selectedCategory
    return matchesSearch && matchesCategory
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading menu...</p>
            <p className="text-sm text-gray-500 mt-2">Fetching latest data from Google Sheets</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {[...Array(8)].map((_, index) => (
              <div key={index} className="bg-white rounded-xl shadow-lg overflow-hidden animate-pulse">
                <div className="h-48 bg-gray-200"></div>
                <div className="p-4">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={() => fetchData()}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  if (!isOpen) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-xl shadow-lg max-w-md mx-4">
          <div className="text-6xl mb-4">🚫</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            We're closed today
          </h1>
          <p className="text-gray-600">
            See you tomorrow!
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-center justify-between mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4 md:mb-0">
            🍽️ Our Menu
          </h1>
          <div className="flex items-center space-x-4">
            <div className="flex flex-col items-end space-y-1">
              <button
                onClick={() => fetchData(true)}
                disabled={refreshing}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {refreshing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Refreshing...</span>
                  </>
                ) : (
                  <>
                    <span>🔄</span>
                    <span>Refresh</span>
                  </>
                )}
              </button>
              {lastRefresh && (
                <span className="text-xs text-gray-500">
                  Last updated: {lastRefresh.toLocaleTimeString()}
                </span>
              )}
            </div>
            <Link 
              href="/track-order"
              className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors flex items-center space-x-2"
            >
              <span>🔍</span>
              <span>Track Order</span>
            </Link>
            <Link 
              href="/admin/login"
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
            >
              <span>👨‍🍳</span>
              <span>Admin</span>
            </Link>
            <Link 
              href="/cart"
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
            >
              <span>🛒</span>
              <span>View Cart</span>
            </Link>
          </div>
        </div>
        
        {lastUpdated && (
          <div className="text-center text-sm text-gray-500 mb-6">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </div>
        )}
        
        {showSuccessMessage && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-6 text-center animate-fade-in">
            <p className="text-green-800 text-sm">✅ Menu data refreshed successfully!</p>
          </div>
        )}
        
        {/* Search and Filter */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                🔍 Search Menu
              </label>
              <input
                type="text"
                placeholder="Search for items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            
            {/* Category Filter */}
            <div className="md:w-64">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📂 Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {filteredItems.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <p className="text-gray-600 text-lg">No items found matching your search.</p>
            <button
              onClick={() => {
                setSearchTerm('')
                setSelectedCategory('All')
              }}
              className="mt-4 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {filteredItems.map((item, index) => (
              <div key={index} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                {/* Image */}
                {item['Image URL'] && item['Image URL'].trim() !== '' ? (
                  <div className="relative">
                    <img
                      src={item['Image URL']}
                      alt={item['Items']}
                      className="w-full h-48 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => {
                        setSelectedImage(item['Image URL'])
                      }}
                      onError={(e) => {
                        // Image failed to load, set error state
                        setImageErrors(prev => ({...prev, [item['Items']]: true}))
                      }}
                      onLoad={(e) => {
                        e.currentTarget.nextElementSibling?.classList.add('hidden')
                      }}
                    />
                    {!imageErrors[item['Items']] && (
                      <div className="w-full h-48 bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center">
                        <span className="text-6xl">🍽️</span>
                      </div>
                    )}
                    {imageErrors[item['Items']] && (
                      <div className="w-full h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                        <div className="text-center">
                          <span className="text-4xl mb-2 block">🍽️</span>
                          <span className="text-sm text-gray-600">Image unavailable</span>
                        </div>
                      </div>
                    )}
                    {item['Category'] && (
                      <div className="absolute top-2 left-2 bg-green-600 text-white px-2 py-1 rounded-full text-xs font-medium">
                        {item['Category']}
                      </div>
                    )}
                    {/* Click indicator */}
                    <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded-full text-xs">
                      🔍 Click to view
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-48 bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center relative">
                    <span className="text-6xl">🍽️</span>
                    {item['Category'] && (
                      <div className="absolute top-2 left-2 bg-green-600 text-white px-2 py-1 rounded-full text-xs font-medium">
                        {item['Category']}
                      </div>
                    )}
                  </div>
                )}
                
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    {item['Items']}
                  </h3>
                  
                  {item['Description'] && (
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {item['Description']}
                    </p>
                  )}
                  
                  {includesSides(item) && (
                    <div className="bg-green-50 border-l-4 border-green-400 p-2 rounded-lg mb-4">
                      <p className="text-sm text-green-800">
                        <strong>🍽️ Includes sides</strong> - Choose your preferred side when adding to cart
                      </p>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-2xl font-bold text-green-600">
                      R{item['Price']}
                    </span>
                  </div>
                  
                  {/* Quantity and Add to Cart */}
                  <div className="space-y-3">
                    {!isComboMeal(item) && (
                      <div className="flex items-center justify-center space-x-3">
                        <button
                          onClick={() => {
                            const currentQty = itemQuantities[item['Items']] || 1
                            const newQty = Math.max(1, currentQty - 1)
                            setItemQuantities(prev => ({...prev, [item['Items']]: newQty}))
                          }}
                          className="w-8 h-8 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center text-gray-600 hover:text-gray-800"
                        >
                          −
                        </button>
                        <span className="w-8 text-center font-medium">{itemQuantities[item['Items']] || 1}</span>
                        <button
                          onClick={() => {
                            const currentQty = itemQuantities[item['Items']] || 1
                            const newQty = currentQty + 1
                            setItemQuantities(prev => ({...prev, [item['Items']]: newQty}))
                          }}
                          className="w-8 h-8 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center text-gray-600 hover:text-gray-800"
                        >
                          +
                        </button>
                      </div>
                    )}
                    
                    <button
                      onClick={() => handleAddToCart(item, itemQuantities[item['Items']] || 1)}
                      className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-all duration-200 font-medium flex items-center justify-center space-x-2 transform hover:scale-105 active:scale-95"
                    >
                      <span>➕</span>
                      <span>Add to Cart</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4"
          onClick={() => {
            setSelectedImage(null)
          }}
        >
          <div className="relative max-w-5xl max-h-[90vh] w-full h-full flex items-center justify-center">
            <img
              src={selectedImage}
              alt="Food item"
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              onClick={(e) => {
                e.stopPropagation()
              }}
              onLoad={() => {}}
              onError={() => {}}
            />
            <button
              onClick={() => {
                setSelectedImage(null)
              }}
              className="absolute top-4 right-4 bg-red-600 hover:bg-red-700 text-white rounded-full w-12 h-12 flex items-center justify-center transition-all text-xl font-bold"
            >
              ✕
            </button>
            <div className="absolute bottom-4 left-4 bg-black bg-opacity-70 text-white px-4 py-2 rounded-lg text-sm">
              Press ESC or click outside to close
            </div>
            <div className="absolute top-4 left-4 bg-black bg-opacity-70 text-white px-4 py-2 rounded-lg text-sm">
              {selectedImage}
            </div>
          </div>
        </div>
      )}

      {/* Side Selection Modal */}
      {showSideModal && currentItem && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowSideModal(false)}
        >
          <div 
            className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-800">
                {currentItem?.['Items']?.startsWith('Side:') ? (
                  <>🍽️ Add More Sides to Your Order</>
                ) : (
                  <>🍽️ Add Sides to Your Meal</>
                )}
                {includesSides(currentItem) && (
                  <span className="text-sm text-green-600 ml-2">(First side included)</span>
                )}
                {!includesSides(currentItem) && !currentItem?.['Items']?.startsWith('Side:') && (
                  <span className="text-sm text-orange-600 ml-2">(All sides cost extra)</span>
                )}
                {currentItem?.['Items']?.startsWith('Side:') && (
                  <span className="text-sm text-blue-600 ml-2">(Add more sides)</span>
                )}
              </h3>
              <button
                onClick={() => setShowSideModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ✕
              </button>
            </div>
            
            <div className="mb-4">
              <p className="text-gray-600 mb-2">
                <strong>{currentItem['Items']}</strong> - R{currentItem['Price']}
              </p>
              
              {/* Quantity Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantity:
                </label>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setSelectedQuantity(Math.max(1, selectedQuantity - 1))}
                    className="w-8 h-8 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center text-gray-600 hover:text-gray-800"
                  >
                    −
                  </button>
                  <span className="w-8 text-center font-medium">{selectedQuantity}</span>
                  <button
                    onClick={() => setSelectedQuantity(selectedQuantity + 1)}
                    className="w-8 h-8 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center text-gray-600 hover:text-gray-800"
                  >
                    +
                  </button>
                </div>
              </div>
              
              <p className="text-sm text-gray-500">
                {currentItem?.['Items']?.startsWith('Side:') ? (
                  <>You're ordering {currentItem['Items']}. Add more sides to your order:</>
                ) : (
                  <>Please select your preferred sides for this meal:</>
                )}
              </p>
              <div className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded-lg mt-2">
                <p className="text-sm text-blue-800">
                  <strong>💡 Pricing:</strong> 
                  {currentItem?.['Items']?.startsWith('Side:') ? (
                    <> All sides cost R10 each. Add as many as you want!</>
                  ) : includesSides(currentItem) ? (
                    <> First {includedSidesCount} side(s) included in price. Extra sides cost additional.</>
                  ) : (
                    <> All sides cost additional (no free sides included).</>
                  )}
                </p>
              </div>
            </div>

            {/* Selected Sides Display */}
            {selectedMultipleSides.length > 0 && (
              <div className="mb-4">
                <h4 className="font-semibold text-gray-800 mb-2">Selected Sides:</h4>
                <div className="space-y-2">
                  {selectedMultipleSides.map((sideItem, index) => (
                    <div key={index} className="bg-green-100 text-green-800 px-3 py-2 rounded-lg text-sm flex items-center justify-between">
                      <span className="font-medium">{sideItem.side}</span>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleAdjustSideQuantity(sideItem.side, -1)}
                          className="w-6 h-6 bg-green-200 hover:bg-green-300 rounded-full flex items-center justify-center text-green-700"
                        >
                          −
                        </button>
                        <span className="w-8 text-center font-medium">{sideItem.quantity}</span>
                        <button
                          onClick={() => handleAdjustSideQuantity(sideItem.side, 1)}
                          className="w-6 h-6 bg-green-200 hover:bg-green-300 rounded-full flex items-center justify-center text-green-700"
                        >
                          +
                        </button>
                        <button
                          onClick={() => handleRemoveSide(sideItem.side)}
                          className="ml-2 text-green-600 hover:text-green-800"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 mb-6">
              {availableSides.map((side) => {
                const sideData = sideOptions.find(s => s['Side Name'] === side)
                const sidePrice = sideData?.['Price'] ? parseFloat(sideData['Price']) : 0
                const isIncluded = selectedMultipleSides.length < includedSidesCount
                const isSelected = selectedMultipleSides.some(s => s.side === side)
                
                // Side data and pricing
                
                return (
                  <button
                    key={side}
                    onClick={() => handleSideSelection(side)}
                    className={`p-3 border-2 rounded-lg transition-all text-left ${
                      isSelected
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-200 hover:border-green-500 hover:bg-green-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">🍽️</span>
                        <span className="font-medium">{side}</span>
                        {isSelected && (
                          <span className="text-green-600">✓</span>
                        )}
                      </div>
                      <div className="text-right">
                        {isIncluded && includedSidesCount > 0 ? (
                          <span className="text-xs text-green-600 font-medium">FREE</span>
                        ) : (
                          <span className="text-xs text-orange-600 font-medium">+R{sidePrice}</span>
                        )}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowSideModal(false)
                  setSelectedMultipleSides([])
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              {selectedMultipleSides.length > 0 && (
                <button
                  onClick={handleFinishSides}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Add to Cart ({selectedQuantity}x)
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add More Sides Modal */}
      {showAddMoreSidesModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => {
            setShowAddMoreSidesModal(false)
            setSelectedMultipleSides([])
          }}
        >
          <div 
            className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-800">
                🍽️ Add More Sides?
              </h3>
              <button
                onClick={() => {
                  setShowAddMoreSidesModal(false)
                  setSelectedMultipleSides([])
                }}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ✕
              </button>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-600 mb-4">
                You've selected sides for {currentItem?.['Items']}:
              </p>
              
              <div className="space-y-2 mb-4">
                {selectedMultipleSides.map((sideItem, index) => (
                  <div key={index} className="bg-green-100 text-green-800 px-3 py-2 rounded-lg text-sm flex items-center justify-between">
                    <span className="font-medium">{sideItem.side}</span>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleAdjustSideQuantity(sideItem.side, -1)}
                        className="w-6 h-6 bg-green-200 hover:bg-green-300 rounded-full flex items-center justify-center text-green-700"
                      >
                        −
                      </button>
                      <span className="w-8 text-center font-medium">{sideItem.quantity}</span>
                      <button
                        onClick={() => handleAdjustSideQuantity(sideItem.side, 1)}
                        className="w-6 h-6 bg-green-200 hover:bg-green-300 rounded-full flex items-center justify-center text-green-700"
                      >
                        +
                      </button>
                      <button
                        onClick={() => handleRemoveSide(sideItem.side)}
                        className="ml-2 text-green-600 hover:text-green-800"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              
              <p className="text-sm text-gray-500">
                Would you like to add more sides or finish with these?
              </p>
              
              {extraSidesCost > 0 && (
                <div className="bg-orange-50 border-l-4 border-orange-400 p-3 rounded-lg mt-3">
                  <p className="text-sm text-orange-800">
                    <strong>💰 Extra Sides Cost:</strong> +R{extraSidesCost.toFixed(2)}
                  </p>
                </div>
              )}
            </div>

            <div className="flex space-x-3">
              <button
                onClick={handleFinishSides}
                className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Finish ({selectedQuantity}x) {extraSidesCost > 0 && `+R${extraSidesCost.toFixed(2)}`}
              </button>
              <button
                onClick={handleAddMoreSides}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Add More Sides
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
