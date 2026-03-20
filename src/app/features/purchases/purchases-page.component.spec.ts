import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, ActivatedRoute } from '@angular/router';
import { PurchasesPageComponent } from './purchases-page.component';
import { AuthService } from '@core/services/auth.service';
import { PurchaseService, Purchase } from '@core/services/purchase.service';
import { PdfReportService } from '@core/services/pdf-report.service';
import { PremiumUnlockService } from '@core/services/premium-unlock.service';
import { AnalyticsService } from '@core/services/analytics.service';

const SESSION_KEY = 'rentencheck_session';
const DOWNLOAD_TOKEN_KEY = 'rentencheck_download_token';

function createMockPurchase(overrides: Partial<Purchase> = {}): Purchase {
  return {
    id: 'purchase-1',
    email: 'user@example.com',
    stripe_session_id: 'cs_test_123',
    tier: 'report',
    amount: 1490,
    currency: 'eur',
    status: 'paid',
    pension_input: {
      bruttoMonatlicheRente: 1500,
      gewuenschteMonatlicheRente: 2500,
      aktuellesAlter: 35,
      rentenbeginnJahr: 2058,
      inflationsrate: 0.02,
      hatKinder: false,
      zusatzbeitragssatz: 0.017,
      steuerJahr: 2026,
    },
    download_token: 'aaaa-bbbb-cccc-dddd',
    created_at: '2026-03-01T10:00:00Z',
    paid_at: '2026-03-01T10:01:00Z',
    refunded_at: null,
    ...overrides,
  };
}

