'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Papa from 'papaparse'
import { MenuItem, BusinessStatus, SideOption } from '@/types'
import { useToastContext } from '@/components/providers/ToastProvider'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { MenuCard } from '@/components/ui/MenuCard'
import { formatPrice } from '@/lib/utils'
import { MenuItemSkeleton } from '@/components/ui/LoadingSkeleton'
import { config } from '@/lib/config'
import { Icon } from '@/components/ui/IconMap'
import { isBusinessOpen, getBusinessStatus } from '@/lib/businessStatus'
import { safeJsonParse, safeJsonStringify } from '@/lib/security'


export default function MenuPage() {
  const toast = useToastContext()
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
    
    // Set up interval to refresh data (configurable)
    const interval = setInterval(() => {
      if (config.order.autoRefresh) {
        fetchData()
      }
    }, config.order.refreshInterval)
    
    // Cleanup interval on component unmount
    return () => clearInterval(interval)
  }, [])

  // Periodically check business status (more frequently than full data refresh)
  useEffect(() => {
    const checkBusinessStatus = async () => {
      const localStatus = getBusinessStatus()
      if (!localStatus) {
        // Local status is stale or missing - try Supabase
        try {
          const adminStatus = await isBusinessOpen()
          if (adminStatus !== null) {
            setIsOpen(adminStatus)
          }
        } catch (e) {
          console.warn('Error checking business status:', e)
        }
      } else {
        // Update with current local status
        setIsOpen(localStatus.isOpen)
      }
    }

    // Check immediately
    checkBusinessStatus()

    // Check every 5 minutes for business status updates
    const statusInterval = setInterval(checkBusinessStatus, 5 * 60 * 1000)

    return () => clearInterval(statusInterval)
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
      const menuUrl = `${config.googleSheets.menuUrl}${config.googleSheets.menuUrl.includes('?') ? '&' : '?'}t=${timestamp}`
      const menuResponse = await fetch(menuUrl)
      
      if (!menuResponse.ok) {
        throw new Error(`Menu fetch failed: ${menuResponse.status} - ${menuResponse.statusText}`)
      }
      const menuText = await menuResponse.text()
      
      // Fetch business status data from Google Sheets - try different gid numbers
      let statusData: { data: BusinessStatus[] } = { data: [] }
      const statusGids = config.googleSheets.statusGids
      
      for (const gid of statusGids) {
        try {
          const statusUrl = config.googleSheets.statusUrl || 
            `https://docs.google.com/spreadsheets/d/e/2PACX-1vR1ZoV07-2CkaAs5mjdTboGX4hW7kJP0VczWCANVKSh73WbEdplzARXr3cXsUU4dhEq5AMZ2wN-CbyV/pub?gid=${gid}&single=true&output=csv`
          const statusResponse = await fetch(statusUrl)
          
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
        
        // Check today's business status from Google Sheets
        isOpenToday = todayStatus?.['Open']?.toLowerCase() === 'true'
      }
      
      // Check for admin override (with staleness check)
      // Check localStorage first (synchronous)
      const localStatus = getBusinessStatus()
      if (localStatus) {
        // Admin has set a status (and it's not stale)
        isOpenToday = localStatus.isOpen
      } else {
        // Local status is stale or missing - try Supabase async
        try {
          const adminStatus = await isBusinessOpen()
          if (adminStatus !== null) {
            isOpenToday = adminStatus
          }
          // If adminStatus is null, use Google Sheets status (already set above)
        } catch (e) {
          // Error fetching - use Google Sheets status (already set above)
          console.warn('Error checking business status:', e)
        }
      }
      
      setIsOpen(isOpenToday)
      
      // Update last updated timestamp
      setLastUpdated(new Date())
      
      // Show success message for manual refresh
      if (isRefresh) {
        toast.success('Menu data refreshed successfully!')
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
      // Validate quantity
      if (quantity < 1 || quantity > 100) {
        toast.error('Quantity must be between 1 and 100')
        return
      }
      
      const existingCart = safeJsonParse<any[]>(localStorage.getItem('cart') || '[]', [])
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
      localStorage.setItem('cart', safeJsonStringify(updatedCart))
      
      // Show success feedback
      const sideText = selectedSide ? ` with ${selectedSide}` : ''
      const quantityText = quantity > 1 ? `${quantity}x ` : ''
      toast.success(`${quantityText}${item['Items']}${sideText} added to cart!`)
    } catch (err) {
      console.error('Error adding to cart:', err)
      toast.error('Failed to add item to cart')
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
              <MenuItemSkeleton key={index} />
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
          <h1 className="flex items-center gap-3 text-4xl font-bold text-gray-800 mb-4 md:mb-0 font-display">
            <Icon name="menu" size={40} className="text-primary-600" />
            Our Menu
          </h1>
          <div className="flex items-center space-x-4">
            <div className="flex flex-col items-end space-y-1">
            <Button
              onClick={() => fetchData(true)}
              isLoading={refreshing}
              variant="success"
              size="md"
            >
              <Icon name="refresh" size={18} />
              <span>Refresh</span>
            </Button>
              {lastRefresh && (
                <span className="text-xs text-gray-500">
                  Last updated: {lastRefresh.toLocaleTimeString()}
                </span>
              )}
            </div>
            <Link 
              href="/track-order"
              className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors flex items-center space-x-2"
            >
              <Icon name="search" size={18} />
              <span>Track Order</span>
            </Link>
            <Link 
              href="/admin/login"
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
            >
              <Icon name="chef" size={18} />
              <span>Admin</span>
            </Link>
            <Link 
              href="/cart"
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
            >
              <Icon name="cart" size={18} />
              <span>View Cart</span>
            </Link>
          </div>
        </div>
        
        {lastUpdated && (
          <div className="text-center text-sm text-gray-500 mb-6">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </div>
        )}
        
        {/* Search and Filter */}
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Icon name="search" size={18} />
                Search Menu
              </label>
              <input
                type="text"
                placeholder="Search for items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-base min-h-[44px]"
              />
            </div>
            
            {/* Category Filter */}
            <div className="sm:w-64">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Icon name="filter" size={18} />
                Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-base min-h-[44px]"
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
            <Icon name="search" size={64} className="mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600 text-lg">No items found matching your search.</p>
            <Button
              onClick={() => {
                setSearchTerm('')
                setSelectedCategory('All')
              }}
              variant="primary"
              className="mt-4"
            >
              Clear Filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {filteredItems.map((item, index) => (
              <MenuCard
                key={index}
                item={item}
                onAddToCart={() => handleAddToCart(item, itemQuantities[item['Items']] || 1)}
                quantity={itemQuantities[item['Items']] || 1}
                onQuantityChange={(qty) => setItemQuantities(prev => ({...prev, [item['Items']]: qty}))}
                showQuantityControls={!isComboMeal(item)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Image Modal */}
      <Modal
        isOpen={!!selectedImage}
        onClose={() => setSelectedImage(null)}
        size="xl"
      >
        {selectedImage && (
          <div className="relative max-h-[90vh] w-full flex items-center justify-center">
            <img
              src={selectedImage}
              alt="Food item"
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              onError={() => toast.error('Failed to load image')}
            />
            <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-black/70 text-white px-4 py-2 rounded-lg text-sm backdrop-blur-sm">
              <Icon name="close" size={16} />
              Press ESC or click outside to close
            </div>
          </div>
        )}
      </Modal>

      {/* Side Selection Modal */}
      <Modal
        isOpen={showSideModal}
        onClose={() => setShowSideModal(false)}
        size="md"
        title={
          <div className="flex items-center gap-2">
            <Icon name="menu" size={24} className="text-primary-600" />
            {currentItem?.['Items']?.startsWith('Side:') 
              ? 'Add More Sides to Your Order'
              : 'Add Sides to Your Meal'
            }
          </div>
        }
      >
        {currentItem && (
          <>
            <div className="mb-4">
              <p className="text-gray-600 mb-2">
                <strong>{currentItem['Items']}</strong> - {formatPrice(currentItem['Price'])}
              </p>
              {includesSides(currentItem) && (
                <p className="text-sm text-green-600 mb-2">(First side included)</p>
              )}
              {!includesSides(currentItem) && !currentItem?.['Items']?.startsWith('Side:') && (
                <p className="text-sm text-orange-600 mb-2">(All sides cost extra)</p>
              )}
              {currentItem?.['Items']?.startsWith('Side:') && (
                <p className="text-sm text-blue-600 mb-2">(Add more sides)</p>
              )}
              
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
              <Button
                onClick={() => {
                  setShowSideModal(false)
                  setSelectedMultipleSides([])
                }}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
              {selectedMultipleSides.length > 0 && (
                <Button
                  onClick={handleFinishSides}
                  variant="primary"
                  className="flex-1"
                >
                  Add to Cart ({selectedQuantity}x)
                </Button>
              )}
            </div>
          </>
        )}
      </Modal>

      {/* Add More Sides Modal */}
      <Modal
        isOpen={showAddMoreSidesModal}
        onClose={() => {
          setShowAddMoreSidesModal(false)
          setSelectedMultipleSides([])
        }}
        size="md"
        title="🍽️ Add More Sides?"
      >
            
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
              <Button
                onClick={handleFinishSides}
                variant="secondary"
                className="flex-1"
              >
                Finish ({selectedQuantity}x) {extraSidesCost > 0 && `+${formatPrice(extraSidesCost)}`}
              </Button>
              <Button
                onClick={handleAddMoreSides}
                variant="primary"
                className="flex-1"
              >
                Add More Sides
              </Button>
            </div>
      </Modal>
    </div>
  )
}
