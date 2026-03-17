# Design Document: Format-Based Product Generation

## Overview

This feature transforms product generation from hardcoded type checking to a flexible, taxonomy-driven eligibility system. Currently, the product generation logic in `/api/launches/[id]/generate-products` hardcodes rules like "gelato can be in scoops and twists" and "sorbet can be in scoops and twists but not sandwiches". This design makes these rules explicit and configurable through the CMS.

The core insight is that formats should declare which flavour types they accept, rather than having this logic scattered throughout the codebase. This enables administrators to:

- Configure new format-flavour combinations without code changes
- Understand why certain products are or aren't generated
- Maintain consistency across the product catalog
- Support future flavour types (soft-serve, frozen yogurt, etc.) without refactoring

### Key Design Decisions

1. **Taxonomy-driven eligibility**: Formats reference the `flavourTypes` taxonomy to declare eligible types
2. **Default to permissive**: Formats without eligibility rules accept all flavour types (backward compatible)
3. **Settings-based defaults**: Common patterns stored in `settings.json` for quick configuration
4. **Explicit reporting**: Generation results explain what was created and what was skipped

## Architecture

### Data Model Extensions

#### Format Schema Extension

```typescript
interface Format {
  // ... existing fields ...
  eligibleFlavourTypes?: string[]; // NEW: Array of flavourType taxonomy IDs
}
```

Example format with eligibility:
```json
{
  "id": "format-scoop",
  "name": "Scoop",
  "slug": "scoop",
  "category": "ice-cream",
  "servingStyle": "scoop",
  "requiresFlavours": true,
  "minFlavours": 1,
  "maxFlavours": 1,
  "eligibleFlavourTypes": ["gelato", "sorbet"],
  "status": "active"
}
```

#### Settings Schema Extension

```typescript
interface Settings {
  // ... existing fields ...
  formatEligibilityRules?: {
    [flavourTypeId: string]: string[]; // flavourType -> array of format slugs
  };
}
```

Example settings:
```json
{
  "formatEligibilityRules": {
    "gelato": ["scoop", "take-home", "twist", "sandwich"],
    "sorbet": ["scoop", "take-home", "twist"],
    "soft-serve-base": ["soft-serve"],
    "cookie": ["sandwich"]
  }
}
```

### Component Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Admin UI Layer                          │
├─────────────────────────────────────────────────────────────┤
│  Format Edit Page                                           │
│  - TaxonomyMultiSelect for eligibleFlavourTypes            │
│  - Validation warnings                                      │
│  - Preview of eligible flavours                             │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                     API Layer                               │
├─────────────────────────────────────────────────────────────┤
│  /api/formats/[id]                                          │
│  - Validates eligibleFlavourTypes against taxonomy          │
│  - Persists format configuration                            │
│                                                             │
│  /api/launches/[id]/generate-products                       │
│  - Retrieves formats with eligibility rules                 │
│  - Filters format-flavour combinations                      │
│  - Generates products for eligible combinations             │
│  - Returns detailed generation report                       │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                     Business Logic Layer                    │
├─────────────────────────────────────────────────────────────┤
│  ProductGenerator                                           │
│  - isFormatEligibleForFlavour(format, flavour)             │
│  - generateSingleFlavourProducts(formats, flavours)        │
│  - generateMultiFlavourProducts(formats, flavours)         │
│  - buildGenerationReport(results)                          │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                     Data Layer                              │
├─────────────────────────────────────────────────────────────┤
│  lib/db.ts                                                  │
│  - getFormats(), getFlavours(), getProducts()              │
│  - saveProducts()                                           │
│                                                             │
│  public/data/settings.json                                  │
│  - formatEligibilityRules                                   │
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. Format Eligibility UI Component

**Location**: `app/admin/formats/[id]/page.tsx`

**New Section**: Add after "Flavour Requirements" section

```typescript
{/* Format Eligibility */}
<div className="border-t border-gray-200 pt-6">
  <h3 className="text-lg font-medium text-gray-900 mb-2">
    Format Eligibility
  </h3>
  <p className="text-sm text-gray-600 mb-4">
    Select which flavour types this format accepts. Leave empty to accept all types.
  </p>
  
  <TaxonomyMultiSelect
    category="flavourTypes"
    value={format.eligibleFlavourTypes || []}
    onChange={(values) => setFormat({ 
      ...format, 
      eligibleFlavourTypes: values 
    })}
    label="Eligible Flavour Types"
    placeholder="Select flavour types..."
  />
  
  {format.requiresFlavours && 
   (!format.eligibleFlavourTypes || format.eligibleFlavourTypes.length === 0) && (
    <div className="mt-2 text-sm text-amber-600">
      ⚠️ This format requires flavours but accepts all types. 
      Consider specifying eligible types for better control.
    </div>
  )}
</div>
```

