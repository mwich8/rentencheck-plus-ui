import { Injectable } from '@angular/core';
import { PensionInput } from '../models/pension-input.model';

export type PaymentTier = 'report' | 'premium';

const SESSION_STORAGE_KEY: string = 'rentencheck_pending_input';

/**
 * Handles the Stripe payment flow for paid features.
 *
 * Flow:
 * 1. Save calculator inputs to sessionStorage (survives redirect)
 * 2. Call Netlify function to create Stripe Checkout session
 * 3. Redirect user to Stripe's hosted checkout page
 * 4. On success, Stripe redirects to /zahlung-erfolgreich?session_id=...
 * 5. PaymentSuccessComponent restores inputs and generates the PDF
 */
@Injectable({ providedIn: 'root' })
export class StripePaymentService {

  /**
   * Start the Stripe Checkout flow.
   * Saves inputs to sessionStorage, then redirects to Stripe.
   */
  async startCheckout(tier: PaymentTier, input: PensionInput): Promise<boolean> {
    // 1. Persist inputs so we can restore them after redirect
    this.saveInput(input);

    try {
      // 2. Call Netlify function to create Checkout session
      const response = await fetch('/.netlify/functions/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier }),
      });

      if (!response.ok) {
        const err: { error?: string } = await response.json();
        throw new Error(err.error || 'Checkout creation failed');
      }

      const { url }: { url: string } = await response.json();

      // 3. Redirect to Stripe Checkout
      this.redirect(url);
      return true;
    } catch {
      // Clear saved input on error
      this.clearInput();
      return false;
    }
  }

  /**
   * Save pension input to sessionStorage before Stripe redirect.
   */
  saveInput(input: PensionInput): void {
    try {
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(input));
    } catch { /* private browsing — input won't survive redirect */ }
  }

  /**
   * Restore pension input after returning from Stripe.
   */
  restoreInput(): PensionInput | null {
    try {
      const raw: string | null = sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as PensionInput;
    } catch {
      return null;
    }
  }

  /**
   * Redirect to the given URL. Extracted for testability.
   * @internal Override in tests via spyOn to prevent page navigation.
   */
  redirect(url: string): void {
    window.location.href = url;
  }

  /**
   * Clean up stored input after successful PDF generation.
   */
  clearInput(): void {
    try {
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
    } catch { /* private browsing */ }
  }
}

