import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import ConditionalAuth from '@/components/auth/ConditionalAuth'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'New Jersey Science Research Symposium',
  description: 'A research competition that brings together high school scientists from across New Jersey',
  icons: {
    icon: '/njsrs-icon-only.png',
  },
  verification: {
    google: '8jvfqSUGVKpgGljEbfycGtLYA4krAzOj-_8503CXJj8',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} flex flex-col min-h-screen`}>
        <style dangerouslySetInnerHTML={{
          __html: `
            label, label.block, label.text-sm, form label, div label {
              color: #111827 !important;
            }
            @media (prefers-color-scheme: dark) {
              label, label.block, label.text-sm, form label, div label {
                color: #111827 !important;
              }
            }
          `
        }} />
        <ConditionalAuth>
          {children}
        </ConditionalAuth>
      </body>
    </html>
  )
}
