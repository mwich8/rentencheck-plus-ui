# Backend Infrastructure: Supabase + Auth + Purchase Tracking

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add server-side payment verification, purchase tracking, and Magic Link authentication so users can recover purchases and the premium unlock is tamper-proof.

**Architecture:** Netlify Functions (serverless) + Supabase (Postgres DB + Auth). Stripe webhooks write purchase records to Supabase. The frontend verifies payments server-side before unlocking premium. Magic Link login enables purchase recovery on any device.

**Tech Stack:** Angular 21, Supabase (free tier), Stripe Webhooks, Netlify Functions

---

## What Was Built

### New Files Created
| File | Purpose |
|---|---|
| `supabase/migrations/001_purchases.sql` | Database schema: `purchases` table, RLS policies, auto-link trigger |
| `netlify/functions/stripe-webhook.js` | Stripe webhook → writes purchases to Supabase |
| `netlify/functions/verify-session.js` | Verifies payment before unlocking premium |
| `src/app/core/services/supabase.service.ts` | Singleton Supabase client for the browser |
| `src/app/core/services/auth.service.ts` | Magic Link login/logout via Supabase Auth |
| `src/app/core/services/purchase.service.ts` | Query purchase history from Supabase |
| `src/app/features/purchases/purchases-page.component.*` | "Meine Käufe" page (login + purchase list + PDF re-download) |

### Modified Files
| File | Change |
|---|---|
| `src/environments/environment.model.ts` | Added `supabase: { url, anonKey }` |
| `src/environments/environment.ts` | Added Supabase config (dev) |
| `src/environments/environment.prod.ts` | Added Supabase config (prod) |
| `netlify/functions/create-checkout.js` | Now sends `pensionInput` in Stripe metadata |
| `src/app/core/services/stripe-payment.service.ts` | Sends pension input to checkout function |
| `src/app/features/payment/payment-success.component.ts` | Verifies payment server-side before unlocking |
| `src/app/features/payment/payment-success.component.html` | Added "verifying" state UI |
| `src/app/app.routes.ts` | Added `/meine-kaeufe` route |
| `netlify.toml` | Added `*.supabase.co` to CSP `connect-src` |

---

## Setup Steps (YOU need to do these manually)

### 1. Create Supabase Project
1. Go to [supabase.com](https://supabase.com) → "New Project"
2. Name: `rentencheck-plus`, Region: `eu-central-1` (Frankfurt)
3. Save the **project URL** and **anon key** from Settings → API

### 2. Run Database Migration
1. In Supabase Dashboard → SQL Editor
2. Paste the contents of `supabase/migrations/001_purchases.sql`
3. Click "Run"

### 3. Configure Environment Variables

**In the Angular environment files:**
- `src/environments/environment.ts` → fill `supabase.url` and `supabase.anonKey`
- `src/environments/environment.prod.ts` → fill `supabase.url` and `supabase.anonKey`

**In Netlify Dashboard → Site Settings → Environment Variables:**
```
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SERVICE_KEY=eyJ...   (Settings → API → service_role key — NEVER expose in frontend!)
STRIPE_WEBHOOK_SECRET=whsec_...
```

### 4. Create Stripe Webhook
1. Stripe Dashboard → Developers → Webhooks → "Add endpoint"
2. URL: `https://rentencheckplus.de/.netlify/functions/stripe-webhook`
3. Events to listen for:
   - `checkout.session.completed`
   - `charge.refunded`
4. Copy the **Signing Secret** (`whsec_...`) → add to Netlify env vars as `STRIPE_WEBHOOK_SECRET`

### 5. Configure Supabase Auth
1. Supabase Dashboard → Authentication → URL Configuration
2. Set **Site URL**: `https://rentencheckplus.de`
3. Add **Redirect URLs**: `https://rentencheckplus.de/meine-kaeufe`
4. Email Templates (optional): customize the magic link email text in German

---

## Security Architecture

```
Browser (anon key)     →  Supabase (RLS: read own purchases only)
                          ↑
Netlify Functions       →  Supabase (service_role key: full write access)
(stripe-webhook,           - Only server-side functions can insert/update
 verify-session)           - Browser can only SELECT where email matches JWT
                          
Stripe                 →  stripe-webhook (signature verified with whsec_...)
```

- **anon key** = safe in browser, RLS restricts access
- **service_role key** = only in Netlify env vars, never in frontend code
- **Webhook signature** = prevents spoofed events from reaching Supabase

