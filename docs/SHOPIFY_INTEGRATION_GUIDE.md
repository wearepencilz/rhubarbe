# Shopify Integration Guide

## Overview

This guide covers the complete Shopify integration setup, including product linking, metafield syncing, and troubleshooting.

---

## Setup Requirements

### 1. Shopify Admin API Access

You need a Shopify Admin API access token with the following permissions:

**Required Scopes:**
- `read_products` - Read product data
- `write_products` - Update product metafields
- `read_product_listings` - List products
- `write_product_listings` - Manage product listings

### 2. Environment Variables

Add these to your `.env.local` file:

```bash
# Shopify Store Domain (without https://)
NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN=your-store.myshopify.com

# Shopify Admin API Access Token
SHOPIFY_ADMIN_ACCESS_TOKEN=shpat_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Shopify Storefront API Access Token (for public store)
NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

## How to Get Shopify Admin API Token

### Step 1: Create a Custom App

1. Go to your Shopify Admin: `https://your-store.myshopify.com/admin`
2. Navigate to **Settings** → **Apps and sales channels**
3. Click **Develop apps**
4. Click **Create an app**
5. Name it: "Janine CMS Integration"
6. Click **Create app**

### Step 2: Configure API Scopes

1. Click **Configure Admin API scopes**
2. Select these scopes:
   - `read_products`
   - `write_products`
   - `read_product_listings`
   - `write_product_listings`
3. Click **Save**

### Step 3: Install the App

1. Click **Install app**
2. Confirm the installation

### Step 4: Get Access Token

1. Click **Reveal token once** under **Admin API access token**
2. Copy the token (starts with `shpat_`)
3. Add it to your `.env.local` as `SHOPIFY_ADMIN_ACCESS_TOKEN`

**⚠️ IMPORTANT:** Save this token immediately - you can only view it once!

---

## Features

### 1. Product Linking

Link CMS flavours to Shopify products to enable:
- Automatic metafield syncing
- Ingredient data on product pages
- Allergen information
- Dietary flags

### 2. Metafield Syncing

When you link a flavour to a Shopify product, the following metafields are synced:

**Namespace: `custom`**

| Key | Type | Description |
|-----|------|-------------|
| `flavour_id` | `single_line_text_field` | CMS flavour ID |
| `ingredient_ids` | `list.single_line_text_field` | Array of ingredient IDs |
| `allergens` | `list.single_line_text_field` | Allergen tags (dairy, nuts, etc.) |
| `dietary_tags` | `list.single_line_text_field` | Dietary flags (vegan, gluten-free, etc.) |
| `seasonal_ingredients` | `boolean` | Has seasonal ingredients |

### 3. Auto-Sync on Link

When you link a product:
1. Flavour status changes to `pending`
2. Sync job is created
3. Metafields are updated in Shopify
4. Status changes to `synced` on success

---

## Usage

### Linking a Product to a Flavour

1. Go to **Admin** → **Flavours**
2. Click on a flavour to edit
3. Scroll to **Shopify Integration** section
4. Click **Link to Shopify Product**
5. Modal opens with products pre-loaded
6. Search or browse products
7. Click on a product to link it
8. Save the flavour

### Syncing Metafields

Metafields sync automatically when you:
- Link a product for the first time
- Click **Resync** button
- Update flavour ingredients

### Checking Sync Status

The sync status indicator shows:
- **✓ Synced** - Metafields are up to date
- **⏳ Pending** - Waiting to sync
- **✗ Failed** - Sync error (see error message)
- **○ Not Linked** - No product linked

---

## Troubleshooting

### Issue: "Failed to search products"

**Possible Causes:**

1. **Missing or Invalid Access Token**
   - Check `.env.local` has `SHOPIFY_ADMIN_ACCESS_TOKEN`
   - Verify token starts with `shpat_`
   - Regenerate token if needed

