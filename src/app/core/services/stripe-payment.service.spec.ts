import { TestBed } from '@angular/core/testing';
import { StripePaymentService } from './stripe-payment.service';
import { DEFAULT_PENSION_INPUT } from '../models/pension-input.model';

const SESSION_STORAGE_KEY = 'rentencheck_pending_input';

describe('StripePaymentService', () => {
  let service: StripePaymentService;

  beforeEach(() => {
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
    TestBed.configureTestingModule({});
    service = TestBed.inject(StripePaymentService);
    // Prevent page navigation during tests
    spyOn(service, 'redirect');
  });

  afterEach(() => {
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ──────────────────────────────────────────────
  // saveInput / restoreInput
  // ──────────────────────────────────────────────

  describe('saveInput', () => {
    it('should save input to sessionStorage', () => {
      service.saveInput(DEFAULT_PENSION_INPUT);
      const stored = sessionStorage.getItem(SESSION_STORAGE_KEY);
      expect(stored).toBeTruthy();
    });

    it('should serialize input as JSON', () => {
      service.saveInput(DEFAULT_PENSION_INPUT);
      const stored = sessionStorage.getItem(SESSION_STORAGE_KEY);
      const parsed = JSON.parse(stored!);
      expect(parsed.bruttoMonatlicheRente).toBe(DEFAULT_PENSION_INPUT.bruttoMonatlicheRente);
    });
  });

  describe('restoreInput', () => {
    it('should return null when no input is saved', () => {
      expect(service.restoreInput()).toBeNull();
    });

    it('should restore previously saved input', () => {
      service.saveInput(DEFAULT_PENSION_INPUT);
      const restored = service.restoreInput();
      expect(restored).toBeTruthy();
      expect(restored!.bruttoMonatlicheRente).toBe(DEFAULT_PENSION_INPUT.bruttoMonatlicheRente);
      expect(restored!.aktuellesAlter).toBe(DEFAULT_PENSION_INPUT.aktuellesAlter);
      expect(restored!.hatKinder).toBe(DEFAULT_PENSION_INPUT.hatKinder);
    });

    it('should return null for invalid JSON in storage', () => {
      sessionStorage.setItem(SESSION_STORAGE_KEY, 'invalid-json');
      expect(service.restoreInput()).toBeNull();
    });
  });

  describe('clearInput', () => {
    it('should remove saved input from sessionStorage', () => {
      service.saveInput(DEFAULT_PENSION_INPUT);
      expect(sessionStorage.getItem(SESSION_STORAGE_KEY)).toBeTruthy();
      service.clearInput();
      expect(sessionStorage.getItem(SESSION_STORAGE_KEY)).toBeNull();
    });

    it('should not throw when no input is saved', () => {
      expect(() => service.clearInput()).not.toThrow();
    });
  });

  // ──────────────────────────────────────────────
  // startCheckout
  // ──────────────────────────────────────────────

  describe('startCheckout', () => {
    it('should save input before calling fetch', async () => {
      spyOn(window, 'fetch').and.callFake(async () => {
        // Verify input was saved BEFORE fetch is called
        const stored = sessionStorage.getItem(SESSION_STORAGE_KEY);
        expect(stored).toBeTruthy();
        return new Response(JSON.stringify({ url: 'https://checkout.stripe.com/test' }), { status: 200 });
      });

      await service.startCheckout('report', DEFAULT_PENSION_INPUT);
      expect(service.redirect).toHaveBeenCalledWith('https://checkout.stripe.com/test');
    });

    it('should call fetch with correct tier', async () => {
      const fetchSpy = spyOn(window, 'fetch').and.callFake(async () =>
        new Response(JSON.stringify({ url: 'https://checkout.stripe.com/test' }), { status: 200 })
      );

      await service.startCheckout('premium', DEFAULT_PENSION_INPUT);

      expect(fetchSpy).toHaveBeenCalledWith(
        '/.netlify/functions/create-checkout',
        jasmine.objectContaining({
          method: 'POST',
          body: JSON.stringify({ tier: 'premium' }),
        })
      );
    });

    it('should redirect to the checkout URL on success', async () => {
      spyOn(window, 'fetch').and.callFake(async () =>
        new Response(JSON.stringify({ url: 'https://checkout.stripe.com/session123' }), { status: 200 })
      );

      await service.startCheckout('report', DEFAULT_PENSION_INPUT);
      expect(service.redirect).toHaveBeenCalledWith('https://checkout.stripe.com/session123');
    });

    it('should clear input and return false on server error', async () => {
      spyOn(window, 'fetch').and.callFake(async () =>
        new Response(JSON.stringify({ error: 'Server error' }), { status: 500 })
      );

      service.saveInput(DEFAULT_PENSION_INPUT);
      const result = await service.startCheckout('report', DEFAULT_PENSION_INPUT);
      expect(result).toBeFalse();
      expect(sessionStorage.getItem(SESSION_STORAGE_KEY)).toBeNull();
    });

    it('should clear input and return false on network failure', async () => {
      spyOn(window, 'fetch').and.callFake(() => Promise.reject(new Error('Network failure')));

      service.saveInput(DEFAULT_PENSION_INPUT);
      const result = await service.startCheckout('report', DEFAULT_PENSION_INPUT);
      expect(result).toBeFalse();
      expect(sessionStorage.getItem(SESSION_STORAGE_KEY)).toBeNull();
    });
  });
});
