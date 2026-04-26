# Site Map

Complete route map of the application. Updated 2026-04-26.

## Storefront (Public)

| Route | Description |
|---|---|
| `/` | Home — composable page (page builder) |
| `/p/[slug]` | Dynamic CMS pages (about, etc.) |
| `/journal` | Journal listing |
| `/journal/[slug]` | Journal article (section-based content) |
| `/recipes` | Recipe listing |
| `/contact` | Contact page |
| `/collections/all` | All Shopify products |
| `/collections/[handle]` | Shopify collection |
| `/products/[handle]` | Shopify product detail |
| `/order` | Regular ordering (ice cream) |
| `/order/[slug]` | Order by product slug |
| `/order/checkout` | Regular order checkout |
| `/cake` | Cake ordering |
| `/cake/checkout` | Cake order checkout |
| `/catering` | Catering / volume ordering |
| `/catering/checkout` | Catering order checkout |
| `/cake-order` | Redirect → `/cake` |
| `/volume-order` | Redirect → `/catering` |
| `/thank-you` | Post-checkout confirmation |

## Admin (Protected — Clerk auth)

### Dashboard & Global
| Route | Description |
|---|---|
| `/admin` | Dashboard |
| `/admin/login/[[...sign-in]]` | Clerk sign-in |
| `/admin/settings` | Global site settings |
| `/admin/design` | Typography token editor |
| `/admin/taxonomies` | Taxonomy manager (sidebar layout) |
| `/admin/translations` | Translation management |
| `/admin/users` | User management |

### Content
| Route | Description |
|---|---|
| `/admin/pages` | CMS pages list |
| `/admin/pages/[pageName]` | Page builder editor |
| `/admin/journal` | Journal entries list |
| `/admin/journal/[id]` | Journal entry editor |
| `/admin/recipes` | Recipes list |
| `/admin/recipes/[id]` | Recipe editor |
| `/admin/faqs` | FAQ management |

### Products
| Route | Description |
|---|---|
| `/admin/products` | Products list (regular) |
| `/admin/products/[id]` | Product editor |
| `/admin/products/create` | Create product |

### Cake Products
| Route | Description |
|---|---|
| `/admin/cake-products` | Cake products list |
| `/admin/cake-products/[id]` | Cake product editor |
| `/admin/cake-products/create` | Create cake product |
| `/admin/cake-products/orders` | Cake orders |
| `/admin/cake-products/settings` | Cake capacity + pickup config |
| `/admin/cake-products/prep-sheet` | Cake prep sheet |
| `/admin/cake-products/pickup-list` | Cake pickup list |
| `/admin/cake-products/email-template` | Cake email template |

### Volume / Catering Products
| Route | Description |
|---|---|
| `/admin/volume-products` | Volume products list |
| `/admin/volume-products/[id]` | Volume product editor |
| `/admin/volume-products/create` | Create volume product |
| `/admin/volume-products/orders` | Volume orders |
| `/admin/volume-products/settings` | Volume settings |
| `/admin/volume-products/prep-sheet` | Volume prep sheet |
| `/admin/volume-products/pickup-list` | Volume pickup list |
| `/admin/volume-products/email-template` | Volume email template |

### Menus
| Route | Description |
|---|---|
| `/admin/menus` | Menu list |
| `/admin/menus/[id]` | Menu editor |
| `/admin/menus/create` | Create menu |
| `/admin/menus/orders` | Menu orders |
| `/admin/menus/prep-sheet` | Menu prep sheet |
| `/admin/menus/pickup-list` | Menu pickup list |

### Orders & Operations
| Route | Description |
|---|---|
| `/admin/orders` | All orders |
| `/admin/orders/[id]` | Order detail |
| `/admin/orders/prep` | Prep overview |
| `/admin/orders/prep-sheet` | Prep sheet |
| `/admin/orders/pickup-list` | Pickup list |
| `/admin/pickup-locations` | Pickup locations list |
| `/admin/pickup-locations/[id]` | Pickup location editor |
| `/admin/pickup-locations/create` | Create pickup location |
| `/admin/requests` | Customer requests |

## API Routes

### CMS Entities
| Route | Methods | Auth | Description |
|---|---|---|---|
| `/api/ingredients` | GET, POST | POST | Ingredients CRUD |
| `/api/ingredients/[id]` | GET, PUT, DELETE | PUT/DEL | |
| `/api/ingredients/[id]/usage` | GET | No | Ingredient usage check |
| `/api/ingredients/seed` | POST | Yes | Seed ingredients |
| `/api/ingredients/seed/upload` | POST | Yes | Upload seed data |
| `/api/ingredients/seed/download` | GET | Yes | Download seed data |
| `/api/journal` | GET, POST | POST | Journal CRUD |
| `/api/journal/[id]` | GET, PUT, DELETE | PUT/DEL | |
| `/api/recipes` | GET, POST | POST | Recipes CRUD |
| `/api/recipes/[id]` | GET, PUT, DELETE | PUT/DEL | |
| `/api/faqs` | GET, POST | POST | FAQ CRUD |
| `/api/faqs/[id]` | PUT, DELETE | Yes | |
| `/api/faqs/topics` | GET | No | FAQ topics list |
| `/api/pages` | GET | No | Pages list |
| `/api/pages/[pageName]` | GET, PUT, DELETE | PUT/DEL | Page CRUD by name |
| `/api/launches` | GET, POST | POST | Launch events |
| `/api/launches/[id]` | GET, PUT, DELETE | PUT/DEL | |
| `/api/launches/[id]/duplicate` | POST | Yes | Duplicate launch |
| `/api/launches/[id]/products` | GET, POST | POST | Launch products |
| `/api/launches/[id]/products/[pid]` | DELETE | Yes | Remove from launch |
| `/api/launches/[id]/products/reorder` | PUT | Yes | Reorder launch products |

