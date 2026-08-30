import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import type { Metadata, Viewport } from 'next'
import { Cormorant_Garamond, Jost } from 'next/font/google'
import './globals.css'
import { Toaster } from 'sonner'

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-cormorant',
})

const jost = Jost({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-jost',
})

export const metadata: Metadata = {
  metadataBase: new URL('https://luma.com.uy'),
  title: {
    default: 'LUMA · Centro Estético en Montevideo',
    template: '%s | LUMA Centro Estético',
  },
  description:
    'Iluminamos tu belleza, potenciamos tu esencia. Nails, pedicura, depilación, masajes y cosmetología en Montevideo. Agendá tu turno online.',
  keywords: ['centro estético Montevideo', 'nails Montevideo', 'manicura', 'pedicura', 'masajes', 'cosmetología', 'LUMA Centro Estético'],
  alternates: { canonical: 'https://luma.com.uy/' },
  openGraph: {
    type: 'website',
    locale: 'es_UY',
    url: 'https://luma.com.uy/',
    siteName: 'LUMA Centro Estético',
    title: 'LUMA · Centro Estético en Montevideo',
    description: 'Nails, pedicura, masajes y cosmetología en Montevideo. Reservá tu momento.',
  },
  twitter: {
    card: 'summary',
    title: 'LUMA · Centro Estético en Montevideo',
    description: 'Nails, pedicura, masajes y cosmetología en Montevideo. Reservá tu momento.',
  },
  generator: 'v0.app',
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
}

export const viewport: Viewport = {
  themeColor: '#f4efe6',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className={`light ${cormorant.variable} ${jost.variable} bg-background`}>
      <body className="font-sans antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'BeautySalon',
              name: 'LUMA Centro Estético',
              url: 'https://luma.com.uy',
              description: 'Centro estético en Montevideo con servicios de nails, pedicura, masajes y cosmetología.',
              areaServed: 'Montevideo, Uruguay',
              priceRange: '$$',
              telephone: '+598 95 206 278',
              sameAs: ['https://wa.me/59895206278'],
            }),
          }}
        />
        {children}
        <Toaster position="top-right" richColors closeButton />
        {process.env.NODE_ENV === 'production' && <Analytics />}
        {process.env.NODE_ENV === 'production' && <SpeedInsights />}
      </body>
    </html>
  )
}
