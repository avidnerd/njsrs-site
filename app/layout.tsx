import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import ConditionalAuth from '@/components/auth/ConditionalAuth'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'New Jersey Science Research Symposium | NJSRS',
  description: 'The New Jersey Science Research Symposium (NJSRS) is a research competition that brings together high school scientists from across New Jersey to present original STEM research projects. Hosted at Millburn High School.',
  keywords: ['research competitions in New Jersey', 'research competitions in new jersey', 'New Jersey Science Research Symposium', 'NJSRS', 'research competitions New Jersey', 'science fair New Jersey', 'STEM competition New Jersey', 'high school science competition', 'New Jersey', 'science research competition', 'student research competition', 'research competitions for high school students', 'science competitions in New Jersey', 'NJ science fair', 'New Jersey STEM competition', 'high school research symposium'],
  authors: [{ name: 'NJSRS' }],
  openGraph: {
    title: 'New Jersey Science Research Symposium | NJSRS',
    description: 'A research competition that brings together high school scientists from across New Jersey',
    url: 'https://njsrs.org',
    siteName: 'NJSRS',
    type: 'website',
  },
  icons: {
    icon: '/njsrs-icon-only.png',
  },
  verification: {
    google: '8jvfqSUGVKpgGljEbfycGtLYA4krAzOj-_8503CXJj8',
  },
  metadataBase: new URL('https://njsrs.org'),
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
