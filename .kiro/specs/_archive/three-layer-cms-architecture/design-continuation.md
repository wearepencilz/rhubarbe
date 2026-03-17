## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Entity Round-Trip Persistence (Formats)

*For any* valid format with all required fields (name, slug, category, description, requiresFlavours, minFlavours, maxFlavours, allowMixedTypes, canIncludeAddOns, defaultSizes, servingStyle, menuSection), creating the format should result in a stored record that can be retrieved with all fields intact and equal to the original values.

**Validates: Requirements US-1.1, US-1.2, US-1.3, US-1.4, US-1.5, US-1.6, US-1.7**

### Property 2: Entity Round-Trip Persistence (Flavours)

*For any* valid flavour with all required fields, creating the flavour should result in a stored record that can be retrieved with all fields intact and equal to the original values, including format eligibility flags.

**Validates: Requirements US-2.1, US-2.2, US-2.3, US-2.4, US-2.5, US-2.6, US-2.7, US-2.8, US-2.9**

### Property 3: Entity Round-Trip Persistence (Offerings)

*For any* valid offering with all required fields, creating the offering should result in a stored record that can be retrieved with all fields intact and equal to the original values.

**Validates: Requirements US-3.1, US-3.2, US-3.5, US-3.6, US-3.7, US-3.8, US-3.9, US-3.10, US-3.11, US-3.12, US-3.13, US-3.14**

### Property 4: Entity Round-Trip Persistence (Bundles)

*For any* valid bundle with all required fields, creating the bundle should result in a stored record that can be retrieved with all fields intact and equal to the original values.

**Validates: Requirements US-7.1, US-7.2, US-7.3, US-7.4, US-7.5, US-7.6, US-7.7**

### Property 5: Entity Round-Trip Persistence (Components)

*For any* valid component with all required fields, creating the component should result in a stored record that can be retrieved with all fields intact and equal to the original values.

**Validates: Requirements US-6.5**

### Property 6: Entity Round-Trip Persistence (Collections)

*For any* valid seasonal collection with all required fields, creating the collection should result in a stored record that can be retrieved with all fields intact and equal to the original values.

**Validates: Requirements US-8.1, US-8.2, US-8.3, US-8.4, US-8.5**

### Property 7: Format Constraint Enforcement

*For any* format with specified min/max flavour requirements, creating an offering with that format should succeed only if the number of primary flavours is within the format's min/max range, and should fail with a validation error otherwise.

**Validates: Requirements US-3.3, US-4.1, US-10.1, US-10.2, FR-3**

### Property 8: Twist Format Validation

*For any* offering using a twist format, the offering should be valid only if it has exactly 2 primary flavours and both flavours have `canBeUsedInTwist: true`, and should fail validation otherwise.

**Validates: Requirements US-4.1, US-4.2, US-4.5, US-10.1**

### Property 9: Pint Format Validation

*For any* offering using a pint format, the offering should be valid only if all selected flavours have `canBeSoldAsPint: true`, and should fail validation otherwise.

**Validates: Requirements US-5.1**

### Property 10: Sandwich Format Validation

*For any* offering using a sandwich format, the offering should be valid only if it includes at least one component from the Components collection and all flavours have `canBeUsedInSandwich: true`, and should fail validation otherwise.

**Validates: Requirements US-6.1, US-6.2, US-10.3**

### Property 11: Flavour Reusability

*For any* flavour, the same flavour ID should be able to appear in multiple offerings without creating duplicate flavour entities, and editing the flavour should not create a new entity.

**Validates: Requirements US-4.6, US-4.7, FR-2, FR-4**

### Property 12: Flavour Usage Tracking

*For any* flavour, querying its usage should return all offerings that reference that flavour ID in either primaryFlavourIds or secondaryFlavourIds arrays.

**Validates: Requirements US-9.1, US-9.3**

### Property 13: Format Usage Aggregation

*For any* flavour with multiple offerings, calculating format breakdown should correctly count offerings grouped by format name.

**Validates: Requirements US-9.2**

### Property 14: Referential Integrity Protection

