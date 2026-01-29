---
activation: always_on
description: Automatically triggers code review and fixes after every code edit. Runs comprehensive review and applies automatic fixes where possible.
---

# [AUTO-REVIEW] Automatic Code Review & Fix

**Goal:** Automatically review and fix code after every edit to maintain quality and security.

## Trigger Conditions

This rule activates automatically when:
- ✅ Code files are created or modified (`.ts`, `.tsx`, `.js`, `.jsx`)
- ✅ Server Actions are created/modified (`app/actions/**/*.ts`)
- ✅ API routes are created/modified (`app/api/**/route.ts`)
- ✅ Components are created/modified (`components/**/*.tsx`)
- ✅ Any file matching project patterns is edited

## Automatic Review Process

### Step 1: Immediate Review
After any code edit, automatically:
1. Read and apply `.agent/skills/code-review/SKILL.md` when performing code review. This skill is automatically discovered via rule 16 for REVIEW tasks, but can also be triggered by code edits.
2. Identify issues by priority (Critical → High → Medium → Low)
3. Check against project-specific patterns
4. Generate fix suggestions

### Step 2: Automatic Fixes
Apply fixes automatically for:
- ✅ TypeScript type safety issues (`any` → proper types)
- ✅ Missing error handling patterns
- ✅ Missing `revalidatePath`/`revalidateTag` in Server Actions
- ✅ Missing authentication checks
- ✅ Raw error messages (replace with error-handler utilities)
- ✅ Missing `'use server'` directive
- ✅ Missing route segment configs
- ✅ Console.log statements (remove or replace with proper logging)
- ✅ Missing imports
- ✅ Simple code quality issues

### Step 3: Manual Review Required
Flag for manual review:
- 🔴 Security vulnerabilities (require human verification)
- 🔴 Complex architectural changes
- 🟠 Performance optimizations requiring analysis
- 🟠 Database schema changes
- 🟡 Code refactoring opportunities

## Auto-Fix Patterns

### Pattern 1: Error Handling
**Detect**: `error.message` in API routes
**Fix**: Replace with `handleDatabaseError()` or `nextErrorResponse()`

```typescript
// BEFORE (Auto-detected)
if (error) {
  return NextResponse.json({ error: error.message }, { status: 500 })
}

// AFTER (Auto-fixed)
import { handleDatabaseError } from '@/lib/error-handler'
const { message, statusCode } = handleDatabaseError(error, 'Failed to create')
return NextResponse.json({ error: message }, { status: statusCode })
```

### Pattern 2: Missing Revalidation
**Detect**: Server Action with mutation but no `revalidatePath`
**Fix**: Add appropriate revalidation

```typescript
// BEFORE (Auto-detected)
export async function createBook(data: BookData) {
  const book = await insertBook(data)
  return { success: true, book }
}

// AFTER (Auto-fixed)
import { revalidatePath } from 'next/cache'
export async function createBook(data: BookData) {
  const book = await insertBook(data)
  revalidatePath('/books')
  return { success: true, book }
}
```

### Pattern 3: Missing Authentication
**Detect**: API route without auth check
**Fix**: Add authentication check

```typescript
// BEFORE (Auto-detected)
export async function POST(request: NextRequest) {
  const json = await request.json()
  // ... process without auth check
}

// AFTER (Auto-fixed)
import { createRouteHandlerClientAsync } from '@/lib/supabase/client-helper'
import { unauthorizedError } from '@/lib/error-handler'

export async function POST(request: NextRequest) {
  const supabase = await createRouteHandlerClientAsync()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json(unauthorizedError(), { status: 401 })
  }
  const json = await request.json()
  // ... process
}
```

### Pattern 4: Type Safety
**Detect**: `any` types
**Fix**: Replace with proper types

```typescript
// BEFORE (Auto-detected)
function process(data: any): any {
  return data
}

// AFTER (Auto-fixed)
interface ProcessData {
  id: string
  name: string
}

interface ProcessResult {
  success: boolean
  data?: ProcessData
}

function process(data: ProcessData): ProcessResult {
  return { success: true, data }
}
```

### Pattern 5: Missing 'use server'
**Detect**: Server Action without directive
**Fix**: Add directive

```typescript
// BEFORE (Auto-detected)
export async function createActivity(params: CreateActivityParams) {
  // ...
}

// AFTER (Auto-fixed)
'use server'
export async function createActivity(params: CreateActivityParams) {
  // ...
}
```

### Pattern 6: Console.log Removal
**Detect**: `console.log` in production code
**Fix**: Remove or replace with proper logging

```typescript
// BEFORE (Auto-detected)
console.log('Debug:', data)

// AFTER (Auto-fixed)
// Removed debug statement
// Use proper logging utility if needed: logger.debug('Debug:', data)
```

## Review Output Format

After automatic review and fixes:

```markdown
## [AUTO-REVIEW] Code Review & Auto-Fix Results

**File**: `app/api/example/route.ts`
**Review Time**: 2025-01-23 14:30:00

### ✅ Auto-Fixed Issues (5)
1. ✅ Replaced `error.message` with `handleDatabaseError()`
2. ✅ Added authentication check
3. ✅ Added missing import for `NextResponse`
4. ✅ Removed `console.log` statement
5. ✅ Added `'use server'` directive

### 🔴 Critical Issues (Requires Manual Review)
1. ⚠️ Potential SQL injection risk - Line 45
   - **Issue**: Raw string concatenation in query
   - **Action**: Manual review required - may need query builder refactor

### 🟠 High Priority (Manual Fix Recommended)
1. ⚠️ Missing input validation - Line 30
   - **Issue**: No validation before database insert
   - **Suggestion**: Add Zod schema validation

### 🟡 Medium Priority
1. ⚠️ Function exceeds 50 lines - Consider refactoring
2. ⚠️ Missing error boundary for async operation

### 📊 Review Summary
- **Total Issues Found**: 8
- **Auto-Fixed**: 5
- **Requires Manual Review**: 3
- **Security Issues**: 1
- **Code Quality**: Good
```

## Fix Application Rules

### Always Auto-Fix
- Type safety improvements (non-breaking)
- Missing error handler imports
- Missing `revalidatePath`/`revalidateTag`
- Console.log removal
- Missing `'use server'` directive
- Simple import additions

### Never Auto-Fix (Require Approval)
- Security-related changes
- Database schema modifications
- Breaking API changes
- Complex refactoring
- Performance optimizations requiring analysis

### Ask Before Fixing
- Large refactoring (>50 lines changed)
- Multiple file changes
- Changes affecting multiple components
- Changes to shared utilities

## Integration with Other Rules

This rule works with:
- **12-checklist.md**: Pre-delivery checklist validation
- **10-technical-standards.md**: Enforces naming and style conventions
- **08-mode-review.md**: Uses review format and patterns
- **code-review skill** (`.agent/skills/code-review/SKILL.md`): Leverages comprehensive review patterns; discovered via rule 16 for REVIEW tasks

## Configuration

To disable auto-fix for specific files:
```typescript
// @no-auto-fix
// This file should not be auto-fixed
```

To disable auto-review for specific files:
```typescript
// @no-auto-review
// Skip automatic review for this file
```

## Success Metrics

Auto-review should:
- ✅ Catch 90%+ of common issues automatically
- ✅ Fix 70%+ of fixable issues without human intervention
- ✅ Flag 100% of security issues for manual review
- ✅ Maintain code quality standards consistently
- ✅ Reduce manual review time by 60%+