### 2. Product Generation Logic

**Location**: `app/api/launches/[id]/generate-products/route.ts`

**Core Function**: Eligibility checking

```typescript
/**
 * Determines if a format is eligible for a specific flavour
 * based on the format's eligibleFlavourTypes configuration.
 * 
 * @param format - The format to check
 * @param flavour - The flavour to check against
 * @returns true if the flavour is eligible for this format
 */
function isFormatEligibleForFlavour(
  format: Format, 
  flavour: Flavour
): boolean {
  // If no eligibility rules defined, accept all flavours
  if (!format.eligibleFlavourTypes || format.eligibleFlavourTypes.length === 0) {
    return true;
  }
  
  // Check if flavour's type is in the format's eligible types
  return format.eligibleFlavourTypes.includes(flavour.type);
}
```

**Core Function**: Multi-flavour eligibility

```typescript
/**
 * Determines if a format is eligible for a combination of flavours.
 * All flavours must individually be eligible for the format.
 * 
 * @param format - The format to check
 * @param flavours - Array of flavours to check
 * @returns true if all flavours are eligible for this format
 */
function isFormatEligibleForFlavours(
  format: Format,
  flavours: Flavour[]
): boolean {
  // Check if format allows mixed types when flavours have different types
  const uniqueTypes = new Set(flavours.map(f => f.type));
  if (uniqueTypes.size > 1 && !format.allowMixedTypes) {
    return false;
  }
  
  // All flavours must individually be eligible
  return flavours.every(flavour => 
    isFormatEligibleForFlavour(format, flavour)
  );
}
```

### 3. Generation Report Structure

```typescript
interface GenerationReport {
  success: boolean;
  created: number;        // New products created
  skipped: number;        // Combinations skipped due to eligibility
  total: number;          // Total products now associated with launch
  breakdown: {
    byFormat: {
      [formatName: string]: {
        created: number;
        skipped: number;
        flavourTypes: string[];
      };
    };
    byFlavourType: {
      [flavourType: string]: number;
    };
  };
  message: string;        // Human-readable summary
  details?: {
    skippedCombinations: Array<{
      formatName: string;
      flavourName: string;
      reason: string;
    }>;
  };
}
```

## Data Models

### Format Data Model (Extended)

```typescript
interface Format {
  id: string;
  name: string;
  slug: string;
  category: FormatCategory;
  servingStyle: ServingStyle;
  description: string;
  menuSection: string;
  
  // Flavour requirements
  requiresFlavours: boolean;
  minFlavours: number;
  maxFlavours: number;
  allowMixedTypes: boolean;
  
  // NEW: Eligibility rules
  eligibleFlavourTypes?: string[];  // Array of flavourType taxonomy IDs
  
  // Additional options
  canIncludeAddOns: boolean;
  basePrice?: number;
  status: 'active' | 'archived';
  
  createdAt: string;
  updatedAt: string;
}
```

### Settings Data Model (Extended)

```typescript
interface Settings {
  // ... existing fields ...
  
  // NEW: Format eligibility defaults
  formatEligibilityRules?: {
    [flavourTypeId: string]: string[];  // flavourType -> array of format slugs
  };
}
```

### Product Generation Request

```typescript
interface GenerateProductsRequest {
  flavourIds: string[];  // Array of flavour IDs to generate products for
}
```

### Product Generation Response

```typescript
interface GenerateProductsResponse {
  success: boolean;
  created: number;
  skipped: number;
  total: number;
  breakdown: {
    byFormat: Record<string, {
      created: number;
      skipped: number;
      flavourTypes: string[];
    }>;
    byFlavourType: Record<string, number>;
  };
  message: string;
  details?: {
    skippedCombinations: Array<{
      formatName: string;
      flavourName: string;
      reason: string;
    }>;
  };
}
```

## Detailed Examples

### Example 1: Simple Launch with Mixed Types

**Scenario**: Launch with 2 gelato flavours and 1 sorbet flavour

**Formats Configuration**:
```json
[
  {
    "id": "format-scoop",
    "name": "Scoop",
    "slug": "scoop",
    "requiresFlavours": true,
    "minFlavours": 1,
    "maxFlavours": 1,
    "eligibleFlavourTypes": ["gelato", "sorbet"]
  },
  {
    "id": "format-sandwich",
    "name": "Ice Cream Sandwich",
    "slug": "sandwich",
    "requiresFlavours": true,
    "minFlavours": 1,
    "maxFlavours": 1,
    "eligibleFlavourTypes": ["gelato"]
  },
  {
    "id": "format-twist",
    "name": "Twist",
    "slug": "twist",
    "requiresFlavours": true,
    "minFlavours": 2,
    "maxFlavours": 2,
    "allowMixedTypes": true,
    "eligibleFlavourTypes": ["gelato", "sorbet"]
  }
]
```

