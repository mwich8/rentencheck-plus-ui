import { Injectable, inject, signal } from '@angular/core';
import { AuthService } from './auth.service';

/**
 * A purchase record from the `purchases` table.
 */
export interface Purchase {
  id: string;
  email: string;
  stripe_session_id: string;
  tier: 'report' | 'premium';
  amount: number;
  currency: string;
  status: 'pending' | 'paid' | 'refunded' | 'disputed';
  pension_input: Record<string, unknown> | null;
  download_token: string | null;
  created_at: string;
  paid_at: string | null;
  refunded_at: string | null;
}

/**
 * Service to query the user's purchase history via the get-purchases Netlify function.
 * Requires an authenticated session (session token passed to the backend).
 */
@Injectable({ providedIn: 'root' })
export class PurchaseService {
  private readonly auth = inject(AuthService);

  /** Reactive list of the user's purchases */
  readonly purchases = signal<Purchase[]>([]);
  readonly loading = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  /** Guard: prevent concurrent loadPurchases calls */
  private loadInFlight = false;

  /**
   * Fetch all purchases for the currently logged-in user.
   * Uses the session token to authenticate the request.
   * Debounced — concurrent calls are ignored while one is in flight.
   */
  async loadPurchases(): Promise<void> {
    if (this.loadInFlight) return;

    const sessionToken = this.auth.getSessionToken();
    if (!sessionToken) {
      this.error.set('Nicht angemeldet.');
      return;
    }

    this.loadInFlight = true;
    this.loading.set(true);
    this.error.set(null);

    try {
      const response = await fetch('/.netlify/functions/get-purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionToken }),
      });

      const result = await response.json();

      if (!response.ok || result.error) {
        console.error('[PurchaseService] Load error:', result.error);
        this.error.set('Käufe konnten nicht geladen werden.');
        return;
      }

      this.purchases.set((result.purchases as Purchase[]) ?? []);
    } catch (err) {
      console.error('[PurchaseService] Unexpected error:', err);
      this.error.set('Ein unerwarteter Fehler ist aufgetreten.');
    } finally {
      this.loading.set(false);
      this.loadInFlight = false;
    }
  }
}

