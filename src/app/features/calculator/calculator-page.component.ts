import { Component, inject, computed, signal, effect } from '@angular/core';
import { RouterLink } from '@angular/router';
import { InputPanelComponent } from './input-panel/input-panel.component';
import { ResultPanelComponent } from './result-panel/result-panel.component';
import { WaterfallChartComponent } from '@features/chart/waterfall-chart.component';
import { ProjectionChartComponent } from '@features/chart/projection-chart.component';
import { PricingTierComponent } from './pricing-tier/pricing-tier.component';
import { ActionTipsComponent } from './action-tips/action-tips.component';
import { PremiumTeaserComponent } from './premium-teaser/premium-teaser.component';
import { ScenarioComparisonComponent } from './premium/scenario-comparison.component';
import { WhatIfAnalysisComponent } from './premium/what-if-analysis.component';
import { OptimizationStrategiesComponent } from './premium/optimization-strategies.component';
import { EtfExplainerComponent } from './etf-explainer/etf-explainer.component';
import { EmailCaptureComponent } from './email-capture/email-capture.component';
import { ScoreShareCardComponent } from './score-share/score-share-card.component';
import { PensionCalculatorService } from '@core/services/pension-calculator.service';
import { PdfReportService } from '@core/services/pdf-report.service';
import { SavingsCalculatorService } from '@core/services/savings-calculator.service';
import { PremiumUnlockService } from '@core/services/premium-unlock.service';
import { StripePaymentService } from '@core/services/stripe-payment.service';
import { AnalyticsService } from '@core/services/analytics.service';
import { RentenScoreService } from '@core/services/renten-score.service';
import { SettingsService } from '@core/services/settings.service';
import { AuthService } from '@core/services/auth.service';
import { EuroPipe } from '@shared/pipes/euro.pipe';
import { PensionInput, DEFAULT_PENSION_INPUT } from '@core/models/pension-input.model';
import { PensionResult } from '@core/models/pension-result.model';
import { environment } from '@env/environment';
import { DEFAULT_ANNUAL_ETF_RETURN, DEFAULT_PAYOUT_YEARS } from '@core/constants/calculator-defaults.const';
import { LATEST_STEUER_JAHR } from '@core/constants/tax-brackets.const';

/**
 * Calculator page — the main pension calculator tool.
 * Uses signal-based input flow: InputPanel emits → currentInput signal → pensionResult computed.
 * No viewChild dependency, so the first render is immediate with default values.
 */
@Component({
  selector: 'app-calculator-page',
  standalone: true,
  imports: [
    RouterLink,
    InputPanelComponent,
    ResultPanelComponent,
    WaterfallChartComponent,
    ProjectionChartComponent,
    PricingTierComponent,
    ActionTipsComponent,
    PremiumTeaserComponent,
    ScenarioComparisonComponent,
    WhatIfAnalysisComponent,
    OptimizationStrategiesComponent,
    EtfExplainerComponent,
    EmailCaptureComponent,
    ScoreShareCardComponent,
    EuroPipe,
  ],
  templateUrl: './calculator-page.component.html',
  styleUrls: ['./calculator-page.component.scss'],
})
export class CalculatorPageComponent {
  private readonly calculatorService = inject(PensionCalculatorService);
  private readonly pdfService = inject(PdfReportService);
  private readonly savingsService = inject(SavingsCalculatorService);
  private readonly premiumService = inject(PremiumUnlockService);
  private readonly stripeService = inject(StripePaymentService);
  private readonly analytics = inject(AnalyticsService);
  private readonly scoreService = inject(RentenScoreService);
  protected readonly settingsService = inject(SettingsService);
  protected readonly auth = inject(AuthService);

  readonly currentYear: number = new Date().getFullYear();
  readonly isPremiumUnlocked = this.premiumService.isUnlocked;
  readonly affiliateUrl: string = environment.affiliate.brokerUrl;
  readonly steuerJahr: number = LATEST_STEUER_JAHR;
  readonly freeMode: boolean = environment.freeMode;

