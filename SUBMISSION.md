# lablab.ai Submission — PatchPilot

> Copy-paste into the lablab.ai submission form. Fill the `<...>` links before submitting.

---

## Project Title
**PatchPilot — Agentic Dependency-Upgrade Autopilot**

## Short Description (1–2 sentences)
PatchPilot upgrades a dependency and fixes the breaking changes it causes across your whole
repo — then verifies the build is green and produces a merge-ready result. Built with IBM Bob 2.0.

## Technology & Category Tags
`IBM Bob 2.0` · `Developer Tools` · `DevOps` · `Agentic AI` · `Code Migration` · `Node.js` · `TypeScript`

---

## Long Description

### The problem
Automated dependency PRs (Dependabot, Renovate) only bump the version number — they don't fix the
code the new version breaks. So those PRs pile up unmerged, security patches lag for weeks, and
every major upgrade burns hours of manual, repetitive fixing. Detection is a solved problem;
**remediation** is not.

### What PatchPilot does
PatchPilot runs the entire upgrade as an agentic pipeline:

**copy repo → naive upgrade → map impact → load migration rules → parallel subagents fix every
breaking change → verify (green) → report + PR.**

- 🧠 **Full-repo context** — maps every call-site of the dependency, not just the open file.
- 📄 **Document understanding** — turns a package's CHANGELOG / migration guide into concrete migration rules.
- ⚡ **Parallel subagents** — one per module, all fixed concurrently (seconds, not an afternoon).
- ✅ **Verified & honest** — every run ends on a green build, or an explicit `needs_bob` flag for
  changes that can't be made safely by rule alone. It never fakes green.

### How IBM Bob 2.0 was used
We first built the pipeline as a deterministic prototype so it could be validated **without spending
Bobcoins**. Then IBM Bob 2.0 (Agent mode) performed the real migration end-to-end on the demo repo:
it read both projects, extracted the Express 5 migration knowledge (document understanding),
upgraded the dependency, fixed all 6 breaking changes across 3 services, and drove the test suite
from **0 → 11 passing** — for **~1.41 Bobcoins**.

Bob wires into two "seams": **migration knowledge** (`migrationExtractor.js`) and the **remediation
subagent** (`subagent.js`). Full write-up in `HOW_BOB_WAS_USED.md`; task session summaries in
`bob_sessions/`.

### Proven result (Express 4 → 5)
| | Before | After |
|---|---|---|
| Build | 3 services crash at load | ✅ green |
| Tests | 0 passing | **11 / 11 passing** |
| Fixes | — | 6 across 3 services |
| Time | ~hours manual | **seconds** (~1.41 Bobcoins via Bob) |

### Tech
Node.js pipeline + CLI · TypeScript/React/Vite/Framer Motion landing · Node HTTP + SSE web console
· IBM Bob 2.0 (Agent mode, subagents, document understanding).

### What's next
Wire Bob into both seams for any dependency (not just the rule-set shown), CVE-triggered runs, and a
GitHub App that opens the merge-ready PR automatically.

---

## Links (fill before submitting)
- 🔗 **GitHub (public):** `<https://github.com/isa704480/PatchPilot>`
- 🎥 **Demo video (≤5 min):** `<video link>`
- 🖥️ **Demo / Application URL:** `<deployed URL, or "run locally: cd patchpilot && npm run site → http://localhost:4300">`
- 📸 **Cover image:** the landing hero or the console "0 → 11 / Merge-ready" screen.

## Bob usage evidence (in repo)
- `HOW_BOB_WAS_USED.md` · `bob_sessions/` (task session screenshots) · `AGENTS.md` · `sample-monorepo/EXPRESS5_MIGRATION.md`
