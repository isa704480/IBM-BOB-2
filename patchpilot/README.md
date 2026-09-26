# PatchPilot (prototip)

> Agentic **dependency-upgrade autopilot** — IBM Bob 2.0 Hackathon.
> Bu **Bob'siz ishlaydigan fixture prototip**: butun `fix → test → yashil` tsiklini
> real ko'rsatadi. Bob kelganda, ikkita aniq joyга ulanadi (pastda).

## Nima qiladi

Bitta buyruq bilan:
1. Target repo'ni izolyatsiyalab **ish papkasiga nusxalaydi** (original tegilmaydi).
2. Dependency'ni **"naive" upgrade** qiladi (`express 4 → 5`) → build **sinadi** (BEFORE).
3. Repo bo'ylab breaking API'larni **xaritalaydi** (impact map).
4. Migration qoidalarini yuklaydi (fixture / Bob).
5. Har modulga **parallel subagent** — tuzatadi + testdan o'tkazadi (self-heal).
6. To'liq **verifikatsiya** (AFTER).
7. **MIGRATION.md + report.json + impact-map.json** yaratadi.

## 🌐 Veb-ilova (interaktiv sayt)

Brauzerda target tanlab **Run** bosasiz → orchestrator ishga tushadi → **jonli log** oqadi → natija (before/after, subagentlar, dep footprint) chiqadi.

```bash
npm run web
# ochish: http://localhost:4300
```

- Tashqi kutubxonasiz (Node ichki `http`) — darrov ishlaydi.
- Backend: `web/server.js` (SSE bilan jonli log), Frontend: `web/index.html`.
- Submission "Application URL" uchun: Render/Railway/Fly kabi joyga deploy qilinadi (statik emas — Node server).

## Ishga tushirish (CLI)

```bash
# 1) target repo tayyor bo'lsin (bir marta)
cd ../sample-monorepo && npm install && cd ../patchpilot

# 2) PatchPilot'ni ishga tushirish
npm run demo
# yoki
node bin/patchpilot.js run --repo ../sample-monorepo --dep express --from 4 --to 5
```

### Natija (namuna)
```
BEFORE: 0 test o'tyapti, build BUZUQ ❌
3 subagent parallel ⚡
AFTER: 11 test o'tyapti, build OK ✅
Merge-ready: YES ✅   (9 fix, 3 modul, ~10s)
```

Chiqarilgan artefaktlar: `.work/<jobId>/` ichida (fixed repo + `.patchpilot/` + `MIGRATION.md`).

## Arxitektura (kod ↔ dizayn)

| Komponent | Fayl |
|---|---|
| Intake / CLI | `bin/patchpilot.js` |
| Orchestrator | `src/orchestrator.js` |
| Impact Mapper | `src/analysis/impactMapper.js` |
| Migration Extractor | `src/analysis/migrationExtractor.js` |
| Task Planner | `src/planner/taskPlanner.js` |
| Remediation Subagent | `src/remediation/subagent.js` + `transforms.js` |
| Verifier | `src/verify/testRunner.js` |
| Reporter | `src/report/*` |
| State | `src/state/store.js` |

## 🔌 Bob 2.0 qayerga ulanadi (2 ta seam)

Prototip deterministik regex bilan ishlaydi. Full versiyada:

1. **`src/analysis/migrationExtractor.js`** — hozir JSON fixture'dan o'qiydi.
   → Bob paket CHANGELOG/CVE'ni **o'qib** (document understanding) qoidalarni o'zi chiqaradi.

2. **`src/remediation/transforms.js` / `subagent.js`** — hozir regex transform.
   → Bob subagenti fayl kontekstini o'qib **o'zi tuzatadi**, test sinsa **o'zini tuzatadi**
     (haqiqiy self-heal loop, `MAX_ATTEMPTS` allaqachon tayyor).

Qolgan pipeline (orchestrator, impact map, planner, verifier, reporter) **o'zgarishsiz** qoladi.

## Litsenziya
MIT
