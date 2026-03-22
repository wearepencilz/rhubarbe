# Checkout Pickup Info — Shopify Checkout UI Extension

This extension displays pickup details (date, location, time slot) inside the
Shopify checkout page by reading the cart attributes set during the preorder flow.

## Setup

1. Create a Shopify app (or use your existing one) at https://partners.shopify.com
2. Install the Shopify CLI: `npm install -g @shopify/cli`
3. From this directory, run:
   ```bash
   npm install
   shopify app dev
   ```
4. In Shopify Admin → Settings → Checkout → Customize checkout, drag the
   "Pickup Details" block into the checkout layout.

## How it works

The preorder flow on the Next.js app sets these cart attributes:
- `Menu` — the menu/launch name
- `Pickup Date` — formatted pickup date
- `Pickup Location` — location name
- `Pickup Address` — street address
- `Pickup Slot` — time window (e.g. "10:00 – 11:00")

This extension reads those attributes via the Storefront API's
`useCartAttributes()` hook and renders them in a styled block.