*For any* flavour that is referenced by one or more active offerings, attempting to delete the flavour should fail with a warning message listing the offerings using it.

**Validates: Requirements US-9.4, NFR-2**

### Property 15: Archived Flavour Deletion Warning

*For any* flavour that is referenced only by archived offerings, attempting to delete the flavour should succeed but display a warning about historical usage.

**Validates: Requirements US-9.5, NFR-2**

### Property 16: Format Deletion Protection

*For any* format that is referenced by one or more offerings, attempting to delete the format should fail with an error message.

**Validates: Requirements NFR-2**

### Property 17: Component Deletion Protection

*For any* component that is referenced by one or more offerings or bundles, attempting to delete the component should fail with an error message.

**Validates: Requirements NFR-2**

### Property 18: Unique Name Constraints

*For any* entity type (Format, Flavour, Offering, Bundle, Component, Collection), attempting to create a new entity with a name that already exists should fail with a validation error indicating the duplicate name.

**Validates: Requirements US-1.1, US-2.1, US-7.1, US-8.1**

### Property 19: Unique Slug Constraints

*For any* entity type with a slug field, attempting to create a new entity with a slug that already exists should fail with a validation error indicating the duplicate slug.

**Validates: Requirements US-1.1, US-2.1, US-3.1, US-7.1, US-8.1**

### Property 20: Price Comparison Validation

*For any* offering with both price and compareAtPrice fields, the compareAtPrice value should be greater than the price value, and validation should fail if compareAtPrice ≤ price.

**Validates: Requirements US-3.7**

### Property 21: Date Range Validation

*For any* entity with availabilityStart and availabilityEnd dates, if both are provided, availabilityEnd should be after availabilityStart, and validation should fail otherwise.

**Validates: Requirements US-3.8, US-7.5, US-8.4**

### Property 22: Inventory Auto-Status Update

*For any* offering with inventoryTracked: true, when inventoryQuantity reaches 0, the status should automatically update to 'sold-out'.

**Validates: Requirements FR-5**

### Property 23: Inventory Field Requirement

*For any* offering with inventoryTracked: true, the inventoryQuantity field should be required and validation should fail if it's missing or null.

**Validates: Requirements US-5.3, FR-5**

### Property 24: Bundle Choice Rule Validation

*For any* bundle with choice rules, each choice rule's minChoices should be less than or equal to maxChoices, and validation should fail otherwise.

**Validates: Requirements US-7.3, FR-6**

### Property 25: Bundle Item Reference Validation

*For any* bundle, all IDs in includedItems should reference existing offerings or components, and validation should fail if any reference is invalid.

**Validates: Requirements US-7.2**

### Property 26: Collection Offering Reference Validation

*For any* seasonal collection, all IDs in offeringIds should reference existing offerings, and validation should fail if any reference is invalid.

**Validates: Requirements US-8.3, FR-7**

### Property 27: Many-to-Many Collection Relationships

*For any* offering, the same offering ID should be able to appear in multiple seasonal collections without duplication.

**Validates: Requirements FR-7**

### Property 28: Format Constraint Bounds Validation

*For any* format, minFlavours should be less than or equal to maxFlavours, and if requiresFlavours is true, maxFlavours should be greater than 0, and validation should fail otherwise.

**Validates: Requirements US-1.2**

### Property 29: Twist Eligibility Filtering

*For any* query for twist-eligible flavours, all returned flavours should have canBeUsedInTwist: true, and no flavours with canBeUsedInTwist: false should be returned.

**Validates: Requirements US-4.2**

### Property 30: Offering Status Workflow

*For any* offering, status transitions should follow the valid workflow (draft → scheduled → active → sold-out → archived), and invalid transitions should be prevented.

**Validates: Requirements US-3.9, US-10.6**



## Error Handling

### Error Categories

#### 1. Validation Errors

**Scenarios:**
- Invalid entity data (missing required fields, invalid enum values)
- Duplicate names or slugs
- Format constraint violations (wrong flavour count)
- Invalid references (non-existent format/flavour/component IDs)
- Date range errors (end before start)
- Price validation errors (compareAtPrice ≤ price)

