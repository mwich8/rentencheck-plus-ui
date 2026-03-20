# Backend Infrastructure: Neon Postgres + Custom Auth + Purchase Tracking

**Goal:** Server-side payment verification, purchase tracking, and Magic Link authentication so users can recover purchases and the premium unlock is tamper-proof.

**Architecture:** Netlify Functions (serverless) + Neon Serverless Postgres (DB) + Stripe Webhooks + Resend (transactional emails). Custom HMAC-signed session tokens for authentication (no third-party auth provider).

**Tech Stack:** Angular 21, Neon Postgres (free tier), Stripe, Resend, Netlify Functions (Node 20)

---

## System Architecture

```
┌─────────────────┐     ┌──────────────────────────┐     ┌─────────────────┐
│   Browser (SPA)  │────▶│  Netlify Functions        │────▶│  Neon Postgres   │
│   Angular 21     │     │  (serverless, Node 20)    │     │  (eu-central-1)  │
│                  │     │                            │     │                  │
│  - Calculator    │     │  - create-checkout.js      │     │  - purchases     │
│  - PDF (jsPDF)   │     │  - stripe-webhook.js       │     │  - magic_links   │
│  - Auth signals  │     │  - verify-session.js       │     │  - sessions      │
│  - Purchase list │     │  - verify-download.js      │     │                  │
│                  │     │  - send-magic-link.js       │     └─────────────────┘
│                  │     │  - verify-magic-link.js     │            ▲
│                  │     │  - get-purchases.js         │            │
│                  │     │  - cleanup-expired.js       │     ┌──────┴────────┐
└─────────────────┘     └──────────────────────────┘     │   Resend       │
        │                          ▲                      │   (emails)     │
        │                          │                      └───────────────┘
        ▼                          │
┌─────────────────┐     ┌──────────┴───────────────┐
│   Stripe         │────▶│  stripe-webhook.js        │
│   Checkout       │     │  (signature verified)     │
│                  │     │  → writes purchase to DB   │
│                  │     │  → sends confirmation email│
└─────────────────┘     └──────────────────────────┘
```

---

## Database Schema (Neon Postgres)

**Migration:** `neon/migrations/001_schema.sql`

| Table | Purpose |
|---|---|
| `purchases` | Source of truth for all payments. UUID PK, Stripe IDs, email, tier, amount, status (`pending`/`paid`/`refunded`/`disputed`), `pension_input` (JSONB), `download_token` (UUID). |
| `magic_links` | Passwordless login tokens. Random 32-byte hex token, 15-min expiry, single-use (`used_at`). Rate limited: 5/email/hour. |
| `sessions` | Authenticated user sessions. HMAC-signed tokens (`payload.signature`), 7-day expiry. |

**Cleanup:** `cleanup_expired_tokens()` PL/pgSQL function + Netlify scheduled function (`cleanup-expired.js`) at 03:00 UTC daily.

---

## Authentication Flow (Custom HMAC — No Third-Party Auth)

```
1. User enters email on /meine-kaeufe
   └─▶ POST /.netlify/functions/send-magic-link { email }
       └─▶ Rate check (5/hr) → token → INSERT magic_links → Resend email

2. User clicks email link → /meine-kaeufe?token=abc123...
   └─▶ POST /.netlify/functions/verify-magic-link { token }
       └─▶ SELECT magic_links WHERE token AND NOT used AND NOT expired
       └─▶ Mark used_at → HMAC session → INSERT sessions → return sessionToken

3. Frontend stores session in localStorage
   └─▶ AuthService.currentUser signal updates → effect() loads purchases

4. Authenticated requests pass sessionToken in POST body
   └─▶ get-purchases.js verifies HMAC + expiry → returns purchases for that email
```

**Session Token Format:** `base64url(JSON).base64url(HMAC-SHA256)`
**Payload:** `{ email, exp }`  |  **Secret:** `SESSION_SECRET` env var

---

## Payment Flow

