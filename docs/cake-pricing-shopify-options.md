# Cake Pricing × Shopify — Integration Options

## Context

Cake orders use tiered pricing based on the number of people (e.g. 30 people → $400, 40 → $480, 50 → $560). The price is calculated on our platform, but the actual payment happens through Shopify checkout. This document outlines three approaches for connecting the two.

---

## Option A: One Shopify Variant Per Pricing Tier (Recommended)

Create a Shopify variant for each pricing tier directly on the cake product.

**Example Shopify variants:**
- "30 people" — $400.00
- "40 people" — $480.00
- "50 people" — $560.00

**How it works:**
1. Admin configures pricing tiers in the CMS (min people → price)
2. Each tier is mapped to a Shopify variant via the admin UI
3. When a customer selects a number of people, the system picks the matching variant
4. Shopify checkout charges the correct price automatically

**Pros:**
- Shopify handles all pricing — order totals are always accurate
- No manual adjustment needed after the order comes in
- Inventory, reporting, and refunds all work natively
- Clean integration with Shopify's tax and discount systems

**Cons:**
- Requires creating/maintaining variants in Shopify that mirror the CMS tiers
- If tiers change frequently, both systems need updating
- Shopify has a limit of 100 variants per product (not a concern for typical cake tiers)

**Effort:** Medium — requires wiring the tier-to-variant mapping in checkout logic.

---

## Option B: Single Variant + Manual Invoicing

Keep a single Shopify variant at $0 (or a nominal $1). The real price is communicated through order notes and cart attributes.

**How it works:**
1. Customer places the order — Shopify creates an order at $0
2. The order note includes: cake name, number of people, calculated price, event details
3. The shop owner reviews the order in Shopify admin and manually edits the total
4. Payment is collected separately (e.g. Shopify "collect payment" button, invoice, or e-transfer)

**Pros:**
- Simplest to implement — no variant mapping needed
- Flexible for custom pricing or negotiation
- Works well for low-volume, high-touch orders (weddings, corporate events)

**Cons:**
- Requires manual intervention for every order
- Shopify reports won't reflect accurate revenue until manually adjusted
- Customer doesn't see the real price at checkout (could cause confusion)
- No automatic payment collection

**Effort:** Low — already partially implemented (price is passed in cart attributes and order note).

---

## Option C: Shopify Draft Order API

Use Shopify's Draft Order API to create orders with custom line item prices server-side, then send the customer a payment link.

**How it works:**
1. Instead of creating a Shopify cart, the backend creates a Draft Order via the Admin API
2. The draft order includes a custom line item with the exact tier price
3. Shopify generates an invoice/payment link
4. The customer receives the link and completes payment

**Pros:**
- Full control over line item pricing — no variant gymnastics
- Customer sees the correct price and pays through Shopify
- Works with Shopify's native invoicing and payment flow
- Order totals are accurate from the start

**Cons:**
- More complex to implement (Admin API instead of Storefront API)
- Two-step flow: order creation → customer receives invoice → customer pays
- Not an instant checkout experience — there's a delay
- Requires Shopify Admin API access (already available in this project)

**Effort:** High — requires replacing the cart-based checkout with a draft order flow.

---

## Current Implementation

The system currently uses a hybrid approach:
- A Shopify cart is created with `quantity: 1` of the product's first variant
- The calculated tier price is passed as a **cart attribute** (`Calculated Price`) and in the **order note**
- Shopify charges whatever price is set on the variant — the tier price is informational only

This means the Shopify order total may not match the tier price unless Option A or C is implemented.

---

## Recommendation

**For now:** Option A is the best balance of accuracy and simplicity. It keeps Shopify as the source of truth for pricing (which aligns with the platform architecture) while giving customers a seamless checkout experience.

**If order volume is low and personal follow-up is preferred:** Option B works fine and requires no additional development.

**If full pricing flexibility is needed long-term:** Option C is the most robust but requires the most development effort.