**Handling Strategy:**
- Return 400 Bad Request with detailed field-level errors
- Include constraint information in error response
- Log validation failures for monitoring
- Display user-friendly error messages in admin UI
- Highlight invalid fields in forms

**Example Response:**
```typescript
{
  error: 'Validation failed',
  code: 'VALIDATION_ERROR',
  details: [
    {
      field: 'primaryFlavourIds',
      message: 'Twist format requires exactly 2 flavours',
      constraint: 'minFlavours: 2, maxFlavours: 2'
    },
    {
      field: 'primaryFlavourIds[0]',
      message: 'Flavour "Olive Oil" is not eligible for twist combinations',
      constraint: 'canBeUsedInTwist: false'
    }
  ],
  timestamp: '2024-01-15T10:30:00Z'
}
```

#### 2. Referential Integrity Errors

**Scenarios:**
- Attempting to delete format used in offerings
- Attempting to delete flavour used in active offerings
- Attempting to delete component used in offerings/bundles
- Invalid foreign key references in offering creation

**Handling Strategy:**
- Return 409 Conflict for deletion attempts
- Include list of dependent entities in response
- Provide "force delete" option for admin (archives dependents)
- Show warning dialogs in UI before deletion
- Log all deletion attempts

**Example Response:**
```typescript
{
  error: 'Cannot delete flavour',
  code: 'REFERENTIAL_INTEGRITY_ERROR',
  message: 'This flavour is used in 5 active offerings',
  details: {
    flavourId: 'uuid-123',
    flavourName: 'Pistachio',
    usedInOfferings: [
      { id: 'uuid-456', name: 'Pistachio Soft Serve', status: 'active' },
      { id: 'uuid-789', name: 'Pistachio Pint', status: 'active' },
      // ... more offerings
    ]
  },
  timestamp: '2024-01-15T10:30:00Z'
}
```

#### 3. Database Errors

**Scenarios:**
- Connection failures (Redis/KV unavailable)
- Write failures
- Concurrent modification conflicts
- Data corruption
- Storage quota exceeded

**Handling Strategy:**
- Fallback to file system in development
- Return 503 Service Unavailable for connection failures
- Implement optimistic locking for concurrent updates
- Log all database errors with stack traces
- Display maintenance message to users
- Retry logic for transient failures

**Fallback Pattern:**
```typescript
async function saveOffering(offering: Offering): Promise<Offering> {
  try {
    // Try primary storage (Redis/KV)
    const offerings = await db.read('offerings.json') || [];
    offerings.push(offering);
    await db.write('offerings.json', offerings);
    return offering;
  } catch (error) {
    console.error('Primary storage failed:', error);
    
    // Fallback to file system in development
    if (process.env.NODE_ENV === 'development') {
      console.warn('Falling back to file system storage');
      const fs = await import('fs/promises');
      const path = await import('path');
      const filePath = path.join(process.cwd(), 'public/data/offerings.json');
      const data = JSON.parse(await fs.readFile(filePath, 'utf-8'));
      data.push(offering);
      await fs.writeFile(filePath, JSON.stringify(data, null, 2));
      return offering;
    }
    
    // In production, fail fast
    throw new Error('Database unavailable');
  }
}
```

#### 4. Shopify Integration Errors

**Scenarios:**
- Product not found in Shopify
- Sync failures (network, API errors)
- Rate limiting
- Authentication failures
- Metafield update failures

**Handling Strategy:**
- Reuse existing sync queue and retry logic from Shopify-CMS integration
- Update offering syncStatus field to track sync state
- Log all Shopify API errors
- Provide manual resync option in admin UI
- Display sync status indicators

**Integration with Existing System:**
```typescript
// Reuse existing sync infrastructure
import { enqueueSyncJob } from '@/lib/sync/queue';

async function syncOfferingToShopify(offeringId: string): Promise<void> {
  const offering = await getOffering(offeringId);
  
  if (!offering.shopifyProductId) {
    throw new Error('No Shopify product linked');
  }
  
  // Enqueue sync job (reuses existing queue system)
  await enqueueSyncJob({
    type: 'offering',
    entityId: offeringId,
    productId: offering.shopifyProductId,
    action: 'update'
  });
}
```

