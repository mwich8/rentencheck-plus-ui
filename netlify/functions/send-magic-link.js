/**
 * Netlify serverless function — Send a Magic Link email.
 *
 * POST /.netlify/functions/send-magic-link
 * Body: { email: 'user@example.com' }
 *
 * Generates a random token, stores it in the magic_links table,
 * and sends an email with a login link via Resend.
 *
 * Environment variables required:
 *   DATABASE_URL    — Neon connection string
 *   RESEND_API_KEY  — Resend API key for sending emails
 *   URL             — site URL (auto-set by Netlify)
 */

const crypto = require('crypto');
const { getDb } = require('./shared/db');
const { Resend } = require('resend');

/** Simple email format validation */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Rate limit: max magic links per email per hour */
const MAX_LINKS_PER_HOUR = 5;

/** Token expiry in minutes */
const TOKEN_EXPIRY_MINUTES = 15;

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

  const { DATABASE_URL, RESEND_API_KEY } = process.env;
  if (!DATABASE_URL || !RESEND_API_KEY) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Server misconfigured' }) };
  }

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid request body' }) };
  }

  const email = (body.email || '').trim().toLowerCase();
  if (!email || !EMAIL_REGEX.test(email) || email.length > 254) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Ungültige E-Mail-Adresse.' }),
    };
  }

  const sql = getDb();

  try {
    // Rate limiting: check how many magic links were sent to this email in the last hour
    const [rateCheck] = await sql`
      SELECT COUNT(*)::int AS cnt
      FROM magic_links
      WHERE email = ${email}
        AND created_at > now() - interval '1 hour'
    `;

    if (rateCheck.cnt >= MAX_LINKS_PER_HOUR) {
      return {
        statusCode: 429,
        headers,
        body: JSON.stringify({ error: 'Zu viele Anfragen. Bitte warten Sie einen Moment.' }),
      };
    }

    // Generate a secure random token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_MINUTES * 60 * 1000).toISOString();

    // Store the magic link token
    await sql`
      INSERT INTO magic_links (email, token, expires_at)
      VALUES (${email}, ${token}, ${expiresAt})
    `;

    // Build the magic link URL
    const magicLinkUrl = `${siteUrl}/meine-kaeufe?token=${token}`;

    // Send the email via Resend
    const resend = new Resend(RESEND_API_KEY);
    await resend.emails.send({
      from: 'RentenCheck+ <noreply@rentencheckplus.de>',
      to: email,
      subject: 'Ihr Anmelde-Link für RentenCheck+',
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
          <h2 style="color: #1a1a2e; margin-bottom: 8px;">RentenCheck+</h2>
          <p style="color: #4a5568; font-size: 16px; line-height: 1.6;">
            Klicken Sie auf den Button, um sich anzumelden und Ihre Käufe einzusehen:
          </p>
          <a href="${magicLinkUrl}" style="display: inline-block; background: #0f3460; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px; margin: 16px 0;">
            Anmelden →
          </a>
          <p style="color: #a0aec0; font-size: 13px; margin-top: 24px;">
            Dieser Link ist ${TOKEN_EXPIRY_MINUTES} Minuten gültig. Falls Sie diese E-Mail nicht angefordert haben, können Sie sie ignorieren.
          </p>
        </div>
      `,
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ sent: true }),
    };
  } catch (err) {
    console.error('Send magic link error:', err.message || err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'E-Mail konnte nicht gesendet werden.' }),
    };
  }
};

