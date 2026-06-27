import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';
import { Toaster } from 'react-hot-toast';
import { CustomCursor } from '@/components/layout/CustomCursor';
import { SpeedInsights } from '@vercel/speed-insights/next';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: {
    default: 'ResinVerse – Crafted Memories, Preserved Forever',
    template: '%s | ResinVerse',
  },
  description: 'Discover handmade resin art jewelry, keychains, lockets, and personalized gifts. Trendy, aesthetic, and crafted with love for Gen Z.',
  keywords: ['resin art', 'handmade jewelry', 'resin keychains', 'resin lockets', 'personalized gifts', 'resin rings', 'resin bracelets'],
  authors: [{ name: 'ResinVerse' }],
  creator: 'ResinVerse',
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://resinverse.in',
    siteName: 'ResinVerse',
    title: 'ResinVerse – Crafted Memories, Preserved Forever',
    description: 'Discover handmade resin art jewelry, keychains, lockets, and personalized gifts.',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'ResinVerse' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ResinVerse – Crafted Memories, Preserved Forever',
    description: 'Discover handmade resin art jewelry, keychains, lockets, and personalized gifts.',
    images: ['/og-image.jpg'],
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#8B5CF6',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400;1,600&family=Outfit:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased min-h-screen flex flex-col relative selection:bg-purple-500/30 selection:text-purple-100">
        <Providers>
          <CustomCursor />
          {children}
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: 'rgba(20, 10, 30, 0.9)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                color: '#f3e8ff',
                borderRadius: '12px',
                padding: '12px 16px',
              },
              success: {
                iconTheme: { primary: '#a855f7', secondary: '#f3e8ff' },
              },
              error: {
                iconTheme: { primary: '#ef4444', secondary: '#f3e8ff' },
              },
            }}
          />
          <SpeedInsights />
        </Providers>
      </body>
    </html>
  );
}