#### 5. Image Upload Errors

**Scenarios:**
- File too large
- Invalid file type
- Upload quota exceeded
- Storage service unavailable

**Handling Strategy:**
- Validate file size and type before upload
- Return 413 Payload Too Large for oversized files
- Return 415 Unsupported Media Type for invalid types
- Provide clear error messages with size/type limits
- Show upload progress in UI

**Validation:**
```typescript
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

function validateImageUpload(file: File): ValidationResult {
  const errors: ValidationError[] = [];
  
  if (file.size > MAX_FILE_SIZE) {
    errors.push({
      field: 'file',
      message: `File size must be less than ${MAX_FILE_SIZE / 1024 / 1024}MB`,
      constraint: `maxSize: ${MAX_FILE_SIZE}`
    });
  }
  
  if (!ALLOWED_TYPES.includes(file.type)) {
    errors.push({
      field: 'file',
      message: 'Invalid file type. Allowed: JPEG, PNG, WebP, GIF',
      constraint: `allowedTypes: ${ALLOWED_TYPES.join(', ')}`
    });
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}
```

### Error Logging

All errors should be logged with:
- Timestamp
- Error type and code
- User ID (if authenticated)
- Request ID for tracing
- Stack trace (for server errors)
- Context data (entity IDs, operation type)

```typescript
interface ErrorLog {
  timestamp: string;
  level: 'error' | 'warn' | 'info';
  code: string;
  message: string;
  userId?: string;
  requestId: string;
  context: Record<string, any>;
  stack?: string;
}

function logError(error: Error, context: Record<string, any>): void {
  const log: ErrorLog = {
    timestamp: new Date().toISOString(),
    level: 'error',
    code: error.name,
    message: error.message,
    requestId: context.requestId || generateRequestId(),
    context,
    stack: error.stack
  };
  
  console.error(JSON.stringify(log));
  
  // In production, send to monitoring service
  if (process.env.NODE_ENV === 'production') {
    // sendToMonitoring(log);
  }
}
```

## Testing Strategy

### Dual Testing Approach

The testing strategy combines unit tests for specific scenarios and property-based tests for comprehensive coverage:

- **Unit tests**: Verify specific examples, edge cases, and error conditions
- **Property tests**: Verify universal properties across randomized inputs
- Both approaches are complementary and necessary for production readiness

### Unit Testing

**Focus Areas:**
- Specific example scenarios (e.g., creating a pistachio soft serve offering)
- Edge cases (empty strings, null values, boundary conditions)
- Error conditions (invalid references, constraint violations)
- Integration points (Shopify sync, ingredient linking)
- UI component behavior

**Test Organization:**
```
tests/
├── unit/
│   ├── api/
│   │   ├── formats.test.ts
│   │   ├── flavours.test.ts
│   │   ├── offerings.test.ts
│   │   ├── bundles.test.ts
│   │   ├── components.test.ts
│   │   └── collections.test.ts
│   ├── validation/
│   │   ├── format-constraints.test.ts
│   │   ├── twist-validation.test.ts
│   │   ├── referential-integrity.test.ts
│   │   └── date-validation.test.ts
│   └── components/
│       ├── FormatSelector.test.tsx
│       ├── FlavourSelector.test.tsx
│       ├── TwistBuilder.test.tsx
│       └── OfferingForm.test.tsx
```

