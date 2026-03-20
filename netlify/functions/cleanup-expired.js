/**
 * Netlify scheduled function — Clean up expired tokens.
 *
 * Runs daily at 03:00 UTC via Netlify's scheduled functions (cron).
 * Deletes expired magic links and sessions to prevent unbounded table growth.
 *
 * Environment variables required:
 *   DATABASE_URL — Neon connection string
 *
 * @see https://docs.netlify.com/functions/scheduled-functions/
 */

const { getDb } = require('./shared/db');

/** @type {import('@netlify/functions').Config} */
module.exports.config = {
  schedule: '0 3 * * *', // Daily at 03:00 UTC
};

module.exports.handler = async () => {
  if (!process.env.DATABASE_URL) {
    console.error('[cleanup] DATABASE_URL not set');
    return { statusCode: 500 };
  }

  const sql = getDb();

  try {
    const magicRows = await sql`
      DELETE FROM magic_links WHERE expires_at < now()
      RETURNING id
    `;
    const sessionRows = await sql`
      DELETE FROM sessions WHERE expires_at < now()
      RETURNING id
    `;

    console.log(`[cleanup] Deleted expired tokens — magic_links: ${magicRows.length}, sessions: ${sessionRows.length}`);

    return { statusCode: 200 };
  } catch (err) {
    console.error('[cleanup] Failed:', err.message || err);
    return { statusCode: 500 };
  }
};


