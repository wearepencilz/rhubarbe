# Cake Ordering — Testing

## Test Infrastructure

| File | Purpose |
|---|---|
| `lib/utils/cake-rules.ts` | Pure logic module — no DB, no side effects |
| `lib/utils/cake-rules.test.ts` | 41 spec-driven tests |
| `lib/utils/order-helpers.ts` | Shared helpers (pricing grid, tier lookup) |
| `lib/utils/order-helpers.test.ts` | Tests for shared helpers |

### Running

```bash
# Cake rules only
npx vitest run lib/utils/cake-rules.test.ts

# Cake rules + shared helpers
npx vitest run lib/utils/cake-rules.test.ts lib/utils/order-helpers.test.ts

# All tests
npm test
```

### Test Framework

- **Vitest** 4.x with `globals: true`
- Config: `vitest.config.ts`
- Setup: `tests/setup.ts` (copies fixture data)
- Test timeout: 5s per test, 10s per hook
- Bail after 3 consecutive failures

### Excluded from Build

Test files (`*.test.ts`, `*.test.tsx`, `tests/`) are excluded from:
- `tsconfig.json` (TypeScript compilation)
- `.eslintrc.json` (linting)
- Vercel build (`next build`)

## Spec Test Cases (§7.7)

All 15 required test cases from the spec are implemented:

| # | Scenario | Test Location |
|---|---|---|
| T1 | Date within lead time → unavailable | `Date Rules` → "T1: date within lead time" |
| T2 | Date beyond max advance → unavailable | `Date Rules` → "T2: date beyond max advance" |
| T3 | Sunday → unavailable | `Date Rules` → "T3: Sunday is unavailable" |
| T4 | 7 orders in production → blocked | `Production Capacity` → "T4: 7 orders" |
| T5 | 6 orders → available | `Production Capacity` → "T5: 6 orders" |
| T6 | endDate 5d away, lead 7d → hidden | `Flavour Filtering` → "T6" |
| T7 | endDate 10d away, lead 7d → shown | `Flavour Filtering` → "T7" |
| T8 | endDate yesterday → hidden | `Flavour Filtering` → "T8" |
| T9 | No size, filter shortest lead | `Flavour Filtering` → "T9" |
| T10 | Size upgrade clears flavour | `Flavour Filtering` → "T10" |
| T11 | Delivery-only size | `Lead Time Resolution` → "T11" |
| T12 | Wedding + sheet = 1 slot | `Production Capacity` → "T12" |
| T13 | Tasting at max capacity → blocked | `Production Capacity` → "T13" |
| T14 | Server-side capacity re-check | `End-to-End` → "T14" |
| T15 | Legacy, no flavour | `Lead Time Resolution` → "T15" |

## Additional Test Coverage

Beyond the 15 spec cases, the test file covers:

- **Lead time**: empty tiers, shortest lead time helper
- **Date rules**: boundary dates (earliest/latest exact match), blocked dates, valid weekday
- **Capacity**: non-overlapping windows, partial overlap, fallback lead time
- **Flavours**: inactive filtering, no endDate (always shown)
- **Allergens**: union logic, multi-select, empty product allergens
- **Size resolution**: exact match, round-down, below minimum, above maximum
- **Pricing grid**: exact match, missing combination returns null, `findMissingGridCells`
- **End-to-end**: valid order flow, croquembouche guest→choux conversion

## When to Update Tests

| Change | Action |
|---|---|
| New product type | Add size/pricing/lead time tests for the new type |
| New date rule | Add to `isDateAvailable` and create a test case |
| Changed capacity logic | Update `countConflicts` tests |
| New flavour filtering rule | Add to `filterAvailableFlavours` tests |
| Changed allergen logic | Update `consolidateAllergens` tests |
| New add-on behavior | Add end-to-end scenario |
| Changed checkout validation | Verify server-side re-check test still applies |

## Pure Logic Pattern

All testable cake logic lives in `cake-rules.ts` as pure functions:
- No database imports
- No API calls
- No React/Next.js dependencies
- Deterministic: same inputs → same outputs
- `today` is always passed as a parameter (no `new Date()` inside)

This makes tests fast (~5ms for 41 tests) and reliable.
