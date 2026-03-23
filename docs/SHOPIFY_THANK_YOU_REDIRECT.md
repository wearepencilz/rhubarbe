# Shopify → Thank You Page Redirect

After checkout, Shopify needs to redirect customers back to `/thank-you` on your domain so they see their order confirmation with pickup details.

## Setup Steps

### 1. Open Shopify Checkout Settings

1. Go to **Shopify Admin** → **Settings** → **Checkout**
2. Scroll down to the **Order status page** section

### 2. Add the redirect script

In the **Additional scripts** field, paste:

```html
<script>
  window.location.replace("https://rhubarbe.ca/thank-you");
</script>
```

> Replace `rhubarbe.ca` with your actual production domain.

This runs immediately after Shopify shows the order confirmation, redirecting the customer to your branded thank-you page.

### 3. Verify the flow

1. Place a test order using Shopify's **Bogus Gateway** (Settings → Payments → enable test mode)
2. Use card number `1` for a successful payment
3. After payment, you should land on `https://rhubarbe.ca/thank-you`
4. The page should show the order summary (items, pickup date, location, time slot)
5. The cart should be cleared

## How it works

- Before redirecting to Shopify checkout, the order page saves order details (items, pickup info, subtotal) to `sessionStorage`
- After payment, Shopify redirects to `/thank-you`
- The thank-you page reads the order from `sessionStorage`, displays it, then clears both `sessionStorage` and the Shopify cart from `localStorage`

## Notes

- If a customer navigates directly to `/thank-you` without order data, they'll see the heading and message but no order details — this is fine
- The CMS content (heading, message, pickup reminder) is editable at **Admin → Pages → Thank You / Merci**
- Both FR and EN translations are supported and follow the user's locale preference
