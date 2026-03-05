import { Component, inject, computed, viewChild, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { InputPanelComponent } from './input-panel/input-panel.component';
import { ResultPanelComponent } from './result-panel/result-panel.component';
import { WaterfallChartComponent } from '../chart/waterfall-chart.component';
import { ProjectionChartComponent } from '../chart/projection-chart.component';
import { PricingTierComponent } from './pricing-tier/pricing-tier.component';
import { ActionTipsComponent } from './action-tips/action-tips.component';
import { PremiumTeaserComponent } from './premium-teaser/premium-teaser.component';
import { ScenarioComparisonComponent } from './premium/scenario-comparison.component';
import { WhatIfAnalysisComponent } from './premium/what-if-analysis.component';
import { OptimizationStrategiesComponent } from './premium/optimization-strategies.component';
import { EtfExplainerComponent } from './etf-explainer/etf-explainer.component';
import { PensionCalculatorService } from '../../core/services/pension-calculator.service';
import { PdfReportService } from '../../core/services/pdf-report.service';
import { StripePaymentService } from '../../core/services/stripe-payment.service';
import { SavingsCalculatorService } from '../../core/services/savings-calculator.service';
import { PremiumUnlockService } from '../../core/services/premium-unlock.service';
import { EuroPipe } from '../../shared/pipes/euro.pipe';
import { DEFAULT_PENSION_INPUT } from '../../core/models/pension-input.model';

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
  template: `
    <!-- Compact Navbar -->
    <nav class="calc-navbar">
      <div class="container nav-inner">
        <a routerLink="/" class="nav-brand">
          RentenCheck<span class="brand-plus">+</span>
        </a>
        <div class="nav-badges">
          <span class="nav-badge">✓ Kostenlos</span>
          <span class="nav-badge">✓ <a href="https://www.gesetze-im-internet.de/estg/__32a.html" target="_blank" rel="noopener">§32a EStG</a>-konform</span>
        </div>
      </div>
    </nav>

    <!-- Hero Header -->
    <header class="hero bg-gradient-dark">
      <div class="container hero-content">
        <h1 class="hero-title">
          Die brutale Wahrheit<br>
          <span class="hero-highlight">über Ihre Rente</span>
        </h1>
        <p class="hero-subtitle">
          Erfahren Sie, was von Ihrer gesetzlichen Rente wirklich übrig bleibt —
          nach Steuern, Sozialabgaben und Inflation.
        </p>
        <div class="hero-cta">
          <span class="hero-badge">✓ Kostenlos</span>
          <span class="hero-badge">✓ Sofort-Ergebnis</span>
          <span class="hero-badge">✓ <a href="https://www.gesetze-im-internet.de/estg/__32a.html" target="_blank" rel="noopener">§32a EStG</a>-konform</span>
        </div>
        <a href="#rechner" class="scroll-cta" aria-label="Zum Rechner scrollen">
          <span class="scroll-arrow">↓</span>
        </a>
      </div>
    </header>

    <!-- Main Calculator Grid -->
    <main class="container calculator-section" id="rechner">
      <div class="calculator-grid">
        <!-- Left Column: Input -->
        <div class="card input-card animate-fade-in-up">
          <app-input-panel />
        </div>

        <!-- Right Column: Results -->
        <div class="card result-card animate-fade-in-up" style="animation-delay: 0.15s">
          <app-result-panel [result]="pensionResult()" [gewuenschteRente]="gewuenschteRente()" />
        </div>
      </div>

      <!-- PDF Download Button -->
      <div class="pdf-download-section animate-fade-in-up" style="animation-delay: 0.2s">
        @if (isPremiumUnlocked()) {
          <button class="pdf-download-btn pdf-unlocked-btn" (click)="downloadReport()">
            <span class="pdf-icon">📄</span>
            <span class="pdf-text">
              <strong>PDF-Report herunterladen</strong>
              <small>3-seitiger Report · 30-Jahre-Prognose · Persönliche Handlungsempfehlungen</small>
            </span>
            <span class="pdf-arrow">↓</span>
          </button>
        } @else {
          <button class="pdf-download-btn" (click)="purchaseReport()">
            <span class="pdf-icon">📄</span>
            <span class="pdf-text">
              <strong>Kostenloser PDF-Report</strong>
              <small>3-seitiger Report · 30-Jahre-Prognose · Persönliche Handlungsempfehlungen · Sofort-Download</small>
            </span>
            <span class="pdf-arrow">→</span>
          </button>
        }
      </div>

      <!-- Urgency Banner (only when not unlocked) -->
      @if (!isPremiumUnlocked() && pensionResult().rentenluecke > 0 && monthlyCostOfWaiting() > 0) {
        <div class="urgency-banner animate-fade-in-up" style="animation-delay: 0.22s">
          <div class="urgency-icon">⏳</div>
          <div class="urgency-content">
            <strong class="urgency-headline">Jeder Monat, den Sie warten, kostet Sie ca. {{ monthlyCostOfWaiting() | euro }}</strong>
            <span class="urgency-detail">an entgangenem Vermögensaufbau durch den Zinseszinseffekt.</span>
          </div>
          <button class="urgency-cta" (click)="purchaseReport()">Jetzt Report sichern →</button>
        </div>
      }

      <!-- Action Tips Section -->
      <div class="action-tips-section animate-fade-in-up" style="animation-delay: 0.25s">
        <app-action-tips [result]="pensionResult()" [hatKinder]="hatKinder()" [unlocked]="isPremiumUnlocked()" (unlock)="onTierSelected($event)" />
      </div>

      <!-- ETF Explainer (only when pension gap exists) -->
      @if (pensionResult().rentenluecke > 0 && pensionResult().jahresBisRente > 0) {
        <div class="etf-explainer-section animate-fade-in-up" style="animation-delay: 0.27s">
          <app-etf-explainer [result]="pensionResult()" />
        </div>
      }

      <!-- What You Get Preview (only when not unlocked) -->
      @if (!isPremiumUnlocked()) {
        <div class="report-preview-section animate-fade-in-up" style="animation-delay: 0.28s">
          <h3 class="preview-title">
            <span class="preview-icon">📋</span> Was Sie im PDF-Report erhalten
          </h3>
          <div class="preview-grid">
            <div class="preview-card">
              <span class="preview-card-icon">📊</span>
              <h4>30-Jahre-Inflationsprognose</h4>
              <p>Sehen Sie exakt, wie Inflation Ihre Rente über 30 Jahre entwertet — Jahr für Jahr aufgeschlüsselt.</p>
            </div>
            <div class="preview-card">
              <span class="preview-card-icon">🎯</span>
              <h4>Persönliche Handlungsempfehlungen</h4>
              <p>Alle Tipps mit konkreten Beträgen — inkl. ETF-Sparplan, staatliche Förderung und Kindererziehungszeiten.</p>
            </div>
            <div class="preview-card">
              <span class="preview-card-icon">📄</span>
              <h4>Professionelles PDF</h4>
              <p>3-seitiger Report zum Ausdrucken, Teilen oder für Ihren Finanz- oder Steuerberater.</p>
            </div>
          </div>
          <div class="preview-cta-wrap">
            <button class="preview-cta" (click)="purchaseReport()">
              Kostenlos herunterladen →
            </button>
          </div>
        </div>
      }

      <!-- Charts Section -->
      <div class="charts-section animate-fade-in-up" style="animation-delay: 0.3s">
        <div class="card chart-card">
          <app-waterfall-chart [result]="pensionResult()" />
        </div>
        @if (isPremiumUnlocked()) {
          <div class="card chart-card">
            <app-projection-chart [result]="pensionResult()" />
          </div>
        } @else {
          <div class="card chart-card locked-chart-card">
            <div class="locked-chart-wrapper">
              <div class="locked-chart-blur">
                <app-projection-chart [result]="pensionResult()" />
              </div>
              <div class="locked-chart-overlay">
                <div class="locked-chart-content">
                  <span class="locked-icon">🔒</span>
                  <h4 class="locked-title">30-Jahre-Inflationsprognose</h4>
                  <p class="locked-description">
                    Sehen Sie, wie Inflation Ihre Rente über 30 Jahre entwertet — im Detail-Report enthalten.
                  </p>
                  <button class="locked-cta" (click)="purchaseReport()">
                    Kostenlos freischalten →
                  </button>
                </div>
              </div>
            </div>
          </div>
        }
      </div>

      <!-- Premium Features (unlocked after PDF download) -->
      @if (isPremiumUnlocked()) {
        <div class="premium-features-section">
          <div class="premium-features-header animate-fade-in-up">
            <span class="premium-badge-inline">✅ Premium freigeschaltet</span>
          </div>

          <div class="premium-feature-card animate-fade-in-up" style="animation-delay: 0.1s">
            <app-scenario-comparison
              [pensionInput]="currentInput()"
              [baselineResult]="pensionResult()"
            />
          </div>

          <div class="premium-feature-card animate-fade-in-up" style="animation-delay: 0.2s">
            <app-what-if-analysis
              [pensionInput]="currentInput()"
              [baselineResult]="pensionResult()"
            />
          </div>

          <div class="premium-feature-card animate-fade-in-up" style="animation-delay: 0.3s">
            <app-optimization-strategies
              [pensionInput]="currentInput()"
              [baselineResult]="pensionResult()"
            />
          </div>
        </div>
      }

      <!-- Premium Teasers & Pricing (only when not unlocked) -->
      @if (!isPremiumUnlocked()) {
        <div class="premium-teaser-section animate-fade-in-up" style="animation-delay: 0.4s">
          <app-premium-teaser (unlock)="onTierSelected($event)" />
        </div>

        <app-pricing-tier (tierSelected)="onTierSelected($event)" />
      }
    </main>

    <!-- Footer -->
    <footer class="footer">
      <div class="container footer-content">
        <div class="footer-disclaimer">
          <h4>⚖️ Haftungsausschluss</h4>
          <p>
            RentenCheck+ ist ein Informationstool und ersetzt keine individuelle Steuer- oder
            Finanzberatung. Die Berechnungen basieren auf den aktuellen gesetzlichen Grundlagen
            (<a href="https://www.gesetze-im-internet.de/estg/__32a.html" target="_blank" rel="noopener">§32a EStG</a>, KVdR-Sätze 2026) und können von Ihrer tatsächlichen steuerlichen
            Situation abweichen. Keine Gewähr für die Richtigkeit der Berechnungen.
          </p>
        </div>
        <div class="footer-sources">
          <h4>📚 Datenquellen</h4>
          <ul>
            <li>Einkommensteuer: <a href="https://www.gesetze-im-internet.de/estg/__32a.html" target="_blank" rel="noopener">§32a EStG 2025/2026</a></li>
            <li>KVdR-Beitragssätze: <a href="https://www.gkv-spitzenverband.de" target="_blank" rel="noopener">GKV-Spitzenverband</a></li>
            <li>Besteuerungsanteil: <a href="https://www.gesetze-im-internet.de/estg/__22.html" target="_blank" rel="noopener">§22 Nr. 1 EStG</a> (Wachstumschancengesetz)</li>
            <li>Pflegeversicherung: <a href="https://www.gesetze-im-internet.de/sgb_11/__55.html" target="_blank" rel="noopener">§55 SGB XI</a></li>
          </ul>
        </div>
        <div class="footer-bottom">
          <div class="footer-legal-links">
            <a routerLink="/impressum">Impressum</a>
            <span class="footer-dot">·</span>
            <a routerLink="/datenschutz">Datenschutz</a>
            <span class="footer-dot">·</span>
            <a routerLink="/haftungsausschluss">Haftungsausschluss</a>
          </div>
          <p>© {{ currentYear }} RentenCheck+ — Alle Rechte vorbehalten</p>
        </div>
      </div>
    </footer>
  `,
  styles: [`
    /* ==========================================
       Navbar
       ========================================== */
    .calc-navbar {
      background: var(--color-primary);
      padding: 0.75rem 0;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    .nav-inner {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .nav-brand {
      font-size: 1.3rem;
      font-weight: 900;
      color: white;
      text-decoration: none;
      letter-spacing: -0.02em;
    }

    .brand-plus {
      color: #e94560;
    }

    .nav-badges {
      display: flex;
      gap: 0.75rem;
    }

    .nav-badge {
      font-size: 0.78rem;
      color: rgba(255, 255, 255, 0.6);
      font-weight: 500;
    }

    .nav-badge a, .hero-badge a {
      color: inherit;
      text-decoration: underline;
      text-underline-offset: 2px;
    }

    .nav-badge a:hover, .hero-badge a:hover {
      color: white;
    }

    /* ==========================================
       Hero Section
       ========================================== */
    .hero {
      padding: 4rem 0 3.5rem;
      text-align: center;
      color: white;
    }

    .hero-content {
      max-width: 700px;
    }

    .hero-title {
      font-size: 2.75rem;
      font-weight: 900;
      line-height: 1.15;
      margin-bottom: 1.25rem;
      letter-spacing: -0.02em;
    }

    .hero-highlight {
      background: linear-gradient(135deg, #e94560, #f39c12);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .hero-subtitle {
      font-size: 1.15rem;
      line-height: 1.7;
      color: rgba(255, 255, 255, 0.85);
      max-width: 550px;
      margin: 0 auto 1.75rem;
      font-weight: 400;
    }

    .hero-cta {
      display: flex;
      justify-content: center;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .hero-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.3rem;
      padding: 0.45rem 1rem;
      background: rgba(255, 255, 255, 0.12);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 20px;
      font-size: 0.85rem;
      font-weight: 500;
      color: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(8px);
    }

    .scroll-cta {
      display: inline-block;
      margin-top: 2rem;
      text-decoration: none;
    }

    .scroll-arrow {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 44px;
      height: 44px;
      border-radius: 50%;
      border: 2px solid rgba(255, 255, 255, 0.3);
      color: rgba(255, 255, 255, 0.8);
      font-size: 1.25rem;
      animation: bounceDown 2s ease-in-out infinite;
      transition: border-color 0.2s, color 0.2s;
    }

    .scroll-cta:hover .scroll-arrow {
      border-color: rgba(255, 255, 255, 0.6);
      color: white;
    }

    @keyframes bounceDown {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(6px); }
    }

    /* ==========================================
       Calculator Section
       ========================================== */
    .calculator-section {
      margin-top: -2rem;
      position: relative;
      z-index: 1;
      padding-bottom: 3rem;
    }

    .calculator-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.75rem;
      margin-bottom: 1.75rem;
    }

    .input-card {
      position: sticky;
      top: 1.5rem;
      align-self: start;
    }

    .result-card {
      min-height: 400px;
    }

    /* ==========================================
       PDF Download Section
       ========================================== */
    .pdf-download-section {
      margin-bottom: 1.75rem;
    }

    .pdf-download-btn {
      width: 100%;
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1.25rem 1.75rem;
      background: linear-gradient(135deg, #0f3460, #1a5276);
      border: 2px solid rgba(255, 255, 255, 0.1);
      border-radius: var(--radius-lg);
      color: white;
      cursor: pointer;
      transition: all 0.3s ease;
      text-align: left;
      animation: subtlePulse 3s ease-in-out infinite;
    }

    .pdf-download-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(15, 52, 96, 0.35);
      background: linear-gradient(135deg, #1a5276, #0f3460);
    }

    .pdf-download-btn:active {
      transform: translateY(0);
    }

    .pdf-download-btn:disabled {
      opacity: 0.75;
      cursor: wait;
      transform: none !important;
      animation: none;
    }

    .pdf-unlocked-btn {
      background: linear-gradient(135deg, #27ae60, #2ecc71) !important;
      animation: none !important;
    }

    .pdf-unlocked-btn:hover {
      background: linear-gradient(135deg, #2ecc71, #27ae60) !important;
      box-shadow: 0 8px 25px rgba(39, 174, 96, 0.35) !important;
    }

    .spinner-icon {
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .pdf-icon {
      font-size: 2rem;
      flex-shrink: 0;
    }

    .pdf-text {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
    }

    .pdf-text strong {
      font-size: 1rem;
      font-weight: 700;
    }

    .pdf-text small {
      font-size: 0.82rem;
      color: rgba(255, 255, 255, 0.65);
      font-weight: 400;
    }

    .pdf-arrow {
      font-size: 1.5rem;
      font-weight: 700;
      opacity: 0.6;
      flex-shrink: 0;
      animation: bounceDown 2s ease-in-out infinite;
    }

    .pdf-guarantee {
      font-size: 0.75rem;
      color: rgba(255, 255, 255, 0.5);
      font-weight: 500;
      margin-top: 0.15rem;
    }

    @keyframes subtlePulse {
      0%, 100% { box-shadow: 0 4px 15px rgba(15, 52, 96, 0.2); }
      50% { box-shadow: 0 4px 25px rgba(15, 52, 96, 0.4); }
    }

    /* ==========================================
       Urgency Banner
       ========================================== */
    .urgency-banner {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem 1.5rem;
      background: linear-gradient(135deg, #fffbeb, #fef3c7);
      border: 1px solid #fcd34d;
      border-left: 4px solid #f59e0b;
      border-radius: var(--radius-md);
      margin-bottom: 1.75rem;
    }

    .urgency-icon {
      font-size: 1.75rem;
      flex-shrink: 0;
    }

    .urgency-content {
      flex: 1;
      min-width: 0;
    }

    .urgency-headline {
      display: block;
      font-size: 0.92rem;
      font-weight: 700;
      color: #92400e;
      margin-bottom: 0.15rem;
    }

    .urgency-detail {
      font-size: 0.82rem;
      color: #a16207;
    }

    .urgency-cta {
      flex-shrink: 0;
      padding: 0.55rem 1.25rem;
      background: linear-gradient(135deg, #f59e0b, #d97706);
      color: white;
      border: none;
      border-radius: var(--radius-sm);
      font-size: 0.82rem;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s ease;
      white-space: nowrap;
    }

    .urgency-cta:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(245, 158, 11, 0.35);
    }

    /* ==========================================
       Report Preview Section
       ========================================== */
    .report-preview-section {
      padding: 2rem;
      background: linear-gradient(135deg, #f0f9ff, #e0f2fe);
      border: 1px solid #bae6fd;
      border-radius: var(--radius-lg);
      margin-bottom: 1.75rem;
    }

    .preview-title {
      font-size: 1.15rem;
      font-weight: 800;
      color: var(--color-primary);
      margin-bottom: 1.5rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .preview-icon { font-size: 1.3rem; }

    .preview-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1.25rem;
      margin-bottom: 1.5rem;
    }

    .preview-card {
      background: white;
      border-radius: var(--radius-md);
      padding: 1.25rem;
      border: 1px solid #e2e8f0;
      text-align: center;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }

    .preview-card:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-sm);
    }

    .preview-card-icon {
      font-size: 2rem;
      display: block;
      margin-bottom: 0.75rem;
    }

    .preview-card h4 {
      font-size: 0.92rem;
      font-weight: 700;
      color: var(--color-primary);
      margin-bottom: 0.4rem;
    }

    .preview-card p {
      font-size: 0.8rem;
      color: var(--color-text-light);
      line-height: 1.55;
    }

    .preview-cta-wrap {
      text-align: center;
    }

    .preview-cta {
      padding: 0.75rem 2rem;
      background: linear-gradient(135deg, #0f3460, #1a5276);
      color: white;
      border: none;
      border-radius: var(--radius-md);
      font-size: 0.95rem;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .preview-cta:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(15, 52, 96, 0.35);
    }

    .preview-cta:disabled {
      opacity: 0.7;
      cursor: wait;
      transform: none;
    }

    /* ==========================================
       Charts Section
       ========================================== */
    .charts-section {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.75rem;
      margin-bottom: 1.75rem;
    }

    .chart-card {
      overflow: hidden;
    }

    /* Locked Projection Chart */
    .locked-chart-card {
      padding: 0 !important;
    }

    .locked-chart-wrapper {
      position: relative;
      overflow: hidden;
      border-radius: var(--radius-lg);
    }

    .locked-chart-blur {
      filter: blur(6px);
      opacity: 0.5;
      pointer-events: none;
      user-select: none;
      padding: 1.5rem;
    }

    .locked-chart-overlay {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(255, 255, 255, 0.4);
      backdrop-filter: blur(2px);
      z-index: 2;
    }

    .locked-chart-content {
      text-align: center;
      max-width: 320px;
      padding: 2rem 1.5rem;
      background: rgba(255, 255, 255, 0.95);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-lg);
      border: 1px solid var(--color-border);
    }

    .locked-icon {
      font-size: 2.5rem;
      display: block;
      margin-bottom: 0.75rem;
    }

    .locked-title {
      font-size: 1.1rem;
      font-weight: 700;
      color: var(--color-primary);
      margin-bottom: 0.5rem;
    }

    .locked-description {
      font-size: 0.85rem;
      color: var(--color-text-light);
      line-height: 1.6;
      margin-bottom: 1.25rem;
    }

    .locked-cta {
      display: inline-block;
      padding: 0.65rem 1.5rem;
      background: linear-gradient(135deg, #0f3460, #1a5276);
      color: white;
      border: none;
      border-radius: var(--radius-md);
      font-size: 0.9rem;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .locked-cta:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(15, 52, 96, 0.3);
    }

    .locked-cta:disabled {
      opacity: 0.7;
      cursor: wait;
      transform: none;
    }

    /* ==========================================
       Action Tips Section
       ========================================== */
    .action-tips-section {
      margin-bottom: 1.75rem;
    }

    /* ==========================================
       ETF Explainer Section
       ========================================== */
    .etf-explainer-section {
      margin-bottom: 1.75rem;
    }

    /* ==========================================
       Premium Teaser Section
       ========================================== */
    .premium-teaser-section {
      margin-bottom: 1.75rem;
    }

    /* ==========================================
       Premium Features Section (unlocked)
       ========================================== */
    .premium-features-section {
      margin-bottom: 1.75rem;
    }

    .premium-features-header {
      text-align: center;
      margin-bottom: 1.25rem;
    }

    .premium-badge-inline {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.5rem 1.25rem;
      background: linear-gradient(135deg, rgba(39, 174, 96, 0.08), rgba(46, 204, 113, 0.05));
      border: 1px solid rgba(39, 174, 96, 0.25);
      border-radius: 20px;
      font-size: 0.88rem;
      font-weight: 700;
      color: var(--color-success);
    }

    .premium-feature-card {
      margin-bottom: 1.75rem;
    }

    /* ==========================================
       Footer
       ========================================== */
    .footer {
      background: var(--color-primary);
      color: rgba(255, 255, 255, 0.85);
      padding: 3rem 0 1.5rem;
      margin-top: 3rem;
    }

    .footer-content {
      max-width: 800px;
    }

    .footer-disclaimer, .footer-sources {
      margin-bottom: 2rem;
    }

    .footer-disclaimer h4, .footer-sources h4 {
      font-size: 1rem;
      font-weight: 700;
      color: white;
      margin-bottom: 0.75rem;
    }

    .footer-disclaimer p {
      font-size: 0.85rem;
      line-height: 1.8;
      color: rgba(255, 255, 255, 0.72);
    }

    .footer-sources ul {
      list-style: none;
      padding: 0;
    }

    .footer-sources li {
      font-size: 0.85rem;
      padding: 0.3rem 0;
      color: rgba(255, 255, 255, 0.68);
    }

    .footer-sources li::before {
      content: '›';
      margin-right: 0.5rem;
      color: var(--color-danger);
      font-weight: 700;
    }

    .footer-sources a, .footer-disclaimer a {
      color: rgba(255, 255, 255, 0.85);
      text-decoration: underline;
      text-underline-offset: 2px;
      transition: color 0.2s;
    }

    .footer-sources a:hover, .footer-disclaimer a:hover {
      color: white;
    }

    .footer-bottom {
      border-top: 1px solid rgba(255, 255, 255, 0.12);
      padding-top: 1.25rem;
      text-align: center;
    }

    .footer-legal-links {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.75rem;
      flex-wrap: wrap;
    }

    .footer-legal-links a {
      font-size: 0.8rem;
      color: rgba(255, 255, 255, 0.5);
      text-decoration: none;
      transition: color 0.2s;
    }

    .footer-legal-links a:hover {
      color: rgba(255, 255, 255, 0.85);
    }

    .footer-dot {
      color: rgba(255, 255, 255, 0.25);
      font-size: 0.8rem;
    }

    .footer-bottom p {
      font-size: 0.8rem;
      color: rgba(255, 255, 255, 0.45);
    }

    /* ==========================================
       Responsive
       ========================================== */
    @media (max-width: 1024px) {
      .calculator-grid {
        grid-template-columns: 1fr;
      }

      .input-card {
        position: static;
      }

      .charts-section {
        grid-template-columns: 1fr;
      }

      .preview-grid {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 768px) {
      .hero {
        padding: 3rem 0 2.5rem;
      }

      .hero-title {
        font-size: 2rem;
      }

      .hero-subtitle {
        font-size: 1rem;
      }

      .hero-cta {
        flex-direction: column;
        align-items: center;
        gap: 0.5rem;
      }

      .calculator-section {
        margin-top: -1.5rem;
      }

      .nav-badges {
        display: none;
      }

      .urgency-banner {
        flex-direction: column;
        text-align: center;
        gap: 0.75rem;
      }

      .urgency-cta {
        width: 100%;
      }

      .preview-grid {
        grid-template-columns: 1fr;
      }
    }
  `],
})
export class CalculatorPageComponent {
  private readonly calculatorService = inject(PensionCalculatorService);
  private readonly pdfService = inject(PdfReportService);
  private readonly paymentService = inject(StripePaymentService);
  private readonly savingsService = inject(SavingsCalculatorService);
  private readonly premiumService = inject(PremiumUnlockService);
  private readonly inputPanel = viewChild(InputPanelComponent);

  readonly currentYear = new Date().getFullYear();
  readonly isProcessingPayment = signal(false);
  readonly isPremiumUnlocked = this.premiumService.isUnlocked;

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
  }

  /**
   * Direct download — generates the PDF client-side.
   */
  downloadReport(): void {
    const panel = this.inputPanel();
    const input = panel ? panel.pensionInput() : DEFAULT_PENSION_INPUT;
    const result = this.pensionResult();
    this.pdfService.generateReport(input, result);
  }
}

