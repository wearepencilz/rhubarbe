# Catering Admin — Production Timeline Spec

**Location:** `/admin/volume-products/orders` — embedded above the order table
**Component:** `CateringProductionTimeline`
**Data source:** `GET /api/orders?orderType=volume` filtered to non-cancelled, non-fulfilled orders

---

## Overview

Catering has no production window concept — there is no lead time that creates a multi-day prep window the way cake orders do. A catering order has a single fulfillment date. The timeline is therefore a **fulfilment load chart**: it shows how many orders are due on each day, grouped by catering type, so the team can see at a glance where volume is heavy and where it's clear.

This is deliberately simpler than the cake Gantt. No horizontal bars. No overlap logic. The question it answers is: *what's due when, and how much of it?*

---

## Layout

**X axis:** Days, displayed month-by-month. Navigation: previous month / today / next month. ±7 day overflow padding on each side so orders near month boundaries are visible.

**Y axis:** Not a traditional axis — each day column contains stacked type indicators (see below).

**Each day column:**
- Date label at top
- Stacked count badges per catering type, shown only if that type has orders on that day
- Total order count at bottom of column

**Badge colours by type:**

| Type | Colour |
|---|---|
| Brunch | Teal |
| Lunch | Blue |
| Dînatoire | Purple |

If a day has only one type, one badge. If all three, three stacked badges. Empty days show nothing — no placeholder.

**Hover tooltip** on each day column:
- Date
- Per-type breakdown: `Brunch: 2 orders · 48 portions`, `Lunch: 1 order · 20 people`
- Total order count

Clicking a day column filters the order table below to show only orders with that fulfillment date.

---

## Heavy Day Indicator

Unlike cakes, catering has no hard capacity cap. But the team still needs to spot overloaded days. A simple threshold system flags heavy days without blocking them.

**Logic:**

```
lightThreshold = 2 orders
heavyThreshold = 4 orders
```

Both thresholds are configurable in the component props — not in admin settings. Start with these defaults and adjust once there's live data.

| Load | Indicator |
|---|---|
| 1–2 orders | No indicator |
| 3 orders | Amber dot on day column header |
| 4+ orders | Red dot on day column header |

This is informational only. No dates are blocked on the storefront as a result.

---

## Data Requirements

What the timeline needs from each order record:

| Field | Used for |
|---|---|
| `fulfillmentDate` | Placing the order in the correct day column |
| `cateringType` | Badge colour and per-type count in tooltip |
| `status` | Filter — exclude cancelled and fulfilled |
| `id` | Click-through to order detail |
| Total quantity | Tooltip portion/people count per type |

Total quantity is derived from order line items — sum of all variant quantities per order.

**API call:** `GET /api/orders?orderType=volume&status=active` where `active` means non-cancelled and non-fulfilled. If no such filter param exists on the endpoint, filter client-side from the full orders response.

---

## Differences from Cake Timeline

| Concern | Cake | Catering |
|---|---|---|
| Row model | One row per order (horizontal bar) | One column per day (stacked badges) |
| X axis meaning | Production window duration | Fulfilment date only |
| Capacity bar | Hard cap with colour thresholds | Soft threshold indicator only |
| Hover content | Order #, customer, guests, event, prep window | Date, per-type order count and portions |
| Click action | Navigate to order detail | Filter order table to that date |
| Blocking | Blocks storefront dates at capacity | No blocking — informational only |

---

## Navigation

**Previous / Today / Next** buttons navigate month-by-month, same pattern as the cake timeline. "Today" always snaps back to the current month with today highlighted.

Today's column gets a subtle highlight — border or background tint — to orient the user quickly.

---

## Empty State

If there are no upcoming catering orders, the timeline area shows:

> "No upcoming orders."

No chart is rendered. The order table below still renders with its full empty state.

---

## Print Behaviour

The timeline is hidden in print styles. It is a planning tool for screen use only. The prep sheet is the print-ready equivalent.

---

## Open Questions

- Should the click-to-filter behaviour update the URL (e.g. `?date=2026-05-10`) so the filtered state is shareable/bookmarkable?
- Should fulfilled orders from today still appear in the timeline, or only truly upcoming (future) dates?
- Are the `lightThreshold` / `heavyThreshold` values right for Rhubarbe's typical volume, or should they start lower?

---

*v1 · April 2026 · Source: catering-admin.md, ordering-cake-admin.md*
