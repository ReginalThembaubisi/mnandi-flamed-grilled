# Mnandi Flame-Grilled - University Residence Food Ordering System

A modern, full-featured food ordering system designed for university residence food operations. Built with Next.js 13, TypeScript, and Tailwind CSS.

## 🚀 Live Demo

[View Live Application](https://mnandi-flamed-grilled.vercel.app)

## Why I Built This

I built this system for my friend who was struggling with managing orders and keeping track of finances for their university residence food business. The challenges they faced included:

- **Order Management Chaos**: Receiving orders through WhatsApp made it difficult to track, organize, and manage multiple orders simultaneously
- **Financial Tracking**: No systematic way to track daily sales, revenue, or customer spending patterns
- **Manual Processes**: Everything was done manually, leading to errors, missed orders, and time-consuming administrative work
- **Customer Management**: No centralized database to keep track of customers, their preferences, or order history

This system solves all these problems by providing:
- Automated order management and tracking
- Real-time sales analytics and financial reporting
- Customer database with spending insights
- Professional ordering experience for customers
- Mobile-friendly interface perfect for university students

## Features

### Customer Features
- **Real-time Menu**: Live updates from Google Sheets
- **Search & Filter**: Find items by name, description, or category
- **Shopping Cart**: Add items with quantity controls
- **Order Tracking**: Track orders with confirmation numbers
- **Mobile Responsive**: Perfect for phone ordering
- **Customer Info**: Save details for faster checkout

### Admin Features
- **Secure Login**: Admin authentication system
- **Order Management**: Track orders from pending to completed
- **Customer Database**: Automatic customer collection and analytics
- **Daily Sales Reports**: Revenue tracking and analytics
- **WhatsApp Integration**: Send order notifications and promotions
- **Specials Management**: Create and send promotional offers

### WhatsApp Integration
- **Order Notifications**: Automatic WhatsApp when orders are ready
- **Marketing Campaigns**: Send specials to all customers
- **Individual Messaging**: Target specific customers
- **Professional Templates**: Beautiful formatted messages

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd mnandi-flame-grilled
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open in browser**
   ```
   http://localhost:3000
   ```

## Google Sheets Setup

### Menu Sheet
Create a Google Sheet with these columns:
- `Items` - Item name
- `Price` - Price (numbers only)
- `Available` - TRUE/FALSE
- `Image URL` - Image link (optional)
- `Description` - Item description (optional)
- `Category` - Mains, Sides, Drinks, etc.

### Business Status Sheet
Create a second sheet with:
- `Day` - Monday, Tuesday, etc.
- `Open` - TRUE/FALSE
- `Opening Time` - 10:00
- `Closing Time` - 22:00

### Publishing
1. Go to File → Share → Publish to web
2. Choose CSV format
3. Copy the published URL
4. Update URLs in `src/app/menu/page.tsx`

## Admin Access

### Admin Credentials

Admin credentials must be configured in `src/app/admin/login/page.tsx` before deployment. **Never commit default credentials to version control.**

### Admin Features
- **Dashboard**: `/admin/dashboard`
- **Orders**: `/orders`
- **Customers**: `/admin/customers`
- **Login**: `/admin/login`

## Pages Overview

### Customer Pages
- **Home**: `/` - Landing page with feature overview
- **Menu**: `/menu` - Browse and order food
- **Cart**: `/cart` - Review and modify cart
- **Checkout**: `/checkout` - Complete order with customer info
- **Track Order**: `/track-order` - Check order status

### Admin Pages
- **Login**: `/admin/login` - Admin authentication
- **Dashboard**: `/admin/dashboard` - Sales analytics and overview
- **Orders**: `/orders` - Manage all customer orders
- **Customers**: `/admin/customers` - Customer database and marketing

## Technology Stack

- **Framework**: Next.js 13 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Data Parsing**: Papa Parse (CSV)
- **Data Source**: Google Sheets
- **Storage**: localStorage (client-side)

## Order Flow

1. **Customer browses menu** → Real-time data from Google Sheets
2. **Adds items to cart** → Stored in localStorage
3. **Proceeds to checkout** → Enters customer details
4. **Receives confirmation** → Gets unique order number
5. **Owner sees order** → In admin orders page
6. **Owner updates status** → Preparing → Ready → Completed
7. **Customer gets notified** → WhatsApp when ready
8. **Customer tracks order** → Using confirmation number

## Business Benefits

- **No WhatsApp Hassle**: Automated order management
- **Professional System**: Looks like a real restaurant
- **Customer Analytics**: Track spending and preferences
- **Marketing Tools**: Send promotions and specials
- **Real-time Updates**: Menu changes instantly
- **Mobile Optimized**: Perfect for university students

## Customization

### Change Admin Credentials
Edit `src/app/admin/login/page.tsx` line 19:
```typescript
if (username === 'your_username' && password === 'your_password') {
```

### Update Google Sheets URLs
Edit `src/app/menu/page.tsx` lines 55-69:
```typescript
const menuResponse = await fetch('YOUR_MENU_SHEET_URL')
const statusResponse = await fetch('YOUR_STATUS_SHEET_URL')
```

### Customize Styling
All styles use Tailwind CSS classes. Main color scheme:
- **Primary**: Green (`bg-green-600`)
- **Secondary**: Blue (`bg-blue-600`)
- **Accent**: Purple (`bg-purple-600`)

## WhatsApp Integration

The system automatically:
- Formats phone numbers for South Africa (+27)
- Creates professional message templates
- Opens WhatsApp Web/App with pre-filled messages
- Handles both individual and bulk messaging

## Deployment

### Build for Production
```bash
npm run build
npm start
```

### Environment Variables
No environment variables required - uses client-side storage and Google Sheets.

## Support

For issues or questions:
1. Check the browser console for errors
2. Verify Google Sheets are published correctly
3. Ensure all dependencies are installed
4. Check that localStorage is enabled

## Success Tips

1. **Test with real data** - Use actual menu items and prices
2. **Train the owner** - Show them how to use admin features
3. **Promote the system** - Share the URL with students
4. **Monitor orders** - Check admin dashboard regularly
5. **Send specials** - Use customer database for marketing

---

**Built to help friends manage their food business better**
