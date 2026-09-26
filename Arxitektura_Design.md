# PatchPilot — To'liq Arxitektura va Dizayn

> Loyiha: AI Dependency-Upgrade Autopilot (IBM Bob 2.0 Hackathon)
> Hujjat turi: Texnik dizayn (architecture design document)
> Sana: 2026-09-25

---

## 0. Dizayn tamoyillari (design principles)

Butun arxitektura shu 5 tamoyilga asoslanadi:

1. **Module = izolyatsiya birligi.** Parallellik moduldar (yoki paketlar) darajasida bo'ladi — shunda subagentlar bir-birining fayliga urilmaydi (merge conflict kamayadi).
2. **Shared knowledge = read-only.** "Migration Rules" (nima o'zgargani) bir marta chiqariladi va barcha subagentlarga **faqat o'qish uchun** beriladi.
3. **Self-heal (test-driven).** Har bir o'zgarish testdan o'tkaziladi; sinsa — subagent o'zini tuzatadi (cheklangan urinishlar bilan).
4. **Idempotent & resumable.** Har bir Job holati saqlanadi; uzilsa, qayta boshlanmasdan davom etadi.
5. **Human-in-the-loop fallback.** Avtomatik tuzatib bo'lmagan joy "needs human" deb belgilanadi + tushuntirish beriladi (soxta "yashil" bermaydi).

---

## 1. Yuqori darajali arxitektura

Tizim **7 qatlamdan** iborat:

```
┌──────────────────────────────────────────────────────────────┐
│  1. INTAKE / TRIGGER LAYER                                     │
│     CLI  ·  GitHub App webhook  ·  Dashboard tugmasi          │
│     → Job yaratadi                                             │
└───────────────────────────┬──────────────────────────────────┘
                            │  Job{repo, dep, from→to}
                            ▼
┌──────────────────────────────────────────────────────────────┐
│  2. ORCHESTRATION LAYER  ★ (IBM Bob 2.0 — "miya")             │
│     Job'ni boshqaradi, qadamlarni ketma-ket chaqiradi         │
└───┬──────────────┬──────────────┬───────────────┬────────────┘
    │              │              │               │
    ▼              ▼              ▼               ▼
┌────────┐  ┌────────────┐  ┌──────────┐  ┌───────────────┐
│3. IMPACT│  │3. MIGRATION│  │4. TASK   │  │5. REMEDIATION │
│ MAPPER  │  │ KNOWLEDGE  │  │ PLANNER  │  │ SUBAGENTS ⚡  │
│(full-   │  │ EXTRACTOR  │  │          │  │ (parallel)    │
│ repo)   │  │(doc under- │  │          │  │ A · B · … · N │
│         │  │ standing)  │  │          │  │               │
└────┬────┘  └─────┬──────┘  └────┬─────┘  └───────┬───────┘
     │             │              │                │  PatchResult[]
     └─────────────┴──────────────┘                ▼
                                          ┌──────────────────┐
                                          │6. VERIFIER /     │
                                          │   INTEGRATOR     │
                                          │(full build+test) │
                                          └────────┬─────────┘
                                                   │ VerifiedPatch
                                                   ▼
                                          ┌──────────────────┐
                                          │7. REPORTER       │
                                          │ PR + Migration   │
                                          │ Notes + Metrics  │
                                          └────────┬─────────┘
                                                   ▼
                                    ┌──────────────────────────┐
                                    │  DASHBOARD (UI) + STATE   │
                                    │  live progress · before/  │
                                    │  after · diff preview     │
                                    └──────────────────────────┘
```

★ = Bob 2.0 to'g'ridan-to'g'ri ishlaydigan yadro qatlam.

---

## 2. Komponentlar — batafsil

### 2.1. Intake / Trigger Service
- **Vazifa:** Ishni boshlash va `Job` obyektini yaratish.
- **Kirish (3 rejim):**
  - CLI: `patchpilot run --repo ./myrepo --dep express --from 4 --to 5`
  - GitHub App webhook: Dependabot PR ochilganda avtomatik trigger
  - Dashboard: "Run upgrade" tugmasi
- **Chiqish:** `Job` (State Store'ga yoziladi)
- **Bob roli:** yo'q (oddiy servis)
- **Tech:** Node.js CLI (commander) + Express endpoint

### 2.2. Orchestrator (Bob Agent Core) ★
- **Vazifa:** Butun pipeline'ni boshqaruvchi agent. Qadamlarni to'g'ri tartibda chaqiradi, natijalarni yig'adi, qaror qabul qiladi.
- **Mantiq (agent loop):**
  1. Job'ni o'qish
  2. Impact Mapper'ni chaqirish → `ImpactMap`
  3. Migration Extractor'ni chaqirish → `MigrationRules`
  4. Task Planner → `RemediationTask[]`
  5. Subagentlarni **parallel** ishga tushirish
  6. `PatchResult[]`ni yig'ish
  7. Verifier'ni chaqirish
  8. Reporter'ni chaqirish
- **Bob roli:** ★★★ Agent mode + subagent spawn + parallel tasks
- **Tech:** IBM Bob 2.0 agent API + TypeScript orkestrator wrapper

### 2.3. Impact Mapper ★
- **Vazifa:** Paketning butun repo bo'ylab **har bir ishlatilishini** topib, ta'sir zonasini xaritalash.
- **Qanday:** 2 bosqichli —
  1. **Tez skan (statik):** `grep`/AST bilan barcha `import`, `require`, API chaqiruvlarini topish (nomzodlar).
  2. **Semantik tekshirish (Bob):** full-repo context bilan haqiqiy ta'sirni tasdiqlash (masalan, transitive usage, re-export).
- **Chiqish:** `ImpactMap` — modul bo'yicha guruhlangan fayllar + call site'lar.
- **Bob roli:** ★★★ Full repository context
- **Tech:** ripgrep + ts-morph (AST) + Bob semantic query

### 2.4. Migration Knowledge Extractor ★
- **Vazifa:** "Nima o'zgardi?" bilimini chiqarish.
- **Kirish manbalari:** paket CHANGELOG, rasmiy migration guide, CVE advisory, GitHub release notes.
- **Chiqish:** `MigrationRule[]` — har biri: eski API → yangi API + transformatsiya qoidasi + izoh.
- **Bob roli:** ★★★ Document understanding
- **Tech:** Bob document reader + (kerak bo'lsa) WebFetch changelog uchun

### 2.5. Task Planner
- **Vazifa:** `ImpactMap` + `MigrationRules`ni birlashtirib, **modul bo'yicha diskret vazifalar** yaratish (parallellik birligi).
- **Mantiq:** har bir modul uchun → o'sha moduldagi ta'sirlangan fayllar + tegishli migration rule'lar = 1 ta `RemediationTask`.
- **Chiqish:** `RemediationTask[]` (Task Queue)
- **Bob roli:** ★ (yengil — guruhlash mantig'i)
- **Tech:** oddiy TypeScript logic

### 2.6. Remediation Subagents (parallel) ⚡★
- **Vazifa:** Har bir subagent **bitta modulni** tuzatadi.
- **Ichki tsikl (self-heal):**
  ```
  apply patch → run module tests →
      test ✅ → PatchResult(success)
      test ❌ → xatoni o'qish → tuzatish → qayta (max 3 urinish)
                 → hali ❌ → PatchResult(needs_human + sabab)
  ```
- **Izolyatsiya:** har subagent faqat o'z modul fayllarida ishlaydi (read-only shared rules).
- **Chiqish:** `PatchResult` (diff + test status + urinishlar soni)
- **Bob roli:** ★★★ Subagents + Agent mode + parallel tasks
- **Tech:** Bob subagent instance × N + izolyatsiyalangan test runner

### 2.7. Verifier / Integrator
- **Vazifa:** Barcha modul patch'larini birlashtirib, **butun build + full test suite**ni tekshirish.
- **Mantiq:**
  1. Barcha patch'larni bitta branch'ga merge qilish
  2. To'liq testni ishga tushirish
  3. Cross-module konfliktlar bo'lsa → tegishli subagent'ga qaytarish (cheklangan retry)
- **Chiqish:** `VerifiedPatch` (yoki konflikt hisoboti)
- **Bob roli:** ★★ (konflikt tahlili uchun Bob)
- **Tech:** git + CI test runner (child_process)

### 2.8. Reporter
- **Vazifa:** Yakuniy artefaktlarni ishlab chiqarish.
- **Chiqish (3 ta):**
  1. **Pull Request** (GitHub API orqali, tayyor diff bilan)
  2. **Migration Notes** (avtomatik `MIGRATION.md`: nima, nega o'zgardi)
  3. **RunReport** (before/after metrikalar)
- **Bob roli:** ★★ (Migration Notes matni Bob tomonidan yoziladi)
- **Tech:** Octokit (GitHub) + Markdown generator

### 2.9. Dashboard (UI)
- **Vazifa:** Live jarayonni va natijalarni ko'rsatish (Presentation quvvati!).
- **Ekranlar:**
  - Job progress (real-time subagent holati: A ✅, B ⚡, C ⏳)
  - Before/After metrikalar (Chart.js)
  - Diff preview + PR link
- **Tech:** Next.js + Chart.js + WebSocket/SSE (live update)

### 2.10. State Store
- **Vazifa:** Job holati, run loglar, artefaktlarni saqlash (idempotent/resumable uchun).
- **Tech:** SQLite (MVP) yoki JSON fayllar; katta hajmda → Postgres + Redis queue

---

## 3. Ma'lumot modellari (data schemas)

### Job
```json
{
  "id": "job_2f8a",
  "repoPath": "/repos/sample-monorepo",
  "dependency": "express",
  "fromVersion": "4.18.0",
  "toVersion": "5.0.0",
  "trigger": "cli | webhook | dashboard",
  "status": "queued | mapping | remediating | verifying | done | failed",
  "createdAt": "2026-09-25T18:00:00Z"
}
```

### ImpactMap
```json
{
  "jobId": "job_2f8a",
  "modules": [
    {
      "name": "services/api",
      "files": [
        { "path": "services/api/routes.js", "callSites": ["app.del(", "req.param("] }
      ]
    },
    { "name": "services/auth", "files": [ /* ... */ ] }
  ],
  "totalFiles": 12,
  "totalCallSites": 27
}
```

### MigrationRule
```json
{
  "id": "rule_del_delete",
  "oldApi": "app.del()",
  "newApi": "app.delete()",
  "transformation": "rename-method",
  "severity": "breaking",
  "source": "express v5 changelog",
  "note": "app.del() olib tashlandi, app.delete() ishlatilsin"
}
```

### RemediationTask
```json
{
  "id": "task_api",
  "module": "services/api",
  "files": ["services/api/routes.js"],
  "rules": ["rule_del_delete", "rule_req_param"],
  "assignedSubagent": "subagent-1"
}
```

### PatchResult
```json
{
  "taskId": "task_api",
  "status": "success | needs_human",
  "diff": "--- routes.js ...",
  "testStatus": "passed | failed",
  "attempts": 2,
  "humanReason": null
}
```

### RunReport (before/after)
```json
{
  "jobId": "job_2f8a",
  "filesChanged": 12,
  "modulesFixed": 3,
  "testsBefore": { "passed": 40, "failed": 18 },
  "testsAfter":  { "passed": 58, "failed": 0 },
  "mergeReady": true,
  "durationSeconds": 372,
  "manualEstimateMinutes": 120,
  "timeSavedPercent": 95
}
```

---

## 4. To'liq oqim (end-to-end sequence)

```
User/Webhook        Orchestrator      Impact   Migration   Subagents   Verifier   Reporter
    │                    │            Mapper   Extractor    (⚡ N)         │          │
    │ Job so'rovi ──────►│               │         │           │           │          │
    │                    │─ map ────────►│         │           │           │          │
    │                    │◄─ ImpactMap ──│         │           │           │          │
    │                    │─ extract ───────────────►│           │           │          │
    │                    │◄─ MigrationRules ────────│           │           │          │
    │                    │─ plan (internal) ──────────────────► RemediationTask[]      │
    │                    │─ spawn parallel ────────────────────►│           │          │
    │                    │                                       │ (self-heal loop)     │
    │                    │◄────────── PatchResult[] ─────────────│           │          │
    │                    │─ verify ─────────────────────────────────────────►│         │
    │                    │◄──────────── VerifiedPatch ───────────────────────│         │
    │                    │─ report ───────────────────────────────────────────────────►│
    │◄── PR + Notes + Metrics ───────────────────────────────────────────────────────│
```

---

## 5. Subagent ichki dizayni (self-heal loop)

```
        ┌─────────────────────────────┐
        │   RemediationTask qabul qil │
        └──────────────┬──────────────┘
                       ▼
        ┌─────────────────────────────┐
        │ Migration rule'ni fayllarga │
        │ qo'lla (Bob edit)           │
        └──────────────┬──────────────┘
                       ▼
        ┌─────────────────────────────┐
        │ Modul testini ishga tushir  │
        └──────────────┬──────────────┘
              ┌─────────┴─────────┐
        test ✅                 test ❌
              │                   │
              ▼                   ▼
    ┌──────────────┐    ┌────────────────────┐
    │ PatchResult  │    │ attempts < 3 ?      │
    │  success     │    └─────────┬───────────┘
    └──────────────┘         ha   │   yo'q
                              ▼    ▼
                  ┌─────────────┐ ┌────────────────────┐
                  │ Xatoni o'qi │ │ needs_human + sabab │
                  │ + qayta     │ └────────────────────┘
                  │ tuzat       │
                  └──────┬──────┘
                         └──► (testga qayt)
```

---

## 6. Parallellik va izolyatsiya modeli (concurrency)

- **Birlik:** 1 modul = 1 subagent = 1 izolyatsiyalangan branch/worktree.
- **Nega modul darajasi:** fayllar kesishmaydi → **merge conflict deyarli yo'q**.
- **Shared context:** `MigrationRules` hammaga read-only (bir marta hisoblanadi, qayta-qayta emas → tejamkor).
- **Konkurent limit:** parallellik CPU/test resursiga qarab cheklanadi (masalan 4–8 subagent).
- **Aggregation:** Orchestrator barcha `PatchResult`larni kutadi (fan-out → fan-in pattern).

```
        Orchestrator
             │ fan-out
   ┌─────────┼─────────┬─────────┐
   ▼         ▼         ▼         ▼
 [SA-1]    [SA-2]    [SA-3]    [SA-4]   ← parallel, izolyatsiyalangan
 modA      modB      modC      modD
   └─────────┴─────────┴─────────┘
             │ fan-in (barcha natija)
             ▼
          Verifier
```

---

## 7. Bob 2.0 xususiyatlari — qayerda ishlatiladi (mapping)

| Bob 2.0 xususiyati | Komponent | Aniq foydalanish |
|---|---|---|
| 🧠 Full repository context | Impact Mapper, Verifier | Ta'sir zonasi + cross-module bog'liqlik |
| 📄 Document understanding | Migration Extractor, Reporter | CHANGELOG/CVE o'qish + Migration Notes yozish |
| 👥 Subagents | Remediation Subagents | Har modulga mustaqil agent |
| ⚡ Parallel tasks | Orchestrator | Barcha modul bir vaqtda |
| 🤖 Agent mode | Orchestrator, Subagent | Avtonom apply→test→fix tsikli |

> Bu jadval **Application of Technology** mezoni uchun to'g'ridan-to'g'ri dalil — submissionga qo'ying.

---

## 8. Xatoliklarni boshqarish (error handling)

| Holat | Yechim |
|---|---|
| Subagent test'ni tuzata olmadi | 3 urinishdan keyin `needs_human` + tushuntirish (soxta yashil yo'q) |
| Cross-module konflikt | Verifier tegishli subagent'ga qaytaradi (bounded retry) |
| Migration rule noaniq/topilmadi | Konservativ rejim: o'zgartirmaydi, "manual review" belgisi |
| Bob access/timeout | Job holati saqlangan → resume qiladi (idempotent) |
| Test suite yo'q | Ogohlantirish: "verifikatsiya cheklangan" (hisobotда shaffof) |

---

## 9. Papka strukturasi

### Vosita (PatchPilot repo)
```
patchpilot/
├── src/
│   ├── intake/          # CLI + webhook + dashboard trigger
│   ├── orchestrator/    # Bob agent core (asosiy loop)
│   ├── analysis/
│   │   ├── impactMapper.ts
│   │   └── migrationExtractor.ts
│   ├── planner/         # taskPlanner.ts
│   ├── remediation/     # subagent.ts (self-heal loop)
│   ├── verify/          # verifier.ts
│   ├── report/          # prBuilder.ts, migrationNotes.ts, metrics.ts
│   └── state/           # store (sqlite/json)
├── dashboard/           # Next.js UI
├── samples/             # demo uchun namunaviy monorepo
├── LICENSE              # MIT (majburiy!)
└── README.md
```

### Namunaviy repo (demo target)
```
sample-monorepo/
├── package.json         # express ^4 (atayin eski)
├── services/
│   ├── api/             # app.del(), req.param() — breaking API'lar
│   ├── auth/
│   └── billing/
└── tests/               # tez ishlaydigan testlar (demo uchun muhim)
```

---

## 10. Tech stack (komponent bo'yicha)

| Komponent | Texnologiya |
|---|---|
| AI yadro | **IBM Bob 2.0** (agent + subagents) |
| Orchestrator | TypeScript / Node.js |
| Static analysis | ripgrep + ts-morph (AST) |
| Git/PR | simple-git + Octokit (GitHub API) |
| Test runner | child_process → `npm test` / `pytest` |
| Dashboard | Next.js + Chart.js + SSE |
| State | SQLite (MVP) → Postgres+Redis (scale) |
| Hosting | Vercel/Netlify (dashboard demo URL) |

---

## 11. Deployment arxitekturasi

```
┌────────────┐     ┌──────────────────┐     ┌───────────────┐
│  Dashboard │────►│  PatchPilot API  │────►│  IBM Bob 2.0  │
│ (Vercel)   │ SSE │  (Node service)  │     │  (agent host) │
└────────────┘     └────────┬─────────┘     └───────────────┘
                            │
                   ┌────────┴────────┐
                   │  Git / GitHub    │  (repo o'qish + PR ochish)
                   └──────────────────┘
```

- MVP uchun hammasi **bitta mashinada** (lokal) ham ishlaydi — demo uchun yetarli.

---

## 12. MVP vs Full — 48 soatda nima shart?

| Komponent | MVP (48h) | Full (keyin) |
|---|---|---|
| Intake | ✅ CLI yetarli | + Webhook + Dashboard tugma |
| Orchestrator | ✅ shart | + resume, queue |
| Impact Mapper | ✅ shart (1 dep) | + ko'p dep, transitive |
| Migration Extractor | ✅ shart (1 changelog) | + CVE feed, ko'p manba |
| Subagents | ✅ 2–3 parallel | + 8+, retry policy |
| Verifier | ✅ oddiy full-test | + smart conflict routing |
| Reporter | ✅ PR + Notes + metrics | + boy hisobot |
| Dashboard | ✅ before/after (Chart.js) | + live SSE, diff viewer |
| State | ✅ JSON fayl | + SQLite/Postgres |

> **48h fokus:** CLI → Bob orchestrator → 2-3 subagent parallel → PR + before/after dashboard. Qolgani "future work" sifatida slaydda ko'rsatiladi.

---

## 13. Xavfsizlik va cheklovlar

- 🔒 Repo kodi konteyner/izolyatsiyada ishlansin (untrusted kod uchun).
- 🔑 GitHub token faqat kerakli scope bilan (PR ochish).
- 📜 Chiqarilgan kod MIT + open source (Terms talabi).
- ⚠️ Bob 2.0 commercial use — kelajakdagi mahsulot uchun IBM shartlarini tekshirish.
- 🧪 Test suite bo'lmagan repolarda verifikatsiya cheklangan — buni hisobotda shaffof ko'rsatish.

---

## 14. Keyingi qadam

Tayyor bo'lganda:
1. **Namunaviy monorepo**'ni (atayin sindirilgan) yaratib beraman — Bob access kutmasdan tayyor turadi.
2. Orchestrator skeleton (TypeScript) + data model fayllarini yozib beraman.
3. Dashboard mockup'ini qilib beraman.

Qaysi biridan boshlaymiz?
