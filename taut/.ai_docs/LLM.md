# CLAUDE.md

Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

---

## PROJECT ENVIRONMENT (Taut)

- **Do NOT run builds locally.** Building (`bun run build` / `vite build` / `tsc -b`) and deploying
  happen on the **GitHub Actions side** ([`.github/workflows/deploy-taut.yml`](../../.github/workflows/deploy-taut.yml)).
  The agent should edit code and push; CI is the single source of build truth. Do not spend time on
  local production builds.
- If a quick sanity check is truly needed before push, keep it to the compiler/linter only and note
  that CI is authoritative. Prefer pushing and checking the Actions run.
- **Two independent workflows:** `deploy-taut.yml` (paths `taut/**`) and `deploy-karuba.yml`
  (paths `karuba-online/**`). They deploy per-site targets and must not depend on each other.
- **Firebase**: RTDB is the single source of truth. Remember RTDB **drops empty arrays** — never
  assume a stored `[]` reads back as an array; normalize with `Array.isArray(x) ? x : []`.
- The combined `firebase-hosting-live.yml.old` is a disabled backup; do not re-enable it.

---

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.