/**
 * Netlify serverless function — Verify a Magic Link token and create a session.
 *
 * POST /.netlify/functions/verify-magic-link
 * Body: { token: 'hex-string' }
 *
 * Validates the token against the magic_links table, marks it as used,
 * creates a session, and returns a session token.
 *
 * Environment variables required:
 *   DATABASE_URL     — Neon connection string
 *   SESSION_SECRET   — HMAC secret for signing session tokens
 *   URL              — site URL (auto-set by Netlify)
 */

const crypto = require('crypto');
const { getDb } = require('./shared/db');

/** Session duration: 7 days */
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Create an HMAC-signed session token.
 * Format: base64url(payload).signature
 */
function createSessionToken(email, secret) {
  const payload = JSON.stringify({
    email,
    iat: Date.now(),
    exp: Date.now() + SESSION_DURATION_MS,
  });
  const payloadB64 = Buffer.from(payload).toString('base64url');
  const signature = crypto
    .createHmac('sha256', secret)
    .update(payloadB64)
    .digest('base64url');
  return `${payloadB64}.${signature}`;
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

  const token = body.token;
  if (typeof token !== 'string' || token.length < 32 || token.length > 128) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Invalid token' }),
    };
  }

  const sql = getDb();

  try {
    // Look up the magic link token
    const rows = await sql`
      SELECT id, email, expires_at, used_at
      FROM magic_links
      WHERE token = ${token}
      LIMIT 1
    `;

    if (rows.length === 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Ungültiger oder abgelaufener Link.' }),
      };
    }

    const magicLink = rows[0];

    // Check if already used
    if (magicLink.used_at) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Dieser Link wurde bereits verwendet.' }),
      };
    }

    // Check if expired
    if (new Date(magicLink.expires_at) < new Date()) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Dieser Link ist abgelaufen. Bitte fordern Sie einen neuen an.' }),
      };
    }

    // Mark as used (atomic — prevents replay)
    const updated = await sql`
      UPDATE magic_links
      SET used_at = now()
      WHERE id = ${magicLink.id} AND used_at IS NULL
      RETURNING id
    `;

    if (updated.length === 0) {
      // Another request already used this token (race condition)
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Dieser Link wurde bereits verwendet.' }),
      };
    }

    // Create a session token
    const sessionToken = createSessionToken(magicLink.email, SESSION_SECRET);
    const sessionExpiry = new Date(Date.now() + SESSION_DURATION_MS).toISOString();

    // Store session in DB (allows server-side session invalidation if needed)
    await sql`
      INSERT INTO sessions (email, token, expires_at)
      VALUES (${magicLink.email}, ${sessionToken}, ${sessionExpiry})
    `;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        authenticated: true,
        email: magicLink.email,
        sessionToken,
        expiresAt: sessionExpiry,
      }),
    };
  } catch (err) {
    console.error('Verify magic link error:', err.message || err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Anmeldung fehlgeschlagen.' }),
    };
  }
};

