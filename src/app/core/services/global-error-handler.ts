import { ErrorHandler, Injectable } from '@angular/core';
import { environment } from '@env/environment';

/**
 * Global error handler to catch uncaught exceptions.
 * Prevents white-screen-of-death by logging errors gracefully.
 *
 * In production, errors are logged silently.
 * In development, errors are logged with full stack traces.
 */
@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  handleError(error: unknown): void {
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

