/**
 * Netlify serverless function — Get purchases for the authenticated user.
 *
 * POST /.netlify/functions/get-purchases
 * Body: { sessionToken: '...' }
 *
 * Validates the session token, then returns all purchases for that email.
 * Replaces the former Supabase RLS-based direct query.
 *
 * Environment variables required:
 *   DATABASE_URL     — Neon connection string
 *   SESSION_SECRET   — HMAC secret for verifying session tokens
 *   URL              — site URL (auto-set by Netlify)
 */

const crypto = require('crypto');
const { getDb } = require('./shared/db');

/**
 * Verify an HMAC-signed session token and extract the email.
 * @returns {{ email: string } | null}
 */
function verifySessionToken(token, secret) {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;

    const [payloadB64, signature] = parts;

    // Verify signature
    const expectedSig = crypto
      .createHmac('sha256', secret)
      .update(payloadB64)
      .digest('base64url');

    // Verify signature (constant-time comparison)
    const sigBuf = Buffer.from(signature);
    const expectedBuf = Buffer.from(expectedSig);

    if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
      return null;
    }

    // Decode and validate payload
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString());

    if (!payload.email || !payload.exp || payload.exp < Date.now()) {
      return null;
    }

    return { email: payload.email };
  } catch {
    return null;
  }
}

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

  const { DATABASE_URL, SESSION_SECRET } = process.env;
  if (!DATABASE_URL || !SESSION_SECRET) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Server misconfigured' }) };
  }

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid request body' }) };
  }

  const { sessionToken } = body;
  if (typeof sessionToken !== 'string' || sessionToken.length > 1000) {
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({ error: 'Invalid session' }),
    };
  }

  // Verify the session token (HMAC signature + expiry)
  const session = verifySessionToken(sessionToken, SESSION_SECRET);
  if (!session) {
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({ error: 'Session expired or invalid' }),
    };
  }

  const sql = getDb();

  try {
    // Also verify session exists in DB (allows server-side revocation)
    const sessionRows = await sql`
      SELECT id FROM sessions
      WHERE token = ${sessionToken} AND expires_at > now()
      LIMIT 1
    `;

    if (sessionRows.length === 0) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Session revoked or expired' }),
      };
    }

    // Fetch purchases for this email
    const purchases = await sql`
      SELECT id, email, stripe_session_id, tier, amount, currency, status,
             pension_input, download_token, created_at, paid_at, refunded_at
      FROM purchases
      WHERE email = ${session.email}
      ORDER BY created_at DESC
    `;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ purchases }),
    };
  } catch (err) {
    console.error('Get purchases error:', err.message || err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to load purchases' }),
    };
  }
};


