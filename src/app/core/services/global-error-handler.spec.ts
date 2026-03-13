import { GlobalErrorHandler } from './global-error-handler';
import { environment } from '@env/environment';

describe('GlobalErrorHandler', () => {
  let handler: GlobalErrorHandler;

  beforeEach(() => {
    handler = new GlobalErrorHandler();
  });

  it('should be created', () => {
    expect(handler).toBeTruthy();
  });

  describe('handleError', () => {
    it('should log a generic message in production mode', () => {
      const originalProd = environment.production;
      (environment as { production: boolean }).production = true;
      const spy = spyOn(console, 'error');

      handler.handleError(new Error('test'));

      expect(spy).toHaveBeenCalledWith('[RentenCheck+] An unexpected error occurred.');
      (environment as { production: boolean }).production = originalProd;
    });

    it('should log the full error in development mode', () => {
      const originalProd = environment.production;
      (environment as { production: boolean }).production = false;
      const spy = spyOn(console, 'error');

      const err = new Error('dev error');
      handler.handleError(err);

      expect(spy).toHaveBeenCalledWith('[RentenCheck+] Unhandled error:', err);
      (environment as { production: boolean }).production = originalProd;
    });

    it('should unwrap Angular ngOriginalError wrapper', () => {
      const originalProd = environment.production;
      (environment as { production: boolean }).production = false;
      const spy = spyOn(console, 'error');

      const originalErr = new Error('original');
      const wrapped = { ngOriginalError: originalErr };
      handler.handleError(wrapped);

      expect(spy).toHaveBeenCalledWith('[RentenCheck+] Unhandled error:', originalErr);
      (environment as { production: boolean }).production = originalProd;
    });

    it('should handle null/undefined errors without throwing', () => {
      const spy = spyOn(console, 'error');

      expect(() => handler.handleError(null)).not.toThrow();
      expect(() => handler.handleError(undefined)).not.toThrow();
      expect(spy).toHaveBeenCalled();
    });

    it('should handle string errors', () => {
      const spy = spyOn(console, 'error');

      expect(() => handler.handleError('string error')).not.toThrow();
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('rate limiting', () => {
    it('should suppress errors after exceeding the per-window limit', () => {
      const errorSpy = spyOn(console, 'error');
      const warnSpy = spyOn(console, 'warn');

      // Fire 11 errors — the 10th should trigger the suppression warning
      for (let i = 0; i < 11; i++) {
        handler.handleError(new Error(`error ${i}`));
      }

      // 9 normal errors logged + 1 warn at the 10th
      expect(errorSpy).toHaveBeenCalledTimes(9);
      expect(warnSpy).toHaveBeenCalledWith(
        '[RentenCheck+] Too many errors — further errors will be suppressed for 60s.'
      );
    });

    it('should resume logging after the time window resets', () => {
      const errorSpy = spyOn(console, 'error');
      spyOn(console, 'warn');

      // Exhaust the error window
      for (let i = 0; i < 11; i++) {
        handler.handleError(new Error(`error ${i}`));
      }
      errorSpy.calls.reset();

      // Simulate window expiry by advancing the internal windowStart
      // Access private members for testing (acceptable in unit tests)
      (handler as unknown as { windowStart: number }).windowStart = Date.now() - 61_000;

      handler.handleError(new Error('after reset'));
      expect(errorSpy).toHaveBeenCalledTimes(1);
    });
  });
});

