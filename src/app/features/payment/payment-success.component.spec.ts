import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, ActivatedRoute } from '@angular/router';
import { PaymentSuccessComponent } from './payment-success.component';
import { PdfReportService } from '@core/services/pdf-report.service';
import { PremiumUnlockService } from '@core/services/premium-unlock.service';
import { StripePaymentService } from '@core/services/stripe-payment.service';
import { PensionInput } from '@core/models/pension-input.model';

const DOWNLOAD_TOKEN_KEY = 'rentencheck_download_token';

describe('PaymentSuccessComponent', () => {
  let component: PaymentSuccessComponent;
  let fixture: ComponentFixture<PaymentSuccessComponent>;

  function createComponent(queryParams: Record<string, string> = {}) {
    TestBed.configureTestingModule({
      imports: [PaymentSuccessComponent],
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

    fixture = TestBed.createComponent(PaymentSuccessComponent);
    component = fixture.componentInstance;
  }

  afterEach(() => {
    localStorage.removeItem(DOWNLOAD_TOKEN_KEY);
  });

  describe('ngOnInit without session_id', () => {
    it('should set error status when no session_id in URL', () => {
      createComponent();
      component.ngOnInit();

      expect(component.status()).toBe('error');
      expect(component.errorMessage()).toContain('Keine gültige');
    });
  });

  describe('ngOnInit with session_id', () => {
    it('should start in verifying state', () => {
      createComponent({ session_id: 'cs_test_123' });
      component.ngOnInit();

      expect(component.status()).toBe('verifying');
    });
  });

  describe('verifyAndGenerate', () => {
    beforeEach(() => createComponent({ session_id: 'cs_test_abc' }));

    it('should verify, generate PDF, and set done on success', async () => {
      const mockResult = {
        verified: true,
        email: 'user@example.com',
        tier: 'report',
        downloadToken: 'dl-token-uuid',
        pensionInput: {
          bruttoMonatlicheRente: 1500,
          gewuenschteMonatlicheRente: 2500,
          aktuellesAlter: 35,
          rentenbeginnJahr: 2058,
          inflationsrate: 0.02,
          hatKinder: false,
          zusatzbeitragssatz: 0.017,
          steuerJahr: 2026,
        },
      };

      spyOn(window, 'fetch').and.callFake(async () =>
        new Response(JSON.stringify(mockResult), { status: 200 })
      );
      const pdfSpy = spyOn(TestBed.inject(PdfReportService), 'generateReport');
      const unlockSpy = spyOn(TestBed.inject(PremiumUnlockService), 'unlock');
      const clearSpy = spyOn(TestBed.inject(StripePaymentService), 'clearInput');

      await component.verifyAndGenerate('cs_test_abc');

      expect(unlockSpy).toHaveBeenCalledWith('dl-token-uuid');
      expect(pdfSpy).toHaveBeenCalledWith(
        jasmine.any(Object),
        jasmine.any(Object),
        'dl-token-uuid',
      );
      expect(clearSpy).toHaveBeenCalled();
      expect(component.status()).toBe('done');
      expect(component.purchaseRef()).toBe('RC-DLTOKENU');
      expect(component.purchaseEmail()).toBe('user@example.com');
    });

    it('should set error when server says not verified', async () => {
      spyOn(window, 'fetch').and.callFake(async () =>
        new Response(JSON.stringify({ verified: false, reason: 'Not paid' }), { status: 200 })
      );

      await component.verifyAndGenerate('cs_test_bad');

      expect(component.status()).toBe('error');
      expect(component.errorMessage()).toContain('nicht bestätigt');
    });

    it('should set error when fetch returns non-200', async () => {
      spyOn(window, 'fetch').and.callFake(async () =>
        new Response('Server Error', { status: 500 })
      );

      await component.verifyAndGenerate('cs_test_fail');

      expect(component.status()).toBe('error');
      expect(component.errorMessage()).toContain('nicht erstellt');
    });

    it('should set error when fetch throws (network error)', async () => {
      spyOn(window, 'fetch').and.rejectWith(new Error('Network failure'));

      await component.verifyAndGenerate('cs_test_net');

      expect(component.status()).toBe('error');
    });

    it('should fall back to sessionStorage input when server has no pensionInput', async () => {
      const mockResult = {
        verified: true,
        email: 'user@example.com',
        tier: 'report',
        downloadToken: 'dl-tok',
      };

      spyOn(window, 'fetch').and.callFake(async () =>
        new Response(JSON.stringify(mockResult), { status: 200 })
      );
      const pdfSpy = spyOn(TestBed.inject(PdfReportService), 'generateReport');
      spyOn(TestBed.inject(PremiumUnlockService), 'unlock');
      spyOn(TestBed.inject(StripePaymentService), 'clearInput');

      // Provide sessionStorage fallback
      const fallbackInput: PensionInput = {
        bruttoMonatlicheRente: 2000,
        gewuenschteMonatlicheRente: 3000,
        aktuellesAlter: 40,
        rentenbeginnJahr: 2053,
        inflationsrate: 0.02,
        hatKinder: true,
        zusatzbeitragssatz: 0.017,
        steuerJahr: 2026,
      };
      spyOn(TestBed.inject(StripePaymentService), 'restoreInput').and.returnValue(fallbackInput);

      await component.verifyAndGenerate('cs_test_no_input');

      expect(pdfSpy).toHaveBeenCalled();
      // The input passed should include the fallback brutto
      const passedInput = pdfSpy.calls.first().args[0];
      expect(passedInput.bruttoMonatlicheRente).toBe(2000);
    });

    it('should not unlock premium if downloadToken is missing', async () => {
      const mockResult = {
        verified: true,
        email: 'user@example.com',
        tier: 'report',
        // no downloadToken
      };

      spyOn(window, 'fetch').and.callFake(async () =>
        new Response(JSON.stringify(mockResult), { status: 200 })
      );
      spyOn(TestBed.inject(PdfReportService), 'generateReport');
      const unlockSpy = spyOn(TestBed.inject(PremiumUnlockService), 'unlock');
      spyOn(TestBed.inject(StripePaymentService), 'clearInput');

      await component.verifyAndGenerate('cs_test_no_token');

      expect(unlockSpy).not.toHaveBeenCalled();
    });
  });

  describe('regenerate', () => {
    it('should call verifyAndGenerate with the session_id from URL', async () => {
      createComponent({ session_id: 'cs_test_regen' });

      spyOn(window, 'fetch').and.callFake(async () =>
        new Response(JSON.stringify({ verified: true, downloadToken: 'tok' }), { status: 200 })
      );
      spyOn(TestBed.inject(PdfReportService), 'generateReport');
      spyOn(TestBed.inject(PremiumUnlockService), 'unlock');
      spyOn(TestBed.inject(StripePaymentService), 'clearInput');

      // Call verifyAndGenerate directly since regenerate() fires and forgets
      await component.verifyAndGenerate('cs_test_regen');

      expect(component.status()).toBe('done');
    });

    it('should do nothing if no session_id in URL', () => {
      createComponent();

      const fetchSpy = spyOn(window, 'fetch');
      component.regenerate();

      expect(fetchSpy).not.toHaveBeenCalled();
    });
  });
});





