---
inclusion: auto
description: System ownership, architecture boundaries, tech stack, and project structure for Janine.
---

# Product Architecture

## What Janine Is

An artisan pastry shop platform combining:
- A Shopify-powered storefront for seasonal commerce
- A headless CMS for the living flavour archive and editorial content
- A Next.js app that presents and connects both systems

Brand philosophy: the archive of flavour experimentation is the real brand asset — not just the commerce layer.

## System Ownership (Source of Truth)

| Concern | Owned By |
|---|---|
| Products, pricing, inventory, checkout | Shopify |
| Flavours, ingredients, batches, stories, launches | CMS (headless) |
| Presentation, routing, UI | Next.js |
| Integration logic, business rules | Next.js API Routes |
| Auth sessions, cache | Vercel KV |
| Media/images | Vercel Blob |

**Never duplicate ownership.** If Shopify owns a product's price, don't store it in the CMS. If the CMS owns a flavour's story, don't store it in Shopify metafields.

## Architecture Boundaries

### What Shopify handles
- Sellable products (ice cream, chocolate, merch, pantry, gift sets)
- Variants, pricing, inventory
- Cart, checkout, payments
- Subscriptions and bundles
- Order fulfillment

### What the CMS handles
- Flavour archive (independent of commerce lifecycle)
- Ingredient library with provenance
- Batch tracking and test kitchen records
- Stories and editorial content
- Launch events and campaigns
- Settings and global config

### What Next.js API Routes handle
- Shopify ↔ CMS relationship mapping (e.g., linking a flavour to a Shopify product)
- Golden Spoon membership logic
- Flavour ratings aggregation
- QR code generation
- Click & Collect scheduling

## Non-Goals / Constraints

- Do not store the editorial flavour archive only in Shopify
- Do not couple CMS entries to Shopify product publish state
- Do not put business logic in UI components
- Do not create duplicate ingredient data across multiple systems
- No custom CSS in the admin — Tailwind only
- Single Next.js app — no separate Express server or separate CMS server

## Tech Stack (Pinned Versions)

- Next.js 14.2 (App Router)
- React 18.3
- TypeScript 5.9
- Tailwind CSS 3.4
- NextAuth (credentials provider)
- Vercel Blob + Vercel KV

## Dev Setup

```bash
npm run dev        # http://localhost:3001
# Storefront: /
# Admin CMS:  /admin/login  (admin / admin123)
```

## Project Structure

```
app/
  admin/           # CMS admin UI (protected)
  api/             # API routes (integration + business logic only)
  collections/     # Shopify collections pages
  products/        # Shopify product pages
lib/
  auth.ts          # NextAuth config
  db.js            # Storage adapter (KV in prod, JSON files in dev)
  shopify/         # Shopify Storefront API client
components/        # Storefront React components
middleware.ts      # Protects /admin/* routes
public/data/       # JSON fallback storage (dev only)
public/uploads/    # Local image storage (dev only)
```
