# sample-monorepo — PatchPilot demo target

Bu — **PatchPilot** (IBM Bob 2.0 Hackathon) uchun namunaviy target repo.
Uchta servisdan iborat kichik monorepo bo'lib, **Express v4** ustida ishlaydi
va **Express v5**ga o'tganda atayin **sinadigan** breaking API'lardan foydalanadi.

PatchPilot'ning vazifasi: `express 4 → 5` upgrade'ini qilib, barcha breaking
change'larni butun repo bo'ylab parallel subagentlar bilan avtomatik tuzatish.

## Struktura

```
sample-monorepo/
├── services/
│   ├── api/       # Items CRUD  — app.del(), req.param()
│   ├── auth/      # Auth        — ':id?' optional param, res.redirect('back')
│   └── billing/   # Billing     — req.param(), '*' wildcard
├── BREAKING_CHANGES.md          # ground truth (javob kaliti)
├── MIGRATION_RULES.expected.json # kutilgan migration rules (fixture)
└── package.json                 # npm workspaces
```

Har bir servis = **1 modul** = PatchPilot arxitekturasida **1 subagent birligi**.

## O'rnatish

```bash
npm install
```

## Testlar

```bash
npm test              # barcha servislar
npm run test:api      # faqat api
npm run test:auth     # faqat auth
npm run test:billing  # faqat billing
```

Hozirgi holat (**BEFORE — v4**): barcha testlar **yashil** ✅

## Servislarni ishga tushirish

```bash
npm run start:api      # http://127.0.0.1:3001
npm run start:auth     # http://127.0.0.1:3002
npm run start:billing  # http://127.0.0.1:3003
```

## Demo "BEFORE broken" holatini ko'rsatish

```bash
npm i express@^5 -w services/api -w services/auth -w services/billing
npm test   # ← sinadi (breaking change'lar tufayli)
```

Keyin PatchPilot ishga tushib, `BREAKING_CHANGES.md`dagi 6 ta fix'ni avtomatik
qo'llaydi → testlar yana yashil ("AFTER").

## Litsenziya
MIT
