# Shopify Integration - Quick Start

## 🚀 Quick Setup (5 minutes)

### Step 1: Get Your Shopify Admin Token

1. Go to: `https://your-store.myshopify.com/admin/settings/apps/development`
2. Click **Create an app** → Name it "Janine CMS"
3. Click **Configure Admin API scopes**
4. Select: `read_products` and `write_products`
5. Click **Save** → **Install app**
6. Click **Reveal token once** → Copy it

### Step 2: Add to Environment Variables

Add to `.env.local`:

```bash
NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN=your-store.myshopify.com
SHOPIFY_ADMIN_ACCESS_TOKEN=shpat_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Step 3: Test Connection

Run the test script:

```bash
npx tsx scripts/test-shopify-connection.ts
```

You should see:
```
✅ Shop info retrieved successfully!
✅ Found X products
✅ All tests passed!
```

### Step 4: Try It in the CMS

1. Start dev server: `npm run dev`
2. Go to: `http://localhost:3000/admin/flavours`
3. Edit any flavour
4. Scroll to **Shopify Integration**
5. Click **Link to Shopify Product**
6. Products should load automatically!

---

## 🐛 Troubleshooting

### "Failed to search products"

**Check your token:**
```bash
# Should start with "shpat_"
echo $SHOPIFY_ADMIN_ACCESS_TOKEN
```

**Check your store domain:**
```bash
# Should be: your-store.myshopify.com (no https://)
echo $NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN
```

**Run the test script:**
```bash
npx tsx scripts/test-shopify-connection.ts
```

### "No products found"

1. Check you have products in Shopify Admin
2. Make sure products are **Active** (not Draft)
3. Try leaving search empty to browse all products

### Still not working?

Check the browser console and server logs for detailed error messages. The integration now includes extensive logging with emoji prefixes:
- 🔍 = Request details
- 📡 = Response status
- ✅ = Success
- ❌ = Error
- 🔧 = Environment check

---

## 📚 Full Documentation

See `SHOPIFY_INTEGRATION_GUIDE.md` for:
- Complete setup instructions
- Metafield syncing details
- API rate limits
- Security best practices
- Production deployment
- Using metafields in Shopify themes

---

## ✨ New Features

### Auto-Load Products
- Products now load automatically when you open the picker
- No need to search first
- Browse all products or search for specific ones

### Better Error Messages
- Detailed logging in console and server
- Clear error messages with solutions
- Environment variable validation

### Improved UX
- Loading spinner while fetching
- Better empty states
- Retry buttons on errors

---

## 🔄 What Gets Synced

When you link a flavour to a Shopify product, these metafields are automatically synced:

| Metafield | Description |
|-----------|-------------|
| `custom.flavour_id` | CMS flavour ID |
| `custom.ingredient_ids` | List of ingredient IDs |
| `custom.allergens` | Allergen tags (dairy, nuts, etc.) |
| `custom.dietary_tags` | Dietary flags (vegan, gluten-free) |
| `custom.seasonal_ingredients` | Has seasonal ingredients (true/false) |

You can use these in your Shopify theme to display ingredient info, allergens, and dietary tags on product pages.

---

## 🎯 Next Steps

1. ✅ Set up Shopify custom app
2. ✅ Add environment variables
3. ✅ Test connection with script
4. ✅ Link a test flavour
5. ⬜ Verify metafields in Shopify Admin
6. ⬜ Update Shopify theme to display metafields
7. ⬜ Deploy to production

---

## 💡 Pro Tips

- **Search Tips:** Use partial matches like "ice" to find "ice cream" products
- **Bulk Operations:** Link products as you create flavours to keep them in sync
- **Metafield Definitions:** Create metafield definitions in Shopify for better admin UI
- **Theme Integration:** Use metafields in your theme to show ingredient info to customers

---

Need help? Check the full guide or run the test script for diagnostics!
