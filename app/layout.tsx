import type { Metadata, Viewport } from 'next';
import '../src/styles/globals.css';
import { CartProvider } from '@/contexts/CartContext';
import { OrderItemsProvider } from '@/contexts/OrderItemsContext';
import { CartDrawerProvider } from '@/contexts/CartDrawerContext';
import { CakeCartProvider } from '@/contexts/CakeCartContext';
import { WeeklyCartProvider } from '@/contexts/WeeklyCartContext';
import { CateringCartProvider } from '@/contexts/CateringCartContext';
import { Providers } from './providers';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/home/SiteFooter';
import PublicLayout from '@/components/PublicLayout';
import DesignTokensStyle from '@/components/DesignTokensStyle';
import UnifiedCartPanelRoot from '@/components/UnifiedCartPanelRoot';
import CakeCartSlotRegistrar from '@/components/CakeCartSlotRegistrar';
import WeeklyCartSlotRegistrar from '@/components/WeeklyCartSlotRegistrar';
import CateringCartSlotRegistrar from '@/components/CateringCartSlotRegistrar';

export const metadata: Metadata = {
  title: 'Rhubarbe',
  description: 'Artisanal ice cream and soft serve in Montreal',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Rhubarbe',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export const revalidate = 60; // revalidate layout data every 60 seconds

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <head>
        <link rel="preconnect" href="https://cdn.shopify.com" />
        <link rel="dns-prefetch" href="https://cdn.shopify.com" />
        <link rel="preload" href="/fonts/Solar.woff" as="font" type="font/woff" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/Rank.woff" as="font" type="font/woff" crossOrigin="anonymous" />
      </head>
      <body>
        <DesignTokensStyle />
        <Providers>
          <CartDrawerProvider>
          <CartProvider>
            <CakeCartProvider>
            <CateringCartProvider>
            <WeeklyCartProvider>
            <OrderItemsProvider>
              <PublicLayout header={<SiteHeader />} footer={<SiteFooter />}>
                {children}
              </PublicLayout>
              <UnifiedCartPanelRoot />
              <CakeCartSlotRegistrar />
              <WeeklyCartSlotRegistrar />
              <CateringCartSlotRegistrar />
            </OrderItemsProvider>
            </WeeklyCartProvider>
            </CateringCartProvider>
            </CakeCartProvider>
          </CartProvider>
          </CartDrawerProvider>
        </Providers>
      </body>
    </html>
  );
}
