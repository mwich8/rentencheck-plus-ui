import { ErrorHandler, Injectable } from '@angular/core';
import { environment } from '@env/environment';

/**
 * Global error handler to catch uncaught exceptions.
 * Prevents white-screen-of-death by logging errors gracefully.
 *
 * In production, errors are logged silently with rate limiting.
 * In development, errors are logged with full stack traces.
 *
 * Rate limiting prevents infinite error loops from flooding the console
 * or a future error tracking service.
 */
@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  /** Max errors to log within the time window */
  private static readonly MAX_ERRORS_PER_WINDOW: number = 10;
  /** Time window in ms for rate limiting (60 seconds) */
  private static readonly WINDOW_MS: number = 60_000;

  private errorCount: number = 0;
  private windowStart: number = Date.now();

  handleError(error: unknown): void {
    // Rate limiting: suppress if too many errors in the current window
    const now: number = Date.now();
    if (now - this.windowStart > GlobalErrorHandler.WINDOW_MS) {
      this.errorCount = 0;
      this.windowStart = now;
    }
    this.errorCount++;

    if (this.errorCount > GlobalErrorHandler.MAX_ERRORS_PER_WINDOW) {
      // Silently drop — too many errors in a short window
      return;
    }

    if (this.errorCount === GlobalErrorHandler.MAX_ERRORS_PER_WINDOW) {
      console.warn('[RentenCheck+] Too many errors — further errors will be suppressed for 60s.');
      return;
    }

    // Extract the actual error from Angular's wrapper
    const originalError = this.extractError(error);

    if (environment.production) {
      // In production: log minimal info, avoid exposing internals
      console.error('[RentenCheck+] An unexpected error occurred.');
    } else {
      // In development: full error for debugging
      console.error('[RentenCheck+] Unhandled error:', originalError);
    }

    // Future: send to an error tracking service (e.g., Sentry)
    // this.errorTrackingService.report(originalError);
  }

  private extractError(error: unknown): unknown {
    // Angular wraps errors in an object with an `ngOriginalError` property
    if (error && typeof error === 'object' && 'ngOriginalError' in error) {
      return (error as { ngOriginalError: unknown }).ngOriginalError;
    }
    return error;
  }
}

