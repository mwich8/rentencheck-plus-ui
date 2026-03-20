/**
 * Netlify serverless function — Stripe Webhook handler.
 *
 * POST /.netlify/functions/stripe-webhook
 *
 * Listens for:
 *   - checkout.session.completed → record purchase as 'paid'
 *   - charge.refunded           → mark purchase as 'refunded'
 *
 * Environment variables required:
 *   STRIPE_SECRET_KEY       — sk_test_... or sk_live_...
 *   STRIPE_WEBHOOK_SECRET   — whsec_... (from Stripe Dashboard → Webhooks)
 *   DATABASE_URL            — Neon Postgres connection string
 */

const crypto = require('crypto');
const stripe = require('stripe');
const { Resend } = require('resend');
const { getDb } = require('./shared/db');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  // Validate environment
  const { STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, DATABASE_URL } = process.env;
  if (!STRIPE_SECRET_KEY || !STRIPE_WEBHOOK_SECRET || !DATABASE_URL) {
    console.error('Missing required environment variables for stripe-webhook');
    return { statusCode: 500, body: JSON.stringify({ error: 'Server misconfigured' }) };
  }

  const stripeClient = stripe(STRIPE_SECRET_KEY);
  const sql = getDb();

  // Verify webhook signature (prevents spoofed events)
  let stripeEvent;
  try {
    const sig = event.headers['stripe-signature'];
    stripeEvent = stripeClient.webhooks.constructEvent(event.body, sig, STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid signature' }) };
  }

  try {
    switch (stripeEvent.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(sql, stripeEvent.data.object);
        break;

      case 'charge.refunded':
        await handleRefund(sql, stripeEvent.data.object);
        break;

      case 'charge.dispute.created':
        await handleDispute(sql, stripeEvent.data.object);
        break;

      default:
        console.log(`Unhandled event type: ${stripeEvent.type}`);
    }

    return { statusCode: 200, body: JSON.stringify({ received: true }) };
  } catch (err) {
    console.error('Webhook processing error:', err.message || err);
    return { statusCode: 500, body: JSON.stringify({ error: 'Webhook processing failed' }) };
  }
};

/**
 * Handle successful checkout — insert purchase record and send confirmation email.
 */
async function handleCheckoutCompleted(sql, session) {
  const email = (session.customer_details?.email || session.customer_email || '').toLowerCase().trim();

  if (!email || email.length > 254) {
    console.warn('Checkout completed with invalid email — skipping');
    return;
  }

  const tier = session.metadata?.tier || 'report';

  let pensionInput = null;
  if (session.metadata?.pension_input) {
    try {
      pensionInput = JSON.parse(session.metadata.pension_input);
    } catch {
      console.warn('Failed to parse pension_input metadata — skipping');
    }
  }

  const downloadToken = crypto.randomUUID();

  await sql`
    INSERT INTO purchases (
      stripe_session_id, stripe_customer_id, stripe_payment_intent,
      email, tier, amount, currency, status, pension_input, paid_at, download_token
    ) VALUES (
      ${session.id}, ${session.customer || null}, ${session.payment_intent || null},
      ${email}, ${tier}, ${session.amount_total || 0}, ${session.currency || 'eur'},
      'paid', ${pensionInput ? JSON.stringify(pensionInput) : null}::jsonb,
      ${new Date().toISOString()}, ${downloadToken}
    )
    ON CONFLICT (stripe_session_id)
    DO UPDATE SET
      status = 'paid',
      paid_at = COALESCE(purchases.paid_at, EXCLUDED.paid_at),
      download_token = COALESCE(purchases.download_token, EXCLUDED.download_token)
  `;

  // Retrieve the purchase ID for the confirmation email
  const [purchase] = await sql`
    SELECT id FROM purchases WHERE stripe_session_id = ${session.id} LIMIT 1
  `;
  const purchaseId = purchase?.id ?? 'N/A';

  console.log(`Purchase recorded: ${session.id} (${email}, ${tier}, ID: ${purchaseId})`);

  // Send purchase confirmation email
  await sendConfirmationEmail(email, purchaseId, tier, session.amount_total || 0);
}

/**
 * Escape HTML special characters to prevent XSS in email templates.
 */
function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Send a purchase confirmation email with the reference info.
 */
