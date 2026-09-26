# Atayin qo'yilgan Breaking Change'lar (Express 4 → 5)

> Bu fayl — **ground truth** (javob kaliti). PatchPilot aynan shu o'zgarishlarni
> avtomatik topib, tuzatishi kerak. Demoda "before/after"ni tekshirish uchun ishlatiladi.

Namunaviy repo hozir **Express v4**da ishlaydi (barcha testlar yashil).
`express@5`ga "naive" upgrade qilinganda quyidagilar sinadi:

| # | Servis | Fayl | Eski (v4) API | To'g'ri (v5) fix | Turi |
|---|---|---|---|---|---|
| 1 | api | `app.js` | `app.del('/items/:id', …)` | `app.delete('/items/:id', …)` | metod olib tashlangan |
| 2 | api | `app.js` | `req.param('id')` | `req.params.id` | accessor olib tashlangan |
| 3 | auth | `app.js` | `app.get('/profile/:id?', …)` | `app.get('/profile{/:id}', …)` | route pattern (path-to-regexp v8) |
| 4 | auth | `app.js` | `res.redirect('back')` | `res.redirect(req.get('Referrer') \|\| '/')` | ibora olib tashlangan |
| 5 | billing | `app.js` | `req.param('id')` | `req.params.id` | accessor olib tashlangan |
| 6 | billing | `app.js` | `app.get('*', …)` | `app.get('/*splat', …)` | route pattern (path-to-regexp v8) |

## Naive upgrade'ni ko'rsatish (demo "BEFORE" holati)

```bash
# barcha servislarni express 5 ga majburan ko'tarish
npm i express@^5 -w services/api -w services/auth -w services/billing
npm test   # ← endi qulaydi (routes ro'yxatga olishда throw / assertlar buziladi)
```

Keyin PatchPilot ishga tushib, yuqoridagi 6 ta fix'ni avtomatik qo'llaydi va
testlar yana yashil bo'ladi ("AFTER").

## Manba
- Express 5 migration guide: https://expressjs.com/en/guide/migrating-5.html
- path-to-regexp v8 (Express 5 ichida) route sintaksisi o'zgarishlari