**Launch Flavours**:
```json
[
  {
    "id": "flavour-vanilla",
    "name": "Vanilla Bean",
    "type": "gelato"
  },
  {
    "id": "flavour-chocolate",
    "name": "Dark Chocolate",
    "type": "gelato"
  },
  {
    "id": "flavour-lemon",
    "name": "Lemon",
    "type": "sorbet"
  }
]
```

**Generation Process**:

1. **Single-flavour products (Scoop format)**:
   - ✅ Vanilla Bean Scoop (gelato eligible for scoop)
   - ✅ Dark Chocolate Scoop (gelato eligible for scoop)
   - ✅ Lemon Scoop (sorbet eligible for scoop)
   - **Result**: 3 products created

2. **Single-flavour products (Sandwich format)**:
   - ✅ Vanilla Bean Sandwich (gelato eligible for sandwich)
   - ✅ Dark Chocolate Sandwich (gelato eligible for sandwich)
   - ❌ Lemon Sandwich (sorbet NOT eligible for sandwich)
   - **Result**: 2 products created, 1 skipped

3. **Multi-flavour products (Twist format)**:
   - ✅ Vanilla Bean + Dark Chocolate Twist (both gelato, both eligible)
   - ✅ Vanilla Bean + Lemon Twist (mixed types allowed, both eligible)
   - ✅ Dark Chocolate + Lemon Twist (mixed types allowed, both eligible)
   - **Result**: 3 products created

**Generation Report**:
```json
{
  "success": true,
  "created": 8,
  "skipped": 1,
  "total": 8,
  "breakdown": {
    "byFormat": {
      "Scoop": {
        "created": 3,
        "skipped": 0,
        "flavourTypes": ["gelato", "sorbet"]
      },
      "Ice Cream Sandwich": {
        "created": 2,
        "skipped": 1,
        "flavourTypes": ["gelato"]
      },
      "Twist": {
        "created": 3,
        "skipped": 0,
        "flavourTypes": ["gelato", "sorbet"]
      }
    },
    "byFlavourType": {
      "gelato": 5,
      "sorbet": 1,
      "mixed": 3
    }
  },
  "message": "Generated 8 products (3 scoop, 2 sandwich, 3 twist). Skipped 1 combination due to eligibility rules.",
  "details": {
    "skippedCombinations": [
      {
        "formatName": "Ice Cream Sandwich",
        "flavourName": "Lemon",
        "reason": "Flavour type 'sorbet' not eligible for this format"
      }
    ]
  }
}
```

### Example 2: Soft-Serve Launch

**Scenario**: Launch with 2 soft-serve base flavours

**Formats Configuration**:
```json
[
  {
    "id": "format-scoop",
    "name": "Scoop",
    "eligibleFlavourTypes": ["gelato", "sorbet"]
  },
  {
    "id": "format-soft-serve",
    "name": "Soft Serve",
    "eligibleFlavourTypes": ["soft-serve-base"]
  },
  {
    "id": "format-sundae",
    "name": "Sundae",
    "eligibleFlavourTypes": ["gelato", "soft-serve-base"]
  }
]
```

**Launch Flavours**:
```json
[
  {
    "id": "flavour-vanilla-ss",
    "name": "Vanilla Soft Serve",
    "type": "soft-serve-base"
  },
  {
    "id": "flavour-chocolate-ss",
    "name": "Chocolate Soft Serve",
    "type": "soft-serve-base"
  }
]
```

**Generation Process**:

1. **Scoop format**:
   - ❌ Vanilla Soft Serve Scoop (soft-serve-base NOT eligible)
   - ❌ Chocolate Soft Serve Scoop (soft-serve-base NOT eligible)
   - **Result**: 0 products created, 2 skipped

2. **Soft Serve format**:
   - ✅ Vanilla Soft Serve (soft-serve-base eligible)
   - ✅ Chocolate Soft Serve (soft-serve-base eligible)
   - **Result**: 2 products created

3. **Sundae format**:
   - ✅ Vanilla Soft Serve Sundae (soft-serve-base eligible)
   - ✅ Chocolate Soft Serve Sundae (soft-serve-base eligible)
   - **Result**: 2 products created