```
1. User clicks "PDF-Report kaufen" on /rechner
   └─▶ Saves pensionInput to sessionStorage
   └─▶ POST /.netlify/functions/create-checkout { tier }
   └─▶ Redirect to Stripe Checkout

2. Stripe payment succeeds → webhook fires
   └─▶ stripe-webhook.js: signature verified → INSERT purchases → Resend confirmation email

3. Stripe redirects to /zahlung-erfolgreich?session_id=cs_...
   └─▶ verify-session: checks Neon DB (webhook usually done), falls back to Stripe API
   └─▶ Returns { verified, email, tier, pensionInput, downloadToken }
   └─▶ Client generates PDF (jsPDF) + stores downloadToken in localStorage

4. Re-download (/meine-kaeufe)
   └─▶ verify-download: checks download_token + status='paid' → client regenerates PDF
```

---

## Files

### Backend (Netlify Functions)
| File | Endpoint | Purpose |
|---|---|---|
| `shared/db.js` | — | Cached Neon `sql` via `@neondatabase/serverless` |
| `create-checkout.js` | `POST /create-checkout` | Creates Stripe Checkout session |
| `stripe-webhook.js` | `POST /stripe-webhook` | Handles `checkout.session.completed`, `charge.refunded`, `charge.dispute.created` |
| `verify-session.js` | `POST /verify-session` | Verifies payment after Stripe redirect |
| `verify-download.js` | `POST /verify-download` | Validates download token for PDF re-generation |
| `send-magic-link.js` | `POST /send-magic-link` | Rate-limited magic link email |
| `verify-magic-link.js` | `POST /verify-magic-link` | Verifies token → creates HMAC session |
| `get-purchases.js` | `POST /get-purchases` | Returns purchases for authenticated user |
| `cleanup-expired.js` | Scheduled (daily 03:00) | Deletes expired magic links and sessions |

### Frontend Services
| File | Purpose |
|---|---|
| `auth.service.ts` | Signal-based auth. Magic link login/logout, session persistence. |
| `purchase.service.ts` | Loads purchases via `get-purchases`. Signals: `purchases()`, `loading()`, `error()`. |
| `premium-unlock.service.ts` | Stores download token. `verifyToken()` gates PDF generation. |
| `stripe-payment.service.ts` | `startCheckout(tier, input)` → sessionStorage + create-checkout + redirect. |

---

## Environment Variables

### Netlify Dashboard
```
DATABASE_URL=postgresql://user:pass@ep-xxx.eu-central-1.aws.neon.tech/neondb?sslmode=require
SESSION_SECRET=<64-char hex — node -e "console.log(require('crypto').randomBytes(32).toString('hex'))">
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_REPORT=price_...     (€14.90)
STRIPE_PRICE_PREMIUM=price_...    (€29.90)
RESEND_API_KEY=re_...
```

### Angular Environments
- `environment.ts` (dev): `freeMode: true` — skips Stripe
- `environment.prod.ts`: `freeMode: false` — Stripe required

---

## Setup Steps

1. **Neon:** [console.neon.tech](https://console.neon.tech) → New Project → run `neon/migrations/001_schema.sql`
2. **Netlify Env Vars:** Add all variables listed above
3. **Stripe Webhook:** Dashboard → Webhooks → `https://rentencheckplus.de/.netlify/functions/stripe-webhook` → events: `checkout.session.completed`, `charge.refunded`, `charge.dispute.created`
4. **Resend:** Verify domain `rentencheckplus.de` (SPF, DKIM, DMARC)
5. **Session Secret:** `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

---

## Security

- **No secrets in frontend** — all sensitive keys are Netlify env vars only
- **HMAC sessions** — constant-time comparison (`crypto.timingSafeEqual`)
- **Stripe webhooks** — signature verified (`constructEvent`)
- **Magic links** — rate limited (5/hr), 15-min expiry, single-use
- **Download tokens** — UUID per purchase, verified server-side before every PDF
- **CORS** — restricted to own site origin on every function
- **CSP** — strict Content-Security-Policy in `netlify.toml`
- **Parameterized queries** — Neon tagged-template `sql` prevents injection