2. **Wrong Store Domain**
   - Check `NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN` is correct
   - Format: `your-store.myshopify.com` (no https://)
   - No trailing slash

3. **Insufficient API Permissions**
   - Go to Shopify Admin → Apps → Your Custom App
   - Check API scopes include `read_products`
   - Reinstall app if scopes changed

4. **API Version Mismatch**
   - Current version: `2024-01`
   - Check if Shopify deprecated this version
   - Update `SHOPIFY_ADMIN_API_VERSION` in `lib/shopify/admin.ts`

### Issue: "No products found"

**Solutions:**

1. **Check if you have products in Shopify**
   - Go to Shopify Admin → Products
   - Ensure products exist and are active

2. **Try different search terms**
   - Search by product title
   - Use partial matches
   - Try wildcard: leave search empty to browse all

3. **Check product status**
   - Products must have `status:active`
   - Draft products won't appear

### Issue: "Sync failed"

**Possible Causes:**

1. **Missing Write Permissions**
   - Check API scopes include `write_products`
   - Reinstall custom app

2. **Invalid Metafield Data**
   - Check flavour has valid ingredient IDs
   - Ensure allergens are valid values

3. **Network/Timeout Issues**
   - Check server logs for detailed error
   - Retry sync manually

### Issue: Products load but can't link

**Solutions:**

1. **Check Authentication**
   - Ensure you're logged into CMS
   - Session might have expired - refresh page

2. **Check Form Validation**
   - Ensure all required flavour fields are filled
   - Save flavour before linking product

---

## Debugging

### Enable Detailed Logging

The integration now includes detailed console logging:

**In Browser Console:**
- Product search requests/responses
- Sync status updates
- Error messages

**In Server Logs:**
- Shopify API requests (URL, shop, token prefix)
- GraphQL queries and variables
- Response status and errors
- Environment variable checks

### Check Server Logs

1. Open terminal where dev server is running
2. Look for these log prefixes:
   - `🔍` - API request details
   - `📡` - API response status
   - `✅` - Success messages
   - `❌` - Error messages
   - `🔧` - Environment checks

### Test API Connection

You can test the Shopify connection directly:

```bash
# Test with curl
curl -X POST \
  https://your-store.myshopify.com/admin/api/2024-01/graphql.json \
  -H "Content-Type: application/json" \
  -H "X-Shopify-Access-Token: YOUR_TOKEN" \
  -d '{"query": "{ shop { name } }"}'
```

Expected response:
```json
{
  "data": {
    "shop": {
      "name": "Your Store Name"
    }
  }
}
```

---

## API Rate Limits

Shopify has API rate limits:

**Admin API:**
- 2 requests per second
- 1000 points per minute (varies by query complexity)

**Best Practices:**
- Don't sync too many products at once
- Use manual resync sparingly
- Batch operations when possible

---

## Metafield Setup in Shopify

### Creating Metafield Definitions (Optional)

For better Shopify admin UI, create metafield definitions:

1. Go to **Settings** → **Custom data** → **Products**
2. Click **Add definition**
3. Create these definitions:

**Flavour ID:**
- Name: `Flavour ID`
- Namespace and key: `custom.flavour_id`
- Type: `Single line text`

**Ingredient IDs:**
- Name: `Ingredient IDs`
- Namespace and key: `custom.ingredient_ids`
- Type: `List of single line text`

**Allergens:**
- Name: `Allergens`
- Namespace and key: `custom.allergens`
- Type: `List of single line text`

**Dietary Tags:**
- Name: `Dietary Tags`
- Namespace and key: `custom.dietary_tags`
- Type: `List of single line text`

**Seasonal Ingredients:**
- Name: `Seasonal Ingredients`
- Namespace and key: `custom.seasonal_ingredients`
- Type: `True or False`

---

## Using Metafields in Shopify Theme

### Liquid Template Example

```liquid
{% if product.metafields.custom.allergens %}
  <div class="allergens">
    <h3>Allergens</h3>
    <ul>
      {% for allergen in product.metafields.custom.allergens.value %}
        <li>{{ allergen }}</li>
      {% endfor %}
    </ul>
  </div>
{% endif %}

{% if product.metafields.custom.dietary_tags %}
  <div class="dietary-tags">
    {% for tag in product.metafields.custom.dietary_tags.value %}
      <span class="badge">{{ tag }}</span>
    {% endfor %}
  </div>
{% endif %}
```

---

## Security Best Practices

1. **Never commit tokens to git**
   - Use `.env.local` (already in `.gitignore`)
   - Use environment variables in production

2. **Rotate tokens regularly**
   - Regenerate tokens every 90 days
   - Update in all environments

3. **Use minimal permissions**
   - Only grant required API scopes
   - Don't use full access tokens

4. **Monitor API usage**
   - Check Shopify Admin → Apps → API usage
   - Watch for unusual activity

---

## Production Deployment

### Vercel Environment Variables

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add these variables:
   - `NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN`
   - `SHOPIFY_ADMIN_ACCESS_TOKEN`
   - `NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN`
3. Set for: Production, Preview, Development
4. Redeploy

### Testing in Production

1. Deploy to Vercel
2. Go to your production URL
3. Login to CMS admin
4. Try linking a product
5. Check sync status
6. Verify metafields in Shopify Admin

---

## FAQ

**Q: Can I link multiple flavours to one product?**
A: No, it's a 1:1 relationship. One flavour per product.

**Q: What happens if I unlink a product?**
A: The metafields remain in Shopify but won't be updated anymore.

**Q: Can I manually edit metafields in Shopify?**
A: Yes, but they'll be overwritten on next sync.

**Q: How do I bulk sync all flavours?**
A: Currently not supported. Sync each flavour individually.

**Q: Does this work with Shopify Plus?**
A: Yes, same API for all Shopify plans.

---

## Support

If you're still having issues:

1. Check server logs for detailed errors
2. Verify all environment variables are set
3. Test Shopify API connection with curl
4. Check Shopify API status: https://www.shopifystatus.com/
5. Review Shopify API documentation: https://shopify.dev/docs/api/admin-graphql

---

## Next Steps

- [ ] Set up Shopify custom app
- [ ] Add environment variables
- [ ] Test product search
- [ ] Link a test flavour
- [ ] Verify metafields in Shopify
- [ ] Update Shopify theme to display metafields
- [ ] Deploy to production
