# Component Reuse Enforcement System

## Overview

This system **automatically prevents** the creation of non-reusable components by enforcing mandatory workflows and validation checks before any component code is written.

## How It Works

### 1. Automatic Rule Activation

**Rule 15: Component Reuse Enforcement** (`.agent/rules/15-component-reuse-enforcement.md`) is set to `activation: always_on`, meaning it automatically activates when:

- ✅ Component files are created (`components/**/*.tsx`)
- ✅ Component files are modified
- ✅ User requests creating a component
- ✅ User requests building UI

### 2. Mandatory Workflow Execution

When triggered, the rule automatically:

1. **Invokes the Component Reuse Workflow Skill** (`.agent/skills/component-reuse-workflow/SKILL.md`)
2. **Forces component discovery** before any code is written
3. **Validates reusability design** before implementation
4. **Runs validation checks** after component creation
5. **Blocks non-reusable components** until fixes are applied

### 3. Validation Process

#### Pre-Creation Validation (MANDATORY)

Before writing ANY component code:
- ✅ Search existing components
- ✅ Evaluate if existing components can be used
- ✅ Validate component design for reusability
- ✅ Ensure props-based architecture

#### Post-Creation Validation (AUTOMATIC)

After component is created:
- ✅ Run validation script: `.agent/scripts/validate-component-reusability.sh` (Linux/Mac) or `.agent/scripts/validate-component-reusability.ps1` (Windows)
- ✅ Check for hardcoded API calls
- ✅ Check for direct data hooks
- ✅ Verify props interface exists
- ✅ Ensure type safety
- ✅ Confirm pattern compliance

## Files in the System

### 1. Enforcement Rule
**File**: `.agent/rules/15-component-reuse-enforcement.md`
- Automatically triggers on component creation
- Enforces mandatory workflow
- Blocks non-reusable components

### 2. Workflow Skill
**File**: `.agent/skills/component-reuse-workflow/SKILL.md`
- Provides detailed workflow guidance
- Explains reusability principles
- Includes examples and patterns

### 3. Validation Scripts
**Files**: 
- `.agent/scripts/validate-component-reusability.sh` (Linux/Mac)
- `.agent/scripts/validate-component-reusability.ps1` (Windows)

**Checks**:
- No hardcoded API calls
- No direct data hooks
- Proper TypeScript interfaces
- Type safety (no `any`)
- Component exports
- UI pattern usage
- No hardcoded endpoints

## Usage

### For Agents

When creating a component, agents will automatically:

1. **Detect component creation request**
2. **Activate component-reuse-workflow skill**
3. **Perform component discovery**
4. **Validate design before coding**
5. **Create component following patterns**
6. **Run validation script**
7. **Fix issues automatically if possible**
8. **Block if validation fails**

### For Developers

To manually validate a component:

**Linux/Mac:**
```bash
.agent/scripts/validate-component-reusability.sh components/example/my-component.tsx
```

**Windows (PowerShell):**
```powershell
.agent/scripts/validate-component-reusability.ps1 -ComponentFile components/example/my-component.tsx
```

## Validation Checklist

Every component MUST pass:

- [ ] **No hardcoded API calls** - All data via props
- [ ] **No direct data hooks** - Hooks only in containers
- [ ] **Props interface defined** - Proper TypeScript types
- [ ] **Type-safe** - No `any` types
- [ ] **Exported** - Component is exported
- [ ] **Follows patterns** - Uses established UI components
- [ ] **No hardcoded endpoints** - All configurable
- [ ] **Works in isolation** - Can be tested with mock data

## Automatic Fixes

The system can automatically fix:

1. **Extract data fetching** - Move to container component
2. **Extract callbacks** - Pass via props
3. **Add props interface** - Create TypeScript interface
4. **Fix exports** - Ensure proper export

## Blocking Non-Reusable Components

If validation fails and cannot be auto-fixed:

1. **STOP** component creation
2. **REPORT** validation failures
3. **REQUIRE** fixes before proceeding
4. **SUGGEST** refactoring approach

## Integration

This system integrates with:

- **Rule 14**: Auto-code-review (additional quality checks)
- **Rule 04**: Build mode (component creation process)
- **Component Reuse Workflow Skill**: Detailed guidance

## Success Metrics

The system ensures:

- ✅ **100% of components** go through reuse workflow
- ✅ **100% of components** pass reusability validation
- ✅ **0 non-reusable components** created
- ✅ **Automatic fixes** for 80%+ of issues
- ✅ **Component discovery** before every creation

## Examples

### Example 1: Creating a Modal

**User**: "Create a settings modal"

**System automatically**:
1. ✅ Searches `components/ui/` → Finds `dialog.tsx`
2. ✅ Validates using Dialog pattern
3. ✅ Creates presentational component
4. ✅ Runs validation → **PASS**
5. ✅ Component is reusable

### Example 2: Non-Reusable Attempt

**User**: "Create a user profile that fetches data"

**System automatically**:
1. ✅ Searches existing components
2. ✅ Validates design → ❌ Has hardcoded `fetch()`
3. ✅ **BLOCKS** creation
4. ✅ **AUTO-FIXES** → Extracts to container
5. ✅ Re-validates → **PASS**
6. ✅ Component is now reusable

## Configuration

To skip validation for specific files (not recommended):
```typescript
// @skip-component-validation
// This file is intentionally non-reusable
```

## Troubleshooting

### Validation Fails

1. Check validation output for specific errors
2. Review component design against checklist
3. Apply suggested fixes
4. Re-run validation

### Script Not Found

Ensure scripts are in `.agent/scripts/` directory:
- `validate-component-reusability.sh` (Linux/Mac)
- `validate-component-reusability.ps1` (Windows)

### Rule Not Triggering

Check that Rule 15 has `activation: always_on` in frontmatter.

## Summary

This enforcement system **guarantees** that:
- ✅ No component is created without going through the reuse workflow
- ✅ All components are validated for reusability
- ✅ Non-reusable components are automatically fixed or blocked
- ✅ The codebase maintains consistent, reusable component architecture

**Result**: Every component in the codebase is fully reusable and can be used anywhere in the application without modification.