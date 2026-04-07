# User Accounts & Cloud Settings Sync

**Date:** 2026-04-07
**Goal:** Enable users to register/login and sync calculator settings across devices. Support PDF download and purchase recovery from any device.

**Architecture Decision: NO separate Java/Spring backend needed.**

---

## Why Not a Separate Backend Service?

The existing architecture already provides everything needed:

| Capability | Already Have | Via |
|---|---|---|
| Serverless API | ✅ | Netlify Functions (Node 20, AWS Lambda) |
| PostgreSQL Database | ✅ | Neon Serverless Postgres |
| Passwordless Auth | ✅ | Magic Links (HMAC sessions) |
| Email Delivery | ✅ | Resend |
| Session Management | ✅ | `sessions` table + HMAC tokens |
| Purchase Tracking | ✅ | `purchases` table + Stripe webhooks |

Adding a Java/Spring Boot service on Cloud Run would introduce:
- ❌ Docker container management & CI/CD pipeline
- ❌ JVM cold-start latency (3-8s on Cloud Run)
- ❌ Separate CORS configuration between two backends
- ❌ Monthly compute cost (~$5-15/mo minimum)
- ❌ Dual infrastructure maintenance

**Instead:** 2 new Netlify functions + 1 DB migration. Zero new infrastructure.

---

## What Was Built

### Database (Migration 003)
- `users` table: `id`, `email` (unique), `settings` (JSONB), `created_at`, `updated_at`
- Auto-updated `updated_at` trigger
- Users auto-created on first magic link login (upsert in `verify-magic-link.js`)

### Backend (Netlify Functions)
| File | Endpoint | Purpose |
|---|---|---|
| `shared/session.js` | — | Extracted shared session verification (DRY refactor) |
| `save-settings.js` | `POST /save-settings` | Authenticated upsert of PensionInput to `users.settings` |
| `get-settings.js` | `POST /get-settings` | Authenticated retrieval of saved settings |
| `verify-magic-link.js` | `POST /verify-magic-link` | **Modified:** now upserts `users` row on login |
| `get-purchases.js` | `POST /get-purchases` | **Refactored:** uses `shared/session.js` |

### Frontend (Angular)
| File | Purpose |
|---|---|
| `settings.service.ts` | Cloud save/load with signals, inFlight guards, error handling |
| `settings.service.spec.ts` | Unit tests for all save/load scenarios |
| `input-panel.component.ts` | **Modified:** accepts `initialSettings` input for cloud pre-fill |
| `calculator-page.component.ts` | **Modified:** integrates SettingsService, auto-loads on login |
| `calculator-page.component.html` | **Modified:** save button + user badge in navbar |
| `calculator-page.component.scss` | **Modified:** cloud sync bar styles |

---

## User Flow

```
1. User visits /rechner → calculator works 100% anonymously (no change)

2. User visits /meine-kaeufe → enters email → receives magic link

3. User clicks magic link → verify-magic-link:
   a. Validates token (existing)
   b. Creates HMAC session (existing)
   c. Upserts into `users` table (NEW — auto-registration)

4. User navigates to /rechner (logged in):
   a. Navbar shows "👤 user@example.com"
   b. SettingsService.loadSettings() fires automatically
   c. If saved settings exist → InputPanel pre-fills with cloud values
   d. "☁️ Einstellungen speichern" button appears below inputs

5. User adjusts calculator → clicks "Einstellungen speichern":
   a. POST /save-settings { sessionToken, settings }
   b. Upserts into users.settings JSONB
   c. Button shows "✅ Gespeichert" for 3 seconds

6. User opens another device → logs in → settings auto-loaded → same values
```

---

## Security

- All settings endpoints require valid HMAC session token + DB session check
- Settings payload size limited to 50 KB
- Settings validated through PensionInputValidator.sanitize() on load
- No user passwords stored — magic link only (passwordless)
- Session verification extracted to shared module (constant-time HMAC comparison)

