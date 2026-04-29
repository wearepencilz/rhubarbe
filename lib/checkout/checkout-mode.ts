/**
 * Feature flag for draft order checkout.
 *
 * Set CHECKOUT_MODE=draft in .env to enable draft orders for all flows.
 * Or use per-flow overrides: CHECKOUT_MODE_CAKE=draft, CHECKOUT_MODE_VOLUME=draft, CHECKOUT_MODE_LAUNCH=draft
 *
 * Default: "cart" (current Storefront API cart flow)
 */

export type CheckoutMode = 'cart' | 'draft';

export function getCheckoutMode(flow: 'launch' | 'cake' | 'volume'): CheckoutMode {
  const perFlow = process.env[`CHECKOUT_MODE_${flow.toUpperCase()}`];
  if (perFlow === 'draft' || perFlow === 'cart') return perFlow;
  const global = process.env.CHECKOUT_MODE;
  if (global === 'draft') return 'draft';
  return 'cart';
}
