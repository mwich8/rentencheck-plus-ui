/**
 * Shared session token verification for Netlify serverless functions.
 *
 * Verifies HMAC-signed session tokens and checks DB session validity.
 * Extracted from get-purchases.js to be reusable across all authenticated endpoints.
 *
 * Usage:
 *   const { verifySessionToken, verifySessionInDb } = require('./shared/session');
 *   const session = verifySessionToken(token, SESSION_SECRET);
 *   if (!session) return 401;
 *   const valid = await verifySessionInDb(sql, token);
 *   if (!valid) return 401;
 */

const crypto = require('crypto');

/**
 * Verify an HMAC-signed session token and extract the email.
 * Token format: base64url(JSON-payload).base64url(HMAC-SHA256)
 *
 * @param {string} token - The session token to verify
 * @param {string} secret - The HMAC secret (SESSION_SECRET env var)
 * @returns {{ email: string } | null} - Decoded payload or null if invalid
 */
function verifySessionToken(token, secret) {
  try {
    if (typeof token !== 'string' || token.length > 2000) return null;

    const parts = token.split('.');
    if (parts.length !== 2) return null;

    const [payloadB64, signature] = parts;

    // Verify HMAC signature (constant-time comparison)
    const expectedSig = crypto
      .createHmac('sha256', secret)
      .update(payloadB64)
      .digest('base64url');

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

/**
 * Verify that a session token exists in the DB and hasn't been revoked.
 *
 * @param {import('@neondatabase/serverless').NeonQueryFunction} sql
 * @param {string} token - The session token
 * @returns {Promise<boolean>}
 */
async function verifySessionInDb(sql, token) {
  const rows = await sql`
    SELECT id FROM sessions
    WHERE token = ${token} AND expires_at > now()
    LIMIT 1
  `;
  return rows.length > 0;
}

module.exports = { verifySessionToken, verifySessionInDb };