**Example Unit Test:**
```typescript
// tests/unit/api/offerings.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { createOffering, validateOffering } from '@/app/api/offerings/route';

describe('Offering API', () => {
  describe('Twist Validation', () => {
    it('should reject twist with only 1 flavour', async () => {
      const offering = {
        formatId: 'twist-format-id',
        primaryFlavourIds: ['pistachio-id'],
        // ... other fields
      };
      
      const result = await validateOffering(offering);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'primaryFlavourIds',
        message: 'Twist format requires exactly 2 flavours'
      });
    });
    
    it('should reject twist with non-eligible flavour', async () => {
      const offering = {
        formatId: 'twist-format-id',
        primaryFlavourIds: ['pistachio-id', 'olive-oil-id'], // olive oil not twist-eligible
        // ... other fields
      };
      
      const result = await validateOffering(offering);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: expect.stringContaining('primaryFlavourIds'),
          message: expect.stringContaining('not eligible for twist')
        })
      );
    });
    
    it('should accept valid twist with 2 eligible flavours', async () => {
      const offering = {
        formatId: 'twist-format-id',
        primaryFlavourIds: ['pistachio-id', 'blood-orange-id'],
        // ... other fields
      };
      
      const result = await validateOffering(offering);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });
});
```

### Property-Based Testing

**Library:** Use `fast-check` for TypeScript/JavaScript property-based testing

**Configuration:**
- Minimum 100 iterations per property test
- Each test tagged with feature name and property number
- Generators for all entity types
- Custom arbitraries for domain-specific constraints

**Test Organization:**
```
tests/
├── properties/
│   ├── formats.properties.test.ts
│   ├── flavours.properties.test.ts
│   ├── offerings.properties.test.ts
│   ├── bundles.properties.test.ts
│   ├── components.properties.test.ts
│   ├── collections.properties.test.ts
│   └── generators/
│       ├── format.generator.ts
│       ├── flavour.generator.ts
│       ├── offering.generator.ts
│       └── shared.generator.ts
```

**Example Property Test:**
```typescript
// tests/properties/offerings.properties.test.ts
import { describe, it } from 'vitest';
import * as fc from 'fast-check';
import { createOffering, getOffering } from '@/app/api/offerings/route';
import { offeringGenerator } from './generators/offering.generator';

describe('Offering Properties', () => {
  /**
   * Feature: three-layer-cms-architecture
   * Property 3: Entity Round-Trip Persistence (Offerings)
   * 
   * For any valid offering with all required fields, creating the offering
   * should result in a stored record that can be retrieved with all fields
   * intact and equal to the original values.
   */
  it('Property 3: Offering round-trip persistence', async () => {
    await fc.assert(
      fc.asyncProperty(
        offeringGenerator(),
        async (offering) => {
          // Create offering
          const created = await createOffering(offering);
          
          // Retrieve offering
          const retrieved = await getOffering(created.id);
          
          // Verify all fields match
          expect(retrieved).toEqual(created);
          expect(retrieved.internalName).toBe(offering.internalName);
          expect(retrieved.publicName).toBe(offering.publicName);
          expect(retrieved.formatId).toBe(offering.formatId);
          expect(retrieved.primaryFlavourIds).toEqual(offering.primaryFlavourIds);
          expect(retrieved.price).toBe(offering.price);
          // ... verify all other fields
        }
      ),
      { numRuns: 100 }
    );
  });
  
  /**
   * Feature: three-layer-cms-architecture
   * Property 7: Format Constraint Enforcement
   * 
   * For any format with specified min/max flavour requirements, creating an
   * offering with that format should succeed only if the number of primary
   * flavours is within the format's min/max range.
   */
  it('Property 7: Format constraint enforcement', async () => {
    await fc.assert(
      fc.asyncProperty(
        formatGenerator(),
        fc.array(fc.uuid(), { minLength: 0, maxLength: 10 }),
        async (format, flavourIds) => {
          const offering = {
            formatId: format.id,
            primaryFlavourIds: flavourIds,
            // ... other required fields
          };
          
          const result = await validateOffering(offering);
          
          const flavourCount = flavourIds.length;
          const withinRange = flavourCount >= format.minFlavours && 
                             flavourCount <= format.maxFlavours;
          
          // Validation should pass iff flavour count is within range
          expect(result.valid).toBe(withinRange);
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

**Custom Generators:**
```typescript
// tests/properties/generators/offering.generator.ts
import * as fc from 'fast-check';
import { Offering, OfferingStatus } from '@/types';

