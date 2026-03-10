import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { StripePaymentService } from '@core/services/stripe-payment.service';
import { PensionCalculatorService } from '@core/services/pension-calculator.service';
import { PdfReportService } from '@core/services/pdf-report.service';
import { PremiumUnlockService } from '@core/services/premium-unlock.service';
import { DEFAULT_PENSION_INPUT } from '@core/models/pension-input.model';

/**
 * Payment success page — shown after Stripe redirects back.
 * Automatically generates and downloads the PDF report.
 *
 * Route: /zahlung-erfolgreich?session_id=cs_test_...
 */
@Component({
  selector: 'app-payment-success',
  standalone: true,
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

  readonly status = signal<'generating' | 'done' | 'error'>('generating');
  readonly errorMessage = signal<string>('');

  ngOnInit(): void {
    const sessionId = this.route.snapshot.queryParamMap.get('session_id');

    if (!sessionId) {
      this.status.set('error');
      this.errorMessage.set(
        'Keine gültige Zahlungssitzung gefunden. Bitte versuchen Sie es erneut über den Rechner.'
      );
      return;
    }

    // Small delay so the UI renders the "generating" state
    setTimeout(() => this.generateReport(), 800);
  }

  generateReport(): void {
    try {
      const input = this.paymentService.restoreInput() ?? DEFAULT_PENSION_INPUT;
      const result = this.calculatorService.calculate(input);
      this.pdfService.generateReport(input, result);
      this.premiumService.unlock();
      this.status.set('done');
    } catch (err) {
      console.error('PDF generation error:', err);
      this.status.set('error');
      this.errorMessage.set(
        'Der PDF-Report konnte nicht erstellt werden. Bitte kontaktieren Sie uns für Hilfe.'
      );
    }
  }

  regenerate(): void {
    this.status.set('generating');
    setTimeout(() => this.generateReport(), 500);
  }
}