### Products & Commerce
| Route | Methods | Auth | Description |
|---|---|---|---|
| `/api/products` | GET, POST | POST | Products CRUD |
| `/api/products/[id]` | GET, PUT, DELETE | PUT/DEL | |
| `/api/products/[id]/sync` | POST | Yes | Sync product from Shopify |
| `/api/products/[id]/sync-shopify-status` | POST | Yes | Sync Shopify status |
| `/api/products/[id]/create-shopify-product` | POST | Yes | Create in Shopify |
| `/api/products/import-from-shopify` | POST | Yes | Import from Shopify |
| `/api/products/linked-shopify-ids` | GET | No | Already-linked IDs |
| `/api/cake-products` | GET, POST | POST | Cake products CRUD |
| `/api/cake-products/[id]` | GET, PUT, DELETE | PUT/DEL | |
| `/api/cake-products/[id]/sync-from-shopify` | POST | Yes | Sync cake from Shopify |
| `/api/cake-products/import-from-shopify` | POST | Yes | Import cake from Shopify |
| `/api/cake-capacity` | GET | No | Cake production capacity |
| `/api/volume-products` | GET, POST | POST | Volume products CRUD |
| `/api/volume-products/[id]` | GET, PUT, DELETE | PUT/DEL | |
| `/api/volume-products/import-from-shopify` | POST | Yes | Import volume from Shopify |

### Storefront APIs (Public)
| Route | Methods | Description |
|---|---|---|
| `/api/storefront/cake-products` | GET | Cake products + pricing grids |
| `/api/storefront/volume-products` | GET | Volume products for storefront |
| `/api/storefront/pickup-config` | GET | Pickup locations + config |

### Checkout
| Route | Methods | Auth | Description |
|---|---|---|---|
| `/api/checkout` | POST | No | Regular order checkout |
| `/api/checkout/cake` | POST | No | Cake order checkout |
| `/api/checkout/volume` | POST | No | Volume order checkout |
| `/api/checkout/validate-catering` | POST | No | Validate catering order |

### Orders
| Route | Methods | Auth | Description |
|---|---|---|---|
| `/api/orders` | GET | Yes | All orders |
| `/api/orders/[id]` | GET, PUT, DELETE | Yes | Order detail |
| `/api/orders/by-date` | GET | Yes | Orders by date |
| `/api/orders/by-launch/[launchId]` | GET | Yes | Orders by launch |
| `/api/orders/upcoming` | GET | Yes | Upcoming orders |
| `/api/orders/prep` | GET | Yes | Prep data |
| `/api/orders/sync` | POST | Yes | Sync orders from Shopify |

### Shopify Integration
| Route | Methods | Auth | Description |
|---|---|---|---|
| `/api/shopify/products` | GET | Yes | List Shopify products |
| `/api/shopify/products/prices` | GET | Yes | Product prices |
| `/api/shopify/products/verify` | GET | Yes | Verify product exists |
| `/api/shopify/products/create-tax-option` | POST | Yes | Create tax option |
| `/api/shopify/products/[id]/variants` | GET | Yes | Product variants |
| `/api/shopify/inventory` | GET | Yes | Inventory levels |
| `/api/shopify/sync` | POST | Yes | Full Shopify sync |
| `/api/shopify/verify-token` | GET | Yes | Verify API token |
| `/api/shopify/webhooks/products-update` | POST | No* | Webhook receiver |
| `/api/shopify/webhooks/orders-paid` | POST | No* | Webhook receiver |

*Webhooks use Shopify HMAC verification, not session auth.

### Settings & Admin
| Route | Methods | Auth | Description |
|---|---|---|---|
| `/api/settings` | GET, PUT | PUT | Global settings |
| `/api/settings/taxonomies` | GET | No | All taxonomies |
| `/api/settings/taxonomies/[category]` | GET, POST | POST | Taxonomy by category |
| `/api/settings/taxonomies/[category]/[id]` | PUT, DELETE | Yes | Taxonomy item |
| `/api/settings/email-templates/[key]` | GET, PUT | PUT | Email templates |
| `/api/admin/product-categories` | GET | Yes | Product categories |
| `/api/admin/tax-settings` | GET, PUT | PUT | Tax settings |
| `/api/pickup-locations` | GET, POST | POST | Pickup locations |
| `/api/pickup-locations/[id]` | GET, PUT, DELETE | PUT/DEL | |
| `/api/pickup-locations/reorder` | PUT | Yes | Reorder locations |
| `/api/requests` | GET, POST | POST | Customer requests |
| `/api/requests/[id]` | PUT, DELETE | Yes | |
| `/api/users` | GET, POST | Yes | User management |
| `/api/users/[id]` | GET, PUT, DELETE | Yes | |

### Utilities
| Route | Methods | Auth | Description |
|---|---|---|---|
| `/api/upload` | POST | Yes | Image upload |
| `/api/ai/translate` | POST | Yes | AI translation |
| `/api/ai/autofill-ingredient` | POST | Yes | AI ingredient autofill |
