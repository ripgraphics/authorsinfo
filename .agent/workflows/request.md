---
description: Full-Stack Engineer Agent
---

# Request Handler Workflow

When receiving a user request, follow this process:

## Step 1: Classify the Task

Identify which of the 4 categories the request belongs to:

| Icon | Type        | Keywords to Detect |
|:----:|:------------|:-------------------|
| 🔍 | **CONSULT** | "should", "recommend", "compare", "suggest", "advice" |
| 🏗️ | **BUILD**   | "create", "make", "build", "add", "implement", "write" |
| 🔧 | **DEBUG**   | "error", "bug", "not working", "wrong", "fix" |
| ⚡ | **OPTIMIZE** | "slow", "refactor", "clean", "improve", "optimize" |

> **Note:** If unclear → Ask the user before proceeding.

---

## Step 1.5: Automatic Skill Discovery

**MANDATORY:** Before executing the mode, you MUST:

1. Follow rule 16 (automatic skill discovery) — see `.agent/rules/16-automatic-skill-discovery.md`.
2. Scan all skills in `.agent/skills/` for relevance (or use `.agent/SKILL_INDEX.md`).
3. Check user request for opt-out instructions ("don't use X", "only use Y").
4. Read and apply ALL matching skills (explicit paths: `.agent/skills/<name>/SKILL.md`).
5. Then proceed to mode execution.

**Default:** Use all relevant skills unless user explicitly opts out.

---

## Step 2: Execute Based on Mode

### 🔍 CONSULT Mode

1. Clarify context & constraints
2. Provide 2-3 options with clear trade-offs
3. Recommend the optimal option with reasoning
4. **WAIT for confirmation** before coding

### 🏗️ BUILD Mode

1. Confirm scope & acceptance criteria
2. Propose file/component structure
3. Code in order: Types → Logic/Hooks → UI → Styles
4. Run checklist before delivery

### 🔧 DEBUG Mode

1. Gather info: what, where, when
2. Analyze root cause
3. Propose fix + explanation
4. Suggest prevention measures

### ⚡ OPTIMIZE Mode

1. Measure baseline
2. Identify main bottlenecks
3. Propose improvements + predict results
4. Refactor + compare before/after

---

## Step 3: Pre-Delivery Checklist

**Code Quality:**
- [ ] No `any` types
- [ ] No hardcoded magic numbers/strings
- [ ] Proper error handling
- [ ] Clear variable/function naming

**Structure:**
- [ ] Correct folder structure
- [ ] Consistent naming convention
- [ ] Split files appropriately (< 200 lines/file)

**UI/UX (if applicable):**
- [ ] Follows Design System
- [ ] Responsive, mobile-first
- [ ] Loading/Error/Empty states

---

## Tips

- ❌ Don't expand scope unilaterally
- ❌ Don't use `any` types
- ✅ Ask when requirements are unclear
- ✅ Comment complex logic
- ✅ Prioritize: Readability → Performance → Cleverness