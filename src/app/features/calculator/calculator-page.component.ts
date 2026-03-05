import { Component, inject, computed, viewChild, signal } from '@angular/core';
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
import { PensionCalculatorService } from '@core/services/pension-calculator.service';
import { PdfReportService } from '@core/services/pdf-report.service';
import { StripePaymentService } from '@core/services/stripe-payment.service';
import { SavingsCalculatorService } from '@core/services/savings-calculator.service';
import { PremiumUnlockService } from '@core/services/premium-unlock.service';
import { AnalyticsService } from '@core/services/analytics.service';
import { EuroPipe } from '@shared/pipes/euro.pipe';
import { DEFAULT_PENSION_INPUT } from '@core/models/pension-input.model';
import { environment } from '@env/environment';

/**
 * Calculator page — the main pension calculator tool.
 * Previously the root AppComponent, now lazy-loaded at /rechner.
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
    EuroPipe,
  ],
  templateUrl: './calculator-page.component.html',
  styleUrls: ['./calculator-page.component.scss'],
})
export class CalculatorPageComponent {
  private readonly calculatorService = inject(PensionCalculatorService);
  private readonly pdfService = inject(PdfReportService);
  private readonly paymentService = inject(StripePaymentService);
  private readonly savingsService = inject(SavingsCalculatorService);
  private readonly premiumService = inject(PremiumUnlockService);
  private readonly analytics = inject(AnalyticsService);
  private readonly inputPanel = viewChild(InputPanelComponent);

  readonly currentYear = new Date().getFullYear();
  readonly isProcessingPayment = signal(false);
  readonly isPremiumUnlocked = this.premiumService.isUnlocked;
  readonly affiliateUrl = environment.affiliate.brokerUrl;

  /** Default result used before the input panel viewChild is resolved */
  private readonly defaultResult = this.calculatorService.calculate(DEFAULT_PENSION_INPUT);

  /** Expose gewuenschte Rente for the RentenScore */
  readonly gewuenschteRente = computed(() => {
    const panel = this.inputPanel();
    return panel ? panel.pensionInput().gewuenschteMonatlicheRente : DEFAULT_PENSION_INPUT.gewuenschteMonatlicheRente;
  });

  /** Expose hatKinder for ActionTips */
  readonly hatKinder = computed(() => {
    const panel = this.inputPanel();
    return panel ? panel.pensionInput().hatKinder : DEFAULT_PENSION_INPUT.hatKinder;
  });

  /**
   * Reactive pension result — recomputes instantly whenever any input signal changes.
   */
  readonly pensionResult = computed(() => {
    const panel = this.inputPanel();
    if (!panel) {
      return this.defaultResult;
    }
    return this.calculatorService.calculate(panel.pensionInput());
  });

  /** Expose current input for premium components */
  readonly currentInput = computed(() => {
    const panel = this.inputPanel();
    return panel ? panel.pensionInput() : DEFAULT_PENSION_INPUT;
  });

  /**
   * Opportunity cost of waiting one month — how much future wealth is lost
   * by not starting to save one month earlier.
   * Formula: one month's required ETF savings × compound growth over remaining years.
   */
  readonly monthlyCostOfWaiting = computed(() => {
    const r = this.pensionResult();
    if (r.rentenluecke <= 0 || r.jahresBisRente <= 1) return 0;
    const monthlySavings = this.savingsService.calculateRequiredMonthlySavings(
      r.rentenluecke, 0.07, r.jahresBisRente, 25
    );
    // One month's contribution compounded over remaining years
    const monthlyRate = 0.07 / 12;
    const months = r.jahresBisRente * 12;
    const futureValueOfOneMonth = monthlySavings * Math.pow(1 + monthlyRate, months);
    return Math.round(futureValueOfOneMonth);
  });

  onAffiliateBannerClick(): void {
    this.analytics.trackAffiliateClick('action_tips_banner');
  }

  onTierSelected(tier: string): void {
    if (tier === 'report' || tier === 'premium') {
      this.purchaseReport();
    }
  }

  /**
   * Purchase / download the PDF report.
   * Currently bypasses Stripe and generates the PDF directly for testing.
   * TODO: Re-enable Stripe checkout for production.
   */
  async purchaseReport(): Promise<void> {
    this.downloadReport();
    this.premiumService.unlock();
    this.analytics.trackPremiumUnlock();
  }

  /**
   * Direct download — generates the PDF client-side.
   */
  downloadReport(): void {
    const panel = this.inputPanel();
    const input = panel ? panel.pensionInput() : DEFAULT_PENSION_INPUT;
    const result = this.pensionResult();
    this.pdfService.generateReport(input, result);
    this.analytics.trackPdfDownload();
  }
}