**Generation Report**:
```json
{
  "success": true,
  "created": 4,
  "skipped": 2,
  "total": 4,
  "breakdown": {
    "byFormat": {
      "Scoop": {
        "created": 0,
        "skipped": 2,
        "flavourTypes": []
      },
      "Soft Serve": {
        "created": 2,
        "skipped": 0,
        "flavourTypes": ["soft-serve-base"]
      },
      "Sundae": {
        "created": 2,
        "skipped": 0,
        "flavourTypes": ["soft-serve-base"]
      }
    },
    "byFlavourType": {
      "soft-serve-base": 4
    }
  },
  "message": "Generated 4 products (2 soft serve, 2 sundae). Skipped 2 combinations due to eligibility rules."
}
```

### Example 3: Backward Compatibility

**Scenario**: Existing format without eligibility rules

**Formats Configuration**:
```json
[
  {
    "id": "format-legacy",
    "name": "Legacy Format",
    "requiresFlavours": true,
    "minFlavours": 1,
    "maxFlavours": 1
    // NO eligibleFlavourTypes field
  }
]
```

**Launch Flavours**:
```json
[
  {
    "id": "flavour-vanilla",
    "name": "Vanilla",
    "type": "gelato"
  },
  {
    "id": "flavour-lemon",
    "name": "Lemon",
    "type": "sorbet"
  }
]
```

**Generation Process**:

1. **Legacy format** (no eligibility rules = accepts all):
   - ✅ Vanilla Legacy Format (no restrictions)
   - ✅ Lemon Legacy Format (no restrictions)
   - **Result**: 2 products created

**Generation Report**:
```json
{
  "success": true,
  "created": 2,
  "skipped": 0,
  "total": 2,
  "breakdown": {
    "byFormat": {
      "Legacy Format": {
        "created": 2,
        "skipped": 0,
        "flavourTypes": ["all"]
      }
    },
    "byFlavourType": {
      "gelato": 1,
      "sorbet": 1
    }
  },
  "message": "Generated 2 products using legacy format (accepts all flavour types)."
}
```

### Example 4: Multi-Flavour with Mixed Type Restrictions

**Scenario**: Twist format that doesn't allow mixed types

**Formats Configuration**:
```json
[
  {
    "id": "format-twist-gelato-only",
    "name": "Gelato Twist",
    "requiresFlavours": true,
    "minFlavours": 2,
    "maxFlavours": 2,
    "allowMixedTypes": false,
    "eligibleFlavourTypes": ["gelato"]
  },
  {
    "id": "format-twist-mixed",
    "name": "Mixed Twist",
    "requiresFlavours": true,
    "minFlavours": 2,
    "maxFlavours": 2,
    "allowMixedTypes": true,
    "eligibleFlavourTypes": ["gelato", "sorbet"]
  }
]
```

**Launch Flavours**:
```json
[
  {
    "id": "flavour-vanilla",
    "name": "Vanilla",
    "type": "gelato"
  },
  {
    "id": "flavour-chocolate",
    "name": "Chocolate",
    "type": "gelato"
  },
  {
    "id": "flavour-lemon",
    "name": "Lemon",
    "type": "sorbet"
  }
]
```

**Generation Process**:

1. **Gelato Twist format** (gelato only, no mixed types):
   - ✅ Vanilla + Chocolate Gelato Twist (both gelato)
   - ❌ Vanilla + Lemon Gelato Twist (lemon is sorbet, not eligible)
   - ❌ Chocolate + Lemon Gelato Twist (lemon is sorbet, not eligible)
   - **Result**: 1 product created, 2 skipped

2. **Mixed Twist format** (allows mixed types):
   - ✅ Vanilla + Chocolate Mixed Twist (both gelato, both eligible)
   - ✅ Vanilla + Lemon Mixed Twist (mixed types allowed, both eligible)
   - ✅ Chocolate + Lemon Mixed Twist (mixed types allowed, both eligible)
   - **Result**: 3 products created

**Generation Report**:
```json
{
  "success": true,
  "created": 4,
  "skipped": 2,
  "total": 4,
  "breakdown": {
    "byFormat": {
      "Gelato Twist": {
        "created": 1,
        "skipped": 2,
        "flavourTypes": ["gelato"]
      },
      "Mixed Twist": {
        "created": 3,
        "skipped": 0,
        "flavourTypes": ["gelato", "sorbet"]
      }
    },
    "byFlavourType": {
      "gelato": 2,
      "mixed": 2
    }
  },
  "message": "Generated 4 products (1 gelato twist, 3 mixed twist). Skipped 2 combinations due to eligibility rules.",
  "details": {
    "skippedCombinations": [
      {
        "formatName": "Gelato Twist",
        "flavourName": "Vanilla + Lemon",
        "reason": "Flavour type 'sorbet' not eligible for this format"
      },
      {
        "formatName": "Gelato Twist",
        "flavourName": "Chocolate + Lemon",
        "reason": "Flavour type 'sorbet' not eligible for this format"
      }
    ]
  }
}
```

