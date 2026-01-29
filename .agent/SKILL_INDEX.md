# Skill Index

Central index of agent skills with relevance metadata. Used by rule 16 (automatic skill discovery) for matching tasks to skills. Default: use all relevant skills unless the user opts out.

## How to use

- **Agent:** After classifying the task (rule 02), scan this index (or each `.agent/skills/*/SKILL.md` frontmatter) for relevance: match task type, user request keywords, and domains. Read and apply all matching skills unless the user said "don't use X" or "only use Y, Z".
- **Opt-out:** User can say "don't use [skill-name]" or "only use [skill1, skill2]" to override the default.

## Skills (with metadata)

| Skill Name | Path | Task Types | Keywords | Domains | Always Use |
|------------|------|------------|----------|---------|------------|
| triage-expert | `.agent/skills/triage-expert/SKILL.md` | DEBUG | error, bug, crash, broken, fails, not working, unexpected behavior, issue, problem, debug | diagnostics, triage | true |
| component-reuse-workflow | `.agent/skills/component-reuse-workflow/SKILL.md` | BUILD | component, UI, create component, new component, build component, add component, make component, ui component, react component | react, ui, components | false |
| code-review | `.agent/skills/code-review/SKILL.md` | REVIEW | review, code review, audit, check code, evaluate code, assess code, look at code, review code | code quality, architecture, security, performance | false |
| nextjs-expert | `.agent/skills/nextjs-expert/SKILL.md` | BUILD, DEBUG, OPTIMIZE, CONSULT, MIGRATE | nextjs, next.js, app router, pages router, server components, hydration, routing, build, deployment, vercel, next config | nextjs, react, fullstack | false |
| supabase-expert | `.agent/skills/supabase-expert/SKILL.md` | BUILD, DEBUG, OPTIMIZE, CONSULT, MIGRATE | supabase, database, migration, schema, query, postgres, postgresql, rpc, function, trigger, policy | supabase, database, postgresql | false |
| react-expert | `.agent/skills/react-expert/SKILL.md` | BUILD, DEBUG, OPTIMIZE, CONSULT | react, component, hook, useState, useEffect, re-render, state management, props, context, server components | react, frontend, ui | false |

## Adding skills

1. Add frontmatter to the skill's `SKILL.md`: `task_types`, `keywords`, `domains`, `always_use`.
2. Add a row to the table above (or regenerate this file from skill frontmatter).

## Task types (from rule 02)

CONSULT | BUILD | DEBUG | OPTIMIZE | LEARN | REVIEW | MIGRATE
