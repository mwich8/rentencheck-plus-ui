/**
 * Netlify serverless function — Verify a download token before PDF generation.
 *
 * POST /.netlify/functions/verify-download
 * Body: { downloadToken: 'uuid-...' }
 *
 * Called by the frontend BEFORE every PDF generation.
 * Checks the Neon `purchases` table for a 'paid' record with that token.
 *
 * Returns: { valid: true, pensionInput } or { valid: false, reason }
 *
 * Environment variables required:
 *   DATABASE_URL   — Neon Postgres connection string
 *   URL            — site URL (auto-set by Netlify)
 */

const { getDb } = require('./shared/db');

/** UUID v4 format regex */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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

  if (!process.env.DATABASE_URL) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Server misconfigured' }) };
  }

  // Parse and validate request
  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return { statusCode: 400, headers, body: JSON.stringify({ valid: false, reason: 'Invalid request body' }) };
  }

  const { downloadToken } = body;

  // Validate token format (must be a valid UUID)
  if (typeof downloadToken !== 'string' || !UUID_REGEX.test(downloadToken)) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ valid: false, reason: 'Invalid token format' }),
    };
  }

  const sql = getDb();

  try {
    const rows = await sql`
      SELECT status, pension_input, tier, email
      FROM purchases
      WHERE download_token = ${downloadToken}
      LIMIT 1
    `;

    if (rows.length === 0) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ valid: false, reason: 'Token not found' }),
      };
    }

    const purchase = rows[0];

    if (purchase.status !== 'paid') {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ valid: false, reason: `Purchase status: ${purchase.status}` }),
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        valid: true,
        pensionInput: purchase.pension_input,
        tier: purchase.tier,
      }),
    };
  } catch (err) {
    console.error('Verify download error:', err.message || err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ valid: false, reason: 'Verification failed' }),
    };
  }
};
