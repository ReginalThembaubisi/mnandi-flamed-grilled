// Application configuration

export const config = {
  // Google Sheets URLs - can be overridden by environment variables
  googleSheets: {
    menuUrl: process.env.NEXT_PUBLIC_MENU_SHEET_URL || 
      'https://docs.google.com/spreadsheets/d/e/2PACX-1vR1ZoV07-2CkaAs5mjdTboGX4hW7kJP0VczWCANVKSh73WbEdplzARXr3cXsUU4dhEq5AMZ2wN-CbyV/pub?gid=0&single=true&output=csv',
    statusUrl: process.env.NEXT_PUBLIC_STATUS_SHEET_URL || '',
    // Try different gid numbers for status sheet
    statusGids: [1, 2, 3, 4, 5]
  },
  
  // Business settings
  business: {
    name: 'Mnandi Flame-Grilled',
    defaultDeliveryFee: 10,
    currency: 'ZAR',
    currencySymbol: 'R'
  },
  
  // Order settings
  order: {
    confirmationPrefix: 'SHI',
    refreshInterval: 600000, // 10 minutes
    autoRefresh: true
  },
  
  // Admin settings
  admin: {
    defaultUsername: 'admin',
    defaultPassword: 'mnandi2024' // Should be changed in production
  }
}

