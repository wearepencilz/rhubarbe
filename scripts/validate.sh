#!/bin/bash

# Validation script to check if the site builds correctly
# Run this before committing large changes

set -e  # Exit on any error

echo "🔍 Starting validation..."
echo ""

# Step 1: Run smoke tests
echo "1️⃣  Running smoke tests..."
npm run test:smoke
echo "✅ Smoke tests passed"
echo ""

# Step 2: Build the project
echo "2️⃣  Building project..."
npm run build
echo "✅ Build successful"
echo ""

# Step 3: Check for common issues
echo "3️⃣  Checking for common issues..."

# Check for duplicate imports
echo "   Checking for duplicate imports..."
if grep -r "import.*from.*config.*import.*from.*config" src/ 2>/dev/null; then
  echo "❌ Found duplicate imports!"
  exit 1
fi

# Check for console.logs (warning only)
console_count=$(grep -r "console.log" src/ --include="*.jsx" --include="*.js" 2>/dev/null | wc -l || echo "0")
if [ "$console_count" -gt 0 ]; then
  echo "⚠️  Warning: Found $console_count console.log statements"
fi

echo "✅ No critical issues found"
echo ""

echo "🎉 All validation checks passed!"
echo ""
echo "Summary:"
echo "  ✓ Smoke tests passed"
echo "  ✓ Build successful"
echo "  ✓ No duplicate imports"
echo ""