  /** Payment & download flow state */
  readonly paymentPending = signal<boolean>(false);
  readonly paymentError = signal<string | null>(null);
  readonly downloadPending = signal<boolean>(false);

  /** Email capture flow state */
  readonly showEmailCapture = signal<boolean>(false);
  readonly previewPending = signal<boolean>(false);

  /** Collapse state for premium feature sections — collapsed by default */
  readonly scenarioCollapsed = signal<boolean>(true);
  readonly timelineCollapsed = signal<boolean>(true);
  readonly optimizationCollapsed = signal<boolean>(true);

  /** Current pension input — starts with defaults, updated instantly by InputPanel output */
  readonly currentInput = signal<PensionInput>(DEFAULT_PENSION_INPUT);

  /** Cloud-loaded settings to pre-fill the input panel */
  readonly cloudSettings = this.settingsService.cloudSettings;

  /** Whether a settings save is in progress */
  readonly settingsSaving = this.settingsService.loading;

  /** Whether settings were saved successfully (auto-clears after 3s) */
  readonly settingsSaved = this.settingsService.saveSuccess;

  constructor() {
    // Auto-load cloud settings when user logs in
    effect(() => {
      if (this.auth.isLoggedIn()) {
        this.settingsService.loadSettings();
      }
    });
  }

  readonly gewuenschteRente = computed(() => this.currentInput().gewuenschteMonatlicheRente);
  readonly hatKinder = computed(() => this.currentInput().hatKinder);

  /** Computed Renten-Score for sharing and email capture */
  readonly rentenScore = computed(() =>
    this.scoreService.computeScore(this.pensionResult(), this.gewuenschteRente())
  );

  /** Pension result — recomputes whenever currentInput changes. Error-safe with fallback. */
  readonly pensionResult = computed<PensionResult>(() => {
    try {
      return this.calculatorService.calculate(this.currentInput());
    } catch (e) {
      console.error('Pension calculation failed:', e);
      return this.calculatorService.calculate(DEFAULT_PENSION_INPUT);
    }
  });

  /** Called by InputPanelComponent whenever any input field changes */
  onInputChange(input: PensionInput): void {
    this.currentInput.set(input);
  }

  /**
   * Total extra cost of waiting one month — how much MORE you pay in total
   * over the entire savings period until retirement because you delayed by 1 month.
   * (increased monthly rate × remaining months after delay)
   */
  readonly monthlyCostOfWaiting = computed(() => {
    const r = this.pensionResult();
    if (r.rentenluecke <= 0 || r.jahresBisRente <= 1) return 0;
    const now = this.savingsService.calculateRequiredMonthlySavings(
      r.rentenluecke, DEFAULT_ANNUAL_ETF_RETURN, r.jahresBisRente, DEFAULT_PAYOUT_YEARS
    );
    const delayedYears = r.jahresBisRente - 1 / 12;
    const later = this.savingsService.calculateRequiredMonthlySavings(
      r.rentenluecke, DEFAULT_ANNUAL_ETF_RETURN, delayedYears, DEFAULT_PAYOUT_YEARS
    );
    const monthlyIncrease = later - now;
    const remainingMonths = delayedYears * 12;
    return Math.round(monthlyIncrease * remainingMonths);
  });

  onAffiliateBannerClick(): void {
    this.analytics.trackAffiliateClick('action_tips_banner');
  }

  onTierSelected(tier: string): void {
    if (tier === 'report' || tier === 'premium') {
      this.unlockAndDownload(tier as 'report' | 'premium');
    }
  }

  /**
   * Main entry point for unlocking and downloading a report.
   * - In freeMode: directly unlocks premium and generates the PDF (no Stripe).
   * - When freeMode is off: redirects to Stripe Checkout for payment.
   */
  async unlockAndDownload(tier: 'report' | 'premium' = 'report'): Promise<void> {
    // Already unlocked → verify token and re-download
    if (this.isPremiumUnlocked()) {
      await this.downloadReport();
      return;
    }

    // Free mode → skip Stripe, unlock directly, generate PDF
    if (this.freeMode) {
      await this.freeUnlockAndDownload();
      return;
    }

    // Paid mode → redirect to Stripe Checkout
    await this.startStripeCheckout(tier);
  }

