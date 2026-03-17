# Testing & Validation

This project includes automated tests and validation scripts to catch errors before they reach production.

## Quick Start

Before committing large changes, run:

```bash
npm run validate
```

Or use the shell script:

```bash
./scripts/validate.sh
```

## Available Test Commands

### Smoke Tests
Fast tests that verify the app builds and core functionality works:

```bash
npm run test:smoke
```

These tests check:
- All components import without errors
- Core utilities work correctly
- Components render without crashing
- Build completes successfully

### All Tests
Run the full test suite (including existing component tests):

```bash
npm run test        # Watch mode
npm run test:run    # Single run
```

### Validation
Run smoke tests + build verification:

```bash
npm run validate
```

This is the recommended command before:
- Committing large changes
- Creating pull requests
- Deploying to production

## Continuous Integration

The project includes a GitHub Actions workflow (`.github/workflows/ci.yml`) that automatically:
1. Runs smoke tests
2. Builds the project
3. Verifies build artifacts

This runs on every push to `main` or `develop` branches and on all pull requests.

## What Gets Tested

### Smoke Tests (`src/test/smoke.test.jsx`)
- ✅ Component imports (no syntax errors)
- ✅ Utility functions (image URL handling)
- ✅ Component rendering (no runtime errors)
- ✅ Critical paths (API config, Auth context)

### Build Validation
- ✅ Vite build completes without errors
- ✅ No duplicate imports
- ✅ All assets generated correctly

## When to Run Tests

### Always Run
- Before committing large refactors
- Before creating pull requests
- After updating dependencies
- After modifying build configuration

### Optional (but recommended)
- After adding new components
- After modifying utilities
- When fixing bugs

## Troubleshooting

### Tests Fail
1. Check the error message - it will tell you which component or test failed
2. Fix the issue
3. Run tests again

### Build Fails
1. Check for syntax errors in the console output
2. Look for duplicate imports or missing dependencies
3. Run `npm install` if dependencies are missing

### Common Issues

**Duplicate imports:**
```bash
# The validation script checks for this automatically
grep -r "import.*from.*config.*import.*from.*config" src/
```

**Missing dependencies:**
```bash
npm install
```

**Stale build cache:**
```bash
rm -rf dist node_modules/.vite
npm run build
```

## Adding New Tests

To add new smoke tests, edit `src/test/smoke.test.jsx`:

```javascript
it('should test my new feature', () => {
  // Your test here
  expect(myFunction()).toBe(expectedValue)
})
```

## Performance

- Smoke tests: ~1 second
- Build validation: ~2 seconds
- Total validation: ~3 seconds

Fast enough to run frequently without slowing down development.
