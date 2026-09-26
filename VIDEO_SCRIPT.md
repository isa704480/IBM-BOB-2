# Demo Video Script — PatchPilot (≤ 5 min)

> **Goal:** show the product **in motion**, not read text off a slide. Every scene has an
> on-screen **SUBTITLE** (big, short caption) so the video is fully clear **even with no voice**.
> Voiceover is optional — if you narrate, keep it calm and short (the subtitle is the anchor).
>
> **Style:** screen recording, clean cursor, no dead air. Subtitle = one line, bottom-center,
> large. Cut between scenes; don't linger on static text.
>
> **Record:** OBS / Xbox Game Bar (`Win+G`). Subtitles: add in CapCut / Clipchamp, or type them
> live as an overlay. Resolution 1080p, cursor visible.

---

## Timeline

| # | Time | ON SCREEN (what you show / do) | SUBTITLE (on-screen caption) | Voiceover (optional) |
|---|------|-------------------------------|------------------------------|----------------------|
| 1 | 0:00–0:15 | A GitHub "Dependabot" PR that failed CI (or the landing hero). Slight zoom. | **"Dependabot bumps the version… and breaks your build."** | "Every team knows this PR. It never merges." |
| 2 | 0:15–0:35 | PatchPilot **landing page** (`localhost:4300`) — scroll slowly through hero → "How it works" (motion plays). | **"PatchPilot fixes the breaking changes — across the whole repo."** | "PatchPilot does the upgrade AND the fixes." |
| 3 | 0:35–0:55 | Landing "Not another linter" section + stats (0→11, ~99%). | **"Detection is solved. PatchPilot does the remediation."** | — |
| 4 | 0:55–1:10 | Click **Get started → Register** (Apple-glass form), submit → lands on **Console**. | **"One click to the console."** | — |
| 5 | 1:10–2:30 | **THE DEMO.** Console: pick **sample-monorepo**, click **Run**. Live terminal streams. Let it finish. | **"Watch it run: express 4 → 5, live."** → then **"BEFORE: 0 tests. Build broken."** → **"3 subagents fixing in parallel…"** → **"AFTER: 11 / 11 green. Merge-ready."** | "Naive upgrade — build's broken. Now three subagents fix each module in parallel… and it's green." |
| 6 | 2:30–3:05 | Console results: **before/after bar (0 → 11)**, subagent cards, dependency footprint, migration table. Hover a couple. | **"6 fixes, 3 modules, verified — in seconds."** | "Every change is verified by the test suite." |
| 7 | 3:05–3:35 | Switch console target to **Sovereign** (real Next.js app), Run. Show typecheck OK + **"3 → Bob" needs_bob** flag. | **"On a real repo, it flags what needs true reasoning."** | "On our real app, it found 3 semantic changes only an agent can do — and flagged them, honestly." |
| 8 | 3:35–4:25 | **IBM Bob IDE.** Open the finished task: **Todo 3/3**, the **fixes table**, **AFTER 11/11**, and the **1.41 Bobcoins** badge. | **"IBM Bob 2.0 did the real migration — for 1.41 Bobcoins."** | "This is Bob doing it for real: read the repo, extract the rules, fix all six, drive tests to green — 1.41 Bobcoins." |
| 9 | 4:25–4:45 | Split view: `AGENTS.md` + `migrationExtractor.js` / `subagent.js` (the two "Bob seams" highlighted). | **"Two seams: Bob = migration knowledge + remediation."** | "Bob plugs into exactly two places; the rest of the pipeline is unchanged." |
| 10 | 4:45–5:00 | Back to landing hero / logo. End card. | **"PatchPilot — stop babysitting dependency PRs."** | "PatchPilot. Built with IBM Bob 2.0." |

---

## Pre-record checklist
- [ ] `cd patchpilot && npm run site` → open `http://localhost:4300` (landing + console live).
- [ ] Reset the **sample** fixture so the run shows 0 → 11 (it already does — fixture is v4).
- [ ] For scene 7 (Sovereign), add it in the console or have the result ready.
- [ ] Bob IDE open on the finished task (scene 8) — the 1.41 Bobcoins badge visible.
- [ ] Close notifications, hide bookmarks, 1080p, clean desktop.
- [ ] Total ≤ 5:00. If tight, trim scene 3 and 9 first.

## Subtitle style (keep consistent)
- One short line, **bottom-center**, large bold, high contrast (white text + subtle dark strip).
- Appears as the action starts; changes with the action — never a wall of text.
- Each subtitle above = exactly what to put on screen.

## The 4 judging criteria this hits
- **Application of Technology** → scene 8–9 (Bob doing the real work + the seams).
- **Business Value** → scenes 5–6 (0→11, seconds, 1.41 coins).
- **Originality** → scenes 3, 7 (remediation, not detection; honest needs_bob flag).
- **Presentation** → the whole thing: motion, live demo, clean subtitles, ≤5 min.
