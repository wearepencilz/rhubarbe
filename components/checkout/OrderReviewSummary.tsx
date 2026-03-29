'use client';

import type { OrderTypeConfig } from '@/lib/checkout/order-type-config';
import type {
  CartItemUnion,
  FulfillmentState,
  RegularCartItem,
  VolumeCartItem,
  CakeCartItem,
} from '@/lib/checkout/types';

interface OrderReviewSummaryProps {
  config: OrderTypeConfig;
  cartItems: CartItemUnion[];
  fulfillment: FulfillmentState;
  locale: string;
}

function formatPrice(cents: number, locale: string): string {
  return new Intl.NumberFormat(locale === 'fr' ? 'fr-CA' : 'en-CA', {
    style: 'currency',
    currency: 'CAD',
  }).format(cents / 100);
}

function getItemPrice(item: CartItemUnion): number {
  if ('calculatedPrice' in item) return item.calculatedPrice; // CakeCartItem
  return item.price * item.quantity;
}

function getItemName(item: CartItemUnion): string {
  if ('name' in item) return item.name; // RegularCartItem
  return (item as VolumeCartItem | CakeCartItem).productName;
}

function getVariantLabel(item: CartItemUnion): string | null {
  if ('variantLabel' in item) return item.variantLabel;
  return null;
}

function getQuantity(item: CartItemUnion): number {
  if ('quantity' in item) return item.quantity;
  return 1; // CakeCartItem has no quantity field — always 1
}

function formatDate(dateStr: string, locale: string): string {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString(locale === 'fr' ? 'fr-CA' : 'en-CA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default function OrderReviewSummary({
  config,
  cartItems,
  fulfillment,
  locale,
}: OrderReviewSummaryProps) {
  const isFr = locale === 'fr';

  const subtotal = cartItems.reduce((sum, item) => sum + getItemPrice(item), 0);
  const orderSpecificFields = config.getOrderSpecificFields(cartItems, fulfillment, locale);

  const pickupSlot = (fulfillment as any).pickupSlot as
    | { startTime: string; endTime: string }
    | undefined;

  return (
    <div className="space-y-4">
      {/* Cart items */}
      <div>
        <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">
          {isFr ? 'Articles' : 'Items'}
        </p>
        <ul className="space-y-2">
          {cartItems.map((item, idx) => {
            const name = getItemName(item);
            const variant = getVariantLabel(item);
            const qty = getQuantity(item);
            const linePrice = getItemPrice(item);

            return (
              <li key={idx} className="flex justify-between text-sm text-gray-900">
                <div>
                  <span>{name}</span>
                  {variant && (
                    <span className="text-gray-500 ml-1">— {variant}</span>
                  )}
                  <span className="text-gray-500 ml-1">×{qty}</span>
                </div>
                <span className="whitespace-nowrap">{formatPrice(linePrice, locale)}</span>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Subtotal */}
      <div className="border-t pt-3 flex justify-between text-sm font-medium text-gray-900">
        <span>{isFr ? 'Sous-total' : 'Subtotal'}</span>
        <span>{formatPrice(subtotal, locale)}</span>
      </div>

      {/* Fulfillment info */}
      <div className="border-t pt-3 space-y-2">
        <p className="text-xs text-gray-500 uppercase tracking-wide">
          {isFr ? 'Livraison' : 'Fulfillment'}
        </p>

        <div className="flex justify-between text-sm text-gray-900">
          <span>{isFr ? 'Méthode' : 'Method'}</span>
          <span>
            {fulfillment.fulfillmentType === 'pickup'
              ? isFr ? 'Cueillette' : 'Pickup'
              : isFr ? 'Livraison' : 'Delivery'}
          </span>
        </div>

        {fulfillment.date && (
          <div className="flex justify-between text-sm text-gray-900">
            <span>{isFr ? 'Date' : 'Date'}</span>
            <span>{formatDate(fulfillment.date, locale)}</span>
          </div>
        )}

        {config.orderType === 'regular' && pickupSlot && (
          <div className="flex justify-between text-sm text-gray-900">
            <span>{isFr ? 'Créneau' : 'Pickup slot'}</span>
            <span>{pickupSlot.startTime} – {pickupSlot.endTime}</span>
          </div>
        )}

        {fulfillment.fulfillmentType === 'delivery' && (
          <div className="text-sm text-gray-900">
            <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">
              {isFr ? 'Adresse de livraison' : 'Delivery address'}
            </p>
            <p>{fulfillment.address.street}</p>
            <p>
              {fulfillment.address.city}, {fulfillment.address.province}{' '}
              {fulfillment.address.postalCode}
            </p>
          </div>
        )}
      </div>

      {/* Order-type-specific fields */}
      {orderSpecificFields.length > 0 && (
        <div className="border-t pt-3 space-y-2">
          <p className="text-xs text-gray-500 uppercase tracking-wide">
            {isFr ? 'Détails' : 'Details'}
          </p>
          {orderSpecificFields.map((field, idx) => (
            <div key={idx} className="flex justify-between text-sm text-gray-900">
              <span className="text-gray-500">{field.label}</span>
              <span>{field.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
