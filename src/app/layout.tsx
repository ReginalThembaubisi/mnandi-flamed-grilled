import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ToastProvider } from '@/components/providers/ToastProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: 'Mnandi Flame-Grilled - University Residence Food Ordering',
    template: '%s | Mnandi Flame-Grilled'
  },
  description: 'Order delicious flame-grilled food from your university residence. Easy ordering, no WhatsApp hassle!',
  keywords: ['food ordering', 'university residence', 'flame grilled', 'restaurant', 'online ordering'],
  authors: [{ name: 'Mnandi Flame-Grilled' }],
  openGraph: {
    type: 'website',
    locale: 'en_ZA',
    url: process.env.NEXT_PUBLIC_APP_URL || 'https://mnandi-flame-grilled.vercel.app',
    siteName: 'Mnandi Flame-Grilled',
    title: 'Mnandi Flame-Grilled - University Residence Food Ordering',
    description: 'Order delicious flame-grilled food from your university residence. Easy ordering, no WhatsApp hassle!',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Mnandi Flame-Grilled - University Residence Food Ordering',
    description: 'Order delicious flame-grilled food from your university residence.',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  )
}
