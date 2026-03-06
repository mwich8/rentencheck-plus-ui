import { Component, inject, computed, signal } from '@angular/core';
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
import { SavingsCalculatorService } from '@core/services/savings-calculator.service';
import { PremiumUnlockService } from '@core/services/premium-unlock.service';
import { AnalyticsService } from '@core/services/analytics.service';
import { EuroPipe } from '@shared/pipes/euro.pipe';
import { PensionInput, DEFAULT_PENSION_INPUT } from '@core/models/pension-input.model';
import { environment } from '@env/environment';

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
  private readonly analytics = inject(AnalyticsService);

  readonly currentYear = new Date().getFullYear();
  readonly isPremiumUnlocked = this.premiumService.isUnlocked;
  readonly affiliateUrl = environment.affiliate.brokerUrl;

  /** Collapse state for premium feature sections — collapsed by default */
  readonly scenarioCollapsed = signal(true);
  readonly timelineCollapsed = signal(true);
  readonly optimizationCollapsed = signal(true);

  /** Current pension input — starts with defaults, updated instantly by InputPanel output */
  readonly currentInput = signal<PensionInput>(DEFAULT_PENSION_INPUT);

  readonly gewuenschteRente = computed(() => this.currentInput().gewuenschteMonatlicheRente);
  readonly hatKinder = computed(() => this.currentInput().hatKinder);

  /** Pension result — recomputes whenever currentInput changes. No viewChild, no double-render. */
  readonly pensionResult = computed(() =>
    this.calculatorService.calculate(this.currentInput())
  );

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
      r.rentenluecke, 0.07, r.jahresBisRente, 25
    );
    const delayedYears = r.jahresBisRente - 1 / 12;
    const later = this.savingsService.calculateRequiredMonthlySavings(
      r.rentenluecke, 0.07, delayedYears, 25
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
      this.purchaseReport();
    }
  }

  async purchaseReport(): Promise<void> {
    this.downloadReport();
    this.premiumService.unlock();
    this.analytics.trackPremiumUnlock();
  }

  downloadReport(): void {
    const input = this.currentInput();
    const result = this.pensionResult();
    this.pdfService.generateReport(input, result);
    this.analytics.trackPdfDownload();
  }
}

