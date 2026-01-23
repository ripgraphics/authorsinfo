# Automatic Code Review & Fix System

## Overview

The automatic code review system provides continuous code quality assurance by:
1. **Automatically reviewing** code after every edit
2. **Automatically fixing** common issues where safe
3. **Flagging** issues requiring manual review
4. **Maintaining** consistent code quality standards

## How It Works

### Trigger Points

The system automatically activates when:
- ✅ Code files are created or modified (`.ts`, `.tsx`, `.js`, `.jsx`)
- ✅ Server Actions are created/modified (`app/actions/**/*.ts`)
- ✅ API routes are created/modified (`app/api/**/route.ts`)
- ✅ Components are created/modified (`components/**/*.tsx`)

### Review Process

1. **Immediate Review**: Scans modified files for issues
2. **Pattern Detection**: Identifies fixable patterns
3. **Auto-Fix Application**: Applies safe fixes automatically
4. **Report Generation**: Creates review report with:
   - ✅ Auto-fixed issues
   - ⚠️ Issues requiring manual review
   - 📊 Review summary

## Auto-Fix Capabilities

### Always Auto-Fixed (Safe)

These issues are automatically fixed without human intervention:

1. **Error Handling**
   - Replace `error.message` with `handleDatabaseError()`
   - Add missing error handler imports
   - Standardize error response format

2. **Server Actions**
   - Add missing `'use server'` directive
   - Add missing `revalidatePath`/`revalidateTag` after mutations
   - Fix import statements

3. **Type Safety**
   - Replace `any` types with proper interfaces (when inferable)
   - Add missing type definitions

4. **Code Quality**
   - Remove `console.log` statements
   - Add missing imports
   - Fix simple syntax issues

5. **Next.js Patterns**
   - Add missing route segment configs
   - Fix Server Component/Client Component boundaries

### Never Auto-Fixed (Manual Review Required)

These issues are flagged but require human review:

1. **Security Issues**
   - Authentication/authorization problems
   - Input validation issues
   - SQL injection risks

2. **Complex Changes**
   - Large refactoring (>50 lines)
   - Database schema changes
   - Breaking API changes

3. **Performance**
   - N+1 query problems
   - Missing indexes
   - Caching strategies

## Example Workflow

### Scenario: Creating a New API Route

**Step 1: Developer Creates Route**
```typescript
// app/api/books/route.ts
export async function POST(request: NextRequest) {
  const json = await request.json()
  const { data, error } = await supabase.from('books').insert(json)
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ success: true, data })
}
```

**Step 2: Auto-Review Detects Issues**
- ❌ Missing authentication check
- ❌ Raw `error.message` exposure
- ❌ Missing error handler imports
- ❌ Missing input validation

**Step 3: Auto-Fix Applied**
```typescript
// app/api/books/route.ts (Auto-fixed)
import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClientAsync } from '@/lib/supabase/client-helper'
import { handleDatabaseError, unauthorizedError, badRequestError } from '@/lib/error-handler'

export async function POST(request: NextRequest) {
  // ✅ Auto-added: Authentication check
  const supabase = await createRouteHandlerClientAsync()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json(unauthorizedError(), { status: 401 })
  }

  // ⚠️ Flagged: Missing input validation (requires manual review)
  const json = await request.json()
  
  const { data, error } = await supabase.from('books').insert(json)
  if (error) {
    // ✅ Auto-fixed: Replaced error.message with handleDatabaseError
    const { message, statusCode } = handleDatabaseError(error, 'Failed to create book')
    return NextResponse.json({ error: message }, { status: statusCode })
  }
  return NextResponse.json({ success: true, data })
}
```

**Step 4: Review Report Generated**
```markdown
## [AUTO-REVIEW] Code Review & Auto-Fix Results

**File**: `app/api/books/route.ts`
**Review Time**: 2025-01-23 14:30:00

### ✅ Auto-Fixed Issues (3)
1. ✅ Added authentication check
2. ✅ Replaced `error.message` with `handleDatabaseError()`
3. ✅ Added missing imports

### ⚠️ Requires Manual Review (1)
1. ⚠️ Missing input validation - Line 15
   - **Issue**: No validation before database insert
   - **Suggestion**: Add Zod schema validation
   - **Priority**: High
```

## Configuration

### Disable Auto-Fix for Specific Files

Add comment at top of file:
```typescript
// @no-auto-fix
// This file should not be auto-fixed
export async function customHandler() {
  // ...
}
```

### Disable Auto-Review for Specific Files

Add comment at top of file:
```typescript
// @no-auto-review
// Skip automatic review for this file
export async function legacyCode() {
  // ...
}
```

## Integration Points

The auto-review system integrates with:

1. **Pre-Delivery Checklist** (`12-checklist.md`)
   - Validates checklist items automatically
   - Flags missing items

2. **Technical Standards** (`10-technical-standards.md`)
   - Enforces naming conventions
   - Validates code structure

3. **Code Review Skill** (`.agent/skills/code-review/`)
   - Uses comprehensive review patterns
   - Applies project-specific checks

4. **Mode Review** (`08-mode-review.md`)
   - Uses review format and patterns
   - Maintains consistency

## Benefits

### For Developers
- ✅ Immediate feedback on code quality
- ✅ Automatic fixes for common issues
- ✅ Reduced manual review time
- ✅ Consistent code standards

### For Codebase
- ✅ Consistent error handling patterns
- ✅ Type safety maintained
- ✅ Security best practices enforced
- ✅ Reduced technical debt

### For Team
- ✅ Faster code reviews
- ✅ Focus on complex issues
- ✅ Reduced merge conflicts
- ✅ Better code quality overall

## Metrics & Success Criteria

The system aims to:
- ✅ Catch 90%+ of common issues automatically
- ✅ Fix 70%+ of fixable issues without human intervention
- ✅ Flag 100% of security issues for manual review
- ✅ Reduce manual review time by 60%+
- ✅ Maintain consistent code quality standards

## Troubleshooting

### Auto-Fix Not Applied

**Check**:
1. Is the file excluded with `@no-auto-fix`?
2. Is the issue in the "Never Auto-Fix" category?
3. Does the fix require complex analysis?

**Solution**: Review the issue manually and apply fix if appropriate.

### False Positives

**Check**:
1. Is the pattern detection too aggressive?
2. Is the code intentionally different?

**Solution**: Add `@no-auto-review` comment or adjust detection patterns.

### Missing Fixes

**Check**:
1. Is the pattern in the auto-fix list?
2. Is the fix safe to apply automatically?

**Solution**: Report missing patterns for addition to auto-fix list.

## Future Enhancements

Planned improvements:
- [ ] Machine learning-based pattern detection
- [ ] Custom auto-fix rules per project
- [ ] Integration with CI/CD pipeline
- [ ] Real-time review in editor
- [ ] Team-specific rule customization

## Related Documentation

- `.agent/rules/14-auto-code-review.md` - Auto-review rule
- `.agent/skills/code-review/SKILL.md` - Review skill with auto-fix
- `.agent/rules/12-checklist.md` - Pre-delivery checklist
- `.agent/rules/10-technical-standards.md` - Technical standards