  /**
   * Alias for template — backwards-compatible with (click)="purchaseReport()".
   */
  async purchaseReport(tier: 'report' | 'premium' = 'report'): Promise<void> {
    await this.unlockAndDownload(tier);
  }

  /**
   * Free mode: show email capture overlay first, then unlock + generate PDF.
   * The email capture is optional — user can skip and proceed directly.
   */
  private async freeUnlockAndDownload(): Promise<void> {
    this.showEmailCapture.set(true);
  }

  /**
   * Called when email capture completes (submitted or skipped).
   * Proceeds with the actual PDF generation.
   */
  async onEmailCaptureComplete(): Promise<void> {
    this.showEmailCapture.set(false);
    this.downloadPending.set(true);
    this.paymentError.set(null);

    try {
      const freeToken = crypto.randomUUID();
      this.premiumService.unlock(freeToken);

      const input = this.currentInput();
      const result = this.pensionResult();
      this.pdfService.generateReport(input, result, freeToken);
      this.analytics.trackPdfDownload();
    } catch {
      this.paymentError.set('PDF-Erstellung fehlgeschlagen. Bitte versuchen Sie es erneut.');
    } finally {
      this.downloadPending.set(false);
    }
  }

  /**
   * Download a 1-page watermarked preview PDF (free, no unlock required).
   */
  downloadPreview(): void {
    this.previewPending.set(true);
    try {
      const input = this.currentInput();
      const result = this.pensionResult();
      this.pdfService.generatePreview(input, result);
      this.analytics.trackPreviewDownload();
    } catch {
      this.paymentError.set('Vorschau konnte nicht erstellt werden.');
    } finally {
      this.previewPending.set(false);
    }
  }

  /**
   * Paid mode: Start the Stripe Checkout flow.
   * Redirects user to Stripe's hosted checkout page.
   */
  private async startStripeCheckout(tier: 'report' | 'premium'): Promise<void> {
    this.paymentPending.set(true);
    this.paymentError.set(null);

    try {
      const success = await this.stripeService.startCheckout(tier, this.currentInput());
      if (!success) {
        this.paymentError.set('Zahlung konnte nicht gestartet werden. Bitte versuchen Sie es erneut.');
      }
    } catch {
      this.paymentError.set('Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es erneut.');
    } finally {
      this.paymentPending.set(false);
    }
  }

  /**
   * Download the PDF report.
   * - In freeMode: generate directly (no server verification needed).
   * - In paid mode: verify download token server-side first.
   */
  async downloadReport(): Promise<void> {
    this.downloadPending.set(true);
    this.paymentError.set(null);

    try {
      // In paid mode: server-side verification before PDF generation
      if (!this.freeMode) {
        const verification = await this.premiumService.verifyToken();

        if (!verification.valid) {
          this.premiumService.lock();
          this.paymentError.set(
            'Ihr Download-Zugang ist nicht mehr gültig. Bitte kontaktieren Sie uns oder kaufen Sie erneut.'
          );
          return;
        }
      }

      const input = this.currentInput();
      const result = this.pensionResult();
      const reportId = this.premiumService.getToken() ?? undefined;
      this.pdfService.generateReport(input, result, reportId);
      this.analytics.trackPdfDownload();
    } catch {
      this.paymentError.set('PDF-Erstellung fehlgeschlagen. Bitte versuchen Sie es erneut.');
    } finally {
      this.downloadPending.set(false);
    }
  }

  /**
   * Save the current calculator settings to the cloud.
   * Only available for logged-in users.
   */
  async saveSettings(): Promise<void> {
    await this.settingsService.saveSettings(this.currentInput());
  }
}

