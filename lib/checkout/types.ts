// Shared types for the hybrid checkout flow
// Requirements: 1.2, 2.1, 2.5, 3.1, 6.1

export interface DeliveryAddress {
  street: string;
  city: string;
  province: string;
  postalCode: string;
}

export interface FulfillmentState {
  fulfillmentType: 'pickup' | 'delivery';
  date: string; // YYYY-MM-DD or '' if not selected
  pickupSlotId: string | null; // Regular orders only
  pickupDay: string | null; // Regular orders with multi-day windows
  address: DeliveryAddress; // Populated only for delivery
  allergenNote: string; // Volume orders only
  eventType: string; // Cake orders only
  specialInstructions: string; // Cake orders only
  numberOfPeople: number; // Cake orders only
}

export type CheckoutStep = 'fulfillment' | 'review';

export interface RegularCartItem {
  productId: string;
  variantId: string | null;
  variantLabel: string | null;
  name: string;
  price: number; // cents
  quantity: number;
  image: string | null;
  shopifyProductId: string | null;
  shopifyVariantId: string | null;
  allergens: string[];
}

export interface VolumeCartItem {
  variantId: string;
  variantLabel: string;
  productId: string;
  productName: string;
  shopifyProductId: string | null;
  shopifyVariantId: string;
  quantity: number;
  price: number; // cents
  allergens: string[];
}

export interface CakeCartItem {
  productId: string;
  productName: string;
  shopifyProductId: string | null;
  shopifyVariantId: string;
  numberOfPeople: number;
  calculatedPrice: number; // cents
  image: string | null;
  allergens: string[];
}

export type CartItemUnion = RegularCartItem | VolumeCartItem | CakeCartItem;

export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}
