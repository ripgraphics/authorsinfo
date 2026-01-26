#!/bin/bash

# Component Reusability Validation Script
# Validates that components follow reusability requirements

set -e

COMPONENT_FILE="${1:-}"

if [ -z "$COMPONENT_FILE" ]; then
  echo "Usage: $0 <component-file.tsx>"
  exit 1
fi

if [ ! -f "$COMPONENT_FILE" ]; then
  echo "❌ Error: File not found: $COMPONENT_FILE"
  exit 1
fi

echo "🔍 Validating component reusability: $COMPONENT_FILE"
echo ""

ERRORS=0
WARNINGS=0

# Check 1: No hardcoded fetch calls in presentational components
echo "✓ Checking for hardcoded API calls..."
if grep -n "fetch\|\.get\|\.post\|\.put\|\.delete" "$COMPONENT_FILE" 2>/dev/null | grep -v "Container\|container\|//.*fetch\|/\*.*fetch" > /dev/null; then
  echo "  ❌ FAIL: Hardcoded API calls found. Extract to container component."
  echo "  Lines with API calls:"
  grep -n "fetch\|\.get\|\.post\|\.put\|\.delete" "$COMPONENT_FILE" | grep -v "Container\|container\|//.*fetch\|/\*.*fetch" || true
  ERRORS=$((ERRORS + 1))
else
  echo "  ✅ PASS: No hardcoded API calls"
fi

# Check 2: No direct data hooks in presentational components
echo ""
echo "✓ Checking for direct data hooks..."
if grep -n "useAuth\|useQuery\|useSWR\|useContext.*User\|useContext.*Auth" "$COMPONENT_FILE" 2>/dev/null | grep -v "Container\|container\|//.*useAuth\|/\*.*useAuth" > /dev/null; then
  echo "  ❌ FAIL: Direct data hooks found. Pass data via props instead."
  echo "  Lines with data hooks:"
  grep -n "useAuth\|useQuery\|useSWR\|useContext.*User\|useContext.*Auth" "$COMPONENT_FILE" | grep -v "Container\|container\|//.*useAuth\|/\*.*useAuth" || true
  ERRORS=$((ERRORS + 1))
else
  echo "  ✅ PASS: No direct data hooks"
fi

# Check 3: Has proper TypeScript interface
echo ""
echo "✓ Checking for props interface..."
if ! grep -q "interface.*Props\|type.*Props" "$COMPONENT_FILE"; then
  echo "  ❌ FAIL: Missing props interface. Add TypeScript interface."
  ERRORS=$((ERRORS + 1))
else
  echo "  ✅ PASS: Props interface found"
  # Show the interface
  echo "  Interface:"
  grep -A 10 "interface.*Props\|type.*Props" "$COMPONENT_FILE" | head -5 | sed 's/^/    /'
fi

# Check 4: No 'any' types in props
echo ""
echo "✓ Checking for type safety..."
if grep -n ":\s*any\|any\s*>" "$COMPONENT_FILE" 2>/dev/null | grep -v "//.*any\|/\*.*any" > /dev/null; then
  echo "  ⚠️  WARNING: 'any' types found. Use proper types for reusability."
  echo "  Lines with 'any' types:"
  grep -n ":\s*any\|any\s*>" "$COMPONENT_FILE" | grep -v "//.*any\|/\*.*any" | head -3 | sed 's/^/    /' || true
  WARNINGS=$((WARNINGS + 1))
else
  echo "  ✅ PASS: No 'any' types in props"
fi

# Check 5: Component is exported
echo ""
echo "✓ Checking component export..."
if ! grep -q "export.*function\|export.*const.*=" "$COMPONENT_FILE"; then
  echo "  ❌ FAIL: Component not exported. Add export statement."
  ERRORS=$((ERRORS + 1))
else
  echo "  ✅ PASS: Component is exported"
fi

# Check 6: Uses established UI patterns
echo ""
echo "✓ Checking for UI pattern usage..."
if grep -q "from '@/components/ui/\|from \"@/components/ui/" "$COMPONENT_FILE"; then
  echo "  ✅ PASS: Uses established UI components"
  echo "  UI components used:"
  grep -o "from '@/components/ui/[^']*\|from \"@/components/ui/[^\"]*" "$COMPONENT_FILE" | sort -u | sed 's/^/    /' || true
else
  echo "  ⚠️  WARNING: Consider using established UI components from @/components/ui/"
  WARNINGS=$((WARNINGS + 1))
fi

# Check 7: No hardcoded endpoints
echo ""
echo "✓ Checking for hardcoded API endpoints..."
if grep -n "'/api/\|\"/api/" "$COMPONENT_FILE" 2>/dev/null | grep -v "Container\|container\|//.*api\|/\*.*api" > /dev/null; then
  echo "  ❌ FAIL: Hardcoded API endpoints found. Extract to container component."
  echo "  Lines with endpoints:"
  grep -n "'/api/\|\"/api/" "$COMPONENT_FILE" | grep -v "Container\|container\|//.*api\|/\*.*api" | head -3 | sed 's/^/    /' || true
  ERRORS=$((ERRORS + 1))
else
  echo "  ✅ PASS: No hardcoded API endpoints"
fi

# Check 8: Component name matches file name (for reusability)
echo ""
echo "✓ Checking component naming..."
FILE_NAME=$(basename "$COMPONENT_FILE" .tsx)
FILE_NAME=$(basename "$FILE_NAME" .ts)
if grep -q "export.*function $FILE_NAME\|export.*const $FILE_NAME" "$COMPONENT_FILE"; then
  echo "  ✅ PASS: Component name matches file name"
else
  echo "  ⚠️  WARNING: Component name should match file name for better discoverability"
  WARNINGS=$((WARNINGS + 1))
fi

# Summary
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Validation Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Errors:   $ERRORS"
echo "  Warnings: $WARNINGS"

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
  echo ""
  echo "✅ VALIDATION PASSED"
  echo "Component is fully reusable and ready for use!"
  exit 0
elif [ $ERRORS -eq 0 ]; then
  echo ""
  echo "⚠️  VALIDATION PASSED WITH WARNINGS"
  echo "Component is reusable but could be improved."
  exit 0
else
  echo ""
  echo "❌ VALIDATION FAILED"
  echo "Component is NOT reusable. Please fix the errors above."
  exit 1
fi