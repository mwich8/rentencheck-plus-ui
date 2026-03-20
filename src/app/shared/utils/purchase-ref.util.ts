/**
 * Build a short, human-friendly order reference from a UUID purchase ID.
 *
 * Example: "a1b2c3d4-e5f6-..." → "RC-A1B2C3D4"
 *
 * Used consistently across:
 * - PDF header/footer (pdf-primitives.ts)
 * - Payment success page (payment-success.component.ts)
 * - Purchases page (purchases-page.component.ts)
 * - Confirmation email (stripe-webhook.js — duplicated in JS backend)
 */
export function shortPurchaseRef(purchaseId: string): string {
  return `RC-${purchaseId.split('-')[0].toUpperCase()}`;
}

