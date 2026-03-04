import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { StripePaymentService } from '../../core/services/stripe-payment.service';
import { PensionCalculatorService } from '../../core/services/pension-calculator.service';
import { PdfReportService } from '../../core/services/pdf-report.service';
import { DEFAULT_PENSION_INPUT } from '../../core/models/pension-input.model';

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
  template: `
    <div class="success-page">
      <nav class="success-nav">
        <a routerLink="/" class="nav-brand">
          RentenCheck<span class="brand-plus">+</span>
        </a>
      </nav>

      <div class="success-container">
        @if (status() === 'generating') {
          <div class="success-card">
            <div class="spinner"></div>
            <h1>Ihr PDF wird erstellt...</h1>
            <p>Vielen Dank für Ihren Kauf! Ihr persönlicher Renten-Report wird jetzt generiert.</p>
          </div>
        }

        @if (status() === 'done') {
          <div class="success-card">
            <div class="success-icon">✅</div>
            <h1>Report erfolgreich erstellt!</h1>
            <p>Ihr PDF-Report wurde heruntergeladen. Prüfen Sie Ihren Downloads-Ordner.</p>
            <div class="success-actions">
              <button class="btn-download" (click)="regenerate()">
                📄 Erneut herunterladen
              </button>
              <a routerLink="/rechner" class="btn-back">
                ← Zurück zum Rechner
              </a>
            </div>
          </div>
        }

        @if (status() === 'error') {
          <div class="success-card error">
            <div class="success-icon">⚠️</div>
            <h1>Etwas ist schiefgelaufen</h1>
            <p>{{ errorMessage() }}</p>
            <div class="success-actions">
              <a routerLink="/rechner" class="btn-back">
                ← Zurück zum Rechner
              </a>
            </div>
            <p class="support-hint">
              Bei Problemen kontaktieren Sie uns unter
              <a href="mailto:marten.wichmann@gmail.com">marten.wichmann&#64;gmail.com</a>
            </p>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .success-page {
      min-height: 100vh;
      background: var(--color-bg, #f8f9fa);
    }

    .success-nav {
      background: var(--color-primary, #0f3460);
      padding: 0.75rem 2rem;
    }

    .nav-brand {
      font-size: 1.3rem;
      font-weight: 900;
      color: white;
      text-decoration: none;
    }

    .brand-plus {
      color: #e94560;
    }

    .success-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: calc(100vh - 56px);
      padding: 2rem;
    }

    .success-card {
      background: white;
      border-radius: 16px;
      padding: 3rem;
      max-width: 520px;
      width: 100%;
      text-align: center;
      box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
    }

    .success-card.error {
      border-top: 4px solid #e94560;
    }

    .success-icon {
      font-size: 3rem;
      margin-bottom: 1rem;
    }

    h1 {
      font-size: 1.5rem;
      font-weight: 800;
      color: var(--color-primary, #0f3460);
      margin-bottom: 0.75rem;
    }

    p {
      color: #6c757d;
      line-height: 1.6;
      margin-bottom: 1.5rem;
    }

    .success-actions {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      align-items: center;
    }

    .btn-download {
      background: linear-gradient(135deg, #2980b9, #0f3460);
      color: white;
      border: none;
      padding: 0.85rem 2rem;
      border-radius: 8px;
      font-size: 1rem;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-download:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(15, 52, 96, 0.3);
    }

    .btn-back {
      color: var(--color-accent, #2980b9);
      text-decoration: none;
      font-weight: 600;
      font-size: 0.95rem;
    }

    .btn-back:hover {
      text-decoration: underline;
    }

    .support-hint {
      font-size: 0.85rem;
      margin-top: 1.5rem;
      color: #adb5bd;
    }

    .support-hint a {
      color: var(--color-accent, #2980b9);
    }

    /* Spinner */
    .spinner {
      width: 48px;
      height: 48px;
      border: 4px solid #e9ecef;
      border-top-color: var(--color-accent, #2980b9);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: 0 auto 1.5rem;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `],
})
export class PaymentSuccessComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly paymentService = inject(StripePaymentService);
  private readonly calculatorService = inject(PensionCalculatorService);
  private readonly pdfService = inject(PdfReportService);

  readonly status = signal<'generating' | 'done' | 'error'>('generating');
  readonly errorMessage = signal('');

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

