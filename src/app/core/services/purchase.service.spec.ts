import { TestBed } from '@angular/core/testing';
import { PurchaseService, Purchase } from './purchase.service';

const SESSION_KEY = 'rentencheck_session';

function createMockPurchase(overrides: Partial<Purchase> = {}): Purchase {
  return {
    id: '550e8400-e29b-41d4-a716-446655440000',
    email: 'user@example.com',
    stripe_session_id: 'cs_test_123',
    tier: 'report',
    amount: 1490,
    currency: 'eur',
    status: 'paid',
    pension_input: { bruttoMonatlicheRente: 1500, gewuenschteMonatlicheRente: 2500 },
    download_token: 'aaaa-bbbb-cccc-dddd',
    created_at: '2026-03-01T10:00:00Z',
    paid_at: '2026-03-01T10:01:00Z',
    refunded_at: null,
    ...overrides,
  };
}

/** Store a fake valid session so AuthService.getSessionToken() returns a value */
function storeValidSession(): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify({
    email: 'user@example.com',
    token: 'fake-session-token.sig',
    expiresAt: new Date(Date.now() + 60_000).toISOString(),
  }));
}

describe('PurchaseService', () => {
  let service: PurchaseService;

  beforeEach(() => {
    localStorage.removeItem(SESSION_KEY);
    TestBed.configureTestingModule({});
    service = TestBed.inject(PurchaseService);
  });

  afterEach(() => {
    localStorage.removeItem(SESSION_KEY);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('initial state', () => {
    it('should have empty purchases array', () => {
      expect(service.purchases()).toEqual([]);
    });

    it('should not be loading initially', () => {
      expect(service.loading()).toBeFalse();
    });

    it('should have no error initially', () => {
      expect(service.error()).toBeNull();
    });
  });

  describe('loadPurchases', () => {
    it('should set error when not authenticated', async () => {
      await service.loadPurchases();
      expect(service.error()).toBeTruthy();
      expect(service.error()).toContain('angemeldet');
    });

    it('should not be loading after unauthenticated load', async () => {
      await service.loadPurchases();
      expect(service.loading()).toBeFalse();
    });

    it('should fetch and populate purchases when authenticated', async () => {
      storeValidSession();

      const mockPurchases = [
        createMockPurchase(),
        createMockPurchase({ id: 'second', tier: 'premium', amount: 2990 }),
      ];

      spyOn(window, 'fetch').and.callFake(async () =>
        new Response(JSON.stringify({ purchases: mockPurchases }), { status: 200 })
      );

      await service.loadPurchases();

      expect(service.error()).toBeNull();
      expect(service.loading()).toBeFalse();
      expect(service.purchases().length).toBe(2);
      expect(service.purchases()[0].tier).toBe('report');
      expect(service.purchases()[1].tier).toBe('premium');
    });

    it('should send the session token in the request body', async () => {
      storeValidSession();

      const fetchSpy = spyOn(window, 'fetch').and.callFake(async () =>
        new Response(JSON.stringify({ purchases: [] }), { status: 200 })
      );

      await service.loadPurchases();

      const body = JSON.parse(fetchSpy.calls.first().args[1]?.body as string);
      expect(body.sessionToken).toBe('fake-session-token.sig');
    });

    it('should set error when server returns error', async () => {
      storeValidSession();

      spyOn(window, 'fetch').and.callFake(async () =>
        new Response(JSON.stringify({ error: 'Session expired' }), { status: 401 })
      );

      await service.loadPurchases();

      expect(service.error()).toBeTruthy();
      expect(service.purchases()).toEqual([]);
    });

    it('should set error when fetch throws', async () => {
      storeValidSession();

      spyOn(window, 'fetch').and.rejectWith(new Error('Network failure'));

      await service.loadPurchases();

      expect(service.error()).toBeTruthy();
      expect(service.loading()).toBeFalse();
    });

    it('should handle empty purchases array', async () => {
      storeValidSession();

      spyOn(window, 'fetch').and.callFake(async () =>
        new Response(JSON.stringify({ purchases: [] }), { status: 200 })
      );

      await service.loadPurchases();

      expect(service.purchases()).toEqual([]);
      expect(service.error()).toBeNull();
    });

    it('should include refunded purchases in the list', async () => {
      storeValidSession();

      const purchases = [
        createMockPurchase({ status: 'paid' }),
        createMockPurchase({ id: 'ref1', status: 'refunded', refunded_at: '2026-03-10T00:00:00Z' }),
      ];

      spyOn(window, 'fetch').and.callFake(async () =>
        new Response(JSON.stringify({ purchases }), { status: 200 })
      );

      await service.loadPurchases();

      expect(service.purchases().length).toBe(2);
      expect(service.purchases()[1].status).toBe('refunded');
    });

    it('should guard against concurrent calls', async () => {
      storeValidSession();

      let callCount = 0;
      spyOn(window, 'fetch').and.callFake(async () => {
        callCount++;
        // Simulate network delay
        await new Promise(r => setTimeout(r, 50));
        return new Response(JSON.stringify({ purchases: [] }), { status: 200 });
      });

      // Fire two calls concurrently
      const p1 = service.loadPurchases();
      const p2 = service.loadPurchases();
      await Promise.all([p1, p2]);

      expect(callCount).toBe(1); // Only one fetch should have been made
    });
  });
});


