import { Injectable, DestroyRef, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { environment } from '../../../environments/environment';

/**
 * BackendWakeUpService — keeps the Netlify Functions runtime warm.
 *
 * Triggers a lightweight health-check ping:
 *  1. Immediately on service initialization (app start).
 *  2. When the browser tab regains visibility after being hidden for > 1 hour.
 *  3. Periodically every 55 minutes while the app is in the foreground (safety net).
 *
 * All pings are fire-and-forget; failures are silently ignored.
 */
@Injectable({ providedIn: 'root' })
export class BackendWakeUpService {
  private static readonly IDLE_THRESHOLD_MS = 60 * 60 * 1000; // 1 hour
  private static readonly PING_INTERVAL_MS = 55 * 60 * 1000; // 55 minutes

  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);

  private lastPingTimestamp = 0;
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private visibilityHandler: (() => void) | null = null;

  private initialized = false;

  /**
   * Call once from AppComponent.ngOnInit() to activate the wake-up mechanism.
   * Safe to call multiple times — subsequent calls are no-ops.
   */
  init(): void {
    if (this.initialized) {
      return;
    }
    this.initialized = true;
    // Immediate wake-up ping on app start
    this.ping();

    // Periodic ping while app is in foreground
    this.intervalId = setInterval(() => this.ping(), BackendWakeUpService.PING_INTERVAL_MS);

    // Visibility-change: ping when user returns after 1+ hour away
    this.visibilityHandler = () => {
      if (this.document.visibilityState === 'visible') {
        const elapsed = Date.now() - this.lastPingTimestamp;
        if (elapsed >= BackendWakeUpService.IDLE_THRESHOLD_MS) {
          this.ping();
        }
      }
    };
    this.document.addEventListener('visibilitychange', this.visibilityHandler);

    // Cleanup on destroy
    this.destroyRef.onDestroy(() => this.dispose());
  }

  private ping(): void {
    this.lastPingTimestamp = Date.now();

    // Skip in dev if no backend is available (optional: remove condition for local testing)
    if (!environment.production) {
      return;
    }

    fetch('/.netlify/functions/health', { method: 'GET' }).catch(() => {
      // Silent failure — wake-up pings must never disrupt the user experience
    });
  }

  private dispose(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    if (this.visibilityHandler) {
      this.document.removeEventListener('visibilitychange', this.visibilityHandler);
      this.visibilityHandler = null;
    }
  }
}


