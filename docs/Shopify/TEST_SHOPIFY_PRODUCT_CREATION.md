# Test Shopify Product Creation - Manual Steps

## ✅ Setup Complete

Your Shopify credentials are now configured:
- **Admin Access Token**: ✅ Set
- **OAuth Client ID**: ✅ Set  
- **OAuth Client Secret**: ✅ Set
- **Connection Test**: ✅ Passed (found "Goat Cheese & Fig" product)

## 🧪 Test Creating a Product

### Step 1: Login to Admin
1. Go to: http://localhost:3000/admin/login
2. Login with: `admin` / `admin123`

### Step 2: Navigate to Offerings
1. Click "Offerings" in the sidebar
2. You should see 3 offerings:
   - ✅ Vanilla Strawberry ($12.00) - Already linked to Shopify
   - ✅ Grilled Corn ($8.50) - Ready to create product
   - ❌ Wild Tomato ($0.00) - Needs price first

### Step 3: Create Product for "Grilled Corn"
1. Click on "Grilled Corn" offering
2. Scroll down to "Shopify Integration" section
3. You should see:
   - Blue info box saying "not linked to a Shopify product yet"
   - Green button "✨ Create New Shopify Product"
4. Click the green button
5. Confirm the dialog

### Expected Result
- Success message with product details
- Product title: "Grilled Corn - Soft Serve"
- Product handle: auto-generated
- Offering now shows linked Shopify product

### Step 4: Verify in Shopify Admin
1. Go to: https://janinemtl.myshopify.com/admin/products
2. You should see the new "Grilled Corn - Soft Serve" product
3. Check that it has:
   - Price: $8.50
   - Status: DRAFT
   - Tags: Soft Serve, Gelato
   - Metafields with CMS links

## 🐛 Troubleshooting

### Button is Disabled
- Check that the price is greater than $0
- Yellow warning should explain what's missing

### Error: "Price must be greater than $0"
- Edit the offering and set a valid price
- Save the offering first
- Then try creating the product again

### Error: "Format not found" or "No flavours found"
- The offering needs a format and flavours
- These are set when creating the offering
- Create a new offering if needed

### Error: "Failed to create Shopify product"
- Check browser console (F12) for detailed error
- Check server terminal for API logs
- Verify Shopify credentials in `.env.local`

## 📊 What Gets Created

When you create a Shopify product from an offering:

```
Product Title: {Flavour Names} - {Format Name}
Example: "Grilled Corn - Soft Serve"

Description: HTML with offering description + flavour details
Product Type: Format category (e.g., "frozen")
Vendor: "Janine"
Tags: Offering tags + format name + flavour types
Status: ACTIVE (if offering is active) or DRAFT
Price: From offering (e.g., $8.50)
SKU: From offering or auto-generated

Metafields:
- janine.offering_id → Links back to CMS
- janine.format_id → Links to format
- janine.flavour_ids → Array of flavour IDs
```

## 🔍 Server Logs to Watch

When you click "Create Shopify Product", watch the terminal for:

```
🔍 Shopify Admin API Request: {...}
📡 Shopify Admin API Response: {...}
✅ Shopify Admin API Data: {...}
```

If there's an error, you'll see:
```
❌ Shopify Admin API Error Response: {...}
❌ GraphQL Errors: {...}
```

## ✅ Success Indicators

1. Alert popup with product details
2. Offering page refreshes and shows linked product
3. ShopifyProductPicker shows the linked product
4. "Create New Shopify Product" button disappears
5. Product appears in Shopify Admin

## 📝 Next Steps After Success

1. Test with "Wild Tomato" offering:
   - Edit it and set price to $7.50
   - Create Shopify product
   
2. Verify both products in Shopify Admin

3. Test linking to existing products:
   - Create a new offering
   - Use ShopifyProductPicker to link to existing product
   - Save and verify

4. Test the full workflow:
   - Create offering → Set price → Create Shopify product → Verify in Shopify
