---
activation: always_on
description: Automatically enforces component reuse workflow and reusability validation before any component is created or modified. Ensures all components are fully reusable and follow established patterns.
---

# [COMPONENT-REUSE] Automatic Component Reuse Enforcement

**Goal:** Prevent creation of non-reusable components by automatically enforcing the component-reuse-workflow and validating reusability before any component code is written.

## Trigger Conditions

This rule activates automatically when:
- ✅ **Component files are created** (`components/**/*.tsx`, `components/**/*.ts`)
- ✅ **Component files are modified** (any `.tsx` or `.ts` in `components/`)
- ✅ **User requests creating a component** (keywords: "create component", "new component", "add component")
- ✅ **User requests building UI** (keywords: "build", "make", "add" + UI-related terms)
- ✅ **Any file matching component patterns** is created/modified

## Mandatory Pre-Creation Workflow

**BEFORE writing any component code, you MUST:**

### Step 1: Activate Component Reuse Workflow

Automatically invoke the `component-reuse-workflow` skill:

```
I need to create a component. Activating component-reuse-workflow skill to:
1. Search for existing components
2. Evaluate reusability requirements
3. Validate component design
```

### Step 2: Component Discovery (MANDATORY)

**You MUST perform these searches before writing code:**

1. **List UI Components**
   ```bash
   ls components/ui/
   ```

2. **Search for Similar Components**
   ```bash
   grep -r "component-name\|similar-feature" components/ -i
   ```

3. **Codebase Semantic Search**
   - "How are [similar features] implemented?"
   - "Where are [component type] used?"
   - "What patterns exist for [use case]?"

4. **Check Domain Directories**
   ```bash
   ls components/enterprise/
   ls components/admin/
   ls components/group/
   ls components/entity/
   ```

### Step 3: Reusability Validation (MANDATORY)

**Before creating the component, validate it will be reusable:**

#### Validation Checklist (ALL must pass):

- [ ] **No hardcoded API calls** - Component accepts data via props only
- [ ] **No direct hook usage for data** - Hooks only in container components
- [ ] **All callbacks via props** - Actions passed as function props
- [ ] **No business logic** - Only presentation logic in component
- [ ] **No context assumptions** - Component doesn't assume specific providers
- [ ] **Type-safe props** - All props properly typed with interfaces
- [ ] **Works in isolation** - Component can be used without specific setup
- [ ] **Follows established patterns** - Uses Dialog, Sheet, or other UI primitives

### Step 4: Component Design Validation

**Verify the component design:**

#### Presentational Component Pattern (Preferred)
```typescript
// ✅ CORRECT: Presentational component
interface ComponentProps {
  data: DataType
  onAction?: (id: string) => void
  className?: string
}

export function Component({ data, onAction, className }: ComponentProps) {
  // ✅ Only presentation logic
  return <div>{/* UI */}</div>
}
```

#### Container Component Pattern (For Data Fetching)
```typescript
// ✅ CORRECT: Container handles data, passes to presentational
export function ComponentContainer({ id }: { id: string }) {
  const [data, setData] = useState(null)
  
  useEffect(() => {
    fetch(`/api/data/${id}`).then(r => r.json()).then(setData)
  }, [id])
  
  if (!data) return <Skeleton />
  
  // ✅ Passes data to presentational component
  return <Component data={data} onAction={handleAction} />
}
```

### Step 5: Automatic Validation After Creation

**After component is created, automatically validate using the validation script:**

#### Run Automatic Validation Script:

**On Linux/Mac:**
```bash
.agent/scripts/validate-component-reusability.sh components/[new-file].tsx
```

**On Windows (PowerShell):**
```powershell
.agent/scripts/validate-component-reusability.ps1 -ComponentFile components/[new-file].tsx
```

**Or manually check:**

