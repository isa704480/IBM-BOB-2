# Express 5 Migration Guide — sample-monorepo

> This document covers **only** the Express 4 → 5 breaking changes that are
> actually used in `sample-monorepo`. Cross-checked against `BREAKING_CHANGES.md`.

---

## Breaking Changes Applied in This Repo

### 1. `app.del()` → `app.delete()` (services/api)

`app.del()` was an alias for `app.delete()` in Express 4. It has been **removed** in Express 5.

| | Code |
|---|---|
| **Before (v4)** | `app.del('/items/:id', handler)` |
| **After (v5)** | `app.delete('/items/:id', handler)` |

**File:** `services/api/app.js` — line ~34

---

### 2. `req.param(name)` → `req.params.name` (services/api, services/billing)

`req.param(name)` was a convenience helper that looked up route params, query
string, and body in sequence. It has been **removed** in Express 5. Use the
explicit source instead.

| | Code |
|---|---|
| **Before (v4)** | `const id = req.param('id')` |
| **After (v5)** | `const id = req.params.id` |

**Files:**
- `services/api/app.js` — lines ~19 and ~36 (route param from URL)
- `services/billing/app.js` — line ~13 (route param from URL)

---

### 3. Optional route parameter `':id?'` → `'{/:id}'` (services/auth)

Express 5 uses **path-to-regexp v8**, which no longer accepts the `?` suffix on
route segments. Optional segments must be wrapped in curly braces.

| | Code |
|---|---|
| **Before (v4)** | `app.get('/profile/:id?', handler)` |
| **After (v5)** | `app.get('/profile{/:id}', handler)` |

**File:** `services/auth/app.js` — line ~7

---

### 4. `res.redirect('back')` → `res.redirect(req.get('Referrer') \|\| '/')` (services/auth)

The magic string `'back'` (which redirected to the `Referer` header) has been
**removed** in Express 5. Equivalent behaviour must be implemented explicitly.

| | Code |
|---|---|
| **Before (v4)** | `res.redirect('back')` |
| **After (v5)** | `res.redirect(req.get('Referrer') \|\| '/')` |

**File:** `services/auth/app.js` — line ~15

> **Security note:** always provide a safe fallback (`'/'`) to prevent open-redirect
> attacks when the `Referer` header is absent or untrusted.

---

### 5. Wildcard route `'*'` → `'/*splat'` (services/billing)

path-to-regexp v8 (bundled in Express 5) no longer accepts a bare `*` wildcard.
Named wildcard segments are required.

| | Code |
|---|---|
| **Before (v4)** | `app.get('*', handler)` |
| **After (v5)** | `app.get('/*splat', handler)` |

**File:** `services/billing/app.js` — line ~21

---

## Summary Table

| # | Service | File | Old API (v4) | New API (v5) | Type |
|---|---------|------|--------------|--------------|------|
| 1 | api | `app.js` | `app.del('/items/:id', …)` | `app.delete('/items/:id', …)` | Method removed |
| 2 | api | `app.js` | `req.param('id')` | `req.params.id` | Accessor removed |
| 3 | auth | `app.js` | `'/profile/:id?'` | `'/profile{/:id}'` | Route syntax (path-to-regexp v8) |
| 4 | auth | `app.js` | `res.redirect('back')` | `res.redirect(req.get('Referrer') \|\| '/')` | Magic string removed |
| 5 | billing | `app.js` | `req.param('id')` | `req.params.id` | Accessor removed |
| 6 | billing | `app.js` | `app.get('*', …)` | `app.get('/*splat', …)` | Wildcard syntax (path-to-regexp v8) |

---

## References

- [Express 5 Migration Guide](https://expressjs.com/en/guide/migrating-5.html)
- [path-to-regexp v8 changelog](https://github.com/pillarjs/path-to-regexp/releases)
- `BREAKING_CHANGES.md` — ground truth for this repo
