/**
 * Shared Neon database helper for Netlify serverless functions.
 *
 * Provides a `sql` tagged-template function for parameterized queries.
 * Uses @neondatabase/serverless which works over HTTP (no persistent connections needed).
 *
 * Environment variable required:
 *   DATABASE_URL — Neon connection string (postgresql://user:pass@host/db?sslmode=require)
 */
const { neon } = require('@neondatabase/serverless');

let _sql = null;

/**
 * Get a cached Neon SQL query function.
 * @returns {import('@neondatabase/serverless').NeonQueryFunction}
 */
function getDb() {
  if (!_sql) {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable is not set');
    }
    _sql = neon(databaseUrl);
  }
  return _sql;
}

module.exports = { getDb };

