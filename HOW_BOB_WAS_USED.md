# How IBM Bob 2.0 Was Used — PatchPilot

> Deliverable: written statement on how IBM Bob was used to build/run this project.
> Session-summary evidence: [`bob_sessions/`](bob_sessions/).

- **Project:** PatchPilot — Agentic dependency-upgrade autopilot
- **Team:** `<jamoa nomi>`
- **Members:** Raxmanova Marfu'a (isa704480@gmail.com) · `<qo'shimcha a'zolar>`
- **Bob account:** hackathon-provisioned `ibm-hackathon-lablab` · Enterprise · region us-east
- **Bob IDE version:** 2.2.0
- **Date:** 2026-09-25

---

## 1. Summary
PatchPilot fixes the breaking changes that a dependency upgrade causes across a whole repo,
verifies them, and produces a merge-ready result. We first built the pipeline as a
deterministic prototype (so it could be validated **without** spending Bobcoins), then used
**IBM Bob 2.0 in Agent mode** to perform the real migration end-to-end on `sample-monorepo`:
Bob read both projects, extracted the Express 5 migration knowledge, upgraded the dependency,
fixed every breaking change across three services, and drove the test suite from **0 → 11
passing** — matching PatchPilot's design exactly.

## 2. Bob IDE features used
- ✅ **Agent mode** — autonomous plan → execute across the whole task.
- ✅ **Codebase inspection (full-repo context)** — read `patchpilot/` and `sample-monorepo/` to understand structure before acting.
- ✅ **Document understanding** — read the official Express 5 migration guide and produced repo-specific migration rules.
- ✅ **Edit + Execute** — bumped `package.json`, ran `npm install` and `npm test`, iterated to green.
- ✅ **Auto-approve permissions** — Read/Edit/Execute/Subagent enabled so the multi-step task ran without manual approvals.
- ✅ **Tasks / session summaries** — each task's Bobcoin consumption captured as evidence.

## 3. Architecture ↔ Bob (the two seams)
| Component | Bob's role | File |
|---|---|---|
| Migration Extractor | Document understanding — read Express 5 guide → migration rules | `patchpilot/src/analysis/migrationExtractor.js` |
| Remediation | Agent + Edit — rewrote breaking call sites, self-verified via tests | `patchpilot/src/remediation/subagent.js` |
| Orchestrator | Plan → execute pipeline | `patchpilot/src/orchestrator.js` |
| Reporter | Before/after summary + migration notes | `patchpilot/src/report/*` |

## 4. Bob tasks (attach session summaries)
| # | Task (what Bob did) | Output | Screenshot |
|---|---|---|---|
| 01 | Read both projects; wrote workspace context | `AGENTS.md` | `bob_sessions/<team>_task01_context.png` |
| 02 | Read Express 5 migration guide; produced repo-specific rules | `sample-monorepo/EXPRESS5_MIGRATION.md` | `bob_sessions/<team>_task02_migration_rules.png` |
| 03 | Upgraded express 4→5, fixed 6 breaking changes, ran tests to green | 11/11 tests pass | `bob_sessions/<team>_task03_upgrade_fix.png` |

> (Optional) Task 04 — Sovereign zod `.strict()` → `z.strictObject()` (semantic fix), typecheck green.

## 5. Result — before / after (Task 03)
**BEFORE** (naïve `express@^5` bump): all 3 services crash at module load — **0 tests passing**.
| Service | Error |
|---|---|
| api | `TypeError: app.del is not a function` |
| auth | `PathError: Unexpected ? at index 12: /profile/:id?` |
| billing | `PathError: Missing parameter name at index 1: *` |

**Fixes applied** (6 changes across 3 files):
| # | File | Change |
|---|---|---|
| 1 | services/api/app.js | `app.del(` → `app.delete(` |
| 2 | services/api/app.js | `req.param('id')` → `req.params.id` (×2) |
| 3 | services/auth/app.js | `'/profile/:id?'` → `'/profile{/:id}'` |
| 4 | services/auth/app.js | `res.redirect('back')` → `res.redirect(req.get('Referrer') \|\| '/')` |
| 5 | services/billing/app.js | `req.param('id')` → `req.params.id` |
| 6 | services/billing/app.js | `app.get('*',` → `app.get('/*splat',` |

**AFTER:** **11/11 tests passing** on Express 5.2.1 — no errors, no deprecation warnings.
(Independently re-verified with `npm test` in `sample-monorepo`.)

## 6. Bobcoin usage
- Granted: **40** · Used: **~1.41** · Remaining: **~38.6**
- All three tasks ran in a **single Bob Agent session** (Todo 3/3), consuming **~1.41 Bobcoins total** —
  i.e. a full Express 4→5 migration (6 fixes, 3 services, 0 → 11 tests) for **under 1.5 Bobcoins**.
- Strategy: the pipeline was validated deterministically first (no Bobcoins), so Bob was reserved for the
  real migration + evidence, keeping usage low. (Confirm exact figure in Settings → General → Usage.)

## 7. Reproduce
```bash
# PatchPilot tool (deterministic engine)
cd patchpilot && npm run demo        # sample: express 4 → 5, 0 → 11 green
cd patchpilot && npm run site        # web app + landing → http://localhost:4300

# What Bob did, by hand:
cd sample-monorepo && npm test        # 11/11 green on express 5
```
