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

const { getDb } = require('./shared/db');
const { verifySessionToken, verifySessionInDb } = require('./shared/session');

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
  if (typeof sessionToken !== 'string' || sessionToken.length > 2000) {
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
    const sessionValid = await verifySessionInDb(sql, sessionToken);
    if (!sessionValid) {
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


