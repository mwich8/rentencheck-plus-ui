/**
 * Netlify serverless function to create a Stripe Checkout session.
 *
 * POST /.netlify/functions/create-checkout
 * Body: { tier: 'report' | 'premium' }
 *
 * Environment variables required:
 *   STRIPE_SECRET_KEY          — sk_test_... or sk_live_...
 *   STRIPE_PRICE_REPORT        — price_... for €14.90 Detail-Analyse
 *   STRIPE_PRICE_PREMIUM       — price_... for €29.90 Renten-Strategie (future)
 *   URL                        — site URL (auto-set by Netlify)
 */

/** Allowed tier values — prevents arbitrary strings from reaching Stripe */
const ALLOWED_TIERS = ['report', 'premium'];

exports.handler = async (event) => {
  const siteUrl = process.env.URL || 'http://localhost:4200';

  // CORS: restrict to own site origin
  const headers = {
    'Access-Control-Allow-Origin': siteUrl,
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  };

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  // Validate Stripe secret key is configured
  if (!process.env.STRIPE_SECRET_KEY) {
    console.error('STRIPE_SECRET_KEY environment variable is not set');
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Payment service is not configured' }),
    };
  }

  const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

  try {
    // Safe body parsing
    let body;
    try {
      body = JSON.parse(event.body || '{}');
    } catch {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid request body' }),
      };
    }

    const { tier } = body;

    // Validate tier is a known value
    if (typeof tier !== 'string' || !ALLOWED_TIERS.includes(tier)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid tier. Must be one of: ' + ALLOWED_TIERS.join(', ') }),
      };
    }

    const metadata = { tier };

    // Map tier to Stripe Price ID
    const priceMap = {
      report: process.env.STRIPE_PRICE_REPORT,
      premium: process.env.STRIPE_PRICE_PREMIUM,
    };

    const priceId = priceMap[tier];
    if (!priceId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: `Price not configured for tier: ${tier}` }),
      };
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${siteUrl}/zahlung-erfolgreich?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/rechner?cancelled=true`,
      locale: 'de',
      metadata,
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ url: session.url }),
    };
  } catch (err) {
    console.error('Stripe Checkout error:', err.message || err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Checkout session creation failed' }),
    };
  }
};

