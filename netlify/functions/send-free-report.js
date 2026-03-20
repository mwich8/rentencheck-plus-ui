/**
 * Netlify serverless function — Send free report summary via email.
 *
 * POST /.netlify/functions/send-free-report
 * Body: { email, score, grade, label, percentile, nettoMonatlich, rentenluecke, deckungsquote }
 *
 * Captures the lead in `free_report_leads`, then sends a branded HTML email
 * with the user's key metrics and a CTA to purchase the full report.
 *
 * Environment variables required:
 *   DATABASE_URL    — Neon connection string
 *   RESEND_API_KEY  — Resend API key
 *   URL             — site URL (auto-set by Netlify)
 */

const { getDb } = require('./shared/db');
const { Resend } = require('resend');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_EMAILS_PER_HOUR = 3;

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
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Ungültige E-Mail-Adresse.' }) };
  }

  const score = Math.round(Number(body.score) || 0);
  const grade = String(body.grade || 'F').slice(0, 2);
  const label = String(body.label || '');
  const percentile = Math.round(Number(body.percentile) || 0);
  const nettoMonatlich = Number(body.nettoMonatlich) || 0;
  const rentenluecke = Number(body.rentenluecke) || 0;
  const deckungsquote = Number(body.deckungsquote) || 0;

  const sql = getDb();

  try {
    // Rate limiting
    const [rateCheck] = await sql`
      SELECT COUNT(*)::int AS cnt
      FROM free_report_leads
      WHERE email = ${email}
        AND created_at > now() - interval '1 hour'
    `;

    if (rateCheck.cnt >= MAX_EMAILS_PER_HOUR) {
      return {
        statusCode: 429,
        headers,
        body: JSON.stringify({ error: 'Zu viele Anfragen. Bitte warten Sie einen Moment.' }),
      };
    }

    // Store lead
    await sql`
      INSERT INTO free_report_leads (email, score, grade, rentenluecke, deckungsquote)
      VALUES (${email}, ${score}, ${grade}, ${rentenluecke}, ${deckungsquote})
    `;

    // Build email
    const formattedNetto = nettoMonatlich.toFixed(2).replace('.', ',');
    const formattedLuecke = rentenluecke.toFixed(2).replace('.', ',');
    const formattedDeckung = deckungsquote.toFixed(1).replace('.', ',');

    const gradeColor = getGradeColor(grade);
    const gradeBg = getGradeBgColor(grade);

    const resend = new Resend(RESEND_API_KEY);
    await resend.emails.send({
      from: 'RentenCheck+ <noreply@rentencheckplus.de>',
      to: email,
      subject: `Ihr Renten-Score: ${score}/100 (Note ${grade}) — RentenCheck+`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px; background: #ffffff;">
          <h2 style="color: #0f3460; margin-bottom: 4px;">RentenCheck<span style="color: #e94560;">+</span></h2>
          <p style="color: #a0aec0; font-size: 13px; margin-top: 0;">Ihre persönliche Rentenanalyse</p>

          <!-- Score Card -->
          <div style="background: linear-gradient(135deg, #0f3460, #1a5276); border-radius: 16px; padding: 28px; margin: 24px 0; text-align: center;">
            <p style="color: #a0c4e8; font-size: 13px; margin: 0 0 8px; text-transform: uppercase; letter-spacing: 1px;">Ihr Renten-Score</p>
            <div style="font-size: 56px; font-weight: 900; color: #ffffff; line-height: 1;">${score}</div>
            <p style="color: #7fb3d8; font-size: 14px; margin: 4px 0 16px;">von 100 Punkten</p>
            <div style="display: inline-block; background: ${gradeBg}; color: ${gradeColor}; padding: 6px 16px; border-radius: 20px; font-weight: 700; font-size: 14px;">
              Note ${escapeHtml(grade)} — ${escapeHtml(label)}
            </div>
            <p style="color: #7fb3d8; font-size: 13px; margin-top: 12px;">
              Besser als <strong style="color: #ffffff;">${percentile}%</strong> der Deutschen
            </p>
          </div>

          <!-- Key Metrics -->
          <div style="background: #f7fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 20px 0;">
            <p style="margin: 0 0 14px; font-size: 12px; color: #a0aec0; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 700;">Ihre Kennzahlen</p>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #718096; font-size: 14px;">Nettorente (monatlich)</td>
                <td style="padding: 8px 0; color: #0f3460; font-size: 14px; font-weight: 700; text-align: right;">${formattedNetto} €</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #718096; font-size: 14px;">Rentenlücke</td>
                <td style="padding: 8px 0; color: #e94560; font-size: 14px; font-weight: 700; text-align: right;">−${formattedLuecke} €</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #718096; font-size: 14px;">Deckungsquote</td>
                <td style="padding: 8px 0; color: #0f3460; font-size: 14px; font-weight: 700; text-align: right;">${formattedDeckung}%</td>
              </tr>
            </table>
          </div>

          <!-- CTA for Full Report -->
          <div style="background: #fffbeb; border: 1px solid #fbbf24; border-radius: 10px; padding: 18px; margin: 20px 0; text-align: center;">
            <p style="margin: 0 0 4px; font-size: 15px; font-weight: 700; color: #92400e;">
              📊 Der vollständige Report zeigt mehr:
            </p>
            <p style="margin: 0 0 14px; font-size: 13px; color: #a16207; line-height: 1.5;">
              30-Jahre-Inflationsprognose · Steuerdetails nach §32a EStG · Multi-Szenario-Vergleich · Persönliche ETF-Sparplan-Empfehlung
            </p>
            <a href="${siteUrl}/rechner" style="display: inline-block; background: #0f3460; color: white; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">
              Vollständigen Report ansehen →
            </a>
          </div>

          <p style="color: #a0aec0; font-size: 11px; margin-top: 28px; line-height: 1.5; text-align: center;">
            Diese E-Mail wurde von RentenCheck+ auf Ihre Anfrage gesendet.<br>
            <a href="${siteUrl}/datenschutz" style="color: #a0aec0;">Datenschutz</a> · <a href="${siteUrl}/impressum" style="color: #a0aec0;">Impressum</a>
          </p>
        </div>
      `,
    });

    console.log(`Free report email sent to ${email} (score: ${score}, grade: ${grade})`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ sent: true }),
    };
  } catch (err) {
    console.error('Send free report error:', err.message || err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'E-Mail konnte nicht gesendet werden.' }),
    };
  }
};

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getGradeColor(grade) {
  const colors = { A: '#27ae60', B: '#2ecc71', C: '#f39c12', D: '#e67e22', F: '#e94560' };
  return colors[grade] || colors.F;
}

function getGradeBgColor(grade) {
  const colors = { A: 'rgba(39,174,96,0.15)', B: 'rgba(46,204,113,0.15)', C: 'rgba(243,156,18,0.15)', D: 'rgba(230,126,34,0.15)', F: 'rgba(233,69,96,0.15)' };
  return colors[grade] || colors.F;
}