describe('PurchasesPageComponent', () => {
  let component: PurchasesPageComponent;
  let fixture: ComponentFixture<PurchasesPageComponent>;
  let authService: AuthService;
  let purchaseService: PurchaseService;

  function createComponent(queryParams: Record<string, string> = {}) {
    TestBed.configureTestingModule({
      imports: [PurchasesPageComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: {
                get: (key: string) => queryParams[key] ?? null,
              },
            },
          },
        },
      ],
    });

    fixture = TestBed.createComponent(PurchasesPageComponent);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService);
    purchaseService = TestBed.inject(PurchaseService);
  }

  afterEach(() => {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(DOWNLOAD_TOKEN_KEY);
  });

  describe('initial state (not logged in, no token)', () => {
    beforeEach(() => createComponent());

    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should not be verifying a token', () => {
      expect(component.verifyingToken()).toBeFalse();
    });

    it('should not show email sent state', () => {
      expect(component.emailSent()).toBeFalse();
    });

    it('should have no email error', () => {
      expect(component.emailError()).toBeNull();
    });
  });

  describe('magic link token in URL', () => {
    it('should verify the token on init', async () => {
      createComponent({ token: 'magic-token-xyz' });

      const verifySpy = spyOn(authService, 'verifyToken').and.resolveTo(null);

      component.ngOnInit();

      expect(component.verifyingToken()).toBeTrue();
      await fixture.whenStable();
      expect(verifySpy).toHaveBeenCalledWith('magic-token-xyz');
    });

    it('should set emailError when verification fails', async () => {
      createComponent({ token: 'bad-token' });

      spyOn(authService, 'verifyToken').and.resolveTo('Link ist abgelaufen');

      component.ngOnInit();
      await fixture.whenStable();

      expect(component.verifyingToken()).toBeFalse();
      expect(component.emailError()).toContain('abgelaufen');
    });

    it('should not verify if already logged in', () => {
      createComponent({ token: 'some-token' });

      authService.currentUser.set('user@example.com');
      const verifySpy = spyOn(authService, 'verifyToken');

      component.ngOnInit();

      expect(verifySpy).not.toHaveBeenCalled();
    });
  });

  describe('sendMagicLink', () => {
    beforeEach(() => createComponent());

    it('should set error for empty email', async () => {
      const input = { value: '', trim: () => '' } as unknown as HTMLInputElement;
      await component.sendMagicLink(input);
      expect(component.emailError()).toBeTruthy();
    });

    it('should set error for email without @', async () => {
      const input = { value: 'notanemail', trim: () => 'notanemail' } as unknown as HTMLInputElement;
      await component.sendMagicLink(input);
      expect(component.emailError()).toBeTruthy();
    });

    it('should call auth.sendMagicLink and set emailSent on success', async () => {
      spyOn(authService, 'sendMagicLink').and.resolveTo(null);

      const input = { value: 'test@example.com' } as HTMLInputElement;
      await component.sendMagicLink(input);

      expect(component.emailSent()).toBeTrue();
      expect(component.emailError()).toBeNull();
    });

    it('should set emailError on send failure', async () => {
      spyOn(authService, 'sendMagicLink').and.resolveTo('Too many requests');

      const input = { value: 'test@example.com' } as HTMLInputElement;
      await component.sendMagicLink(input);

      expect(component.emailSent()).toBeFalse();
      expect(component.emailError()).toBe('Too many requests');
    });
  });

  describe('regeneratePdf', () => {
    beforeEach(() => createComponent());

    it('should not proceed if pension_input is null', async () => {
      const purchase = createMockPurchase({ pension_input: null });
      const fetchSpy = spyOn(window, 'fetch');

      await component.regeneratePdf(purchase);

      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('should not proceed if download_token is null', async () => {
      const purchase = createMockPurchase({ download_token: null });
      const fetchSpy = spyOn(window, 'fetch');

      await component.regeneratePdf(purchase);

      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('should set regeneratingId during the process', async () => {
      const purchase = createMockPurchase();

      spyOn(window, 'fetch').and.callFake(async () =>
        new Response(JSON.stringify({ valid: true }), { status: 200 })
      );
      spyOn(TestBed.inject(PdfReportService), 'generateReport');

      const promise = component.regeneratePdf(purchase);
      expect(component.regeneratingId()).toBe('purchase-1');

      await promise;
      expect(component.regeneratingId()).toBeNull();
    });

    it('should generate PDF and unlock premium on successful verification', async () => {
      const purchase = createMockPurchase();

      spyOn(window, 'fetch').and.callFake(async () =>
        new Response(JSON.stringify({ valid: true }), { status: 200 })
      );
      const pdfSpy = spyOn(TestBed.inject(PdfReportService), 'generateReport');
      const unlockSpy = spyOn(TestBed.inject(PremiumUnlockService), 'unlock');
      const trackSpy = spyOn(TestBed.inject(AnalyticsService), 'trackPdfDownload');

      await component.regeneratePdf(purchase);

      expect(pdfSpy).toHaveBeenCalled();
      expect(unlockSpy).toHaveBeenCalledWith('aaaa-bbbb-cccc-dddd');
      expect(trackSpy).toHaveBeenCalled();
      expect(component.regenerateError()).toBeNull();
    });

    it('should pass download_token as reportId to generateReport', async () => {
      const purchase = createMockPurchase({ download_token: 'my-unique-token' });

      spyOn(window, 'fetch').and.callFake(async () =>
        new Response(JSON.stringify({ valid: true }), { status: 200 })
      );
      const pdfSpy = spyOn(TestBed.inject(PdfReportService), 'generateReport');

      await component.regeneratePdf(purchase);

      expect(pdfSpy).toHaveBeenCalledWith(
        jasmine.any(Object),
        jasmine.any(Object),
        'my-unique-token',
      );
    });

    it('should set regenerateError when token is invalid', async () => {
      const purchase = createMockPurchase();

      spyOn(window, 'fetch').and.callFake(async () =>
        new Response(JSON.stringify({ valid: false, reason: 'Refunded' }), { status: 200 })
      );

      await component.regeneratePdf(purchase);

      expect(component.regenerateError()).toBeTruthy();
      expect(component.regenerateError()).toContain('nicht mehr gültig');
    });

    it('should set regenerateError when server returns non-200', async () => {
      const purchase = createMockPurchase();

      spyOn(window, 'fetch').and.callFake(async () =>
        new Response('Server Error', { status: 500 })
      );

      await component.regeneratePdf(purchase);

      expect(component.regenerateError()).toBeTruthy();
    });

    it('should set regenerateError when fetch throws', async () => {
      const purchase = createMockPurchase();

      spyOn(window, 'fetch').and.rejectWith(new Error('Network failure'));

      await component.regeneratePdf(purchase);

      expect(component.regenerateError()).toBeTruthy();
      expect(component.regeneratingId()).toBeNull();
    });
  });

  describe('signOut', () => {
    beforeEach(() => createComponent());

    it('should sign out and clear purchases', async () => {
      authService.currentUser.set('user@example.com');
      purchaseService.purchases.set([createMockPurchase()]);

      await component.signOut();

      expect(authService.isLoggedIn()).toBeFalse();
      expect(purchaseService.purchases()).toEqual([]);
      expect(component.emailSent()).toBeFalse();
    });
  });

  describe('utility methods', () => {
    beforeEach(() => createComponent());

    it('should format amount from cents to euros', () => {
      expect(component.formatAmount(1490)).toBe('14,90');
      expect(component.formatAmount(2990)).toBe('29,90');
      expect(component.formatAmount(0)).toBe('0,00');
    });

    it('should return correct tier labels', () => {
      expect(component.tierLabel('report')).toBe('Detail-Analyse');
      expect(component.tierLabel('premium')).toBe('Renten-Strategie');
    });
  });
});


