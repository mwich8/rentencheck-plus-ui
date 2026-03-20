import { Component, ChangeDetectionStrategy, inject, signal, effect, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import { PurchaseService, Purchase } from '@core/services/purchase.service';
import { PensionCalculatorService } from '@core/services/pension-calculator.service';
import { PdfReportService } from '@core/services/pdf-report.service';
import { PremiumUnlockService } from '@core/services/premium-unlock.service';
import { AnalyticsService } from '@core/services/analytics.service';
import { PensionInputValidator } from '@core/models/pension-input-validator';
import { PensionInput } from '@core/models/pension-input.model';
import { DatePipe } from '@angular/common';

/**
 * "Meine Käufe" page — purchase recovery & re-download.
 *
 * - If URL has ?token=xxx: verify the magic link token → auto-login
 * - If not logged in: show Magic Link email form
 * - If logged in: show list of purchases with re-download buttons
 *
 * Re-downloads are verified server-side via the download_token before PDF generation.
 *
 * Route: /meine-kaeufe
 */
@Component({
  selector: 'app-purchases-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, DatePipe],
  templateUrl: './purchases-page.component.html',
  styleUrl: './purchases-page.component.scss',
})
export class PurchasesPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  protected readonly auth = inject(AuthService);
  protected readonly purchaseService = inject(PurchaseService);
  private readonly calculatorService = inject(PensionCalculatorService);
  private readonly pdfService = inject(PdfReportService);
  private readonly premiumService = inject(PremiumUnlockService);
  private readonly analytics = inject(AnalyticsService);

  /** State for the Magic Link email form */
  readonly emailSent = signal(false);
  readonly emailError = signal<string | null>(null);
  readonly sendingEmail = signal(false);

  /** State for magic link verification (from URL query param) */
  readonly verifyingToken = signal(false);

  /** State for PDF re-generation */
  readonly regeneratingId = signal<string | null>(null);
  readonly regenerateError = signal<string | null>(null);

  constructor() {
    // Reactively load purchases whenever auth state changes to logged-in.
    effect(() => {
      if (this.auth.isLoggedIn()) {
        this.purchaseService.loadPurchases();
      }
    });
  }

  ngOnInit(): void {
    // Check for magic link token in URL (user clicked the email link)
    const token = this.route.snapshot.queryParamMap.get('token');
    if (token && !this.auth.isLoggedIn()) {
      this.verifyMagicLinkToken(token);
    }
  }

  /**
   * Verify a magic link token from the URL.
   */
  private async verifyMagicLinkToken(token: string): Promise<void> {
    this.verifyingToken.set(true);
    this.emailError.set(null);

    const error = await this.auth.verifyToken(token);

    this.verifyingToken.set(false);

    if (error) {
      this.emailError.set(error);
    }
    // If success, auth.isLoggedIn() becomes true → effect triggers loadPurchases
  }

  /**
   * Send a Magic Link to the entered email.
   */
  async sendMagicLink(emailInput: HTMLInputElement): Promise<void> {
    const email = emailInput.value.trim().toLowerCase();
    if (!email || !email.includes('@')) {
      this.emailError.set('Bitte geben Sie eine gültige E-Mail-Adresse ein.');
      return;
    }

    this.sendingEmail.set(true);
    this.emailError.set(null);

    const error = await this.auth.sendMagicLink(email);
    this.sendingEmail.set(false);

    if (error) {
      this.emailError.set(error);
    } else {
      this.emailSent.set(true);
    }
  }

  /**
   * Re-generate and download a PDF for a specific purchase.
   * Verifies the download token server-side before generating.
   */
  async regeneratePdf(purchase: Purchase): Promise<void> {
    if (!purchase.pension_input || !purchase.download_token) return;

    this.regeneratingId.set(purchase.id);
    this.regenerateError.set(null);

    try {
      const response = await fetch('/.netlify/functions/verify-download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ downloadToken: purchase.download_token }),
      });

      if (!response.ok) {
        this.regenerateError.set('Server-Fehler bei der Token-Überprüfung. Bitte versuchen Sie es erneut.');
        return;
      }

      let result: { valid: boolean; reason?: string };
      try {
        result = await response.json();
      } catch {
        this.regenerateError.set('Ungültige Server-Antwort. Bitte versuchen Sie es erneut.');
        return;
      }

      if (!result.valid) {
        this.regenerateError.set('Download-Token ist nicht mehr gültig. Der Kauf wurde möglicherweise erstattet.');
        return;
      }

      const input: PensionInput = PensionInputValidator.sanitize(
        purchase.pension_input as unknown as PensionInput
      );
      const calcResult = this.calculatorService.calculate(input);
      this.pdfService.generateReport(input, calcResult, purchase.download_token ?? undefined);

      this.premiumService.unlock(purchase.download_token);
      this.analytics.trackPdfDownload();
    } catch (err) {
      console.error('[PurchasesPage] PDF re-generation failed:', err);
      this.regenerateError.set('PDF konnte nicht erstellt werden. Bitte versuchen Sie es erneut.');
    } finally {
      this.regeneratingId.set(null);
    }
  }

  formatAmount(cents: number): string {
    return (cents / 100).toFixed(2).replace('.', ',');
  }

  /** Format a UUID into a short human-readable reference. */
  shortRef(id: string): string {
    return 'RC-' + id.replace(/-/g, '').substring(0, 8).toUpperCase();
  }

  tierLabel(tier: string): string {
    return tier === 'premium' ? 'Renten-Strategie' : 'Detail-Analyse';
  }

  async signOut(): Promise<void> {
    await this.auth.signOut();
    this.emailSent.set(false);
    this.purchaseService.purchases.set([]);
  }
}




