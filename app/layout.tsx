import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import '../src/styles/globals.css';
import { CartProvider } from '@/contexts/CartContext';
import { Providers } from './providers';
import ConditionalHeader from '@/components/ConditionalHeader';
import MobileDevLinkHeader from '@/components/MobileDevLinkHeader';

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Janine - Artisanal Ice Cream',
  description: 'Artisanal ice cream and soft serve in Montreal',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Janine',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <Providers>
          <CartProvider>
            <MobileDevLinkHeader />
            <ConditionalHeader />
            {children}
          </CartProvider>
        </Providers>
      </body>
    </html>
  );
}
