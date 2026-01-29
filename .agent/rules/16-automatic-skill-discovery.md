---
activation: always_on
description: After task classification, automatically discover and apply all relevant skills from .agent/skills/ unless the user explicitly opts out. Default: use all matching skills.
---

# [SKILL-DISCOVERY] Automatic Skill Discovery

**Goal:** Use all relevant skills by default. After classifying the task (rule 02), before executing the mode (rules 03–09), discover matching skills and read their SKILL.md files. Apply user opt-out if stated.

## When This Rule Runs

- **After** [Task classification](.agent/rules/02-task-classification.md) (rule 02)
- **Before** executing the mode (rules 03–09)

## Process

1. **Scan skills** – Use `.agent/SKILL_INDEX.md` or list `.agent/skills/` and read each `SKILL.md` frontmatter (first 30–50 lines).
2. **Match relevance** – For each skill, check:
   - Does the task type match any value in `task_types`?
   - Does the user request contain any word/phrase from `keywords`?
   - Does the task involve any technology from `domains`?
   - If `always_use: true` and task type matches, include it.
3. **Apply opt-out** – If the user said "don't use [skill-name]" or "skip [skill-name]", exclude that skill. If the user said "only use [skill1, skill2]", use only those skills.
4. **Read and apply** – For each matching skill, read the full file at `.agent/skills/<name>/SKILL.md` and apply its guidance before proceeding with the mode.

## Explicit Instructions

After classifying the task type, you MUST:

1. List all directories in `.agent/skills/` (or read `.agent/SKILL_INDEX.md`).
2. For each skill, check relevance using `task_types`, `keywords`, and `domains` from frontmatter or the index.
3. If `always_use: true` and task type matches, include that skill.
4. If the user said "don't use [skill-name]" or "skip [skill-name]", exclude it.
5. If the user said "only use [skill1, skill2]", use ONLY those skills and ignore other matches.
6. For all selected skills, read the full `.agent/skills/<name>/SKILL.md` file.
7. Apply the guidance from each skill, then proceed with the mode (rules 03–09).

## Skill Paths (explicit)

- triage-expert: `.agent/skills/triage-expert/SKILL.md`
- component-reuse-workflow: `.agent/skills/component-reuse-workflow/SKILL.md`
- code-review: `.agent/skills/code-review/SKILL.md`
- nextjs-expert: `.agent/skills/nextjs-expert/SKILL.md`
- supabase-expert: `.agent/skills/supabase-expert/SKILL.md`
- react-expert: `.agent/skills/react-expert/SKILL.md`

See `.agent/SKILL_INDEX.md` for the full table.

## Default Behavior

**Use all relevant skills** unless the user opts out.

## Opt-Out Examples

- "Don't use triage-expert" → Exclude triage-expert; use all other matching skills.
- "Only use component-reuse-workflow" → Use only that skill; ignore other matches.
