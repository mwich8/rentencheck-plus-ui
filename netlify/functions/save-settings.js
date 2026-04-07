/**
 * Netlify serverless function — Save user settings (calculator inputs).
 *
 * POST /.netlify/functions/save-settings
 * Body: { sessionToken: '...', settings: { ...PensionInput } }
 *
 * Validates the session, then upserts the settings into the users table.
 * Settings are stored as JSONB — the full PensionInput object.
 *
 * Environment variables required:
 *   DATABASE_URL     — Neon connection string
 *   SESSION_SECRET   — HMAC secret for verifying session tokens
 *   URL              — site URL (auto-set by Netlify)
 */

const { getDb } = require('./shared/db');
const { verifySessionToken, verifySessionInDb } = require('./shared/session');

/** Maximum settings payload size in bytes (50 KB — generous for PensionInput) */
const MAX_SETTINGS_SIZE = 50 * 1024;

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

  const { sessionToken, settings } = body;

  // Validate session token format
  if (typeof sessionToken !== 'string' || sessionToken.length > 2000) {
    return { statusCode: 401, headers, body: JSON.stringify({ error: 'Invalid session' }) };
  }

  // Validate settings
  if (!settings || typeof settings !== 'object' || Array.isArray(settings)) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid settings' }) };
  }

  // Size guard: prevent excessively large payloads
  const settingsJson = JSON.stringify(settings);
  if (settingsJson.length > MAX_SETTINGS_SIZE) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Settings too large' }) };
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

    // Upsert settings into users table
    await sql`
      INSERT INTO users (email, settings)
      VALUES (${session.email}, ${settingsJson}::jsonb)
      ON CONFLICT (email)
      DO UPDATE SET settings = ${settingsJson}::jsonb
    `;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ saved: true }),
    };
  } catch (err) {
    console.error('Save settings error:', err.message || err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Einstellungen konnten nicht gespeichert werden.' }),
    };
  }
};

