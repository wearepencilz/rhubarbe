# Preorder Operations — API Reference

## Availability Patterns

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/availability-patterns` | List patterns (filter: `pattern_type`, `active`, `search`) |
| POST | `/api/availability-patterns` | Create pattern |
| GET | `/api/availability-patterns/[id]` | Get pattern detail |
| PATCH | `/api/availability-patterns/[id]` | Update pattern |
| DELETE | `/api/availability-patterns/[id]` | Soft-delete pattern |

## Pickup Locations

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/pickup-locations` | List locations (filter: `active`) |
| POST | `/api/pickup-locations` | Create location |
| GET | `/api/pickup-locations/[id]` | Get location detail |
| PATCH | `/api/pickup-locations/[id]` | Update location |
| DELETE | `/api/pickup-locations/[id]` | Soft-delete location |
| PATCH | `/api/pickup-locations/reorder` | Reorder locations by `sort_order` |

## Slot Templates

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/slot-templates` | List templates (filter: `active`) |
| POST | `/api/slot-templates` | Create template |
| GET | `/api/slot-templates/[id]` | Get template detail |
| PATCH | `/api/slot-templates/[id]` | Update template |
| DELETE | `/api/slot-templates/[id]` | Soft-delete template |

## Menu Weeks

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/menu-weeks` | List menu weeks (filter: `status`, sort: `launch_date`) |
| POST | `/api/menu-weeks` | Create menu week |
| GET | `/api/menu-weeks/[id]` | Get menu week detail |
| PATCH | `/api/menu-weeks/[id]` | Update menu week |
| DELETE | `/api/menu-weeks/[id]` | Soft-delete menu week |
| GET | `/api/menu-weeks/current` | Get active menu week (cached 5min) |

## Availability Windows

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/availability-windows` | List windows (filter: `product_id`, `date_range`) |
| POST | `/api/availability-windows` | Create window |
| GET | `/api/availability-windows/[id]` | Get window detail |
| PATCH | `/api/availability-windows/[id]` | Update window |
| DELETE | `/api/availability-windows/[id]` | Delete window |

## Product Availability

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products/[id]/availability` | Get availability (query: `date`, `location`). Cached 60s. |

## Slot Capacity

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/slots/capacity` | Get slot capacity (query: `date`, `location`). Cached 30s. |
| POST | `/api/slots/reserve` | Reserve slot capacity (body: `date`, `location_id`, `slot_start`, `slot_end`, `quantity`) |
| POST | `/api/slots/release` | Release slot capacity |
| PATCH | `/api/slots/adjust-capacity` | Adjust capacity (staff only, requires `reason`) |

## Orders

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/orders` | List orders (filter: `pickup_date`, `pickup_location`, `status`, `search`) |
| GET | `/api/orders/[id]` | Get order detail |
| PATCH | `/api/orders/[id]` | Update order status (staff only) |
| GET | `/api/orders/prep-sheet` | Generate prep sheet (query: `start_date`, `end_date`, `location`) |
| GET | `/api/orders/pickup-list` | Generate pickup list (query: `date`, `location`) |

## Authentication

All write endpoints require staff authentication. Read endpoints for storefront data are public.
Slot capacity adjustment and order status changes are logged with user ID and timestamp.