export function offeringGenerator(): fc.Arbitrary<Offering> {
  return fc.record({
    id: fc.uuid(),
    internalName: fc.string({ minLength: 1, maxLength: 100 }),
    publicName: fc.string({ minLength: 1, maxLength: 100 }),
    slug: fc.string({ minLength: 1, maxLength: 100 }).map(s => 
      s.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    ),
    status: fc.constantFrom<OfferingStatus>(
      'draft', 'scheduled', 'active', 'sold-out', 'archived'
    ),
    formatId: fc.uuid(),
    primaryFlavourIds: fc.array(fc.uuid(), { minLength: 1, maxLength: 3 }),
    description: fc.string({ minLength: 10, maxLength: 500 }),
    shortCardCopy: fc.string({ minLength: 10, maxLength: 150 }),
    price: fc.integer({ min: 100, max: 10000 }), // cents
    tags: fc.array(
      fc.constantFrom('seasonal', 'weekly', 'featured', 'limited', 'collab'),
      { maxLength: 5 }
    ),
    inventoryTracked: fc.boolean(),
    onlineOrderable: fc.boolean(),
    pickupOnly: fc.boolean(),
    createdAt: fc.date().map(d => d.toISOString()),
    updatedAt: fc.date().map(d => d.toISOString())
  });
}

export function twistOfferingGenerator(): fc.Arbitrary<Offering> {
  return offeringGenerator().chain(offering => 
    fc.record({
      ...offering,
      formatId: fc.constant('twist-format-id'),
      primaryFlavourIds: fc.array(fc.uuid(), { minLength: 2, maxLength: 2 })
    })
  );
}
```

### Integration Testing

**Focus Areas:**
- API endpoint workflows (create → read → update → delete)
- Shopify sync integration
- Ingredient relationship preservation
- Multi-step offering creation
- Bundle choice validation

**Example Integration Test:**
```typescript
// tests/integration/offering-workflow.test.ts
import { describe, it, expect, beforeEach } from 'vitest';

describe('Offering Creation Workflow', () => {
  it('should create twist offering with full workflow', async () => {
    // 1. Create format
    const format = await createFormat({
      name: 'Twist',
      slug: 'twist',
      category: 'frozen',
      requiresFlavours: true,
      minFlavours: 2,
      maxFlavours: 2,
      // ... other fields
    });
    
    // 2. Create two twist-eligible flavours
    const flavour1 = await createFlavour({
      name: 'Pistachio',
      canBeUsedInTwist: true,
      // ... other fields
    });
    
    const flavour2 = await createFlavour({
      name: 'Blood Orange',
      canBeUsedInTwist: true,
      // ... other fields
    });
    
    // 3. Create twist offering
    const offering = await createOffering({
      formatId: format.id,
      primaryFlavourIds: [flavour1.id, flavour2.id],
      internalName: 'Pistachio x Blood Orange Twist',
      publicName: 'Sicilian Twist',
      // ... other fields
    });
    
    // 4. Verify offering was created correctly
    expect(offering.id).toBeDefined();
    expect(offering.formatId).toBe(format.id);
    expect(offering.primaryFlavourIds).toHaveLength(2);
    
    // 5. Verify flavour usage tracking
    const usage1 = await getFlavourUsage(flavour1.id);
    expect(usage1.usedInOfferings).toContainEqual(
      expect.objectContaining({ id: offering.id })
    );
    
    const usage2 = await getFlavourUsage(flavour2.id);
    expect(usage2.usedInOfferings).toContainEqual(
      expect.objectContaining({ id: offering.id })
    );
    
    // 6. Verify cannot delete flavours in use
    await expect(deleteFlavour(flavour1.id)).rejects.toThrow(
      /used in.*offerings/i
    );
  });
});
```

### Test Coverage Goals

- **Unit tests**: 80%+ code coverage
- **Property tests**: All 30 correctness properties implemented
- **Integration tests**: All major workflows covered
- **E2E tests**: Critical admin UI flows (offering creation, twist builder)

### Running Tests

```bash
# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run property tests only
npm run test:properties

# Run integration tests
npm run test:integration

# Run with coverage
npm run test:coverage

# Run specific property test
npm test -- offerings.properties.test.ts
```

