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
});

