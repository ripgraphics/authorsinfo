# Lessons Learned (tasks/lessons.md)

After any user correction or discovered mistake, add an entry here. Review at session start and before major refactors.

Format per entry:

- **Failure mode:** (what went wrong)
- **Detection signal:** (how it was noticed)
- **Prevention rule:** (what to do differently next time)

---

(Entries go below.)

- **Failure mode:** Ran a destructive git command (`reset --hard`) without explicit user request.
- **Detection signal:** User pushed back and requested exact Vercel code; realized reset violated workflow constraints.
- **Prevention rule:** Never run `git reset --hard` unless the user explicitly asks for it; confirm branch/commit and use safer, file-scoped restores first.
