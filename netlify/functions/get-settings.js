/**
 * Netlify serverless function — Get saved user settings (calculator inputs).
 *
 * POST /.netlify/functions/get-settings
 * Body: { sessionToken: '...' }
 *
 * Validates the session, then returns the user's saved settings from the users table.
 * Returns { settings: null } if no settings have been saved yet.
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

  // Parse request body
  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid request body' }) };
  }

  const { sessionToken } = body;

  // Validate session token format
  if (typeof sessionToken !== 'string' || sessionToken.length > 2000) {
    return { statusCode: 401, headers, body: JSON.stringify({ error: 'Invalid session' }) };
  }

  // Verify HMAC session token
  const session = verifySessionToken(sessionToken, SESSION_SECRET);
  if (!session) {
    return { statusCode: 401, headers, body: JSON.stringify({ error: 'Session expired or invalid' }) };
  }

  const sql = getDb();

  try {
    // Verify session exists in DB (allows server-side revocation)
    const sessionValid = await verifySessionInDb(sql, sessionToken);
    if (!sessionValid) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'Session revoked or expired' }) };
    }

    // Fetch settings for this user
    const rows = await sql`
      SELECT settings FROM users
      WHERE email = ${session.email}
      LIMIT 1
    `;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ settings: rows.length > 0 ? rows[0].settings : null }),
    };
  } catch (err) {
    console.error('Get settings error:', err.message || err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Einstellungen konnten nicht geladen werden.' }),
    };
  }
};

