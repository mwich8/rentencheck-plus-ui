/**
 * Netlify serverless function — Verify a Stripe Checkout session.
 *
 * POST /.netlify/functions/verify-session
 * Body: { sessionId: 'cs_test_...' }
 *
 * Called by the frontend after Stripe redirects back to /zahlung-erfolgreich.
 * Checks:
 *   1. Neon `purchases` table for a 'paid' record (fastest — webhook already ran)
 *   2. Falls back to Stripe API if webhook hasn't been processed yet
 *
 * Returns: { verified: true, email, tier, downloadToken } or { verified: false, reason }
 *
 * Environment variables required:
 *   STRIPE_SECRET_KEY   — sk_test_... or sk_live_...
 *   DATABASE_URL        — Neon Postgres connection string
 *   URL                 — site URL (auto-set by Netlify)
 */

const crypto = require('crypto');
const stripe = require('stripe');
const { getDb } = require('./shared/db');

exports.handler = async (event) => {
  const siteUrl = process.env.URL || 'http://localhost:4200';
  const headers = {
    'Access-Control-Allow-Origin': siteUrl,
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const { STRIPE_SECRET_KEY, DATABASE_URL } = process.env;
  if (!STRIPE_SECRET_KEY || !DATABASE_URL) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Server misconfigured' }) };
  }

  // Parse and validate request
  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid request body' }) };
  }

  const { sessionId } = body;
  if (typeof sessionId !== 'string' || !sessionId.startsWith('cs_') || sessionId.length > 200) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ verified: false, reason: 'Invalid session ID' }),
    };
  }

  const sql = getDb();

  try {
    // 1. Check Neon DB first (webhook may have already processed this)
    const rows = await sql`
      SELECT email, tier, status, pension_input, download_token
      FROM purchases
      WHERE stripe_session_id = ${sessionId}
      LIMIT 1
    `;

    if (rows.length > 0 && rows[0].status === 'paid') {
      const purchase = rows[0];
      let downloadToken = purchase.download_token;

      // Generate a download token if one doesn't exist yet
      if (!downloadToken) {
        downloadToken = crypto.randomUUID();
        await sql`
          UPDATE purchases SET download_token = ${downloadToken}
          WHERE stripe_session_id = ${sessionId}
        `;
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          verified: true,
          email: purchase.email,
          tier: purchase.tier,
          pensionInput: purchase.pension_input,
          downloadToken,
        }),
      };
    }

    // 2. Fallback: check Stripe directly (webhook might be delayed)
    const stripeClient = stripe(STRIPE_SECRET_KEY);
    const session = await stripeClient.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== 'paid') {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ verified: false, reason: 'Payment not completed' }),
      };
    }

    // Webhook hasn't arrived yet — insert the purchase ourselves
    const email = (session.customer_details?.email || session.customer_email || '').toLowerCase();
    const tier = session.metadata?.tier || 'report';
    const downloadToken = crypto.randomUUID();

    let pensionInput = null;
    if (session.metadata?.pension_input) {
      try {
        pensionInput = JSON.parse(session.metadata.pension_input);
      } catch { /* corrupted metadata — skip */ }
    }

    await sql`
      INSERT INTO purchases (
        stripe_session_id, stripe_customer_id, stripe_payment_intent,
        email, tier, amount, currency, status, pension_input, paid_at, download_token
      ) VALUES (
        ${session.id}, ${session.customer || null}, ${session.payment_intent || null},
        ${email}, ${tier}, ${session.amount_total || 0}, ${session.currency || 'eur'},
        'paid', ${pensionInput ? JSON.stringify(pensionInput) : null}::jsonb,
        ${new Date().toISOString()}, ${downloadToken}
      )
      ON CONFLICT (stripe_session_id)
      DO UPDATE SET
        status = 'paid',
        paid_at = COALESCE(purchases.paid_at, EXCLUDED.paid_at),
        download_token = COALESCE(purchases.download_token, EXCLUDED.download_token)
    `;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ verified: true, email, tier, pensionInput, downloadToken }),
    };
  } catch (err) {
    console.error('Verify session error:', err.message || err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ verified: false, reason: 'Verification failed' }),
    };
  }
};
