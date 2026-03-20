import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { StripePaymentService } from '@core/services/stripe-payment.service';
import { PensionCalculatorService } from '@core/services/pension-calculator.service';
import { PdfReportService } from '@core/services/pdf-report.service';
import { PremiumUnlockService } from '@core/services/premium-unlock.service';
import { PensionInputValidator } from '@core/models/pension-input-validator';
import { DEFAULT_PENSION_INPUT, PensionInput } from '@core/models/pension-input.model';

/**
 * Payment success page — shown after Stripe redirects back.
 *
 * Flow:
 * 1. Read session_id from query params
 * 2. Call verify-session Netlify function to confirm payment is real
 * 3. Only then generate the PDF and unlock premium
 *
 * Route: /zahlung-erfolgreich?session_id=cs_test_...
 */
@Component({
  selector: 'app-payment-success',
  imports: [RouterLink],
  templateUrl: './payment-success.component.html',
  styleUrls: ['./payment-success.component.scss'],
})
export class PaymentSuccessComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly paymentService = inject(StripePaymentService);
  private readonly calculatorService = inject(PensionCalculatorService);
  private readonly pdfService = inject(PdfReportService);
  private readonly premiumService = inject(PremiumUnlockService);

  readonly status = signal<'verifying' | 'generating' | 'done' | 'error'>('verifying');
  readonly errorMessage = signal<string>('');
  readonly purchaseRef = signal<string>('');
  readonly purchaseEmail = signal<string>('');

  ngOnInit(): void {
    const sessionId = this.route.snapshot.queryParamMap.get('session_id');

    if (!sessionId) {
      this.status.set('error');
      this.errorMessage.set(
        'Keine gültige Zahlungssitzung gefunden. Bitte versuchen Sie es erneut über den Rechner.'
      );
      return;
    }

    // Small delay so the UI renders the "verifying" state
    setTimeout(() => this.verifyAndGenerate(sessionId), 500);
  }

  /**
   * Verify the payment server-side, then generate the PDF.
   */
  async verifyAndGenerate(sessionId: string): Promise<void> {
    try {
      // Step 1: Verify payment with the backend
      this.status.set('verifying');
      const response = await fetch('/.netlify/functions/verify-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });

      if (!response.ok) {
        throw new Error('Verification request failed');
      }

      const result: {
        verified: boolean;
        reason?: string;
        email?: string;
        tier?: string;
        pensionInput?: Record<string, unknown>;
        downloadToken?: string;
      } = await response.json();

      if (!result.verified) {
        this.status.set('error');
        this.errorMessage.set(
          'Die Zahlung konnte nicht bestätigt werden. Bitte versuchen Sie es erneut oder kontaktieren Sie unseren Support.'
        );
        return;
      }

      // Step 2: Store download token for future re-downloads
      if (result.downloadToken) {
        this.premiumService.unlock(result.downloadToken);
      }

      // Step 3: Generate PDF
      this.status.set('generating');

      // Use server-stored input if available, fall back to sessionStorage, then defaults
      let input: PensionInput;
      if (result.pensionInput) {
        input = PensionInputValidator.sanitize(result.pensionInput as unknown as PensionInput);
      } else {
        input = this.paymentService.restoreInput() ?? DEFAULT_PENSION_INPUT;
      }

      const calcResult = this.calculatorService.calculate(input);
      this.pdfService.generateReport(input, calcResult, result.downloadToken);
      this.paymentService.clearInput();

      // Set reference data for the success screen
      if (result.downloadToken) {
        this.purchaseRef.set(this.shortRef(result.downloadToken));
      }
      if (result.email) {
        this.purchaseEmail.set(result.email);
      }

      this.status.set('done');
    } catch (err) {
      console.error('Payment verification/PDF generation error:', err);
      this.status.set('error');
      this.errorMessage.set(
        'Der PDF-Report konnte nicht erstellt werden. Bitte kontaktieren Sie uns für Hilfe.'
      );
    }
  }

  regenerate(): void {
    const sessionId = this.route.snapshot.queryParamMap.get('session_id');
    if (sessionId) {
      this.verifyAndGenerate(sessionId);
    }
  }

  /** Format an ID/token into a short human-readable reference. */
  private shortRef(id: string): string {
    return 'RC-' + id.replace(/-/g, '').substring(0, 8).toUpperCase();
  }
}

