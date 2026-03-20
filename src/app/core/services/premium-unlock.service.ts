import { Injectable, signal } from '@angular/core';

const STORAGE_KEY: string = 'rentencheck_download_token';

/**
 * Result of a server-side download token verification.
 */
export interface DownloadVerification {
  valid: boolean;
  pensionInput?: Record<string, unknown>;
  tier?: string;
  reason?: string;
}

/**
 * Tracks whether the user has unlocked premium features via a server-verified download token.
 *
 * Instead of a simple boolean in localStorage (trivially bypassable),
 * this stores a download token (UUID) that must pass server verification
 * before any PDF can be generated.
 *
 * Flow:
 * 1. After Stripe payment → verify-session returns a downloadToken
 * 2. Token is stored in localStorage for persistence
 * 3. Before PDF generation → verifyToken() calls verify-download serverless function
 * 4. Only if server confirms the token belongs to a 'paid' purchase → PDF is generated
 */
@Injectable({ providedIn: 'root' })
export class PremiumUnlockService {
  /** Reactive signal — true if a token is stored (optimistic, not verified) */
  readonly isUnlocked = signal<boolean>(!!this.readToken());

  /**
   * Store a download token after successful payment verification.
   * @param token UUID download token from verify-session response
   */
  unlock(token: string): void {
    try {
      localStorage.setItem(STORAGE_KEY, token);
    } catch { /* private browsing */ }
    this.isUnlocked.set(true);
  }

  /** Reset unlock state (for refund scenarios or failed verification) */
  lock(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch { /* private browsing */ }
    this.isUnlocked.set(false);
  }

  /** Read the stored download token (or null) */
  getToken(): string | null {
    return this.readToken();
  }

  /**
   * Verify the stored download token against the server.
   * This is the gatekeeper — no PDF generation without a valid server response.
   *
   * @returns Verification result with pensionInput if valid
   */
  async verifyToken(): Promise<DownloadVerification> {
    const token = this.readToken();
    if (!token) {
      return { valid: false, reason: 'No token stored' };
    }

    try {
      const response = await fetch('/.netlify/functions/verify-download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ downloadToken: token }),
      });

      if (!response.ok) {
        return { valid: false, reason: 'Verification request failed' };
      }

      const result: DownloadVerification = await response.json();

      // If the token is no longer valid (refunded, disputed), clear it
      if (!result.valid) {
        this.lock();
      }

      return result;
    } catch {
      return { valid: false, reason: 'Network error during verification' };
    }
  }

  private readToken(): string | null {
    try {
      return localStorage.getItem(STORAGE_KEY) || null;
    } catch {
      return null;
    }
  }
}
