# Shopify Product Creation from Offerings

## Overview

The CMS allows you to create Shopify products directly from offerings, automatically syncing all the relevant data including flavours, format, pricing, and metadata.

## Prerequisites

Before creating a Shopify product from an offering, ensure:

1. **Shopify credentials are configured** in `.env.local`:
   - `NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN` - Your Shopify store domain
   - `SHOPIFY_ADMIN_ACCESS_TOKEN` - Admin API access token (for custom apps)
   - OR `SHOPIFY_CLIENT_ID` + `SHOPIFY_CLIENT_SECRET` (for OAuth apps)

2. **Offering has valid data**:
   - Price must be greater than $0
   - Must have a format assigned
   - Must have at least one flavour assigned

## Testing Your Shopify Connection

Run the test script to verify your Shopify credentials are working:

```bash
npx tsx scripts/test-shopify-connection.ts
```

This will:
- Check your environment variables
- Test authentication (direct token or OAuth)
- Query your Shopify products
- Display any errors

## Creating a Shopify Product

### From the CMS Admin

1. Navigate to **Offerings** in the admin panel
2. Click on an offering to edit it
3. Scroll to the **Shopify Integration** section
4. If the offering is not yet linked:
   - Set a valid price (> $0) if not already set
   - Click **"✨ Create New Shopify Product"**
5. The system will:
   - Generate a product title from flavours and format
   - Create a description with flavour details
   - Set the price and SKU
   - Add tags from offering, format, and flavour types
   - Create metafields linking back to the CMS
   - Update the offering with the Shopify product ID

### What Gets Created

The Shopify product will include:

- **Title**: `{Flavour Names} - {Format Name}`
  - Example: "Vanilla & Strawberry Thyme - Twist"
- **Description**: HTML with offering description and flavour details
- **Product Type**: Format category (e.g., "frozen")
- **Vendor**: "Janine"
- **Tags**: Offering tags + format name + flavour types
- **Status**: "ACTIVE" if offering is active, otherwise "DRAFT"
- **Variant**: Single variant with:
  - Price from offering
  - SKU from offering (or auto-generated)
  - Inventory tracking (if enabled)
- **Image**: Featured image from offering (if set)
- **Metafields**:
  - `janine.offering_id` - Links to CMS offering
  - `janine.format_id` - Links to CMS format
  - `janine.flavour_ids` - Array of CMS flavour IDs

## Linking to Existing Products

If you already have a Shopify product and want to link it to an offering:

1. In the offering edit page, scroll to **Shopify Integration**
2. Use the **ShopifyProductPicker** to search and select an existing product
3. Save the offering

## Troubleshooting

### "Price must be greater than $0"

The offering needs a valid price before creating a Shopify product. Edit the offering and set a price in the **Price ($)** field.

### "Format not found" or "No flavours found"

The offering must have a format and at least one flavour assigned. These are set when creating the offering and cannot be changed later. Create a new offering if you need different format/flavours.

### "Failed to create Shopify product"

Check the browser console and server logs for detailed error messages. Common issues:

1. **Authentication failed**: Verify your Shopify credentials in `.env.local`
2. **API permissions**: Ensure your Shopify app has `write_products` permission
3. **Invalid data**: Check that all required fields are properly set

Run the test script to verify your connection:
```bash
npx tsx scripts/test-shopify-connection.ts
```

### "Offering is already linked to a Shopify product"

The offering is already connected to a Shopify product. You can:
- View the linked product in the Shopify Integration section
- Unlink it by clearing the Shopify Product ID field
- Create a new offering if you need a separate product

## API Endpoint

The product creation is handled by:

```
POST /api/offerings/[id]/create-shopify-product
```

This endpoint:
- Validates the offering data
- Creates the Shopify product via Admin API
- Updates the offering with Shopify product info
- Returns the created product details

## Next Steps

After creating a Shopify product:

1. **Review in Shopify Admin**: Check the product in your Shopify admin panel
2. **Add more images**: Upload additional product images in Shopify
3. **Configure variants**: Add size/flavor variants if needed
4. **Set up collections**: Add the product to Shopify collections
5. **Publish**: Change status to "ACTIVE" when ready to sell

## Related Documentation

- [Shopify Integration Guide](SHOPIFY_INTEGRATION_GUIDE.md)
- [Get Shopify Token](GET_SHOPIFY_TOKEN.md)
- [CMS Quick Start](CMS_QUICKSTART.md)