async function sendConfirmationEmail(email, purchaseId, tier, amountCents) {
  const { RESEND_API_KEY } = process.env;
  if (!RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not set — skipping confirmation email');
    return;
  }

  const siteUrl = process.env.URL || 'https://rentencheckplus.de';
  const tierLabel = tier === 'premium' ? 'Renten-Strategie' : 'Detail-Analyse';
  const amount = (amountCents / 100).toFixed(2).replace('.', ',');
  const shortId = escapeHtml(purchaseId.split('-')[0].toUpperCase());
  const safeEmail = escapeHtml(email);

  try {
    const resend = new Resend(RESEND_API_KEY);
    await resend.emails.send({
      from: 'RentenCheck+ <noreply@rentencheckplus.de>',
      to: email,
      subject: `Kaufbestätigung — RentenCheck+ (Bestell-Nr. RC-${shortId})`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px;">
          <h2 style="color: #0f3460; margin-bottom: 4px;">RentenCheck<span style="color: #e94560;">+</span></h2>
          <p style="color: #a0aec0; font-size: 13px; margin-top: 0;">Kaufbestätigung</p>

          <p style="color: #4a5568; font-size: 16px; line-height: 1.6;">
            Vielen Dank für Ihren Kauf! Ihr PDF-Report wurde erfolgreich erstellt.
          </p>

          <div style="background: #f7fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 20px; margin: 20px 0;">
            <p style="margin: 0 0 12px; font-size: 13px; color: #a0aec0; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 700;">Ihre Referenzdaten</p>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 6px 0; color: #718096; font-size: 14px;">Bestell-Nr.</td>
                <td style="padding: 6px 0; color: #0f3460; font-size: 14px; font-weight: 700; text-align: right; font-family: monospace;">RC-${shortId}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #718096; font-size: 14px;">E-Mail</td>
                <td style="padding: 6px 0; color: #0f3460; font-size: 14px; font-weight: 600; text-align: right;">${safeEmail}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #718096; font-size: 14px;">Produkt</td>
                <td style="padding: 6px 0; color: #2d3748; font-size: 14px; text-align: right;">${tierLabel}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #718096; font-size: 14px;">Betrag</td>
                <td style="padding: 6px 0; color: #2d3748; font-size: 14px; font-weight: 600; text-align: right;">${amount} €</td>
              </tr>
            </table>
          </div>

          <div style="background: #fffbeb; border: 1px solid #fbbf24; border-radius: 8px; padding: 14px 16px; margin: 16px 0;">
            <p style="margin: 0; color: #92400e; font-size: 13px; line-height: 1.5;">
              <strong>💡 Wichtig:</strong> Bewahren Sie diese E-Mail auf! Mit Ihrer <strong>Bestell-Nr. RC-${shortId}</strong> und Ihrer <strong>E-Mail-Adresse</strong> können Sie Ihren Report jederzeit unter „Meine Käufe" wiederherstellen.
            </p>
          </div>

          <a href="${siteUrl}/meine-kaeufe" style="display: inline-block; background: #0f3460; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; margin: 12px 0;">
            Meine Käufe ansehen →
          </a>

          <p style="color: #a0aec0; font-size: 12px; margin-top: 24px; line-height: 1.5;">
            Bei Fragen zu Ihrer Bestellung kontaktieren Sie uns bitte unter Angabe Ihrer Bestell-Nr. und E-Mail-Adresse über das Impressum auf rentencheckplus.de.
          </p>
        </div>
      `,
    });

    console.log(`Confirmation email sent to ${email} (RC-${shortId})`);
  } catch (err) {
    // Non-critical — log but don't fail the webhook
    console.error('Failed to send confirmation email:', err.message || err);
  }
}

/**
 * Handle refund — update purchase status.
 */
async function handleRefund(sql, charge) {
  const paymentIntentId = charge.payment_intent;
  if (!paymentIntentId) {
    console.warn('Refund event missing payment_intent');
    return;
  }

  await sql`
    UPDATE purchases
    SET status = 'refunded', refunded_at = ${new Date().toISOString()}
    WHERE stripe_payment_intent = ${paymentIntentId}
  `;

  console.log(`Refund recorded for payment_intent: ${paymentIntentId}`);
}

/**
 * Handle dispute/chargeback — mark purchase as disputed.
 */
async function handleDispute(sql, dispute) {
  const paymentIntentId = dispute.payment_intent;
  if (!paymentIntentId) {
    console.warn('Dispute event missing payment_intent');
    return;
  }

  await sql`
    UPDATE purchases
    SET status = 'disputed'
    WHERE stripe_payment_intent = ${paymentIntentId}
  `;

  console.log(`Dispute recorded for payment_intent: ${paymentIntentId}`);
}