1. **Check for Hardcoded API Calls**
   ```bash
   grep -n "fetch\|useAuth\|useState.*fetch" components/[new-file].tsx
   ```
   - ❌ **FAIL**: If found in presentational component
   - ✅ **PASS**: Only in container components

2. **Check for Direct Hook Usage**
   ```bash
   grep -n "useAuth\|useContext\|useQuery" components/[new-file].tsx
   ```
   - ❌ **FAIL**: If found in presentational component (except UI hooks like `useState` for local state)
   - ✅ **PASS**: Only in container components

3. **Check Props Interface**
   ```bash
   grep -A 10 "interface.*Props" components/[new-file].tsx
   ```
   - ✅ **PASS**: Has proper TypeScript interface
   - ❌ **FAIL**: Missing props interface or using `any`

4. **Check Component Exports**
   ```bash
   grep "export.*function\|export.*const" components/[new-file].tsx
   ```
   - ✅ **PASS**: Component is exported
   - ✅ **PASS**: Named export (not default for reusability)

## Validation Output Format

After validation, output:

```markdown
## [COMPONENT-REUSE] Component Validation Results

**File**: `components/example/example-component.tsx`
**Validation Time**: 2025-01-25 14:30:00

### ✅ Pre-Creation Validation
- [x] Searched existing components
- [x] Found similar component: `components/ui/dialog.tsx` (using existing)
- [x] Component design validated
- [x] Reusability requirements met

### ✅ Post-Creation Validation
- [x] No hardcoded API calls found
- [x] No direct data hooks in presentational component
- [x] Props interface properly defined
- [x] Component follows established patterns
- [x] Component is fully reusable

### 📋 Component Structure
**Type**: Presentational Component
**Pattern**: Dialog-based modal
**Dependencies**: `@/components/ui/dialog`, `@/components/ui/button`
**Reusability**: ✅ Fully reusable - accepts all data via props

### ✅ Validation PASSED
Component is fully reusable and can be used anywhere in the application.
```

## Automatic Fixes

If validation fails, automatically:

### Fix 1: Extract Data Fetching
**Detect**: `fetch()` or data hooks in presentational component
**Fix**: Create container component, move data fetching there

```typescript
// BEFORE (Auto-detected)
export function Component({ id }: { id: string }) {
  const [data, setData] = useState(null)
  useEffect(() => {
    fetch(`/api/data/${id}`).then(r => r.json()).then(setData)
  }, [id])
  return <div>{data?.name}</div>
}

// AFTER (Auto-fixed)
// Presentational component
interface ComponentProps {
  data: { name: string }
  className?: string
}

export function Component({ data, className }: ComponentProps) {
  return <div className={className}>{data.name}</div>
}

// Container component
export function ComponentContainer({ id }: { id: string }) {
  const [data, setData] = useState(null)
  useEffect(() => {
    fetch(`/api/data/${id}`).then(r => r.json()).then(setData)
  }, [id])
  if (!data) return <Skeleton />
  return <Component data={data} />
}
```

### Fix 2: Extract Callbacks
**Detect**: Hardcoded API calls in action handlers
**Fix**: Accept callbacks via props

```typescript
// BEFORE (Auto-detected)
export function LikeButton({ postId }: { postId: string }) {
  const handleClick = async () => {
    await fetch(`/api/posts/${postId}/like`, { method: 'POST' })
  }
  return <Button onClick={handleClick}>Like</Button>
}

// AFTER (Auto-fixed)
interface LikeButtonProps {
  liked: boolean
  count: number
  onLike: () => void | Promise<void>
}

export function LikeButton({ liked, count, onLike }: LikeButtonProps) {
  return (
    <Button onClick={onLike} variant={liked ? 'default' : 'outline'}>
      {count}
    </Button>
  )
}
```

### Fix 3: Add Props Interface
**Detect**: Missing TypeScript interface for props
**Fix**: Create proper interface

