import { Injectable, signal } from '@angular/core';

const STORAGE_KEY = 'rentencheck_premium_unlocked';

/**
 * Tracks whether the user has unlocked premium features (purchased the PDF report).
 * Uses localStorage so the unlock persists across sessions/page reloads.
 * The calculator page reads `isUnlocked()` to show/hide gated content.
 */
@Injectable({ providedIn: 'root' })
export class PremiumUnlockService {
  /** Reactive signal so Angular components update automatically */
  readonly isUnlocked = signal(this.readStorage());

  /** Mark premium features as unlocked (called after successful payment) */
  unlock(): void {
    try {
      localStorage.setItem(STORAGE_KEY, 'true');
    } catch { /* private browsing */ }
    this.isUnlocked.set(true);
  }

  /** Reset unlock state (for testing or refund scenarios) */
  lock(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch { /* private browsing */ }
    this.isUnlocked.set(false);
  }

  private readStorage(): boolean {
    try {
      return localStorage.getItem(STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  }
}

