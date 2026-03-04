const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

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
exports.handler = async (event) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
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

  try {
    const { tier } = JSON.parse(event.body || '{}');

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
        body: JSON.stringify({ error: `Unknown tier: ${tier}` }),
      };
    }

    const siteUrl = process.env.URL || 'http://localhost:4200';

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
      metadata: {
        tier,
      },
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ url: session.url }),
    };
  } catch (err) {
    console.error('Stripe Checkout error:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Checkout session creation failed' }),
    };
  }
};

