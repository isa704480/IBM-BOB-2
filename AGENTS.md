# AGENTS.md — Workspace Overview

This workspace contains two projects: **PatchPilot** (an agentic dependency-upgrade tool)
and **sample-monorepo** (its demo target — a small Express v4 monorepo).

---

## 1. sample-monorepo

A minimal Express v4 monorepo with three independent services. It is the **demo target** for
PatchPilot: every service deliberately uses Express v4 APIs that break under Express v5.

### Structure

```
sample-monorepo/
├── package.json                     # npm workspaces root
├── BREAKING_CHANGES.md              # Ground truth — 6 intentional breaking APIs
├── MIGRATION_RULES.expected.json    # Expected migration-rule fixture (PatchPilot input)
└── services/
    ├── api/      # Items CRUD  — app.del(), req.param()
    ├── auth/     # Auth        — '/profile/:id?' optional param, res.redirect('back')
    └── billing/  # Billing     — req.param(), '*' wildcard
```

Each service has:
- `app.js` — Express application (the code that gets upgraded)
- `app.test.js` — Node built-in test runner (`node --test`)
- `server.js` — standalone HTTP entry point
- `package.json` — `"express": "^4.x"` dependency

### Running Tests

```bash
# all services (from sample-monorepo/)
npm test

# individual services
npm run test:api
npm run test:auth
npm run test:billing
```

### Running Services

```bash
npm run start:api      # http://127.0.0.1:3001
npm run start:auth     # http://127.0.0.1:3002
npm run start:billing  # http://127.0.0.1:3003
```

---

## 2. PatchPilot

An agentic CLI tool that automates dependency upgrades end-to-end:
copies the repo → naive upgrade → maps impact → loads migration rules →
spawns parallel subagents to fix every breaking change → verifies (green) →
emits report artifacts.

### Structure

```
patchpilot/
├── bin/patchpilot.js                 # CLI entry point
├── web/                              # Web UI (Node http + SSE live log)
└── src/
    ├── orchestrator.js               # Main pipeline coordinator
    ├── config.js                     # Config loading
    ├── analysis/
    │   ├── impactMapper.js           # Scans repo for breaking-API call sites
    │   └── migrationExtractor.js     # Loads migration rules (Bob seam #1)
    ├── planner/
    │   └── taskPlanner.js            # Assigns tasks to subagents per module
    ├── remediation/
    │   ├── subagent.js               # Per-module fixer with self-heal loop (Bob seam #2)
    │   └── transforms.js             # Regex-based code transforms
    ├── verify/
    │   └── testRunner.js             # Runs npm test before/after
    ├── report/
    │   ├── metrics.js                # Builds JSON report
    │   └── migrationNotes.js         # Produces MIGRATION.md
    ├── state/
    │   └── store.js                  # Persists artifacts to .work/<jobId>/
    └── util/
        ├── fsx.js                    # File system helpers (copy, link, list modules)
        └── log.js                    # Coloured console logger
```

### Pipeline (Step by Step)

| Step | Component | What it does |
|------|-----------|-------------|
| 1 | `orchestrator.js` | Resolves config, creates job ID, copies repo to `.work/<jobId>/` |
| 2 | `orchestrator.js` | Bumps dependency version in every service `package.json`, runs `npm install` |
| 3 | `testRunner.js` | **BEFORE** verify — records failing tests |
| 4 | `migrationExtractor.js` | Loads `MigrationRule[]` from JSON fixture (or Bob in full version) |
| 5 | `impactMapper.js` | Scans every source file for call-sites matching each rule |
| 6 | `taskPlanner.js` | Groups affected files by module → one task per module |
| 7 | `subagent.js` | **Parallel** per-module agents: apply transforms → optional per-module test → self-heal |
| 8 | `testRunner.js` | **AFTER** verify — confirms all tests pass |
| 9 | `store.js` | Writes `report.json`, `impact-map.json`, `MIGRATION.md` to `.work/<jobId>/` |

### Running PatchPilot

```bash
# Demo (Express 4 → 5 against sample-monorepo)
cd patchpilot
npm run demo

# Full CLI
node bin/patchpilot.js run --repo ../sample-monorepo --dep express --from 4 --to 5

# Web UI
npm run web   # http://localhost:4300
```

---

## PatchPilot's Two "Bob Seams"

The prototype runs entirely without Bob (deterministic regex). The two integration
points where Bob's intelligence will be wired in are:

### Seam 1 — Migration Knowledge (`src/analysis/migrationExtractor.js`)

**Current (prototype):** reads a pre-authored JSON fixture
(`MIGRATION_RULES.expected.json`) that was written by hand.

**With Bob:** Bob reads the package CHANGELOG / migration guide / CVE advisories
(document understanding) and automatically extracts `MigrationRule[]` — no
hand-authored fixture required. The rest of the pipeline is unchanged.

### Seam 2 — Remediation Agent (`src/remediation/subagent.js` + `transforms.js`)

**Current (prototype):** applies regex transforms; the `MAX_ATTEMPTS` self-heal
loop exists but breaks immediately (no LLM retry).

**With Bob:** Bob's subagent reads each file in full context, applies semantically
correct fixes (not just regex), and if the per-module test still fails it retries
up to `MAX_ATTEMPTS` times — a real self-healing loop.

All other pipeline stages (orchestrator, impact mapper, planner, verifier, reporter)
remain **unchanged** between the prototype and the Bob-integrated version.