```typescript
// BEFORE (Auto-detected)
export function Component({ data, onAction }) {
  return <div>{data.name}</div>
}

// AFTER (Auto-fixed)
interface ComponentProps {
  data: { name: string; id: string }
  onAction?: (id: string) => void
  className?: string
}

export function Component({ data, onAction, className }: ComponentProps) {
  return <div className={className}>{data.name}</div>
}
```

## Blocking Non-Reusable Components

**If validation fails and cannot be auto-fixed:**

1. **STOP** component creation
2. **REPORT** validation failures
3. **REQUIRE** user approval before proceeding
4. **SUGGEST** refactoring approach

```markdown
## ❌ [COMPONENT-REUSE] Validation FAILED

**File**: `components/example/non-reusable.tsx`

### Validation Failures:
1. ❌ Hardcoded API call found: `fetch('/api/data')` on line 15
2. ❌ Direct hook usage: `useAuth()` on line 8
3. ❌ Missing props interface

### Required Fixes:
1. Extract data fetching to container component
2. Pass user data via props instead of using `useAuth()`
3. Create TypeScript interface for props

### Suggested Refactoring:
[Provide refactoring steps]

**Component creation BLOCKED until fixes are applied.**
```

## Integration with Build Mode

When `[BUILD]` mode is activated for component creation:

1. **First**: Run component-reuse-workflow (this rule)
2. **Then**: Follow build mode process
3. **Finally**: Validate reusability again

## Integration with Auto-Review

This rule works with:
- **14-auto-code-review.md**: Additional code quality checks
- **04-mode-build.md**: Component creation process
- **component-reuse-workflow skill**: Detailed workflow guidance

## Success Metrics

This enforcement should:
- ✅ **100% of components** go through reuse workflow
- ✅ **100% of components** pass reusability validation
- ✅ **0 non-reusable components** created
- ✅ **Automatic fixes** applied for 80%+ of issues
- ✅ **Component discovery** performed before every creation

## Configuration

To skip validation for specific files (not recommended):
```typescript
// @skip-component-validation
// This file is intentionally non-reusable (e.g., page-specific wrapper)
```

## Examples

### Example 1: Creating a Modal Component

**User Request**: "Create a settings modal"

**Automatic Workflow**:
1. ✅ Search `components/ui/` → Found `dialog.tsx`
2. ✅ Check if Dialog can be used → Yes, extend Dialog
3. ✅ Validate design → Presentational component with props
4. ✅ Create component using Dialog pattern
5. ✅ Validate → No hardcoded API calls, proper props interface
6. ✅ **PASS** - Component is reusable

### Example 2: Creating a Feed Card

**User Request**: "Create a feed card component"

**Automatic Workflow**:
1. ✅ Search → Found `components/entity-feed-card.tsx`
2. ✅ Check if existing can be used → Evaluate props
3. ✅ If new needed → Validate reusability
4. ✅ Create presentational component
5. ✅ Create container component for data fetching
6. ✅ Validate → Both components pass
7. ✅ **PASS** - Components are reusable

### Example 3: Non-Reusable Component Attempt

**User Request**: "Create a user profile component that fetches user data"

**Automatic Workflow**:
1. ✅ Search → Found similar components
2. ✅ Validate design → ❌ Has hardcoded `fetch()` call
3. ✅ **BLOCK** - Validation failed
4. ✅ **AUTO-FIX** - Extract to container/presentational pattern
5. ✅ **RE-VALIDATE** - Now passes
6. ✅ **PASS** - Component is now reusable

## Remember

**NEVER create a component without:**
1. ✅ Running component discovery
2. ✅ Validating reusability requirements
3. ✅ Ensuring it follows established patterns
4. ✅ Passing all validation checks

**ALWAYS ensure components are:**
- ✅ Fully reusable (work anywhere)
- ✅ Props-based (no hardcoded dependencies)
- ✅ Type-safe (proper TypeScript interfaces)
- ✅ Pattern-compliant (uses existing UI primitives)